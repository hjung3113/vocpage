/**
 * Migration 015 — trash audit (vocs.deleted_by + voc_restore_log).
 *
 * Spec sources (all authoritative):
 * - docs/specs/requires/requirements.md §15.4 (Trash D23 / migration 015 lock)
 * - docs/specs/requires/feature-voc.md §9.4.7 (휴지통 신설 / restore semantics)
 * - docs/adr/0005-trash-restore-policy.md §5 Audit (table column lock)
 *
 * TDD scope:
 *   1. Up — vocs.deleted_by exists as nullable uuid FK to users.id.
 *   2. Up — voc_restore_log table exists with the locked columns + CHECK on action.
 *   3. Up — voc_restore_log indexes on (actor_id) and (action) exist.
 *   4. Down — round-trip removes the table and the column.
 *
 * Self-contained pg-mem boot (does not depend on helpers/db.ts) so the test is
 * stable even if other test harnesses change loading order.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { newDb, DataType, IMemoryDb } from 'pg-mem';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

function stripUnsupported(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.match(/CREATE EXTENSION/i))
    .join('\n')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
}

// Minimal stub schema covering only the FK targets that 015 depends on:
//   - users.id (for vocs.deleted_by + voc_restore_log.actor_id / before_deleted_by)
//   - vocs.id  (for voc_restore_log.voc_id)
// Other columns are intentionally omitted — 015 only cares about FK targets.
// Mirrors 003_vocs.sql / 002_core_tables.sql shape minus pl/pgsql triggers,
// pgvector, and dependencies that pg-mem cannot parse.
const STUB_SCHEMA = `
  CREATE TABLE users (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id   text UNIQUE NOT NULL,
    name    text NOT NULL,
    role    text NOT NULL DEFAULT 'user'
  );
  CREATE TABLE vocs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    deleted_at  timestamptz
  );
`;

function splitUpDown(sql: string): { up: string; down: string } {
  const upMatch = sql.match(/-- Up Migration([\s\S]*?)-- Down Migration/);
  const downMatch = sql.match(/-- Down Migration([\s\S]*)$/);
  if (!upMatch || !downMatch) {
    throw new Error('Migration 015 must have "-- Up Migration" and "-- Down Migration" markers');
  }
  return { up: upMatch[1], down: downMatch[1] };
}

async function bootScratchDb(): Promise<IMemoryDb> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  await db.public.query(STUB_SCHEMA);
  return db;
}

describe('migration 015 — trash audit', () => {
  const m015Path = path.join(MIGRATIONS_DIR, '015_trash_audit.sql');

  it('migration file exists', () => {
    expect(fs.existsSync(m015Path)).toBe(true);
  });

  it('up adds vocs.deleted_by + voc_restore_log; down removes them; FK + CHECK enforced', async () => {
    const raw = fs.readFileSync(m015Path, 'utf-8');
    const { up, down } = splitUpDown(raw);
    const db = await bootScratchDb();

    // Pre-condition: column + table absent.
    expect(
      db.public.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name='vocs' AND column_name='deleted_by'`,
      ).rows.length,
    ).toBe(0);
    expect(
      db.public.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name='voc_restore_log'`,
      ).rows.length,
    ).toBe(0);

    // Up.
    await db.public.query(stripUnsupported(up));

    // 1. vocs.deleted_by — nullable uuid.
    const colRow = db.public.query(
      `SELECT data_type, is_nullable FROM information_schema.columns
       WHERE table_name='vocs' AND column_name='deleted_by'`,
    ).rows;
    expect(colRow.length).toBe(1);
    expect(String(colRow[0].data_type).toLowerCase()).toContain('uuid');
    // Behavioral nullability check — insert a vocs row without deleted_by
    // (omitted column → NULL). This actually exercises the NULL constraint
    // unlike checking information_schema.is_nullable (pg-mem inconsistent).
    await db.public.query(`
      INSERT INTO vocs (id, title) VALUES
        ('77777777-7777-7777-7777-777777777777','no-deleter');
    `);
    const nullableRow = db.public.query(
      `SELECT deleted_by FROM vocs WHERE id = '77777777-7777-7777-7777-777777777777'`,
    ).rows;
    expect(nullableRow.length).toBe(1);
    expect(nullableRow[0].deleted_by).toBeNull();

    // Indexes (ADR 0005 §"Consequences" — actor_id / action machine-friendly).
    // pg-mem does not expose pg_indexes; use the internal getTable API.
    const restoreLogTable = db.public.getTable('voc_restore_log');
    const idxList = restoreLogTable.listIndices();
    // pg-mem's index objects expose `.name` (and sometimes `indexName`).
    const indexNames = new Set(
      idxList
        .map((i: Record<string, unknown>) => (i.indexName ?? i.name) as string | undefined)
        .filter(Boolean),
    );
    // Sanity: at least 3 user-defined indexes from Up. (PK index may also appear.)
    expect(indexNames.has('idx_voc_restore_log_actor')).toBe(true);
    expect(indexNames.has('idx_voc_restore_log_action')).toBe(true);
    expect(indexNames.has('idx_voc_restore_log_voc')).toBe(true);

    // 2. voc_restore_log columns from ADR 0005 §5.
    const cols = db.public.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='voc_restore_log'`,
    ).rows;
    const names = new Set(cols.map((r: Record<string, unknown>) => r.column_name as string));
    for (const c of [
      'id',
      'voc_id',
      'action',
      'actor_id',
      'before_deleted_at',
      'before_deleted_by',
      'created_at',
    ]) {
      expect(names.has(c)).toBe(true);
    }

    // 3. CHECK constraint on action (insert real users + voc to exercise FKs).
    await db.public.query(`
      INSERT INTO users (id, ad_id, name, role) VALUES
        ('11111111-1111-1111-1111-111111111111','u1','Actor','admin'),
        ('22222222-2222-2222-2222-222222222222','u2','Deleter','admin');
      INSERT INTO vocs (id, title) VALUES
        ('66666666-6666-6666-6666-666666666666','t');
    `);

    // 2b. NOT NULL contract — voc_id / action / actor_id / created_at must
    // reject NULL (ADR 0005 §5). Behavioral test (pg-mem information_schema
    // reports nullability inconsistently for ALTER ADD COLUMN paths).
    expect(() =>
      db.public.query(
        `INSERT INTO voc_restore_log (action, actor_id) VALUES ('restore','11111111-1111-1111-1111-111111111111')`,
      ),
    ).toThrow(); // missing voc_id
    expect(() =>
      db.public.query(
        `INSERT INTO voc_restore_log (voc_id, actor_id) VALUES ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111')`,
      ),
    ).toThrow(); // missing action
    expect(() =>
      db.public.query(
        `INSERT INTO voc_restore_log (voc_id, action) VALUES ('66666666-6666-6666-6666-666666666666','restore')`,
      ),
    ).toThrow(); // missing actor_id

    // 2c. FK enforcement — bogus voc_id and bogus actor_id rejected.
    expect(() =>
      db.public.query(
        `INSERT INTO voc_restore_log (voc_id, action, actor_id)
         VALUES ('00000000-0000-0000-0000-000000000000','restore','11111111-1111-1111-1111-111111111111')`,
      ),
    ).toThrow();
    expect(() =>
      db.public.query(
        `INSERT INTO voc_restore_log (voc_id, action, actor_id)
         VALUES ('66666666-6666-6666-6666-666666666666','restore','00000000-0000-0000-0000-000000000000')`,
      ),
    ).toThrow();

    // 'restore' is allowed by CHECK.
    await db.public.query(`
      INSERT INTO voc_restore_log (voc_id, action, actor_id, before_deleted_at, before_deleted_by)
      VALUES ('66666666-6666-6666-6666-666666666666','restore',
              '11111111-1111-1111-1111-111111111111', now(),
              '22222222-2222-2222-2222-222222222222');
    `);

    // 'hard_delete' is allowed by CHECK.
    await db.public.query(`
      INSERT INTO voc_restore_log (voc_id, action, actor_id)
      VALUES ('66666666-6666-6666-6666-666666666666','hard_delete',
              '11111111-1111-1111-1111-111111111111');
    `);

    // 2d. FK deletion semantics — referenced rows must be protected while
    // audit rows reference them (ADR 0005 §5: "RESTRICT vocs hard delete 시
    // audit 보호"; actor_id / before_deleted_by preserve attribution).
    expect(() =>
      db.public.query(`DELETE FROM vocs WHERE id = '66666666-6666-6666-6666-666666666666'`),
    ).toThrow();
    expect(() =>
      db.public.query(`DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111111'`),
    ).toThrow();
    expect(() =>
      db.public.query(`DELETE FROM users WHERE id = '22222222-2222-2222-2222-222222222222'`),
    ).toThrow();

    // PK + defaults: id auto-generated, created_at auto-now, before_* nullable.
    const rows = db.public.query(
      `SELECT id, created_at, before_deleted_at, before_deleted_by
       FROM voc_restore_log WHERE action='hard_delete'`,
    ).rows;
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBeTruthy(); // PK populated by DEFAULT gen_random_uuid()
    expect(rows[0].created_at).toBeTruthy(); // DEFAULT now()
    expect(rows[0].before_deleted_at).toBeNull(); // nullable by ADR §5
    expect(rows[0].before_deleted_by).toBeNull();

    // bogus action rejected.
    expect(() =>
      db.public.query(`
        INSERT INTO voc_restore_log (voc_id, action, actor_id)
        VALUES ('66666666-6666-6666-6666-666666666666','bogus',
                '11111111-1111-1111-1111-111111111111');
      `),
    ).toThrow();

    // Down.
    await db.public.query(stripUnsupported(down));

    expect(
      db.public.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name='vocs' AND column_name='deleted_by'`,
      ).rows.length,
    ).toBe(0);
    expect(
      db.public.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name='voc_restore_log'`,
      ).rows.length,
    ).toBe(0);
    // Down SQL must explicitly DROP each named index from Up (pg-mem cannot
    // round-trip DROP/CREATE TABLE because PK indices linger; instead lock
    // the Down statement set textually so the contract is regression-safe).
    expect(down).toMatch(/DROP INDEX IF EXISTS idx_voc_restore_log_actor/);
    expect(down).toMatch(/DROP INDEX IF EXISTS idx_voc_restore_log_action/);
    expect(down).toMatch(/DROP INDEX IF EXISTS idx_voc_restore_log_voc/);
    expect(down).toMatch(/DROP TABLE IF EXISTS voc_restore_log/);
    expect(down).toMatch(/ALTER TABLE vocs DROP COLUMN IF EXISTS deleted_by/);
  });
});
