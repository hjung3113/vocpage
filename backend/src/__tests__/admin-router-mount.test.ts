/**
 * FU-022 regression — admin-* router mount integration.
 *
 * All four admin routers are mounted under `/api/admin` simultaneously, as in
 * production (index.ts). Verify that router-level middleware in one router
 * does not intercept paths that belong to another router.
 *
 * Bug shape (pre-fix): `adminTrashRouter.use(requireAdmin())` and
 * `adminUsersRouter.use(requireAdmin())` fire for every `/api/admin/*`
 * request, so a manager hitting `/api/admin/masters/refresh` is 404'd by
 * adminTrashRouter before adminMastersRouter ever sees the request.
 *
 * Spec: feature-voc.md §8.3 — POST /api/admin/masters/refresh = manager+ ALLOW.
 */
import express from 'express';
import session from 'express-session';
import request from 'supertest';

process.env.AUTH_MODE = 'mock';

jest.mock('../services/admin/tag-master', () => ({
  listTags: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  createTag: jest.fn().mockResolvedValue({ id: 't1' }),
  renameTag: jest.fn().mockResolvedValue({ id: 't1' }),
  mergeTags: jest.fn().mockResolvedValue({ ok: true }),
  toggleExternal: jest.fn().mockResolvedValue({ id: 't1' }),
  deleteTag: jest.fn().mockResolvedValue({ ok: true }),
  suspendTagRule: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../services/admin/external-masters', () => ({
  getMasterStatus: jest.fn().mockReturnValue({ status: 'idle' }),
  triggerRefresh: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../services/admin/user-admin', () => ({
  listUsers: jest.fn().mockResolvedValue({ rows: [], page: 1, per_page: 20, total: 0 }),
  patchUser: jest.fn().mockResolvedValue({ id: 'u1' }),
}));

jest.mock('../repository/trash', () => ({
  listTrashedVocs: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  restoreVoc: jest.fn().mockResolvedValue({ id: 'v1' }),
  getRestoreLog: jest.fn().mockResolvedValue([]),
}));

import { adminTagsRouter } from '../routes/admin-tags';
import { adminTrashRouter } from '../routes/admin-trash';
import { adminMastersRouter } from '../routes/admin-masters';
import { adminUsersRouter } from '../routes/admin-users';
import { errorHandler } from '../middleware/errorHandler';

type Role = 'user' | 'dev' | 'manager' | 'admin';

const userByRole: Record<Role, object> = {
  admin: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000a01', role: 'admin', name: 'A', email: 'a@x' },
  manager: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000m01', role: 'manager', name: 'M', email: 'm@x' },
  dev: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000d01', role: 'dev', name: 'D', email: 'd@x' },
  user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000u01', role: 'user', name: 'U', email: 'u@x' },
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  // Same mount order as production index.ts.
  app.use('/api/admin', adminTagsRouter);
  app.use('/api/admin', adminTrashRouter);
  app.use('/api/admin', adminUsersRouter);
  app.use('/api/admin', adminMastersRouter);
  app.use(errorHandler);
  return app;
}

async function login(agent: ReturnType<typeof request.agent>, role: Role) {
  const u = userByRole[role] as { id: string; role: string; name: string; email: string };
  await agent.post('/__test__/login').send(u).expect(200);
}

function buildAppWithLogin() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  app.post('/__test__/login', (req, res) => {
    (req.session as unknown as { user: object }).user = req.body;
    res.json({ ok: true });
  });
  // attach req.user from session for downstream auth middleware
  app.use((req, _res, next) => {
    const u = (req.session as unknown as { user?: object }).user;
    if (u) (req as unknown as { user: object }).user = u;
    next();
  });
  app.use('/api/admin', adminTagsRouter);
  app.use('/api/admin', adminTrashRouter);
  app.use('/api/admin', adminUsersRouter);
  app.use('/api/admin', adminMastersRouter);
  app.use(errorHandler);
  return app;
}

describe('FU-022 — admin router mount integration', () => {
  describe('manager — adminTrash/adminUsers must not intercept other admin paths', () => {
    let agent: ReturnType<typeof request.agent>;
    beforeEach(async () => {
      agent = request.agent(buildAppWithLogin());
      await login(agent, 'manager');
    });

    it('POST /api/admin/masters/refresh → not 404 (gate ALLOW for manager)', async () => {
      const res = await agent.post('/api/admin/masters/refresh');
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(res.status).toBeLessThan(500);
    });

    it('GET /api/admin/masters/status → not 404 (gate ALLOW for manager)', async () => {
      const res = await agent.get('/api/admin/masters/status');
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(res.status).toBeLessThan(500);
    });

    it('GET /api/admin/tags → not 404 (gate ALLOW for manager)', async () => {
      const res = await agent.get('/api/admin/tags');
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('dev — adminTrash/adminUsers must not intercept dev-allowed admin paths', () => {
    let agent: ReturnType<typeof request.agent>;
    beforeEach(async () => {
      agent = request.agent(buildAppWithLogin());
      await login(agent, 'dev');
    });

    it('GET /api/admin/masters/status → not 404 (gate ALLOW for dev)', async () => {
      const res = await agent.get('/api/admin/masters/status');
      expect(res.status).not.toBe(404);
      expect(res.status).toBeLessThan(500);
    });

    it('GET /api/admin/tags → not 404 (gate ALLOW for dev)', async () => {
      const res = await agent.get('/api/admin/tags');
      expect(res.status).not.toBe(404);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('admin — own-router paths still work', () => {
    let agent: ReturnType<typeof request.agent>;
    beforeEach(async () => {
      agent = request.agent(buildAppWithLogin());
      await login(agent, 'admin');
    });

    it('GET /api/admin/vocs/trash → ALLOW for admin', async () => {
      const res = await agent.get('/api/admin/vocs/trash');
      expect(res.status).toBeLessThan(400);
    });

    it('GET /api/admin/users → ALLOW for admin', async () => {
      const res = await agent.get('/api/admin/users');
      expect(res.status).toBeLessThan(400);
    });
  });

  describe('non-admin — admin-only routes still 404 (existence-hide)', () => {
    it('manager → GET /api/admin/vocs/trash → 404', async () => {
      const agent = request.agent(buildAppWithLogin());
      await login(agent, 'manager');
      const res = await agent.get('/api/admin/vocs/trash');
      expect(res.status).toBe(404);
    });

    it('manager → GET /api/admin/users → 404', async () => {
      const agent = request.agent(buildAppWithLogin());
      await login(agent, 'manager');
      const res = await agent.get('/api/admin/users');
      expect(res.status).toBe(404);
    });
  });
});
