import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocCreateDialog } from '../ui/VocCreateDialog';
import type { VocTypeListItem } from '@contracts/master/io';

const vocTypes: VocTypeListItem[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: '오류',
    slug: 'error',
    color: null,
    sort_order: 1,
    is_archived: false,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: '개선',
    slug: 'enhance',
    color: null,
    sort_order: 2,
    is_archived: false,
  },
];

const systems = [{ id: '66666666-6666-6666-6666-666666666666', label: 'WMS' }];
const menus = [{ id: '77777777-7777-7777-7777-777777777777', label: '입고 관리' }];
const assignees = [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', label: '홍길동' }];

function renderDialog(overrides: Partial<React.ComponentProps<typeof VocCreateDialog>> = {}) {
  const props: React.ComponentProps<typeof VocCreateDialog> = {
    open: true,
    vocTypes,
    systems,
    menus,
    assignees,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onOpenChange: vi.fn(),
    submitting: false,
    ...overrides,
  };
  return { props, ...render(<VocCreateDialog {...props} />) };
}

describe('VocCreateDialog', () => {
  it('모달이 open=true 일 때 렌더링된다', () => {
    renderDialog();
    expect(screen.getByTestId('voc-create-dialog')).toBeInTheDocument();
  });

  it('다이얼로그 헤더에 "새 VOC 등록" 제목이 있다', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /새 VOC 등록/ })).toBeInTheDocument();
  });

  it('다이얼로그 본문 영역(voc-create-body)이 존재한다', () => {
    renderDialog();
    expect(screen.getByTestId('voc-create-body')).toBeInTheDocument();
  });

  it('open=false 일 때 렌더링되지 않는다', () => {
    renderDialog({ open: false });
    expect(screen.queryByTestId('voc-create-dialog')).not.toBeInTheDocument();
  });

  it('title input이 존재한다', () => {
    renderDialog();
    expect(screen.getByRole('textbox', { name: /VOC 제목/ })).toBeInTheDocument();
  });

  it('voc_type chips가 렌더링된다', () => {
    renderDialog();
    // type-chip 영역에 버튼으로 존재
    expect(screen.getByRole('button', { name: '오류' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '개선' })).toBeInTheDocument();
  });

  it('voc_type chip 선택 시 활성화된다', async () => {
    const user = userEvent.setup();
    renderDialog();
    const chipBtn = screen.getByRole('button', { name: '개선' });
    await user.click(chipBtn);
    expect(chipBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('title 비어있을 때 등록 버튼 클릭 시 오류 표시하고 onSubmit 미호출', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });
    await user.click(screen.getByRole('button', { name: /등록/ }));
    expect(await screen.findByText(/제목.*필수/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('유효한 title 입력 후 등록 시 onSubmit 호출 (payload 검증)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });
    await user.type(screen.getByRole('textbox', { name: /VOC 제목/ }), '버그 발견');
    await user.click(screen.getByRole('button', { name: /등록/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [payload, files] = onSubmit.mock.calls[0]!;
    expect(payload).toMatchObject({
      title: '버그 발견',
      voc_type_id: vocTypes[0]!.id,
      system_id: systems[0]!.id,
      menu_id: menus[0]!.id,
    });
    expect(files).toEqual([]);
  });

  it('취소 버튼 클릭 시 onOpenChange(false) 호출', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    await user.click(screen.getByRole('button', { name: /취소/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('"Create another" 체크 후 제출 시 폼 초기화되고 다이얼로그 유지', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    renderDialog({ onSubmit, onOpenChange });
    // Check "create another"
    await user.click(screen.getByRole('checkbox', { name: /연속 등록/ }));
    await user.type(screen.getByRole('textbox', { name: /VOC 제목/ }), '첫 번째 이슈');
    await user.click(screen.getByRole('button', { name: /등록/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    // 폼 초기화됨 — title이 빈 값
    expect(screen.getByRole('textbox', { name: /VOC 제목/ })).toHaveValue('');
    // 다이얼로그 유지됨 (onOpenChange(false) 미호출)
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
