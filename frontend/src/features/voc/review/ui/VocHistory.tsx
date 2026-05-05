import { LoadingState } from '@shared/ui/skeleton';
import type { VocHistoryEntry } from '@contracts/voc';
import { VOC_FIELD_LABELS } from '@features/voc/constants';

interface Props {
  entries: VocHistoryEntry[] | undefined;
  loading: boolean;
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
    <ol className="flex flex-col gap-4 py-1">
      {entries.map((h) => {
        const fieldLabel = (VOC_FIELD_LABELS as Record<string, string>)[h.field] ?? h.field;
        const shortUser = h.changed_by.slice(0, 8);
        return (
          <li key={h.id} className="flex gap-3">
            <ActivityAvatar userId={h.changed_by} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-x-1 text-xs">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {shortUser}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{fieldLabel} 변경</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{formatTime(h.changed_at)}</span>
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
