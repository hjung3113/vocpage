/**
 * Shared mocks + render helpers for FaqPage tests.
 */
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

export const roleMock = vi.fn();
export const listMock = vi.fn();
export const categoriesMock = vi.fn();
export const createMock = vi.fn();
export const deleteMock = vi.fn();
export const restoreMock = vi.fn();
export const updateMock = vi.fn();
export const createCategoryMock = vi.fn();
export const updateCategoryMock = vi.fn();
export const deleteCategoryMock = vi.fn();

vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => roleMock(),
}));

vi.mock('@entities/faq', async () => {
  const actual = await vi.importActual<typeof import('@entities/faq')>('@entities/faq');
  return {
    ...actual,
    useFaqList: (q: unknown) => listMock(q),
    useFaqCategories: () => categoriesMock(),
    useCreateFaq: () => ({
      mutateAsync: (p: unknown) => Promise.resolve(createMock(p)),
      mutate: (p: unknown) => createMock(p),
    }),
    useDeleteFaq: () => ({ mutate: (id: string) => deleteMock(id) }),
    useRestoreFaq: () => ({ mutate: (id: string) => restoreMock(id) }),
    useCreateFaqCategory: () => ({
      mutateAsync: (p: unknown) => Promise.resolve(createCategoryMock(p)),
      mutate: (p: unknown) => createCategoryMock(p),
    }),
    useUpdateFaqCategory: () => ({
      mutateAsync: (p: unknown) => Promise.resolve(updateCategoryMock(p)),
      mutate: (p: unknown) => updateCategoryMock(p),
    }),
    useDeleteFaqCategory: () => ({
      mutate: (id: string, opts?: { onError?: (e: unknown) => void }) =>
        deleteCategoryMock(id, opts),
    }),
    faqApi: {
      ...actual.faqApi,
      update: (id: string, patch: unknown) => {
        updateMock(id, patch);
        return Promise.resolve({});
      },
    },
  };
});

import FaqPage from '../index';

export const baseFaq = {
  id: '00000000-0000-4000-8000-000000000001',
  question: '비밀번호 어떻게 변경하나요?',
  answer: '<p>설정 화면에서 변경하세요.</p>',
  category_id: 'cat-1',
  is_visible: true,
  sort_order: 0,
  author_id: '00000000-0000-4000-8000-aaaaaaaaaaaa',
  deleted_at: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};

export const baseCategory = {
  id: 'cat-1',
  name: '계정',
  slug: 'account',
  sort_order: 1,
  is_archived: false,
};

export function renderPage(initialPath = '/faq') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/faq" element={<FaqPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export function resetAll() {
  roleMock.mockReset();
  listMock.mockReset();
  categoriesMock.mockReset();
  createMock.mockReset();
  deleteMock.mockReset();
  restoreMock.mockReset();
  updateMock.mockReset();
  createCategoryMock.mockReset();
  updateCategoryMock.mockReset();
  deleteCategoryMock.mockReset();
}
