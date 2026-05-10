/**
 * dashboard-summary route — Wave 2 Phase B TDD.
 *
 * Cases:
 *   1. user role → 403 (§8.3 permission matrix).
 *   2. dev / manager / admin → 200 with DashboardSummary shape.
 *   3. no session → 401.
 *   4. invalid query (unknown key, .strict) → 400.
 *
 * Service is mocked module-wide.
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

jest.mock('../../services/dashboard/summary.service', () => ({
  getSummary: jest.fn(),
}));

import { dashboardSummaryRouter } from '../dashboard-summary';
import * as service from '../../services/dashboard/summary.service';

const svc = service as jest.Mocked<typeof service>;

const ZERO_METRIC = { value: 0, delta: null, delta_kind: 'percent' as const };
const ZERO_SUMMARY = {
  kpi_volume: {
    total_voc: ZERO_METRIC,
    unresolved: ZERO_METRIC,
    this_week_new: ZERO_METRIC,
    this_week_completed: ZERO_METRIC,
  },
  kpi_quality: {
    avg_resolution_days: { value: 0, delta: null, delta_kind: 'days' as const },
    resolution_rate: { value: 0, delta: null, delta_kind: 'percentage_point' as const },
    urgent_high_unresolved: { value: 0, delta: null, delta_kind: 'count' as const },
    overdue_14d: { value: 0, delta: null, delta_kind: 'count' as const },
  },
};

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
  app.use('/api/dashboard', dashboardSummaryRouter);
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

beforeEach(() => {
  jest.clearAllMocks();
  svc.getSummary.mockResolvedValue(ZERO_SUMMARY);
});

describe('GET /api/dashboard/summary — auth + permissions', () => {
  it('user role → 403 FORBIDDEN', async () => {
    const res = await request(makeApp('user')).get('/api/dashboard/summary');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it.each(['admin', 'manager', 'dev'] as const)('%s role → 200', async (role) => {
    const res = await request(makeApp(role)).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.kpi_volume).toBeDefined();
    expect(res.body.kpi_quality).toBeDefined();
  });

  it('no session → 401', async () => {
    const res = await request(makeApp(null)).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/dashboard/summary — query validation', () => {
  it('unknown query key → 400 (.strict)', async () => {
    const res = await request(makeApp('manager'))
      .get('/api/dashboard/summary')
      .query({ bogus: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('range=1m forwards to service', async () => {
    await request(makeApp('manager')).get('/api/dashboard/summary').query({ range: '1m' });
    expect(svc.getSummary).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.objectContaining({ range: '1m' }) }),
    );
  });

  it('valid scope filters reach the service', async () => {
    await request(makeApp('admin'))
      .get('/api/dashboard/summary')
      .query({
        systemId: '11111111-1111-4111-8111-111111111111',
        menuId: '22222222-2222-4222-8222-222222222222',
        assigneeId: '33333333-3333-4333-8333-333333333333',
        range: '3m',
      });
    expect(svc.getSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          systemId: '11111111-1111-4111-8111-111111111111',
          menuId: '22222222-2222-4222-8222-222222222222',
          assigneeId: '33333333-3333-4333-8333-333333333333',
          range: '3m',
        }),
      }),
    );
  });
});
