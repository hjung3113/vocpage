import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import type { NotificationItem } from '../../../../shared/contracts/notification/io';

export type { NotificationItem };

export interface NotificationBellProps {
  unreadCount: number;
  items: NotificationItem[];
  onItemClick?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationBell({
  unreadCount,
  items,
  onItemClick,
  onMarkAllRead,
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;
  const isEmpty = items.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="알림"
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md',
            'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--text-primary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]',
          )}
        >
          <Bell size={18} aria-hidden />
          {hasUnread && (
            <span
              aria-label={`읽지 않은 알림 ${unreadCount}건`}
              className={cn(
                'absolute right-1 top-1 inline-flex min-w-[16px] items-center justify-center',
                'rounded-full bg-[color:var(--brand)] px-1 text-[10px] font-medium leading-4',
                'text-[color:var(--text-on-brand)]',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 border-[color:var(--border-standard)] bg-[color:var(--bg-elevated)]"
      >
        <DropdownMenuLabel className="text-[color:var(--text-primary)]">알림</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isEmpty ? (
          <div className="px-2 py-6 text-center text-sm text-[color:var(--text-secondary)]">
            알림이 없습니다
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => onItemClick?.(item.id)}
              className="text-[color:var(--text-primary)]"
            >
              <span className="truncate">{item.label}</span>
            </DropdownMenuItem>
          ))
        )}
        {onMarkAllRead && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onMarkAllRead()}
              className="justify-center text-[color:var(--brand)]"
            >
              모두 읽음
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
