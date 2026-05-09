/**
 * ModeBadge — snapshot / cold-start / live status badge.
 * Spec: requirements.md §16.3, external-masters.md §8
 * Tokens: var(--*) only. No raw hex.
 */
import type { MasterMode } from '../api/useMastersApi';

interface ModeBadgeProps {
  mode: MasterMode;
}

const BADGE_STYLES: Record<MasterMode, { label: string; bg: string; color: string }> = {
  live:     { label: '정상',          bg: 'var(--status-green-subtle)', color: 'var(--status-green)' },
  snapshot: { label: '스냅샷 모드',   bg: 'var(--status-yellow-subtle)', color: 'var(--status-yellow)' },
  cold:     { label: '콜드 스타트 모드', bg: 'var(--status-red-subtle)', color: 'var(--status-red)' },
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const s = BADGE_STYLES[mode];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '18px',
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}
