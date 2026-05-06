import type { ReactNode } from 'react';

export interface PropRowProps {
  label: string;
  testId?: string;
  children: ReactNode;
}

export function PropRow({ label, testId, children }: PropRowProps) {
  return (
    <div className="flex items-center gap-3 py-1 min-h-[28px]">
      <span
        className="w-20 shrink-0 text-[11px] leading-none"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <div
        data-testid={testId}
        className="flex-1 min-w-0 text-xs"
        style={{ color: 'var(--text-primary)' }}
      >
        {children}
      </div>
    </div>
  );
}
