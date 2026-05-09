/**
 * Wave 4 — /api/faqs route tests.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4, §10.5.
 */
import request from 'supertest';
import * as faqsRepoModule from '../repository/faqs';
import { createTestApp } from './helpers/app';
import type { Faq } from '../../../shared/contracts/faq';

const ISO = '2026-04-01T00:00:00.000Z';
const CAT_A = '22222222-cccc-4ccc-8ccc-000000000001';

const FAQ_A: Faq = {
  id: '33333333-eeee-4eee-8eee-000000000001',
  question: '문의 1',
  answer: '답변 1',
  category_id: CAT_A,
  is_visible: true,
  sort_order: 1,
  author_id: '00000000-0000-4000-8000-0000000000a1',
  deleted_at: null,
  created_at: ISO,
  updated_at: ISO,
};
const FAQ_HIDDEN: Faq = {
  ...FAQ_A,
  id: '33333333-eeee-4eee-8eee-000000000002',
  question: '비공개',
  is_visible: false,
};
const FAQ_DELETED: Faq = {
  ...FAQ_A,
  id: '33333333-eeee-4eee-8eee-000000000003',
  question: '삭제',
  deleted_at: ISO,
};

jest.mock('../repository/faqs', () => {
  const faqStore: Faq[] = [];
  return {
    __reset(seed: Faq[]) {
      faqStore.length = 0;
      faqStore.push(...seed);
    },
    listFaqs: jest.fn(
      async (opts: {
        page: number;
        per_page: number;
        mode?: 'user' | 'admin';
        includeDeleted?: boolean;
        category_id?: string;
        q?: string;
      }) => {
        let rows = faqStore.slice();
        if (!opts.includeDeleted) rows = rows.filter((r) => r.deleted_at === null);
        if (opts.mode !== 'admin') rows = rows.filter((r) => r.is_visible);
        if (opts.category_id) rows = rows.filter((r) => r.category_id === opts.category_id);
        if (opts.q) {
          const q = opts.q.toLowerCase();
          rows = rows.filter(
            (r) => r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q),
          );
        }
        return { rows, total: rows.length };
      },
    ),
    getFaqById: jest.fn(async (id: string) => faqStore.find((r) => r.id === id) ?? null),
    createFaq: jest.fn(
      async (
        input: {
          question: string;
          answer: string;
          category_id: string;
          is_visible?: boolean;
          sort_order?: number;
        },
        authorId: string,
      ) => {
        const created: Faq = {
          id: `88888888-eeee-4eee-8eee-${String(faqStore.length).padStart(12, '0')}`,
          question: input.question,
          answer: input.answer,
          category_id: input.category_id,
          is_visible: input.is_visible ?? true,
          sort_order: input.sort_order ?? 0,
          author_id: authorId,
          deleted_at: null,
          created_at: ISO,
          updated_at: ISO,
        };
        faqStore.push(created);
        return created;
      },
    ),
    updateFaq: jest.fn(async (id: string, patch: Partial<Faq>) => {
      const i = faqStore.findIndex((r) => r.id === id);
      if (i < 0) return null;
      faqStore[i] = { ...faqStore[i], ...patch } as Faq;
      return faqStore[i];
    }),
    softDeleteFaq: jest.fn(async (id: string) => {
      const i = faqStore.findIndex((r) => r.id === id && !r.deleted_at);
      if (i < 0) return false;
      faqStore[i] = { ...faqStore[i], deleted_at: ISO };
      return true;
    }),
    restoreFaq: jest.fn(async (id: string) => {
      const i = faqStore.findIndex((r) => r.id === id);
      if (i < 0) return null;
      faqStore[i] = { ...faqStore[i], deleted_at: null };
      return faqStore[i];
    }),
    // unused by these tests but imported by faq-categories route — return safe defaults
    listCategories: jest.fn(async () => []),
    getCategoryById: jest.fn(async () => null),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };
});

const repoMock = faqsRepoModule as unknown as { __reset(seed: Faq[]): void };

beforeEach(() => {
  repoMock.__reset([FAQ_A, FAQ_HIDDEN, FAQ_DELETED]);
});

async function loginAs(role: 'admin' | 'manager' | 'user' | 'dev') {
  const app = createTestApp();
  const agent = request.agent(app);
  await agent.post('/api/auth/mock-login').send({ role });
  return agent;
}

describe('GET /api/faqs', () => {
  test('user — visible only, no deleted', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/faqs');
    expect(res.status).toBe(200);
    expect(res.body.rows.map((r: Faq) => r.id)).toEqual([FAQ_A.id]);
  });

  test('admin mode=admin&includeDeleted=true → 모든 행', async () => {
    const agent = await loginAs('admin');
    const res = await agent.get('/api/faqs?mode=admin&includeDeleted=true');
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(3);
  });

  test('keyword q=문의 → FAQ_A 매칭', async () => {
    const agent = await loginAs('user');
    const res = await agent.get('/api/faqs?q=' + encodeURIComponent('문의'));
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(1);
  });

  test('unauthenticated → 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/faqs');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/faqs', () => {
  test('manager 등록 → 201', async () => {
    const agent = await loginAs('manager');
    const res = await agent
      .post('/api/faqs')
      .send({ question: 'Q', answer: 'A', category_id: CAT_A });
    expect(res.status).toBe(201);
  });

  test('user 등록 → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent
      .post('/api/faqs')
      .send({ question: 'Q', answer: 'A', category_id: CAT_A });
    expect(res.status).toBe(403);
  });

  test('빈 question → 400', async () => {
    const agent = await loginAs('admin');
    const res = await agent
      .post('/api/faqs')
      .send({ question: '', answer: 'A', category_id: CAT_A });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/faqs/:id', () => {
  test('manager 수정 → 200', async () => {
    const agent = await loginAs('manager');
    const res = await agent.patch(`/api/faqs/${FAQ_A.id}`).send({ question: '수정' });
    expect(res.status).toBe(200);
    expect(res.body.question).toBe('수정');
  });

  test('dev 수정 → 403', async () => {
    const agent = await loginAs('dev');
    const res = await agent.patch(`/api/faqs/${FAQ_A.id}`).send({ question: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/faqs/:id', () => {
  test('manager soft delete → 204', async () => {
    const agent = await loginAs('manager');
    const res = await agent.delete(`/api/faqs/${FAQ_A.id}`);
    expect(res.status).toBe(204);
  });

  test('user delete → 403', async () => {
    const agent = await loginAs('user');
    const res = await agent.delete(`/api/faqs/${FAQ_A.id}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/faqs/:id/restore', () => {
  test('admin 복원 → 200', async () => {
    const agent = await loginAs('admin');
    const res = await agent.post(`/api/faqs/${FAQ_DELETED.id}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.deleted_at).toBeNull();
  });

  test('manager 복원 → 403 (admin only)', async () => {
    const agent = await loginAs('manager');
    const res = await agent.post(`/api/faqs/${FAQ_DELETED.id}/restore`);
    expect(res.status).toBe(403);
  });
});
