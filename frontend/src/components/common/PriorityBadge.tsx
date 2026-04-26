import { Flame, ChevronUp, Minus, ChevronDown } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  urgent: {
    icon: <Flame size={13} />,
    label: 'Urgent',
    color: 'var(--status-red)',
  },
  high: {
    icon: <ChevronUp size={13} />,
    label: 'High',
    color: 'var(--status-amber)',
  },
  medium: {
    icon: <Minus size={13} />,
    label: 'Medium',
    color: 'var(--text-tertiary)',
  },
  low: {
    icon: <ChevronDown size={13} />,
    label: 'Low',
    color: 'var(--text-quaternary)',
  },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? {
    icon: <Minus size={13} />,
    label: priority,
    color: 'var(--text-tertiary)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        fontWeight: 500,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
