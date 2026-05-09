/**
 * comments.test.ts — integration tests for comments routes (TDD, feature-voc.md §8.13).
 *
 * Mocks: repository/comments, repository/voc, services/notifications.
 * No real DB required.
 *
 * Cases:
 *  1. GET /api/vocs/:id/comments — happy path returns rows array.
 *  2. GET — non-existent VOC → 404 VOC_NOT_FOUND.
 *  3. POST — happy path (admin) → 201 + comment shape.
 *  4. POST — empty body `<p><br></p>` → 422 BODY_REQUIRED (service-level check).
 *  5. POST — empty string body → 422 BODY_REQUIRED (zod min(1) or service check).
 *  6. POST — body exceeding 16KB → 422 BODY_TOO_LARGE.
 *  7. POST → notifyOnComment called once with correct args.
 *  8. PATCH — author is allowed to update own comment → 200.
 *  9. PATCH — non-author non-admin → 403.
 * 10. PATCH — admin (non-author) → 200.
 * 11. PATCH — comment not found → 404.
 * 12. DELETE — author can delete own comment → 200 { ok: true }.
 * 13. DELETE — non-author non-admin → 403.
 * 14. DELETE — admin (non-author) → 200.
 * 15. DELETE — comment not found → 404.
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

jest.mock('../../repository/comments', () => ({
  listByVocId: jest.fn(),
  getById: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
}));
jest.mock('../../repository/voc', () => ({
  getVocById: jest.fn(),
}));
jest.mock('../../services/notifications', () => ({
  notifyOnComment: jest.fn(),
  notifyOnStatusChange: jest.fn(),
  notifyOnAssign: jest.fn(),
  listNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAllRead: jest.fn(),
  markOneRead: jest.fn(),
}));

import { commentsRouter } from '../comments';
import { errorHandler } from '../../middleware/errorHandler';
import * as commentRepo from '../../repository/comments';
import * as vocRepo from '../../repository/voc';
import * as notifService from '../../services/notifications';

const mockCommentRepo = commentRepo as jest.Mocked<typeof commentRepo>;
const mockVocRepo = vocRepo as jest.Mocked<typeof vocRepo>;
const mockNotifService = notifService as jest.Mocked<typeof notifService>;

const VOC_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const COMMENT_ID = 'bbbbbbbb-0000-4000-8000-000000000001';
const AUTHOR_ID = '00000000-0000-4000-8000-0000000000d1';
const ADMIN_ID = '00000000-0000-4000-8000-0000000000a1';
const OTHER_ID = '00000000-0000-4000-8000-0000000000e1';

const MOCK_VOC = {
  id: VOC_ID,
  author_id: AUTHOR_ID,
  assignee_id: null,
  deleted_at: null,
};

const MOCK_COMMENT = {
  id: COMMENT_ID,
  voc_id: VOC_ID,
  author_id: AUTHOR_ID,
  body: '<p>Hello</p>',
  created_at: '2026-05-10T00:00:00.000Z',
  updated_at: '2026-05-10T00:00:00.000Z',
};

type Role = 'admin' | 'manager' | 'dev' | 'user';

function makeApp(userId = AUTHOR_ID, role: Role = 'user') {
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
    (req.session as Record<string, unknown>).user = {
      id: userId,
      role,
      name: 'Mock User',
    };
    next();
  });
  // Mount with :id param so mergeParams works
  app.use('/api/vocs/:id/comments', commentsRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/vocs/:id/comments
// ---------------------------------------------------------------------------

describe('GET /api/vocs/:id/comments', () => {
  test('1. returns rows array on happy path', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.listByVocId.mockResolvedValue([MOCK_COMMENT]);

    const res = await request(makeApp()).get(`/api/vocs/${VOC_ID}/comments`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rows: [MOCK_COMMENT] });
    expect(mockCommentRepo.listByVocId).toHaveBeenCalledWith(VOC_ID);
  });

  test('2. non-existent VOC → 404 VOC_NOT_FOUND', async () => {
    mockVocRepo.getVocById.mockResolvedValue(null);

    const res = await request(makeApp()).get(`/api/vocs/${VOC_ID}/comments`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VOC_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// POST /api/vocs/:id/comments
// ---------------------------------------------------------------------------

describe('POST /api/vocs/:id/comments', () => {
  test('3. happy path (admin) → 201 + comment shape', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.insert.mockResolvedValue(MOCK_COMMENT);
    mockNotifService.notifyOnComment.mockResolvedValue({ inserted: true });

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .post(`/api/vocs/${VOC_ID}/comments`)
      .send({ body: '<p>Hello</p>' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({
      id: COMMENT_ID,
      voc_id: VOC_ID,
      body: '<p>Hello</p>',
    });
  });

  test('4. empty Toast UI body `<p><br></p>` → 422 BODY_REQUIRED', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);

    const res = await request(makeApp())
      .post(`/api/vocs/${VOC_ID}/comments`)
      .send({ body: '<p><br></p>' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('BODY_REQUIRED');
    expect(mockCommentRepo.insert).not.toHaveBeenCalled();
  });

  test('5. empty string body → 422 (zod min(1))', async () => {
    const res = await request(makeApp())
      .post(`/api/vocs/${VOC_ID}/comments`)
      .send({ body: '' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('BODY_REQUIRED');
  });

  test('6. body exceeding 16KB → 422 BODY_TOO_LARGE', async () => {
    // 16 385 bytes of 'a' — exceeds limit
    const bigBody = 'a'.repeat(16_385);
    const res = await request(makeApp())
      .post(`/api/vocs/${VOC_ID}/comments`)
      .send({ body: bigBody });

    expect(res.status).toBe(422);
  });

  test('7. POST success → notifyOnComment called with voc_id + actor_id', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.insert.mockResolvedValue(MOCK_COMMENT);
    mockNotifService.notifyOnComment.mockResolvedValue({ inserted: true });

    await request(makeApp(AUTHOR_ID, 'user'))
      .post(`/api/vocs/${VOC_ID}/comments`)
      .send({ body: '<p>Hello</p>' });

    expect(mockNotifService.notifyOnComment).toHaveBeenCalledTimes(1);
    expect(mockNotifService.notifyOnComment).toHaveBeenCalledWith({
      voc_id: VOC_ID,
      actor_id: AUTHOR_ID,
    });
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/vocs/:id/comments/:commentId
// ---------------------------------------------------------------------------

describe('PATCH /api/vocs/:id/comments/:commentId', () => {
  test('8. author can update own comment → 200', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);
    mockCommentRepo.update.mockResolvedValue({ ...MOCK_COMMENT, body: '<p>Updated</p>' });

    const res = await request(makeApp(AUTHOR_ID, 'user'))
      .patch(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`)
      .send({ body: '<p>Updated</p>' });

    expect(res.status).toBe(200);
    expect(res.body.comment.body).toBe('<p>Updated</p>');
  });

  test('9. non-author non-admin → 403', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    // Comment is authored by AUTHOR_ID, request is by OTHER_ID (user role)
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);

    const res = await request(makeApp(OTHER_ID, 'user'))
      .patch(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`)
      .send({ body: '<p>Updated</p>' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(mockCommentRepo.update).not.toHaveBeenCalled();
  });

  test('10. admin (non-author) can update any comment → 200', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);
    mockCommentRepo.update.mockResolvedValue({ ...MOCK_COMMENT, body: '<p>Admin edit</p>' });

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .patch(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`)
      .send({ body: '<p>Admin edit</p>' });

    expect(res.status).toBe(200);
  });

  test('11. comment not found → 404', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(null);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .patch(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`)
      .send({ body: '<p>Hello</p>' });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/vocs/:id/comments/:commentId
// ---------------------------------------------------------------------------

describe('DELETE /api/vocs/:id/comments/:commentId', () => {
  test('12. author can delete own comment → 200 { ok: true }', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);
    mockCommentRepo.deleteById.mockResolvedValue(true);

    const res = await request(makeApp(AUTHOR_ID, 'user'))
      .delete(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('13. non-author non-admin → 403', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);

    const res = await request(makeApp(OTHER_ID, 'user'))
      .delete(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(mockCommentRepo.deleteById).not.toHaveBeenCalled();
  });

  test('14. admin (non-author) can delete any comment → 200', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(MOCK_COMMENT);
    mockCommentRepo.deleteById.mockResolvedValue(true);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .delete(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('15. comment not found → 404', async () => {
    mockVocRepo.getVocById.mockResolvedValue(MOCK_VOC as never);
    mockCommentRepo.getById.mockResolvedValue(null);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .delete(`/api/vocs/${VOC_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(404);
  });
});
