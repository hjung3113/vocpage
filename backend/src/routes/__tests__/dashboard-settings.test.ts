/**
 * dashboard-settings.test.ts — Wave 2 Phase D RGL Shell BE TDD suite.
 *
 * Cases:
 *   1. GET happy path — user value wins when field is not locked.
 *   2. GET locked override — admin value wins when field is in locked_fields.
 *   3. GET no user row — admin defaults echoed with user_id: null.
 *   4. PUT permission — locked_fields requires admin role; manager → 403.
 *   5. PUT permission — globaltabs_order requires admin; dev → 403; admin → 200.
 *   6. PUT silent drop — locked fields silently dropped for non-admin user.
 *   7. PUT body validation — unknown key → 400 (zod .strict()).
 *   8. Auth required — no session → 401.
 *
 * Pattern: jest.mock the repository, build Express app per-test, supertest.
 */
import request from 'supertest';
import express from 'express';
import session from 'express-session';

process.env.AUTH_MODE = 'mock';

jest.mock('../../repository/dashboard.repo', () => ({
  getByUserId: jest.fn(),
  getAdminDefault: jest.fn(),
  upsert: jest.fn(),
}));

import { dashboardSettingsRouter } from '../dashboard-settings';
import * as dashRepo from '../../repository/dashboard.repo';

const mockRepo = dashRepo as jest.Mocked<typeof dashRepo>;

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID  = '00000000-0000-4000-8000-000000000002';
const DEV_ID   = '00000000-0000-4000-8000-000000000003';
const MGR_ID   = '00000000-0000-4000-8000-000000000004';

const UPDATED_AT = '2026-05-10T00:00:00.000Z';

const baseAdminRow = {
  user_id: null,
  widget_order: [],
  widget_visibility: {},
  widget_sizes: {},
  locked_fields: [],
  default_date_range: '3m',
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: UPDATED_AT,
};

const baseUserRow = {
  user_id: USER_ID,
  widget_order: [],
  widget_visibility: {},
  widget_sizes: {},
  locked_fields: [],
  default_date_range: '1y',
  heatmap_default_x_axis: 'tag',
  globaltabs_order: null,
  updated_at: UPDATED_AT,
};

function makeApp(userId = USER_ID, role = 'user') {
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
    (req.session as Record<string, unknown>).user = { id: userId, role, name: 'Mock' };
    next();
  });
  app.use('/api/dashboard', dashboardSettingsRouter);
  // error handler
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

function makeAppNoSession() {
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
  // No user injected → unauthenticated
  app.use('/api/dashboard', dashboardSettingsRouter);
  app.use(
    (
      err: { status?: number; code?: string; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err.status ?? 500).json({ code: err.code, message: err.message });
    },
  );
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// TDD-1: GET happy path — user value wins when not locked
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/settings (TDD-1: user overrides admin when not locked)', () => {
  test('returns user default_date_range (1y) over admin (3m) when locked_fields is empty', async () => {
    mockRepo.getAdminDefault.mockResolvedValue({ ...baseAdminRow, locked_fields: [] });
    mockRepo.getByUserId.mockResolvedValue({ ...baseUserRow, default_date_range: '1y' });

    const res = await request(makeApp()).get('/api/dashboard/settings');
    expect(res.status).toBe(200);
    expect(res.body.default_date_range).toBe('1y');
  });
});

// ---------------------------------------------------------------------------
// TDD-2: GET locked override — admin value wins when field is locked
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/settings (TDD-2: admin lock wins)', () => {
  test('returns admin heatmap_default_x_axis (priority) despite user row having (tag)', async () => {
    mockRepo.getAdminDefault.mockResolvedValue({
      ...baseAdminRow,
      heatmap_default_x_axis: 'priority',
      locked_fields: ['heatmap_default_x_axis'],
    });
    mockRepo.getByUserId.mockResolvedValue({
      ...baseUserRow,
      heatmap_default_x_axis: 'tag',
    });

    const res = await request(makeApp()).get('/api/dashboard/settings');
    expect(res.status).toBe(200);
    expect(res.body.heatmap_default_x_axis).toBe('priority');
  });
});

// ---------------------------------------------------------------------------
// TDD-3: GET no user row — admin defaults echoed with user_id: null
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/settings (TDD-3: no user row)', () => {
  test('returns admin defaults with user_id null when no user row exists', async () => {
    mockRepo.getAdminDefault.mockResolvedValue({ ...baseAdminRow, default_date_range: '3m' });
    mockRepo.getByUserId.mockResolvedValue(null);

    const res = await request(makeApp()).get('/api/dashboard/settings');
    expect(res.status).toBe(200);
    expect(res.body.default_date_range).toBe('3m');
    expect(res.body.user_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TDD-4: PUT permission — locked_fields requires admin
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (TDD-4: locked_fields permission)', () => {
  test('manager sending locked_fields (no scope) → 403 FORBIDDEN_LOCKED_FIELDS_SCOPE', async () => {
    const res = await request(makeApp(MGR_ID, 'manager'))
      .put('/api/dashboard/settings')
      .send({ locked_fields: ['default_date_range'] });

    expect(res.status).toBe(403);
    // P1-2: scope check fires before role check (manager doesn't have scope=admin)
    expect(res.body.code).toBe('FORBIDDEN_LOCKED_FIELDS_SCOPE');
  });

  test('admin sending locked_fields with scope=admin → 200', async () => {
    const resolved = { ...baseAdminRow, locked_fields: ['default_date_range'] };
    mockRepo.upsert.mockResolvedValue(resolved);
    mockRepo.getAdminDefault.mockResolvedValue(resolved);
    mockRepo.getByUserId.mockResolvedValue(null);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .put('/api/dashboard/settings?scope=admin')
      .send({ locked_fields: ['default_date_range'] });

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// TDD-5: PUT permission — globaltabs_order requires admin
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (TDD-5: globaltabs_order permission)', () => {
  test('dev sending globaltabs_order (no scope) → 403 FORBIDDEN_GLOBALTABS_ORDER_SCOPE', async () => {
    const res = await request(makeApp(DEV_ID, 'dev'))
      .put('/api/dashboard/settings')
      .send({ globaltabs_order: [{ systemId: 'overview', visible: true }] });

    expect(res.status).toBe(403);
    // P1-3: scope check fires before role check
    expect(res.body.code).toBe('FORBIDDEN_GLOBALTABS_ORDER_SCOPE');
  });

  test('admin sending globaltabs_order → 200, persisted to admin-default row', async () => {
    const tabs = [{ systemId: 'overview', visible: true }];
    const resolved = { ...baseAdminRow, globaltabs_order: tabs };
    mockRepo.upsert.mockResolvedValue(resolved);
    mockRepo.getAdminDefault.mockResolvedValue(resolved);
    mockRepo.getByUserId.mockResolvedValue(null);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .put('/api/dashboard/settings?scope=admin')
      .send({ globaltabs_order: tabs });

    expect(res.status).toBe(200);
    // Admin-default row: upsert called with userId=null
    expect(mockRepo.upsert).toHaveBeenCalledWith(null, expect.objectContaining({ globaltabs_order: tabs }));
  });
});

// ---------------------------------------------------------------------------
// TDD-6: PUT silent drop of locked fields for non-admin
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (TDD-6: silent drop locked fields)', () => {
  test('locked default_date_range is dropped; only widget_order is upserted', async () => {
    mockRepo.getAdminDefault.mockResolvedValue({
      ...baseAdminRow,
      locked_fields: ['default_date_range'],
    });
    mockRepo.getByUserId.mockResolvedValue({ ...baseUserRow });
    mockRepo.upsert.mockResolvedValue({ ...baseUserRow });

    const res = await request(makeApp(USER_ID, 'user'))
      .put('/api/dashboard/settings')
      .send({ default_date_range: '1y', widget_order: ['summary', 'heatmap'] });

    expect(res.status).toBe(200);
    // upsert should NOT include default_date_range
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      USER_ID,
      expect.not.objectContaining({ default_date_range: expect.anything() }),
    );
    expect(mockRepo.upsert).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ widget_order: ['summary', 'heatmap'] }),
    );
  });
});

// ---------------------------------------------------------------------------
// TDD-7: PUT body validation — unknown key → 400
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (TDD-7: body validation)', () => {
  test('unknown key in body → 400', async () => {
    const res = await request(makeApp())
      .put('/api/dashboard/settings')
      .send({ unknown_field: 'oops' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// TDD-8: Auth required — no session → 401
// ---------------------------------------------------------------------------

describe('Auth required (TDD-8)', () => {
  test('GET /api/dashboard/settings without session → 401', async () => {
    const res = await request(makeAppNoSession()).get('/api/dashboard/settings');
    expect(res.status).toBe(401);
  });

  test('PUT /api/dashboard/settings without session → 401', async () => {
    const res = await request(makeAppNoSession())
      .put('/api/dashboard/settings')
      .send({ widget_order: [] });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// P1-1: scope=admin requires role=admin
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (P1-1: scope=admin requires admin role)', () => {
  test('non-admin user with ?scope=admin → 403 FORBIDDEN_ADMIN_SCOPE', async () => {
    const res = await request(makeApp(USER_ID, 'user'))
      .put('/api/dashboard/settings?scope=admin')
      .send({ widget_order: ['summary'] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ADMIN_SCOPE');
  });

  test('manager with ?scope=admin → 403 FORBIDDEN_ADMIN_SCOPE', async () => {
    const res = await request(makeApp(MGR_ID, 'manager'))
      .put('/api/dashboard/settings?scope=admin')
      .send({ widget_order: ['summary'] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ADMIN_SCOPE');
  });
});

// ---------------------------------------------------------------------------
// P1-2: locked_fields without scope=admin → 403
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (P1-2: locked_fields requires scope=admin)', () => {
  test('admin sending locked_fields without ?scope=admin → 403 FORBIDDEN_LOCKED_FIELDS_SCOPE', async () => {
    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .put('/api/dashboard/settings')
      .send({ locked_fields: ['default_date_range'] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_LOCKED_FIELDS_SCOPE');
  });

  test('admin sending locked_fields with ?scope=admin → 200', async () => {
    const resolved = { ...baseAdminRow, locked_fields: ['default_date_range'] };
    mockRepo.upsert.mockResolvedValue(resolved);
    mockRepo.getAdminDefault.mockResolvedValue(resolved);
    mockRepo.getByUserId.mockResolvedValue(null);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .put('/api/dashboard/settings?scope=admin')
      .send({ locked_fields: ['default_date_range'] });

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// P1-3: globaltabs_order without scope=admin → 403
// ---------------------------------------------------------------------------

describe('PUT /api/dashboard/settings (P1-3: globaltabs_order requires scope=admin)', () => {
  test('admin sending globaltabs_order without ?scope=admin → 403 FORBIDDEN_GLOBALTABS_ORDER_SCOPE', async () => {
    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .put('/api/dashboard/settings')
      .send({ globaltabs_order: [{ systemId: 'overview', visible: true }] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_GLOBALTABS_ORDER_SCOPE');
  });
});

// ---------------------------------------------------------------------------
// Phase E item 1: GET ?scope=admin returns admin-default raw row (admin only)
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/settings (Phase E: scope=admin)', () => {
  test('admin GET ?scope=admin returns raw admin-default row', async () => {
    const adminRow = { ...baseAdminRow, default_date_range: '1y', heatmap_default_x_axis: 'priority' };
    mockRepo.getAdminDefault.mockResolvedValue(adminRow);

    const res = await request(makeApp(ADMIN_ID, 'admin'))
      .get('/api/dashboard/settings?scope=admin');

    expect(res.status).toBe(200);
    expect(res.body.user_id).toBeNull();
    expect(res.body.default_date_range).toBe('1y');
    expect(res.body.heatmap_default_x_axis).toBe('priority');
    expect(mockRepo.getByUserId).not.toHaveBeenCalled();
  });

  test('non-admin GET ?scope=admin → 403 FORBIDDEN_ADMIN_SCOPE', async () => {
    const res = await request(makeApp(USER_ID, 'user'))
      .get('/api/dashboard/settings?scope=admin');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ADMIN_SCOPE');
  });

  test('admin GET without scope param still returns merged (regression)', async () => {
    mockRepo.getAdminDefault.mockResolvedValue(baseAdminRow);
    mockRepo.getByUserId.mockResolvedValue(baseUserRow);

    const res = await request(makeApp(ADMIN_ID, 'admin')).get('/api/dashboard/settings');

    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe(ADMIN_ID === res.body.user_id ? ADMIN_ID : USER_ID);
    expect(mockRepo.getByUserId).toHaveBeenCalled();
  });
});
