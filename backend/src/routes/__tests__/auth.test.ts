import request from 'supertest';
import express from 'express';
import session from 'express-session';

// Set AUTH_MODE before importing the router so createAuthMiddleware() sees it
process.env.AUTH_MODE = 'mock';

import { authRouter } from '../auth';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/mock-login', () => {
  test('returns 200 with user when role is valid', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/auth/mock-login').send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: '00000000-0000-4000-8000-0000000000a1',
      email: 'admin@company.com',
      name: 'Mock Admin',
      role: 'admin',
    });
  });

  test('returns 200 with dev user when role=dev', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/auth/mock-login').send({ role: 'dev' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: '00000000-0000-4000-8000-0000000000c1',
      email: 'dev@company.com',
      name: 'Mock Dev',
      role: 'dev',
    });
  });

  test('returns 400 when role is invalid', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/auth/mock-login').send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  test('returns 200 and clears session', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/mock-login').send({ role: 'user' });
    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 200 with user when session exists', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/mock-login').send({ role: 'manager' });
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: 'manager' });
  });

  test('returns 401 when no session', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
