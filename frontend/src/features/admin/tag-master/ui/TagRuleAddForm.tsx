/**
 * TagRuleAddForm — inline add form (chip input + match_mode + submit).
 *
 * Phase 01 Plan 06. Extracted from TagRulesManagerModal for file-size discipline.
 * D-05 (chip array UX) + D-06 (match_mode select, single 'keyword' value v1).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { KeywordChipInput } from './KeywordChipInput';

export function TagRuleAddForm({
  keywords,
  onKeywordsChange,
  onSubmit,
  pending,
}: {
  keywords: string[];
  onKeywordsChange: (next: string[]) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const empty = keywords.length === 0;
  const [emptyError, setEmptyError] = useState(false);

  // Clear inline empty error as soon as the user adds a chip.
  useEffect(() => {
    if (!empty) setEmptyError(false);
  }, [empty]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (empty) {
      // UI-SPEC §Copywriting Contract: surface inline empty-keyword error.
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}
      aria-label="규칙 추가"
    >
      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <KeywordChipInput
          value={keywords}
          onChange={onKeywordsChange}
          aria-label="새 규칙 키워드"
        />
      </div>
      <select
        aria-label="매칭 방식"
        value="keyword"
        disabled
        style={{
          padding: '7px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-standard)',
          background: 'var(--bg-panel)',
          color: 'var(--text-primary)',
          fontSize: '13px',
        }}
      >
        <option value="keyword">키워드</option>
      </select>
      <button
        type="submit"
        disabled={empty || pending}
        style={{
          padding: '7px 14px',
          borderRadius: '6px',
          border: 'none',
          background: empty ? 'var(--bg-subtle)' : 'var(--accent)',
          color: empty ? 'var(--text-muted)' : 'var(--text-on-brand, var(--bg-elevated))',
          fontSize: '13px',
          fontWeight: 500,
          cursor: empty ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + 규칙 추가
      </button>
      </div>
      {emptyError && (
        <p
          role="alert"
          data-testid="rule-empty-keyword-error"
          style={{
            margin: 0,
            color: 'var(--status-red)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          키워드를 한 개 이상 입력하세요
        </p>
      )}
    </form>
  );
}
