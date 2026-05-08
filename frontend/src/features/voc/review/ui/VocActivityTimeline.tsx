import { MessageSquare, History, ListTree } from 'lucide-react';
import { LoadingState } from '@shared/ui/skeleton';
import type { VocHistoryEntry, Comment } from '@contracts/voc';
import { VOC_FIELD_LABELS } from '@features/voc/constants';
import { ActivityAvatar } from './ActivityAvatar';
import { formatActivityTime } from '../lib/formatActivityTime';

export interface ActivityItem {
  id: string;
  kind: 'history' | 'comment' | 'subtask';
  actor: string;
  at: string;
  summary: string;
}

interface Props {
  history: VocHistoryEntry[] | undefined;
  comments: Comment[] | undefined;
  loading: boolean;
}

const ICON_BY_KIND: Record<ActivityItem['kind'], typeof History> = {
  history: History,
  comment: MessageSquare,
  subtask: ListTree,
};

export function buildTimeline(
  history: VocHistoryEntry[] | undefined,
  comments: Comment[] | undefined,
): ActivityItem[] {
  const fromHistory: ActivityItem[] = (history ?? []).map((h) => {
    const fieldLabel = (VOC_FIELD_LABELS as Record<string, string>)[h.field] ?? h.field;
    const isSubtask = h.field === 'subtask' || h.field.startsWith('subtask_');
    return {
      id: `h-${h.id}`,
      kind: isSubtask ? 'subtask' : 'history',
      actor: h.changed_by,
      at: h.changed_at,
      summary: `${fieldLabel} ${h.old_value ?? '∅'} → ${h.new_value ?? '∅'}`,
    };
  });
  const fromComments: ActivityItem[] = (comments ?? []).map((c) => ({
    id: `c-${c.id}`,
    kind: 'comment',
    actor: c.author_id,
    at: c.created_at,
    summary: c.body.length > 80 ? `${c.body.slice(0, 80)}…` : c.body,
  }));
  return [...fromHistory, ...fromComments].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

export function VocActivityTimeline({ history, comments, loading }: Props) {
  if (loading) return <LoadingState />;

  const items = buildTimeline(history, comments);

  if (items.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        활동이 없습니다.
      </p>
    );
  }

  return (
    <ol data-testid="voc-activity-timeline" className="flex flex-col py-1">
      {items.map((item, i) => {
        const Icon = ICON_BY_KIND[item.kind];
        const shortUser = item.actor.slice(0, 8);
        return (
          <li key={item.id} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <ActivityAvatar userId={item.actor} />
              {i < items.length - 1 && (
                <div
                  className="mt-1.5 w-px flex-1"
                  style={{ background: 'var(--border-subtle)' }}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-1 text-xs">
                <Icon size={12} aria-hidden />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {shortUser}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{formatActivityTime(item.at)}</span>
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}
              >
                {item.summary}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
