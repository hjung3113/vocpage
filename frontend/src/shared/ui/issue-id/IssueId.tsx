import type { CSSProperties } from 'react';

export type IssueIdTone = 'default' | 'subdued';

export interface IssueIdProps {
  id: string;
  tone?: IssueIdTone;
}

const BASE_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-mono)',
  fontSize: '11.5px',
  color: 'var(--text-tertiary)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  padding: '1px 6px',
  borderRadius: '4px',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

export function IssueId({ id, tone = 'default' }: IssueIdProps) {
  const style: CSSProperties = tone === 'subdued' ? { ...BASE_STYLE, opacity: 0.7 } : BASE_STYLE;
  return (
    <span data-testid="issue-id" data-tone={tone} style={style}>
      {id}
    </span>
  );
}
