/**
 * Sidebar /notifications nav-item — Wave 5 Phase B (W5-D7/D8).
 * Verifies count badge + 🔴! Urgent dot driven by `useUnreadBadge`.
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

vi.mock('@entities/notice', () => ({
  useNoticePopup: () => ({ data: { rows: [] }, isError: false, isPending: false }),
}));

const badgeMock = vi.fn();
vi.mock('@entities/notification', () => ({
  useUnreadBadge: () => badgeMock(),
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

describe('Sidebar — /notifications badge', () => {
  beforeEach(() => badgeMock.mockReset());

  it('count > 0 → count chip 노출', () => {
    badgeMock.mockReturnValue({ unreadCount: 5, hasUrgent: false, isLoading: false, isError: false });
    renderSidebar();
    expect(screen.getByTestId('sidebar-notifications-count')).toHaveTextContent('5');
    expect(screen.queryByTestId('sidebar-notifications-urgent')).toBeNull();
  });

  it('count > 99 → 99+ 표시', () => {
    badgeMock.mockReturnValue({ unreadCount: 250, hasUrgent: false, isLoading: false, isError: false });
    renderSidebar();
    expect(screen.getByTestId('sidebar-notifications-count')).toHaveTextContent('99+');
  });

  it('hasUrgent → 🔴! 배지 동시 노출', () => {
    badgeMock.mockReturnValue({ unreadCount: 3, hasUrgent: true, isLoading: false, isError: false });
    renderSidebar();
    expect(screen.getByTestId('sidebar-notifications-urgent')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-notifications-count')).toHaveTextContent('3');
  });

  it('count=0 + urgent=false → 배지 없음', () => {
    badgeMock.mockReturnValue({ unreadCount: 0, hasUrgent: false, isLoading: false, isError: false });
    renderSidebar();
    expect(screen.queryByTestId('sidebar-notifications-count')).toBeNull();
    expect(screen.queryByTestId('sidebar-notifications-urgent')).toBeNull();
  });
});
