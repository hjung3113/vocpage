/**
 * `/notifications` page — Wave 5 Phase B.
 *
 * Lists recent notifications (50건 cap, 30일 lazy trim — server-side per
 * `feature-voc.md §8.6`). On mount, if there are unread items, marks all read
 * (the bell click on Sidebar = navigate here). Urgent rows render the 🔴!
 * indicator.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout, PageHeader } from '@widgets/app-shell';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';
import {
  useNotificationsList,
  useMarkAllRead,
} from '@entities/notification';

const TYPE_LABEL: Record<string, string> = {
  comment: '댓글',
  status_change: '상태 변경',
  assigned: '배정',
  mention: '멘션',
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function NotificationsPage() {
  const list = useNotificationsList();
  const markAllRead = useMarkAllRead();

  const items = list.data?.items ?? [];
  const unread = list.data?.unreadCount ?? 0;

  useEffect(() => {
    if (unread > 0 && !markAllRead.isPending) {
      markAllRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  if (list.isLoading) {
    return (
      <PageLayout header={<PageHeader title="알림" />}>
        <LoadingState />
      </PageLayout>
    );
  }

  if (list.isError) {
    return (
      <PageLayout header={<PageHeader title="알림" />}>
        <EmptyState
          title="알림을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
        />
      </PageLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PageLayout header={<PageHeader title="알림" />}>
        <EmptyState title="받은 알림이 없습니다." description="새 댓글·배정·상태 변경 시 여기에 표시됩니다." />
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<PageHeader title="알림" />}>
      <ul
        data-testid="notifications-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border-standard)',
        }}
      >
        {items.map((it) => {
          const inner = (
            <li
              key={it.id}
              data-testid={`notification-row-${it.id}`}
              data-unread={!it.read || undefined}
              data-urgent={it.isUrgent || undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderBottom: '1px solid var(--border-standard)',
                background: !it.read ? 'var(--brand-bg)' : undefined,
              }}
            >
              {it.isUrgent ? (
                <span
                  aria-label="긴급"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--status-red)',
                    color: 'var(--bg-elevated)',
                    lineHeight: 1,
                  }}
                >
                  !
                </span>
              ) : null}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  minWidth: '64px',
                }}
              >
                {TYPE_LABEL[it.type] ?? it.type}
              </span>
              <span style={{ flex: 1, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {it.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {formatRelative(it.createdAt)}
              </span>
            </li>
          );

          // Wave 5 Phase A — voc_id is the canonical backref; fall back to legacy `href`.
          const target = it.voc_id ? `/voc/${it.voc_id}` : it.href;
          if (target) {
            return (
              <Link key={it.id} to={target} style={{ textDecoration: 'none', color: 'inherit' }}>
                {inner}
              </Link>
            );
          }
          return inner;
        })}
      </ul>
    </PageLayout>
  );
}
