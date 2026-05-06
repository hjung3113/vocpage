import React from 'react';

export interface MetaFieldProps {
  label: string;
  testId: string;
  children: React.ReactNode;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginBottom: '2px',
};

export function MetaField({ label, testId, children }: MetaFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={LABEL_STYLE}>{label}</span>
      <div data-testid={testId}>{children}</div>
    </div>
  );
}
