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
        voc_type_ids?: string[];
        assignees?: string[];
        priorities?: string[];
        tag_ids?: string[];
        per_page?: number;
        page?: number;
        sort_by?: 'issue_code' | 'title' | 'status' | 'assignee' | 'priority' | 'created_at';
        sort_dir?: 'asc' | 'desc';
        includeDeleted?: boolean;
      }) => {
        const per_page = params.per_page ?? 20;
        const page = params.page ?? 1;
        let filtered = store.filter((r) => params.includeDeleted || r.deleted_at === null);
        if (params.status?.length) {
          filtered = filtered.filter((r) => params.status!.includes(r.status));
        }
        if (params.voc_type_ids?.length) {
          filtered = filtered.filter((r) => params.voc_type_ids!.includes(r.voc_type_id));
        }
        if (params.assignees?.length) {
          filtered = filtered.filter(
            (r) => r.assignee_id !== null && params.assignees!.includes(r.assignee_id),
          );
        }
        if (params.priorities?.length) {
          filtered = filtered.filter((r) => params.priorities!.includes(r.priority));
        }
        // tag_ids filtering — fixtures don't carry tag relations; treat as no-op
        // unless test wires tags via store mutation. EXISTS-subquery-equivalent.
        if (params.sort_by) {
          const dir = params.sort_dir === 'asc' ? 1 : -1;
          const key = params.sort_by === 'assignee' ? 'assignee_id' : params.sort_by;
          filtered = [...filtered].sort((a, b) => {
            const av = (a as unknown as Record<string, unknown>)[key];
            const bv = (b as unknown as Record<string, unknown>)[key];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return (av as string) < (bv as string) ? -dir : dir;
          });
        }
        const total = filtered.length;
        const start = (page - 1) * per_page;
        // listVocs projects `tags: string[]` via correlated subquery in prod
        // (`backend/src/repository/voc.ts` array_agg). Mock surfaces the same
        // shape — empty by default; tests that need wired tags can override
        // via repoMock.listVocs.mockResolvedValueOnce.
        return {
          rows: filtered
            .slice(start, start + per_page)
            .map((r) => ({ ...r, tags: [] as string[] })),
          total,
        };
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
    listHistory: jest.fn(async (vocId: string) => {
      const all = (
        jest.requireActual('../../../shared/fixtures/voc.fixtures') as {
          VOC_HISTORY_FIXTURES: Array<{
            id: string;
            voc_id: string;
            field: string;
            old_value: string | null;
            new_value: string | null;
            changed_by: string;
            changed_at: string;
          }>;
        }
      ).VOC_HISTORY_FIXTURES;
      return all.filter((h) => h.voc_id === vocId);
    }),
    createVoc: jest.fn(
      async (
        input: {
          title: string;
          body?: string;
          status?: string;
          priority?: string;
          voc_type_id: string;
          system_id: string;
          menu_id: string;
          assignee_id?: string | null;
          parent_id?: string | null;
          source?: string;
        },
        authorId: string,
      ) => {
        const now = new Date().toISOString();
        const seq = store.length + 1;
        const row = {
          id: `aaaaaaaa-0000-4000-8000-${String(seq).padStart(12, '0')}`,
          issue_code: `VOC-${String(seq).padStart(4, '0')}`,
          sequence_no: seq,
          title: input.title,
          body: input.body ?? '',
          status: input.status ?? '접수',
          priority: input.priority ?? 'medium',
          voc_type_id: input.voc_type_id,
          system_id: input.system_id,
          menu_id: input.menu_id,
          assignee_id: input.assignee_id ?? null,
          author_id: authorId,
          parent_id: input.parent_id ?? null,
          source: input.source ?? 'manual',
          review_status: null,
          structured_payload: null,
          resolution_quality: null,
          drop_reason: null,
          due_date: null,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        } as Row;
        store.push(row);
        return row;
      },
    ),
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
  listVocs: jest.Mock;
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
    const res = await agent.get('/api/vocs?status=%EC%A0%91%EC%88%98&per_page=20');
    expect(res.status).toBe(200);
    expect(() => VocListResponse.parse(res.body)).not.toThrow();
  });

  test('B-T2 GET /api/vocs?per_page=999 returns 400 VALIDATION_ERROR', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/vocs?per_page=999');
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('VALIDATION_ERROR');
  });

  test('B-T2.5 GET /api/vocs projects tags array per row (issue 156 contract)', async () => {
    // Wire a single row's tags through the repo mock so the route → service →
    // contract path is exercised end-to-end. Guards against future regression
    // where service silently drops the field (e.g. reverting to `?? []`).
    const targetId = VOC_FIXTURES.find((r) => r.deleted_at === null)!.id;
    repoMock.listVocs.mockResolvedValueOnce({
      rows: VOC_FIXTURES.filter((r) => r.deleted_at === null)
        .slice(0, 3)
        .map((r) => ({
          ...r,
          tags: r.id === targetId ? ['버그', '긴급'] : [],
        })),
      total: 3,
    });
    const agent = await loginAs('manager');
    const res = await agent.get('/api/vocs?per_page=20');
    expect(res.status).toBe(200);
    const parsed = VocListResponse.parse(res.body);
    const target = parsed.rows.find((r) => r.id === targetId);
    expect(target?.tags).toEqual(['버그', '긴급']);
    for (const row of parsed.rows) {
      expect(Array.isArray(row.tags)).toBe(true);
    }
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
    const res = await agent.get('/api/vocs?includeDeleted=true&per_page=100');
    expect(res.status).toBe(200);
    const ids = (res.body.rows as Array<{ id: string }>).map((r) => r.id);
    expect(ids).not.toContain(deletedVoc.id);
  });

  test('B-T9 ?voc_type_ids filter is applied at repository (no silent drop)', async () => {
    const targetType = liveVoc.voc_type_id;
    const expectedIds = VOC_FIXTURES.filter(
      (r) => r.deleted_at === null && r.voc_type_id === targetType,
    ).map((r) => r.id);
    const agent = await loginAs('manager');
    const res = await agent.get(
      `/api/vocs?voc_type_ids=${encodeURIComponent(targetType)}&per_page=100`,
    );
    expect(res.status).toBe(200);
    const ids = (res.body.rows as Array<{ id: string }>).map((r) => r.id).sort();
    expect(ids).toEqual([...expectedIds].sort());
  });

  // ─── PR-α (Wave 1.5) — sort_by / sort_dir / per_page / multi-filter ───
  describe('Wave 1.5 §1.5-A — extended list contract', () => {
    test.each(['issue_code', 'title', 'status', 'assignee', 'priority', 'created_at'] as const)(
      'sort_by=%s returns 200 + parsed VocListResponse + repo called with sort_by/sort_dir',
      async (col) => {
        const agent = await loginAs('manager');
        const res = await agent.get(`/api/vocs?sort_by=${col}&sort_dir=asc&per_page=50`);
        expect(res.status).toBe(200);
        expect(() => VocListResponse.parse(res.body)).not.toThrow();
        expect(repoMock.listVocs).toHaveBeenCalledWith(
          expect.objectContaining({ sort_by: col, sort_dir: 'asc' }),
        );
      },
    );

    test('sort_dir=desc forwards desc to repo', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get('/api/vocs?sort_by=created_at&sort_dir=desc&per_page=50');
      expect(res.status).toBe(200);
      expect(repoMock.listVocs).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'created_at', sort_dir: 'desc' }),
      );
    });

    test('invalid sort_by=foo returns 400 VALIDATION_ERROR', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get('/api/vocs?sort_by=foo');
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    test('invalid sort_dir=invalid returns 400 VALIDATION_ERROR', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get('/api/vocs?sort_dir=invalid');
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    test('multi-filter AND: assignees + priorities applied conjunctively', async () => {
      const agent = await loginAs('manager');
      // pick assignee + priority with overlap
      const targetAssignee = FIXTURE_USERS.devSelf;
      const targetPriority = 'urgent';
      const expectedIds = VOC_FIXTURES.filter(
        (r) =>
          r.deleted_at === null &&
          r.assignee_id === targetAssignee &&
          r.priority === targetPriority,
      ).map((r) => r.id);
      const res = await agent.get(
        `/api/vocs?assignees=${encodeURIComponent(targetAssignee)}&priorities=${targetPriority}&per_page=100`,
      );
      expect(res.status).toBe(200);
      const ids = (res.body.rows as Array<{ id: string }>).map((r) => r.id).sort();
      expect(ids).toEqual([...expectedIds].sort());
    });

    test('pagination: page=1 + page=2 + per_page=20 yield disjoint rows, consistent total', async () => {
      const agent = await loginAs('manager');
      const r1 = await agent.get('/api/vocs?page=1&per_page=20&sort_by=created_at&sort_dir=desc');
      const r2 = await agent.get('/api/vocs?page=2&per_page=20&sort_by=created_at&sort_dir=desc');
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.total).toBe(r2.body.total);
      expect(r1.body.per_page).toBe(20);
      expect(r2.body.page).toBe(2);
      const ids1 = new Set((r1.body.rows as Array<{ id: string }>).map((r) => r.id));
      const ids2 = new Set((r2.body.rows as Array<{ id: string }>).map((r) => r.id));
      for (const id of ids2) expect(ids1.has(id)).toBe(false);
    });

    test('response shape uses per_page (not pageSize)', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get('/api/vocs?per_page=5');
      expect(res.status).toBe(200);
      expect(res.body.per_page).toBe(5);
      expect(res.body.pageSize).toBeUndefined();
    });
  });

  // ─── PR #121 review Finding 2 — reassign 권한 + multi-field 우회 차단 ───
  describe('Wave 1.5 §reassign — assignee_id PATCH 권한 매트릭스', () => {
    test('Dev (own VOC) PATCH { assignee_id: null } returns 403 reassign', async () => {
      const agent = await loginAs('dev');
      const res = await agent.patch(`/api/vocs/${liveVoc.id}`).send({ assignee_id: null });
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
      expect(res.body.error?.details?.action).toBe('reassign');
    });

    test('Dev (own VOC) PATCH { assignee_id: <other> } returns 403 reassign', async () => {
      const agent = await loginAs('dev');
      const res = await agent
        .patch(`/api/vocs/${liveVoc.id}`)
        .send({ assignee_id: FIXTURE_USERS.devOther });
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
      expect(res.body.error?.details?.action).toBe('reassign');
    });

    test('Dev (own VOC) PATCH { assignee_id, status } returns 403 (multi-field bypass blocked)', async () => {
      const agent = await loginAs('dev');
      const res = await agent
        .patch(`/api/vocs/${liveVoc.id}`)
        .send({ assignee_id: FIXTURE_USERS.devOther, status: '처리중' });
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
      // reassign 가 먼저 평가되어야 함 (multi-field 우회 차단 핵심)
      expect(res.body.error?.details?.action).toBe('reassign');
    });

    test('User (own VOC) PATCH { assignee_id: null } returns 403', async () => {
      const agent = await loginAs('user');
      const res = await agent.patch(`/api/vocs/${liveVoc.id}`).send({ assignee_id: null });
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
      expect(res.body.error?.details?.action).toBe('reassign');
    });

    test('Manager PATCH { assignee_id: <other> } returns 200', async () => {
      const agent = await loginAs('manager');
      const res = await agent
        .patch(`/api/vocs/${liveVoc.id}`)
        .send({ assignee_id: FIXTURE_USERS.devOther });
      expect(res.status).toBe(200);
      expect(res.body.assignee_id).toBe(FIXTURE_USERS.devOther);
    });

    test('Admin PATCH { assignee_id: null } returns 200', async () => {
      const agent = await loginAs('admin');
      const res = await agent.patch(`/api/vocs/${liveVoc.id}`).send({ assignee_id: null });
      expect(res.status).toBe(200);
      expect(res.body.assignee_id).toBeNull();
    });
  });

  // ─── Wave 1.5 PR-β (codex review HIGH) — POST /api/vocs ───
  describe('Wave 1.5 §β-create — POST /api/vocs', () => {
    test('manager POST valid payload returns 201 + created VOC (status=접수, author_id=self)', async () => {
      const agent = await loginAs('manager');
      const res = await agent.post('/api/vocs').send({
        title: 'New issue from API',
        body: '본문',
        voc_type_id: liveVoc.voc_type_id,
        system_id: liveVoc.system_id,
        menu_id: liveVoc.menu_id,
        priority: 'high',
      });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New issue from API');
      expect(res.body.status).toBe('접수');
      expect(res.body.author_id).toBe(FIXTURE_USERS.manager);
    });

    test('POST invalid payload (missing title) returns 400 VALIDATION_ERROR', async () => {
      const agent = await loginAs('manager');
      const res = await agent.post('/api/vocs').send({
        voc_type_id: liveVoc.voc_type_id,
        system_id: liveVoc.system_id,
        menu_id: liveVoc.menu_id,
      });
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── Wave 1.5 PR-β (codex review MED) — GET /api/vocs/:id/history ───
  describe('Wave 1.5 §β-history — GET /api/vocs/:id/history', () => {
    test('existing VOC returns 200 + VocHistoryListResponse rows', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get(`/api/vocs/${VOC_FIXTURES[0]!.id}/history`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);
      expect(res.body.rows.length).toBeGreaterThan(0);
    });

    test('non-existent VOC id returns 404 NOT_FOUND', async () => {
      const agent = await loginAs('manager');
      const res = await agent.get('/api/vocs/00000000-0000-4000-8000-00000000ffff/history');
      expect(res.status).toBe(404);
    });
  });
});
