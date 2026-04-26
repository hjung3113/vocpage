const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  접수: { bg: 'var(--status-blue)', color: 'white' },
  검토중: { bg: 'var(--accent)', color: 'white' },
  처리중: { bg: 'var(--status-green)', color: 'white' },
  완료: { bg: 'var(--status-emerald)', color: 'white' },
  드랍: { bg: 'var(--status-amber)', color: 'white' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: 'var(--text-muted)', color: 'white' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ marginRight: '4px', fontSize: '8px', lineHeight: 1 }}>●</span>
      {status}
    </span>
  );
}
