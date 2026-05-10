import { UserX } from 'lucide-react';

const ROW_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11.5px',
  color: 'var(--text-tertiary)',
};

const CIRCLE_STYLE: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  flexShrink: 0,
};

export function VocAssignee({ name }: { name: string | null }) {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return (
      <span
        data-testid="assignee-unassigned"
        aria-label="미배정"
        style={{ ...ROW_STYLE, color: 'var(--text-quaternary)' }}
      >
        <UserX aria-hidden="true" className="lucide lucide-user-x" width={15} height={15} />
        미배정
      </span>
    );
  }

  const initial = Array.from(trimmed)[0] ?? '';

  return (
    <span data-testid="assignee-circle" aria-label={`담당자 ${trimmed}`} style={ROW_STYLE}>
      <span aria-hidden="true" style={CIRCLE_STYLE}>
        {initial}
      </span>
      {trimmed}
    </span>
  );
}
