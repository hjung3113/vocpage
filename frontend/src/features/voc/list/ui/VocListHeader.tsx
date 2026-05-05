import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { VocSortColumn, SortDir } from '@contracts/voc';
import { VOC_GRID_COLUMNS, VOC_GRID_PADDING_X } from './vocGridLayout';
import { VOC_FIELD_LABELS } from '../../constants';

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
  { key: 'issue_code', label: VOC_FIELD_LABELS['issue_code'], sortKey: 'issue_code' },
  { key: 'title', label: VOC_FIELD_LABELS['title'], sortKey: 'title' },
  { key: 'status', label: VOC_FIELD_LABELS['status'], sortKey: 'status' },
  { key: 'assignee', label: VOC_FIELD_LABELS['assignee'], sortKey: 'assignee' },
  { key: 'priority', label: VOC_FIELD_LABELS['priority'], sortKey: 'priority' },
  { key: 'created_at', label: VOC_FIELD_LABELS['created_at'], sortKey: 'created_at' },
];

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: VOC_GRID_COLUMNS,
  padding: `0 ${VOC_GRID_PADDING_X}`,
  height: '32px',
  alignItems: 'center',
  borderBottom: '2px solid var(--border-subtle)',
  background: 'var(--bg-panel)',
  position: 'sticky',
  // Pull the sticky stop up by AppShell <main>'s vertical padding so the header
  // covers the scroll-port padding region instead of leaving a transparent gap
  // where rows bleed through. The shared semantic token --app-main-pad is the
  // single source of truth for that coupling — never substitute --sp-* here.
  // (Issues 162, 166)
  top: 'calc(0px - var(--app-main-pad))',
  zIndex: 10,
};

const EXPAND_OVERRIDE: CSSProperties = { paddingRight: 0 };

const ARIA_SORT: Record<SortDir, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

/**
 * Sticky list header for the VOC table.
 *
 * A11y contract:
 * - Parent MUST provide an enclosing `role="grid"` (or `role="table"`) ancestor
 *   so that this component's `role="row"` + `role="columnheader"` chain is valid.
 *   VocTable composition (C-7) is responsible for that wrapper.
 * - The expand cell carries no semantic column meaning (the chevron in row body
 *   conveys the affordance), so it is `role="presentation"` — six columnheaders.
 * - `aria-sort` natively communicates direction; `aria-label` is label-only.
 * - Focus-visible ring is provided by `.list-header-hcell:focus-visible`
 *   (CSS-only; jsdom cannot reliably assert focus styles).
 */
export function VocListHeader({ sortBy, sortDir, onSort }: VocListHeaderProps) {
  return (
    <div
      data-pcomp="list-header"
      data-testid="voc-list-header"
      role="row"
      className="list-header-container"
      style={CONTAINER_STYLE}
    >
      {CELLS.map((cell) => {
        const testId = `voc-list-header-cell-${cell.key}`;
        if (cell.key === 'expand') {
          return (
            <div
              key={cell.key}
              role="presentation"
              data-testid={testId}
              className="list-header-hcell"
              style={EXPAND_OVERRIDE}
            />
          );
        }
        if (!cell.sortKey) {
          return (
            <div
              key={cell.key}
              role="columnheader"
              data-testid={testId}
              className="list-header-hcell"
            >
              {cell.label}
            </div>
          );
        }
        const isActive = sortBy === cell.sortKey;
        const Icon = isActive && sortDir === 'desc' ? ChevronDown : ChevronUp;
        const className = isActive
          ? 'list-header-hcell is-sortable is-active sort-active'
          : 'list-header-hcell is-sortable';
        const iconClassName = isActive ? 'list-header-icon is-active' : 'list-header-icon';
        return (
          <button
            key={cell.key}
            type="button"
            role="columnheader"
            data-testid={testId}
            className={className}
            aria-sort={isActive ? ARIA_SORT[sortDir] : 'none'}
            aria-label={`정렬: ${cell.label}`}
            onClick={() => onSort(cell.sortKey as VocSortColumn)}
          >
            {cell.label}
            <Icon key={sortDir} aria-hidden="true" className={iconClassName} />
          </button>
        );
      })}
    </div>
  );
}
