/**
 * PageHeader — single entry point for all page top bars.
 * Spec: docs/specs/requires/uidesign.md §5 Page Header → Slot contract.
 *
 * Closed surface: no `className` / `style` props — title typography, count
 * styling, and action-row sizing are tokenized and must not drift per page.
 * If a new affordance is needed, extend the spec first, then this file.
 */
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  count?: number;
  actions?: ReactNode;
}

export function PageHeader({ title, count, actions }: PageHeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-b border-[color:var(--border-subtle)]"
      style={{
        height: 'var(--page-header-h)',
        paddingLeft: 'var(--page-gutter-x)',
        paddingRight: 'var(--page-gutter-x)',
      }}
    >
      <h1
        className="flex items-baseline text-[color:var(--text-primary)]"
        style={{
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '-0.2px',
        }}
      >
        {title}
        {count !== undefined && (
          <span
            className="text-[color:var(--text-tertiary)]"
            style={{ fontSize: '13px', fontWeight: 400, marginLeft: '6px' }}
          >
            {count}
          </span>
        )}
      </h1>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}
