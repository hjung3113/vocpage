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
const CENTER = SIZE / 2;
const STROKE = 1.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ROOT: CSSProperties = {
  width: SIZE,
  height: SIZE,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  borderRadius: '50%',
};

interface RingArcProps {
  color: string;
  fraction: number;
}

function RingArc({ color, fraction }: RingArcProps) {
  const dash = CIRCUMFERENCE * fraction;
  return (
    <>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        opacity={0.35}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
        strokeLinecap="butt"
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />
    </>
  );
}

function variantContent(variant: StatusGlyphVariant) {
  switch (variant) {
    case 'backlog':
      return (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--text-quaternary)"
          strokeWidth={STROKE}
          strokeDasharray="2 2"
        />
      );
    case 'todo':
      return (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth={STROKE}
        />
      );
    case 'progress':
      return <RingArc color="var(--chart-amber)" fraction={0.6} />;
    case 'review':
      return <RingArc color="var(--chart-blue)" fraction={0.8} />;
    case 'done':
      return (
        <>
          <circle cx={CENTER} cy={CENTER} r={CENTER} fill="var(--chart-emerald)" />
          <polyline
            points="3.5,7.5 6,10 10.5,4.5"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case 'canceled':
      return (
        <>
          <circle cx={CENTER} cy={CENTER} r={CENTER} fill="var(--text-quaternary)" />
          <path
            d="M4.5 4.5 L9.5 9.5 M9.5 4.5 L4.5 9.5"
            stroke="var(--text-primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        </>
      );
  }
}

export function StatusGlyph({ variant, ariaLabel }: StatusGlyphProps) {
  return (
    <span
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      data-testid={`status-glyph-${variant}`}
      data-variant={variant}
      style={ROOT}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        focusable="false"
      >
        {variantContent(variant)}
      </svg>
    </span>
  );
}
