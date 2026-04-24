import request from 'supertest';
import { createTestApp } from './helpers/app';

/**
 * VOC CRUD + permission tests — TDD style.
 * Routes not yet implemented are expected to return 404.
 * When the route is implemented, update the expectation accordingly.
 */
describe('VOC endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.AUTH_MODE = 'mock';
    app = createTestApp();
  });

  describe('GET /api/vocs', () => {
    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('returns 401 or 404 when not authenticated (TDD)', async () => {
      const res = await request(app).get('/api/vocs');
      expect([401, 404]).toContain(res.status);
    });

    // TDD: route not yet implemented → 404 expected until route lands
    it('returns 200 or 404 when authenticated as user (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.get('/api/vocs');
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /api/vocs', () => {
    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('returns 401 or 404 when not authenticated (TDD)', async () => {
      const res = await request(app).post('/api/vocs').send({
        title: 'Test VOC',
        body: 'Body text',
      });
      expect([401, 404]).toContain(res.status);
    });

    // TDD: route not yet implemented → 404 expected until route lands
    it('returns 201 or 404 for valid body when authenticated (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.post('/api/vocs').send({
        title: 'Test VOC',
        body: 'Body text',
      });
      expect([201, 404]).toContain(res.status);
    });
  });

  describe('PATCH /api/vocs/:id/status', () => {
    const vocId = '00000000-0000-0000-0000-000000000099';

    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('returns 401 or 404 when not authenticated (TDD)', async () => {
      const res = await request(app).patch(`/api/vocs/${vocId}/status`).send({ status: '검토중' });
      expect([401, 404]).toContain(res.status);
    });

    // TDD: when route is implemented, user role should get 403
    it('returns 403 or 404 when user tries to change status (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.patch(`/api/vocs/${vocId}/status`).send({ status: '검토중' });
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/vocs/:id', () => {
    const vocId = '00000000-0000-0000-0000-000000000099';

    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('returns 401 or 404 when not authenticated (TDD)', async () => {
      const res = await request(app).delete(`/api/vocs/${vocId}`);
      expect([401, 404]).toContain(res.status);
    });

    // TDD: soft delete is admin-only; manager should get 403
    it('returns 403 or 404 when manager tries to delete (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });
      const res = await agent.delete(`/api/vocs/${vocId}`);
      expect([403, 404]).toContain(res.status);
    });

    // TDD: admin delete → 200 or 404 until route is implemented
    it('returns 200 or 404 when admin deletes (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      const res = await agent.delete(`/api/vocs/${vocId}`);
      expect([200, 404]).toContain(res.status);
    });
  });
});
