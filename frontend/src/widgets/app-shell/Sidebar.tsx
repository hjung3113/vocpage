import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  LayoutDashboard,
  Megaphone,
  HelpCircle,
  Tag,
  Bell,
  Settings,
  Code2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { useRole } from '@entities/user/model/useRole';
import { useNoticePopup } from '@entities/notice';
import { SidebarUserSwitcher } from './SidebarUserSwitcher';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  devOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/voc', label: 'VOC', icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/notice', label: '공지사항', icon: Megaphone },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/tags', label: 'Tag', icon: Tag },
  { to: '/notifications', label: '알림', icon: Bell },
  { to: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
  { to: '/health', label: 'Health', icon: Code2, devOnly: true },
];

export function Sidebar() {
  const { isAdmin, isManager, isDev } = useRole();
  const popup = useNoticePopup();
  const hasUrgentNotice =
    !popup.isError && !!popup.data?.rows?.some((n) => n.level === 'urgent');

  const visible = NAV_ITEMS.filter(
    (item) => (!item.adminOnly || isAdmin || isManager) && (!item.devOnly || isDev),
  );

  return (
    <nav
      className="flex flex-col border-r border-[color:var(--border-standard)] bg-[color:var(--bg-panel)]"
      style={{ width: '222px', fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
    >
      {/* 워크스페이스 셀렉터 */}
      <div
        data-testid="workspace-selector"
        className="flex items-center gap-2 border-b border-[color:var(--border-standard)]"
        style={{ padding: '8px 10px', minHeight: '36px' }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded"
          style={{
            width: '20px',
            height: '20px',
            background: 'var(--brand)',
            color: 'var(--bg-elevated)',
          }}
          aria-hidden
        >
          <MessageSquare size={12} />
        </div>
        <span
          className="flex-1 truncate font-medium"
          style={{ fontSize: '13px', color: 'var(--text-primary)' }}
        >
          VOC Page
        </span>
        <ChevronDown size={14} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>

      {/* nav 섹션 */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 8px' }}>
        {/* 섹션 헤더 — 셀렉터와 12px 분리 */}
        <div
          data-testid="section-header-workspace"
          style={{
            marginTop: '16px',
            padding: '4px 2px',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Workspace
        </div>

        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex items-center transition-colors', isActive ? 'font-medium' : '')
            }
            style={({ isActive }) => ({
              height: '34px',
              padding: '9px 12px',
              gap: '10px',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--brand-bg)' : undefined,
            })}
          >
            <Icon
              size={16}
              aria-hidden
              style={{
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/notice' && hasUrgentNotice ? (
              <span
                data-testid="sidebar-notice-urgent-badge"
                aria-label="긴급 공지"
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
                  lineHeight: 1,
                  background: 'var(--status-red)',
                  color: 'var(--bg-elevated)',
                }}
              >
                !
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>

      {/* 유저 카드 — 역할 전환 popover */}
      <div data-testid="user-card" style={{ marginTop: 'auto' }}>
        <SidebarUserSwitcher />
      </div>
    </nav>
  );
}
