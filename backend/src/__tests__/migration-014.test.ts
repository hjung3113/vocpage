/**
 * migration 014 — tags master ops columns (W3-1, OQ-4 결정 2026-05-09)
 *
 * Spec: requirements.md §15.3, feature-voc.md §9.4.6, plans/wave-3-admin.md W3-1.
 *
 * Adds three columns supporting Tag Master operational gaps:
 *   - tags.is_external          (boolean NOT NULL DEFAULT false) — Admin-only 외부잠금 토글
 *   - tags.merged_into_id       (uuid NULL, FK → tags.id ON DELETE SET NULL) — 병합 흔적
 *   - tag_rules.suspended_until (timestamptz NULL) — 규칙 일시중지
 *
 * This test verifies up/down round-trip on a scratch pg-mem DB.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

// Only the prerequisite migration 014 depends on (tags + tag_rules tables).
// pg-mem rejects the trigger DDL in 003_vocs.sql, so we substitute a minimal
// stub for the FK target `vocs(id)` referenced by `voc_tags`.
const VOCS_STUB = `CREATE TABLE vocs (id uuid PRIMARY KEY);`;
const BASE_FILES = ['004_tags.sql'];

function stripUnsupported(sql: string): string {
  return (
    sql
      .split('\n')
      .filter((line) => !/CREATE EXTENSION/i.test(line))
      .join('\n')
      // pg-mem doesn't support pgvector — drop the embedding column line.
      .replace(/,?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
      .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
  );
}

function readMigration(file: string): { up: string; down: string } {
  const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const upMatch = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  const downMatch = raw.match(/-- Down Migration([\s\S]*)$/i);
  if (!upMatch || !downMatch) {
    throw new Error(`Migration ${file} missing Up/Down markers`);
  }
  return {
    up: stripUnsupported(upMatch[1]),
    down: stripUnsupported(downMatch[1]),
  };
}

async function bootDb(): Promise<IMemoryDb> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  db.public.query(VOCS_STUB);
  for (const file of BASE_FILES) {
    const sql = stripUnsupported(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8'));
    if (!sql.trim() || /^(?:\s|--[^\n]*)*$/.test(sql)) continue;
    db.public.query(sql);
  }
  return db;
}

interface ColInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

function describeColumns(db: IMemoryDb, table: string): ColInfo[] {
  const rs = db.public.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = '${table}'`,
  );
  return rs.rows as ColInfo[];
}

describe('migration 014 — tags master ops columns', () => {
  test('up.sql adds tags.is_external, tags.merged_into_id, tag_rules.suspended_until', async () => {
    const db = await bootDb();
    const { up } = readMigration('014_tag_master_ops.sql');
    await db.public.query(up);

    const tagsCols = await describeColumns(db, 'tags');
    const isExternal = tagsCols.find((c) => c.column_name === 'is_external');
    expect(isExternal).toBeDefined();
    expect(isExternal!.is_nullable).toBe('NO');
    expect(isExternal!.data_type).toMatch(/bool/i);

    const mergedInto = tagsCols.find((c) => c.column_name === 'merged_into_id');
    expect(mergedInto).toBeDefined();
    expect(mergedInto!.data_type).toMatch(/uuid/i);
    // Nullability is verified behaviourally below by inserting a tag without
    // merged_into_id (pg-mem's information_schema reports differs from real
    // Postgres on explicit NULL columns).
    db.public.query(`
      INSERT INTO tags (id, name, slug, kind) VALUES
        ('00000000-0000-0000-0000-000000000099', 'nullcheck', 'nullcheck', 'general');
    `);
    const probe = db.public.query(
      `SELECT merged_into_id FROM tags WHERE id = '00000000-0000-0000-0000-000000000099'`,
    );
    expect(probe.rows[0].merged_into_id).toBeNull();

    const ruleCols = describeColumns(db, 'tag_rules');
    const suspended = ruleCols.find((c) => c.column_name === 'suspended_until');
    expect(suspended).toBeDefined();
    expect(suspended!.data_type).toMatch(/timestamp/i);
    // Behavioural nullability check (pg-mem information_schema quirk).
    db.public.query(`
      INSERT INTO tags (id, name, slug, kind) VALUES
        ('00000000-0000-0000-0000-0000000000aa', 'r', 'r', 'general');
      INSERT INTO tag_rules (id, name, pattern, kind, tag_id) VALUES
        ('00000000-0000-0000-0000-0000000000ab', 'rule', '/x/', 'general',
         '00000000-0000-0000-0000-0000000000aa');
    `);
    const ruleProbe = db.public.query(
      `SELECT suspended_until FROM tag_rules WHERE id = '00000000-0000-0000-0000-0000000000ab'`,
    );
    expect(ruleProbe.rows[0].suspended_until).toBeNull();
  });

  test('merged_into_id FK enforces SET NULL on referenced tag delete', async () => {
    const db = await bootDb();
    const { up } = readMigration('014_tag_master_ops.sql');
    await db.public.query(up);

    await db.public.query(`
      INSERT INTO tags (id, name, slug, kind) VALUES
        ('11111111-1111-1111-1111-111111111111', 'src', 'src', 'general'),
        ('22222222-2222-2222-2222-222222222222', 'tgt', 'tgt', 'general');
    `);
    await db.public.query(`
      UPDATE tags SET merged_into_id = '22222222-2222-2222-2222-222222222222'
      WHERE id = '11111111-1111-1111-1111-111111111111';
    `);
    // Delete target — source should have merged_into_id set to NULL.
    await db.public.query(`DELETE FROM tags WHERE id = '22222222-2222-2222-2222-222222222222'`);
    const rs = db.public.query(
      `SELECT merged_into_id FROM tags WHERE id = '11111111-1111-1111-1111-111111111111'`,
    );
    expect(rs.rows[0].merged_into_id).toBeNull();
  });

  test('is_external defaults to false for new rows', async () => {
    // pg-mem does not retroactively backfill DEFAULT on ALTER ADD COLUMN
    // (real Postgres ≥11 does — verified manually). Test forward-insert path.
    const db = await bootDb();
    const { up } = readMigration('014_tag_master_ops.sql');
    await db.public.query(up);
    await db.public.query(`
      INSERT INTO tags (id, name, slug, kind) VALUES
        ('33333333-3333-3333-3333-333333333333', 'new', 'new', 'general');
    `);
    const rs = db.public.query(
      `SELECT is_external FROM tags WHERE id = '33333333-3333-3333-3333-333333333333'`,
    );
    expect(rs.rows[0].is_external).toBe(false);
  });

  test('down.sql removes all three columns', async () => {
    const db = await bootDb();
    const { up, down } = readMigration('014_tag_master_ops.sql');
    await db.public.query(up);
    await db.public.query(down);

    const tagsCols = await describeColumns(db, 'tags');
    expect(tagsCols.find((c) => c.column_name === 'is_external')).toBeUndefined();
    expect(tagsCols.find((c) => c.column_name === 'merged_into_id')).toBeUndefined();

    const ruleCols = await describeColumns(db, 'tag_rules');
    expect(ruleCols.find((c) => c.column_name === 'suspended_until')).toBeUndefined();
  });
});
