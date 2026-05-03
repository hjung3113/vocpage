import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocListPage } from '../VocListPage';
import { RoleContext } from '../../../contexts/RoleContext';
import { VOC_FIXTURES } from '../../../../../shared/fixtures/voc.fixtures';
import {
  ASSIGNEE_FIXTURES,
  TAG_FIXTURES,
  VOC_TYPE_FIXTURES,
} from '../../../../../shared/fixtures/master.fixtures';
import { NOTIFICATION_FIXTURES } from '../../../../../shared/fixtures/notification.fixtures';
import type { Role } from '../../../../../shared/contracts/common';
import type { VocStatus } from '../../../../../shared/contracts/voc';

vi.mock('../../../api/voc', () => ({
  vocApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    notes: vi.fn(),
    addNote: vi.fn(),
    history: vi.fn(),
  },
}));
vi.mock('../../../api/masters', () => ({
  mastersApi: {
    assignees: vi.fn(),
    tags: vi.fn(),
    vocTypes: vi.fn(),
  },
}));
vi.mock('../../../api/notifications', () => ({
  notificationsApi: {
    list: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

import { vocApi } from '../../../api/voc';
import { mastersApi } from '../../../api/masters';
import { notificationsApi } from '../../../api/notifications';

const live = VOC_FIXTURES.filter((r) => r.deleted_at === null).map((r) => ({
  ...r,
  has_children: false,
  notes_count: 0,
  tags: [] as string[],
}));

function rowsByStatus(status: VocStatus) {
  return live.filter((r) => r.status === status);
}

function rowsByPriority(priority: string) {
  return [...live].sort((a, b) => {
    if (a.priority === priority && b.priority !== priority) return -1;
    if (b.priority === priority && a.priority !== priority) return 1;
    return 0;
  });
}

function setupMasters() {
  vi.mocked(mastersApi.assignees).mockResolvedValue([...ASSIGNEE_FIXTURES]);
  vi.mocked(mastersApi.tags).mockResolvedValue([...TAG_FIXTURES]);
  vi.mocked(mastersApi.vocTypes).mockResolvedValue([...VOC_TYPE_FIXTURES]);
  vi.mocked(notificationsApi.list).mockResolvedValue({
    items: [...NOTIFICATION_FIXTURES],
    unreadCount: NOTIFICATION_FIXTURES.filter((n) => !n.read).length,
  });
}

function defaultListImpl(query: Parameters<typeof vocApi.list>[0] = {}) {
  let rows = [...live];
  if (query.status?.length) rows = rows.filter((r) => query.status!.includes(r.status));
  if (query.sort_by === 'priority') {
    rows = rowsByPriority('urgent');
  }
  const page = query.page ?? 1;
  const per_page = query.per_page ?? 20;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return {
    rows: rows.slice(start, start + per_page),
    page,
    per_page,
    total,
  };
}

function renderPage(role: Role = 'manager') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={['/voc']}>
      <RoleContext.Provider value={{ role, setRole: () => {} }}>
        <QueryClientProvider client={qc}>
          <VocListPage />
        </QueryClientProvider>
      </RoleContext.Provider>
    </MemoryRouter>,
  );
}

describe('VocListPage — Wave D D5 integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMasters();
    vi.mocked(vocApi.list).mockImplementation((q) => Promise.resolve(defaultListImpl(q)));
  });

  it('"검토중" pill 클릭 → MSW handler가 status 필터된 rows만 반환 + count 갱신', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('status-chip-검토중'));
    await waitFor(() => {
      const lastCall = vi.mocked(vocApi.list).mock.calls.at(-1);
      expect(lastCall?.[0]?.status).toEqual(['검토중']);
    });
    const expected = rowsByStatus('검토중').length;
    await waitFor(() => expect(screen.getByText(`${expected}개`)).toBeInTheDocument());
  });

  it('header "우선순위" 클릭 → 첫 row priority="urgent" (sort chips removed; header is now the only sort affordance)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('voc-list-header-cell-priority'));
    await waitFor(() => {
      const lastCall = vi.mocked(vocApi.list).mock.calls.at(-1);
      expect(lastCall?.[0]?.sort_by).toBe('priority');
    });
    // 첫 row 이슈 코드가 urgent fixture와 매칭되어야 함
    const urgentFirst = rowsByPriority('urgent')[0]!;
    await waitFor(() => expect(screen.getByText(urgentFirst.issue_code)).toBeInTheDocument());
  });

  it('"다음" 페이지 클릭 → page=2 query 발행', async () => {
    // 더 많은 rows 가 필요하므로 list mock 으로 100개 가짜 row 반환
    const fakeRows = Array.from({ length: 50 }, (_, i) => ({
      ...live[0]!,
      id: `aaaaaaaa-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      issue_code: `VOC-${String(i + 1).padStart(4, '0')}`,
      title: `행 ${i + 1}`,
    }));
    vi.mocked(vocApi.list).mockImplementation((q) => {
      const page = q?.page ?? 1;
      const per = q?.per_page ?? 20;
      const start = (page - 1) * per;
      return Promise.resolve({
        rows: fakeRows.slice(start, start + per),
        page,
        per_page: per,
        total: fakeRows.length,
      });
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => {
      const lastCall = vi.mocked(vocApi.list).mock.calls.at(-1);
      expect(lastCall?.[0]?.page).toBe(2);
    });
  });

  it('"새 VOC 등록" 클릭 → 모달 + Toast UI editor mock mount', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /새 VOC 등록/ }));
    expect(await screen.findByRole('dialog', { name: /새 VOC 등록/ })).toBeInTheDocument();
    expect(await screen.findByTestId('voc-body-editor')).toBeInTheDocument();
  });

  it('어떤 단계에서도 LoadingState/ErrorState 미발생', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    expect(screen.queryByTestId('voc-loading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeInTheDocument();
  });

  it('vocTypeMap threads VocListPage → VocTable → VocRow → VocTypeBadge (renders type icon for each row)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());

    // All fixture rows reference TYPE_PRIMARY ("기능 요청", slug=feature) — see master.fixtures.ts
    const renderedRows = screen.getAllByTestId('voc-row');
    expect(renderedRows.length).toBeGreaterThan(0);

    // Each rendered row's title cell should contain a VocTypeBadge with aria-label "유형 기능 요청"
    // (proves vocTypeMap was threaded VocListPage → VocTable → VocRow → VocTypeBadge).
    const badges = await screen.findAllByLabelText('유형 기능 요청');
    expect(badges.length).toBe(renderedRows.length);
  });
});
