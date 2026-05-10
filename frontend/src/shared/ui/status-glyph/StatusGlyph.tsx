import type { CSSProperties } from 'react';

export type StatusGlyphVariant =
  | 'backlog'
  | 'todo'
  | 'progress'
  | 'review'
  | 'done'
  | 'canceled';

export interface StatusGlyphProps {
  variant: StatusGlyphVariant;
  ariaLabel?: string;
}

const SIZE = 14;

const BASE: CSSProperties = {
  width: SIZE,
  height: SIZE,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  boxSizing: 'border-box',
};

function variantStyle(variant: StatusGlyphVariant): CSSProperties {
  switch (variant) {
    case 'backlog':
      return { ...BASE, border: '1.5px dashed var(--text-quaternary)' };
    case 'todo':
      return { ...BASE, border: '1.5px solid var(--text-tertiary)' };
    case 'progress':
      return {
        ...BASE,
        border: '1.5px solid var(--chart-amber)',
        background:
          'conic-gradient(var(--chart-amber) 0 60%, transparent 60% 100%)',
      };
    case 'review':
      return {
        ...BASE,
        border: '1.5px solid var(--chart-blue)',
        background:
          'conic-gradient(var(--chart-blue) 0 80%, transparent 80% 100%)',
      };
    case 'done':
      return { ...BASE, background: 'var(--chart-emerald)' };
    case 'canceled':
      return { ...BASE, background: 'var(--text-quaternary)' };
  }
}

function CheckMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 3,
        borderLeft: '1.5px solid var(--text-primary)',
        borderBottom: '1.5px solid var(--text-primary)',
        transform: 'rotate(-45deg) translate(0px, -1px)',
      }}
    />
  );
}

function CancelMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        color: 'var(--text-primary)',
        fontSize: 10,
        lineHeight: 1,
        fontWeight: 600,
      }}
    >
      ×
    </span>
  );
}

export function StatusGlyph({ variant, ariaLabel }: StatusGlyphProps) {
  return (
    <span
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      data-testid={`status-glyph-${variant}`}
      data-variant={variant}
      style={variantStyle(variant)}
    >
      {variant === 'done' && <CheckMark />}
      {variant === 'canceled' && <CancelMark />}
    </span>
  );
}
