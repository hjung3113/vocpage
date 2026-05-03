import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocSubTaskList, type SubTaskItem } from '../VocSubTaskList';

const item = (over: Partial<SubTaskItem> = {}): SubTaskItem => ({
  id: 's-1',
  title: '하위 작업 1',
  status: '접수',
  ...over,
});

const baseProps = {
  parentId: 'v-parent',
  parentIsSubtask: false,
  subs: [] as SubTaskItem[],
  canAdd: true,
  onOpen: vi.fn(),
  onAdd: vi.fn(),
};

describe('VocSubTaskList', () => {
  it('빈 상태 — "서브태스크 0개" 헤더 + 추가 버튼', () => {
    render(<VocSubTaskList {...baseProps} />);
    expect(screen.getByRole('heading', { name: /서브태스크 0개/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '서브태스크 추가' })).toBeInTheDocument();
  });

  it('서브태스크 목록 렌더 + 카운트', () => {
    render(<VocSubTaskList {...baseProps} subs={[item(), item({ id: 's-2', title: '두번째' })]} />);
    expect(screen.getByRole('heading', { name: /서브태스크 2개/ })).toBeInTheDocument();
    expect(screen.getByText('하위 작업 1')).toBeInTheDocument();
    expect(screen.getByText('두번째')).toBeInTheDocument();
  });

  it('parent가 이미 subtask → 추가 disabled + 안내 메시지', () => {
    render(<VocSubTaskList {...baseProps} parentIsSubtask />);
    expect(screen.queryByRole('button', { name: '서브태스크 추가' })).not.toBeInTheDocument();
    expect(screen.getByText(/최대 1레벨/)).toBeInTheDocument();
  });

  it('parentIsSubtask=true + canAdd=true → parentIsSubtask 가 우선 (추가 버튼 미노출)', () => {
    render(<VocSubTaskList {...baseProps} parentIsSubtask canAdd />);
    expect(screen.queryByRole('button', { name: '서브태스크 추가' })).not.toBeInTheDocument();
    expect(screen.getByText(/최대 1레벨/)).toBeInTheDocument();
  });

  it('canAdd=false → 추가 버튼 미노출', () => {
    render(<VocSubTaskList {...baseProps} canAdd={false} />);
    expect(screen.queryByRole('button', { name: '서브태스크 추가' })).not.toBeInTheDocument();
  });

  it('서브태스크 행 클릭 → onOpen(id), 버튼 accessible name = "{status} {title}"', () => {
    const onOpen = vi.fn();
    render(<VocSubTaskList {...baseProps} subs={[item()]} onOpen={onOpen} />);
    const btn = screen.getByRole('button', { name: '접수 하위 작업 1' });
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledWith('s-1');
  });

  it('추가 버튼 → 인라인 form, 제목 입력 후 저장 → onAdd 호출', () => {
    const onAdd = vi.fn();
    render(<VocSubTaskList {...baseProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: '서브태스크 추가' }));
    const input = screen.getByLabelText('new subtask title') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '신규 서브' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onAdd).toHaveBeenCalledWith('신규 서브');
  });
});
