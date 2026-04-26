import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

/**
 * VOC CRUD + permission tests.
 */
describe('VOC endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  // ── GET /api/vocs ──────────────────────────────────────────────────────────

  describe('GET /api/vocs', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/vocs');
      expect(res.status).toBe(401);
    });

    it('Manager sees all VOCs', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      // Insert a VOC authored by user
      await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('User VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual')`,
        [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );

      const res = await agent.get('/api/vocs');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('User sees all VOCs (no role-based list filter)', async () => {
      await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('My VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual')`,
        [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Admin VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual')`,
        [fixtures.adminId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/vocs');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });
  });

  // ── POST /api/vocs ─────────────────────────────────────────────────────────

  describe('POST /api/vocs', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/vocs').send({
        title: 'Test',
        system_id: fixtures.systemId,
        menu_id: fixtures.menuId,
        voc_type_id: fixtures.vocTypeId,
        body: 'body',
      });
      expect(res.status).toBe(401);
    });

    it('User creates VOC → 201, priority=medium, status=접수', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/vocs').send({
        title: 'New VOC',
        system_id: fixtures.systemId,
        menu_id: fixtures.menuId,
        voc_type_id: fixtures.vocTypeId,
        body: 'This is the body',
      });

      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('medium');
      expect(res.body.status).toBe('접수');
      expect(res.body.author_id).toBe(fixtures.userId);
    });

    it('returns 400 for missing required fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/vocs').send({ title: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/vocs/:id ──────────────────────────────────────────────────────

  describe('GET /api/vocs/:id', () => {
    it("User cannot access another user's VOC → 404", async () => {
      // Insert a VOC by admin
      const result = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Admin Only VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.adminId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      const vocId = result.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}`);
      expect(res.status).toBe(404);
    });

    it('Manager can access any VOC', async () => {
      const result = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Manager Visible VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      const vocId = result.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${vocId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(vocId);
    });
  });

  // ── PATCH /api/vocs/:id/status ─────────────────────────────────────────────

  describe('PATCH /api/vocs/:id/status', () => {
    let vocId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Status VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      vocId = result.rows[0].id as string;
    });

    it('User attempt → 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.patch(`/api/vocs/${vocId}/status`).send({ status: '검토중' });
      expect(res.status).toBe(403);
    });

    it('Invalid transition (접수→완료) → 400 INVALID_TRANSITION', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.patch(`/api/vocs/${vocId}/status`).send({ status: '완료' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_TRANSITION');
    });

    it('Valid transition (접수→검토중) → 200', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.patch(`/api/vocs/${vocId}/status`).send({ status: '검토중' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('검토중');
    });
  });

  // ── DELETE /api/vocs/:id ───────────────────────────────────────────────────

  describe('DELETE /api/vocs/:id', () => {
    let vocId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Delete VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      vocId = result.rows[0].id as string;
    });

    it('Manager attempt → 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.delete(`/api/vocs/${vocId}`);
      expect(res.status).toBe(403);
    });

    it('Admin soft-deletes → 204', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.delete(`/api/vocs/${vocId}`);
      expect(res.status).toBe(204);

      // Verify deleted_at is set
      const check = await pool.query(`SELECT deleted_at FROM vocs WHERE id = $1`, [vocId]);
      expect(check.rows[0].deleted_at).not.toBeNull();
    });
  });
});
