import * as React from 'react';
import { Bell } from 'lucide-react';
import { PopoverTrigger } from '../../../components/ui/popover';
import { cn } from '../../../lib/utils';
import { NOTIF_PANEL_ID } from './NotifPanel';

export interface NotifButtonProps {
  unreadCount: number;
}

export const NotifButton = React.forwardRef<HTMLButtonElement, NotifButtonProps>(
  ({ unreadCount }, ref) => {
    const hasUnread = unreadCount > 0;
    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          data-pcomp="notif-button"
          type="button"
          aria-label="알림"
          aria-haspopup="dialog"
          aria-controls={NOTIF_PANEL_ID}
          className={cn(
            'relative inline-flex h-8 w-8 items-center justify-center rounded-lg',
            'border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)]',
            'text-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--text-primary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]',
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
      </PopoverTrigger>
    );
  },
);
NotifButton.displayName = 'NotifButton';

export default NotifButton;
