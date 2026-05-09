/**
 * admin-tags.sql.test.ts — DB-backed integration suite for FU-015.
 *
 * Existing `admin-tags.test.ts` mocks `services/admin/tag-master`, so SQL
 * drift (column renames, missing JOINs, FK violations) silently passes. This
 * file boots a real pg-mem-backed schema (migrations 002-006 raw + 014 +
 * 020 Up sections — 001 is stripped because pg-mem rejects CREATE EXTENSION)
 * and exercises the route → service → SQL layers end-to-end. Mirrors the
 * `trash.sql.test.ts` regression intent at the route level.
 *
 * Test isolation: `setPool()` mutates module-global state. Safe under Jest
 * `--runInBand` (configured in backend/package.json `test` script). Do not
 * use `test.concurrent` here.
 *
 * Spec sources:
 *   - docs/specs/plans/followup-bucket.md FU-015
 *   - docs/specs/requires/feature-voc.md §9.4.6 (merge / hard-delete policy)
 *   - docs/specs/requires/requirements.md §15.3
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

import { adminTagsRouter } from '../admin-tags';
import { errorHandler } from '../../middleware/errorHandler';
import { setPool, resetPool } from '../../db';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

// Migrations applied raw (no Up/Down markers — early files are flat DDL).
// 001_extensions only contains CREATE EXTENSION statements that pg-mem can't
// run, so we skip it (uuid_generate_v4 is registered manually below).
const RAW_MIGRATIONS = [
  '002_core_tables.sql',
  '003_vocs.sql',
  '004_tags.sql',
  '005_content.sql',
  '006_settings.sql',
];

// Later migrations carry Up/Down markers — apply Up only.
const UP_MIGRATIONS = ['014_tag_master_ops.sql', '020_tags_name_kind_unique.sql'];

function stripUnsupported(sql: string): string {
  return (
    sql
      .split('\n')
      .filter((line) => !/CREATE EXTENSION/i.test(line))
      .join('\n')
      .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
      // pgvector column reserved for future similarity search — out of scope here.
      .replace(/,\s*\n?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
      .replace(/\s*embedding\s+vector\(\d+\)[^\n,]*,?\n?/gi, '')
      // pg-mem does not support plpgsql. Strip function/trigger bodies — the
      // tag-master service code we exercise does not depend on
      // updated_at trigger semantics (DEFAULT now() handles created_at; the
      // service writes UPDATED_AT explicitly when it cares).
      .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*LANGUAGE\s+plpgsql\s*;/gi, '')
      .replace(/CREATE FUNCTION[\s\S]*?\$\$\s*LANGUAGE\s+plpgsql\s*;/gi, '')
      .replace(/CREATE TRIGGER[\s\S]*?EXECUTE FUNCTION\s+\w+\s*\(\s*\)\s*;/gi, '')
      // pg-mem evaluates `NULL IN (...)` as FALSE (Postgres returns UNKNOWN),
      // which breaks the **nullable** enum CHECKs on `vocs` (review_status /
      // resolution_quality / drop_reason). Standard Postgres CHECK semantics
      // permit NULL implicitly. We rewrite `CHECK (col IN (...))` to
      // `CHECK (col IS NULL OR col IN (...))` so the constraint is still
      // enforced for non-NULL values (preserving drift detection on enum
      // values per codex P2 review on PR #280) but pg-mem accepts NULL.
      .replace(
        /CHECK\s*\(\s*(\w+)\s+IN\s*\(([^()]*)\)\s*\)/gi,
        'CHECK ($1 IS NULL OR $1 IN ($2))',
      )
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
    if (!sql) continue; // 001_extensions becomes empty after CREATE EXTENSION strip
    try {
      db.public.query(sql);
    } catch (err) {
      throw new Error(`${file}: ${(err as Error).message}`);
    }
  }
  for (const file of UP_MIGRATIONS) {
    const sql = readUp(file).trim();
    if (!sql) continue;
    try {
      db.public.query(sql);
    } catch (err) {
      throw new Error(`${file} Up: ${(err as Error).message}`);
    }
  }
  const { Pool: MemPool } = db.adapters.createPg();
  const pool = new MemPool() as unknown as Pool;
  return { db, pool };
}

const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000a01';
const SYSTEM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000b01';
const MENU_ID = 'cccccccc-cccc-4ccc-8ccc-000000000c01';
const VOC_TYPE_ID = 'dddddddd-dddd-4ddd-8ddd-000000000d01';
const VOC_ID = 'eeeeeeee-eeee-4eee-8eee-000000000e01';

function seedFixtures(pool: Pool): void {
  // Admin user — author of the seeded VOC + actor for mutations.
  pool.query(
    `INSERT INTO users (id, ad_username, display_name, email, role, is_active)
     VALUES ($1, 'admin1', 'Admin One', 'admin@example.com', 'admin', true)`,
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
  pool.query(
    `INSERT INTO vocs (id, title, body, status, priority, source, embed_stale,
                       author_id, system_id, menu_id, voc_type_id)
     VALUES ($1, 't', 'b', '접수', 'medium', 'manual', false, $2, $3, $4, $5)`,
    [VOC_ID, ADMIN_ID, SYSTEM_ID, MENU_ID, VOC_TYPE_ID],
  );
}

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'fu-015-admin-tags',
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
  app.use('/api/admin', adminTagsRouter);
  app.use(errorHandler);
  return app;
}

describe('admin-tags routes — DB-backed (FU-015)', () => {
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

  describe('POST /api/admin/tags', () => {
    it('creates a tag and persists name/kind/slug to DB', async () => {
      const res = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: '버그', kind: 'general' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: '버그', kind: 'general' });
      expect(typeof res.body.slug).toBe('string');

      const { rows } = await pool.query(
        `SELECT name, kind, is_external FROM tags WHERE id = $1`,
        [res.body.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: '버그', kind: 'general', is_external: false });
    });

    it('rejects duplicate (name, kind) per migration 020 UNIQUE constraint', async () => {
      const app = makeApp();
      const first = await app && request(app).post('/api/admin/tags').send({ name: 'dup', kind: 'general' });
      expect((await first).status).toBe(201);

      const second = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: 'dup', kind: 'general' });
      // tag-master.ts maps unique-violation → 409 CONFLICT (see isUniqueViolation).
      expect(second.status).toBe(409);
      expect(second.body.code).toBe('CONFLICT');
    });

    // FU-023 (resolved 2026-05-10): `createTag` derives slug as
    // `<name>-<kind>` so two tags with the same name and different kinds
    // produce distinct slugs (general / menu) — satisfying both row-level
    // UNIQUE(name, kind) and the slug UNIQUE constraint.
    it('FU-023: same name across different kinds → both succeed with distinct slugs', async () => {
      const first = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: '공통', kind: 'general' });
      expect(first.status).toBe(201);
      expect(first.body.slug).toBe('공통-general');

      const second = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: '공통', kind: 'menu' });
      expect(second.status).toBe(201);
      expect(second.body.slug).toBe('공통-menu');
      expect(second.body.id).not.toBe(first.body.id);
    });
  });

  describe('GET /api/admin/tags', () => {
    it('lists tags with usage_count and rule_ref_count joined from voc_tags / tag_rules', async () => {
      // Seed a tag + attach to the seeded VOC + add a tag rule referencing it.
      const create = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: 'ux', kind: 'general' });
      const tagId = create.body.id;

      await pool.query(
        `INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`,
        [VOC_ID, tagId],
      );
      await pool.query(
        `INSERT INTO tag_rules (id, name, pattern, kind, tag_id, is_active, sort_order)
         VALUES (gen_random_uuid(), 'rule', 'foo', 'general', $1, true, 0)`,
        [tagId],
      );

      const res = await request(makeApp())
        .get('/api/admin/tags')
        .query({ page: 1, per_page: 20 });

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { id: string }) => r.id === tagId);
      expect(row).toBeDefined();
      expect(row.usage_count).toBe(1);
      expect(row.rule_ref_count).toBe(1);
    });

    // FU-024: ILIKE ESCAPE filter activated under testcontainers Postgres
    // → see admin-sql-tc.test.ts.
  });

  describe('PATCH /api/admin/tags/:id', () => {
    // FU-024: renameTag (correlated subquery in RETURNING) activated under
    // testcontainers Postgres → see admin-sql-tc.test.ts.
  });

  describe('DELETE /api/admin/tags/:id', () => {
    it('hard-deletes when usage_count = 0 and rule_ref_count = 0', async () => {
      const created = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: 'orphan', kind: 'general' });
      const id = created.body.id;

      const del = await request(makeApp()).delete(`/api/admin/tags/${id}`);
      expect(del.status).toBe(200);

      const { rows } = await pool.query(`SELECT id FROM tags WHERE id = $1`, [id]);
      expect(rows).toHaveLength(0);
    });

    it('rejects with 409 when tag is still attached to VOCs (usage_count > 0)', async () => {
      const created = await request(makeApp())
        .post('/api/admin/tags')
        .send({ name: 'inuse', kind: 'general' });
      const id = created.body.id;
      await pool.query(
        `INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`,
        [VOC_ID, id],
      );

      const del = await request(makeApp()).delete(`/api/admin/tags/${id}`);
      expect(del.status).toBe(409);
      expect(del.body.code).toBe('CONFLICT');

      const { rows } = await pool.query(`SELECT id FROM tags WHERE id = $1`, [id]);
      expect(rows).toHaveLength(1); // tag preserved
    });
  });

  describe('PATCH /api/admin/tags/:id/external', () => {
    // FU-024: toggleExternal (correlated subquery in RETURNING) activated
    // under testcontainers Postgres → see admin-sql-tc.test.ts.
  });
});
