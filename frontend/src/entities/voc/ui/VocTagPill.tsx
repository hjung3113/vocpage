import { OutlineChip } from '@shared/ui/badge';

export interface VocTagPillProps {
  name: string;
}

// Cool-tone palette only — avoids collision with status-glyph (amber/red/emerald)
// and priority-bars (red/orange). Tokens defined in shared/styles/globals.css.
const TAG_COLOR_PALETTE = [
  'var(--chart-blue)',
  'var(--chart-sky)',
  'var(--chart-teal)',
  'var(--chart-indigo)',
] as const;

const FALLBACK_DOT_COLOR = 'var(--text-quaternary)';

/**
 * Deterministic tag-name → palette index via djb2 hash.
 * Same name always maps to the same color across renders.
 */
export function hashTagColor(name: string): string {
  if (!name) return FALLBACK_DOT_COLOR;
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    // hash * 33 + c
    hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index] ?? FALLBACK_DOT_COLOR;
}

export function VocTagPill({ name }: VocTagPillProps) {
  return (
    <span
      data-testid="voc-tag-pill"
      data-tag-name={name}
      aria-label={`태그 ${name}`}
    >
      <OutlineChip variant="dot-pill" label={name} dotColor={hashTagColor(name)} />
    </span>
  );
}
