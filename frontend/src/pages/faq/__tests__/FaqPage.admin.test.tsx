/**
 * FaqPage - admin-mode tests (10.4.3, 10.4.4).
 *
 * Covers:
 * - 노출 토글 optimistic + 서버 실패 시 롤백
 * - 카테고리 삭제 409 CATEGORY_HAS_ITEMS - 토스트 메시지
 * - 복원 버튼 admin only 가시성
 */
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError } from '@shared/api/client';
import {
  baseFaq,
  baseCategory,
  listMock,
  categoriesMock,
  roleMock,
  deleteCategoryMock,
  resetAll,
  renderPage,
} from './faq-test-helpers';
import { faqApi } from '@entities/faq';
import { toast } from '@shared/ui/toast';

vi.mock('@shared/ui/toast', async () => {
  const actual = await vi.importActual<typeof import('@shared/ui/toast')>('@shared/ui/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

beforeEach(() => {
  resetAll();
  vi.clearAllMocks();
});

function adminRole() {
  roleMock.mockReturnValue({
    role: 'admin', isUser: false, isDev: false, isManager: false, isAdmin: true,
  });
}
function managerRole() {
  roleMock.mockReturnValue({
    role: 'manager', isUser: false, isDev: false, isManager: true, isAdmin: false,
  });
}

describe('FaqPage admin - 노출 토글 optimistic + rollback (10.3.4)', () => {
  it('실패 시 토글 상태가 원래대로 롤백된다', async () => {
    const user = userEvent.setup();
    adminRole();
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });
    listMock.mockReturnValue({
      data: { rows: [{ ...baseFaq, is_visible: true }], page: 1, per_page: 20, total: 1 },
      isPending: false, isError: false,
    });

    const updateSpy = vi
      .spyOn(faqApi, 'update')
      .mockRejectedValue(new ApiError({ code: 'BOOM', message: 'fail' }, 500));

    renderPage('/faq?mode=admin');

    const toggle = screen.getByTestId(`faq-toggle-${baseFaq.id}`) as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    await act(async () => {
      await user.click(toggle);
    });

    // server eventually rejects - row should revert to original is_visible
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });
    await waitFor(() => {
      const after = screen.getByTestId(`faq-toggle-${baseFaq.id}`) as HTMLInputElement;
      expect(after.checked).toBe(true);
    });
  });
});

describe('FaqPage admin - 복원 가시성 (10.4.3)', () => {
  it('admin 은 복원 버튼이 보이고 manager 는 보이지 않는다', () => {
    const deleted = { ...baseFaq, deleted_at: '2026-04-01T00:00:00.000Z' };
    categoriesMock.mockReturnValue({ data: { rows: [baseCategory] }, isPending: false });

    listMock.mockReturnValue({
      data: { rows: [deleted], page: 1, per_page: 20, total: 1 },
      isPending: false, isError: false,
    });

    adminRole();
    const { unmount } = renderPage('/faq?mode=admin');
    expect(screen.getByTestId(`faq-restore-${baseFaq.id}`)).toBeInTheDocument();
    unmount();

    managerRole();
    renderPage('/faq?mode=admin');
    expect(screen.queryByTestId(`faq-restore-${baseFaq.id}`)).not.toBeInTheDocument();
  });
});

describe('FaqPage admin - 카테고리 관리 탭 (10.4.4)', () => {
  beforeEach(() => {
    adminRole();
    categoriesMock.mockReturnValue({
      data: { rows: [baseCategory, { ...baseCategory, id: 'cat-2', name: '결제' }] },
      isPending: false,
    });
    listMock.mockReturnValue({
      data: { rows: [baseFaq], page: 1, per_page: 20, total: 1 },
      isPending: false, isError: false,
    });
  });

  it('카테고리 관리 탭이 admin 에게만 렌더되고 행/액션이 보인다', async () => {
    const user = userEvent.setup();
    renderPage('/faq?mode=admin');
    await user.click(screen.getByTestId('faq-tab-categories'));
    expect(screen.getByTestId('faq-categories-tab')).toBeInTheDocument();
    expect(screen.getByTestId('faq-category-row-cat-1')).toBeInTheDocument();
    expect(screen.getByTestId('faq-category-edit-cat-1')).toBeInTheDocument();
    expect(screen.getByTestId('faq-category-delete-cat-1')).toBeInTheDocument();
  });

  it('카테고리 삭제 409 CATEGORY_HAS_ITEMS 시 토스트가 표시된다', async () => {
    const user = userEvent.setup();
    deleteCategoryMock.mockImplementation((_id: string, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError({ code: 'CATEGORY_HAS_ITEMS', message: 'has items' }, 409));
    });
    renderPage('/faq?mode=admin');
    await user.click(screen.getByTestId('faq-tab-categories'));
    await user.click(screen.getByTestId('faq-category-delete-cat-1'));
    expect(toast.error).toHaveBeenCalledWith(
      '해당 카테고리에 FAQ 항목이 있어 삭제할 수 없습니다.',
    );
  });
});
