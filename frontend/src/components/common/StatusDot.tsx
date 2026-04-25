const STATUS_COLORS: Record<string, string> = {
  접수: 'var(--status-blue)',
  검토중: 'var(--status-amber)',
  처리중: 'var(--status-purple)',
  완료: 'var(--status-green)',
  드랍: 'var(--status-red)',
};

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="status-dot"
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status] ?? 'var(--text-muted)',
        flexShrink: 0,
      }}
      title={status}
    />
  );
}
