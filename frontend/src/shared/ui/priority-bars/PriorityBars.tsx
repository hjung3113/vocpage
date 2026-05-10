import type { CSSProperties } from 'react';

export type PriorityBarsVariant = 'urgent' | 'high' | 'med' | 'low';

export interface PriorityBarsProps {
  variant: PriorityBarsVariant;
  ariaLabel?: string;
}

const CONTAINER: CSSProperties = {
  width: 14,
  height: 14,
  display: 'inline-flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 1.5,
  flex: '0 0 auto',
};

const BAR_BASE: CSSProperties = {
  width: 2.5,
  borderRadius: 1,
  display: 'inline-block',
};

const BAR_HEIGHTS = [4, 7, 10] as const;

function barColors(variant: PriorityBarsVariant): [string, string, string] {
  switch (variant) {
    case 'urgent':
      return ['var(--status-red)', 'var(--status-red)', 'var(--status-red)'];
    case 'high':
      return [
        'var(--status-orange)',
        'var(--status-orange)',
        'var(--status-orange)',
      ];
    case 'med':
      return [
        'var(--text-secondary)',
        'var(--text-secondary)',
        'var(--text-quaternary)',
      ];
    case 'low':
      return [
        'var(--text-secondary)',
        'var(--text-quaternary)',
        'var(--text-quaternary)',
      ];
  }
}

export function PriorityBars({ variant, ariaLabel }: PriorityBarsProps) {
  const colors = barColors(variant);
  return (
    <span
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      data-testid={`priority-bars-${variant}`}
      data-variant={variant}
      style={CONTAINER}
    >
      {BAR_HEIGHTS.map((h, i) => (
        <i
          key={i}
          aria-hidden="true"
          style={{
            ...BAR_BASE,
            height: h,
            background: colors[i],
          }}
        />
      ))}
    </span>
  );
}
