import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';

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

vi.mock('@entities/notification', () => ({
  useUnreadBadge: () => ({ unreadCount: 0, hasUrgent: false, isLoading: false, isError: false }),
}));

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

describe('Sidebar — Linear 스타일', () => {
  it('워크스페이스 셀렉터가 렌더됨', () => {
    renderSidebar();
    expect(screen.getByTestId('workspace-selector')).toBeInTheDocument();
    expect(screen.getByText('VOC Page')).toBeInTheDocument();
  });

  it('WORKSPACE 섹션 헤더가 렌더됨', () => {
    renderSidebar();
    expect(screen.getByTestId('section-header-workspace')).toBeInTheDocument();
  });

  it('기존 nav 항목이 모두 렌더됨 (IA 유지)', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /VOC/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /공지사항/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^FAQ$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /알림/ })).toBeInTheDocument();
  });

  it('Admin·Health nav은 일반 user에게 숨김', () => {
    renderSidebar();
    expect(screen.queryByRole('link', { name: /Admin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Health/ })).not.toBeInTheDocument();
  });

  it('유저 카드가 하단에 렌더됨', () => {
    renderSidebar();
    expect(screen.getByTestId('user-card')).toBeInTheDocument();
  });
});

describe('Sidebar — TopBar 없음', () => {
  it('TopBar가 존재하지 않음 (상단 헤더 제거)', () => {
    // AppShell에서 TopBar를 제거했으므로 사이드바에 헤더 요소가 없어야 함
    renderSidebar();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
