import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

export interface ListGroupHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  count?: number;
  children: ReactNode;
  testId?: string;
  ariaLabel?: string;
}

// uidesign.md §16.6 — list group header (Linear-style).
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

export function ListGroupHeader({
  collapsed,
  onToggle,
  count,
  children,
  testId,
  ariaLabel,
}: ListGroupHeaderProps) {
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
      data-testid={testId ?? 'list-group-header'}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-expanded={!collapsed}
      aria-label={ariaLabel}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      style={HEADER_STYLE}
    >
      <Chevron aria-hidden="true" style={CHEVRON_STYLE} data-testid="list-group-header-chevron" />
      {children}
      {count !== undefined && (
        <span style={COUNT_STYLE} data-testid="list-group-header-count">
          {count}
        </span>
      )}
    </button>
  );
}
