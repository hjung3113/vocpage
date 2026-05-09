/**
 * Notice popup modal — Wave 4 FE step 4 coverage.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3.2.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const popupMock = vi.fn();
const authMock = vi.fn();

vi.mock('@entities/notice', () => ({
  useNoticePopup: () => popupMock(),
}));

vi.mock('@features/auth', () => ({
  useAuth: () => authMock(),
}));

import { NoticePopupModal } from '../NoticePopupModal';
import { dismissKey, todayKst, tomorrowKst } from '../useNoticePopupTrigger';

const USER_ID = 'user-1';

const urgent = {
  id: 'n-urgent',
  title: '긴급 공지',
  body: '<p>긴급 본문</p>',
  level: 'urgent' as const,
  is_popup: true,
  is_visible: true,
  visible_from: null,
  visible_to: null,
  author_id: 'a',
  deleted_at: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};
const important = { ...urgent, id: 'n-important', title: '중요 공지', level: 'important' as const, body: '<p>중요</p>' };
const normal = { ...urgent, id: 'n-normal', title: '일반 공지', level: 'normal' as const, body: '<p>일반</p>' };

beforeEach(() => {
  popupMock.mockReset();
  authMock.mockReset();
  window.localStorage.clear();
  authMock.mockReturnValue({ user: { id: USER_ID, email: 'u@x', name: 'U', role: 'user' } });
});

afterEach(() => {
  window.localStorage.clear();
});

describe('NoticePopupModal — §10.3.2', () => {
  it('1건뿐일 때도 좌·우 2-panel 구조로 렌더된다', () => {
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.getByTestId('notice-popup-modal')).toBeInTheDocument();
    expect(screen.getByTestId('notice-popup-list')).toBeInTheDocument();
    expect(screen.getByTestId(`notice-popup-item-${urgent.id}`)).toBeInTheDocument();
    expect(screen.getByTestId('notice-popup-detail-title')).toHaveTextContent('긴급 공지');
    expect(screen.getByTestId(`notice-popup-detail-body-${urgent.id}`)).toBeInTheDocument();
  });

  it('가장 높은 중요도(urgent)가 디폴트 선택된다', () => {
    // BE returns importance desc; first row = highest.
    popupMock.mockReturnValue({
      data: { rows: [urgent, important, normal] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.getByTestId('notice-popup-detail-title')).toHaveTextContent('긴급 공지');
    expect(screen.getByTestId(`notice-popup-item-${urgent.id}`)).toHaveAttribute('aria-pressed', 'true');
  });

  it('"오늘 하루 보지 않기" 체크 + 닫기 → localStorage 키에 다음날 KST 저장', async () => {
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    const user = userEvent.setup();
    render(<NoticePopupModal />);
    await user.click(screen.getByTestId('notice-popup-dismiss-checkbox'));
    await user.click(screen.getByTestId('notice-popup-close'));
    expect(window.localStorage.getItem(dismissKey(USER_ID))).toBe(tomorrowKst());
  });

  it('체크 없이 닫기 → localStorage 키 미저장', async () => {
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    const user = userEvent.setup();
    render(<NoticePopupModal />);
    await user.click(screen.getByTestId('notice-popup-close'));
    expect(window.localStorage.getItem(dismissKey(USER_ID))).toBeNull();
  });

  it('localStorage 키 ≥ 오늘이면 팝업이 노출되지 않는다', () => {
    window.localStorage.setItem(dismissKey(USER_ID), todayKst()); // today equals → suppress
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.queryByTestId('notice-popup-modal')).not.toBeInTheDocument();
  });

  it('localStorage 키가 과거 날짜면 팝업이 다시 노출된다', () => {
    window.localStorage.setItem(dismissKey(USER_ID), '2020-01-01');
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.getByTestId('notice-popup-modal')).toBeInTheDocument();
  });

  it('userId 없으면 (로그아웃) 팝업이 노출되지 않는다', () => {
    authMock.mockReturnValue({ user: null });
    popupMock.mockReturnValue({
      data: { rows: [urgent] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.queryByTestId('notice-popup-modal')).not.toBeInTheDocument();
  });

  it('rows 가 비어있으면 팝업이 노출되지 않는다', () => {
    popupMock.mockReturnValue({
      data: { rows: [] },
      isError: false,
      isPending: false,
    });
    render(<NoticePopupModal />);
    expect(screen.queryByTestId('notice-popup-modal')).not.toBeInTheDocument();
  });
});
