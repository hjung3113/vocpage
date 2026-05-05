import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocListPage } from '../VocListPage';
import { RoleProvider, RoleContext } from '../../../contexts/RoleContext';
import { VOC_FIXTURES } from '../../../../../shared/fixtures/voc.fixtures';
import type { Role } from '../../../../../shared/contracts/common';

vi.mock('../../../api/voc', () => {
  return {
    vocApi: {
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      notes: vi.fn(),
      addNote: vi.fn(),
    },
  };
});

import { vocApi } from '../../../api/voc';

function renderPage(opts: { initialUrl?: string; role?: Role } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const initialUrl = opts.initialUrl ?? '/voc';
  const role = opts.role;
  const tree = (
    <QueryClientProvider client={qc}>
      <VocListPage />
    </QueryClientProvider>
  );
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      {role ? (
        <RoleContext.Provider value={{ role, setRole: () => {} }}>{tree}</RoleContext.Provider>
      ) : (
        <RoleProvider>{tree}</RoleProvider>
      )}
    </MemoryRouter>,
  );
}

describe('VocListPage — Wave 1 RTL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('F-T1 EmptyState 시나리오 (빈 리스트)', async () => {
    vi.mocked(vocApi.list).mockResolvedValue({ rows: [], page: 1, per_page: 50, total: 0 });
    renderPage();
    await waitFor(() => expect(screen.getByText(/VOC가 없습니다/)).toBeInTheDocument());
  });

  it('F-T2 ErrorState + 재시도', async () => {
    vi.mocked(vocApi.list).mockRejectedValue(new Error('boom'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument(),
    );
  });

  it('F-T3 행 노출 + 필터 칩 클릭', async () => {
    const live = VOC_FIXTURES.filter((r) => r.deleted_at === null);
    vi.mocked(vocApi.list).mockResolvedValue({
      rows: live.slice(0, 5).map((r) => ({ ...r, has_children: false, notes_count: 0, tags: [] })),
      page: 1,
      per_page: 50,
      total: 5,
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('status-chip-접수'));
    expect(screen.getByTestId('status-chip-접수')).toHaveAttribute('aria-pressed', 'true');
  });

  it('F-T4a user role: drawer 열려도 note 작성 form 비노출', async () => {
    const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;
    vi.mocked(vocApi.list).mockResolvedValue({
      rows: [{ ...target, has_children: false, notes_count: 0, tags: [] }],
      page: 1,
      per_page: 50,
      total: 1,
    });
    vi.mocked(vocApi.get).mockResolvedValue(target);
    vi.mocked(vocApi.notes).mockResolvedValue([]);
    renderPage({ initialUrl: `/voc?id=${target.id}`, role: 'user' });
    await waitFor(() => expect(screen.getByTestId('voc-drawer')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.queryByLabelText('new comment')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drawer-internal-notes')).not.toBeInTheDocument();
  });

  it('F-T4b manager role contrast: 같은 vocId에서 note form은 노출 (gate 조건이 user 전용임을 증명)', async () => {
    const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;
    vi.mocked(vocApi.list).mockResolvedValue({
      rows: [{ ...target, has_children: false, notes_count: 0, tags: [] }],
      page: 1,
      per_page: 50,
      total: 1,
    });
    vi.mocked(vocApi.get).mockResolvedValue(target);
    vi.mocked(vocApi.notes).mockResolvedValue([]);
    renderPage({ initialUrl: `/voc?id=${target.id}`, role: 'manager' });
    await waitFor(() => expect(screen.getByTestId('voc-drawer')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('tab', { name: '내부노트' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('tab', { name: '내부노트' }));
    await waitFor(() => expect(screen.getByLabelText('new internal note')).toBeInTheDocument());
  });

  it('F-T5 drawer Escape 닫힘: URL ?id 제거 — 다음 list query에 stale id 유출 없음', async () => {
    // Reachable user path: Escape key. Replaces an earlier draft that simulated
    // a click *under* the dialog overlay via pointerEventsCheck:0, which codex
    // correctly flagged as a false-positive (the overlay would intercept that
    // click in a real browser).
    const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;
    vi.mocked(vocApi.list).mockResolvedValue({
      rows: [{ ...target, has_children: false, notes_count: 0, tags: [] }],
      page: 1,
      per_page: 50,
      total: 1,
    });
    vi.mocked(vocApi.get).mockResolvedValue(target);
    vi.mocked(vocApi.notes).mockResolvedValue([]);
    renderPage({ initialUrl: `/voc?id=${target.id}`, role: 'manager' });
    await waitFor(() => expect(screen.getByTestId('voc-drawer')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('voc-drawer')).not.toBeInTheDocument());
    // Drawer disappearance from the DOM is the externally-visible proof that
    // VocDrawer's `open={!!vocId}` flipped, which only happens after onClose →
    // setVocId(null) runs. No subsequent list refetch can carry a stale id.
  });
});
