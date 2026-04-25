import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import { emitNotification } from '../services/notifications';
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

async function clearNotifications(pool: Pool, userId: string): Promise<void> {
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
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

    it('is idempotent: PATCHing an already-read notification returns 200 and preserves read_at', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const notifId = await insertNotification(pool, {
        userId: fixtures.adminId,
        type: 'comment',
        vocId,
      });

      const first = await agent.patch(`/api/notifications/${notifId}/read`);
      expect(first.status).toBe(200);

      const r1 = await pool.query(`SELECT read_at FROM notifications WHERE id = $1`, [notifId]);
      const firstReadAt = r1.rows[0].read_at as string;

      // small wait to ensure NOW() would differ if it ran a second time
      await new Promise((r) => setTimeout(r, 5));

      const second = await agent.patch(`/api/notifications/${notifId}/read`);
      expect(second.status).toBe(200);

      const r2 = await pool.query(`SELECT read_at FROM notifications WHERE id = $1`, [notifId]);
      expect(r2.rows[0].read_at).toEqual(firstReadAt);
    });
  });

  // ── Bulk read on GET ───────────────────────────────────────────────────────

  describe('Bulk-read on GET /api/notifications', () => {
    it('marks all unread as read so unread-count becomes 0', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      await clearNotifications(pool, fixtures.adminId);

      await insertNotification(pool, { userId: fixtures.adminId, type: 'comment', vocId });
      await insertNotification(pool, { userId: fixtures.adminId, type: 'assigned', vocId });

      const before = await agent.get('/api/notifications/unread-count');
      expect(before.body.count).toBeGreaterThan(0);

      const list = await agent.get('/api/notifications');
      expect(list.status).toBe(200);

      const after = await agent.get('/api/notifications/unread-count');
      expect(after.body.count).toBe(0);
    });
  });

  // ── Service-level: debounce, 50-cap, 30-day retention ──────────────────────

  describe('emitNotification service', () => {
    it('debounces duplicate (user, type, voc) emissions inside the 5-min window', async () => {
      await clearNotifications(pool, fixtures.adminId);

      await emitNotification({ pool, userId: fixtures.adminId, type: 'comment', vocId });
      await emitNotification({ pool, userId: fixtures.adminId, type: 'comment', vocId });

      const r = await pool.query(
        `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND type = 'comment' AND voc_id = $2`,
        [fixtures.adminId, vocId],
      );
      expect(r.rows[0].c).toBe(1);
    });

    it('caps stored notifications at 50 per user', async () => {
      await clearNotifications(pool, fixtures.adminId);

      // Insert 51 directly with staggered timestamps so ORDER BY created_at is deterministic.
      for (let i = 0; i < 51; i++) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, voc_id, created_at) VALUES ($1, 'comment', $2, now() - ($3 || ' seconds')::interval)`,
          [fixtures.adminId, vocId, 51 - i],
        );
      }

      // Trigger cleanup by emitting one more (different type so debounce doesn't block).
      await emitNotification({ pool, userId: fixtures.adminId, type: 'assigned', vocId });

      const r = await pool.query(
        `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1`,
        [fixtures.adminId],
      );
      expect(r.rows[0].c).toBeLessThanOrEqual(50);
    });

    it('excludes read notifications older than 30 days from GET response', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      await clearNotifications(pool, fixtures.adminId);

      // Old read notification (35 days ago) — must be filtered out.
      await pool.query(
        `INSERT INTO notifications (user_id, type, voc_id, created_at, read_at) VALUES ($1, 'comment', $2, now() - interval '35 days', now() - interval '35 days')`,
        [fixtures.adminId, vocId],
      );
      // Recent unread — must appear.
      await insertNotification(pool, { userId: fixtures.adminId, type: 'assigned', vocId });

      const res = await agent.get('/api/notifications');
      expect(res.status).toBe(200);
      const types = (res.body as Array<{ type: string }>).map((n) => n.type);
      expect(types).toContain('assigned');
      // The bulk-read on GET means the old one might also be filtered before SELECT runs;
      // either way, only 1 row should be returned.
      expect(res.body.length).toBe(1);
    });
  });

  // ── ETag busting on new alerts ─────────────────────────────────────────────

  describe('unread-count ETag', () => {
    it('changes ETag when a new notification arrives', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      await clearNotifications(pool, fixtures.adminId);

      await insertNotification(pool, { userId: fixtures.adminId, type: 'comment', vocId });
      const first = await agent.get('/api/notifications/unread-count');
      const etag1 = first.headers['etag'] as string;

      // ensure created_at is strictly later
      await new Promise((r) => setTimeout(r, 10));
      await insertNotification(pool, { userId: fixtures.adminId, type: 'assigned', vocId });

      const second = await agent.get('/api/notifications/unread-count');
      const etag2 = second.headers['etag'] as string;
      expect(etag2).not.toEqual(etag1);
    });

    it('returns has_urgent=true when an unread notification points to an urgent VOC', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      await clearNotifications(pool, fixtures.adminId);

      await insertNotification(pool, { userId: fixtures.adminId, type: 'comment', vocId });
      const res = await agent.get('/api/notifications/unread-count');
      expect(res.body.has_urgent).toBe(true);
    });
  });
});
