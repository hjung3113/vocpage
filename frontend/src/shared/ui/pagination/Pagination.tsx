import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/cn';
import { PaginationRoot, PaginationContent, PaginationItem } from './PaginationPrimitives';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number;
}

const ELLIPSIS = '…';

function getPageList(
  page: number,
  totalPages: number,
  siblingCount: number,
): Array<number | typeof ELLIPSIS> {
  const total = totalPages;
  const maxItems = siblingCount * 2 + 5; // first + last + current + 2*sibling + 2 ellipsis
  if (total <= maxItems) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, total - 1);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;

  const list: Array<number | typeof ELLIPSIS> = [1];
  if (showLeftEllipsis) list.push(ELLIPSIS);
  for (let i = left; i <= right; i++) list.push(i);
  if (showRightEllipsis) list.push(ELLIPSIS);
  list.push(total);
  return list;
}

export function Pagination({ page, totalPages, onChange, siblingCount = 1 }: PaginationProps) {
  const pages = getPageList(page, totalPages, siblingCount);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <PaginationRoot
      data-pcomp="pagination"
      aria-label="페이지"
      className="flex items-center justify-center gap-1"
    >
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={isFirst || undefined}
            disabled={isFirst}
            onClick={() => !isFirst && onChange(page - 1)}
            className="border-[color:var(--border-standard)] text-[color:var(--text-secondary)]"
          >
            이전
          </Button>
        </PaginationItem>
        {pages.map((p, idx) =>
          p === ELLIPSIS ? (
            <PaginationItem key={`e-${idx}`}>
              <span aria-hidden className="px-2 text-sm text-[color:var(--text-secondary)]">
                {ELLIPSIS}
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <Button
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'min-w-9',
                  p === page
                    ? 'bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
                    : 'border-[color:var(--border-standard)] text-[color:var(--text-primary)]',
                )}
              >
                {p}
              </Button>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={isLast || undefined}
            disabled={isLast}
            onClick={() => !isLast && onChange(page + 1)}
            className="border-[color:var(--border-standard)] text-[color:var(--text-secondary)]"
          >
            다음
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}

export default Pagination;
