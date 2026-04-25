const PRIORITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: 'var(--status-red)', color: 'var(--text-on-brand)', label: '긴급' },
  high: { bg: 'var(--status-amber)', color: 'var(--bg-app)', label: '높음' },
  medium: { bg: 'var(--status-blue)', color: 'var(--text-on-brand)', label: '중간' },
  low: { bg: 'var(--text-muted)', color: 'var(--text-on-brand)', label: '낮음' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority] ?? {
    bg: 'var(--text-muted)',
    color: 'var(--text-on-brand)',
    label: priority,
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}
