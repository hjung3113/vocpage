/**
 * migration 021 — FU-010: `user_role_log` (old_role / new_role) CHECK constraints
 *
 * Spec: docs/specs/plans/followup-bucket.md FU-010
 *
 * Defense-in-depth — BE validator (`backend/src/services/admin/user-admin.ts`)
 * is the primary gate; CHECK 는 DB-side invariant 보강. PR #250 의 codex 가
 * deferral 한 항목.
 *
 * Allowed role values: `user` / `dev` / `manager` / `admin`. NULL 허용
 * (sentinel — 시스템 자동 변경 등에서 old/new 가 비어 있을 수 있음).
 *
 * TDD (RED → GREEN, schema-only via pg-mem):
 * 1. Up: 유효 role (`user`/`dev`/`manager`/`admin`) insert 통과.
 * 2. Up: 무효 role (`superadmin` 등) insert 거부.
 * 3. Up: NULL old/new_role 허용.
 * 4. Down round-trip: 무효 role 다시 통과 → constraint 가 down 에서 제거됨.
 */
import { newDb, DataType, type IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');
const FILE_021 = path.join(MIGRATIONS_DIR, '021_user_role_log_check.sql');

function stripUnsupported(sql: string): string {
  return (
    sql
      .split('\n')
      .filter((line) => !/CREATE EXTENSION/i.test(line))
      .join('\n')
      .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
      // pg-mem cannot parse `ADD CONSTRAINT … NOT VALID`. The migration uses
      // NOT VALID for backfill safety in production (codex P1 on PR #281);
      // pg-mem-side we strip it so the constraint applies eagerly to both
      // existing and new rows. Eager-validate is the behavior under test.
      .replace(/\)\s*NOT\s+VALID\s*;/gi, ');')
  );
}

function splitUpDown(sql: string): { up: string; down: string } {
  const upIdx = sql.search(/--\s*Up Migration/i);
  const downIdx = sql.search(/--\s*Down Migration/i);
  if (upIdx === -1 || downIdx === -1 || downIdx < upIdx) {
    throw new Error('migration 021 must contain Up/Down markers');
  }
  return { up: sql.slice(upIdx, downIdx), down: sql.slice(downIdx) };
}

function buildDb(): IMemoryDb {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  // Minimal users + user_role_log shape (mirrors migrations 002 + 017
  // without plpgsql triggers, which pg-mem cannot run).
  db.public.query(`
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
  db.public.query(`
    CREATE TABLE user_role_log (
      id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id     uuid        NOT NULL REFERENCES users(id),
      changed_by  uuid        NOT NULL REFERENCES users(id),
      old_role    text,
      new_role    text,
      old_active  boolean,
      new_active  boolean,
      reason      text,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  `);
  return db;
}

const SUBJECT = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';

function seedUsers(db: IMemoryDb): void {
  db.public.query(
    `INSERT INTO users (id, ad_username, display_name, email, role, is_active)
     VALUES ('${SUBJECT}', 'subj', 'Subj', 'subj@x', 'user', true),
            ('${ACTOR}', 'actr', 'Actr', 'actr@x', 'admin', true)`,
  );
}

function lit(v: string | boolean | null): string {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${v.replace(/'/g, "''")}'`;
}

function insertLog(
  db: IMemoryDb,
  fields: { old_role?: string | null; new_role?: string | null; old_active?: boolean | null; new_active?: boolean | null },
): void {
  db.public.query(
    `INSERT INTO user_role_log
       (user_id, changed_by, old_role, new_role, old_active, new_active)
     VALUES ('${SUBJECT}', '${ACTOR}',
             ${lit(fields.old_role ?? null)},
             ${lit(fields.new_role ?? null)},
             ${lit(fields.old_active ?? null)},
             ${lit(fields.new_active ?? null)})`,
  );
}

describe('migration 021 — user_role_log role CHECK constraints (FU-010)', () => {
  it('file exists at backend/migrations/021_user_role_log_check.sql', () => {
    expect(fs.existsSync(FILE_021)).toBe(true);
  });

  describe('after up.sql', () => {
    it('accepts every valid role value (user / dev / manager / admin)', () => {
      const db = buildDb();
      seedUsers(db);
      const { up } = splitUpDown(fs.readFileSync(FILE_021, 'utf-8'));
      db.public.query(stripUnsupported(up));

      for (const role of ['user', 'dev', 'manager', 'admin']) {
        expect(() =>
          insertLog(db, { old_role: role, new_role: role, old_active: true, new_active: true }),
        ).not.toThrow();
      }
    });

    it('rejects an invalid old_role value (e.g. "superadmin")', () => {
      const db = buildDb();
      seedUsers(db);
      const { up } = splitUpDown(fs.readFileSync(FILE_021, 'utf-8'));
      db.public.query(stripUnsupported(up));

      // Match the constraint name so a future pg-mem parse-error doesn't
      // pass green (codex P3 on PR #281).
      expect(() =>
        insertLog(db, { old_role: 'superadmin', new_role: 'admin' }),
      ).toThrow(/user_role_log_old_role_check/);
    });

    it('rejects an invalid new_role value', () => {
      const db = buildDb();
      seedUsers(db);
      const { up } = splitUpDown(fs.readFileSync(FILE_021, 'utf-8'));
      db.public.query(stripUnsupported(up));

      expect(() =>
        insertLog(db, { old_role: 'user', new_role: 'root' }),
      ).toThrow(/user_role_log_new_role_check/);
    });

    it('still allows NULL old_role / new_role (sentinel for system-driven rows)', () => {
      const db = buildDb();
      seedUsers(db);
      const { up } = splitUpDown(fs.readFileSync(FILE_021, 'utf-8'));
      db.public.query(stripUnsupported(up));

      expect(() =>
        insertLog(db, { old_role: null, new_role: null, old_active: true, new_active: false }),
      ).not.toThrow();
    });
  });

  describe('round-trip down.sql', () => {
    it('drops the CHECK constraints — invalid roles insert again', () => {
      const db = buildDb();
      seedUsers(db);
      const { up, down } = splitUpDown(fs.readFileSync(FILE_021, 'utf-8'));
      db.public.query(stripUnsupported(up));
      // Sanity: invalid rejected post-up.
      expect(() => insertLog(db, { old_role: 'wat', new_role: 'admin' })).toThrow(
        /user_role_log_old_role_check/,
      );

      db.public.query(stripUnsupported(down));
      // After down: invalid value flows through.
      expect(() =>
        insertLog(db, { old_role: 'wat', new_role: 'admin' }),
      ).not.toThrow();
    });
  });
});
