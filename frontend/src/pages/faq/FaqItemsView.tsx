import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { EmptyState } from '@shared/ui/empty-state';
import { LoadingState } from '@shared/ui/skeleton';
import { ErrorState } from '@shared/ui/error-state';
import type { Faq, FaqCategory } from '@entities/faq';
import { FaqRow } from './FaqRow';

export const ALL_CATEGORIES = '__all__';

interface Props {
  q: string;
  setQ: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categories: FaqCategory[];
  rows: Faq[];
  expandedId: string | null;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
  isAdminMode: boolean;
  isAdmin: boolean;
  isPending: boolean;
  isError: boolean;
  onEdit: (f: Faq) => void;
  onDelete: (f: Faq) => void;
  onRestore: (f: Faq) => void;
  onToggleVisible: (f: Faq, next: boolean) => void;
}

export function FaqItemsView({
  q,
  setQ,
  categoryId,
  setCategoryId,
  categories,
  rows,
  expandedId,
  setExpandedId,
  isAdminMode,
  isAdmin,
  isPending,
  isError,
  onEdit,
  onDelete,
  onRestore,
  onToggleVisible,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          data-testid="faq-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="질문/답변 검색"
          className="h-9 flex-1 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2 text-sm text-[color:var(--text-primary)]"
        />
      </div>

      <div
        role="tablist"
        aria-label="카테고리 필터"
        data-testid="faq-category-filter"
        className="flex flex-wrap gap-1 border-b border-[color:var(--border-subtle)]"
      >
        <FilterButton
          active={categoryId === ALL_CATEGORIES}
          onClick={() => setCategoryId(ALL_CATEGORIES)}
          testId="faq-category-filter-all"
        >
          전체
        </FilterButton>
        {categories.map((c) => (
          <FilterButton
            key={c.id}
            active={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
            testId={`faq-category-filter-${c.id}`}
          >
            {c.name}
          </FilterButton>
        ))}
      </div>

      {isPending ? <LoadingState /> : null}
      {isError ? <ErrorState message="FAQ 목록을 불러오지 못했습니다." /> : null}
      {!isPending && !isError && rows.length === 0 ? (
        <EmptyState title="FAQ 가 없습니다." />
      ) : null}

      {rows.length > 0 ? (
        <ul data-testid="faq-list" className="flex flex-col">
          {rows.map((f) => (
            <FaqRow
              key={f.id}
              faq={f}
              category={categories.find((c) => c.id === f.category_id)}
              expanded={expandedId === f.id}
              onToggle={() => setExpandedId((id) => (id === f.id ? null : f.id))}
              isAdminMode={isAdminMode}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              onToggleVisible={onToggleVisible}
              q={q}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      className={
        'rounded-t border-b-2 px-3 py-1.5 text-sm transition-colors ' +
        (active
          ? 'border-[color:var(--brand)] font-semibold text-[color:var(--text-primary)]'
          : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]')
      }
    >
      {children}
    </button>
  );
}
