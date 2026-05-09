/**
 * FU-024 — testcontainers Postgres integration tests.
 *
 * Activates the 4 cells previously skipped under pg-mem due to its
 * inability to parse `ILIKE … ESCAPE '\\'` and correlated subqueries
 * inside `RETURNING`:
 *
 *   admin-tags.sql.test.ts
 *     - GET /api/admin/tags ?q  (ILIKE ESCAPE)
 *     - PATCH /api/admin/tags/:id  (renameTag — RETURNING correlated subquery)
 *     - PATCH /api/admin/tags/:id/external  (toggleExternal — same)
 *
 *   admin-trash.sql.test.ts
 *     - GET /api/admin/vocs/trash ?q  (ILIKE ESCAPE)
 *
 * Container boot ~5-10s. Single shared container across all cells via
 * `beforeAll` to minimize overhead. Tables are TRUNCATEd between tests
 * for isolation.
 */
process.env.AUTH_MODE = 'mock';

import express, { type Express } from 'express';
import session from 'express-session';
import request from 'supertest';
import { Pool } from 'pg';

import { adminTagsRouter } from '../admin-tags';
import { adminTrashRouter } from '../admin-trash';
import { errorHandler } from '../../middleware/errorHandler';
import { setPool, resetPool } from '../../db';
import { startTestPg, type TestPg } from '../../__tests__/helpers/testPostgres';

const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000a01';
const SYSTEM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000b01';
const MENU_ID = 'cccccccc-cccc-4ccc-8ccc-000000000c01';
const VOC_TYPE_ID = 'dddddddd-dddd-4ddd-8ddd-000000000d01';
const VOC_ID_A = 'eeeeeeee-eeee-4eee-8eee-000000000e01';
const VOC_ID_B = 'eeeeeeee-eeee-4eee-8eee-000000000e02';

let tc: TestPg;
let pool: Pool;

async function seedFixtures(): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, ad_username, display_name, email, role, is_active)
     VALUES ($1, 'admin1', 'Admin One', 'admin@example.com', 'admin', true)
     ON CONFLICT (id) DO NOTHING`,
    [ADMIN_ID],
  );
  await pool.query(
    `INSERT INTO systems (id, name, slug, is_archived) VALUES ($1, 'sys', 'sys', false)
     ON CONFLICT (id) DO NOTHING`,
    [SYSTEM_ID],
  );
  await pool.query(
    `INSERT INTO menus (id, system_id, name, slug, is_archived)
     VALUES ($1, $2, 'menu', 'menu', false)
     ON CONFLICT (id) DO NOTHING`,
    [MENU_ID, SYSTEM_ID],
  );
  await pool.query(
    `INSERT INTO voc_types (id, name, slug, is_archived) VALUES ($1, '버그', 'bug', false)
     ON CONFLICT (id) DO NOTHING`,
    [VOC_TYPE_ID],
  );
}

async function seedTrashVocs(): Promise<void> {
  await pool.query(
    `INSERT INTO vocs
       (id, issue_code, title, body, status, priority, voc_type_id, system_id, menu_id,
        author_id, source, deleted_at, deleted_by, created_at, updated_at)
     VALUES
       ($1, 'VOC-1001', 'kept VOC', 'b', '접수', 'medium', $3, $4, $5,
        $6, 'manual', NOW() - interval '1 day', $6, NOW() - interval '2 days', NOW() - interval '1 day'),
       ($2, 'VOC-1002', 'searchable trash', 'b', '접수', 'medium', $3, $4, $5,
        $6, 'manual', NOW() - interval '1 day', $6, NOW() - interval '2 days', NOW() - interval '1 day')
     ON CONFLICT (id) DO NOTHING`,
    [VOC_ID_A, VOC_ID_B, VOC_TYPE_ID, SYSTEM_ID, MENU_ID, ADMIN_ID],
  );
}

function makeApp(router: 'tags' | 'trash'): Express {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'fu-024-tc',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>).user = {
      id: ADMIN_ID,
      role: 'admin',
      name: 'Admin One',
      email: 'admin@example.com',
    };
    next();
  });
  if (router === 'tags') app.use('/api/admin', adminTagsRouter);
  else app.use('/api/admin', adminTrashRouter);
  app.use(errorHandler);
  return app;
}

beforeAll(async () => {
  tc = await startTestPg();
  pool = tc.pool;
  setPool(pool);
}, 60_000);

afterAll(async () => {
  resetPool();
  await tc.stop();
}, 30_000);

beforeEach(async () => {
  // Truncate mutable tables between tests; preserve seed data idempotently.
  await pool.query(
    `TRUNCATE TABLE
       voc_tags, tag_rules, tags, voc_restore_log, voc_internal_notes,
       vocs, menus, systems, voc_types, user_role_log, users
     RESTART IDENTITY CASCADE`,
  );
  await seedFixtures();
});

describe('FU-024 — admin-tags real-Postgres integration', () => {
  describe('GET /api/admin/tags ?q', () => {
    it('filters by q ILIKE on name (uses ESCAPE clause)', async () => {
      await request(makeApp('tags')).post('/api/admin/tags').send({ name: 'alpha', kind: 'general' });
      await request(makeApp('tags')).post('/api/admin/tags').send({ name: 'beta', kind: 'general' });

      const res = await request(makeApp('tags'))
        .get('/api/admin/tags')
        .query({ q: 'alp', page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.rows.map((r: { name: string }) => r.name)).toEqual(['alpha']);
    });
  });

  describe('PATCH /api/admin/tags/:id', () => {
    it('renames and persists new name (correlated subquery in RETURNING)', async () => {
      const created = await request(makeApp('tags'))
        .post('/api/admin/tags')
        .send({ name: 'old', kind: 'general' });
      const id = created.body.id;

      const patched = await request(makeApp('tags'))
        .patch(`/api/admin/tags/${id}`)
        .send({ name: 'new' });

      expect(patched.status).toBe(200);
      expect(patched.body.name).toBe('new');

      const { rows } = await pool.query(`SELECT name FROM tags WHERE id = $1`, [id]);
      expect(rows[0].name).toBe('new');
    });
  });

  describe('PATCH /api/admin/tags/:id/external', () => {
    it('toggles is_external (correlated subquery in RETURNING)', async () => {
      const created = await request(makeApp('tags'))
        .post('/api/admin/tags')
        .send({ name: 'ext', kind: 'general' });
      const id = created.body.id;

      const toggled = await request(makeApp('tags'))
        .patch(`/api/admin/tags/${id}/external`)
        .send({ is_external: true });

      expect(toggled.status).toBe(200);
      expect(toggled.body.is_external).toBe(true);

      const { rows } = await pool.query(`SELECT is_external FROM tags WHERE id = $1`, [id]);
      expect(rows[0].is_external).toBe(true);
    });
  });
});

describe('FU-024 — admin-trash real-Postgres integration', () => {
  beforeEach(async () => {
    await seedTrashVocs();
  });

  describe('GET /api/admin/vocs/trash ?q', () => {
    it('filters by q on issue_code (uses ESCAPE clause)', async () => {
      // issue_code is auto-generated by the migration 003 trigger; query the
      // seed row to discover its actual code, then search by it.
      const { rows: seeded } = await pool.query<{ issue_code: string }>(
        `SELECT issue_code FROM vocs WHERE id = $1`,
        [VOC_ID_B],
      );
      const code = seeded[0].issue_code;

      const res = await request(makeApp('trash'))
        .get('/api/admin/vocs/trash')
        .query({ q: code, page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.rows[0].issue_code).toBe(code);
    });

    it('filters by q on title fragment', async () => {
      const res = await request(makeApp('trash'))
        .get('/api/admin/vocs/trash')
        .query({ q: 'searchable', page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.rows[0].title).toContain('searchable');
    });
  });
});
