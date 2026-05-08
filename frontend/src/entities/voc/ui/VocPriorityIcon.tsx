import type { VocPriority } from '@contracts/voc';

/**
 * 14px three-bar priority indicator — prototype `.p-icon` pattern.
 * - urgent: all bars status-red
 * - high:   all bars status-orange
 * - medium: 2 bars text-secondary
 * - low:    1 bar text-secondary
 * Bars: width 2.5px, heights 4/7/10px, gap 1.5px, radius 1px.
 */
const BAR_W = 2.5;
const GAP = 1.5;
const HEIGHTS = [4, 7, 10];

const PRIORITY_FILL: Record<VocPriority, [boolean, boolean, boolean]> = {
  urgent: [true, true, true],
  high: [true, true, true],
  medium: [true, true, false],
  low: [true, false, false],
};
const PRIORITY_COLOR: Record<VocPriority, string> = {
  urgent: 'var(--status-red)',
  high: 'var(--status-orange)',
  medium: 'var(--text-secondary)',
  low: 'var(--text-secondary)',
};
const DEFAULT_BAR_COLOR = 'var(--text-quaternary)';

export function VocPriorityIcon({ priority }: { priority: VocPriority }) {
  const fill = PRIORITY_FILL[priority] ?? [false, false, false];
  const onColor = PRIORITY_COLOR[priority] ?? 'var(--text-secondary)';
  return (
    <span
      role="img"
      aria-label={`우선순위 ${priority}`}
      data-testid={`priority-icon-${priority}`}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: `${GAP}px`,
        flexShrink: 0,
        width: '14px',
        height: '14px',
      }}
    >
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          style={{
            width: `${BAR_W}px`,
            height: `${h}px`,
            borderRadius: '1px',
            background: fill[i] ? onColor : DEFAULT_BAR_COLOR,
          }}
        />
      ))}
    </span>
  );
}
