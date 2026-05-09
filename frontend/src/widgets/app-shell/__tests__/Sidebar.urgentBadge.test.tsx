/**
 * Sidebar urgent-notice badge — Wave 4 FE step 1.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.2.2.
 *
 * Rule: 공지사항 nav item 옆에 빨간 `!` 배지를
 *       `useNoticePopup` 결과 중 level='urgent'가 1건 이상일 때만 표시.
 *       빈 결과·에러는 배지 미표시.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => ({
    role: 'user',
    isUser: true,
    isDev: false,
    isManager: false,
    isAdmin: false,
    setRole: vi.fn(),
  }),
}));

const popupMock = vi.fn();
vi.mock('@entities/notice', () => ({
  useNoticePopup: () => popupMock(),
}));

import { Sidebar } from '../Sidebar';

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/voc']}>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Sidebar — urgent notice badge (§10.2.2)', () => {
  beforeEach(() => popupMock.mockReset());

  it('urgent 공지가 있으면 배지가 노출됨', () => {
    popupMock.mockReturnValue({
      data: {
        rows: [
          { id: '1', level: 'urgent', is_popup: true } as unknown,
        ],
      },
      isError: false,
      isPending: false,
    });
    renderSidebar();
    expect(screen.getByTestId('sidebar-notice-urgent-badge')).toBeInTheDocument();
  });

  it('urgent 공지가 없으면 (다른 level만) 배지가 숨겨짐', () => {
    popupMock.mockReturnValue({
      data: {
        rows: [{ id: '2', level: 'important', is_popup: true } as unknown],
      },
      isError: false,
      isPending: false,
    });
    renderSidebar();
    expect(screen.queryByTestId('sidebar-notice-urgent-badge')).not.toBeInTheDocument();
  });

  it('rows가 빈 배열이면 배지가 숨겨짐', () => {
    popupMock.mockReturnValue({
      data: { rows: [] },
      isError: false,
      isPending: false,
    });
    renderSidebar();
    expect(screen.queryByTestId('sidebar-notice-urgent-badge')).not.toBeInTheDocument();
  });

  it('fetch 에러 시 배지가 숨겨짐', () => {
    popupMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
    });
    renderSidebar();
    expect(screen.queryByTestId('sidebar-notice-urgent-badge')).not.toBeInTheDocument();
  });
});
