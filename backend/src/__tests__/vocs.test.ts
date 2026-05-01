import request from 'supertest';
import { createTestApp } from './helpers/app';
import { VocListResponse } from '../../../shared/contracts/voc';
import { VOC_FIXTURES, FIXTURE_USERS } from '../../../shared/fixtures/voc.fixtures';

/**
 * Phase 8 Wave 1 BE 회귀 매트릭스 (plan §6-3 + adversarial review B-T7).
 *
 * U3=A: 테스트는 mock repository(jest.mock) 모듈 단위 mocking 으로 동작.
 */
jest.mock('../repository/voc', () => {
  type Row = (typeof import('../../../shared/fixtures/voc.fixtures'))['VOC_FIXTURES'][number];
  const fixtures = jest.requireActual('../../../shared/fixtures/voc.fixtures') as {
    VOC_FIXTURES: Row[];
    VOC_NOTES_FIXTURES: Array<{
      id: string;
      voc_id: string;
      author_id: string;
      body: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    }>;
  };
  const store: Row[] = [...fixtures.VOC_FIXTURES];
  const noteStore = [...fixtures.VOC_NOTES_FIXTURES];

  return {
    listVocs: jest.fn(
      async (params: {
        status?: string[];
        voc_type_id?: string[];
        limit?: number;
        page?: number;
        includeDeleted?: boolean;
      }) => {
        const limit = params.limit ?? 20;
        const page = params.page ?? 1;
        let filtered = store.filter((r) => params.includeDeleted || r.deleted_at === null);
        if (params.status?.length) {
          filtered = filtered.filter((r) => params.status!.includes(r.status));
        }
        if (params.voc_type_id?.length) {
          filtered = filtered.filter((r) => params.voc_type_id!.includes(r.voc_type_id));
        }
        const total = filtered.length;
        const start = (page - 1) * limit;
        return { rows: filtered.slice(start, start + limit), total };
      },
    ),
    getVocById: jest.fn(async (id: string, opts: { includeDeleted?: boolean } = {}) => {
      const row = store.find((r) => r.id === id);
      if (!row) return null;
      if (!opts.includeDeleted && row.deleted_at !== null) return null;
      return row;
    }),
    updateVoc: jest.fn(async (id: string, patch: Partial<Row>) => {
      const idx = store.findIndex((r) => r.id === id);
      if (idx < 0) return null;
      const next = { ...store[idx]!, ...patch, updated_at: new Date().toISOString() } as Row;
      store[idx] = next;
      return next;
    }),
    listNotes: jest.fn(async (vocId: string) => noteStore.filter((n) => n.voc_id === vocId)),
    createNote: jest.fn(async (vocId: string, authorId: string, body: string) => {
      const now = new Date().toISOString();
      const row = {
        id: `dddddddd-0000-4000-8000-${String(noteStore.length + 1).padStart(12, '0')}`,
        voc_id: vocId,
        author_id: authorId,
        body,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      noteStore.push(row);
      return row;
    }),
    listHistory: jest.fn(async () => []),
    __reset: () => {
      store.length = 0;
      store.push(...fixtures.VOC_FIXTURES);
      noteStore.length = 0;
      noteStore.push(...fixtures.VOC_NOTES_FIXTURES);
    },
  };
});

const repoMock = jest.requireMock('../repository/voc') as {
  __reset: () => void;
};

beforeEach(() => {
  repoMock.__reset();
  jest.clearAllMocks();
});

const liveVoc = VOC_FIXTURES.find(
  (r) => r.deleted_at === null && r.assignee_id === FIXTURE_USERS.devSelf,
)!;
const otherDevVoc = VOC_FIXTURES.find(
  (r) => r.deleted_at === null && r.assignee_id !== null && r.assignee_id !== FIXTURE_USERS.devSelf,
)!;
const deletedVoc = VOC_FIXTURES.find((r) => r.deleted_at !== null)!;

async function loginAs(role: 'admin' | 'manager' | 'dev' | 'user') {
  const app = createTestApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

describe('VOC endpoints — Wave 1 회귀 매트릭스', () => {
  test('B-T1 GET /api/vocs returns 200 + VocListResponse for manager', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/vocs?status=%EC%A0%91%EC%88%98&limit=20');
    expect(res.status).toBe(200);
    expect(() => VocListResponse.parse(res.body)).not.toThrow();
  });

  test('B-T2 GET /api/vocs?limit=999 returns 400 VALIDATION_ERROR', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/vocs?limit=999');
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('VALIDATION_ERROR');
  });

  test('B-T3 dev PATCH on someone else’s VOC returns 403 FORBIDDEN action=changeStatus', async () => {
    const agent = await loginAs('dev');
    const res = await agent.patch(`/api/vocs/${otherDevVoc.id}`).send({ status: '검토중' });
    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
    expect(res.body.error?.details?.action).toBe('changeStatus');
  });

  test('B-T4 GET /api/vocs/:id returns 404 for soft-deleted VOC (manager)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get(`/api/vocs/${deletedVoc.id}`);
    expect(res.status).toBe(404);
  });

  test('B-T5 dev=self POST /api/vocs/:id/notes returns 200', async () => {
    const agent = await loginAs('dev');
    const res = await agent.post(`/api/vocs/${liveVoc.id}/notes`).send({ body: 'triage start' });
    expect(res.status).toBe(200);
    expect(res.body.body).toBe('triage start');
  });

  test('B-T6 dev=self priority change returns 200 (Q5=A regression)', async () => {
    const agent = await loginAs('dev');
    const res = await agent.patch(`/api/vocs/${liveVoc.id}`).send({ priority: 'urgent' });
    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('urgent');
  });

  test('B-T7 user GET /api/vocs/:id/notes returns 404 fail-closed (architect 권고)', async () => {
    const agent = await loginAs('user');
    const res = await agent.get(`/api/vocs/${liveVoc.id}/notes`);
    expect(res.status).toBe(404);
  });

  test('B-T8 non-admin ?includeDeleted=true does not leak soft-deleted rows', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/vocs?includeDeleted=true&limit=100');
    expect(res.status).toBe(200);
    const ids = (res.body.rows as Array<{ id: string }>).map((r) => r.id);
    expect(ids).not.toContain(deletedVoc.id);
  });

  test('B-T9 ?voc_type_id filter is applied at repository (no silent drop)', async () => {
    const targetType = liveVoc.voc_type_id;
    const expectedIds = VOC_FIXTURES.filter(
      (r) => r.deleted_at === null && r.voc_type_id === targetType,
    ).map((r) => r.id);
    const agent = await loginAs('manager');
    const res = await agent.get(
      `/api/vocs?voc_type_id=${encodeURIComponent(targetType)}&limit=100`,
    );
    expect(res.status).toBe(200);
    const ids = (res.body.rows as Array<{ id: string }>).map((r) => r.id).sort();
    expect(ids).toEqual([...expectedIds].sort());
  });
});
