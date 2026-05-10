/**
 * ActionButton — reusable icon+label button for Tag Master table actions.
 * Disabled state shows "Admin 전용" tooltip.
 */
export function TagMasterActionButton({
  icon,
  label,
  enabled,
  onClick,
  variant = 'default',
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
  testId?: string;
}) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={!enabled ? 'Admin 전용' : label}
      aria-label={label}
      data-testid={testId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '4px 7px',
        borderRadius: '4px',
        border: '1px solid var(--border-standard)',
        background: enabled
          ? variant === 'danger'
            ? 'var(--status-red-bg)'
            : 'var(--bg-panel)'
          : 'var(--bg-subtle)',
        color: enabled
          ? variant === 'danger'
            ? 'var(--status-red)'
            : 'var(--text-secondary)'
          : 'var(--text-muted)',
        fontSize: '12px',
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.5,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
