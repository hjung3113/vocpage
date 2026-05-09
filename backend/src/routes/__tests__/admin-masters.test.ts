/**
 * admin-masters.test.ts — Wave 3 Phase D (W3-6) TDD suite.
 *
 * Irreversible surface tested (mandatory per CLAUDE.md §Engineering Rules):
 *  1. Permission matrix — 4 roles × 2 actions (GET status / POST refresh)
 *  2. Cooldown 429 — refresh blocked within 5-min window per user
 *  3. Atomic-swap rollback — kept_loaded_at preserved on failure
 *  4. Cold-start badge — mode=cold when no snapshot
 *  5. Snapshot badge — mode=snapshot when loaded from snapshot fallback
 *
 * Spec: requirements.md §16.3, external-masters.md §0/§6/§7/§8
 * Permission (ADR 0004 + OQ-2 Option B):
 *   GET  /api/admin/masters/status  — admin / manager / dev
 *   POST /api/admin/masters/refresh — admin / manager only (not dev, not user)
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

// Mock the master cache service before importing the router
jest.mock('../../services/admin/external-masters', () => ({
  getMasterStatus: jest.fn(),
  triggerRefresh: jest.fn(),
}));

import { adminMastersRouter } from '../admin-masters';
import * as masterSvc from '../../services/admin/external-masters';

const mockSvc = masterSvc as jest.Mocked<typeof masterSvc>;

// ---------------------------------------------------------------------------
// App factory — injects mock session user by role
// ---------------------------------------------------------------------------
function makeApp(role: 'admin' | 'manager' | 'dev' | 'user') {
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
    admin:   { id: '00000000-0000-4000-8000-0000000000a1', role: 'admin',   name: 'Mock Admin' },
    manager: { id: '00000000-0000-4000-8000-0000000000b1', role: 'manager', name: 'Mock Manager' },
    dev:     { id: '00000000-0000-4000-8000-0000000000c1', role: 'dev',     name: 'Mock Dev' },
    user:    { id: '00000000-0000-4000-8000-0000000000d1', role: 'user',    name: 'Mock User' },
  };
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>).user = roleToUser[role];
    next();
  });
  app.use('/api/admin', adminMastersRouter);
  return app;
}

const NOW = '2026-05-09T10:00:00.000Z';
const COOLDOWN_UNTIL = '2026-05-09T10:05:00.000Z';

const sampleStatus = {
  loaded_at: NOW,
  cooldown_until: null as string | null,
  mode: 'live' as const,
  sources: {
    equipment: { loaded_at: NOW },
    db:        { loaded_at: NOW },
    program:   { loaded_at: NOW },
  },
};

const sampleRefreshOk = {
  swapped: true,
  loaded_at: NOW,
  sources: {
    equipment: { loaded_at: NOW },
    db:        { loaded_at: NOW },
  },
};

beforeEach(() => jest.clearAllMocks());

// ───────────────────────────────────────────────────────────────────────────
// §1 GET /api/admin/masters/status — permission matrix
// ───────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/masters/status — permission matrix', () => {
  it('admin → 200', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce(sampleStatus);
    const res = await request(makeApp('admin')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
    expect(res.body.loaded_at).toBe(NOW);
  });

  it('manager → 200', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce(sampleStatus);
    const res = await request(makeApp('manager')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
  });

  it('dev → 200 (OQ-2 Option B: dev read-only allowed)', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce(sampleStatus);
    const res = await request(makeApp('dev')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
  });

  it('user → 403', async () => {
    const res = await request(makeApp('user')).get('/api/admin/masters/status');
    expect(res.status).toBe(403);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// §2 POST /api/admin/masters/refresh — permission matrix
// ───────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/masters/refresh — permission matrix', () => {
  it('admin → 200', async () => {
    mockSvc.triggerRefresh.mockResolvedValueOnce(sampleRefreshOk);
    const res = await request(makeApp('admin')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(200);
    expect(res.body.swapped).toBe(true);
  });

  it('manager → 200', async () => {
    mockSvc.triggerRefresh.mockResolvedValueOnce(sampleRefreshOk);
    const res = await request(makeApp('manager')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(200);
  });

  it('dev → 403 (read-only: no refresh)', async () => {
    const res = await request(makeApp('dev')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(403);
    expect(mockSvc.triggerRefresh).not.toHaveBeenCalled();
  });

  it('user → 403', async () => {
    const res = await request(makeApp('user')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(403);
    expect(mockSvc.triggerRefresh).not.toHaveBeenCalled();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// §3 Cooldown 429 — within 5-min window per user
// ───────────────────────────────────────────────────────────────────────────

describe('Cooldown 429 — refresh blocked within 5-min window', () => {
  it('returns 429 with kept_loaded_at when cooldown active', async () => {
    const cooldownError = Object.assign(
      new Error('쿨다운 중입니다. 5분 후 다시 시도하세요.'),
      {
        code: 'RATE_LIMITED',
        cooldown_until: COOLDOWN_UNTIL,
        kept_loaded_at: NOW,
      },
    );
    mockSvc.triggerRefresh.mockRejectedValueOnce(cooldownError);
    const res = await request(makeApp('manager')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    expect(res.body.details.cooldown_until).toBe(COOLDOWN_UNTIL);
    expect(res.body.details.kept_loaded_at).toBe(NOW);
  });

  it('returns 200 after cooldown clears', async () => {
    mockSvc.triggerRefresh.mockResolvedValueOnce(sampleRefreshOk);
    const res = await request(makeApp('manager')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(200);
    expect(res.body.swapped).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// §4 Atomic-swap rollback — kept_loaded_at preserved on failure
// ───────────────────────────────────────────────────────────────────────────

describe('Atomic-swap rollback — kept_loaded_at preserved on partial failure', () => {
  it('returns 503 with swapped=false and kept_loaded_at when refresh fails', async () => {
    const swapError = Object.assign(
      new Error('외부 마스터 로드 실패: equipment MSSQL 연결 오류'),
      {
        code: 'EXTERNAL_MASTER_UNAVAILABLE',
        kept_loaded_at: NOW,
      },
    );
    mockSvc.triggerRefresh.mockRejectedValueOnce(swapError);
    const res = await request(makeApp('manager')).post('/api/admin/masters/refresh');
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('EXTERNAL_MASTER_UNAVAILABLE');
    expect(res.body.details.kept_loaded_at).toBe(NOW);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// §5 Status — mode badges (cold-start / snapshot)
// ───────────────────────────────────────────────────────────────────────────

describe('Status mode badges', () => {
  it('returns mode=cold when no snapshot loaded (cold-start)', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce({
      ...sampleStatus,
      loaded_at: null,
      mode: 'cold',
    });
    const res = await request(makeApp('admin')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('cold');
  });

  it('returns mode=snapshot when loaded from disk fallback', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce({
      ...sampleStatus,
      mode: 'snapshot',
    });
    const res = await request(makeApp('admin')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('snapshot');
  });

  it('returns mode=live when fully loaded from external sources', async () => {
    mockSvc.getMasterStatus.mockReturnValueOnce({
      ...sampleStatus,
      mode: 'live',
    });
    const res = await request(makeApp('admin')).get('/api/admin/masters/status');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('live');
  });
});
