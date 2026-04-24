import request from 'supertest';
import { createTestApp } from './helpers/app';

/**
 * Role-based permission matrix tests — TDD style.
 * Unimplemented routes are marked it.todo(). Concrete tests cover what IS implemented.
 */
describe('Permission matrix', () => {
  const vocId = '00000000-0000-0000-0000-000000000099';

  describe('Internal notes API', () => {
    it.todo('unauthenticated gets 401 on GET /api/vocs/:id/notes');

    // spec: user role must receive 404 — intentionally hidden, not just unimplemented
    it('user gets 404 on GET /api/vocs/:id/notes (spec-mandated hidden endpoint)', async () => {
      const app = createTestApp();
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.get(`/api/vocs/${vocId}/notes`);
      expect(res.status).toBe(404);
    });

    it.todo('manager gets 200 on GET /api/vocs/:id/notes');
    it.todo('admin gets 200 on GET /api/vocs/:id/notes');
  });

  describe('Admin API', () => {
    it.todo('unauthenticated gets 401 on POST /api/admin/systems');
    it.todo('user gets 403 on POST /api/admin/systems');
    it.todo('manager gets 403 on POST /api/admin/systems');
    it.todo('admin gets 201 on POST /api/admin/systems with valid body');
  });
});
