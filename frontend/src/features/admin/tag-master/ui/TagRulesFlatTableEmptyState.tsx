/**
 * EmptyState slot for TagRulesFlatTable. Extracted to keep parent under 200 LOC.
 */
export function TagRulesFlatTableEmptyState({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <div
      role="status"
      style={{
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {heading}
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{body}</div>
    </div>
  );
}
