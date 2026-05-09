/**
 * FaqPage - user-view tests (10.4.2).
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  baseFaq,
  baseCategory,
  listMock,
  categoriesMock,
  roleMock,
  renderPage,
  resetAll,
} from './faq-test-helpers';

beforeEach(resetAll);

function userRole() {
  roleMock.mockReturnValue({
    role: 'user',
    isUser: true,
    isDev: false,
    isManager: false,
    isAdmin: false,
  });
}

describe('FaqPage - user mode', () => {
  it('숨김 / 삭제된 FAQ 는 노출되지 않는다', () => {
    userRole();
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
    const visible = { ...baseFaq, id: 'a', question: '노출됨' };
    const hidden = { ...baseFaq, id: 'b', question: '숨김', is_visible: false };
    const deleted = {
      ...baseFaq,
      id: 'c',
      question: '삭제',
      deleted_at: '2026-04-01T00:00:00.000Z',
    };
    listMock.mockReturnValue({
      data: { rows: [visible, hidden, deleted], page: 1, per_page: 20, total: 3 },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByText('노출됨')).toBeInTheDocument();
    expect(screen.queryByText('숨김')).not.toBeInTheDocument();
    expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /FAQ\s*1/ })).toBeInTheDocument();
  });

  it('Q 클릭 시 A 가 펼쳐졌다가 닫힌다', async () => {
    const user = userEvent.setup();
    userRole();
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
    listMock.mockReturnValue({
      data: { rows: [baseFaq], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.queryByTestId(`faq-answer-${baseFaq.id}`)).not.toBeInTheDocument();
    await user.click(screen.getByTestId(`faq-question-${baseFaq.id}`));
    expect(screen.getByTestId(`faq-answer-${baseFaq.id}`)).toBeInTheDocument();
    await user.click(screen.getByTestId(`faq-question-${baseFaq.id}`));
    expect(screen.queryByTestId(`faq-answer-${baseFaq.id}`)).not.toBeInTheDocument();
  });

  it('검색어로 매칭되는 행만 남고 매칭 텍스트가 <mark> 로 강조된다', async () => {
    const user = userEvent.setup();
    userRole();
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
    const a = { ...baseFaq, id: 'a', question: '비밀번호 변경' };
    const b = { ...baseFaq, id: 'b', question: '회원 탈퇴' };
    listMock.mockReturnValue({
      data: { rows: [a, b], page: 1, per_page: 20, total: 2 },
      isPending: false,
      isError: false,
    });
    renderPage();
    await user.type(screen.getByTestId('faq-search-input'), '비밀');
    expect(screen.getByText(/변경/)).toBeInTheDocument();
    expect(screen.queryByText(/회원 탈퇴/)).not.toBeInTheDocument();
    const marks = screen.getAllByTestId('faq-highlight');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0]!).toHaveTextContent('비밀');
    expect(marks[0]!.tagName).toBe('MARK');
    expect(marks[0]!).toHaveStyle('background: var(--mark-bg)');
  });

  it('카테고리 필터 탭으로 전환하면 해당 카테고리만 남는다', async () => {
    const user = userEvent.setup();
    userRole();
    const cat2 = { ...baseCategory, id: 'cat-2', name: '결제' };
    categoriesMock.mockReturnValue({
      data: { rows: [baseCategory, cat2] },
      isPending: false,
    });
    const a = { ...baseFaq, id: 'a', question: 'Q-계정', category_id: 'cat-1' };
    const b = { ...baseFaq, id: 'b', question: 'Q-결제', category_id: 'cat-2' };
    listMock.mockReturnValue({
      data: { rows: [a, b], page: 1, per_page: 20, total: 2 },
      isPending: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByText('Q-계정')).toBeInTheDocument();
    expect(screen.getByText('Q-결제')).toBeInTheDocument();
    await user.click(screen.getByTestId('faq-category-filter-cat-2'));
    expect(screen.queryByText('Q-계정')).not.toBeInTheDocument();
    expect(screen.getByText('Q-결제')).toBeInTheDocument();
    await user.click(screen.getByTestId('faq-category-filter-all'));
    expect(screen.getByText('Q-계정')).toBeInTheDocument();
  });
});

describe('FaqPage - 관리 버튼 가시성 (10.5.1)', () => {
  beforeEach(() => {
    listMock.mockReturnValue({
      data: { rows: [baseFaq], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
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
    expect(screen.getByTestId('faq-admin-toggle')).toBeInTheDocument();
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
    expect(screen.getByTestId('faq-admin-toggle')).toBeInTheDocument();
  });

  it('user 에게는 DOM 자체가 없다', () => {
    userRole();
    renderPage();
    expect(screen.queryByTestId('faq-admin-toggle')).not.toBeInTheDocument();
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
    expect(screen.queryByTestId('faq-admin-toggle')).not.toBeInTheDocument();
  });
});

describe('FaqPage - 카테고리 관리 탭 가시성 (10.4.4)', () => {
  beforeEach(() => {
    listMock.mockReturnValue({
      data: { rows: [baseFaq], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
  });

  it('admin + admin mode 에서 "카테고리 관리" 탭이 보인다', () => {
    roleMock.mockReturnValue({
      role: 'admin',
      isUser: false,
      isDev: false,
      isManager: false,
      isAdmin: true,
    });
    renderPage('/faq?mode=admin');
    expect(screen.getByTestId('faq-tab-categories')).toBeInTheDocument();
    expect(screen.getByTestId('faq-tab-items')).toBeInTheDocument();
  });

  it('manager + admin mode 에서 "카테고리 관리" 탭은 숨김 (FAQ 항목 탭만)', () => {
    roleMock.mockReturnValue({
      role: 'manager',
      isUser: false,
      isDev: false,
      isManager: true,
      isAdmin: false,
    });
    renderPage('/faq?mode=admin');
    expect(screen.queryByTestId('faq-tab-categories')).not.toBeInTheDocument();
    expect(screen.getByTestId('faq-tab-items')).toBeInTheDocument();
  });

  it('admin 이지만 admin mode 가 아니면 탭 자체가 없다', () => {
    roleMock.mockReturnValue({
      role: 'admin',
      isUser: false,
      isDev: false,
      isManager: false,
      isAdmin: true,
    });
    renderPage('/faq');
    expect(screen.queryByTestId('faq-admin-tabs')).not.toBeInTheDocument();
  });
});

// avoid unused import warning
void within;
