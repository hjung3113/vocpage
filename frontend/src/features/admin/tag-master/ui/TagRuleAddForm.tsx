/**
 * TagRuleAddForm — inline add form (chip input + match_mode + submit).
 *
 * Phase 01 Plan 06. Extracted from TagRulesManagerModal for file-size discipline.
 * D-05 (chip array UX) + D-06 (match_mode select, single 'keyword' value v1).
 */
import type { FormEvent } from 'react';
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (empty) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
      aria-label="규칙 추가"
    >
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
    </form>
  );
}
