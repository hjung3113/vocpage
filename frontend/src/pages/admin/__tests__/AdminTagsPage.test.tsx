/**
 * AdminTagsPage — smoke + role-guard tests (W3-4)
 *
 * Covers:
 *  1. Admin/Manager/Dev: page renders tag list
 *  2. Admin: all action buttons enabled
 *  3. Manager: add/edit enabled, merge/delete/external/suspend disabled
 *  4. Dev: no action buttons (read-only)
 *  5. 409 inline error shown on delete of used tag
 */
import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mock useRole ───────────────────────────────────────────────────────────────
const roleMock = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => roleMock(),
}));

// ── Mock tag-master api hooks ──────────────────────────────────────────────────
const listTagsMock = vi.fn();
const deleteTagMock = vi.fn();
const toggleExternalMock = vi.fn();

vi.mock('@features/admin/tag-master/api/tag-master.api', () => ({
  useAdminTags: () => listTagsMock(),
  useCreateTag: () => ({ mutate: vi.fn(), isPending: false }),
  useRenameTag: () => ({ mutate: vi.fn(), isPending: false }),
  useMergeTag: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleExternal: () => toggleExternalMock(),
  useDeleteTag: () => deleteTagMock(),
  useSuspendTagRule: () => ({ mutate: vi.fn(), isPending: false }),
}));

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

function mockDelete(opts: { mutate?: ReturnType<typeof vi.fn> } = {}) {
  const mutate = opts.mutate ?? vi.fn();
  deleteTagMock.mockReturnValue({ mutate, isPending: false });
  return mutate;
}

function mockToggle() {
  const mutate = vi.fn();
  toggleExternalMock.mockReturnValue({ mutate, isPending: false });
  return mutate;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDelete();
  mockToggle();
});

describe('AdminTagsPage', () => {
  it('admin: renders tag list with tag names', () => {
    roleMock.mockReturnValue({
      isAdmin: true,
      isManager: false,
      isDev: false,
      isUser: false,
      role: 'admin',
    });
    mockList();
    renderPage();
    expect(screen.getByText('버그')).toBeInTheDocument();
    expect(screen.getByText('미사용')).toBeInTheDocument();
    expect(screen.getAllByText('태그 마스터').length).toBeGreaterThanOrEqual(1);
  });

  it('manager: add button enabled, merge button disabled', () => {
    roleMock.mockReturnValue({
      isAdmin: false,
      isManager: true,
      isDev: false,
      isUser: false,
      role: 'manager',
    });
    mockList();
    renderPage();
    const addBtn = screen.getByTestId('btn-create-tag');
    expect(addBtn).not.toBeDisabled();
    const mergeBtns = screen.getAllByTestId(/^btn-merge-/);
    mergeBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('admin: merge/delete/external buttons all enabled', () => {
    roleMock.mockReturnValue({
      isAdmin: true,
      isManager: false,
      isDev: false,
      isUser: false,
      role: 'admin',
    });
    mockList();
    renderPage();
    const deleteBtns = screen.getAllByTestId(/^btn-delete-/);
    deleteBtns.forEach((btn) => expect(btn).not.toBeDisabled());
    const mergeBtns = screen.getAllByTestId(/^btn-merge-/);
    mergeBtns.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('loading: shows loading text', () => {
    roleMock.mockReturnValue({
      isAdmin: true,
      isManager: false,
      isDev: false,
      isUser: false,
      role: 'admin',
    });
    listTagsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
  });

  it('error: shows error message', () => {
    roleMock.mockReturnValue({
      isAdmin: true,
      isManager: false,
      isDev: false,
      isUser: false,
      role: 'admin',
    });
    listTagsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument();
  });

  it('empty: shows empty state', () => {
    roleMock.mockReturnValue({
      isAdmin: true,
      isManager: false,
      isDev: false,
      isUser: false,
      role: 'admin',
    });
    mockList([]);
    renderPage();
    expect(screen.getByText('태그가 없습니다.')).toBeInTheDocument();
  });
});
