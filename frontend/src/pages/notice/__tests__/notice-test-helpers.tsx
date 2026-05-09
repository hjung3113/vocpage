/**
 * Shared mocks + render helpers for NoticePage tests.
 */
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

export const roleMock = vi.fn();
export const listMock = vi.fn();
export const createMock = vi.fn();
export const deleteMock = vi.fn();
export const restoreMock = vi.fn();
export const updateMock = vi.fn();

vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => roleMock(),
}));

vi.mock('@entities/notice', async () => {
  const actual = await vi.importActual<typeof import('@entities/notice')>('@entities/notice');
  return {
    ...actual,
    useNoticeList: (q: unknown) => listMock(q),
    useCreateNotice: () => ({
      mutateAsync: (p: unknown) => Promise.resolve(createMock(p)),
      mutate: (p: unknown) => createMock(p),
    }),
    useDeleteNotice: () => ({ mutate: (id: string) => deleteMock(id) }),
    useRestoreNotice: () => ({ mutate: (id: string) => restoreMock(id) }),
    noticeApi: {
      ...actual.noticeApi,
      update: (id: string, patch: unknown) => {
        updateMock(id, patch);
        return Promise.resolve({});
      },
    },
  };
});

import NoticePage from '../index';

export const baseNotice = {
  id: '00000000-0000-4000-8000-000000000001',
  title: '서비스 점검',
  body: '<p>점검 안내</p>',
  level: 'urgent' as const,
  is_popup: true,
  is_visible: true,
  visible_from: null,
  visible_to: null,
  author_id: '00000000-0000-4000-8000-aaaaaaaaaaaa',
  deleted_at: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};

export function renderPage(initialPath = '/notice') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/notice" element={<NoticePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export function resetAll() {
  roleMock.mockReset();
  listMock.mockReset();
  createMock.mockReset();
  deleteMock.mockReset();
  restoreMock.mockReset();
  updateMock.mockReset();
}
