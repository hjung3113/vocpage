/**
 * TagRulesFlatRow — single row for the cross-tag flat rules table.
 * Extracted to keep TagRulesFlatTable under the 200-line cap.
 */
import type { TagRuleT, TagMasterItem } from '@contracts/admin/tag';

const KEYWORD_CHIPS_MAX = 3;

export function TagRulesFlatRow({
  rule,
  tag,
  onJumpToTag,
  onEditRule,
}: {
  rule: TagRuleT;
  tag: TagMasterItem;
  onJumpToTag: (tagId: string) => void;
  onEditRule: (tag: TagMasterItem) => void;
}) {
  const suspended = Boolean(rule.suspended_until);
  const visible = rule.keywords.slice(0, KEYWORD_CHIPS_MAX);
  const overflow = rule.keywords.length - visible.length;
  return (
    <tr
      data-testid={`flat-rule-row-${rule.id}`}
      style={{
        borderBottom: '1px solid var(--border-standard)',
        background: suspended ? 'var(--status-amber-bg)' : undefined,
      }}
    >
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
          {visible.map((kw) => (
            <span
              key={kw}
              style={{
                display: 'inline-flex',
                padding: '1px 8px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
              }}
            >
              {kw}
            </span>
          ))}
          {overflow > 0 && (
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>+{overflow}</span>
          )}
        </div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => onJumpToTag(tag.id)}
          data-testid={`flat-jump-tag-${tag.id}`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'underline',
          }}
        >
          {tag.name}
        </button>
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>키워드</td>
      <td style={{ padding: '10px 12px' }}>
        {suspended ? (
          <span
            style={{
              display: 'inline-flex',
              padding: '1px 8px',
              borderRadius: '4px',
              background: 'var(--status-amber-bg)',
              border: '1px solid var(--status-amber-border)',
              color: 'var(--status-amber)',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            일시중지됨
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px' }}>활성</span>
        )}
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
        {rule.created_by_name ?? '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => onEditRule(tag)}
          data-testid={`flat-edit-rule-${rule.id}`}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-standard)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          수정
        </button>
      </td>
    </tr>
  );
}
