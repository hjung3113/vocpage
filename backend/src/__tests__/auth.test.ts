import request from 'supertest';
import { createTestApp } from './helpers/app';

describe('auth endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.AUTH_MODE = 'mock';
    app = createTestApp();
  });

  describe('POST /api/auth/mock-login', () => {
    it('role=admin → 200 + user returned', async () => {
      const res = await request(app).post('/api/auth/mock-login').send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ role: 'admin' });
    });

    it('role=manager → 200 + user returned', async () => {
      const res = await request(app).post('/api/auth/mock-login').send({ role: 'manager' });
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ role: 'manager' });
    });

    it('role=user → 200 + user returned', async () => {
      const res = await request(app).post('/api/auth/mock-login').send({ role: 'user' });
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ role: 'user' });
    });

    it('invalid role → 400', async () => {
      const res = await request(app).post('/api/auth/mock-login').send({ role: 'superuser' });
      expect(res.status).toBe(400);
    });

    it('AUTH_MODE=oidc → 404', async () => {
      const oidcApp = createTestApp(undefined, 'oidc');
      const res = await request(oidcApp).post('/api/auth/mock-login').send({ role: 'admin' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not logged in', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns user after login', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ role: 'admin' });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 with ok:true after login', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      const res = await agent.post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('/me returns 401 after logout', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });
      await agent.post('/api/auth/logout');
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
