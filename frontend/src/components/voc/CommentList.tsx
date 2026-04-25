import { useEffect, useState } from 'react';
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from '../../api/comments';

interface CommentListProps {
  vocId: string;
  currentUserId: string;
  currentUserRole: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CommentList({ vocId, currentUserId, currentUserRole }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listComments(vocId)
      .then(setComments)
      .catch(() => setError('댓글을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [vocId]);

  async function handleCreate() {
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const created = await createComment(vocId, newBody.trim());
      setComments((prev) => [...prev, created]);
      setNewBody('');
    } catch {
      setError('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(commentId: string) {
    if (!editBody.trim()) return;
    try {
      const updated = await updateComment(vocId, commentId, editBody.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditBody('');
    } catch {
      setError('댓글 수정에 실패했습니다.');
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(vocId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError('댓글 삭제에 실패했습니다.');
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditBody(comment.body);
  }

  const canModify = (authorId: string) => authorId === currentUserId || currentUserRole === 'admin';

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          불러오는 중...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          댓글이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex flex-col gap-1 p-3 rounded-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {comment.author_id}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(comment.created_at)}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full rounded px-3 py-2 text-sm resize-none"
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'var(--brand)',
                        color: 'var(--text-on-brand)',
                        border: 'none',
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditBody('');
                      }}
                      className="px-3 py-1 rounded text-xs"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {comment.body}
                  </p>
                  {canModify(comment.author_id) && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs"
                        style={{ color: 'var(--danger)' }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex flex-col gap-2">
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="댓글을 입력하세요..."
          rows={3}
          className="w-full rounded px-3 py-2 text-sm resize-none"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={submitting || !newBody.trim()}
          className="self-end px-4 py-1.5 rounded text-sm font-medium"
          style={{
            background: newBody.trim() ? 'var(--brand)' : 'var(--bg-surface)',
            color: newBody.trim() ? 'var(--text-on-brand)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            cursor: submitting || !newBody.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
    </div>
  );
}
