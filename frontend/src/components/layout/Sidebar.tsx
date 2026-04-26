import { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Inbox,
  User,
  UserCheck,
  Users,
  BarChart2,
  Bell,
  HelpCircle,
  FolderOpen,
  Tag,
  Settings,
  Layers,
  MessageSquareDot,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const sidebarStyle: React.CSSProperties = {
  width: '222px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: 'var(--bg-panel)',
  borderRight: '1px solid var(--border-subtle)',
  overflow: 'hidden',
};

const logoAreaStyle: React.CSSProperties = {
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 16px',
  borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0,
};

const logoMarkStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  borderRadius: '7px',
  background: 'var(--brand)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: 'var(--shadow-sm)',
};

const logoTextStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.3px',
};

const logoBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  padding: '1px 5px',
  borderRadius: '3px',
  background: 'var(--brand-bg)',
  color: 'var(--brand)',
  border: '1px solid var(--brand-border)',
  letterSpacing: '0.03em',
  alignSelf: 'flex-start',
  marginTop: '1px',
};

const navScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  padding: '12px 12px 4px',
  color: 'var(--text-quaternary)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border-subtle)',
  margin: '4px 8px',
};

const userAreaStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border-subtle)',
  padding: '12px 14px',
  flexShrink: 0,
};

const userNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const userRoleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-quaternary)',
  marginTop: '1px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function navItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
    background: isActive ? 'var(--brand-bg)' : 'transparent',
    borderRadius: '7px',
    margin: '1px 8px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.12s, color 0.12s',
  };
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  badge?: number;
  badgeVariant?: 'accent' | 'muted';
}

function SidebarNavItem({ to, icon, label, end, badge, badgeVariant = 'accent' }: NavItemProps) {
  const badgeStyle: React.CSSProperties =
    badgeVariant === 'muted'
      ? {
          fontSize: '10px',
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: '9999px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-quaternary)',
        }
      : {
          fontSize: '10px',
          fontWeight: 600,
          padding: '1px 6px',
          borderRadius: '9999px',
          background: 'var(--brand)',
          color: 'white',
        };

  return (
    <NavLink to={to} end={end} style={({ isActive }) => navItemStyle(isActive)}>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && <span style={badgeStyle}>{badge}</span>}
    </NavLink>
  );
}

const THEME_ICONS = {
  system: <Monitor size={14} />,
  light: <Sun size={14} />,
  dark: <Moon size={14} />,
} as const;

const THEME_LABELS = {
  system: '시스템',
  light: '라이트',
  dark: '다크',
} as const;

export function Sidebar() {
  const ctx = useContext(AuthContext);
  const user = ctx?.user ?? null;
  const isAdmin = user?.role === 'admin';
  const { theme, toggle } = useTheme();

  const [systems, setSystems] = useState<Array<{ id: string; name: string }>>([]);
  const [vocCounts, setVocCounts] = useState<{ total: number; assigned: number }>({
    total: 0,
    assigned: 0,
  });

  useEffect(() => {
    fetch('/api/admin/systems', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSystems(data as Array<{ id: string; name: string }>);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/api/vocs?limit=1', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { total: 0 }))
        .then((d: { total?: number }) => d.total ?? 0),
      user.id
        ? fetch(`/api/vocs?assignee_id=${user.id}&limit=1`, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : { total: 0 }))
            .then((d: { total?: number }) => d.total ?? 0)
        : Promise.resolve(0),
    ])
      .then(([total, assigned]) => setVocCounts({ total, assigned }))
      .catch(() => {});
  }, [user]);

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={logoAreaStyle}>
        <div style={logoMarkStyle}>
          <MessageSquareDot size={14} color="white" />
        </div>
        <span style={logoTextStyle}>VOCpage</span>
        <span style={logoBadgeStyle}>BETA</span>
      </div>

      <nav style={navScrollStyle}>
        <div style={sectionLabelStyle}>보기</div>
        <SidebarNavItem
          to="/"
          end
          icon={<Inbox size={15} />}
          label="전체 VOC"
          badge={vocCounts.total}
          badgeVariant="accent"
        />
        <SidebarNavItem to="/?view=mine" icon={<User size={15} />} label="내 VOC" />
        <SidebarNavItem
          to="/?view=assigned"
          icon={<UserCheck size={15} />}
          label="담당 VOC"
          badge={vocCounts.assigned}
          badgeVariant="muted"
        />
        <SidebarNavItem to="/dashboard" icon={<BarChart2 size={15} />} label="대시보드" />

        {systems.length > 0 && (
          <>
            <div style={dividerStyle} />
            <div style={sectionLabelStyle}>시스템</div>
            {systems.map((system) => (
              <SidebarNavItem
                key={system.id}
                to={`/?system_id=${system.id}`}
                icon={<FolderOpen size={15} />}
                label={system.name}
              />
            ))}
          </>
        )}

        <div style={dividerStyle} />

        <div style={sectionLabelStyle}>정보</div>
        <SidebarNavItem to="/notices" icon={<Bell size={15} />} label="공지사항" />
        <SidebarNavItem to="/faq" icon={<HelpCircle size={15} />} label="FAQ" />

        {isAdmin && (
          <>
            <div style={dividerStyle} />
            <div style={sectionLabelStyle}>관리자</div>
            <SidebarNavItem to="/admin" end icon={<Tag size={15} />} label="태그 규칙 관리" />
            <SidebarNavItem to="/admin" icon={<Settings size={15} />} label="시스템/메뉴 관리" />
            <SidebarNavItem to="/admin" icon={<Layers size={15} />} label="유형 관리" />
            <SidebarNavItem to="/admin" icon={<Users size={15} />} label="사용자 관리" />
            <SidebarNavItem to="/admin" icon={<Bell size={15} />} label="공지사항 관리" />
            <SidebarNavItem to="/admin" icon={<HelpCircle size={15} />} label="FAQ 관리" />
          </>
        )}
      </nav>

      {/* Bottom: user info + theme toggle */}
      <div style={userAreaStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '12px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {user?.name ? user.name.charAt(0) : <User size={13} color="white" />}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={userNameStyle}>{user?.name ?? '—'}</div>
            <div style={userRoleStyle}>{user?.role ?? ''}</div>
          </div>
          <button
            onClick={toggle}
            title={`테마: ${THEME_LABELS[theme]}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--border-standard)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {THEME_ICONS[theme]}
          </button>
        </div>
      </div>
    </aside>
  );
}
