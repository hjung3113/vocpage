import type { CSSProperties } from 'react';
import type { VocPriority } from '@contracts/voc';
import {
  PriorityBars,
  type PriorityBarsVariant,
} from '@shared/ui/priority-bars';

const PRIORITY_CONFIG: Record<
  VocPriority,
  { label: string; variant: PriorityBarsVariant; weight: 400 | 500 | 600 | 700 }
> = {
  urgent: { label: 'Urgent', variant: 'urgent', weight: 700 },
  high: { label: 'High', variant: 'high', weight: 400 },
  medium: { label: 'Medium', variant: 'med', weight: 400 },
  low: { label: 'Low', variant: 'low', weight: 400 },
};

const CHIP_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  lineHeight: 1,
  color: 'var(--text-secondary)',
};

const ICON_ONLY_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function VocPriorityBadge({
  priority,
  iconOnly = false,
}: {
  priority: VocPriority;
  iconOnly?: boolean;
}) {
  const { label, variant, weight } = PRIORITY_CONFIG[priority];
  const ariaLabel = `Priority ${label}`;
  const testId = `priority-badge-${priority}`;

  if (iconOnly) {
    return (
      <span
        data-testid={testId}
        data-variant={variant}
        aria-label={ariaLabel}
        role="img"
        style={{ ...ICON_ONLY_BASE, fontWeight: weight }}
      >
        <PriorityBars variant={variant} />
      </span>
    );
  }

  return (
    <span
      data-testid={testId}
      data-variant={variant}
      aria-label={ariaLabel}
      role="img"
      style={{ ...CHIP_BASE, fontWeight: weight }}
    >
      <PriorityBars variant={variant} />
      <span>{label}</span>
    </span>
  );
}
