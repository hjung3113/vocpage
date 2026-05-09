/**
 * admin-tags.test.ts — TDD for Tag Master endpoints (W3-4)
 *
 * Permission matrix (ADR 0004 Option D):
 *   - GET    /api/admin/tags              : admin/manager/dev → 200, user → 403
 *   - POST   /api/admin/tags              : admin/manager → 201, dev/user → 403
 *   - PATCH  /api/admin/tags/:id          : admin/manager → 200, dev/user → 403
 *   - POST   /api/admin/tags/:id/merge    : admin → 200, manager/dev/user → 403
 *   - PATCH  /api/admin/tags/:id/external : admin → 200, manager/dev/user → 403
 *   - DELETE /api/admin/tags/:id          : admin → 200 (unused) / 409 (used); others → 403
 *   - PATCH  /api/admin/tag-rules/:id/suspend: admin → 200, manager/dev/user → 403
 *
 * Regression cases:
 *   - merge atomic: target not found → 404
 *   - merge atomic: source === target → 400
 *   - DELETE used tag → 409
 *   - POST duplicate name+kind → 409
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

// Import routers
import { adminTagsRouter } from '../admin-tags';
import { authRouter } from '../auth';

// Mock the service so tests do not touch DB
jest.mock('../../services/admin/tag-master', () => ({
  listTags: jest.fn(),
  createTag: jest.fn(),
  renameTag: jest.fn(),
  mergeTags: jest.fn(),
  toggleExternal: jest.fn(),
  deleteTag: jest.fn(),
  suspendTagRule: jest.fn(),
}));

import * as svc from '../../services/admin/tag-master';

const ADMIN_TAG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MANAGER_TAG_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TARGET_TAG_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RULE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const MOCK_TAG = {
  id: ADMIN_TAG_ID,
  name: 'TestTag',
  slug: 'test-tag',
  kind: 'general',
  is_external: false,
  usage_count: 0,
  rule_ref_count: 0,
  created_at: '2026-01-01T00:00:00.000Z',
};

function buildApp() {
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
  app.use('/api/admin', adminTagsRouter);
  return app;
}

/** Return a supertest agent pre-seeded with a session for the given role */
async function agentAs(role: 'admin' | 'manager' | 'dev' | 'user') {
  const app = buildApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

beforeEach(() => {
  jest.clearAllMocks();
  (svc.listTags as jest.Mock).mockResolvedValue({
    rows: [MOCK_TAG],
    page: 1,
    per_page: 20,
    total: 1,
  });
  (svc.createTag as jest.Mock).mockResolvedValue({ ...MOCK_TAG, id: MANAGER_TAG_ID });
  (svc.renameTag as jest.Mock).mockResolvedValue({ ...MOCK_TAG, name: 'Renamed' });
  (svc.mergeTags as jest.Mock).mockResolvedValue({ mergedCount: 1 });
  (svc.toggleExternal as jest.Mock).mockResolvedValue({ ...MOCK_TAG, is_external: true });
  (svc.deleteTag as jest.Mock).mockResolvedValue({ deleted: true });
  (svc.suspendTagRule as jest.Mock).mockResolvedValue({ id: RULE_ID, suspended_until: null });
});

// ─────────────────────────────────────────────
// GET /api/admin/tags — read: admin/manager/dev 200, user 403
// ─────────────────────────────────────────────
describe('GET /api/admin/tags', () => {
  test.each(['admin', 'manager', 'dev'] as const)('%s → 200', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.get('/api/admin/tags');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rows');
  });

  test('user → 403', async () => {
    const agent = await agentAs('user');
    const res = await agent.get('/api/admin/tags');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// POST /api/admin/tags — create: admin/manager 201, dev/user 403
// ─────────────────────────────────────────────
describe('POST /api/admin/tags', () => {
  test.each(['admin', 'manager'] as const)('%s → 201', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.post('/api/admin/tags').send({ name: 'NewTag', kind: 'general' });
    expect(res.status).toBe(201);
  });

  test.each(['dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.post('/api/admin/tags').send({ name: 'NewTag', kind: 'general' });
    expect(res.status).toBe(403);
  });

  test('duplicate name+kind → 409', async () => {
    (svc.createTag as jest.Mock).mockRejectedValue({ code: 'CONFLICT', message: 'duplicate' });
    const agent = await agentAs('admin');
    const res = await agent.post('/api/admin/tags').send({ name: 'DupTag', kind: 'general' });
    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/admin/tags/:id — rename: admin/manager 200, dev/user 403
// ─────────────────────────────────────────────
describe('PATCH /api/admin/tags/:id', () => {
  test.each(['admin', 'manager'] as const)('%s → 200', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.patch(`/api/admin/tags/${ADMIN_TAG_ID}`).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
  });

  test.each(['dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.patch(`/api/admin/tags/${ADMIN_TAG_ID}`).send({ name: 'Renamed' });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// POST /api/admin/tags/:id/merge — Admin only
// ─────────────────────────────────────────────
describe('POST /api/admin/tags/:id/merge', () => {
  test('admin → 200', async () => {
    const agent = await agentAs('admin');
    const res = await agent
      .post(`/api/admin/tags/${ADMIN_TAG_ID}/merge`)
      .send({ targetId: TARGET_TAG_ID });
    expect(res.status).toBe(200);
  });

  test.each(['manager', 'dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent
      .post(`/api/admin/tags/${ADMIN_TAG_ID}/merge`)
      .send({ targetId: TARGET_TAG_ID });
    expect(res.status).toBe(403);
  });

  // Regression: target not found → 404
  test('merge target not found → 404', async () => {
    (svc.mergeTags as jest.Mock).mockRejectedValue({
      code: 'NOT_FOUND',
      message: 'target tag not found',
    });
    const agent = await agentAs('admin');
    const res = await agent
      .post(`/api/admin/tags/${ADMIN_TAG_ID}/merge`)
      .send({ targetId: TARGET_TAG_ID });
    expect(res.status).toBe(404);
  });

  // Regression: source === target → 400
  test('merge source === target → 400', async () => {
    (svc.mergeTags as jest.Mock).mockRejectedValue({
      code: 'BAD_REQUEST',
      message: 'source and target must differ',
    });
    const agent = await agentAs('admin');
    const res = await agent
      .post(`/api/admin/tags/${ADMIN_TAG_ID}/merge`)
      .send({ targetId: ADMIN_TAG_ID });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/admin/tags/:id/external — Admin only
// ─────────────────────────────────────────────
describe('PATCH /api/admin/tags/:id/external', () => {
  test('admin → 200', async () => {
    const agent = await agentAs('admin');
    const res = await agent
      .patch(`/api/admin/tags/${ADMIN_TAG_ID}/external`)
      .send({ is_external: true });
    expect(res.status).toBe(200);
  });

  test.each(['manager', 'dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent
      .patch(`/api/admin/tags/${ADMIN_TAG_ID}/external`)
      .send({ is_external: true });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/admin/tags/:id — Admin only
// ─────────────────────────────────────────────
describe('DELETE /api/admin/tags/:id', () => {
  test('admin on unused tag → 200', async () => {
    const agent = await agentAs('admin');
    const res = await agent.delete(`/api/admin/tags/${ADMIN_TAG_ID}`);
    expect(res.status).toBe(200);
  });

  test.each(['manager', 'dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent.delete(`/api/admin/tags/${ADMIN_TAG_ID}`);
    expect(res.status).toBe(403);
  });

  // Regression: DELETE used tag → 409
  test('admin on used tag → 409', async () => {
    (svc.deleteTag as jest.Mock).mockRejectedValue({ code: 'CONFLICT', message: 'tag is in use' });
    const agent = await agentAs('admin');
    const res = await agent.delete(`/api/admin/tags/${ADMIN_TAG_ID}`);
    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/admin/tag-rules/:id/suspend — Admin only
// ─────────────────────────────────────────────
describe('PATCH /api/admin/tag-rules/:id/suspend', () => {
  test('admin → 200', async () => {
    const agent = await agentAs('admin');
    const res = await agent
      .patch(`/api/admin/tag-rules/${RULE_ID}/suspend`)
      .send({ suspended_until: null });
    expect(res.status).toBe(200);
  });

  test.each(['manager', 'dev', 'user'] as const)('%s → 403', async (role) => {
    const agent = await agentAs(role);
    const res = await agent
      .patch(`/api/admin/tag-rules/${RULE_ID}/suspend`)
      .send({ suspended_until: null });
    expect(res.status).toBe(403);
  });
});
