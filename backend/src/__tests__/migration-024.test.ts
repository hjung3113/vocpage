/**
 * migration 024 — `tag_rules.created_by` + `keywords[]` + `match_mode`,
 * drops legacy `pattern` (Phase 1 / Plan 02, OQ-R1 Option C).
 *
 * Spec:
 *   - .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md (D-12)
 *   - .planning/phases/01-tag-rules-consolidation/01-RESEARCH.md (OQ-R1, OQ-R2, OQ-R5)
 *
 * Wave 0 (Plan 01) stages this test BEFORE the migration file exists.
 *
 * Behavior of this test file when `024_tag_rules_created_by.sql` does not yet
 * exist on disk: the suite registers `test.todo` placeholders, which Jest
 * counts as todos (not failures), so the BE 593+ baseline is preserved. Plan
 * 02 ships the migration; on next run the `fs.existsSync` branch flips and
 * the live tests execute end-to-end pg-mem round-trip.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');
const MIG_024_FILE = '024_tag_rules_created_by.sql';
const MIG_024_PATH = path.join(MIGRATIONS_DIR, MIG_024_FILE);

// FK target stubs — pg-mem rejects the trigger DDL in 003 and the FK to
// users(id) referenced by `tag_rules.created_by` (mig 024).
const VOCS_STUB = `CREATE TABLE vocs (id uuid PRIMARY KEY);`;
const USERS_STUB = `CREATE TABLE users (id uuid PRIMARY KEY);`;
const BASE_FILES = ['004_tags.sql', '014_tag_master_ops.sql'];

function stripUnsupported(sql: string): string {
  return (
    sql
      .split('\n')
      .filter((line) => !/CREATE EXTENSION/i.test(line))
      .join('\n')
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
  db.public.query(USERS_STUB);
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

const MIG_024_PRESENT = fs.existsSync(MIG_024_PATH);

describe('migration 024 — tag_rules consolidation (keywords[] + match_mode + created_by, drops pattern)', () => {
  if (!MIG_024_PRESENT) {
    test.todo(
      `up adds keywords text[] NOT NULL DEFAULT '{}' to tag_rules — pending ${MIG_024_FILE} (Plan 02)`,
    );
    test.todo(
      `up adds match_mode text NOT NULL DEFAULT 'keyword' to tag_rules — pending ${MIG_024_FILE} (Plan 02)`,
    );
    test.todo(
      `up drops pattern column from tag_rules — pending ${MIG_024_FILE} (Plan 02)`,
    );
    test.todo(
      `up adds created_by uuid NULL REFERENCES users(id) to tag_rules — pending ${MIG_024_FILE} (Plan 02)`,
    );
    test.todo(
      `down restores pattern shape and drops keywords/match_mode/created_by — pending ${MIG_024_FILE} (Plan 02)`,
    );
    return;
  }

  test('up adds keywords text[] NOT NULL DEFAULT \'{}\' to tag_rules', async () => {
    const db = await bootDb();
    const { up } = readMigration(MIG_024_FILE);
    db.public.query(up);

    const cols = describeColumns(db, 'tag_rules');
    const keywords = cols.find((c) => c.column_name === 'keywords');
    expect(keywords).toBeDefined();
    expect(keywords!.is_nullable).toBe('NO');
    expect(keywords!.data_type).toMatch(/array|text\[\]/i);
  });

  test('up adds match_mode text NOT NULL DEFAULT \'keyword\' to tag_rules', async () => {
    const db = await bootDb();
    const { up } = readMigration(MIG_024_FILE);
    db.public.query(up);

    const cols = describeColumns(db, 'tag_rules');
    const matchMode = cols.find((c) => c.column_name === 'match_mode');
    expect(matchMode).toBeDefined();
    expect(matchMode!.is_nullable).toBe('NO');
    expect(matchMode!.data_type).toMatch(/text|character/i);
  });

  test('up drops pattern column from tag_rules', async () => {
    const db = await bootDb();
    const { up } = readMigration(MIG_024_FILE);
    db.public.query(up);

    const cols = describeColumns(db, 'tag_rules');
    expect(cols.find((c) => c.column_name === 'pattern')).toBeUndefined();
  });

  test('up adds created_by uuid NULL REFERENCES users(id) to tag_rules', async () => {
    const db = await bootDb();
    const { up } = readMigration(MIG_024_FILE);
    db.public.query(up);

    const cols = describeColumns(db, 'tag_rules');
    const createdBy = cols.find((c) => c.column_name === 'created_by');
    expect(createdBy).toBeDefined();
    expect(createdBy!.is_nullable).toBe('YES');
    expect(createdBy!.data_type).toMatch(/uuid/i);
  });

  test('down restores pattern shape and drops keywords/match_mode/created_by', async () => {
    const db = await bootDb();
    const { up, down } = readMigration(MIG_024_FILE);
    db.public.query(up);
    db.public.query(down);

    const cols = describeColumns(db, 'tag_rules');
    expect(cols.find((c) => c.column_name === 'pattern')).toBeDefined();
    expect(cols.find((c) => c.column_name === 'keywords')).toBeUndefined();
    expect(cols.find((c) => c.column_name === 'match_mode')).toBeUndefined();
    expect(cols.find((c) => c.column_name === 'created_by')).toBeUndefined();
  });
});
