/**
 * admin-trash.sql.test.ts — DB-backed integration suite for FU-015.
 *
 * `admin-trash.test.ts` mocks `repository/trash`, so SQL drift slips through.
 * `repository/__tests__/trash.sql.test.ts` (PR #263 hotfix) pins SQL column
 * shape via a recording fake pool but does not exercise the real schema.
 * This file boots pg-mem with migrations 002-006 (raw) + 014 + 015 (Up
 * sections) and drives `listTrashedVocs` / `getRestoreLog` /
 * `restoreVoc` end-to-end through the route → service → repository path.
 * Migration 001 (extensions) is stripped by pg-mem and not applied.
 *
 * Test isolation: `setPool()` mutates module-global state. Safe under Jest
 * `--runInBand` (configured in backend/package.json `test` script). Do not
 * use `test.concurrent` here.
 *
 * Spec sources:
 *   - docs/specs/plans/followup-bucket.md FU-015
 *   - docs/specs/requires/feature-voc.md §9.4.7 (휴지통 D23 restore semantics)
 *   - docs/adr/0005-trash-restore-policy.md
 */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { newDb, DataType, type IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Pool } from 'pg';

process.env.AUTH_MODE = 'mock';

import { adminTrashRouter } from '../admin-trash';
import { vocRouter } from '../voc';
import { errorHandler } from '../../middleware/errorHandler';
import { setPool, resetPool } from '../../db';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

const RAW_MIGRATIONS = [
  // 001_extensions stripped (CREATE EXTENSION not supported by pg-mem).
  '002_core_tables.sql',
  '003_vocs.sql',
  '004_tags.sql',
  '005_content.sql',
  '006_settings.sql',
];

const UP_MIGRATIONS = ['014_tag_master_ops.sql', '015_trash_audit.sql'];

function stripUnsupported(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !/CREATE EXTENSION/i.test(line))
    .join('\n')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
    .replace(/,\s*\n?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
    .replace(/\s*embedding\s+vector\(\d+\)[^\n,]*,?\n?/gi, '')
    .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*LANGUAGE\s+plpgsql\s*;/gi, '')
    .replace(/CREATE FUNCTION[\s\S]*?\$\$\s*LANGUAGE\s+plpgsql\s*;/gi, '')
    .replace(/CREATE TRIGGER[\s\S]*?EXECUTE FUNCTION\s+\w+\s*\(\s*\)\s*;/gi, '')
    // pg-mem evaluates `NULL IN (...)` as FALSE (Postgres returns UNKNOWN).
    // Rewrite `CHECK (col IN (...))` → `CHECK (col IS NULL OR col IN (...))`
    // so non-NULL enum values are still enforced (drift detection preserved
    // per codex P2 review on PR #280) while nullable columns accept NULL.
    .replace(
      /CHECK\s*\(\s*(\w+)\s+IN\s*\(([^()]*)\)\s*\)/gi,
      'CHECK ($1 IS NULL OR $1 IN ($2))',
    );
}

function readUp(file: string): string {
  const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const m = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  if (!m) throw new Error(`${file}: missing Up Migration marker`);
  return stripUnsupported(m[1]);
}

function readRaw(file: string): string {
  return stripUnsupported(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8'));
}

function bootDb(): { db: IMemoryDb; pool: Pool } {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  for (const file of RAW_MIGRATIONS) {
    const sql = readRaw(file).trim();
    if (!sql) continue;
    db.public.query(sql);
  }
  for (const file of UP_MIGRATIONS) {
    const sql = readUp(file).trim();
    if (!sql) continue;
    db.public.query(sql);
  }
  const { Pool: MemPool } = db.adapters.createPg();
  const pool = new MemPool() as unknown as Pool;
  return { db, pool };
}

const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000a01';
const SYSTEM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000b01';
const MENU_ID = 'cccccccc-cccc-4ccc-8ccc-000000000c01';
const VOC_TYPE_ID = 'dddddddd-dddd-4ddd-8ddd-000000000d01';
const ACTIVE_VOC = 'eeeeeeee-eeee-4eee-8eee-00000000a001';
const DELETED_VOC = 'eeeeeeee-eeee-4eee-8eee-00000000d001';

function seedFixtures(pool: Pool): void {
  pool.query(
    `INSERT INTO users (id, ad_username, display_name, email, role, is_active)
     VALUES ($1, 'admin1', 'Admin', 'admin@example.com', 'admin', true)`,
    [ADMIN_ID],
  );
  pool.query(
    `INSERT INTO systems (id, name, slug, is_archived) VALUES ($1, 'sys', 'sys', false)`,
    [SYSTEM_ID],
  );
  pool.query(
    `INSERT INTO menus (id, system_id, name, slug, is_archived)
     VALUES ($1, $2, 'menu', 'menu', false)`,
    [MENU_ID, SYSTEM_ID],
  );
  pool.query(
    `INSERT INTO voc_types (id, name, slug, is_archived) VALUES ($1, '버그', 'bug', false)`,
    [VOC_TYPE_ID],
  );
  // Active VOC (not in trash).
  pool.query(
    `INSERT INTO vocs (id, title, body, status, priority, source, embed_stale,
                       author_id, system_id, menu_id, voc_type_id, issue_code)
     VALUES ($1, 'live', 'b', '접수', 'medium', 'manual', false, $2, $3, $4, $5, 'VOC-1001')`,
    [ACTIVE_VOC, ADMIN_ID, SYSTEM_ID, MENU_ID, VOC_TYPE_ID],
  );
  // Soft-deleted VOC (deleted_at + deleted_by populated, FU-015 audit columns).
  pool.query(
    `INSERT INTO vocs (id, title, body, status, priority, source, embed_stale,
                       author_id, system_id, menu_id, voc_type_id, issue_code,
                       deleted_at, deleted_by)
     VALUES ($1, 'deleted', 'b', '접수', 'medium', 'manual', false,
             $2, $3, $4, $5, 'VOC-1002', '2026-05-01T00:00:00Z', $2)`,
    [DELETED_VOC, ADMIN_ID, SYSTEM_ID, MENU_ID, VOC_TYPE_ID],
  );
}

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'fu-015-admin-trash',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>).user = {
      id: ADMIN_ID,
      role: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
    };
    next();
  });
  app.use('/api/admin', adminTrashRouter);
  app.use('/api/vocs', vocRouter);
  app.use(errorHandler);
  return app;
}

describe('admin-trash routes — DB-backed (FU-015)', () => {
  let pool: Pool;

  beforeEach(() => {
    const booted = bootDb();
    pool = booted.pool;
    setPool(pool);
    seedFixtures(pool);
  });

  afterEach(() => {
    resetPool();
  });

  describe('GET /api/admin/vocs/trash', () => {
    it('returns only soft-deleted VOCs (deleted_at IS NOT NULL)', async () => {
      const res = await request(makeApp())
        .get('/api/admin/vocs/trash')
        .query({ page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.rows).toHaveLength(1);
      expect(res.body.rows[0].id).toBe(DELETED_VOC);
      expect(res.body.rows[0].issue_code).toBe('VOC-1002');
      expect(res.body.rows[0].deleted_at).toBeTruthy();
    });

    it('filters by system_id', async () => {
      const otherSystem = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000b02';
      pool.query(
        `INSERT INTO systems (id, name, slug, is_archived)
         VALUES ($1, 'other', 'other', false)`,
        [otherSystem],
      );

      const res = await request(makeApp())
        .get('/api/admin/vocs/trash')
        .query({ system_id: otherSystem, page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.rows).toEqual([]);
    });

    // pg-mem cannot parse `ILIKE … ESCAPE '\\'` — listTrashedVocs `q` filter
    // exercises that pattern. Tracked as FU-024 (testcontainers Postgres).
    it.skip('filters by ?q on title / issue_code — pg-mem lacks ESCAPE clause (FU-024)', async () => {
      const res = await request(makeApp())
        .get('/api/admin/vocs/trash')
        .query({ q: 'VOC-1002', page: 1, per_page: 20 });
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it('returns empty list when no VOCs are soft-deleted', async () => {
      // Hard-clear the trash for this test only.
      await pool.query(`UPDATE vocs SET deleted_at = NULL WHERE id = $1`, [DELETED_VOC]);

      const res = await request(makeApp())
        .get('/api/admin/vocs/trash')
        .query({ page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.rows).toEqual([]);
    });
  });

  describe('GET /api/admin/vocs/:id/restore-log', () => {
    it('returns restore-log rows in created_at DESC order (migration 015 schema)', async () => {
      // Seed two restore-log entries for the deleted VOC.
      await pool.query(
        `INSERT INTO voc_restore_log
           (id, voc_id, action, actor_id, before_deleted_at, before_deleted_by, created_at)
         VALUES
           (gen_random_uuid(), $1, 'restore', $2,
            '2026-05-01T00:00:00Z', $2, '2026-05-02T00:00:00Z'),
           (gen_random_uuid(), $1, 'hard_delete', $2,
            '2026-05-01T00:00:00Z', $2, '2026-05-03T00:00:00Z')`,
        [DELETED_VOC, ADMIN_ID],
      );

      const res = await request(makeApp()).get(
        `/api/admin/vocs/${DELETED_VOC}/restore-log`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      // Repo orders by created_at DESC — the hard_delete (2026-05-03) comes first.
      expect(res.body[0].action).toBe('hard_delete');
      expect(res.body[1].action).toBe('restore');
    });

    it('returns empty array when no restore-log entries exist for the VOC', async () => {
      const res = await request(makeApp()).get(
        `/api/admin/vocs/${ACTIVE_VOC}/restore-log`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // PATCH /api/vocs/:id/restore lives on `vocRouter` (admin-only via
  // `requireAdminOrHide`). repository/__tests__/trash.sql.test.ts already pins
  // the SQL column shape with a recording fake pool; this case exercises the
  // full transactional flow against a real schema (FOR UPDATE → UPDATE vocs →
  // INSERT voc_history → INSERT voc_restore_log → INSERT voc_tags … ON
  // CONFLICT DO NOTHING) end-to-end via supertest. Codex P1 (PR #280 review).
  describe('PATCH /api/vocs/:id/restore (transactional flow)', () => {
    it('clears deleted_at/deleted_by, writes voc_history + voc_restore_log, and re-applies tag rules', async () => {
      // Seed a tag + active rule so the restore transaction's tag re-apply
      // step has work to do (non-no-op INSERT … SELECT … ON CONFLICT).
      const tagId = '99999999-9999-4999-8999-000000000099';
      await pool.query(
        `INSERT INTO tags (id, name, slug, kind, is_external)
         VALUES ($1, 'auto', 'auto', 'general', false)`,
        [tagId],
      );
      await pool.query(
        `INSERT INTO tag_rules (id, name, pattern, kind, tag_id, is_active, sort_order)
         VALUES (gen_random_uuid(), 'r', 'pat', 'general', $1, true, 0)`,
        [tagId],
      );

      const res = await request(makeApp()).patch(
        `/api/vocs/${DELETED_VOC}/restore`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        voc_id: DELETED_VOC,
        audit: {
          action: 'restore',
          voc_id: DELETED_VOC,
          actor_id: ADMIN_ID,
          before_deleted_by: ADMIN_ID,
        },
      });
      expect(typeof res.body.restored_at).toBe('string');

      // 1. vocs.deleted_at / deleted_by cleared
      const { rows: vocRows } = await pool.query(
        `SELECT deleted_at, deleted_by FROM vocs WHERE id = $1`,
        [DELETED_VOC],
      );
      expect(vocRows[0].deleted_at).toBeNull();
      expect(vocRows[0].deleted_by).toBeNull();

      // 2. voc_history audit row written (003 column shape)
      const { rows: histRows } = await pool.query(
        `SELECT field, old_value, new_value, changed_by
         FROM voc_history WHERE voc_id = $1`,
        [DELETED_VOC],
      );
      expect(histRows).toHaveLength(1);
      expect(histRows[0].field).toBe('deleted_at');
      expect(histRows[0].new_value).toBeNull();
      expect(histRows[0].changed_by).toBe(ADMIN_ID);

      // 3. voc_restore_log row written (015 column shape)
      const { rows: logRows } = await pool.query(
        `SELECT action, actor_id, before_deleted_by
         FROM voc_restore_log WHERE voc_id = $1`,
        [DELETED_VOC],
      );
      expect(logRows).toHaveLength(1);
      expect(logRows[0].action).toBe('restore');
      expect(logRows[0].actor_id).toBe(ADMIN_ID);
      expect(logRows[0].before_deleted_by).toBe(ADMIN_ID);

      // 4. tag_rules re-applied → voc_tags now has the rule-attached tag
      const { rows: tagRows } = await pool.query(
        `SELECT tag_id, source FROM voc_tags WHERE voc_id = $1`,
        [DELETED_VOC],
      );
      expect(tagRows).toHaveLength(1);
      expect(tagRows[0].tag_id).toBe(tagId);
      expect(tagRows[0].source).toBe('rule');
    });

    it('returns 409 ALREADY_ACTIVE when the VOC is not in trash', async () => {
      const res = await request(makeApp()).patch(
        `/api/vocs/${ACTIVE_VOC}/restore`,
      );
      expect(res.status).toBe(409);
      // HttpError → errorHandler → wrapped envelope.
      expect(res.body.error?.code ?? res.body.code).toBe('ALREADY_ACTIVE');
    });

    it('returns 404 NOT_FOUND when the VOC does not exist', async () => {
      const ghost = '00000000-0000-4000-8000-00000000ffff';
      const res = await request(makeApp()).patch(`/api/vocs/${ghost}/restore`);
      expect(res.status).toBe(404);
    });
  });
});
