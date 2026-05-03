import { useState } from 'react';
import { PopoverContent } from '../../../components/ui/popover';
import { cn } from '../../../lib/utils';
import {
  NotificationType,
  type NotificationItem,
  type NotificationType as NotificationTypeT,
} from '../../../../../shared/contracts/notification/io';

export const NOTIF_PANEL_ID = 'notif-panel';

type FilterKey = 'all' | NotificationTypeT;

const TYPE_LABELS: Record<NotificationTypeT, string> = {
  mention: '멘션',
  assigned: '할당',
  status_change: '상태변경',
  comment: '댓글',
};

const TYPE_CHIPS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '전체' },
  ...NotificationType.options.map((key) => ({ key, label: TYPE_LABELS[key] })),
];

export interface NotifPanelProps {
  items: NotificationItem[];
  unreadCount: number;
  onItemClick: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotifPanel({ items, unreadCount, onItemClick, onMarkAllRead }: NotifPanelProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const filtered = filter === 'all' ? items : items.filter((it) => it.type === filter);
  const hasUnread = unreadCount > 0;

  return (
    <PopoverContent
      id={NOTIF_PANEL_ID}
      role="dialog"
      aria-label="알림"
      align="end"
      sideOffset={8}
      className="w-[348px] overflow-hidden p-0"
    >
      <div className="flex items-center border-b border-[color:var(--border-subtle)] px-4 py-3">
        <span className="flex-1 text-[13px] font-bold text-[color:var(--text-primary)]">
          알림
          {hasUnread && (
            <span className="ml-1 text-[color:var(--text-tertiary)]">({unreadCount})</span>
          )}
        </span>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]"
          >
            모두 읽음
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="알림 유형 필터"
        className="flex gap-1 border-b border-[color:var(--border-subtle)] px-2 py-2"
      >
        {TYPE_CHIPS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
                  : 'bg-[color:var(--bg-elevated)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-panel)]',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[color:var(--text-secondary)]">
            알림이 없습니다
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              data-unread={(!item.read).toString()}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-[color:var(--border-subtle)] px-4 py-3 text-left',
                'transition-colors last:border-b-0 hover:bg-[color:var(--bg-elevated)]',
                !item.read && 'bg-[color:var(--brand-bg)]',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-[color:var(--text-primary)]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-[color:var(--text-quaternary)]">
                  {item.createdAt}
                </span>
              </span>
              {!item.read && (
                <span
                  aria-hidden
                  className="mt-1.5 h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[color:var(--accent)]"
                />
              )}
            </button>
          ))
        )}
      </div>
    </PopoverContent>
  );
}

export default NotifPanel;
