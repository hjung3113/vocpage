interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  onClick?: () => void;
}

export function KpiCard({ label, value, unit, onClick }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minWidth: '120px',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 700 }}>
        {value}
        {unit && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '2px' }}>
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
