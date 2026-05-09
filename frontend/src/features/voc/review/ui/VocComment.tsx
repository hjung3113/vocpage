/**
 * VocComment — comment list + write/edit using Toast UI editor (HTML format).
 *
 * Wave 5 Phase B: Textarea → ToastBodyEditor (html) + SafeHtml render
 * (DOMPurify) per `feature-voc.md §8.13` (HTML body, 16KB DB CHECK).
 *
 * Mutation wiring lives in `VocActionSection.tsx` — this component is
 * presentation-only and forwards body strings via `onAdd/onEdit/onDelete`.
 */
import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { SafeHtml } from '@shared/ui/safe-html/SafeHtml';
import ToastBodyEditor from '../../create/ui/ToastBodyEditor';
import type { Comment } from '@contracts/voc';
import { ActivityAvatar } from './ActivityAvatar';
import { formatActivityTime } from '../lib/formatActivityTime';

export type { Comment };

interface Props {
  comments: Comment[];
  currentUserId: string;
  canWrite: boolean;
  pending: boolean;
  onAdd: (body: string) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}

/** Strip HTML to detect "empty" submissions (Toast UI may emit `<p><br></p>`). */
function isEmptyHtml(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;
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
    if (!isEmptyHtml(draft)) {
      onAdd(draft);
      setDraft('');
    }
  };

  return (
    <section data-testid="drawer-comments" className="flex flex-col gap-4 py-1" aria-label="댓글">
      {comments.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          아직 작성된 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col">
          {comments.map((c, i) => {
            const isLast = i === comments.length - 1;
            const isOwn = c.author_id === currentUserId;
            const isEditing = editingId === c.id;
            const edited = c.updated_at !== c.created_at;
            const shortUser = c.author_id.slice(0, 8);
            return (
              <li key={c.id} className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <ActivityAvatar userId={c.author_id} />
                  {!isLast && (
                    <div
                      className="mt-1.5 w-px flex-1"
                      style={{ background: 'var(--border-subtle)' }}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-x-1">
                    <div className="flex flex-wrap items-center gap-x-1 text-xs">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {shortUser}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {formatActivityTime(c.created_at)}
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
                        if (!isEmptyHtml(editBody)) {
                          onEdit(c.id, editBody);
                          setEditingId(null);
                        }
                      }}
                    >
                      <ToastBodyEditor
                        value={editBody}
                        onChange={setEditBody}
                        format="html"
                        height="200px"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={pending || isEmptyHtml(editBody)}
                        >
                          저장
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <SafeHtml
                      data-testid={`comment-body-${c.id}`}
                      className="text-sm"
                      html={c.body}
                    />
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
          aria-label="새 댓글"
        >
          <ToastBodyEditor
            value={draft}
            onChange={setDraft}
            format="html"
            height="200px"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={pending || isEmptyHtml(draft)}
              data-testid="comment-submit"
            >
              저장
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
