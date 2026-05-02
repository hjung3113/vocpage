export type SolidChipVariant = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';

export interface SolidChipProps {
  variant: SolidChipVariant;
  label: string;
  size?: 'sm';
  extraTestId?: string;
  ariaLabelOverride?: string;
}

export function SolidChip({ variant, label, extraTestId, ariaLabelOverride }: SolidChipProps) {
  const testId = extraTestId ?? `solid-chip-${variant}`;

  return (
    <span
      data-testid={testId}
      aria-label={ariaLabelOverride}
      className="inline-flex items-center whitespace-nowrap"
      style={{
        background: `var(--status-${variant}-bg)`,
        color: `var(--status-${variant}-fg)`,
        border: `1px solid var(--status-${variant}-border)`,
        borderRadius: 'var(--chip-radius-pill)',
        padding: '2px var(--chip-padding-x-sm)',
        height: 'var(--chip-height-sm)',
        gap: 'var(--chip-gap)',
        fontSize: 'var(--chip-font-size-sm)',
        fontWeight: 600,
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
      {label}
    </span>
  );
}
