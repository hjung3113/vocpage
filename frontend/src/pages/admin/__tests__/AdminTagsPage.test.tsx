/**
 * AdminTagsPage — smoke + role-guard tests (W3-4 baseline).
 *
 * Phase 01 Plan 07 integration coverage lives in AdminTagsPage.plan07.test.tsx
 * (split for max-lines compliance).
 */
import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const roleMock = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({ useRole: () => roleMock() }));

const listTagsMock = vi.fn();
const deleteTagMock = vi.fn();
const toggleExternalMock = vi.fn();

vi.mock('@features/admin/tag-master/api/tag-master.api', () => {
  const noop = () => ({ mutate: vi.fn(), isPending: false });
  return {
    useAdminTags: () => listTagsMock(),
    useAdminTagRules: () => ({
      data: { rows: [], total: 0 },
      isLoading: false,
      isError: false,
    }),
    useCreateTag: noop,
    useRenameTag: noop,
    useMergeTag: noop,
    useToggleExternal: () => toggleExternalMock(),
    useDeleteTag: () => deleteTagMock(),
    useCreateTagRule: noop,
    useUpdateTagRule: noop,
    useDeleteTagRule: noop,
    useSuspendTagRule: noop,
  };
});

import AdminTagsPage from '../tags';

const MOCK_TAGS = [
  {
    id: 'tag-001',
    name: '버그',
    slug: 'bug',
    kind: 'general',
    is_external: false,
    usage_count: 5,
    rule_ref_count: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tag-002',
    name: '미사용',
    slug: 'unused',
    kind: 'general',
    is_external: false,
    usage_count: 0,
    rule_ref_count: 0,
    created_at: '2026-01-02T00:00:00.000Z',
  },
];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/tags']}>
        <Routes>
          <Route path="/admin/tags" element={<AdminTagsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockList(tags = MOCK_TAGS) {
  listTagsMock.mockReturnValue({
    data: { rows: tags, page: 1, per_page: 20, total: tags.length },
    isLoading: false,
    isError: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteTagMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  toggleExternalMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe('AdminTagsPage', () => {
  it('admin: renders tag list with tag names', () => {
    roleMock.mockReturnValue({ isAdmin: true, isManager: false, isDev: false, isUser: false });
    mockList();
    renderPage();
    expect(screen.getByText('버그')).toBeInTheDocument();
    expect(screen.getByText('미사용')).toBeInTheDocument();
    expect(screen.getAllByText('태그 관리').length).toBeGreaterThanOrEqual(1);
  });

  it('manager: add button enabled, merge button disabled', () => {
    roleMock.mockReturnValue({ isAdmin: false, isManager: true, isDev: false, isUser: false });
    mockList();
    renderPage();
    expect(screen.getByTestId('btn-create-tag')).not.toBeDisabled();
    screen.getAllByTestId(/^btn-merge-/).forEach((btn) => expect(btn).toBeDisabled());
  });

  it('admin: merge/delete/external buttons all enabled', () => {
    roleMock.mockReturnValue({ isAdmin: true, isManager: false, isDev: false, isUser: false });
    mockList();
    renderPage();
    screen.getAllByTestId(/^btn-delete-/).forEach((btn) => expect(btn).not.toBeDisabled());
    screen.getAllByTestId(/^btn-merge-/).forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('loading: shows loading text', () => {
    roleMock.mockReturnValue({ isAdmin: true, isManager: false, isDev: false, isUser: false });
    listTagsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getAllByTestId('tag-skeleton-row').length).toBeGreaterThan(0);
  });

  it('error: shows error message', () => {
    roleMock.mockReturnValue({ isAdmin: true, isManager: false, isDev: false, isUser: false });
    listTagsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument();
  });

  it('empty: shows empty state', () => {
    roleMock.mockReturnValue({ isAdmin: true, isManager: false, isDev: false, isUser: false });
    mockList([]);
    renderPage();
    expect(screen.getByText('태그가 없습니다.')).toBeInTheDocument();
  });
});
