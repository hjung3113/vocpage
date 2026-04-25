import { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Inbox,
  User,
  Users,
  LayoutDashboard,
  Bell,
  HelpCircle,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

const sidebarStyle: React.CSSProperties = {
  width: '222px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: 'var(--bg-panel)',
  borderRight: '1px solid var(--border)',
  overflow: 'hidden',
};

const logoStyle: React.CSSProperties = {
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
};

const logoTextStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-ui)',
  letterSpacing: '-0.01em',
};

const navScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  padding: '16px 12px 6px',
  color: 'var(--text-quaternary)',
  fontFamily: 'var(--font-ui)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border)',
  margin: '4px 0',
};

const userAreaStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  padding: '12px 14px',
  flexShrink: 0,
};

const userNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-ui)',
  marginBottom: '2px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const userRoleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-quaternary)',
  fontFamily: 'var(--font-ui)',
  marginTop: '2px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function navItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
    background: isActive ? 'oklch(56.5% 0.196 261.3 / 0.1)' : 'transparent',
    borderRadius: '6px',
    margin: '1px 8px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: 'var(--font-ui)',
    transition: 'background 0.1s, color 0.1s',
  };
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

function SidebarNavItem({ to, icon, label, end }: NavItemProps) {
  return (
    <NavLink to={to} end={end} style={({ isActive }) => navItemStyle(isActive)}>
      {icon}
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const ctx = useContext(AuthContext);
  const user = ctx?.user ?? null;
  const isAdmin = user?.role === 'admin';

  const [systems, setSystems] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch('/api/admin/systems', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSystems(data as Array<{ id: string; name: string }>);
      })
      .catch(() => {});
  }, []);

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>
        <span style={logoTextStyle}>VOCPage</span>
      </div>

      <nav style={navScrollStyle}>
        <div style={sectionLabelStyle}>보기</div>
        <SidebarNavItem to="/" end icon={<Inbox size={15} />} label="전체 VOC" />
        <SidebarNavItem to="/?view=mine" icon={<User size={15} />} label="내 VOC" />
        <SidebarNavItem to="/?view=assigned" icon={<Users size={15} />} label="담당 VOC" />
        <SidebarNavItem to="/dashboard" icon={<LayoutDashboard size={15} />} label="대시보드" />

        {systems.length > 0 && (
          <>
            <div style={dividerStyle} />
            <div style={sectionLabelStyle}>시스템</div>
            {systems.map((system) => (
              <SidebarNavItem
                key={system.id}
                to={`/vocs?system_id=${system.id}`}
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
            <SidebarNavItem to="/admin" icon={<ShieldCheck size={15} />} label="관리자" />
          </>
        )}
      </nav>

      <div style={userAreaStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={15} color="var(--text-secondary)" />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={userNameStyle}>{user?.name ?? '—'}</div>
            <div style={userRoleStyle}>{user?.role ?? ''}</div>
          </div>
          <NotificationBell />
        </div>
      </div>
    </aside>
  );
}
