/**
 * Wave 4 — /api/faq-categories route tests.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4.4, §10.5.
 */
import request from 'supertest';
import { createTestApp } from './helpers/app';
import type { FaqCategory } from '../../../shared/contracts/faq';

const CAT_A: FaqCategory = {
  id: '22222222-cccc-4ccc-8ccc-000000000001',
  name: '일반',
  slug: 'general',
  sort_order: 1,
  is_archived: false,
};
const CAT_B: FaqCategory = {
  id: '22222222-cccc-4ccc-8ccc-000000000002',
  name: '계정',
  slug: 'account',
  sort_order: 2,
  is_archived: false,
};

jest.mock('../repository/faqs', () => {
  const catStore: FaqCategory[] = [];
  let categoryHasItems = false;
  return {
    __resetCats(seed: FaqCategory[], hasItems = false) {
      catStore.length = 0;
      catStore.push(...seed);
      categoryHasItems = hasItems;
    },
    listCategories: jest.fn(async () => catStore.slice()),
    getCategoryById: jest.fn(async (id: string) => catStore.find((r) => r.id === id) ?? null),
    createCategory: jest.fn(async (input: Omit<FaqCategory, 'id'>) => {
      const created: FaqCategory = {
        id: `99999999-cccc-4ccc-8ccc-${String(catStore.length).padStart(12, '0')}`,
        ...input,
      };
      catStore.push(created);
      return created;
    }),
    updateCategory: jest.fn(async (id: string, patch: Partial<FaqCategory>) => {
      const i = catStore.findIndex((r) => r.id === id);
      if (i < 0) return null;
      catStore[i] = { ...catStore[i], ...patch } as FaqCategory;
      return catStore[i];
    }),
    deleteCategory: jest.fn(async (id: string) => {
      if (categoryHasItems) return { ok: false, reason: 'has_items' as const };
      const i = catStore.findIndex((r) => r.id === id);
      if (i < 0) return { ok: false };
      catStore.splice(i, 1);
      return { ok: true };
    }),
    // FAQ items — needed because faqs.ts route imports the same module.
    listFaqs: jest.fn(async () => ({ rows: [], total: 0 })),
    getFaqById: jest.fn(async () => null),
    createFaq: jest.fn(),
    updateFaq: jest.fn(),
    softDeleteFaq: jest.fn(),
    restoreFaq: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const repoMock = require('../repository/faqs') as {
  __resetCats(seed: FaqCategory[], hasItems?: boolean): void;
};

beforeEach(() => {
  repoMock.__resetCats([CAT_A, CAT_B], false);
});

async function loginAs(role: 'admin' | 'manager' | 'user' | 'dev') {
  const app = createTestApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

describe('GET /api/faq-categories', () => {
  test('user — 카테고리 목록 (FAQ 필터용) → 200', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/faq-categories');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(2);
  });

  test('manager → 200 (READ 허용)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.get('/api/faq-categories');
    expect(res.status).toBe(200);
  });

  test('unauthenticated → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/faq-categories');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/faq-categories', () => {
  test('admin 등록 → 201', async () => {
    const agent = await loginAs('admin');
    const res = await agent
      .post('/api/faq-categories')
      .send({ name: '신규', slug: 'new', sort_order: 3 });
    expect(res.status).toBe(201);
  });

  test('manager 등록 → 403 (admin only)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.post('/api/faq-categories').send({ name: 'X', slug: 'x' });
    expect(res.status).toBe(403);
  });

  test('user 등록 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.post('/api/faq-categories').send({ name: 'X', slug: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/faq-categories/:id', () => {
  test('admin 수정 → 200', async () => {
    const agent = await loginAs('admin');
    const res = await agent.patch(`/api/faq-categories/${CAT_A.id}`).send({ name: '수정' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('수정');
  });

  test('manager 수정 → 403', async () => {
    const agent = await loginAs('manager');
    const res = await agent.patch(`/api/faq-categories/${CAT_A.id}`).send({ name: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/faq-categories/:id', () => {
  test('admin 삭제 (FAQ 0건) → 204', async () => {
    const agent = await loginAs('admin');
    const res = await agent.delete(`/api/faq-categories/${CAT_A.id}`);
    expect(res.status).toBe(204);
  });

  test('admin 삭제 (FAQ 항목 존재) → 409 CATEGORY_HAS_ITEMS', async () => {
    repoMock.__resetCats([CAT_A], true);
    const agent = await loginAs('admin');
    const res = await agent.delete(`/api/faq-categories/${CAT_A.id}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_HAS_ITEMS');
  });

  test('manager 삭제 → 403', async () => {
    const agent = await loginAs('manager');
    const res = await agent.delete(`/api/faq-categories/${CAT_A.id}`);
    expect(res.status).toBe(403);
  });

  test('user 삭제 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.delete(`/api/faq-categories/${CAT_A.id}`);
    expect(res.status).toBe(403);
  });
});
