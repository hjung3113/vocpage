import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocCommentList, type Comment } from '../VocCommentList';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const mkComment = (over: Partial<Comment> = {}): Comment => ({
  id: 'c-1',
  voc_id: 'v-1',
  author_id: OTHER,
  body: '리뷰 부탁드립니다',
  created_at: '2026-05-04T05:30:00.000Z',
  updated_at: '2026-05-04T05:30:00.000Z',
  ...over,
});

describe('VocCommentList', () => {
  it('빈 상태 — "댓글 0개" 헤더 + 푸터 textarea 노출', () => {
    render(
      <VocCommentList
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /댓글 0개/ })).toBeInTheDocument();
    expect(screen.getByLabelText('new comment')).toBeInTheDocument();
  });

  it('댓글 목록 렌더링 + 카운트', () => {
    render(
      <VocCommentList
        comments={[mkComment(), mkComment({ id: 'c-2', body: '확인했습니다' })]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /댓글 2개/ })).toBeInTheDocument();
    expect(screen.getByText('리뷰 부탁드립니다')).toBeInTheDocument();
    expect(screen.getByText('확인했습니다')).toBeInTheDocument();
  });

  it('편집/삭제 버튼은 본인 댓글에만 노출', () => {
    render(
      <VocCommentList
        comments={[mkComment({ id: 'mine', author_id: ME }), mkComment({ id: 'theirs' })]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId('comment-edit-mine')).toBeInTheDocument();
    expect(screen.getByTestId('comment-delete-mine')).toBeInTheDocument();
    expect(screen.queryByTestId('comment-edit-theirs')).not.toBeInTheDocument();
  });

  it('canWrite=false → 푸터 숨김', () => {
    render(
      <VocCommentList
        comments={[mkComment()]}
        currentUserId={ME}
        canWrite={false}
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('new comment')).not.toBeInTheDocument();
  });

  it('저장 클릭 → onAdd 호출 + textarea 비움', () => {
    const onAdd = vi.fn();
    render(
      <VocCommentList
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const ta = screen.getByLabelText('new comment') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '새 댓글' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onAdd).toHaveBeenCalledWith('새 댓글');
    expect(ta.value).toBe('');
  });
});
