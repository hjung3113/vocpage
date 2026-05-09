import type { ReactNode } from 'react';
import { Button } from '@shared/ui/button';
import { SafeHtml } from '@shared/ui/safe-html/SafeHtml';
import type { Faq, FaqCategory } from '@entities/faq';

/**
 * Wrap case-insensitive matches of `q` in `<mark>` for visual highlighting.
 * Returns plain text if `q` is empty.
 *
 * Token: `var(--mark-bg)` (uidesign §10 line 697 — `--mark-bg`). No
 * `--status-yellow-bg` exists in the design system; closest amber-bg variants
 * are panel/banner-scoped, so we use the dedicated mark token.
 */
export function highlightText(text: string, q: string): ReactNode {
  const trimmed = q.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'ig');
  const parts = text.split(re);
  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={i}
        data-testid="faq-highlight"
        style={{ background: 'var(--mark-bg)', color: 'inherit' }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

interface Props {
  faq: Faq;
  category: FaqCategory | undefined;
  expanded: boolean;
  onToggle: () => void;
  isAdminMode: boolean;
  isAdmin: boolean;
  onEdit: (f: Faq) => void;
  onDelete: (f: Faq) => void;
  onRestore: (f: Faq) => void;
  onToggleVisible: (f: Faq, next: boolean) => void;
  q: string;
}

export function FaqRow({
  faq,
  category,
  expanded,
  onToggle,
  isAdminMode,
  isAdmin,
  onEdit,
  onDelete,
  onRestore,
  onToggleVisible,
  q,
}: Props) {
  const isDeleted = faq.deleted_at !== null;
  return (
    <li
      data-testid={`faq-row-${faq.id}`}
      className="border-b border-[color:var(--border-standard)] py-3"
    >
      <div className="flex items-center gap-3">
        {category ? (
          <span
            data-testid={`faq-row-category-${faq.id}`}
            className="rounded bg-[color:var(--bg-elevated)] px-2 py-0.5 text-xs text-[color:var(--text-secondary)]"
          >
            {category.name}
          </span>
        ) : null}
        <button
          type="button"
          data-testid={`faq-question-${faq.id}`}
          onClick={onToggle}
          className="flex-1 text-left text-sm font-medium text-[color:var(--text-primary)] hover:underline"
        >
          {highlightText(faq.question, q)}
        </button>
        {isAdminMode ? (
          <>
            <label className="flex items-center gap-1 text-xs text-[color:var(--text-secondary)]">
              <input
                type="checkbox"
                data-testid={`faq-toggle-${faq.id}`}
                checked={faq.is_visible}
                onChange={(e) => onToggleVisible(faq, e.target.checked)}
              />
              노출
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid={`faq-edit-${faq.id}`}
              onClick={() => onEdit(faq)}
            >
              수정
            </Button>
            {isDeleted ? (
              isAdmin ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  data-testid={`faq-restore-${faq.id}`}
                  onClick={() => onRestore(faq)}
                >
                  복원
                </Button>
              ) : null
            ) : (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                data-testid={`faq-delete-${faq.id}`}
                onClick={() => onDelete(faq)}
              >
                삭제
              </Button>
            )}
          </>
        ) : null}
      </div>
      {expanded ? (
        <SafeHtml
          html={faq.answer}
          data-testid={`faq-answer-${faq.id}`}
          className="mt-2 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] p-3 text-sm text-[color:var(--text-primary)]"
        />
      ) : null}
    </li>
  );
}
