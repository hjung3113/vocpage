/**
 * Issue ID badge — prototype `.iid` pattern.
 * mono 11.5px / text-tertiary / bg-elevated / 1px border-subtle / 4px radius / 6px·1px padding.
 */
export function VocIssueCode({ code }: { code: string }) {
  return (
    <span
      data-testid={`issue-code-${code}`}
      style={{
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
      }}
    >
      {code}
    </span>
  );
}
