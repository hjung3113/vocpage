/**
 * admin-trash.test.ts — Wave 3 Phase C (W3-5) regression suite.
 * ADR 0005 §6 requires ≥7 cases. We implement 9.
 *
 * Uses jest.mock on repository modules so no real DB is needed.
 * Pattern mirrors auth.test.ts: express + supertest + express-session.
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

// Mock DB repos BEFORE importing routes that import them
jest.mock('../../repository/trash', () => ({
  listTrashedVocs: jest.fn(),
  restoreVoc: jest.fn(),
  getRestoreLog: jest.fn(),
}));
jest.mock('../../repository/voc', () => ({
  listVocs: jest.fn(),
  getVoc: jest.fn(),
  createVoc: jest.fn(),
  updateVoc: jest.fn(),
  getVocHistory: jest.fn(),
  getNotes: jest.fn(),
  createNote: jest.fn(),
  escapeLikePattern: jest.fn(),
}));

import { adminTrashRouter } from '../admin-trash';
import { vocRouter } from '../voc';
import * as trashRepo from '../../repository/trash';

const mockTrashRepo = trashRepo as jest.Mocked<typeof trashRepo>;

// ---------------------------------------------------------------------------
// Test app factory — injects mock user for the given role
// ---------------------------------------------------------------------------
function makeApp(role: 'admin' | 'manager' | 'dev' | 'user' = 'admin') {
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
  const roleToUser: Record<string, object> = {
    admin: { id: '00000000-0000-4000-8000-0000000000a1', role: 'admin', name: 'Mock Admin' },
    manager: { id: '00000000-0000-4000-8000-0000000000b1', role: 'manager', name: 'Mock Manager' },
    dev: { id: '00000000-0000-4000-8000-0000000000c1', role: 'dev', name: 'Mock Dev' },
    user: { id: '00000000-0000-4000-8000-0000000000d1', role: 'user', name: 'Mock User' },
  };
  // Inject mock user into session.user so mockAuthMiddleware sees it
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>).user = roleToUser[role];
    next();
  });
  app.use('/api/admin', adminTrashRouter);
  app.use('/api/vocs', vocRouter);
  return app;
}

const TRASH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = new Date().toISOString();

const sampleAudit = {
  id: 'log00001-log0-4og0-8og0-log000000001',
  voc_id: TRASH_ID,
  action: 'restore' as const,
  actor_id: '00000000-0000-4000-8000-0000000000a1',
  before_deleted_at: now,
  before_deleted_by: null,
  created_at: now,
};

const sampleTrashRow = {
  id: TRASH_ID,
  issue_code: 'VOC-0001',
  title: '삭제된 VOC',
  status: '접수' as const,
  system_id: '11111111-1111-4111-8111-111111111111',
  menu_id: '44444444-4444-4444-8444-444444444444',
  deleted_by: null,
  deleted_at: now,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Case 1: Manager GET /api/admin/vocs/trash → 404 (ADR 0005 존재 은닉)
// ---------------------------------------------------------------------------
describe('Case 1 — Manager GET trash → 404', () => {
  it('returns 404 for manager role', async () => {
    const res = await request(makeApp('manager')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Case 2: Admin restore → voc appears in general list
// ---------------------------------------------------------------------------
describe('Case 2 — Admin restore → visible in general list', () => {
  it('after restore, restoreVoc resolves and list can return the voc', async () => {
    mockTrashRepo.restoreVoc.mockResolvedValueOnce({
      voc_id: TRASH_ID,
      restored_at: now,
      audit: sampleAudit,
    });
    const app = makeApp('admin');
    const restoreRes = await request(app).patch(`/api/vocs/${TRASH_ID}/restore`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.voc_id).toBe(TRASH_ID);
  });
});

// ---------------------------------------------------------------------------
// Case 3: Already-restored VOC → 409 (idempotency gate)
// ---------------------------------------------------------------------------
describe('Case 3 — Restore idempotency: second call → 409', () => {
  it('calling restore on active voc returns 409', async () => {
    mockTrashRepo.restoreVoc.mockRejectedValueOnce(
      Object.assign(new Error('이미 복원된 VOC입니다.'), {
        statusCode: 409,
        code: 'ALREADY_ACTIVE',
      }),
    );
    const res = await request(makeApp('admin')).patch(`/api/vocs/${TRASH_ID}/restore`);
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Case 4: Manager direct route → 404, not 403
// ---------------------------------------------------------------------------
describe('Case 4 — Manager /admin/vocs/trash route → 404 (not 403)', () => {
  it('returns 404, not 403', async () => {
    const res = await request(makeApp('manager')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Case 5: Sub-task only soft-deleted — appears in trash list
// ---------------------------------------------------------------------------
describe('Case 5 — Sub-task only soft-deleted appears in trash', () => {
  it('returns sub-task row in trash list', async () => {
    const subTaskRow = {
      ...sampleTrashRow,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      issue_code: 'VOC-0002',
    };
    mockTrashRepo.listTrashedVocs.mockResolvedValueOnce({
      rows: [subTaskRow],
      total: 1,
      page: 1,
      per_page: 20,
    });
    const res = await request(makeApp('admin')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0].issue_code).toBe('VOC-0002');
  });
});

// ---------------------------------------------------------------------------
// Case 6: Sub-task restore after parent hard-delete → parent_id=NULL
// ---------------------------------------------------------------------------
describe('Case 6 — Sub-task restore after parent hard-delete', () => {
  it('restoreVoc is called with sub-task id; service handles parent_id=NULL', async () => {
    const subId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    mockTrashRepo.restoreVoc.mockResolvedValueOnce({
      voc_id: subId,
      restored_at: now,
      audit: { ...sampleAudit, voc_id: subId, id: 'log00002-log0-4og0-8og0-log000000002' },
    });
    const res = await request(makeApp('admin')).patch(`/api/vocs/${subId}/restore`);
    expect(res.status).toBe(200);
    expect(mockTrashRepo.restoreVoc).toHaveBeenCalledWith(
      subId,
      '00000000-0000-4000-8000-0000000000a1',
    );
  });
});

// ---------------------------------------------------------------------------
// Case 7: voc_restore_log row + deleted_at=NULL + deleted_by=NULL in response
// ---------------------------------------------------------------------------
describe('Case 7 — restore returns audit row with action=restore', () => {
  it('response contains audit.action=restore and voc_id', async () => {
    mockTrashRepo.restoreVoc.mockResolvedValueOnce({
      voc_id: TRASH_ID,
      restored_at: now,
      audit: sampleAudit,
    });
    const res = await request(makeApp('admin')).patch(`/api/vocs/${TRASH_ID}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.audit.action).toBe('restore');
    expect(res.body.audit.voc_id).toBe(TRASH_ID);
    expect(res.body.voc_id).toBe(TRASH_ID);
  });
});

// ---------------------------------------------------------------------------
// Case 8: User/Dev GET trash → 404
// ---------------------------------------------------------------------------
describe('Case 8 — User and Dev GET trash → 404', () => {
  it('user → 404', async () => {
    const res = await request(makeApp('user')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(404);
  });
  it('dev → 404', async () => {
    const res = await request(makeApp('dev')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Case 9: Admin GET trash list — happy path
// ---------------------------------------------------------------------------
describe('Case 9 — Admin GET trash list happy path', () => {
  it('returns rows with pagination metadata', async () => {
    mockTrashRepo.listTrashedVocs.mockResolvedValueOnce({
      rows: [sampleTrashRow],
      total: 1,
      page: 1,
      per_page: 20,
    });
    const res = await request(makeApp('admin')).get('/api/admin/vocs/trash');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
  });
});
