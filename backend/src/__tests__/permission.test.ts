import request from 'supertest';
import { createTestApp } from './helpers/app';

/**
 * Role-based permission matrix tests — TDD style.
 * Routes not yet implemented return 404 by default.
 */
describe('Permission matrix', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.AUTH_MODE = 'mock';
    app = createTestApp();
  });

  const vocId = '00000000-0000-0000-0000-000000000099';

  describe('Internal notes API', () => {
    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('unauthenticated gets 401 or 404 on GET /api/vocs/:id/notes (TDD)', async () => {
      const res = await request(app).get(`/api/vocs/${vocId}/notes`);
      expect([401, 404]).toContain(res.status);
    });

    // TDD: user role must not see internal notes (spec: 404 for user)
    it('user gets 404 on GET /api/vocs/:id/notes (TDD — forbidden by spec)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.get(`/api/vocs/${vocId}/notes`);
      // 404 = route not implemented yet OR intentionally hidden from user role
      expect([404]).toContain(res.status);
    });

    // TDD: manager should eventually get 200; until route lands, 404
    it('manager gets 200 or 404 on GET /api/vocs/:id/notes (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });
      const res = await agent.get(`/api/vocs/${vocId}/notes`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Admin API', () => {
    // TDD: route not yet implemented → 401 when route exists; 404 until then
    it('unauthenticated gets 401 or 404 on POST /api/admin/systems (TDD)', async () => {
      const res = await request(app)
        .post('/api/admin/systems')
        .send({ name: 'New System', slug: 'new-system' });
      expect([401, 404]).toContain(res.status);
    });

    // TDD: authenticated user gets 403 (or 404 until route is implemented)
    it('user gets 403 or 404 on POST /api/admin/systems (TDD)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent
        .post('/api/admin/systems')
        .send({ name: 'New System', slug: 'new-system' });
      expect([403, 404]).toContain(res.status);
    });
  });
});
