import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { LoadingState } from '../../../components/common/LoadingState';
import type { InternalNote } from '../../../../../shared/contracts/voc';
import type { Role } from '../../../../../shared/contracts/common';

interface Props {
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  pending: boolean;
  role: Role;
  isOwner: boolean;
  onAdd: (body: string) => void;
}

function canViewInternalNotes(role: Role, isOwner: boolean): boolean {
  if (role === 'admin' || role === 'manager') return true;
  if (role === 'dev' && isOwner) return true;
  return false;
}

export function VocInternalNotes({ notes, notesLoading, pending, role, isOwner, onAdd }: Props) {
  const [body, setBody] = useState('');

  if (!canViewInternalNotes(role, isOwner)) return null;

  const count = notes?.length ?? 0;

  return (
    <section
      data-testid="drawer-internal-notes"
      className="flex flex-col gap-2 rounded border p-2"
      style={{
        borderColor: 'var(--border-standard)',
        background: 'var(--status-amber-bg)',
      }}
    >
      <h3
        id="voc-internal-notes-heading"
        className="text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        내부 메모
        {count > 0 && (
          <span data-testid="internal-notes-count" className="ml-1">
            {count}개
          </span>
        )}
      </h3>
      {notesLoading && <LoadingState />}
      {!notesLoading && count === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          등록된 내부 메모가 없습니다.
        </p>
      )}
      {notes && count > 0 && (
        <ul className="flex flex-col gap-2" aria-labelledby="voc-internal-notes-heading">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded border p-2 text-sm"
              style={{
                borderColor: 'var(--border-standard)',
                background: 'var(--bg-surface)',
              }}
            >
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {n.created_at.slice(0, 16).replace('T', ' ')}
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{n.body}</div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-1 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = body.trim();
          if (next) {
            onAdd(next);
            setBody('');
          }
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내부 메모를 입력하세요 (담당자·관리자만 볼 수 있음)"
          aria-label="new internal note"
        />
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          저장
        </Button>
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          담당자·관리자에게만 공개. 공개 댓글과 별도 저장.
        </p>
      </form>
    </section>
  );
}
