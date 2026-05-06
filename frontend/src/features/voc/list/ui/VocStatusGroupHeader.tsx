import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { VocStatus } from '@contracts/voc';
import { VocStatusBadge } from '@entities/voc';

export interface VocStatusGroupHeaderProps {
  status: VocStatus;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}

// Phase 5: Linear-style group header (ref Tasks.html `.igroup-h`).
// padding 8px 24px, font-size 12px / 600, color text-secondary.
const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingLeft: 'var(--sp-5)',
  paddingRight: 'var(--sp-5)',
  background: 'var(--bg-panel)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  letterSpacing: '0.02em',
  border: 'none',
  borderTop: '1px solid var(--border-subtle)',
  borderBottom: '1px solid var(--border-subtle)',
  cursor: 'pointer',
  textAlign: 'left' as const,
};

const COUNT_STYLE: CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const CHEVRON_STYLE: CSSProperties = {
  width: 14,
  height: 14,
  color: 'var(--text-tertiary)',
};

export function VocStatusGroupHeader({
  status,
  count,
  collapsed,
  onToggle,
}: VocStatusGroupHeaderProps) {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <button
      type="button"
      data-pcomp="voc-status-group-header"
      data-testid={`voc-status-group-header-${status}`}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-expanded={!collapsed}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      style={HEADER_STYLE}
    >
      <Chevron aria-hidden="true" style={CHEVRON_STYLE} data-testid="voc-status-group-chevron" />
      <VocStatusBadge status={status} iconOnly />
      <span>{status}</span>
      <span style={COUNT_STYLE} data-testid="voc-status-group-count">
        {count}
      </span>
    </button>
  );
}
