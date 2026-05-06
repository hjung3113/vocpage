import { cn } from '@shared/lib/cn';
import { badgeVariants } from './Badge';

export type SolidChipVariant = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';

export interface SolidChipProps {
  variant: SolidChipVariant;
  label: string;
  size?: 'sm';
  dotOnly?: boolean;
  extraTestId?: string;
  ariaLabelOverride?: string;
}

export function SolidChip({
  variant,
  label,
  dotOnly,
  extraTestId,
  ariaLabelOverride,
}: SolidChipProps) {
  const testId = extraTestId ?? `solid-chip-${variant}`;

  return (
    <span
      data-testid={testId}
      aria-label={ariaLabelOverride}
      className={cn(
        badgeVariants({ chipVariant: 'status' }),
        'text-[length:var(--chip-font-size-sm)]',
      )}
      style={{
        background: `var(--status-${variant}-bg)`,
        color: `var(--status-${variant}-fg)`,
        border: `1px solid var(--status-${variant}-border)`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 'var(--chip-dot-size)',
          height: 'var(--chip-dot-size)',
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {!dotOnly && label}
    </span>
  );
}
