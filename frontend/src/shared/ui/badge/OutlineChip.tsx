import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { badgeVariants } from './Badge';

export type OutlineChipVariant = 'default' | 'dot-pill';

export interface OutlineChipProps {
  label: string;
  icon?: LucideIcon | '#';
  size?: 'sm';
  variant?: OutlineChipVariant;
  /** Token reference (e.g. `var(--text-quaternary)`); only used when variant === 'dot-pill'. */
  dotColor?: string;
}

const DOT_PILL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '1px 8px',
  borderRadius: '9999px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
  fontSize: '11.5px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const DOT_STYLE_BASE: CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
};

export function OutlineChip({ label, icon, variant = 'default', dotColor }: OutlineChipProps) {
  if (variant === 'dot-pill') {
    return (
      <span
        data-testid="outline-chip"
        data-variant="dot-pill"
        className="outline-chip"
        style={DOT_PILL_STYLE}
      >
        <span
          className="lc-dot"
          aria-hidden="true"
          style={{ ...DOT_STYLE_BASE, background: dotColor ?? 'var(--text-quaternary)' }}
        />
        {label}
      </span>
    );
  }

  return (
    <span
      data-testid="outline-chip"
      data-variant="default"
      className={cn(
        badgeVariants({ chipVariant: 'outline' }),
        'text-[length:var(--chip-font-size-sm)]',
      )}
    >
      {icon === '#' ? (
        <span aria-hidden="true">#</span>
      ) : icon ? (
        (() => {
          const Icon = icon as LucideIcon;
          return <Icon aria-hidden size={12} />;
        })()
      ) : null}
      {label}
    </span>
  );
}
