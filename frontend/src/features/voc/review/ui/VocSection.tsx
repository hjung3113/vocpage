import type { ReactNode } from 'react';

export interface VocSectionProps {
  title?: string;
  testId: string;
  children: ReactNode;
}

export function VocSection({ title, testId, children }: VocSectionProps) {
  return (
    <section data-testid={testId} className="flex flex-col gap-0 @container">
      {title && (
        <span
          className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-quaternary)' }}
        >
          {title}
        </span>
      )}
      {children}
    </section>
  );
}
