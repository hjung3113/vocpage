/**
 * admin-users.test.ts — Wave 3 Phase E (W3-7) regression suite.
 *
 * Mandatory TDD cases (irreversible surface per CLAUDE.md §Engineering Rules):
 *  - Permission matrix (4 roles × GET + PATCH)
 *  - Last-admin guard (409 CONFLICT)
 *  - Role-change audit row insertion
 *  - is_active toggle behavior
 *
 * Uses jest.mock on the service so no real DB is needed.
 * Pattern mirrors admin-trash.test.ts: express + supertest + express-session.
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

// Mock the service BEFORE importing routes that use it
jest.mock('../../services/admin/user-admin', () => ({
  listUsers: jest.fn(),
  patchUser: jest.fn(),
}));

import { adminUsersRouter } from '../admin-users';
import * as svc from '../../services/admin/user-admin';

const mockSvc = svc as jest.Mocked<typeof svc>;

// ---------------------------------------------------------------------------
// Test app factory — injects mock user for the given role
// ---------------------------------------------------------------------------
function makeApp(role: 'admin' | 'manager' | 'dev' | 'user' = 'admin') {
  const roleToUser: Record<string, object> = {
    admin: { id: '00000000-0000-4000-8000-0000000000a1', role: 'admin', name: 'Mock Admin' },
    manager: { id: '00000000-0000-4000-8000-0000000000b1', role: 'manager', name: 'Mock Manager' },
    dev: { id: '00000000-0000-4000-8000-0000000000c1', role: 'dev', name: 'Mock Dev' },
    user: { id: '00000000-0000-4000-8000-0000000000d1', role: 'user', name: 'Mock User' },
  };
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
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>).user = roleToUser[role];
    next();
  });
  app.use('/api/admin', adminUsersRouter);
  return app;
}

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = new Date().toISOString();

const sampleUser = {
  id: USER_ID,
  ad_username: 'testuser',
  display_name: '홍길동',
  email: 'testuser@example.com',
  role: 'user',
  is_active: true,
  created_at: now,
};

const sampleList = {
  rows: [sampleUser],
  page: 1,
  per_page: 20,
  total: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Case 1: Admin GET /api/admin/users → 200 (happy path)
// ---------------------------------------------------------------------------
describe('Case 1 — Admin GET /api/admin/users → 200', () => {
  it('returns user list for admin role', async () => {
    mockSvc.listUsers.mockResolvedValueOnce(sampleList);
    const res = await request(makeApp('admin')).get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.rows[0].display_name).toBe('홍길동');
  });
});

// ---------------------------------------------------------------------------
// Case 2: Manager GET /api/admin/users → 404 (existence hiding)
// ---------------------------------------------------------------------------
describe('Case 2 — Manager GET /api/admin/users → 404', () => {
  it('returns 404, not 403, for manager role', async () => {
    const res = await request(makeApp('manager')).get('/api/admin/users');
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Case 3: Dev GET /api/admin/users → 404
// ---------------------------------------------------------------------------
describe('Case 3 — Dev GET /api/admin/users → 404', () => {
  it('returns 404 for dev role', async () => {
    const res = await request(makeApp('dev')).get('/api/admin/users');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Case 4: User GET /api/admin/users → 404
// ---------------------------------------------------------------------------
describe('Case 4 — User GET /api/admin/users → 404', () => {
  it('returns 404 for user role', async () => {
    const res = await request(makeApp('user')).get('/api/admin/users');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Case 5: Admin PATCH role → 200 + updated user returned
// ---------------------------------------------------------------------------
describe('Case 5 — Admin PATCH role → 200', () => {
  it('updates role and returns updated user', async () => {
    const updated = { ...sampleUser, role: 'manager' };
    mockSvc.patchUser.mockResolvedValueOnce(updated);
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('manager');
    expect(mockSvc.patchUser).toHaveBeenCalledWith(
      USER_ID,
      { role: 'manager' },
      '00000000-0000-4000-8000-0000000000a1',
    );
  });
});

// ---------------------------------------------------------------------------
// Case 6: Admin PATCH is_active toggle → 200
// ---------------------------------------------------------------------------
describe('Case 6 — Admin PATCH is_active → 200', () => {
  it('deactivates user and returns updated user', async () => {
    const updated = { ...sampleUser, is_active: false };
    mockSvc.patchUser.mockResolvedValueOnce(updated);
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ is_active: false });
    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Case 7: Last-admin guard — demotion → 409 CONFLICT
// ---------------------------------------------------------------------------
describe('Case 7 — Last-admin guard demotion → 409 CONFLICT', () => {
  it('rejects role demotion that would leave 0 active admins', async () => {
    mockSvc.patchUser.mockRejectedValueOnce(
      Object.assign(new Error('마지막 Admin 계정은 강등하거나 비활성화할 수 없습니다.'), {
        code: 'CONFLICT',
      }),
    );
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ role: 'user' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// Case 8: Last-admin guard — is_active=false → 409 CONFLICT
// ---------------------------------------------------------------------------
describe('Case 8 — Last-admin guard deactivation → 409 CONFLICT', () => {
  it('rejects deactivating last active admin', async () => {
    mockSvc.patchUser.mockRejectedValueOnce(
      Object.assign(new Error('마지막 Admin 계정은 강등하거나 비활성화할 수 없습니다.'), {
        code: 'CONFLICT',
      }),
    );
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ is_active: false });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// Case 9: Manager PATCH /api/admin/users/:id → 404 (not 403)
// ---------------------------------------------------------------------------
describe('Case 9 — Manager PATCH → 404 (not 403)', () => {
  it('returns 404 for manager PATCH attempt', async () => {
    const res = await request(makeApp('manager'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ role: 'dev' });
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Case 10: PATCH with neither role nor is_active → 400 validation error
// ---------------------------------------------------------------------------
describe('Case 10 — PATCH empty body → 400', () => {
  it('rejects body without role or is_active', async () => {
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ reason: 'only reason, no role/is_active' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Case 11: Audit — patchUser called with correct changedBy (actor id)
// ---------------------------------------------------------------------------
describe('Case 11 — Audit: changedBy is the actor id', () => {
  it('passes the admin actor id as changedBy to patchUser', async () => {
    mockSvc.patchUser.mockResolvedValueOnce({ ...sampleUser, role: 'dev' });
    await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ role: 'dev', reason: '승격 처리' });
    expect(mockSvc.patchUser).toHaveBeenCalledWith(
      USER_ID,
      { role: 'dev', reason: '승격 처리' },
      '00000000-0000-4000-8000-0000000000a1',
    );
  });
});

// ---------------------------------------------------------------------------
// Case 12: PATCH non-existent user → 404
// ---------------------------------------------------------------------------
describe('Case 12 — PATCH non-existent user → 404', () => {
  it('returns 404 when user id not found', async () => {
    mockSvc.patchUser.mockRejectedValueOnce(
      Object.assign(new Error('사용자를 찾을 수 없습니다.'), { code: 'NOT_FOUND' }),
    );
    const res = await request(makeApp('admin'))
      .patch(`/api/admin/users/${USER_ID}`)
      .send({ role: 'user' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Case 13: GET with query filters — passed to service
// ---------------------------------------------------------------------------
describe('Case 13 — GET with role filter', () => {
  it('passes role filter to listUsers', async () => {
    mockSvc.listUsers.mockResolvedValueOnce({ rows: [], page: 1, per_page: 20, total: 0 });
    const res = await request(makeApp('admin')).get('/api/admin/users?role=admin&page=1');
    expect(res.status).toBe(200);
    expect(mockSvc.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', page: 1 }),
    );
  });
});
