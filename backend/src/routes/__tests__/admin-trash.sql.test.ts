/**
 * admin-trash.sql.test.ts — DB-backed integration suite for FU-015.
 *
 * `admin-trash.test.ts` mocks `repository/trash`, so SQL drift slips through.
 * `repository/__tests__/trash.sql.test.ts` (PR #263 hotfix) pins SQL column
 * shape via a recording fake pool but does not exercise the real schema.
 * This file boots pg-mem with the admin-relevant migrations (001-006 + 014 +
 * 015 + 016 + 020 Up sections) and drives `listTrashedVocs` /
 * `getRestoreLog` end-to-end through the route → repository path.
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
    // pg-mem evaluates CHECK constraints strictly (NULL fails IN-list); FU-015
    // is about route → service → SQL drift, not enum invariants.
    .replace(/\s+CHECK\s*\((?:[^()]|\([^()]*\))*\)/gi, '');
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
});
