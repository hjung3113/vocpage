import { LoadingState } from '@shared/ui/skeleton';
import type { VocHistoryEntry } from '@contracts/voc';
import { VOC_FIELD_LABELS } from '@features/voc/constants';
import { ActivityAvatar } from './ActivityAvatar';
import { formatActivityTime } from '../lib/formatActivityTime';

interface Props {
  entries: VocHistoryEntry[] | undefined;
  loading: boolean;
}

export function VocHistory({ entries, loading }: Props) {
  if (loading) return <LoadingState />;

  if (!entries || entries.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        변경 이력이 없습니다.
      </p>
    );
  }

  return (
    <ol className="flex flex-col py-1">
      {entries.map((h, i) => {
        const fieldLabel = (VOC_FIELD_LABELS as Record<string, string>)[h.field] ?? h.field;
        const shortUser = h.changed_by.slice(0, 8);
        return (
          <li key={h.id} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <ActivityAvatar userId={h.changed_by} />
              {i < entries.length - 1 && (
                <div
                  className="mt-1.5 w-px flex-1"
                  style={{ background: 'var(--border-subtle)' }}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-1 text-xs">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {shortUser}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{fieldLabel} 변경</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {formatActivityTime(h.changed_at)}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{h.old_value ?? '∅'}</span>
                {' → '}
                <span style={{ color: 'var(--text-primary)' }}>{h.new_value ?? '∅'}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
