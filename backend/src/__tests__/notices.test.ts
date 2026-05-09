/**
 * Wave 4 — /api/notices route tests.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3, §10.5.
 *
 * U3=A pattern: jest.mock('../repository/notices') for module-level isolation.
 */
import request from 'supertest';
import * as noticesRepoModule from '../repository/notices';
import { createTestApp } from './helpers/app';
import type { Notice } from '../../../shared/contracts/notice';

const ISO = '2026-04-01T00:00:00.000Z';

const NOTICE_A: Notice = {
  id: '11111111-aaaa-4aaa-8aaa-000000000001',
  title: '긴급 공지',
  body: '본문 A',
  level: 'urgent',
  is_popup: true,
  is_visible: true,
  visible_from: null,
  visible_to: null,
  author_id: '00000000-0000-4000-8000-0000000000a1',
  deleted_at: null,
  created_at: ISO,
  updated_at: ISO,
};
const NOTICE_B: Notice = {
  ...NOTICE_A,
  id: '11111111-aaaa-4aaa-8aaa-000000000002',
  title: '일반 공지',
  body: '본문 B',
  level: 'normal',
  is_popup: false,
};
const NOTICE_DELETED: Notice = {
  ...NOTICE_A,
  id: '11111111-aaaa-4aaa-8aaa-000000000003',
  title: '삭제된 공지',
  level: 'normal',
  deleted_at: ISO,
};

jest.mock('../repository/notices', () => {
  const store: Notice[] = [];
  return {
    __reset(seed: Notice[]) {
      store.length = 0;
      store.push(...seed);
    },
    __all() {
      return store;
    },
    list: jest.fn(
      async (opts: {
        page: number;
        per_page: number;
        mode?: 'user' | 'admin';
        includeDeleted?: boolean;
      }) => {
        let rows = store.slice();
        if (!opts.includeDeleted) rows = rows.filter((r) => r.deleted_at === null);
        if (opts.mode !== 'admin') rows = rows.filter((r) => r.is_visible);
        return { rows, total: rows.length };
      },
    ),
    popup: jest.fn(async () => store.filter((r) => !r.deleted_at && r.is_visible && r.is_popup)),
    getById: jest.fn(async (id: string) => store.find((r) => r.id === id) ?? null),
    create: jest.fn(
      async (
        input: {
          title: string;
          body: string;
          level?: Notice['level'];
          is_popup?: boolean;
          is_visible?: boolean;
          visible_from?: string | null;
          visible_to?: string | null;
        },
        authorId: string,
      ) => {
        const created: Notice = {
          id: `99999999-aaaa-4aaa-8aaa-${String(store.length).padStart(12, '0')}`,
          title: input.title,
          body: input.body,
          level: input.level ?? 'normal',
          is_popup: input.is_popup ?? false,
          is_visible: input.is_visible ?? true,
          visible_from: input.visible_from ?? null,
          visible_to: input.visible_to ?? null,
          author_id: authorId,
          deleted_at: null,
          created_at: ISO,
          updated_at: ISO,
        };
        store.push(created);
        return created;
      },
    ),
    update: jest.fn(async (id: string, patch: Partial<Notice>) => {
      const i = store.findIndex((r) => r.id === id);
      if (i < 0) return null;
      store[i] = { ...store[i], ...patch } as Notice;
      return store[i];
    }),
    softDelete: jest.fn(async (id: string) => {
      const i = store.findIndex((r) => r.id === id && !r.deleted_at);
      if (i < 0) return false;
      store[i] = { ...store[i], deleted_at: ISO };
      return true;
    }),
    restore: jest.fn(async (id: string) => {
      const i = store.findIndex((r) => r.id === id);
      if (i < 0) return null;
      store[i] = { ...store[i], deleted_at: null };
      return store[i];
    }),
  };
});

const repoMock = noticesRepoModule as unknown as {
  __reset(seed: Notice[]): void;
  __all(): Notice[];
};

beforeEach(() => {
  repoMock.__reset([NOTICE_A, NOTICE_B, NOTICE_DELETED]);
});

async function loginAs(role: 'admin' | 'manager' | 'user' | 'dev') {
  const app = createTestApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

describe('GET /api/notices', () => {
  test('user — visibility-filtered list, no deleted', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/notices');
    expect(res.status).toBe(200);
    expect(res.body.rows.map((r: Notice) => r.id)).toEqual([NOTICE_A.id, NOTICE_B.id]);
  });

  test('admin mode=admin&includeDeleted=true → 모든 행', async () => {
    const agent = await loginAs('admin');
    const res = await agent.get('/api/notices?mode=admin&includeDeleted=true');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(3);
  });

  test('user 가 mode=admin 요청해도 user 모드로 강등', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/notices?mode=admin&includeDeleted=true');
    expect(res.status).toBe(200);
    expect(res.body.rows.every((r: Notice) => r.deleted_at === null)).toBe(true);
  });

  test('unauthenticated → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/notices');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/notices/popup', () => {
  test('popup 대상만 (visible & is_popup & 미삭제)', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/notices/popup');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0].id).toBe(NOTICE_A.id);
  });
});

describe('POST /api/notices', () => {
  test('admin 등록 → 201', async () => {
    const agent = await loginAs('admin');
    const res = await agent.post('/api/notices').send({
      title: '신규',
      body: 'X',
      level: 'important',
      is_popup: false,
      is_visible: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('신규');
  });

  test('manager 등록 → 201', async () => {
    const agent = await loginAs('manager');
    const res = await agent.post('/api/notices').send({ title: 'M', body: 'b' });
    expect(res.status).toBe(201);
  });

  test('user 등록 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.post('/api/notices').send({ title: 'X', body: 'X' });
    expect(res.status).toBe(403);
  });

  test('dev 등록 → 403', async () => {
    const agent = await loginAs('dev');
    const res = await agent.post('/api/notices').send({ title: 'X', body: 'X' });
    expect(res.status).toBe(403);
  });

  test('빈 title → 400', async () => {
    const agent = await loginAs('admin');
    const res = await agent.post('/api/notices').send({ title: '', body: 'b' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/notices/:id', () => {
  test('admin 수정 → 200', async () => {
    const agent = await loginAs('admin');
    const res = await agent.patch(`/api/notices/${NOTICE_A.id}`).send({ title: '수정' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정');
  });

  test('user 수정 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.patch(`/api/notices/${NOTICE_A.id}`).send({ title: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/notices/:id (soft)', () => {
  test('manager soft delete → 204', async () => {
    const agent = await loginAs('manager');
    const res = await agent.delete(`/api/notices/${NOTICE_A.id}`);
    expect(res.status).toBe(204);
  });

  test('user delete → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.delete(`/api/notices/${NOTICE_A.id}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/notices/:id/restore', () => {
  test('admin 복원 → 200', async () => {
    const agent = await loginAs('admin');
    const res = await agent.post(`/api/notices/${NOTICE_DELETED.id}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.deleted_at).toBeNull();
  });

  test('manager 복원 → 403 (admin only)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.post(`/api/notices/${NOTICE_DELETED.id}/restore`);
    expect(res.status).toBe(403);
  });

  test('user 복원 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.post(`/api/notices/${NOTICE_DELETED.id}/restore`);
    expect(res.status).toBe(403);
  });
});
