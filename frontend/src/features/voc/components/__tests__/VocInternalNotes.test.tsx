import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocInternalNotes } from '../VocInternalNotes';
import type { InternalNote } from '../../../../../../shared/contracts/voc';
import type { Role } from '../../../../../../shared/contracts/common';

const note = (over: Partial<InternalNote> = {}): InternalNote => ({
  id: 'n-1',
  voc_id: 'v-1',
  author_id: 'u-1',
  body: '내부 검토 결과 정상',
  created_at: '2026-05-04T05:00:00.000Z',
  updated_at: '2026-05-04T05:00:00.000Z',
  ...over,
});

const baseProps = {
  notes: [] as InternalNote[],
  notesLoading: false,
  pending: false,
  onAdd: vi.fn(),
};

describe('VocInternalNotes — role gate', () => {
  it('user 역할 → 렌더하지 않음 (null 반환)', () => {
    const { container } = render(
      <VocInternalNotes {...baseProps} role={'user' as Role} isOwner={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('dev + isOwner=false → 렌더하지 않음', () => {
    const { container } = render(
      <VocInternalNotes {...baseProps} role={'dev' as Role} isOwner={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('dev + isOwner=true → 렌더함', () => {
    render(<VocInternalNotes {...baseProps} role={'dev' as Role} isOwner={true} />);
    expect(screen.getByRole('heading', { name: /내부 메모/ })).toBeInTheDocument();
  });

  it('admin → 항상 렌더', () => {
    render(<VocInternalNotes {...baseProps} role={'admin' as Role} isOwner={false} />);
    expect(screen.getByRole('heading', { name: /내부 메모/ })).toBeInTheDocument();
  });

  it('manager → 항상 렌더', () => {
    render(<VocInternalNotes {...baseProps} role={'manager' as Role} isOwner={false} />);
    expect(screen.getByRole('heading', { name: /내부 메모/ })).toBeInTheDocument();
  });
});

describe('VocInternalNotes — content', () => {
  it('카운트 배지 + 내용 렌더', () => {
    render(
      <VocInternalNotes
        {...baseProps}
        notes={[note(), note({ id: 'n-2', body: '두번째 메모' })]}
        role={'admin' as Role}
        isOwner={false}
      />,
    );
    expect(screen.getByTestId('internal-notes-count')).toHaveTextContent('2개');
    expect(screen.getByText('내부 검토 결과 정상')).toBeInTheDocument();
    expect(screen.getByText('두번째 메모')).toBeInTheDocument();
  });

  it('빈 상태 메시지 + 카운트 배지 미노출 (count===0)', () => {
    render(<VocInternalNotes {...baseProps} notes={[]} role={'admin' as Role} isOwner={false} />);
    expect(screen.getByText('등록된 내부 메모가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByTestId('internal-notes-count')).not.toBeInTheDocument();
  });

  it('notesLoading=true → LoadingState 노출 + 빈 메시지 미노출', () => {
    render(
      <VocInternalNotes
        {...baseProps}
        notes={undefined}
        notesLoading={true}
        role={'admin' as Role}
        isOwner={false}
      />,
    );
    expect(screen.queryByText('등록된 내부 메모가 없습니다.')).not.toBeInTheDocument();
  });

  it('저장 → onAdd 호출 + textarea 비움', () => {
    const onAdd = vi.fn();
    render(
      <VocInternalNotes {...baseProps} onAdd={onAdd} role={'admin' as Role} isOwner={false} />,
    );
    const ta = screen.getByLabelText('new internal note') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '비공개 메모' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onAdd).toHaveBeenCalledWith('비공개 메모');
    expect(ta.value).toBe('');
  });
});
