/**
 * dashboard-phase-c route — Wave 2 Phase C TDD.
 *
 * Tests:
 *   - user role → 403 on every endpoint.
 *   - unauthenticated → 401.
 *   - bad params → 400.
 *   - admin/manager/dev → 200 with correct zod shape (service mocked).
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

jest.mock('../../services/dashboard/phase-c.service', () => ({
  getDistribution: jest.fn(),
  getPriorityStatusMatrix: jest.fn(),
  getHeatmap: jest.fn(),
  getWeeklyTrend: jest.fn(),
  getProcessingSpeed: jest.fn(),
  getAssigneeStats: jest.fn(),
  getAgingVocs: jest.fn(),
}));

import { dashboardPhaseCRouter } from '../dashboard-phase-c';
import * as service from '../../services/dashboard/phase-c.service';

const svc = service as jest.Mocked<typeof service>;

// ── fixture shapes ────────────────────────────────────────────────────────────

const DISTRIBUTION_RESP = {
  type: 'status',
  dim: 'all',
  total: 5,
  items: [{ label: '접수', count: 5, percentage: 100, key: '접수' }],
};

const MATRIX_RESP = {
  columns: ['접수', '검토중', '처리중', '완료', '드랍'],
  rows: [
    { priority: 'urgent', cells: { 접수: 1, 검토중: 0, 처리중: 0, 완료: 0, 드랍: 0 }, row_total: 1 },
    { priority: 'high', cells: { 접수: 0, 검토중: 0, 처리중: 0, 완료: 0, 드랍: 0 }, row_total: 0 },
    { priority: 'medium', cells: { 접수: 0, 검토중: 0, 처리중: 0, 완료: 0, 드랍: 0 }, row_total: 0 },
    { priority: 'low', cells: { 접수: 0, 검토중: 0, 처리중: 0, 완료: 0, 드랍: 0 }, row_total: 0 },
  ],
  max_value: 1,
};

const HEATMAP_RESP = {
  headers: ['접수', '검토중', '처리중', '완료', '드랍'],
  totalRow: [1, 0, 0, 0, 0],
  rows: [{ name: 'SysA', id: '11111111-1111-4111-8111-111111111111', level: 'system', values: [1, 0, 0, 0, 0], total: 1 }],
  max_value: 1,
};

const WEEKLY_TREND_RESP = {
  weeks: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
  weekStarts: [
    '2026-02-23', '2026-03-02', '2026-03-09', '2026-03-16',
    '2026-03-23', '2026-03-30', '2026-04-06', '2026-04-13',
    '2026-04-20', '2026-04-27', '2026-05-04', '2026-05-11',
  ],
  series: {
    new: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    enteredInProgress: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    done: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

const PROCESSING_SPEED_RESP = {
  dim: 'all',
  rows: [{ id: null, name: '전체', avg_days: null, sla_rate: null, completed_count: 0, slaEligibleCount: 0, missingDueDateCount: 0 }],
};

const ASSIGNEE_STATS_RESP = {
  headers: ['접수', '검토중', '처리중', '완료', '드랍'],
  rows: [{ id: null, name: '미배정', is_unassigned: true, values: [0, 0, 0, 0, 0], total: 0 }],
  max_value: 0,
};

const AGING_VOCS_RESP = {
  dim: 'all',
  items: [],
};

// ── app factory ───────────────────────────────────────────────────────────────

function makeApp(role: 'admin' | 'manager' | 'dev' | 'user' | null) {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: 't', resave: false, saveUninitialized: false }));
  if (role) {
    app.use((req, _res, next) => {
      (req.session as Record<string, unknown>).user = {
        id: '00000000-0000-4000-8000-000000000001',
        role,
        name: 'Mock',
      };
      next();
    });
  }
  app.use('/api/dashboard', dashboardPhaseCRouter);
  app.use(
    (
      err: { status?: number; code?: string; message?: string },
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction,
    ) => {
      res.status(err.status ?? 500).json({ code: err.code, message: err.message });
    },
  );
  return app;
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  svc.getDistribution.mockResolvedValue(DISTRIBUTION_RESP as never);
  svc.getPriorityStatusMatrix.mockResolvedValue(MATRIX_RESP as never);
  svc.getHeatmap.mockResolvedValue(HEATMAP_RESP as never);
  svc.getWeeklyTrend.mockResolvedValue(WEEKLY_TREND_RESP as never);
  svc.getProcessingSpeed.mockResolvedValue(PROCESSING_SPEED_RESP as never);
  svc.getAssigneeStats.mockResolvedValue(ASSIGNEE_STATS_RESP as never);
  svc.getAgingVocs.mockResolvedValue(AGING_VOCS_RESP as never);
});

// ── permission matrix — 403 for user ─────────────────────────────────────────

const ENDPOINTS = [
  { method: 'get', path: '/api/dashboard/distribution', query: { type: 'status' } },
  { method: 'get', path: '/api/dashboard/priority-status-matrix', query: {} },
  { method: 'get', path: '/api/dashboard/heatmap', query: {} },
  { method: 'get', path: '/api/dashboard/weekly-trend', query: {} },
  { method: 'get', path: '/api/dashboard/processing-speed', query: {} },
  { method: 'get', path: '/api/dashboard/assignee-stats', query: {} },
  { method: 'get', path: '/api/dashboard/aging-vocs', query: {} },
] as const;

describe('Phase C — permission matrix', () => {
  it.each(ENDPOINTS)('user role → 403 on $path', async ({ path, query }) => {
    const res = await request(makeApp('user')).get(path).query(query);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it.each(ENDPOINTS)('no session → 401 on $path', async ({ path, query }) => {
    const res = await request(makeApp(null)).get(path).query(query);
    expect(res.status).toBe(401);
  });
});

// ── distribution ──────────────────────────────────────────────────────────────

describe('GET /api/dashboard/distribution', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with correct shape', async (role) => {
    const res = await request(makeApp(role))
      .get('/api/dashboard/distribution')
      .query({ type: 'status' });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('status');
    expect(res.body.dim).toBe('all');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('missing type → 400', async () => {
    const res = await request(makeApp('admin')).get('/api/dashboard/distribution');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('invalid type value → 400', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/distribution')
      .query({ type: 'bogus' });
    expect(res.status).toBe(400);
  });

  it('dim=system + systemId → 400 (zod refine)', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/distribution')
      .query({ type: 'status', dim: 'system', systemId: '11111111-1111-4111-8111-111111111111' });
    expect(res.status).toBe(400);
  });
});

// ── priority-status-matrix ────────────────────────────────────────────────────

describe('GET /api/dashboard/priority-status-matrix', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with matrix shape', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/priority-status-matrix');
    expect(res.status).toBe(200);
    expect(res.body.columns).toHaveLength(5);
    expect(res.body.rows).toHaveLength(4);
    expect(typeof res.body.max_value).toBe('number');
  });
});

// ── heatmap ───────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/heatmap', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with heatmap shape', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/heatmap');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.headers)).toBe(true);
    expect(Array.isArray(res.body.rows)).toBe(true);
  });

  it('invalid xAxis → 400', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/heatmap')
      .query({ xAxis: 'voc_type' });
    expect(res.status).toBe(400);
  });
});

// ── weekly-trend ──────────────────────────────────────────────────────────────

describe('GET /api/dashboard/weekly-trend', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with 12 weeks', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/weekly-trend');
    expect(res.status).toBe(200);
    expect(res.body.weeks).toHaveLength(12);
    expect(res.body.series.enteredInProgress).toHaveLength(12);
  });
});

// ── processing-speed ──────────────────────────────────────────────────────────

describe('GET /api/dashboard/processing-speed', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with rows', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/processing-speed');
    expect(res.status).toBe(200);
    expect(res.body.dim).toBe('all');
    expect(Array.isArray(res.body.rows)).toBe(true);
  });

  it('dim=system + systemId → 400 (zod refine)', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/processing-speed')
      .query({ dim: 'system', systemId: '11111111-1111-4111-8111-111111111111' });
    expect(res.status).toBe(400);
  });
});

// ── assignee-stats ────────────────────────────────────────────────────────────

describe('GET /api/dashboard/assignee-stats', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with headers + rows', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/assignee-stats');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.headers)).toBe(true);
    expect(Array.isArray(res.body.rows)).toBe(true);
  });

  it('invalid xAxis → 400', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/assignee-stats')
      .query({ xAxis: 'bad' });
    expect(res.status).toBe(400);
  });
});

// ── aging-vocs ────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/aging-vocs', () => {
  it.each(['admin', 'manager', 'dev'] as const)('%s → 200 with items', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/aging-vocs');
    expect(res.status).toBe(200);
    expect(res.body.dim).toBe('all');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('limit > 50 → 400', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/aging-vocs')
      .query({ limit: 51 });
    expect(res.status).toBe(400);
  });

  it('startDate/endDate accepted without 400 (silently ignored)', async () => {
    const res = await request(makeApp('admin'))
      .get('/api/dashboard/aging-vocs')
      .query({ startDate: '2026-01-01', endDate: '2026-05-01' });
    expect(res.status).toBe(200);
  });
});
