/**
 * AdminTagsPage — Phase 01 Plan 07 integration tests.
 *
 * Covers:
 *  - View-mode tabs (태그 / 전체 규칙) + ?view= URL state.
 *  - Search input + 250ms debounce + ?q= URL state.
 *  - 규칙 N건 row badge → TagRulesManagerModal mount.
 *  - Deep-link rendering for ?view=rules&q=*.
 *  - Empty-state copywriting (`검색 결과가 없습니다`).
 *
 * Split out of AdminTagsPage.test.tsx to satisfy the 200-line cap (max-lines).
 */
import { screen, waitFor, fireEvent, render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const roleMock = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({ useRole: () => roleMock() }));

const listTagsMock = vi.fn();
const listRulesMock = vi.fn();

vi.mock('@features/admin/tag-master/api/tag-master.api', () => {
  const noop = () => ({ mutate: vi.fn(), isPending: false });
  return {
    useAdminTags: () => listTagsMock(),
    useAdminTagRules: (tagId: string) => listRulesMock(tagId),
    useCreateTag: noop,
    useRenameTag: noop,
    useMergeTag: noop,
    useToggleExternal: noop,
    useDeleteTag: noop,
    useCreateTagRule: noop,
    useUpdateTagRule: noop,
    useDeleteTagRule: noop,
    useSuspendTagRule: noop,
  };
});

vi.mock('@shared/api/client', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@shared/api/client');
  return { ...actual, apiGet: vi.fn() };
});
import { apiGet } from '@shared/api/client';

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

const MOCK_RULE = {
  id: 'rule-001',
  tag_id: 'tag-001',
  kind: 'general' as const,
  keywords: ['bug', 'crash'],
  match_mode: 'keyword' as const,
  suspended_until: null,
  created_by: null,
  created_by_name: '관리자',
  created_at: '2026-01-03T00:00:00.000Z',
};

function renderPage(initialEntries: string[] = ['/admin/tags']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/admin/tags" element={<AdminTagsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function asAdmin() {
  roleMock.mockReturnValue({
    isAdmin: true,
    isManager: false,
    isDev: false,
    isUser: false,
    role: 'admin',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  asAdmin();
  listTagsMock.mockReturnValue({
    data: { rows: MOCK_TAGS, page: 1, per_page: 20, total: MOCK_TAGS.length },
    isLoading: false,
    isError: false,
  });
  listRulesMock.mockImplementation((tagId: string) => ({
    data: { rows: tagId === 'tag-001' ? [MOCK_RULE] : [], total: tagId === 'tag-001' ? 1 : 0 },
    isLoading: false,
    isError: false,
  }));
  (apiGet as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    const tagId = /tags\/([^/?]+)\/rules/.exec(url)?.[1];
    const u = new URL(url, 'http://localhost');
    const q = u.searchParams.get('q') ?? '';
    if (tagId === 'tag-001') {
      const matches = q && !'bug crash'.includes(q) ? [] : [MOCK_RULE];
      return Promise.resolve({ rows: matches, total: matches.length });
    }
    return Promise.resolve({ rows: [], total: 0 });
  });
});

describe('AdminTagsPage Plan 07', () => {
  it('default render shows 태그 tab active and 규칙 N건 column', () => {
    renderPage();
    expect(screen.getByTestId('tab-view-tags').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/규칙 N건/)).toBeInTheDocument();
    expect(screen.getByText('규칙 1건')).toBeInTheDocument();
    expect(screen.getByText('규칙 없음')).toBeInTheDocument();
  });

  it('clicking 전체 규칙 tab switches view to rules and renders flat table', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('tab-view-rules'));
    await waitFor(() => expect(screen.getByTestId('flat-search-input')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('flat-rule-row-rule-001')).toBeInTheDocument());
  });

  it('typing in search reflects in input after 250ms debounce window', async () => {
    renderPage(['/admin/tags?view=rules']);
    const input = (await screen.findByTestId('flat-search-input')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'bug' } });
    expect(input.value).toBe('bug');
    await new Promise((r) => setTimeout(r, 320));
    expect(input.value).toBe('bug');
  });

  it('clicking 규칙 N건 badge opens TagRulesManagerModal with tag in header', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('btn-open-rules-tag-001'));
    await waitFor(() => {
      expect(screen.getByText(/버그.*규칙/)).toBeInTheDocument();
    });
  });

  it('deep link ?view=rules&q=foo renders flat table with input bound to q', async () => {
    renderPage(['/admin/tags?view=rules&q=foo']);
    const input = (await screen.findByTestId('flat-search-input')) as HTMLInputElement;
    expect(input.value).toBe('foo');
    expect(screen.getByTestId('tab-view-rules').getAttribute('aria-selected')).toBe('true');
  });

  it('empty result for ?q=zzz shows 검색 결과가 없습니다 copy', async () => {
    renderPage(['/admin/tags?view=rules&q=zzz']);
    await waitFor(() => expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument());
  });
});
