/**
 * UserRow — single row in the admin users table (W3-7).
 * Handles role inline-edit select and is_active toggle checkbox.
 */
import type { UserRole, AdminUserItem } from '../../../../../../shared/contracts/admin/user';
import { RolePill } from './RolePill';

const ROLE_OPTIONS: UserRole[] = ['user', 'dev', 'manager', 'admin'];

interface UserRowProps {
  user: AdminUserItem;
  onRoleChange: (id: string, role: UserRole) => void;
  onActiveToggle: (id: string, is_active: boolean) => void;
  isPending: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function UserRow({ user, onRoleChange, onActiveToggle, isPending }: UserRowProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border-standard)',
        opacity: user.is_active ? 1 : 0.55,
      }}
    >
      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 500, fontSize: '13.5px', color: 'var(--text-primary)' }}>
          {user.display_name}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {user.ad_username}
        </div>
      </td>
      <td style={{ padding: '10px 14px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
        {user.email}
      </td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RolePill role={user.role} />
          <select
            aria-label={`${user.display_name} 역할 변경`}
            value={user.role}
            disabled={isPending}
            onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
            style={{
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border-standard)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          <input
            type="checkbox"
            checked={user.is_active}
            disabled={isPending}
            onChange={(e) => onActiveToggle(user.id, e.target.checked)}
            aria-label={`${user.display_name} 활성화 토글`}
          />
          <span style={{ color: user.is_active ? 'var(--status-green)' : 'var(--text-tertiary)' }}>
            {user.is_active ? '활성' : '비활성'}
          </span>
        </label>
      </td>
      <td
        style={{
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDate(user.created_at)}
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>—</span>
      </td>
    </tr>
  );
}
