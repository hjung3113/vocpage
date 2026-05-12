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
 *   - PATCH  /api/admin/tags/:tagId/rules/:ruleId/suspend: admin → 200, manager/dev/user → 403
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
  listTagRules: jest.fn(),
  createTagRule: jest.fn(),
  updateTagRule: jest.fn(),
  deleteTagRule: jest.fn(),
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
  (svc.listTagRules as jest.Mock).mockResolvedValue({
    rows: [],
    page: 1,
    per_page: 20,
    total: 0,
  });
  (svc.createTagRule as jest.Mock).mockImplementation(
    async (_tagId: string, _input: unknown, user: { id: string; name: string }) => ({
      id: RULE_ID,
      tag_id: ADMIN_TAG_ID,
      kind: 'general',
      keywords: ['kw'],
      match_mode: 'keyword',
      suspended_until: null,
      created_by: user.id,
      created_by_name: user.name,
      created_at: '2026-01-01T00:00:00.000Z',
    }),
  );
  (svc.updateTagRule as jest.Mock).mockResolvedValue({
    id: RULE_ID,
    tag_id: ADMIN_TAG_ID,
    kind: 'general',
    keywords: ['kw'],
    match_mode: 'keyword',
    suspended_until: null,
    created_by: null,
    created_by_name: null,
    created_at: '2026-01-01T00:00:00.000Z',
  });
  (svc.deleteTagRule as jest.Mock).mockResolvedValue(undefined);
  (svc.suspendTagRule as jest.Mock).mockResolvedValue({
    id: RULE_ID,
    tag_id: ADMIN_TAG_ID,
    kind: 'general',
    keywords: ['kw'],
    match_mode: 'keyword',
    suspended_until: null,
    created_by: null,
    created_by_name: null,
    created_at: '2026-01-01T00:00:00.000Z',
  });
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
// tag rules CRUD — D-13 permission matrix (5 routes × 4 roles)
// Plan 01-04 / threats T-01-07 (matrix), T-01-08 (IDOR), T-01-09 (created_by injection),
// T-01-10 (route order /suspend before /:ruleId).
// ─────────────────────────────────────────────
describe('tag rules CRUD — D-13 permission matrix', () => {
  type Method = 'get' | 'post' | 'patch' | 'delete';
  type Role = 'admin' | 'manager' | 'dev' | 'user';
  type Case = {
    label: string;
    method: Method;
    path: (t: string, r: string) => string;
    body?: unknown;
    ok: readonly Role[];
    okStatus: number;
    deny: readonly Role[];
  };

  const cases: readonly Case[] = [
    {
      label: 'GET    /tags/:tagId/rules',
      method: 'get',
      path: (t) => `/api/admin/tags/${t}/rules`,
      ok: ['admin', 'manager', 'dev'],
      okStatus: 200,
      deny: ['user'],
    },
    {
      label: 'POST   /tags/:tagId/rules',
      method: 'post',
      path: (t) => `/api/admin/tags/${t}/rules`,
      body: { keywords: ['kw'], match_mode: 'keyword' },
      ok: ['admin', 'manager'],
      okStatus: 201,
      deny: ['dev', 'user'],
    },
    {
      label: 'PATCH  /tags/:tagId/rules/:ruleId',
      method: 'patch',
      path: (t, r) => `/api/admin/tags/${t}/rules/${r}`,
      body: { keywords: ['kw2'] },
      ok: ['admin', 'manager'],
      okStatus: 200,
      deny: ['dev', 'user'],
    },
    {
      label: 'DELETE /tags/:tagId/rules/:ruleId',
      method: 'delete',
      path: (t, r) => `/api/admin/tags/${t}/rules/${r}`,
      ok: ['admin'],
      okStatus: 204,
      deny: ['manager', 'dev', 'user'],
    },
    {
      label: 'PATCH  /tags/:tagId/rules/:ruleId/suspend',
      method: 'patch',
      path: (t, r) => `/api/admin/tags/${t}/rules/${r}/suspend`,
      body: { suspended_until: null },
      ok: ['admin'],
      okStatus: 200,
      deny: ['manager', 'dev', 'user'],
    },
  ] as const;

  for (const c of cases) {
    describe(c.label, () => {
      for (const role of c.ok) {
        test(`${role} → ${c.okStatus}`, async () => {
          const agent = await agentAs(role);
          const url = c.path(ADMIN_TAG_ID, RULE_ID);
          const req = c.body ? agent[c.method](url).send(c.body) : agent[c.method](url);
          const res = await req;
          expect(res.status).toBe(c.okStatus);
        });
      }
      for (const role of c.deny) {
        test(`${role} → 403`, async () => {
          const agent = await agentAs(role);
          const url = c.path(ADMIN_TAG_ID, RULE_ID);
          const req = c.body ? agent[c.method](url).send(c.body) : agent[c.method](url);
          const res = await req;
          expect(res.status).toBe(403);
        });
      }
    });
  }
});

// ─────────────────────────────────────────────
// T-01-09 — created_by injection ignored (server reads req.user.id)
// ─────────────────────────────────────────────
describe('POST /api/admin/tags/:tagId/rules — created_by IDOR injection (T-01-09)', () => {
  test('attacker-supplied created_by is IGNORED; server uses authenticated user.id', async () => {
    const ATTACKER_UUID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const agent = await agentAs('admin');
    const res = await agent
      .post(`/api/admin/tags/${ADMIN_TAG_ID}/rules`)
      // body smuggles created_by — zod schema OMITS it (Plan 03), express strips,
      // and even if it slipped through, the service receives a 3rd-arg user from req.user.
      .send({ keywords: ['kw'], match_mode: 'keyword', created_by: ATTACKER_UUID });
    expect(res.status).toBe(201);

    const callArgs = (svc.createTagRule as jest.Mock).mock.calls[0];
    const tagIdArg = callArgs[0];
    const inputArg = callArgs[1];
    const userArg = callArgs[2];
    expect(tagIdArg).toBe(ADMIN_TAG_ID);
    expect(inputArg).not.toHaveProperty('created_by');
    expect(userArg).toBeDefined();
    expect(userArg.role).toBe('admin');
    // Response reflects the authenticated user (mock echoes user.id back), NOT the attacker UUID.
    expect(res.body.created_by).toBe(userArg.id);
    expect(res.body.created_by).not.toBe(ATTACKER_UUID);
  });
});

// ─────────────────────────────────────────────
// T-01-08 — IDOR: tag_id mismatch on PATCH/DELETE/suspend → 404
// ─────────────────────────────────────────────
describe('tag rules IDOR — wrong tag scope (T-01-08)', () => {
  const WRONG_TAG = MANAGER_TAG_ID;

  test('PATCH /tags/<wrong-tag>/rules/<ruleId> → 404 when rule belongs to a different tag', async () => {
    (svc.updateTagRule as jest.Mock).mockRejectedValue({
      code: 'NOT_FOUND',
      message: '태그 규칙을 찾을 수 없습니다.',
    });
    const agent = await agentAs('admin');
    const res = await agent
      .patch(`/api/admin/tags/${WRONG_TAG}/rules/${RULE_ID}`)
      .send({ keywords: ['kw'] });
    expect(res.status).toBe(404);
  });

  test('DELETE /tags/<wrong-tag>/rules/<ruleId> → 404 (IDOR)', async () => {
    (svc.deleteTagRule as jest.Mock).mockRejectedValue({
      code: 'NOT_FOUND',
      message: '태그 규칙을 찾을 수 없습니다.',
    });
    const agent = await agentAs('admin');
    const res = await agent.delete(`/api/admin/tags/${WRONG_TAG}/rules/${RULE_ID}`);
    expect(res.status).toBe(404);
  });

  test('PATCH /tags/<wrong-tag>/rules/<ruleId>/suspend → 404 (IDOR)', async () => {
    (svc.suspendTagRule as jest.Mock).mockRejectedValue({
      code: 'NOT_FOUND',
      message: '태그 규칙을 찾을 수 없습니다.',
    });
    const agent = await agentAs('admin');
    const res = await agent
      .patch(`/api/admin/tags/${WRONG_TAG}/rules/${RULE_ID}/suspend`)
      .send({ suspended_until: null });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// T-01-10 — Express route order: /suspend body shape vs plain PATCH body shape
// ─────────────────────────────────────────────
describe('tag rules route order (T-01-10)', () => {
  test('PATCH /:ruleId/suspend hits suspend handler (not the plain :ruleId PATCH)', async () => {
    const agent = await agentAs('admin');
    await agent
      .patch(`/api/admin/tags/${ADMIN_TAG_ID}/rules/${RULE_ID}/suspend`)
      .send({ suspended_until: '2030-01-01T00:00:00+09:00' });
    expect((svc.suspendTagRule as jest.Mock).mock.calls.length).toBe(1);
    expect((svc.updateTagRule as jest.Mock).mock.calls.length).toBe(0);
  });

  test('PATCH /:ruleId (no /suspend) hits update handler (not suspend)', async () => {
    const agent = await agentAs('admin');
    await agent.patch(`/api/admin/tags/${ADMIN_TAG_ID}/rules/${RULE_ID}`).send({ keywords: ['kw'] });
    expect((svc.updateTagRule as jest.Mock).mock.calls.length).toBe(1);
    expect((svc.suspendTagRule as jest.Mock).mock.calls.length).toBe(0);
  });
});
