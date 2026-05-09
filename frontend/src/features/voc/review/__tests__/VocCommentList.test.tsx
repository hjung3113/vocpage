import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the Toast UI editor — jsdom can't handle the real one (canvas / contenteditable).
// Substitute a plain textarea that mirrors the value/onChange contract.
vi.mock('../../create/ui/ToastBodyEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="toast-editor-mock"
      aria-label="댓글 본문"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import { VocComment, type Comment } from '../ui/VocComment';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const mkComment = (over: Partial<Comment> = {}): Comment => ({
  id: 'c-1',
  voc_id: 'v-1',
  author_id: OTHER,
  body: '<p>리뷰 부탁드립니다</p>',
  created_at: '2026-05-04T05:30:00.000Z',
  updated_at: '2026-05-04T05:30:00.000Z',
  ...over,
});

function getEditor(): HTMLTextAreaElement {
  return screen.getAllByTestId('toast-editor-mock')[0] as HTMLTextAreaElement;
}

describe('VocCommentList — Toast UI editor + DOMPurify (Wave 5 Phase B)', () => {
  it('빈 상태 — 빈 메시지 + 푸터 에디터 노출', () => {
    render(
      <VocComment
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('아직 작성된 댓글이 없습니다.')).toBeInTheDocument();
    expect(screen.getByTestId('toast-editor-mock')).toBeInTheDocument();
  });

  it('댓글 본문은 DOMPurify 로 sanitize 후 렌더', () => {
    render(
      <VocComment
        comments={[mkComment({ id: 'c-1', body: '<p>안전</p><script>alert(1)</script>' })]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const body = screen.getByTestId('comment-body-c-1');
    expect(body.innerHTML).toContain('<p>안전</p>');
    expect(body.innerHTML).not.toContain('<script>');
  });

  it('편집/삭제 버튼은 본인 댓글에만 노출', () => {
    render(
      <VocComment
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
      <VocComment
        comments={[mkComment()]}
        currentUserId={ME}
        canWrite={false}
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('toast-editor-mock')).not.toBeInTheDocument();
  });

  it('편집 → 취소 → 원본 보존', () => {
    const onEdit = vi.fn();
    render(
      <VocComment
        comments={[mkComment({ id: 'mine', author_id: ME, body: '<p>원본</p>' })]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('comment-edit-mine'));
    const editor = getEditor();
    fireEvent.change(editor, { target: { value: '<p>바뀐</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByTestId('comment-body-mine').innerHTML).toContain('원본');
  });

  it('빈 본문 → 저장 disabled, onAdd 미호출', () => {
    render(
      <VocComment
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.change(getEditor(), { target: { value: '<p><br></p>' } });
    expect(screen.getByTestId('comment-submit')).toBeDisabled();
  });

  it('pending=true → 저장 버튼 disabled', () => {
    render(
      <VocComment
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={true}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.change(getEditor(), { target: { value: '<p>본문</p>' } });
    expect(screen.getByTestId('comment-submit')).toBeDisabled();
  });

  it('저장 클릭 → onAdd HTML 본문 전달 + 에디터 비움', () => {
    const onAdd = vi.fn();
    render(
      <VocComment
        comments={[]}
        currentUserId={ME}
        canWrite
        pending={false}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.change(getEditor(), { target: { value: '<p>새 댓글</p>' } });
    fireEvent.click(screen.getByTestId('comment-submit'));
    expect(onAdd).toHaveBeenCalledWith('<p>새 댓글</p>');
    expect((getEditor() as HTMLTextAreaElement).value).toBe('');
  });
});
