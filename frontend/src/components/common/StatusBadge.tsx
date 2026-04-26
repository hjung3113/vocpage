const STATUS_CONFIG: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  접수: {
    bg: 'var(--bg-elevated)',
    border: 'var(--border-standard)',
    color: 'var(--text-tertiary)',
    dot: 'var(--text-quaternary)',
  },
  검토중: {
    bg: 'var(--status-blue-bg)',
    border: 'var(--status-blue-border)',
    color: 'var(--status-blue)',
    dot: 'var(--status-blue)',
  },
  처리중: {
    bg: 'var(--status-green-bg)',
    border: 'var(--status-green-border)',
    color: 'var(--status-green)',
    dot: 'var(--status-green)',
  },
  완료: {
    bg: 'var(--status-green-bg)',
    border: 'var(--status-green-border)',
    color: 'var(--status-green)',
    dot: 'var(--status-green)',
  },
  드랍: {
    bg: 'var(--status-amber-bg)',
    border: 'var(--status-amber-border)',
    color: 'var(--status-amber)',
    dot: 'var(--status-amber)',
  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: 'var(--bg-elevated)',
    border: 'var(--border-standard)',
    color: 'var(--text-tertiary)',
    dot: 'var(--text-quaternary)',
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        minHeight: '19px',
        padding: '1px 7px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 600,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: cfg.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}
