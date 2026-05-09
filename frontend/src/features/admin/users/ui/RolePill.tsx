/**
 * RolePill — compact role badge (W3-7 Phase E).
 * Spec: uidesign.md §14.3 Role Pill.
 * Token contract: uses var(--*) only — no raw hex/OKLCH.
 */
import type React from 'react';
import type { UserRole } from '../../../../../../shared/contracts/admin/user';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  dev: 'Dev',
  user: 'User',
};

const ROLE_STYLES: Record<UserRole, React.CSSProperties> = {
  admin: {
    background: 'var(--brand-bg)',
    color: 'var(--accent)',
    borderColor: 'var(--brand-border)',
  },
  manager: {
    background: 'var(--status-amber-bg)',
    color: 'var(--status-amber)',
    borderColor: 'var(--status-amber-border)',
  },
  dev: {
    background: 'var(--role-dev-bg)',
    color: 'var(--role-dev-fg)',
    borderColor: 'var(--role-dev-border)',
  },
  user: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-tertiary)',
    borderColor: 'var(--border-subtle)',
  },
};

const pillBase: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11.5px',
  fontWeight: 600,
  padding: '2px 9px',
  borderRadius: '4px',
  border: '1px solid',
  fontFamily: 'var(--font-ui)',
  whiteSpace: 'nowrap',
};

interface RolePillProps {
  role: UserRole;
}

export function RolePill({ role }: RolePillProps) {
  return (
    <span
      className={`role-pill role-${role}`}
      style={{ ...pillBase, ...ROLE_STYLES[role] }}
      aria-label={`역할: ${ROLE_LABELS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
