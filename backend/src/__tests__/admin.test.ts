import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Admin endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  // ── GET /api/admin/systems ─────────────────────────────────────────────────

  describe('GET /api/admin/systems', () => {
    it('returns 403 for Manager', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });
      const res = await agent.get('/api/admin/systems');
      expect(res.status).toBe(403);
    });

    it('returns list for Admin', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      const res = await agent.get('/api/admin/systems');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('voc_count');
    });
  });

  // ── POST /api/admin/systems ────────────────────────────────────────────────

  describe('POST /api/admin/systems', () => {
    it('Admin creates system + auto 기타 menu', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.post('/api/admin/systems').send({
        name: 'New System',
        slug: 'new-system',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('system');
      expect(res.body).toHaveProperty('menu');
      expect(res.body.system.name).toBe('New System');
      expect(res.body.menu.slug).toBe('other');
      expect(res.body.menu.name).toBe('기타');
    });
  });

  // ── PATCH /api/admin/systems/:id ──────────────────────────────────────────

  describe('PATCH /api/admin/systems/:id', () => {
    it('Admin can archive a system', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent
        .patch(`/api/admin/systems/${fixtures.systemId}`)
        .send({ is_archived: true });

      expect(res.status).toBe(200);
      expect(res.body.is_archived).toBe(true);

      // Restore
      await pool.query(`UPDATE systems SET is_archived = false WHERE id = $1`, [fixtures.systemId]);
    });
  });

  // ── GET /api/admin/menus ──────────────────────────────────────────────────

  describe('GET /api/admin/menus', () => {
    it('Admin gets menu list for a system', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.get(`/api/admin/menus?systemId=${fixtures.systemId}`);
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('voc_count');
    });

    it('returns 400 when systemId is missing', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.get('/api/admin/menus');
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/admin/voc-types ─────────────────────────────────────────────

  describe('POST /api/admin/voc-types', () => {
    it('Admin can create a VOC type', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.post('/api/admin/voc-types').send({
        name: 'Feature Request',
        slug: 'feature-request',
        color: 'blue',
        sort_order: 5,
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Feature Request');
      expect(res.body.slug).toBe('feature-request');
    });
  });

  // ── GET /api/admin/users ──────────────────────────────────────────────────

  describe('GET /api/admin/users', () => {
    it('Admin gets user list', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.get('/api/admin/users');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── PATCH /api/admin/users/:id ────────────────────────────────────────────

  describe('PATCH /api/admin/users/:id', () => {
    it('Admin can change user role', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      // Promote user to manager
      const res = await agent
        .patch(`/api/admin/users/${fixtures.userId}`)
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('manager');

      // Restore
      await pool.query(`UPDATE users SET role = 'user' WHERE id = $1`, [fixtures.userId]);
    });

    it('Cannot demote last admin', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      // Deactivate the other admins first to isolate — adminId is the only admin
      // Attempt to demote the sole admin (fixtures.adminId) — logged-in admin IS fixtures.adminId
      // so this will also hit CANNOT_MODIFY_SELF. Use a second admin instead.

      // Insert a second admin so we can demote the first from another session
      const secondAdminResult = await pool.query(
        `INSERT INTO users (ad_username, display_name, email, role)
         VALUES ('admin2', 'Admin Two', 'admin2@company.com', 'admin')
         RETURNING id`,
      );
      const secondAdminId = secondAdminResult.rows[0].id as string;

      // First make the second admin the only admin by deactivating fixtures.adminId
      await pool.query(`UPDATE users SET is_active = false WHERE id = $1`, [fixtures.adminId]);

      // Now try to demote secondAdmin — only 1 active admin remains
      const res = await agent.patch(`/api/admin/users/${secondAdminId}`).send({ role: 'user' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('LAST_ADMIN');

      // Restore
      await pool.query(`UPDATE users SET is_active = true WHERE id = $1`, [fixtures.adminId]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [secondAdminId]);
    });

    it('Cannot modify self', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      // adminId is '00000000-0000-0000-0000-000000000001' — same as mock admin user
      const res = await agent
        .patch(`/api/admin/users/${fixtures.adminId}`)
        .send({ role: 'manager' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CANNOT_MODIFY_SELF');
    });
  });

  // ── GET /api/systems ──────────────────────────────────────────────────────

  describe('GET /api/systems', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/systems');
      expect(res.status).toBe(401);
    });

    it('User can list active systems', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/systems');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      for (const s of res.body as Array<{ is_archived: boolean }>) {
        expect(s.is_archived).toBe(false);
      }
    });
  });

  // ── GET /api/voc-types ────────────────────────────────────────────────────

  describe('GET /api/voc-types', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/voc-types');
      expect(res.status).toBe(401);
    });

    it('User can list active voc types', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/voc-types');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      for (const t of res.body as Array<{ is_archived: boolean }>) {
        expect(t.is_archived).toBe(false);
      }
    });
  });
});
