import type { CSSProperties } from 'react';
import type { VocStatus } from '@contracts/voc';
import { VOC_STATUS_SLUG } from '../model/vocStatus';

/**
 * 14px circle status indicator — prototype `.s-icon` pattern.
 * - todo (received): solid 1.5px border, text-tertiary
 * - review (reviewing): conic-gradient 80% chart-blue
 * - progress (processing): conic-gradient 60% chart-amber
 * - done: solid fill chart-emerald + ✓
 * - canceled (drop): solid fill text-quaternary + ×
 */
const SIZE = 14;
const BORDER = 1.5;

type StatusSlug = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';

const STYLES: Record<StatusSlug, { root: CSSProperties; inner?: CSSProperties; mark?: string }> = {
  received: {
    root: {
      border: `${BORDER}px solid var(--text-tertiary)`,
    },
  },
  reviewing: {
    root: {
      background: 'conic-gradient(var(--chart-blue) 0% 80%, transparent 80% 100%)',
      border: `${BORDER}px solid var(--chart-blue)`,
    },
  },
  processing: {
    root: {
      background: 'conic-gradient(var(--chart-amber) 0% 60%, transparent 60% 100%)',
      border: `${BORDER}px solid var(--chart-amber)`,
    },
  },
  done: {
    root: {
      background: 'var(--chart-emerald)',
      border: `${BORDER}px solid var(--chart-emerald)`,
      color: 'var(--text-on-brand)',
    },
    mark: '✓',
  },
  drop: {
    root: {
      background: 'var(--text-quaternary)',
      border: `${BORDER}px solid var(--text-quaternary)`,
      color: 'var(--text-on-brand)',
    },
    mark: '×',
  },
};

export function VocStatusIcon({ status }: { status: VocStatus }) {
  const slug = VOC_STATUS_SLUG[status] as StatusSlug;
  const cfg = STYLES[slug] ?? STYLES.received;
  return (
    <span
      role="img"
      aria-label={`상태 ${status}`}
      data-testid={`status-icon-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        borderRadius: '50%',
        fontSize: '9px',
        lineHeight: 1,
        ...cfg.root,
      }}
    >
      {cfg.mark}
    </span>
  );
}
