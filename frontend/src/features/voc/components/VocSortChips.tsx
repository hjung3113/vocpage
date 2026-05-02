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
      onChange(col, sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      onChange(col, 'desc');
    }
  }

  return (
    <div className="list-toolbar" data-pcomp="voc-sort-chips">
      <span className="sort-label">정렬</span>
      <div className="sort-chips" role="radiogroup" aria-label="정렬">
        {COLUMNS.map((col) => {
          const isActive = col === sortBy;
          const className = isActive ? 'sort-chip sort-chip--active' : 'sort-chip';
          return (
            <button
              key={col}
              role="radio"
              type="button"
              aria-checked={isActive}
              onClick={() => handleClick(col)}
              className={className}
            >
              {SORT_LABELS[col]}
              {isActive && (
                <span aria-hidden className="sort-chip-icon">
                  {sortDir === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VocSortChips;
