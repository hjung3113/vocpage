import type { LucideIcon } from 'lucide-react';

export interface TextMarkProps {
  variant: string;
  iconMode: 'icon-only' | 'icon+text';
  icon: LucideIcon | '#';
  label: string;
  size?: 'sm' | 'xs';
  weight: 400 | 500 | 600 | 700;
  color: string;
  extraTestId?: string;
  ariaLabelOverride?: string;
}

export function TextMark({
  variant,
  iconMode,
  icon,
  label,
  size = 'sm',
  weight,
  color,
  extraTestId,
  ariaLabelOverride,
}: TextMarkProps) {
  const testId = extraTestId ?? `text-mark-${variant}`;
  const ariaLabel = ariaLabelOverride ?? (iconMode === 'icon-only' ? label : undefined);
  const isXs = size === 'xs';

  const styleBase: React.CSSProperties = {
    color,
    fontWeight: weight,
    fontSize: isXs ? 'var(--chip-font-size-xs)' : 'var(--chip-font-size-sm)',
    gap: 'var(--chip-gap)',
  };
  // xs intentionally omits fixed height — flows at natural line height in compact rows
  if (!isXs) styleBase.height = 'var(--chip-height-sm)';

  return (
    <span
      data-testid={testId}
      aria-label={ariaLabel}
      className="inline-flex items-center whitespace-nowrap"
      style={styleBase}
    >
      {icon === '#' ? (
        <span aria-hidden="true">#</span>
      ) : (
        (() => {
          const Icon = icon;
          return <Icon aria-hidden size={isXs ? 11 : 12} />;
        })()
      )}
      {iconMode === 'icon+text' && label}
    </span>
  );
}
