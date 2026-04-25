import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Internal Notes endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;
  let vocId: string;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);

    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
       VALUES ('Test VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
      [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    vocId = result.rows[0].id as string;
  });

  // ── User gets 404 ──────────────────────────────────────────────────────────

  describe('User role → 404', () => {
    it('GET /notes as User → 404', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}/notes`);
      expect(res.status).toBe(404);
    });

    it('POST /notes as User → 404', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post(`/api/vocs/${vocId}/notes`).send({ body: 'note' });
      expect(res.status).toBe(404);
    });
  });

  // ── Manager CRUD ───────────────────────────────────────────────────────────

  describe('Manager role', () => {
    it('GET /notes as Manager → 200', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${vocId}/notes`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /notes as Manager → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/notes`).send({ body: 'internal note' });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe('internal note');
      expect(res.body.author_id).toBe(fixtures.managerId);
    });

    it('Another manager editing a note they do not own → 403', async () => {
      // Admin creates a note
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/auth/mock-login').send({ role: 'admin' });

      const createRes = await adminAgent
        .post(`/api/vocs/${vocId}/notes`)
        .send({ body: 'admin note' });
      expect(createRes.status).toBe(201);
      const noteId = createRes.body.id as string;

      // Manager tries to edit admin note
      const managerAgent = request.agent(app);
      await managerAgent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await managerAgent
        .patch(`/api/vocs/${vocId}/notes/${noteId}`)
        .send({ body: 'hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ── Admin soft delete ──────────────────────────────────────────────────────

  describe('Admin soft delete', () => {
    it('Admin soft-deletes a note → 200 + deleted_at set', async () => {
      // Manager creates a note
      const managerAgent = request.agent(app);
      await managerAgent.post('/api/auth/mock-login').send({ role: 'manager' });

      const createRes = await managerAgent
        .post(`/api/vocs/${vocId}/notes`)
        .send({ body: 'note to delete' });
      expect(createRes.status).toBe(201);
      const noteId = createRes.body.id as string;

      // Admin deletes it
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await adminAgent.delete(`/api/vocs/${vocId}/notes/${noteId}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Verify deleted_at is set
      const check = await pool.query(`SELECT deleted_at FROM voc_internal_notes WHERE id = $1`, [
        noteId,
      ]);
      expect(check.rows[0].deleted_at).not.toBeNull();
    });
  });
});
