/**
 * Consolidated permission-matrix integration test (FU-018).
 *
 * Single source verifying the §8.3 role × action matrix and §13.2 integration
 * test mandate. Per-route tests still cover happy-path semantics; this file
 * locks the **gate decisions** (allow / 401 / 403 / 404-hidden) for every
 * (role, endpoint) cell in one place so reviewers can read the matrix
 * end-to-end.
 *
 * Spec sources:
 *   - feature-voc.md §8.3 (role × action matrix)
 *   - feature-voc.md §8.4-bis assertCanManageVoc helper
 *   - requirements.md §13.2 (integration test mandate)
 *   - ADR 0005 (admin-namespace existence hiding → 404)
 *
 * Scope: gate-only. ALLOW cells assert the gate did NOT reject (status not
 * 401/403, not the existence-hiding 404, and < 500 — a 5xx means the gate
 * passed but downstream broke; per-route tests catch that, not this matrix).
 *
 * **Spec interpretation (FU-021, 2026-05-10 user decision)**: §8.3 "전체 VOC
 * 조회 User ❌" refers to operational/management permissions, not read access.
 * Read-only `GET /api/vocs` and `GET /api/vocs/:id` are ALLOW for all 4 roles;
 * the matrix locks that contract below.
 *
 * **Out of scope**:
 *   - Sub-task / Dashboard rows — no routed endpoint at MVP scope.
 *
 * **Production routing fix** (FU-022, 2026-05-10): adminTrashRouter and
 * adminUsersRouter previously had `router.use(requireAdmin())` at router
 * level, which intercepted every `/api/admin/*` request when all four admin
 * routers are mounted at the same prefix. Switched to per-route
 * `requireAdmin()` so non-matching paths fall through to the next admin
 * router. Integration regression: `__tests__/admin-router-mount.test.ts`.
 * This matrix continues to mount one router per cell to keep gate
 * decisions isolated.
 */
import express from 'express';
import session from 'express-session';
import request from 'supertest';

process.env.AUTH_MODE = 'mock';

// ── Module mocks ─────────────────────────────────────────────────────────────
// We mock the **repository** layer (not service) so the real services run —
// real assertCanManageVoc decides per-VOC denials, mirroring production.

jest.mock('../repository/voc', () => ({
  listVocs: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  // The /notes paths require a present VOC to exercise assertCanManageVoc.
  // Default to an unassigned VOC so the §8.4-bis "dev + unassigned → 403"
  // rule is exercised by the matrix.
  getVocById: jest.fn().mockResolvedValue({
    id: '00000000-0000-4000-8000-000000000099',
    assignee_id: null,
    deleted_at: null,
    title: 'mock',
    content: 'mock',
  }),
  updateVoc: jest.fn().mockResolvedValue({ id: '00000000-0000-4000-8000-000000000099' }),
  listNotes: jest.fn().mockResolvedValue([]),
  createNote: jest.fn().mockResolvedValue({ id: 'note-1' }),
  createVoc: jest.fn().mockResolvedValue({ id: '00000000-0000-4000-8000-000000000099' }),
  insertPayloadReview: jest.fn().mockResolvedValue({ id: 'pr-1' }),
  listHistory: jest.fn().mockResolvedValue([]),
  escapeLikePattern: jest.fn((s: string) => s),
}));

jest.mock('../repository/notices', () => ({
  list: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  popup: jest.fn().mockResolvedValue([]),
  getById: jest.fn().mockResolvedValue({ id: 'n1' }),
  create: jest.fn().mockResolvedValue({ id: 'n1' }),
  update: jest.fn().mockResolvedValue({ id: 'n1' }),
  softDelete: jest.fn().mockResolvedValue(true),
  restore: jest.fn().mockResolvedValue({ id: 'n1' }),
}));

jest.mock('../repository/faqs', () => ({
  listFaqs: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  getFaqById: jest.fn().mockResolvedValue({ id: 'f1' }),
  createFaq: jest.fn().mockResolvedValue({ id: 'f1' }),
  updateFaq: jest.fn().mockResolvedValue({ id: 'f1' }),
  softDeleteFaq: jest.fn().mockResolvedValue(true),
  restoreFaq: jest.fn().mockResolvedValue({ id: 'f1' }),
  listCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('../repository/trash', () => ({
  listTrashedVocs: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  restoreVoc: jest.fn().mockResolvedValue({ id: 'v1' }),
  getRestoreLog: jest.fn().mockResolvedValue([]),
}));

jest.mock('../services/notifications', () => ({
  notifyOnComment: jest.fn().mockResolvedValue({ inserted: false }),
  notifyOnStatusChange: jest.fn().mockResolvedValue({ inserted: false }),
  notifyOnAssign: jest.fn().mockResolvedValue({ inserted: false }),
  listNotifications: jest.fn().mockResolvedValue({ rows: [] }),
  getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
  markAllRead: jest.fn().mockResolvedValue(undefined),
  markOneRead: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/admin/tag-master', () => ({
  listTags: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
  createTag: jest.fn().mockResolvedValue({ id: 't1' }),
  renameTag: jest.fn().mockResolvedValue({ id: 't1' }),
  mergeTags: jest.fn().mockResolvedValue({ ok: true }),
  toggleExternal: jest.fn().mockResolvedValue({ id: 't1' }),
  deleteTag: jest.fn().mockResolvedValue({ ok: true }),
  suspendTagRule: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../services/admin/external-masters', () => ({
  getMasterStatus: jest.fn().mockReturnValue({ status: 'idle' }),
  triggerRefresh: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../services/admin/user-admin', () => ({
  listUsers: jest.fn().mockResolvedValue({ rows: [], page: 1, per_page: 20, total: 0 }),
  patchUser: jest.fn().mockResolvedValue({ id: 'u1' }),
}));

// ── App factory ──────────────────────────────────────────────────────────────

import { vocRouter } from '../routes/voc';
import { noticesRouter } from '../routes/notices';
import { faqsRouter } from '../routes/faqs';
import { adminTagsRouter } from '../routes/admin-tags';
import { adminTrashRouter } from '../routes/admin-trash';
import { adminMastersRouter } from '../routes/admin-masters';
import { adminUsersRouter } from '../routes/admin-users';
import { errorHandler } from '../middleware/errorHandler';

type Role = 'user' | 'dev' | 'manager' | 'admin' | 'anon';

const userByRole: Record<Exclude<Role, 'anon'>, object> = {
  admin: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000a01',
    role: 'admin',
    name: 'A',
    email: 'a@x',
  },
  manager: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000m01',
    role: 'manager',
    name: 'M',
    email: 'm@x',
  },
  dev: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000d01',
    role: 'dev',
    name: 'D',
    email: 'd@x',
  },
  user: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000u01',
    role: 'user',
    name: 'U',
    email: 'u@x',
  },
};

// Mount only the cell's target router so each gate decision is isolated.
// Production multi-mount integration is covered separately by
// `admin-router-mount.test.ts` (FU-022 regression).
type RouterId = 'voc' | 'notices' | 'faqs' | 'adminTags' | 'adminTrash' | 'adminMasters' | 'adminUsers';

const ROUTERS: Record<RouterId, { router: express.Router; mount: string }> = {
  voc: { router: vocRouter, mount: '/api/vocs' },
  notices: { router: noticesRouter, mount: '/api/notices' },
  faqs: { router: faqsRouter, mount: '/api/faqs' },
  adminTags: { router: adminTagsRouter, mount: '/api/admin' },
  adminTrash: { router: adminTrashRouter, mount: '/api/admin' },
  adminMasters: { router: adminMastersRouter, mount: '/api/admin' },
  adminUsers: { router: adminUsersRouter, mount: '/api/admin' },
};

function makeApp(role: Role, routerId: RouterId): express.Express {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test-permission-matrix',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  if (role !== 'anon') {
    app.use((req, _res, next) => {
      (req.session as Record<string, unknown>).user = userByRole[role];
      next();
    });
  }
  const { router, mount } = ROUTERS[routerId];
  app.use(mount, router);
  app.use(errorHandler);
  return app;
}

// ── Matrix model ─────────────────────────────────────────────────────────────

type Method = 'get' | 'post' | 'patch' | 'delete';

/**
 * Gate outcomes (what happens at the auth/role boundary):
 *   ALLOW         — gate passes; status ∉ {401, 403, hidden 404}
 *   DENY_403      — wrong role on a public-namespace route → 403 FORBIDDEN
 *   DENY_404_HIDE — wrong role on existence-hiding namespace → 404 NOT_FOUND
 *   DENY_404_USER — user role on /api/vocs/:id/notes → 404 (§8.4-bis)
 *   DEV_OWN_403   — dev role on unassigned VOC → 403 per §8.4-bis
 */
type Outcome = 'ALLOW' | 'DENY_403' | 'DENY_404_HIDE' | 'DENY_404_USER' | 'DEV_OWN_403';

interface Cell {
  label: string;
  method: Method;
  path: string;
  router: RouterId;
  body?: unknown;
  expect: Record<Exclude<Role, 'anon'>, Outcome>;
}

const VOC_ID = '00000000-0000-4000-8000-000000000099';
const TAG_ID = '11111111-1111-4111-8111-111111111111';
const NOTICE_ID = '22222222-2222-4222-8222-222222222222';
const FAQ_ID = '33333333-3333-4333-8333-333333333333';
const USER_TARGET_ID = '44444444-4444-4444-8444-444444444444';

const matrix: Cell[] = [
  // §8.3: VOC 작성 — all roles allowed
  {
    label: 'POST /api/vocs (VOC 작성)',
    method: 'post',
    router: 'voc',
    path: '/api/vocs',
    body: {
      title: 'permission-matrix',
      voc_type_id: '00000000-0000-0000-0000-000000000001',
      system_id: '00000000-0000-0000-0000-000000000003',
      menu_id: '00000000-0000-0000-0000-000000000002',
    },
    expect: { user: 'ALLOW', dev: 'ALLOW', manager: 'ALLOW', admin: 'ALLOW' },
  },

  // §8.3: "본인 VOC 조회" + "전체 VOC 조회" — read access ALLOW for all roles
  //   (FU-021 spec decision, 2026-05-10). The "전체 VOC 조회 User ❌" cell is
  //   about operational permissions, not read access; list/detail GET have no
  //   gate beyond authentication.
  {
    label: 'GET /api/vocs (VOC 목록 조회)',
    method: 'get',
    router: 'voc',
    path: '/api/vocs',
    expect: { user: 'ALLOW', dev: 'ALLOW', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'GET /api/vocs/:id (VOC 상세 조회)',
    method: 'get',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}`,
    expect: { user: 'ALLOW', dev: 'ALLOW', manager: 'ALLOW', admin: 'ALLOW' },
  },

  // §8.3 + §8.4-bis: Internal Note R/W
  // user → 404 hidden; dev on unassigned VOC → 403; manager/admin → ALLOW
  {
    label: 'GET /api/vocs/:id/notes (internal note read)',
    method: 'get',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}/notes`,
    expect: {
      user: 'DENY_404_USER',
      dev: 'DEV_OWN_403',
      manager: 'ALLOW',
      admin: 'ALLOW',
    },
  },
  {
    label: 'POST /api/vocs/:id/notes (internal note write)',
    method: 'post',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}/notes`,
    body: { body: 'note text' },
    expect: {
      user: 'DENY_404_USER',
      dev: 'DEV_OWN_403',
      manager: 'ALLOW',
      admin: 'ALLOW',
    },
  },

  // §8.3: 상태 변경 / Priority / Due Date — Manager+/Admin allow; Dev own only;
  // User deny. With seeded VOC assignee_id=null, Dev hits §8.4-bis "unassigned
  // VOC → FORBIDDEN" branch (DEV_OWN_403). Per-VOC ownership matrix is in
  // vocs.test.ts; this row locks the role-level gate.
  {
    label: 'PATCH /api/vocs/:id { status } (상태 변경)',
    method: 'patch',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}`,
    body: { status: '검토중' },
    expect: {
      user: 'DENY_403',
      dev: 'DEV_OWN_403',
      manager: 'ALLOW',
      admin: 'ALLOW',
    },
  },
  {
    label: 'PATCH /api/vocs/:id { priority } (Priority)',
    method: 'patch',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}`,
    body: { priority: 'high' },
    expect: {
      user: 'DENY_403',
      dev: 'DEV_OWN_403',
      manager: 'ALLOW',
      admin: 'ALLOW',
    },
  },
  // §8.3: 담당자 배정/해제 — Manager/Admin only (action='reassign' explicitly
  // denies Dev even on own VOC — see assertCanManageVoc.ts:35-37).
  {
    label: 'PATCH /api/vocs/:id { assignee_id } (담당자 배정/해제)',
    method: 'patch',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}`,
    body: { assignee_id: '55555555-5555-4555-8555-555555555555' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },

  // §8.3: 공지사항 작성/관리 — manager+
  {
    label: 'POST /api/notices (공지 작성)',
    method: 'post',
    router: 'notices',
    path: '/api/notices',
    body: { title: 't', content: 'c', visible_from: '2026-01-01T00:00:00+09:00' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'PATCH /api/notices/:id',
    method: 'patch',
    router: 'notices',
    path: `/api/notices/${NOTICE_ID}`,
    body: { title: 't2' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'DELETE /api/notices/:id',
    method: 'delete',
    router: 'notices',
    path: `/api/notices/${NOTICE_ID}`,
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  // §8.3: 공지사항 복원 — admin only
  {
    label: 'POST /api/notices/:id/restore (admin only)',
    method: 'post',
    router: 'notices',
    path: `/api/notices/${NOTICE_ID}/restore`,
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'DENY_403', admin: 'ALLOW' },
  },

  // §8.3: FAQ 작성/관리 — manager+
  {
    label: 'POST /api/faqs',
    method: 'post',
    router: 'faqs',
    path: '/api/faqs',
    body: {
      question: 'q',
      answer: 'a',
      category_id: '00000000-0000-0000-0000-000000000010',
    },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'PATCH /api/faqs/:id',
    method: 'patch',
    router: 'faqs',
    path: `/api/faqs/${FAQ_ID}`,
    body: { question: 'q2' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'DELETE /api/faqs/:id',
    method: 'delete',
    router: 'faqs',
    path: `/api/faqs/${FAQ_ID}`,
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },

  // §8.3: 태그 규칙 관리 / 신규 태그 생성
  {
    label: 'GET /api/admin/tags (read — admin/manager/dev)',
    method: 'get',
    router: 'adminTags',
    path: '/api/admin/tags',
    expect: { user: 'DENY_403', dev: 'ALLOW', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'POST /api/admin/tags (manager+)',
    method: 'post',
    router: 'adminTags',
    path: '/api/admin/tags',
    body: { name: 'tag', kind: 'general' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'POST /api/admin/tags/:id/merge (admin only)',
    method: 'post',
    router: 'adminTags',
    path: `/api/admin/tags/${TAG_ID}/merge`,
    body: { targetId: '11111111-1111-4111-8111-111111111112' },
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'DENY_403', admin: 'ALLOW' },
  },
  {
    label: 'DELETE /api/admin/tags/:id (admin only)',
    method: 'delete',
    router: 'adminTags',
    path: `/api/admin/tags/${TAG_ID}`,
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'DENY_403', admin: 'ALLOW' },
  },

  // §8.3: 시스템/메뉴/유형 관리
  {
    label: 'GET /api/admin/masters/status (read — admin/manager/dev)',
    method: 'get',
    router: 'adminMasters',
    path: '/api/admin/masters/status',
    expect: { user: 'DENY_403', dev: 'ALLOW', manager: 'ALLOW', admin: 'ALLOW' },
  },
  {
    label: 'POST /api/admin/masters/refresh (mutate — admin/manager)',
    method: 'post',
    router: 'adminMasters',
    path: '/api/admin/masters/refresh',
    expect: { user: 'DENY_403', dev: 'DENY_403', manager: 'ALLOW', admin: 'ALLOW' },
  },

  // §8.3: VOC Soft Delete / 복원 — admin only (existence-hiding)
  // Real path is /api/admin/vocs/trash (admin-trash router). Spec ADR 0005.
  {
    label: 'GET /api/admin/vocs/trash (admin-only, existence-hiding)',
    method: 'get',
    router: 'adminTrash',
    path: '/api/admin/vocs/trash',
    expect: {
      user: 'DENY_404_HIDE',
      dev: 'DENY_404_HIDE',
      manager: 'DENY_404_HIDE',
      admin: 'ALLOW',
    },
  },
  {
    label: 'PATCH /api/vocs/:id/restore (admin-only, existence-hiding)',
    method: 'patch',
    router: 'voc',
    path: `/api/vocs/${VOC_ID}/restore`,
    expect: {
      user: 'DENY_404_HIDE',
      dev: 'DENY_404_HIDE',
      manager: 'DENY_404_HIDE',
      admin: 'ALLOW',
    },
  },

  // §8.3: 사용자 role 관리 — admin only (existence-hiding)
  {
    label: 'GET /api/admin/users (admin-only, existence-hiding)',
    method: 'get',
    router: 'adminUsers',
    path: '/api/admin/users',
    expect: {
      user: 'DENY_404_HIDE',
      dev: 'DENY_404_HIDE',
      manager: 'DENY_404_HIDE',
      admin: 'ALLOW',
    },
  },
  {
    label: 'PATCH /api/admin/users/:id (admin-only, existence-hiding)',
    method: 'patch',
    router: 'adminUsers',
    path: `/api/admin/users/${USER_TARGET_ID}`,
    body: { role: 'manager' },
    expect: {
      user: 'DENY_404_HIDE',
      dev: 'DENY_404_HIDE',
      manager: 'DENY_404_HIDE',
      admin: 'ALLOW',
    },
  },
];

// ── Assertions ───────────────────────────────────────────────────────────────

function assertOutcome(
  res: { status: number; body: unknown },
  outcome: Outcome,
): void {
  switch (outcome) {
    case 'DENY_403':
      expect(res.status).toBe(403);
      return;
    case 'DENY_404_HIDE':
    case 'DENY_404_USER':
      expect(res.status).toBe(404);
      return;
    case 'DEV_OWN_403':
      expect(res.status).toBe(403);
      return;
    case 'ALLOW':
      // Gate did not reject. Accept any 2xx/3xx/4xx response so per-route
      // tests own the exact status. Forbid 401/403 (gate-level rejection)
      // AND 5xx — a 500 means the gate passed but downstream broke,
      // which would silently hide a regression in this matrix (codex P2).
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
      expect(res.status).toBeLessThan(500);
      return;
  }
}

// ── Test runner ──────────────────────────────────────────────────────────────

describe('Permission matrix (§8.3 + §13.2 — consolidated, FU-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Anonymous session → 401', () => {
    for (const cell of matrix) {
      it(`${cell.label}`, async () => {
        const app = makeApp('anon', cell.router);
        const req = request(app)[cell.method](cell.path);
        const res = await (cell.body ? req.send(cell.body) : req);
        expect(res.status).toBe(401);
        // Lock the mockAuth body shape so envelope drift surfaces here.
        // mockAuthMiddleware emits `{ error: 'Unauthorized' }` (string body,
        // not the standard error envelope). If the auth middleware ever
        // switches to the canonical envelope, this assertion forces the
        // matrix to update in lockstep.
        expect(res.body).toEqual({ error: 'Unauthorized' });
      });
    }
  });

  for (const role of ['user', 'dev', 'manager', 'admin'] as const) {
    describe(`${role} role`, () => {
      for (const cell of matrix) {
        const outcome = cell.expect[role];
        it(`${cell.label} → ${outcome}`, async () => {
          const app = makeApp(role, cell.router);
          const req = request(app)[cell.method](cell.path);
          const res = await (cell.body ? req.send(cell.body) : req);
          assertOutcome(res, outcome);
        });
      }
    });
  }
});
