/**
 * PageLayout — single page container, owns all page-level padding/rhythm.
 * Spec: docs/specs/requires/uidesign.md §5 Page Header → Slot contract.
 *
 * Pages MUST NOT pad their own root or render their own headers; everything
 * goes through `header` / `toolbar` / `children` slots so vertical rhythm is
 * uniform across VOC, Notice, FAQ, Tag Master, Trash.
 */
import type { ReactNode } from 'react';

interface PageLayoutProps {
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ header, toolbar, children }: PageLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      {header}
      {toolbar ? (
        <div
          style={{
            paddingLeft: 'var(--page-gutter-x)',
            paddingRight: 'var(--page-gutter-x)',
            paddingTop: 'var(--page-header-gap-bottom)',
            paddingBottom: 'var(--page-toolbar-gap-bottom)',
          }}
        >
          {toolbar}
        </div>
      ) : null}
      <div
        className="flex-1"
        style={{
          paddingLeft: 'var(--page-gutter-x)',
          paddingRight: 'var(--page-gutter-x)',
          paddingTop: toolbar ? 0 : 'var(--page-header-gap-bottom)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
