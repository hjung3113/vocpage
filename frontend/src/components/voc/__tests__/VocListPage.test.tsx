import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocListPage } from '../VocListPage';
import { RoleProvider } from '../../../contexts/RoleContext';
import { VOC_FIXTURES } from '../../../../../shared/fixtures/voc.fixtures';

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

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={['/voc']}>
      <QueryClientProvider client={qc}>
        <RoleProvider>
          <VocListPage />
        </RoleProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('VocListPage — Wave 1 RTL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('F-T1 EmptyState 시나리오 (빈 리스트)', async () => {
    vi.mocked(vocApi.list).mockResolvedValue({ rows: [], page: 1, pageSize: 50, total: 0 });
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
      rows: live.slice(0, 5).map((r) => ({ ...r, has_children: false, notes_count: 0 })),
      page: 1,
      pageSize: 50,
      total: 5,
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-table')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('status-chip-접수'));
    expect(screen.getByTestId('status-chip-접수')).toHaveAttribute('aria-pressed', 'true');
  });
});
