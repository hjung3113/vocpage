import { VocSortColumn } from '../../../../../shared/contracts/voc';
import type {
  VocSortColumn as VocSortColumnType,
  SortDir as SortDirType,
} from '../../../../../shared/contracts/voc';

const SORT_LABELS: Record<VocSortColumnType, string> = {
  created_at: '등록일',
  updated_at: '수정일',
  priority: '우선순위',
  status: '상태',
  due_date: '마감일',
  issue_code: '이슈 ID',
};

const COLUMNS = VocSortColumn.options;

export interface VocSortChipsProps {
  sortBy: VocSortColumnType;
  sortDir: SortDirType;
  onChange: (key: VocSortColumnType, dir: SortDirType) => void;
}

export function VocSortChips({ sortBy, sortDir, onChange }: VocSortChipsProps) {
  function handleClick(col: VocSortColumnType) {
    if (col === sortBy) {
      // toggle direction
      onChange(col, sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      onChange(col, 'desc');
    }
  }

  return (
    <div
      data-pcomp="voc-sort-chips"
      role="radiogroup"
      aria-label="정렬"
      className="flex items-center gap-1.5 flex-wrap px-6 py-2"
    >
      {COLUMNS.map((col) => {
        const isActive = col === sortBy;
        return (
          <button
            key={col}
            role="radio"
            type="button"
            aria-checked={isActive}
            onClick={() => handleClick(col)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={{
              background: isActive ? 'var(--brand)' : 'var(--bg-elevated)',
              color: isActive ? 'var(--text-on-brand)' : 'var(--text-primary)',
              border: '1px solid var(--border-standard)',
            }}
          >
            {SORT_LABELS[col]}
            {isActive && (
              <span aria-hidden className="text-xs">
                {sortDir === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default VocSortChips;
