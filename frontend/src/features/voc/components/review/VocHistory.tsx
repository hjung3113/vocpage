import { LoadingState } from '@shared/ui/skeleton';
import type { VocHistoryEntry } from '../../../../../../shared/contracts/voc';

interface Props {
  entries: VocHistoryEntry[] | undefined;
  loading: boolean;
}

const FIELD_LABEL: Record<string, string> = {
  status: '상태',
  priority: '우선순위',
  assignee_id: '담당자',
  due_date: '마감일',
  title: '제목',
};

export function VocHistory({ entries, loading }: Props) {
  if (loading) return <LoadingState />;

  if (!entries || entries.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        변경 이력이 없습니다.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((h) => (
        <li
          key={h.id}
          className="rounded border p-2 text-xs"
          style={{ borderColor: 'var(--border-standard)' }}
        >
          <div style={{ color: 'var(--text-secondary)' }}>
            {h.changed_at.slice(0, 16).replace('T', ' ')}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            {FIELD_LABEL[h.field] ?? h.field}: {h.old_value ?? '∅'} → {h.new_value ?? '∅'}
          </div>
        </li>
      ))}
    </ol>
  );
}
