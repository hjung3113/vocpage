import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

async function insertNotification(
  pool: Pool,
  opts: { userId: string; type: string; vocId: string },
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, voc_id) VALUES ($1, $2, $3) RETURNING id`,
    [opts.userId, opts.type, opts.vocId],
  );
  return result.rows[0].id as string;
}

describe('Notification endpoints', () => {
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
       VALUES ('Test VOC Title', 'body', '접수', 'urgent', $1, $2, $3, $4, 'manual') RETURNING id`,
      [fixtures.adminId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    vocId = result.rows[0].id as string;
  });

  // ── Unauthenticated ────────────────────────────────────────────────────────

  it('returns 401 when not authenticated (GET /api/notifications)', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns 401 when not authenticated (GET /api/notifications/unread-count)', async () => {
    const res = await request(app).get('/api/notifications/unread-count');
    expect(res.status).toBe(401);
  });

  it('returns 401 when not authenticated (PATCH /api/notifications/:id/read)', async () => {
    const res = await request(app).patch('/api/notifications/some-id/read');
    expect(res.status).toBe(401);
  });

  // ── GET /api/notifications ─────────────────────────────────────────────────

  describe('GET /api/notifications', () => {
    it('returns empty array when no notifications exist', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.get('/api/notifications');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns notifications with message and voc_priority fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      await insertNotification(pool, { userId: fixtures.adminId, type: 'comment', vocId });

      const res = await agent.get('/api/notifications');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const n = res.body[0];
      expect(typeof n.message).toBe('string');
      expect(n.message.length).toBeGreaterThan(0);
      expect('voc_priority' in n).toBe(true);
      expect('is_read' in n).toBe(true);
    });
  });

  // ── GET /api/notifications/unread-count ────────────────────────────────────

  describe('GET /api/notifications/unread-count', () => {
    it('returns { count: number } with ETag header', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/notifications/unread-count');
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
      expect(res.headers['etag']).toBeDefined();
    });

    it('returns 304 when ETag matches (not modified)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const first = await agent.get('/api/notifications/unread-count');
      expect(first.status).toBe(200);
      const etag = first.headers['etag'] as string;

      const second = await agent.get('/api/notifications/unread-count').set('If-None-Match', etag);
      expect(second.status).toBe(304);
    });
  });

  // ── PATCH /api/notifications/:id/read ──────────────────────────────────────

  describe('PATCH /api/notifications/:id/read', () => {
    it('returns 404 for non-existent notification', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.patch('/api/notifications/00000000-0000-0000-0000-000000000099/read');
      expect(res.status).toBe(404);
    });

    it('marks own notification as read → 200', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const notifId = await insertNotification(pool, {
        userId: fixtures.adminId,
        type: 'assigned',
        vocId,
      });

      const res = await agent.patch(`/api/notifications/${notifId}/read`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 404 when trying to read another user's notification", async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      // Insert notification for admin, try to read as manager
      const notifId = await insertNotification(pool, {
        userId: fixtures.adminId,
        type: 'status_change',
        vocId,
      });

      const res = await agent.patch(`/api/notifications/${notifId}/read`);
      expect(res.status).toBe(404);
    });
  });
});
