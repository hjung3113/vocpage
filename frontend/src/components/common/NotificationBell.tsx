import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { unreadCount, hasUrgentUnread } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-surface)' : 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '8px',
              background: 'var(--brand)',
              color: 'var(--text-on-brand)',
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {hasUrgentUnread && (
          <span
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--status-red)',
              color: 'var(--text-on-brand)',
              fontSize: '8px',
              fontWeight: 700,
              lineHeight: '12px',
              textAlign: 'center',
            }}
          >
            !
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
