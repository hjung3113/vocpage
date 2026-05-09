/**
 * NoticePage — user-view tests (§10.3.3).
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { baseNotice, listMock, roleMock, renderPage, resetAll } from './notice-test-helpers';

beforeEach(resetAll);

describe('NoticePage — list (user mode)', () => {
  it('숨김·만료·삭제된 공지는 노출되지 않는다', () => {
    roleMock.mockReturnValue({
      role: 'user',
      isUser: true,
      isDev: false,
      isManager: false,
      isAdmin: false,
    });
    const visible = { ...baseNotice, id: 'a', title: '노출됨' };
    const hidden = { ...baseNotice, id: 'b', title: '숨김', is_visible: false };
    const expired = {
      ...baseNotice,
      id: 'c',
      title: '만료',
      visible_to: '2020-01-01T00:00:00.000Z',
    };
    const deleted = {
      ...baseNotice,
      id: 'd',
      title: '삭제',
      deleted_at: '2026-04-01T00:00:00.000Z',
    };
    listMock.mockReturnValue({
      data: { rows: [visible, hidden, expired, deleted], page: 1, per_page: 20, total: 4 },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByText('노출됨')).toBeInTheDocument();
    expect(screen.queryByText('숨김')).not.toBeInTheDocument();
    expect(screen.queryByText('만료')).not.toBeInTheDocument();
    expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /공지사항\s*1/ })).toBeInTheDocument();
  });

  it('중요도 배지가 토큰 색상으로 매핑된다', () => {
    roleMock.mockReturnValue({
      role: 'user',
      isUser: true,
      isDev: false,
      isManager: false,
      isAdmin: false,
    });
    listMock.mockReturnValue({
      data: {
        rows: [
          { ...baseNotice, id: 'n1', level: 'normal', title: 'N' },
          { ...baseNotice, id: 'n2', level: 'important', title: 'I' },
          { ...baseNotice, id: 'n3', level: 'urgent', title: 'U' },
        ],
        page: 1,
        per_page: 20,
        total: 3,
      },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('notice-level-badge-normal')).toHaveStyle(
      'background: var(--status-blue)',
    );
    expect(screen.getByTestId('notice-level-badge-important')).toHaveStyle(
      'background: var(--status-amber)',
    );
    expect(screen.getByTestId('notice-level-badge-urgent')).toHaveStyle(
      'background: var(--status-red)',
    );
  });

  it('제목 클릭 시 본문이 펼쳐졌다가 닫힌다', async () => {
    const user = userEvent.setup();
    roleMock.mockReturnValue({
      role: 'user',
      isUser: true,
      isDev: false,
      isManager: false,
      isAdmin: false,
    });
    listMock.mockReturnValue({
      data: { rows: [baseNotice], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.queryByTestId(`notice-body-${baseNotice.id}`)).not.toBeInTheDocument();
    await user.click(screen.getByTestId(`notice-title-${baseNotice.id}`));
    expect(screen.getByTestId(`notice-body-${baseNotice.id}`)).toBeInTheDocument();
    await user.click(screen.getByTestId(`notice-title-${baseNotice.id}`));
    expect(screen.queryByTestId(`notice-body-${baseNotice.id}`)).not.toBeInTheDocument();
  });
});

describe('NoticePage — 관리 버튼 가시성 (§10.5.1)', () => {
  beforeEach(() => {
    listMock.mockReturnValue({
      data: { rows: [baseNotice], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
  });

  it('admin 에게 관리 버튼이 보인다', () => {
    roleMock.mockReturnValue({
      role: 'admin',
      isUser: false,
      isDev: false,
      isManager: false,
      isAdmin: true,
    });
    renderPage();
    expect(screen.getByTestId('notice-admin-toggle')).toBeInTheDocument();
  });

  it('manager 에게 관리 버튼이 보인다', () => {
    roleMock.mockReturnValue({
      role: 'manager',
      isUser: false,
      isDev: false,
      isManager: true,
      isAdmin: false,
    });
    renderPage();
    expect(screen.getByTestId('notice-admin-toggle')).toBeInTheDocument();
  });

  it('user 에게는 DOM 자체가 없다', () => {
    roleMock.mockReturnValue({
      role: 'user',
      isUser: true,
      isDev: false,
      isManager: false,
      isAdmin: false,
    });
    renderPage();
    expect(screen.queryByTestId('notice-admin-toggle')).not.toBeInTheDocument();
  });

  it('dev 에게는 DOM 자체가 없다', () => {
    roleMock.mockReturnValue({
      role: 'dev',
      isUser: false,
      isDev: true,
      isManager: false,
      isAdmin: false,
    });
    renderPage();
    expect(screen.queryByTestId('notice-admin-toggle')).not.toBeInTheDocument();
  });
});
