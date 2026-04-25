import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Comment endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;
  let vocId: string;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);

    // Create a VOC authored by user
    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
       VALUES ('Test VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
      [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    vocId = result.rows[0].id as string;
  });

  // ── Unauthenticated ────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get(`/api/vocs/${vocId}/comments`);
    expect(res.status).toBe(401);
  });

  // ── GET ────────────────────────────────────────────────────────────────────

  describe('GET /api/vocs/:vocId/comments', () => {
    it('Manager can view comments on any VOC', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${vocId}/comments`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('User can view comments on their own VOC', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}/comments`);
      expect(res.status).toBe(200);
    });

    it("User cannot view comments on another user's VOC → 404", async () => {
      // VOC authored by admin
      const adminVocResult = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Admin VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.adminId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      const adminVocId = adminVocResult.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${adminVocId}/comments`);
      expect(res.status).toBe(404);
    });
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  describe('POST /api/vocs/:vocId/comments', () => {
    it('User creates a comment on their own VOC → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post(`/api/vocs/${vocId}/comments`).send({ body: 'Hello from user' });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe('Hello from user');
      expect(res.body.author_id).toBe(fixtures.userId);
    });

    it('Manager creates a comment → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/comments`).send({ body: 'Manager comment' });

      expect(res.status).toBe(201);
    });

    it('Missing body → 400', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/comments`).send({});
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH ──────────────────────────────────────────────────────────────────

  describe('PATCH /api/vocs/:vocId/comments/:commentId', () => {
    let commentId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO comments (voc_id, author_id, body) VALUES ($1, $2, 'original') RETURNING id`,
        [vocId, fixtures.userId],
      );
      commentId = result.rows[0].id as string;
    });

    it('Owner can edit their comment', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent
        .patch(`/api/vocs/${vocId}/comments/${commentId}`)
        .send({ body: 'updated' });

      expect(res.status).toBe(200);
      expect(res.body.body).toBe('updated');
    });

    it('Another user editing someone else comment → 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .patch(`/api/vocs/${vocId}/comments/${commentId}`)
        .send({ body: 'hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  describe('DELETE /api/vocs/:vocId/comments/:commentId', () => {
    it('Owner can delete their own comment → 200', async () => {
      const result = await pool.query(
        `INSERT INTO comments (voc_id, author_id, body) VALUES ($1, $2, 'to delete') RETURNING id`,
        [vocId, fixtures.userId],
      );
      const commentId = result.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.delete(`/api/vocs/${vocId}/comments/${commentId}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('Admin can delete another user comment → 200', async () => {
      const result = await pool.query(
        `INSERT INTO comments (voc_id, author_id, body) VALUES ($1, $2, 'admin deletes') RETURNING id`,
        [vocId, fixtures.userId],
      );
      const commentId = result.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.delete(`/api/vocs/${vocId}/comments/${commentId}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
