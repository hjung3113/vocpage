import type { LucideIcon } from 'lucide-react';

export interface TextMarkProps {
  variant: string;
  iconMode: 'icon-only' | 'icon+text';
  icon: LucideIcon;
  label: string;
  size?: 'sm';
  weight: 400 | 500 | 600 | 700;
  color: string;
  extraTestId?: string;
  ariaLabelOverride?: string;
}

export function TextMark({
  variant,
  iconMode,
  icon: Icon,
  label,
  weight,
  color,
  extraTestId,
  ariaLabelOverride,
}: TextMarkProps) {
  const testId = extraTestId ?? `text-mark-${variant}`;
  const ariaLabel = ariaLabelOverride ?? (iconMode === 'icon-only' ? label : undefined);

  return (
    <span
      data-testid={testId}
      aria-label={ariaLabel}
      className="inline-flex items-center whitespace-nowrap"
      style={{
        color,
        fontWeight: weight,
        fontSize: 'var(--chip-font-size-sm)',
        height: 'var(--chip-height-sm)',
        gap: 'var(--chip-gap)',
      }}
    >
      <Icon aria-hidden size={12} />
      {iconMode === 'icon+text' && label}
    </span>
  );
}
