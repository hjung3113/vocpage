/**
 * TagRulesSubTable — sub-table inside TagRulesManagerModal.
 *
 * Phase 01 Plan 06. Renders TagRule rows with chips + status + author + action menu.
 * D-13 (permission gating): isAdmin controls visibility of suspend/resume/delete
 * menu items per threat T-01-15.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { TagRuleT } from '@contracts/admin/tag';
import { KeywordChipInput } from './KeywordChipInput';
import type { TagRuleConfirmKind } from './TagRuleConfirmDialog';
import { TagRuleActionMenu } from './TagRuleActionMenu';

const Th = ({ children }: { children: ReactNode }) => (
  <th
    style={{
      padding: 'var(--sp-2) var(--sp-3)',
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      textAlign: 'left',
    }}
  >
    {children}
  </th>
);

const Td = ({ children }: { children: ReactNode }) => (
  <td style={{ padding: 'var(--sp-3)', verticalAlign: 'middle', color: 'var(--text-primary)' }}>
    {children}
  </td>
);

const primaryBtn: CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--text-on-brand, var(--bg-elevated))',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: '1px solid var(--border-standard)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  cursor: 'pointer',
};

function KeywordChipsView({ keywords }: { keywords: string[] }) {
  const visible = keywords.slice(0, 3);
  const overflow = keywords.length - visible.length;
  const chip: CSSProperties = {
    padding: '2px 8px',
    borderRadius: 'var(--chip-radius-pill, 9999px)',
    background: 'var(--bg-elevated)',
    fontSize: '11.5px',
    fontWeight: 600,
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
      {visible.map((kw) => (
        <span key={kw} style={{ ...chip, color: 'var(--text-primary)' }}>
          {kw}
        </span>
      ))}
      {overflow > 0 && (
        <span style={{ ...chip, color: 'var(--text-tertiary)' }}>+{overflow}</span>
      )}
    </div>
  );
}

export interface TagRulesSubTableProps {
  rules: TagRuleT[];
  isAdmin: boolean;
  editingRuleId: string | null;
  editKeywords: string[];
  onEditKeywordsChange: (next: string[]) => void;
  onStartEdit: (rule: TagRuleT) => void;
  onCancelEdit: () => void;
  onSaveEdit: (ruleId: string) => void;
  onRequestConfirm: (kind: TagRuleConfirmKind, rule: TagRuleT) => void;
  updatePending: boolean;
  pendingPlaceholderKeywords?: string[];
}

export function TagRulesSubTable({
  rules,
  isAdmin,
  editingRuleId,
  editKeywords,
  onEditKeywordsChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestConfirm,
  updatePending,
  pendingPlaceholderKeywords,
}: TagRulesSubTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
          <Th>키워드 목록</Th>
          <Th>매칭 방식</Th>
          <Th>상태</Th>
          <Th>작성자</Th>
          <Th>작업</Th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => {
          const editing = editingRuleId === rule.id;
          const suspended = rule.suspended_until !== null;
          return (
            <tr
              key={rule.id}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: suspended ? 'var(--status-amber-bg)' : 'transparent',
              }}
            >
              <Td>
                {editing ? (
                  <KeywordChipInput
                    value={editKeywords}
                    onChange={onEditKeywordsChange}
                    aria-label={`규칙 ${rule.id} 키워드 편집`}
                  />
                ) : (
                  <KeywordChipsView keywords={rule.keywords} />
                )}
              </Td>
              <Td>키워드</Td>
              <Td>
                {suspended ? (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--status-amber-bg)',
                      color: 'var(--status-amber)',
                      border: '1px solid var(--status-amber-border)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  >
                    일시중지됨
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)' }}>활성</span>
                )}
              </Td>
              <Td>
                {rule.created_by_name ?? (
                  <span style={{ color: 'var(--text-quaternary)' }}>—</span>
                )}
              </Td>
              <Td>
                {editing ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onSaveEdit(rule.id)}
                      disabled={updatePending || editKeywords.length === 0}
                      style={primaryBtn}
                    >
                      저장
                    </button>
                    <button type="button" onClick={onCancelEdit} style={ghostBtn}>
                      취소
                    </button>
                  </div>
                ) : (
                  <TagRuleActionMenu
                    rule={rule}
                    isAdmin={isAdmin}
                    suspended={suspended}
                    onStartEdit={onStartEdit}
                    onRequestConfirm={onRequestConfirm}
                  />
                )}
              </Td>
            </tr>
          );
        })}
        {pendingPlaceholderKeywords && pendingPlaceholderKeywords.length > 0 && (
          <tr
            data-testid="rule-pending-placeholder"
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              opacity: 0.6,
              transition: 'opacity 120ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            aria-busy="true"
          >
            <Td>
              <KeywordChipsView keywords={pendingPlaceholderKeywords} />
            </Td>
            <Td>키워드</Td>
            <Td>
              <span style={{ color: 'var(--text-tertiary)' }}>저장 중...</span>
            </Td>
            <Td>
              <span style={{ color: 'var(--text-quaternary)' }}>—</span>
            </Td>
            <Td>—</Td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
