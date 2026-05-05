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

function ActivityAvatar({ userId }: { userId: string }) {
  const initial = userId[0]?.toUpperCase() ?? '?';
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function formatTime(iso: string) {
  return iso.slice(0, 16).replace('T', ' ');
}

export function VocComment({
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

  const submitDraft = () => {
    const next = draft.trim();
    if (next) {
      onAdd(next);
      setDraft('');
    }
  };

  return (
    <section
      data-testid="drawer-comments"
      className="flex flex-col gap-4 py-1"
      aria-labelledby="voc-comments-heading"
    >
      {comments.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          아직 작성된 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((c) => {
            const isOwn = c.author_id === currentUserId;
            const isEditing = editingId === c.id;
            const edited = c.updated_at !== c.created_at;
            const shortUser = c.author_id.slice(0, 8);
            return (
              <li key={c.id} className="flex gap-3">
                <ActivityAvatar userId={c.author_id} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-x-1">
                    <div className="flex flex-wrap items-center gap-x-1 text-xs">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {shortUser}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {formatTime(c.created_at)}
                        {edited && <span className="ml-1">(수정됨)</span>}
                      </span>
                    </div>
                    {isOwn && !isEditing && (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          data-testid={`comment-edit-${c.id}`}
                          aria-label="수정"
                          className="text-[11px]"
                          style={{ color: 'var(--text-tertiary)' }}
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
                          style={{ color: 'var(--text-tertiary)' }}
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
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {c.body}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canWrite && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitDraft();
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                submitDraft();
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
