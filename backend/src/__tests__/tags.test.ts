import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Tags endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  async function insertTag(name: string, slug: string): Promise<string> {
    const result = await pool.query(`INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id`, [
      name,
      slug,
    ]);
    return result.rows[0].id as string;
  }

  async function insertVoc(authorId: string): Promise<string> {
    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
       VALUES ('Test VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
      [authorId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    return result.rows[0].id as string;
  }

  // ── GET /api/tags ────────────────────────────────────────────────────────────

  describe('GET /api/tags', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(401);
    });

    it('returns empty array when no tags', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('returns tags after inserting one', async () => {
      await insertTag('Alpha', 'alpha');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.some((t: { slug: string }) => t.slug === 'alpha')).toBe(true);
    });
  });

  // ── GET /api/vocs/:id/tags ───────────────────────────────────────────────────

  describe('GET /api/vocs/:id/tags', () => {
    it('returns tags for a VOC the user owns', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Beta', 'beta');
      await pool.query(`INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`, [
        vocId,
        tagId,
      ]);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}/tags`);
      expect(res.status).toBe(200);
      expect(res.body.some((t: { tag_id: string }) => t.tag_id === tagId)).toBe(true);
    });

    it("User gets 404 for another user's VOC tags", async () => {
      const vocId = await insertVoc(fixtures.adminId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}/tags`);
      expect(res.status).toBe(404);
    });

    it('Manager can access any VOC tags', async () => {
      const vocId = await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${vocId}/tags`);
      expect(res.status).toBe(200);
    });
  });

  // ── POST /api/vocs/:id/tags ──────────────────────────────────────────────────

  describe('POST /api/vocs/:id/tags', () => {
    it('Manager can add tag manually', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Gamma', 'gamma');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/tags`).send({ tag_id: tagId });
      expect(res.status).toBe(201);
      expect(res.body.tag_id).toBe(tagId);
    });

    it('User gets 403 when adding tag', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Delta', 'delta');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post(`/api/vocs/${vocId}/tags`).send({ tag_id: tagId });
      expect(res.status).toBe(403);
    });

    it('duplicate tag_id gets 409', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Epsilon', 'epsilon');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/tags`).send({ tag_id: tagId });
      const res = await agent.post(`/api/vocs/${vocId}/tags`).send({ tag_id: tagId });
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing tag_id', async () => {
      const vocId = await insertVoc(fixtures.userId);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/tags`).send({});
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/vocs/:id/tags/:tagId ────────────────────────────────────────

  describe('DELETE /api/vocs/:id/tags/:tagId', () => {
    it('Manager can remove tag', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Zeta', 'zeta');
      await pool.query(`INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`, [
        vocId,
        tagId,
      ]);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.delete(`/api/vocs/${vocId}/tags/${tagId}`);
      expect(res.status).toBe(204);
    });

    it('User gets 403 when removing tag', async () => {
      const vocId = await insertVoc(fixtures.userId);
      const tagId = await insertTag('Eta', 'eta');
      await pool.query(`INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`, [
        vocId,
        tagId,
      ]);

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.delete(`/api/vocs/${vocId}/tags/${tagId}`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/tag-rules ───────────────────────────────────────────────────────

  describe('GET /api/tag-rules', () => {
    it('Manager can list rules', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/tag-rules');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('User gets 403', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get('/api/tag-rules');
      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/tag-rules ──────────────────────────────────────────────────────

  describe('POST /api/tag-rules', () => {
    it('Manager can create rule', async () => {
      const tagId = await insertTag('RuleTag1', 'rule-tag-1');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/tag-rules').send({
        name: 'Test Rule',
        pattern: 'error',
        tag_id: tagId,
      });
      expect(res.status).toBe(201);
      expect(res.body.pattern).toBe('error');
    });

    it('User gets 403', async () => {
      const tagId = await insertTag('RuleTag2', 'rule-tag-2');

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/tag-rules').send({
        name: 'Test Rule',
        pattern: 'error',
        tag_id: tagId,
      });
      expect(res.status).toBe(403);
    });

    it('returns 400 for missing fields', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post('/api/tag-rules').send({ name: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/tag-rules/:id ─────────────────────────────────────────────────

  describe('PATCH /api/tag-rules/:id', () => {
    it('Manager can update rule', async () => {
      const tagId = await insertTag('RuleTag3', 'rule-tag-3');
      const ruleRes = await pool.query(
        `INSERT INTO tag_rules (name, pattern, tag_id) VALUES ('Old Name', 'old', $1) RETURNING id`,
        [tagId],
      );
      const ruleId = ruleRes.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.patch(`/api/tag-rules/${ruleId}`).send({ name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });
  });

  // ── DELETE /api/tag-rules/:id ────────────────────────────────────────────────

  describe('DELETE /api/tag-rules/:id', () => {
    it('Manager can delete rule', async () => {
      const tagId = await insertTag('RuleTag4', 'rule-tag-4');
      const ruleRes = await pool.query(
        `INSERT INTO tag_rules (name, pattern, tag_id) VALUES ('Del Rule', 'del', $1) RETURNING id`,
        [tagId],
      );
      const ruleId = ruleRes.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.delete(`/api/tag-rules/${ruleId}`);
      expect(res.status).toBe(204);
    });
  });

  // ── Auto-tagging ─────────────────────────────────────────────────────────────

  describe('Auto-tagging on VOC create', () => {
    it('creating a VOC with matching title triggers auto-tagging', async () => {
      const tagId = await insertTag('AutoTagBug', 'auto-tag-bug');
      await pool.query(
        `INSERT INTO tag_rules (name, pattern, tag_id, is_active) VALUES ('Bug rule', 'crash', $1, true)`,
        [tagId],
      );

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post('/api/vocs').send({
        title: 'App crash on login',
        body: 'Something went wrong',
        system_id: fixtures.systemId,
        menu_id: fixtures.menuId,
        voc_type_id: fixtures.vocTypeId,
      });

      expect(res.status).toBe(201);
      const vocId = res.body.id as string;

      const tagsRes = await pool.query(
        `SELECT * FROM voc_tags WHERE voc_id = $1 AND tag_id = $2 AND source = 'rule'`,
        [vocId, tagId],
      );
      expect(tagsRes.rowCount).toBeGreaterThan(0);
    });
  });
});
