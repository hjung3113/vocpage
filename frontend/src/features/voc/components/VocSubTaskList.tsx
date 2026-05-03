import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { VocStatus } from '../../../../../shared/contracts/voc';

export interface SubTaskItem {
  id: string;
  title: string;
  status: VocStatus;
}

interface Props {
  parentId: string;
  parentIsSubtask: boolean;
  subs: SubTaskItem[];
  canAdd: boolean;
  onOpen: (id: string) => void;
  onAdd: (title: string) => void;
}

export function VocSubTaskList({ parentIsSubtask, subs, canAdd, onOpen, onAdd }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const showAddButton = canAdd && !parentIsSubtask && !formOpen;

  return (
    <section data-testid="drawer-subtasks" className="flex flex-col gap-2">
      <h3
        id="voc-subtasks-heading"
        className="text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        서브태스크 {subs.length}개
      </h3>
      {subs.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          서브태스크가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" aria-labelledby="voc-subtasks-heading">
          {subs.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded border p-2 text-sm"
              style={{
                borderColor: 'var(--border-standard)',
                background: 'var(--bg-elevated)',
              }}
            >
              <span
                className="rounded px-2 py-0.5 text-[11px]"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                }}
              >
                {s.status}
              </span>
              <button
                type="button"
                className="flex-1 text-left"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => onOpen(s.id)}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {parentIsSubtask && (
        <p
          className="text-[11px]"
          style={{ color: 'var(--text-quaternary, var(--text-secondary))' }}
        >
          서브태스크 추가 불가 (최대 1레벨)
        </p>
      )}
      {showAddButton && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => setFormOpen(true)}
        >
          서브태스크 추가
        </Button>
      )}
      {formOpen && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const next = title.trim();
            if (next) {
              onAdd(next);
              setTitle('');
              setFormOpen(false);
            }
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="서브태스크 제목 입력..."
            aria-label="new subtask title"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={!title.trim()}>
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setFormOpen(false);
              setTitle('');
            }}
          >
            취소
          </Button>
        </form>
      )}
    </section>
  );
}
