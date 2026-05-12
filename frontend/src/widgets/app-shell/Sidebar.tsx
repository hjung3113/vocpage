import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  LayoutDashboard,
  Megaphone,
  HelpCircle,
  Tag,
  Bell,
  Code2,
  ChevronDown,
  Trash2,
  Users,
  Database,
} from 'lucide-react';
import { useRole } from '@entities/user/model/useRole';
import { useNoticePopup } from '@entities/notice';
import { useUnreadBadge } from '@entities/notification';
import { SidebarUserSwitcher } from './SidebarUserSwitcher';
import { NavItemCountBadge } from './NavItemCountBadge';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  /** Visible to admin role only — manager is excluded (ADR 0005). */
  adminStrict?: boolean;
  devOnly?: boolean;
  /** admin group: visible to admin/manager/dev */
  adminGroup?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/voc', label: 'VOC', icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/notice', label: '공지사항', icon: Megaphone },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/notifications', label: '알림', icon: Bell },
  { to: '/health', label: 'Health', icon: Code2, devOnly: true },
];

/**
 * Admin group: visible to admin / manager / dev (ADR 0004 §6.2 OQ-5 Option B order).
 * 휴지통 (Trash) 은 Admin only — `adminStrict` 로 Manager / Dev 미노출 (ADR 0005).
 */
const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin/tags', label: '태그 관리', icon: Tag, adminGroup: true },
  { to: '/admin/masters', label: '외부 마스터', icon: Database, adminGroup: true },
  { to: '/admin/users', label: '사용자', icon: Users, adminStrict: true },
  { to: '/admin/vocs/trash', label: '휴지통', icon: Trash2, adminStrict: true },
];

export function Sidebar() {
  const { isAdmin, isManager, isDev } = useRole();
  const popup = useNoticePopup();
  const hasUrgentNotice = !popup.isError && !!popup.data?.rows?.some((n) => n.level === 'urgent');
  const { unreadCount: notifUnread, hasUrgent: notifUrgent } = useUnreadBadge();

  const visible = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || isAdmin || isManager) &&
      (!item.adminStrict || isAdmin) &&
      (!item.devOnly || isDev),
  );

  // Admin group: visible to admin / manager / dev
  const showAdminGroup = isAdmin || isManager || isDev;

  return (
    <nav
      className="flex flex-col border-r border-[color:var(--border-standard)] bg-[color:var(--bg-panel)]"
      style={{ width: '222px' }}
    >
      {/* 워크스페이스 셀렉터 */}
      <div
        data-testid="workspace-selector"
        className="flex min-h-9 items-center gap-2 border-b border-[color:var(--border-standard)] px-[10px] py-2"
      >
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--brand)] text-[var(--bg-elevated)]"
          aria-hidden
        >
          <MessageSquare size={12} />
        </div>
        <span
          className="flex-1 truncate font-medium"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          VOC Page
        </span>
        <ChevronDown size={14} aria-hidden className="shrink-0 text-[color:var(--text-muted)]" />
      </div>

      {/* nav 섹션 */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* 섹션 헤더 — 셀렉터와 16px 분리 */}
        <div data-testid="section-header-workspace" className="sidebar-section-header">
          Workspace
        </div>

        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar-nav-item">
            <Icon size={16} aria-hidden className="shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/notice' ? (
              <NavItemCountBadge
                count={0}
                urgent={hasUrgentNotice}
                urgentAriaLabel="긴급 공지"
                testId="sidebar-notice"
              />
            ) : null}
            {to === '/notifications' ? (
              <NavItemCountBadge
                count={notifUnread}
                urgent={notifUrgent}
                urgentAriaLabel="긴급 알림"
                testId="sidebar-notifications"
              />
            ) : null}
            {to === '/faq' ? (
              <NavItemCountBadge count={0} testId="sidebar-faq" />
            ) : null}
          </NavLink>
        ))}

        {/* 관리자 그룹 — admin / manager / dev 만 노출 (ADR 0004 §6.2) */}
        {showAdminGroup && (
          <>
            <div data-testid="section-header-admin" className="sidebar-section-header">
              관리자
            </div>
            {ADMIN_NAV_ITEMS.filter((item) => !item.adminStrict || isAdmin).map(
              ({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="sidebar-nav-item">
                  <Icon size={16} aria-hidden className="shrink-0" />
                  <span className="flex-1">{label}</span>
                </NavLink>
              ),
            )}
          </>
        )}
      </div>

      {/* 유저 카드 — 역할 전환 popover */}
      <div data-testid="user-card" className="mt-auto">
        <SidebarUserSwitcher />
      </div>
    </nav>
  );
}
