import { Fragment, useMemo } from 'react';
import { VocListHeader } from './VocListHeader';
import { VocRow, type VocTypeMapEntry } from './VocRow';
import { VocStatusGroupHeader } from './VocStatusGroupHeader';
import type { VocListResponse, VocSortColumn, SortDir, VocStatus } from '@contracts/voc';

// Phase 5: Linear-style status grouping. Order matches VocStatus enum.
const STATUS_ORDER: VocStatus[] = ['접수', '검토중', '처리중', '드랍', '완료'];

interface VocTableProps {
  rows: VocListResponse['rows'];
  sortBy: VocSortColumn;
  sortDir: SortDir;
  onSort: (key: VocSortColumn) => void;
  onRowClick: (id: string) => void;
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, VocTypeMapEntry>;
  selectedId?: string | null;
  /**
   * Phase 5: when true, rows are rendered under collapsible status groups.
   * `collapsedStatuses` + `onToggleStatus` drive the per-group fold state
   * (lifted to a parent that persists to localStorage).
   */
  groupByStatus?: boolean;
  collapsedStatuses?: ReadonlySet<VocStatus>;
  onToggleStatus?: (status: VocStatus) => void;
}

export function VocTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  assigneeMap,
  vocTypeMap,
  selectedId,
  groupByStatus = false,
  collapsedStatuses,
  onToggleStatus,
}: VocTableProps) {
  const groups = useMemo(() => {
    if (!groupByStatus) return null;
    const buckets: Record<VocStatus, VocListResponse['rows']> = {
      접수: [],
      검토중: [],
      처리중: [],
      드랍: [],
      완료: [],
    };
    for (const r of rows) buckets[r.status].push(r);
    return STATUS_ORDER.filter((s) => buckets[s].length > 0).map((s) => ({
      status: s,
      rows: buckets[s],
    }));
  }, [rows, groupByStatus]);

  return (
    <div data-pcomp="voc-table" data-testid="voc-table" className="voc-table-wrapper">
      <div role="grid" aria-label="VOC 목록" className="voc-table-grid">
        <VocListHeader sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        {!groups &&
          rows.length > 0 &&
          rows.map((row) => (
            <VocRow
              key={row.id}
              row={row}
              assigneeMap={assigneeMap}
              vocTypeMap={vocTypeMap}
              selected={row.id === selectedId}
              onClick={() => onRowClick(row.id)}
            />
          ))}
        {groups &&
          groups.map(({ status, rows: groupRows }) => {
            const collapsed = collapsedStatuses?.has(status) ?? false;
            return (
              <Fragment key={status}>
                <VocStatusGroupHeader
                  status={status}
                  count={groupRows.length}
                  collapsed={collapsed}
                  onToggle={() => onToggleStatus?.(status)}
                />
                {!collapsed &&
                  groupRows.map((row) => (
                    <VocRow
                      key={row.id}
                      row={row}
                      assigneeMap={assigneeMap}
                      vocTypeMap={vocTypeMap}
                      selected={row.id === selectedId}
                      onClick={() => onRowClick(row.id)}
                    />
                  ))}
              </Fragment>
            );
          })}
      </div>
      {rows.length === 0 && (
        <div className="voc-table-empty" data-testid="voc-table-empty">
          데이터가 없습니다
        </div>
      )}
    </div>
  );
}

export default VocTable;
