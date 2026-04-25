import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Dashboard endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  async function insertVoc(
    authorId: string,
    status = '접수',
    priority = 'medium',
  ): Promise<string> {
    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
       VALUES ('Test VOC', 'body', $1, $2, $3, $4, $5, $6, 'manual') RETURNING id`,
      [status, priority, authorId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    return result.rows[0].id as string;
  }

  // ── Auth enforcement ─────────────────────────────────────────────────────────

  const managerOnlyRoutes = [
    '/api/dashboard/summary',
    '/api/dashboard/distribution?type=status',
    '/api/dashboard/priority-status-matrix',
    '/api/dashboard/heatmap?xAxis=status',
    '/api/dashboard/weekly-trend',
    '/api/dashboard/tag-distribution',
    '/api/dashboard/system-overview',
    '/api/dashboard/assignee-stats',
    '/api/dashboard/processing-speed',
    '/api/dashboard/aging',
    '/api/dashboard/aging-vocs',
    '/api/dashboard/settings',
    '/api/dashboard/assignees',
  ];

  describe('User role gets 403 on all dashboard routes', () => {
    it.each(managerOnlyRoutes)('GET %s → 403 for user', async (route) => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.get(route);
      expect(res.status).toBe(403);
    });
  });

  describe('Unauthenticated gets 401 on all dashboard routes', () => {
    it.each(managerOnlyRoutes)('GET %s → 401 without auth', async (route) => {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
    });
  });

  // ── GET /summary ─────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/summary', () => {
    it('returns correct shape with 0 data', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/summary');
      expect(res.status).toBe(200);
      expect(typeof res.body.total_voc).toBe('number');
      expect(typeof res.body.unresolved).toBe('number');
      expect(typeof res.body.new_this_week).toBe('number');
      expect(typeof res.body.completed_this_week).toBe('number');
      expect(typeof res.body.resolution_rate).toBe('number');
      expect(typeof res.body.urgent_high_unresolved).toBe('number');
      expect(typeof res.body.overdue_14d).toBe('number');
    });

    it('counts increase after inserting a VOC', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/summary');
      expect(res.status).toBe(200);
      expect(res.body.total_voc).toBeGreaterThan(0);
    });
  });

  // ── GET /distribution ────────────────────────────────────────────────────────

  describe('GET /api/dashboard/distribution', () => {
    it('returns array for type=status', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/distribution?type=status');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('returns array for type=priority', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/distribution?type=priority');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('each item has label and count', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/distribution?type=status');
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        expect(typeof res.body[0].label).toBe('string');
        expect(typeof res.body[0].count).toBe('number');
      }
    });
  });

  // ── GET /priority-status-matrix ───────────────────────────────────────────────

  describe('GET /api/dashboard/priority-status-matrix', () => {
    it('returns rows array', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/priority-status-matrix');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(res.body.rows).toBeInstanceOf(Array);
    });

    it('each row has priority, status, count', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/priority-status-matrix');
      expect(res.status).toBe(200);
      if (res.body.rows.length > 0) {
        const row = res.body.rows[0];
        expect(typeof row.priority).toBe('string');
        expect(typeof row.status).toBe('string');
        expect(typeof row.count).toBe('number');
      }
    });
  });

  // ── GET /heatmap ─────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/heatmap', () => {
    it('returns rows and x_values for xAxis=status', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/heatmap?xAxis=status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('x_values');
      expect(res.body.rows).toBeInstanceOf(Array);
      expect(res.body.x_values).toBeInstanceOf(Array);
    });

    it('returns rows and x_values for xAxis=priority', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/heatmap?xAxis=priority');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('x_values');
    });
  });

  // ── GET /weekly-trend ─────────────────────────────────────────────────────────

  describe('GET /api/dashboard/weekly-trend', () => {
    it('returns weeks array', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/weekly-trend');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('weeks');
      expect(res.body.weeks).toBeInstanceOf(Array);
    });

    it('each week item has new, in_progress, completed', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/weekly-trend?weeks=4');
      expect(res.status).toBe(200);
      if (res.body.weeks.length > 0) {
        const w = res.body.weeks[0];
        expect(typeof w.new).toBe('number');
        expect(typeof w.in_progress).toBe('number');
        expect(typeof w.completed).toBe('number');
      }
    });
  });

  // ── GET /aging ────────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/aging', () => {
    it('returns { le7, d8to30, gt30 }', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/aging');
      expect(res.status).toBe(200);
      expect(typeof res.body.le7).toBe('number');
      expect(typeof res.body.d8to30).toBe('number');
      expect(typeof res.body.gt30).toBe('number');
    });

    it('new VOC appears in le7 bucket', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/aging');
      expect(res.status).toBe(200);
      expect(res.body.le7).toBeGreaterThan(0);
    });
  });

  // ── GET /aging-vocs ───────────────────────────────────────────────────────────

  describe('GET /api/dashboard/aging-vocs', () => {
    it('returns array', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/aging-vocs');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('each item has id, title, created_at, priority, status, system_id', async () => {
      await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/aging-vocs');
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        const item = res.body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('created_at');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('system_id');
      }
    });

    it('respects limit parameter', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/aging-vocs?limit=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(1);
    });
  });

  // ── GET /settings ─────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/settings', () => {
    it('returns settings object', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/settings');
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
    });
  });

  // ── GET /menus ────────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/menus', () => {
    it('returns menus for a systemId', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/dashboard/menus?systemId=${fixtures.systemId}`);
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 400 without systemId', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/menus');
      expect(res.status).toBe(400);
    });
  });

  // ── GET /assignees ────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/assignees', () => {
    it('returns active managers and admins', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/dashboard/assignees');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((u: { name: string }) => typeof u.name === 'string')).toBe(true);
    });
  });
});
