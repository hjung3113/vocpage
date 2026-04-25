import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Notices & FAQs endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;
  let categoryId: string;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);

    // Create a default FAQ category for all FAQ tests
    const catResult = await pool.query(
      `INSERT INTO faq_categories (name, slug, sort_order) VALUES ('General', 'general', 0) RETURNING id`,
    );
    categoryId = catResult.rows[0].id as string;
  });

  // ── GET /api/notices ───────────────────────────────────────────────────────

  describe('GET /api/notices', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/notices');
      expect(res.status).toBe(401);
    });

    it('User only sees visible/active notices', async () => {
      // Insert a visible notice
      await pool.query(
        `INSERT INTO notices (title, body, level, is_visible, author_id)
         VALUES ('Visible Notice', '<p>body</p>', 'normal', true, $1)`,
        [fixtures.adminId],
      );
      // Insert a hidden notice
      await pool.query(
        `INSERT INTO notices (title, body, level, is_visible, author_id)
         VALUES ('Hidden Notice', '<p>body</p>', 'normal', false, $1)`,
        [fixtures.adminId],
      );

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/notices');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      for (const n of res.body.data as Array<{ is_visible: boolean }>) {
        expect(n.is_visible).toBe(true);
      }
    });

    it('Manager sees all non-deleted notices including hidden', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/notices');
      expect(res.status).toBe(200);
      // Should include both visible and hidden
      const titles = (res.body.data as Array<{ title: string }>).map((n) => n.title);
      expect(titles).toContain('Hidden Notice');
    });
  });

  // ── GET /api/notices/popup ─────────────────────────────────────────────────

  describe('GET /api/notices/popup', () => {
    it('returns only popup-enabled active notices', async () => {
      await pool.query(
        `INSERT INTO notices (title, body, level, is_popup, is_visible, author_id)
         VALUES ('Popup Notice', '<p>popup</p>', 'urgent', true, true, $1)`,
        [fixtures.adminId],
      );
      await pool.query(
        `INSERT INTO notices (title, body, level, is_popup, is_visible, author_id)
         VALUES ('Non-Popup Notice', '<p>nope</p>', 'normal', false, true, $1)`,
        [fixtures.adminId],
      );

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/notices/popup');
      expect(res.status).toBe(200);
      expect(res.body.notices).toBeInstanceOf(Array);
      for (const n of res.body.notices as Array<{ is_popup: boolean }>) {
        expect(n.is_popup).toBe(true);
      }
    });
  });

  // ── POST /api/notices ──────────────────────────────────────────────────────

  describe('POST /api/notices', () => {
    it('User gets 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/notices').send({ title: 'Test', body: '<p>body</p>' });
      expect(res.status).toBe(403);
    });

    it('Manager can create a notice → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/notices').send({
        title: 'Manager Notice',
        body: '<p>hello</p>',
        level: 'important',
      });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Manager Notice');
      expect(res.body.level).toBe('important');
      expect(res.body.author_id).toBe(fixtures.managerId);
    });

    it('returns 400 for missing required fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/notices').send({ title: 'No body' });
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/notices/:id ─────────────────────────────────────────────────

  describe('PATCH /api/notices/:id', () => {
    let noticeId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO notices (title, body, level, is_visible, author_id)
         VALUES ('Patch Target', '<p>original</p>', 'normal', true, $1) RETURNING id`,
        [fixtures.adminId],
      );
      noticeId = result.rows[0].id as string;
    });

    it('Manager can update fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .patch(`/api/notices/${noticeId}`)
        .send({ title: 'Updated Title', level: 'urgent' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.level).toBe('urgent');
    });
  });

  // ── DELETE /api/notices/:id ────────────────────────────────────────────────

  describe('DELETE /api/notices/:id', () => {
    let noticeId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO notices (title, body, level, is_visible, author_id)
         VALUES ('Delete Target', '<p>body</p>', 'normal', true, $1) RETURNING id`,
        [fixtures.adminId],
      );
      noticeId = result.rows[0].id as string;
    });

    it('User gets 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.delete(`/api/notices/${noticeId}`);
      expect(res.status).toBe(403);
    });

    it('Manager soft-deletes → 204', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.delete(`/api/notices/${noticeId}`);
      expect(res.status).toBe(204);

      const check = await pool.query(`SELECT deleted_at FROM notices WHERE id = $1`, [noticeId]);
      expect(check.rows[0].deleted_at).not.toBeNull();
    });
  });

  // ── POST /api/notices/:id/restore ──────────────────────────────────────────

  describe('POST /api/notices/:id/restore', () => {
    let noticeId: string;

    beforeEach(async () => {
      const result = await pool.query(
        `INSERT INTO notices (title, body, level, is_visible, author_id, deleted_at)
         VALUES ('Restore Target', '<p>body</p>', 'normal', true, $1, NOW()) RETURNING id`,
        [fixtures.adminId],
      );
      noticeId = result.rows[0].id as string;
    });

    it('Manager gets 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/notices/${noticeId}/restore`);
      expect(res.status).toBe(403);
    });

    it('Admin can restore → deleted_at is null', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent.post(`/api/notices/${noticeId}/restore`);
      expect(res.status).toBe(200);
      expect(res.body.deleted_at).toBeNull();
    });
  });

  // ── GET /api/faqs ──────────────────────────────────────────────────────────

  describe('GET /api/faqs', () => {
    beforeAll(async () => {
      await pool.query(
        `INSERT INTO faqs (question, answer, category_id, is_visible, sort_order, author_id)
         VALUES
           ('Visible FAQ', '<p>ans</p>', $1, true, 0, $2),
           ('Hidden FAQ', '<p>ans</p>', $1, false, 1, $2)`,
        [categoryId, fixtures.adminId],
      );
    });

    it('User sees only visible FAQs', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/faqs');
      expect(res.status).toBe(200);
      for (const f of res.body.data as Array<{ is_visible: boolean }>) {
        expect(f.is_visible).toBe(true);
      }
    });

    it('Manager sees all non-deleted FAQs', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/faqs');
      expect(res.status).toBe(200);
      const questions = (res.body.data as Array<{ question: string }>).map((f) => f.question);
      expect(questions).toContain('Hidden FAQ');
    });
  });

  // ── POST /api/faqs ─────────────────────────────────────────────────────────

  describe('POST /api/faqs', () => {
    it('Manager can create FAQ with category → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/faqs').send({
        question: 'What is VOC?',
        answer: '<p>Voice of Customer</p>',
        category_id: categoryId,
      });
      expect(res.status).toBe(201);
      expect(res.body.question).toBe('What is VOC?');
      expect(res.body.category_id).toBe(categoryId);
      expect(res.body.author_id).toBe(fixtures.managerId);
    });

    it('User gets 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/faqs').send({
        question: 'Q?',
        answer: '<p>A</p>',
        category_id: categoryId,
      });
      expect(res.status).toBe(403);
    });

    it('returns 400 for missing required fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/faqs').send({ question: 'Only question' });
      expect(res.status).toBe(400);
    });
  });
});
