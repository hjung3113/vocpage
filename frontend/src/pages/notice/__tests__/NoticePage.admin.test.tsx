/**
 * NoticePage — admin-mode tests (§10.3.4, §10.5.2).
 */
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  baseNotice,
  listMock,
  roleMock,
  createMock,
  deleteMock,
  updateMock,
  renderPage,
  resetAll,
} from './notice-test-helpers';

beforeEach(() => {
  resetAll();
  roleMock.mockReturnValue({
    role: 'admin', isUser: false, isDev: false, isManager: false, isAdmin: true,
  });
});

describe('NoticePage — admin mode', () => {
  it('?mode=admin 에서 숨김·삭제 항목도 표시된다', () => {
    const hidden = { ...baseNotice, id: 'b', title: '숨김', is_visible: false };
    const deleted = {
      ...baseNotice,
      id: 'd',
      title: '삭제됨',
      deleted_at: '2026-04-01T00:00:00.000Z',
    };
    listMock.mockReturnValue({
      data: { rows: [baseNotice, hidden, deleted], page: 1, per_page: 20, total: 3 },
      isPending: false,
      isError: false,
    });
    renderPage('/notice?mode=admin');
    expect(screen.getByText('숨김')).toBeInTheDocument();
    expect(screen.getByText('삭제됨')).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith({ mode: 'admin', includeDeleted: true });
  });

  it('인라인 노출 토글 시 PATCH 호출', async () => {
    const user = userEvent.setup();
    listMock.mockReturnValue({
      data: { rows: [baseNotice], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    renderPage('/notice?mode=admin');
    await user.click(screen.getByTestId(`notice-toggle-${baseNotice.id}`));
    expect(updateMock).toHaveBeenCalledWith(baseNotice.id, { is_visible: false });
  });

  it('등록 모달 submit 시 create 호출', async () => {
    const user = userEvent.setup();
    listMock.mockReturnValue({
      data: { rows: [], page: 1, per_page: 20, total: 0 },
      isPending: false,
      isError: false,
    });
    renderPage('/notice?mode=admin');
    await user.click(screen.getByTestId('notice-create-button'));
    const dialog = await screen.findByTestId('notice-form-dialog');
    fireEvent.change(within(dialog).getByTestId('notice-form-title'), {
      target: { value: '새 공지' },
    });
    fireEvent.change(within(dialog).getByTestId('notice-form-body'), {
      target: { value: '본문' },
    });
    await user.click(within(dialog).getByTestId('notice-form-submit'));
    await waitFor(() => expect(createMock).toHaveBeenCalled());
    const [payload] = createMock.mock.calls[0];
    expect(payload).toMatchObject({ title: '새 공지', body: '본문', level: 'normal' });
  });

  it('삭제 버튼이 deleted=null 항목에서 호출된다', async () => {
    const user = userEvent.setup();
    listMock.mockReturnValue({
      data: { rows: [baseNotice], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    renderPage('/notice?mode=admin');
    await user.click(screen.getByTestId(`notice-delete-${baseNotice.id}`));
    expect(deleteMock).toHaveBeenCalledWith(baseNotice.id);
  });

  it('admin 만 복원 버튼을 본다 (manager 미렌더)', () => {
    const deleted = { ...baseNotice, deleted_at: '2026-04-01T00:00:00.000Z' };
    listMock.mockReturnValue({
      data: { rows: [deleted], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
    });
    const { unmount } = renderPage('/notice?mode=admin');
    expect(screen.getByTestId(`notice-restore-${deleted.id}`)).toBeInTheDocument();
    unmount();

    roleMock.mockReturnValue({
      role: 'manager', isUser: false, isDev: false, isManager: true, isAdmin: false,
    });
    renderPage('/notice?mode=admin');
    expect(screen.queryByTestId(`notice-restore-${deleted.id}`)).not.toBeInTheDocument();
  });
});
