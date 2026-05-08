import request from 'supertest';
import { createTestApp } from './helpers/app';
import {
  AssigneeListResponse,
  MenuListResponse,
  SystemListResponse,
  TagListResponse,
  VocTypeListResponse,
  type AssigneeListItem,
  type MenuListItem,
  type SystemListItem,
  type TagListItem,
  type VocTypeListItem,
} from '../../../shared/contracts/master';

/**
 * PR-α Wave 1.5 — masters list endpoints (assignees / tags / voc-types).
 *
 * U3=A pattern: jest.mock('../repository/masters') for module-level isolation,
 * matching the approach used in vocs.test.ts.
 */

const ASSIGNEES: AssigneeListItem[] = [
  {
    id: '11111111-aaaa-4aaa-8aaa-111111111111',
    ad_username: 'alice',
    display_name: 'Alice',
  },
  {
    id: '22222222-aaaa-4aaa-8aaa-222222222222',
    ad_username: 'bob',
    display_name: 'Bob',
  },
];

const TAGS: TagListItem[] = [
  {
    id: 'aaaaaaaa-bbbb-4bbb-8bbb-000000000001',
    name: 'BugFix',
    slug: 'bugfix',
    kind: 'general',
  },
  {
    id: 'aaaaaaaa-bbbb-4bbb-8bbb-000000000002',
    name: 'MenuPortal',
    slug: 'menu-p',
    kind: 'menu',
  },
];

const VOC_TYPES: VocTypeListItem[] = [
  {
    id: 'cccccccc-dddd-4ddd-8ddd-000000000001',
    name: 'Bug',
    slug: 'bug',
    color: 'red-500',
    sort_order: 1,
    is_archived: false,
  },
  {
    id: 'cccccccc-dddd-4ddd-8ddd-000000000002',
    name: 'Feature',
    slug: 'feature',
    color: 'blue-500',
    sort_order: 2,
    is_archived: false,
  },
];

const SYSTEMS: SystemListItem[] = [
  {
    id: 'eeeeeeee-1111-4111-8111-000000000001',
    name: 'Analytics',
    slug: 'analytics',
    is_archived: false,
    menus: [
      {
        id: 'ffffffff-1111-4111-8111-000000000001',
        system_id: 'eeeeeeee-1111-4111-8111-000000000001',
        name: 'Dashboard',
        slug: 'dashboard',
        is_archived: false,
      },
    ],
  },
];

const ALL_MENUS: MenuListItem[] = [
  {
    id: 'ffffffff-1111-4111-8111-000000000001',
    system_id: 'eeeeeeee-1111-4111-8111-000000000001',
    name: 'Dashboard',
    slug: 'dashboard',
    is_archived: false,
  },
  {
    id: 'ffffffff-1111-4111-8111-000000000002',
    system_id: 'eeeeeeee-1111-4111-8111-000000000001',
    name: 'Legacy',
    slug: 'legacy',
    is_archived: true,
  },
];

jest.mock('../repository/masters', () => ({
  listAssignees: jest.fn(async () => ASSIGNEES),
  listTags: jest.fn(async () => TAGS),
  listVocTypes: jest.fn(async () => VOC_TYPES),
  listSystems: jest.fn(async () => SYSTEMS),
  listMenus: jest.fn(async (opts: { systemId?: string; includeArchived?: boolean } = {}) => {
    return ALL_MENUS.filter((m) => {
      if (opts.systemId && m.system_id !== opts.systemId) return false;
      if (!opts.includeArchived && m.is_archived) return false;
      return true;
    });
  }),
}));

async function loginAs(role: 'admin' | 'manager' | 'user') {
  const app = createTestApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

describe('GET /api/masters/* — Wave 1.5 master data', () => {
  test('GET /api/masters/assignees → 200 + AssigneeListResponse', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/masters/assignees');
    expect(res.status).toBe(200);
    expect(() => AssigneeListResponse.parse(res.body)).not.toThrow();
    expect(res.body.rows).toHaveLength(ASSIGNEES.length);
  });

  test('GET /api/masters/tags → 200 + TagListResponse', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/masters/tags');
    expect(res.status).toBe(200);
    expect(() => TagListResponse.parse(res.body)).not.toThrow();
    expect(res.body.rows).toHaveLength(TAGS.length);
  });

  test('GET /api/masters/voc-types → 200 + VocTypeListResponse', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/masters/voc-types');
    expect(res.status).toBe(200);
    expect(() => VocTypeListResponse.parse(res.body)).not.toThrow();
    expect(res.body.rows).toHaveLength(VOC_TYPES.length);
  });

  test('unauthenticated GET /api/masters/assignees → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/masters/assignees');
    expect(res.status).toBe(401);
  });

  test('unauthenticated GET /api/masters/tags → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/masters/tags');
    expect(res.status).toBe(401);
  });

  test('unauthenticated GET /api/masters/voc-types → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/masters/voc-types');
    expect(res.status).toBe(401);
  });

  // Wave 1.7 Phase B — VOC 등록 모달 cascade
  test('GET /api/masters/systems → 200 + nested menus', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/masters/systems');
    expect(res.status).toBe(200);
    expect(() => SystemListResponse.parse(res.body)).not.toThrow();
    expect(res.body.rows).toHaveLength(SYSTEMS.length);
    expect(res.body.rows[0].menus).toHaveLength(1);
  });

  test('unauthenticated GET /api/masters/systems → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/masters/systems');
    expect(res.status).toBe(401);
  });

  // Wave 1.7 Phase B — Admin 단독 + includeArchived 옵션 (contracts/master/io.ts:50)
  test('admin GET /api/masters/menus → 200 + 기본 archived 제외', async () => {
    const agent = await loginAs('admin');
    const res = await agent.get('/api/masters/menus');
    expect(res.status).toBe(200);
    expect(() => MenuListResponse.parse(res.body)).not.toThrow();
    expect(res.body.rows.every((m: MenuListItem) => !m.is_archived)).toBe(true);
  });

  test('admin GET /api/masters/menus?includeArchived=true → archived row 포함', async () => {
    const agent = await loginAs('admin');
    const res = await agent.get('/api/masters/menus?includeArchived=true');
    expect(res.status).toBe(200);
    expect(res.body.rows.some((m: MenuListItem) => m.is_archived)).toBe(true);
  });

  test('user GET /api/masters/menus → 403 (admin 단독)', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/masters/menus');
    expect(res.status).toBe(403);
  });

  test('manager GET /api/masters/menus → 403 (admin 단독)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/masters/menus');
    expect(res.status).toBe(403);
  });
});
