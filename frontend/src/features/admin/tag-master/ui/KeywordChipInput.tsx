/**
 * KeywordChipInput — controlled chip-array editor.
 *
 * Phase 01 Plan 06 (Wave 3) · Tag Rules consolidation.
 * Threat: T-01-14 — client-side trim + case-insensitive dedupe + capacity caps
 * (max 50 chips by default, max 60 chars/chip enforced via input maxLength).
 * Server zod refine (Plan 04) is the authoritative gate.
 *
 * Visual contract: 01-UI-SPEC.md §Color §Forbidden accent uses + §Add form keyword input.
 *  - Chip background = `--bg-elevated` (NOT brand — keywords are content, not accent).
 *  - Chip pill radius `--chip-radius-pill`.
 *  - Inline error text uses `--status-red`.
 *
 * Composition note: existing tag-master modals use inline-style `ModalOverlay`
 * pattern (TagMasterCreateModal). For consistency we use the same inline-style
 * approach here rather than introducing shadcn `Input` for a single-purpose
 * control. All colors/radii via CSS custom properties from `uidesign.md`.
 */
import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

const MAX_KEYWORD_LEN = 60; // mirrors KeywordItem.max(60) in shared/contracts/admin/tag.ts

export interface KeywordChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  max?: number;
  'aria-label'?: string;
}

export function KeywordChipInput({
  value,
  onChange,
  disabled,
  placeholder,
  max = 50,
  'aria-label': ariaLabel,
}: KeywordChipInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const isDup = value.some((k) => k.toLowerCase() === trimmed.toLowerCase());
    if (isDup) {
      setError('이미 추가된 키워드입니다');
      return;
    }
    if (value.length >= max) {
      setError(`최대 ${max}개까지 추가할 수 있습니다`);
      return;
    }
    setError(null);
    onChange([...value, trimmed]);
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
      return;
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      setError(null);
      onChange(value.slice(0, -1));
    }
  }

  function removeChip(kw: string) {
    setError(null);
    onChange(value.filter((x) => x !== kw));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <div
        role="list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          minHeight: '32px',
          borderRadius: '6px',
          border: '1px solid var(--border-standard)',
          background: 'var(--bg-panel)',
        }}
      >
        {value.map((kw) => (
          <span
            key={kw}
            role="listitem"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--sp-1)',
              padding: '2px var(--sp-2)',
              borderRadius: 'var(--chip-radius-pill, 9999px)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '11.5px',
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {kw}
            <button
              type="button"
              aria-label={`${kw} 제거`}
              onClick={() => removeChip(kw)}
              disabled={disabled}
              className="tag-rule-icon-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--text-tertiary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? '키워드 입력 후 Enter (쉼표로도 추가 가능)'}
          disabled={disabled}
          maxLength={MAX_KEYWORD_LEN}
          aria-label={ariaLabel}
          className="tag-rule-search-input"
          style={{
            flex: '1 1 120px',
            minWidth: '120px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '2px 0',
          }}
        />
      </div>
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            color: 'var(--status-red)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
