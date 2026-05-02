import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { VocSortColumn, SortDir } from '../../../../shared/contracts/voc';

export interface VocListHeaderProps {
  sortBy: VocSortColumn;
  sortDir: SortDir;
  onSort: (key: VocSortColumn) => void;
}

type CellKey =
  | 'expand'
  | 'issue_code'
  | 'title'
  | 'status'
  | 'assignee'
  | 'priority'
  | 'created_at';

interface CellDef {
  key: CellKey;
  label: string;
  sortKey?: VocSortColumn;
}

const CELLS: CellDef[] = [
  { key: 'expand', label: '' },
  { key: 'issue_code', label: '이슈 ID', sortKey: 'issue_code' },
  { key: 'title', label: '제목' },
  { key: 'status', label: '상태', sortKey: 'status' },
  { key: 'assignee', label: '담당자' },
  { key: 'priority', label: '우선순위', sortKey: 'priority' },
  { key: 'created_at', label: '등록일', sortKey: 'created_at' },
];

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px 144px 1fr 115px 108px 84px 96px',
  padding: '0 var(--sp-5)',
  height: '32px',
  alignItems: 'center',
  borderBottom: '2px solid var(--border-subtle)',
  background: 'var(--bg-panel)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: 'var(--shadow-sm)',
};

const HCELL_BASE: CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  color: 'var(--text-quaternary)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  paddingRight: 'var(--sp-2)',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
};

const HCELL_SORTABLE: CSSProperties = {
  ...HCELL_BASE,
  cursor: 'pointer',
  userSelect: 'none',
};

const HCELL_ACTIVE: CSSProperties = {
  color: 'var(--accent)',
};

const ICON_BASE: CSSProperties = {
  width: '11px',
  height: '11px',
  opacity: 0.35,
};

const ICON_ACTIVE: CSSProperties = {
  opacity: 1,
};

const DIR_LABEL: Record<SortDir, string> = {
  asc: '오름차순',
  desc: '내림차순',
};

const ARIA_SORT: Record<SortDir, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

/**
 * Sticky list header for the VOC table.
 *
 * A11y contract: parent MUST provide an enclosing `role="grid"` (or `role="table"`)
 * ancestor so that this component's `role="row"` + `role="columnheader"` chain is valid.
 * VocTable composition (C-7) is responsible for that wrapper.
 */
export function VocListHeader({ sortBy, sortDir, onSort }: VocListHeaderProps) {
  return (
    <div
      data-pcomp="voc-list-header"
      data-testid="voc-list-header"
      role="row"
      style={CONTAINER_STYLE}
    >
      {CELLS.map((cell) => {
        const testId = `voc-list-header-cell-${cell.key}`;
        if (!cell.sortKey) {
          return (
            <div
              key={cell.key}
              role="columnheader"
              data-testid={testId}
              className="voc-list-header-hcell"
              style={HCELL_BASE}
            >
              {cell.label}
            </div>
          );
        }
        const isActive = sortBy === cell.sortKey;
        const Icon = isActive && sortDir === 'desc' ? ChevronDown : ChevronUp;
        const className = isActive
          ? 'voc-list-header-hcell hcell sort-active'
          : 'voc-list-header-hcell hcell';
        const ariaLabel = isActive
          ? `정렬: ${cell.label} ${DIR_LABEL[sortDir]}`
          : `정렬: ${cell.label}`;
        const iconClassName = isActive ? 'voc-list-header-icon is-active' : 'voc-list-header-icon';
        return (
          <button
            key={cell.key}
            type="button"
            role="columnheader"
            data-testid={testId}
            className={className}
            aria-sort={isActive ? ARIA_SORT[sortDir] : 'none'}
            aria-label={ariaLabel}
            onClick={() => onSort(cell.sortKey as VocSortColumn)}
            style={isActive ? { ...HCELL_SORTABLE, ...HCELL_ACTIVE } : HCELL_SORTABLE}
          >
            {cell.label}
            <Icon
              key={sortDir}
              aria-hidden="true"
              className={iconClassName}
              style={isActive ? { ...ICON_BASE, ...ICON_ACTIVE } : ICON_BASE}
            />
          </button>
        );
      })}
    </div>
  );
}
