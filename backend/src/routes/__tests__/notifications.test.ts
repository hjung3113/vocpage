/**
 * notifications.test.ts — Wave 5 Phase A regression suite (TDD 1~4).
 *
 * Cases:
 *   1. GET /api/notifications — DTO shape (label/href/voc_X/isUrgent), lazy
 *      trim is invoked, items mapped from joined repo rows.
 *   2. GET /api/notifications/unread-count — ETag header set; If-None-Match
 *      with same etag returns 304 (no body); changing state changes etag.
 *   3. notifyOn{Comment,StatusChange,Assign} — 5-minute debounce gate
 *      (W5-D3): when `hasRecentNotification` returns true, `insertNotification`
 *      is NOT called.
 *   4. listNotifications calls lazyTrim before listing (W5-D4 lazy trim
 *      contract).
 *
 * Pattern: jest.mock the repository so no real DB is needed (mirrors
 *   admin-trash.test.ts).
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

jest.mock('../../repository/notifications', () => ({
  hasRecentNotification: jest.fn(),
  insertNotification: jest.fn(),
  lazyTrim: jest.fn(),
  listForUser: jest.fn(),
  unreadSummaryForUser: jest.fn(),
  markAllRead: jest.fn(),
  markOneRead: jest.fn(),
  getUserRole: jest.fn(),
}));
jest.mock('../../repository/voc', () => ({
  getVocById: jest.fn(),
}));

import { notificationsRouter } from '../notifications';
import * as notifRepo from '../../repository/notifications';
import * as vocRepo from '../../repository/voc';
import * as notifService from '../../services/notifications';

const mockNotifRepo = notifRepo as jest.Mocked<typeof notifRepo>;
const mockVocRepo = vocRepo as jest.Mocked<typeof vocRepo>;

const USER_ID = '00000000-0000-4000-8000-0000000000d1';
const VOC_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

function makeApp() {
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
      id: USER_ID,
      role: 'user',
      name: 'Mock User',
    };
    next();
  });
  app.use('/api/notifications', notificationsRouter);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// TDD-1: GET /api/notifications — DTO shape + lazy trim invoked
// ---------------------------------------------------------------------------

describe('GET /api/notifications (TDD-1)', () => {
  test('maps repo rows to DTO with isUrgent + voc_* + label/href', async () => {
    mockNotifRepo.lazyTrim.mockResolvedValue();
    mockNotifRepo.listForUser.mockResolvedValue([
      {
        id: 'ffffffff-0000-4000-8000-000000000001',
        user_id: USER_ID,
        type: 'assigned',
        voc_id: VOC_ID,
        read_at: null,
        created_at: '2026-05-09T00:00:00.000Z',
        voc_issue_code: 'ANALYSIS-2026-0001',
        voc_title: 'Title 1',
        voc_priority: 'urgent',
      },
      {
        id: 'ffffffff-0000-4000-8000-000000000002',
        user_id: USER_ID,
        type: 'comment',
        voc_id: VOC_ID,
        read_at: '2026-05-09T01:00:00.000Z',
        created_at: '2026-05-09T00:30:00.000Z',
        voc_issue_code: 'ANALYSIS-2026-0001',
        voc_title: 'Title 1',
        voc_priority: 'medium',
      },
    ]);

    const res = await request(makeApp()).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(mockNotifRepo.lazyTrim).toHaveBeenCalledWith(USER_ID);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({
      id: 'ffffffff-0000-4000-8000-000000000001',
      type: 'assigned',
      voc_id: VOC_ID,
      voc_issue_code: 'ANALYSIS-2026-0001',
      voc_title: 'Title 1',
      isUrgent: true,
      read: false,
      href: `/voc/${VOC_ID}`,
    });
    expect(res.body.items[0].label).toContain('ANALYSIS-2026-0001');
    expect(res.body.items[1].isUrgent).toBe(false);
    expect(res.body.items[1].read).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TDD-2: GET /api/notifications/unread-count — ETag/304
// ---------------------------------------------------------------------------

describe('GET /api/notifications/unread-count (TDD-2)', () => {
  test('returns count + ETag, 200 on first call', async () => {
    mockNotifRepo.unreadSummaryForUser.mockResolvedValue({
      count: 3,
      latest_id: 'ffffffff-0000-4000-8000-000000000099',
      latest_created_at: '2026-05-09T00:00:00.000Z',
    });
    const res = await request(makeApp()).get('/api/notifications/unread-count');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 3 });
    expect(res.headers.etag).toBeTruthy();
  });

  test('returns 304 when If-None-Match matches', async () => {
    mockNotifRepo.unreadSummaryForUser.mockResolvedValue({
      count: 3,
      latest_id: 'ffffffff-0000-4000-8000-000000000099',
      latest_created_at: '2026-05-09T00:00:00.000Z',
    });
    const r1 = await request(makeApp()).get('/api/notifications/unread-count');
    const etag = r1.headers.etag as string;
    const r2 = await request(makeApp())
      .get('/api/notifications/unread-count')
      .set('If-None-Match', etag);
    expect(r2.status).toBe(304);
    expect(r2.text).toBe('');
  });

  test('etag changes when count or latest unread changes', async () => {
    mockNotifRepo.unreadSummaryForUser.mockResolvedValueOnce({
      count: 3,
      latest_id: 'a',
      latest_created_at: '2026-05-09T00:00:00.000Z',
    });
    const r1 = await request(makeApp()).get('/api/notifications/unread-count');
    mockNotifRepo.unreadSummaryForUser.mockResolvedValueOnce({
      count: 4,
      latest_id: 'b',
      latest_created_at: '2026-05-09T00:01:00.000Z',
    });
    const r2 = await request(makeApp()).get('/api/notifications/unread-count');
    expect(r1.headers.etag).not.toBe(r2.headers.etag);
  });

  test('zero unread → distinct ETag (markAllRead transition not masked)', async () => {
    mockNotifRepo.unreadSummaryForUser.mockResolvedValueOnce({
      count: 0,
      latest_id: null,
      latest_created_at: null,
    });
    const r1 = await request(makeApp()).get('/api/notifications/unread-count');
    expect(r1.body).toEqual({ count: 0 });
    expect(r1.headers.etag).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TDD-3: 5-minute debounce gate (W5-D3) for all three triggers
// ---------------------------------------------------------------------------

describe('notify* recipients + debounce (TDD-3)', () => {
  const ACTOR = '00000000-0000-4000-8000-0000000000c1';
  const AUTHOR = USER_ID;
  const ASSIGNEE = '00000000-0000-4000-8000-0000000000b1';

  beforeEach(() => {
    mockVocRepo.getVocById.mockResolvedValue({
      id: VOC_ID,
      author_id: AUTHOR,
      assignee_id: ASSIGNEE,
      deleted_at: null,
    } as never);
    mockNotifRepo.insertNotification.mockResolvedValue({
      id: 'x',
      created_at: '2026-05-09T00:00:00Z',
    });
    // default: every recipient is non-User (visible to internal notes)
    mockNotifRepo.getUserRole.mockResolvedValue('manager');
  });

  // ─── notifyOnStatusChange — author + assignee ─────────────────────────
  test('notifyOnStatusChange → notifies BOTH author and assignee (spec §3 line 52)', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(false);
    const result = await notifService.notifyOnStatusChange({ voc_id: VOC_ID, actor_id: ACTOR });
    expect(result.inserted).toBe(true);
    const userIds = mockNotifRepo.insertNotification.mock.calls.map((c) => c[0].user_id).sort();
    expect(userIds).toEqual([ASSIGNEE, AUTHOR].sort());
    expect(
      mockNotifRepo.insertNotification.mock.calls.every((c) => c[0].type === 'status_change'),
    ).toBe(true);
  });

  test('notifyOnStatusChange → actor (assignee) excluded; only author notified', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(false);
    await notifService.notifyOnStatusChange({ voc_id: VOC_ID, actor_id: ASSIGNEE });
    expect(mockNotifRepo.insertNotification).toHaveBeenCalledTimes(1);
    expect(mockNotifRepo.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: AUTHOR, type: 'status_change' }),
    );
  });

  test('notifyOnStatusChange → debounce blocks all recipients', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(true);
    const result = await notifService.notifyOnStatusChange({ voc_id: VOC_ID, actor_id: ACTOR });
    expect(result.inserted).toBe(false);
    expect(mockNotifRepo.insertNotification).not.toHaveBeenCalled();
  });

  test('notifyOnStatusChange → null assignee → author only', async () => {
    mockVocRepo.getVocById.mockResolvedValueOnce({
      id: VOC_ID,
      author_id: AUTHOR,
      assignee_id: null,
      deleted_at: null,
    } as never);
    mockNotifRepo.hasRecentNotification.mockResolvedValue(false);
    await notifService.notifyOnStatusChange({ voc_id: VOC_ID, actor_id: ACTOR });
    expect(mockNotifRepo.insertNotification).toHaveBeenCalledTimes(1);
    expect(mockNotifRepo.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: AUTHOR }),
    );
  });

  // ─── notifyOnComment — author + assignee (public surface, no role filter) ─
  test('notifyOnComment → author+assignee both notified', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(false);
    await notifService.notifyOnComment({ voc_id: VOC_ID, actor_id: ACTOR });
    const userIds = mockNotifRepo.insertNotification.mock.calls.map((c) => c[0].user_id).sort();
    expect(userIds).toEqual([ASSIGNEE, AUTHOR].sort());
  });

  test('notifyOnComment → no insert when debounce window hits', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(true);
    const result = await notifService.notifyOnComment({ voc_id: VOC_ID, actor_id: ACTOR });
    expect(result.inserted).toBe(false);
    expect(mockNotifRepo.insertNotification).not.toHaveBeenCalled();
  });

  // ─── notifyOnAssign — unchanged (single recipient) ────────────────────
  test('notifyOnAssign → debounced when recent', async () => {
    mockNotifRepo.hasRecentNotification.mockResolvedValue(true);
    const result = await notifService.notifyOnAssign({
      voc_id: VOC_ID,
      new_assignee_id: ASSIGNEE,
      actor_id: ACTOR,
    });
    expect(result.inserted).toBe(false);
    expect(mockNotifRepo.insertNotification).not.toHaveBeenCalled();
  });

  test('notifyOnAssign → skipped on self-assign', async () => {
    const result = await notifService.notifyOnAssign({
      voc_id: VOC_ID,
      new_assignee_id: ACTOR,
      actor_id: ACTOR,
    });
    expect(result).toEqual({ inserted: false, reason: 'self' });
  });

  test('notifyOnAssign → no-recipient when assignee cleared', async () => {
    const result = await notifService.notifyOnAssign({
      voc_id: VOC_ID,
      new_assignee_id: null,
      actor_id: ACTOR,
    });
    expect(result).toEqual({ inserted: false, reason: 'no-recipient' });
    expect(mockNotifRepo.hasRecentNotification).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TDD-4: listNotifications calls lazyTrim before listing (W5-D4)
// ---------------------------------------------------------------------------

describe('listNotifications lazy trim (TDD-4)', () => {
  test('lazyTrim is awaited before listForUser', async () => {
    const order: string[] = [];
    mockNotifRepo.lazyTrim.mockImplementation(async () => {
      order.push('trim');
    });
    mockNotifRepo.listForUser.mockImplementation(async () => {
      order.push('list');
      return [];
    });
    const result = await notifService.listNotifications(USER_ID);
    expect(order).toEqual(['trim', 'list']);
    expect(result).toEqual({ items: [], unreadCount: 0 });
  });
});
