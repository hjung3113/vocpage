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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRole } from '../../hooks/useRole';

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
  { to: '/notice', label: '공지/FAQ', icon: Megaphone },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/tags', label: 'Tag', icon: Tag },
  { to: '/notifications', label: '알림', icon: Bell },
  { to: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
  { to: '/health', label: 'Health', icon: Code2, devOnly: true },
];

export function Sidebar() {
  const { isAdmin, isDev } = useRole();

  const visible = NAV_ITEMS.filter(
    (item) => (!item.adminOnly || isAdmin || isDev) && (!item.devOnly || isDev),
  );

  return (
    <nav className="flex w-52 flex-col gap-1 border-r border-[color:var(--border-standard)] bg-[color:var(--bg-elevated)] px-2 py-4">
      <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">
        VOC Page
      </div>
      {visible.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              isActive
                ? 'bg-[color:var(--brand-bg)] font-medium text-[color:var(--brand)]'
                : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-app)] hover:text-[color:var(--text-primary)]',
            )
          }
        >
          <Icon size={16} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
