import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { LoadingState } from '@shared/ui/skeleton';
import type { InternalNote } from '@contracts/voc';
import type { Role } from '@contracts/common';
import { formatActivityTime } from '../lib/formatActivityTime';

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
      className="flex flex-col gap-3 py-1"
      style={{ background: 'var(--status-amber-bg)' }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: 'var(--text-secondary)' }}
      >
        내부 메모{count > 0 && ` (${count})`}
      </p>
      {notesLoading && <LoadingState />}
      {!notesLoading && count === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          등록된 내부 메모가 없습니다.
        </p>
      )}
      {notes && count > 0 && (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {formatActivityTime(n.created_at)}
              </span>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2"
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
        <div className="flex items-center justify-between">
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            담당자·관리자에게만 공개
          </p>
          <Button type="submit" size="sm" disabled={pending || !body.trim()}>
            저장
          </Button>
        </div>
      </form>
    </section>
  );
}
