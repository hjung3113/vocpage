/**
 * Wave 3 Phase A — W3-9: migration 017 (user_role_log).
 * Spec: docs/specs/requires/requirements.md §4 (`user_role_log`),
 *       docs/specs/plans/wave-3-admin.md §6.2 W3-9 + §OQ-3 (Option A).
 *
 * TDD checklist (RED → GREEN, schema-only via pg-mem):
 * 1. up.sql creates `user_role_log` with required columns + types.
 * 2. NOT NULL on `user_id`, `changed_by`, `created_at`, `id` (audit integrity).
 * 3. FK: `user_id` and `changed_by` both reference `users(id)` ON DELETE RESTRICT
 *    (audit-protect — never lose subject or actor).
 * 4. Composite index on (user_id, created_at DESC).
 * 5. down.sql drops both table and index cleanly (round-trip).
 *
 * Note: we stub a minimal `users(id)` table rather than running 002_core_tables.sql,
 * because pg-mem cannot parse the PL/pgSQL trigger function declared there.
 * Migration 017 is a leaf table that only depends on users(id).
 */
import { newDb, DataType } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');
const FILE_017 = path.join(MIGRATIONS_DIR, '017_user_role_log.sql');

function stripUnsupported(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.match(/CREATE EXTENSION/i))
    .join('\n')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
}

function splitUpDown(sql: string): { up: string; down: string } {
  const upMarker = /--\s*Up Migration/i;
  const downMarker = /--\s*Down Migration/i;
  const upIdx = sql.search(upMarker);
  const downIdx = sql.search(downMarker);
  if (upIdx === -1 || downIdx === -1 || downIdx < upIdx) {
    throw new Error(
      'migration 017 must contain "-- Up Migration" and "-- Down Migration" markers',
    );
  }
  return {
    up: sql.slice(upIdx, downIdx),
    down: sql.slice(downIdx),
  };
}

async function buildDb() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });

  // Minimal users table (matches 002_core_tables.sql shape for the columns 017 cares about).
  await db.public.query(`
    CREATE TABLE users (
      id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      ad_username   text        NOT NULL UNIQUE,
      display_name  text        NOT NULL,
      email         text        NOT NULL UNIQUE,
      role          text        NOT NULL DEFAULT 'user',
      is_active     boolean     NOT NULL DEFAULT true,
      created_at    timestamptz NOT NULL DEFAULT now()
    );
  `);
  return db;
}

describe('migration 017 — user_role_log', () => {
  it('file exists at backend/migrations/017_user_role_log.sql', () => {
    expect(fs.existsSync(FILE_017)).toBe(true);
  });

  describe('after up.sql', () => {
    it('creates user_role_log with the spec column set', async () => {
      const db = await buildDb();
      const { up } = splitUpDown(fs.readFileSync(FILE_017, 'utf-8'));
      await db.public.query(stripUnsupported(up));

      const cols = db.public.query(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_name = 'user_role_log'
          ORDER BY ordinal_position`,
      ).rows as Array<{ column_name: string }>;

      expect(cols.map((c) => c.column_name).sort()).toEqual(
        [
          'changed_by',
          'created_at',
          'id',
          'new_active',
          'new_role',
          'old_active',
          'old_role',
          'reason',
          'user_id',
        ].sort(),
      );
    });

    it('declares NOT NULL on audit-critical columns; reason is nullable (DDL contract)', () => {
      // pg-mem reports all columns NOT NULL regardless of DDL, so we assert against
      // the literal CREATE TABLE text. This is a compile-time contract check.
      const { up } = splitUpDown(fs.readFileSync(FILE_017, 'utf-8'));
      const create = up.match(/CREATE TABLE user_role_log\s*\(([\s\S]+?)\);/i);
      expect(create).not.toBeNull();
      const body = create![1];

      const colLine = (name: string): string => {
        const m = body.match(new RegExp(`^\\s*${name}\\b[^\n]*`, 'm'));
        if (!m) throw new Error(`column ${name} not found in DDL`);
        return m[0];
      };

      expect(colLine('id')).toMatch(/NOT NULL/);
      expect(colLine('user_id')).toMatch(/NOT NULL/);
      expect(colLine('changed_by')).toMatch(/NOT NULL/);
      expect(colLine('created_at')).toMatch(/NOT NULL/);
      // reason: must NOT have NOT NULL
      expect(colLine('reason')).not.toMatch(/NOT NULL/);
    });

    it('declares FK ON DELETE RESTRICT on user_id and changed_by (DDL contract)', () => {
      const { up } = splitUpDown(fs.readFileSync(FILE_017, 'utf-8'));
      // Both FKs must explicitly RESTRICT — no CASCADE / SET NULL allowed for audit.
      const userIdLine = up.match(/^\s*user_id\b[^\n]*/m)?.[0] ?? '';
      const changedByLine = up.match(/^\s*changed_by\b[^\n]*/m)?.[0] ?? '';
      expect(userIdLine).toMatch(/REFERENCES\s+users\s*\(\s*id\s*\)/i);
      expect(userIdLine).toMatch(/ON\s+DELETE\s+RESTRICT/i);
      expect(changedByLine).toMatch(/REFERENCES\s+users\s*\(\s*id\s*\)/i);
      expect(changedByLine).toMatch(/ON\s+DELETE\s+RESTRICT/i);
      expect(up).not.toMatch(/ON\s+DELETE\s+CASCADE/i);
      expect(up).not.toMatch(/ON\s+DELETE\s+SET\s+NULL/i);
    });

    it('declares index on (user_id, created_at DESC) (DDL contract)', () => {
      const { up } = splitUpDown(fs.readFileSync(FILE_017, 'utf-8'));
      // pg-mem does not expose pg_indexes; assert the CREATE INDEX text directly.
      const idx = up.match(
        /CREATE\s+INDEX[^;]+ON\s+user_role_log\s*\(([^)]+)\)/i,
      );
      expect(idx).not.toBeNull();
      const cols = idx![1];
      expect(cols).toMatch(/user_id/);
      expect(cols).toMatch(/created_at\s+DESC/i);
    });

    it('FKs on user_id + changed_by both RESTRICT user delete', async () => {
      const db = await buildDb();
      const { up } = splitUpDown(fs.readFileSync(FILE_017, 'utf-8'));
      await db.public.query(stripUnsupported(up));

      const u1 = crypto.randomUUID();
      const u2 = crypto.randomUUID();
      await db.public.query(
        `INSERT INTO users (id, ad_username, display_name, email)
         VALUES ('${u1}', 'subject', 'Subject', 's@x.io'),
                ('${u2}', 'actor',   'Actor',   'a@x.io')`,
      );
      await db.public.query(
        `INSERT INTO user_role_log (user_id, changed_by, old_role, new_role, old_active, new_active)
         VALUES ('${u1}', '${u2}', 'user', 'manager', true, true)`,
      );

      // RESTRICT must block deleting either subject or actor while a log row exists.
      expect(() => db.public.query(`DELETE FROM users WHERE id = '${u1}'`)).toThrow();
      expect(() => db.public.query(`DELETE FROM users WHERE id = '${u2}'`)).toThrow();
    });
  });

  describe('round-trip down.sql', () => {
    it('drops the table cleanly', async () => {
      const db = await buildDb();
      const raw = fs.readFileSync(FILE_017, 'utf-8');
      const { up, down } = splitUpDown(raw);
      await db.public.query(stripUnsupported(up));
      await db.public.query(stripUnsupported(down));

      const after = db.public.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = 'user_role_log'`,
      ).rows;
      expect(after).toHaveLength(0);
    });
  });
});
