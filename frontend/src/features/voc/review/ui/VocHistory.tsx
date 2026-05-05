import { LoadingState } from '@shared/ui/skeleton';
import type { VocHistoryEntry } from '@contracts/voc';
import { VOC_FIELD_LABELS } from '@features/voc/list/constants';

interface Props {
  entries: VocHistoryEntry[] | undefined;
  loading: boolean;
}

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
            {(VOC_FIELD_LABELS as Record<string, string>)[h.field] ?? h.field}: {h.old_value ?? '∅'}{' '}
            → {h.new_value ?? '∅'}
          </div>
        </li>
      ))}
    </ol>
  );
}
