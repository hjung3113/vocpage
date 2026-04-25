import { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { AppNotification } from '../../api/notifications';

function typeIcon(type: AppNotification['type']): string {
  if (type === 'comment') return '💬';
  if (type === 'status_change') return '🔄';
  if (type === 'assigned') return '👤';
  return '🔔';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => Promise<void>;
}

function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        background: n.is_read ? 'transparent' : 'var(--bg-surface)',
        cursor: n.is_read ? 'default' : 'pointer',
      }}
      onClick={() => {
        if (!n.is_read) onRead(n.id).catch(() => {});
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0, paddingTop: '1px' }}>{typeIcon(n.type)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
            lineHeight: '1.4',
            wordBreak: 'break-word',
          }}
        >
          {n.message}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          {relativeTime(n.created_at)}
        </p>
      </div>
      {!n.is_read && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--brand)',
            flexShrink: 0,
            marginTop: '5px',
          }}
        />
      )}
    </div>
  );
}

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, refetchPanel, markAsRead } = useNotifications();

  useEffect(() => {
    refetchPanel().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={onClose} />
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            알림
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              padding: '0',
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {notifications.length === 0 ? (
          <p
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              margin: 0,
            }}
          >
            알림이 없습니다.
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))
        )}
      </div>
    </>
  );
}
