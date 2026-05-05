import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';

export interface Comment {
  id: string;
  voc_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  comments: Comment[];
  currentUserId: string;
  canWrite: boolean;
  pending: boolean;
  onAdd: (body: string) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}

export function VocCommentList({
  comments,
  currentUserId,
  canWrite,
  pending,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  return (
    <section
      data-testid="drawer-comments"
      className="flex flex-col gap-2"
      aria-labelledby="voc-comments-heading"
    >
      <h3
        id="voc-comments-heading"
        className="text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        댓글 {comments.length}개
      </h3>
      {comments.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          아직 작성된 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => {
            const isOwn = c.author_id === currentUserId;
            const isEditing = editingId === c.id;
            const edited = c.updated_at !== c.created_at;
            return (
              <li
                key={c.id}
                className="rounded border p-2 text-sm"
                style={{
                  borderColor: 'var(--border-standard)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <div
                  className="flex items-center justify-between text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>
                    {c.created_at.slice(0, 16).replace('T', ' ')}
                    {edited && <span className="ml-1">(수정됨)</span>}
                  </span>
                  {isOwn && !isEditing && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        data-testid={`comment-edit-${c.id}`}
                        aria-label="수정"
                        className="text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => {
                          setEditingId(c.id);
                          setEditBody(c.body);
                        }}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        data-testid={`comment-delete-${c.id}`}
                        aria-label="삭제"
                        className="text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => onDelete(c.id)}
                      >
                        삭제
                      </button>
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <form
                    className="mt-1 flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const next = editBody.trim();
                      if (next) {
                        onEdit(c.id, next);
                        setEditingId(null);
                      }
                    }}
                  >
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      aria-label="댓글 수정"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={pending || !editBody.trim()}>
                        저장
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div style={{ color: 'var(--text-primary)' }}>{c.body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {canWrite && (
        <form
          className="mt-1 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const next = draft.trim();
            if (next) {
              onAdd(next);
              setDraft('');
            }
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                const next = draft.trim();
                if (next) {
                  onAdd(next);
                  setDraft('');
                }
              }
            }}
            placeholder="댓글을 입력하세요 (Ctrl+Enter로 등록)"
            aria-label="new comment"
          />
          <Button type="submit" size="sm" disabled={pending || !draft.trim()}>
            저장
          </Button>
        </form>
      )}
    </section>
  );
}
