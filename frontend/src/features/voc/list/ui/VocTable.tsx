import { Fragment, useEffect, useMemo, useState } from 'react';
import { VocListHeader } from './VocListHeader';
import { VocRow, type VocTypeMapEntry } from './VocRow';
import { VocStatusGroupHeader } from './VocStatusGroupHeader';
import type { VocListResponse, VocSortColumn, SortDir, VocStatus } from '@contracts/voc';

// Phase 5: Linear-style status grouping. Order matches VocStatus enum.
const STATUS_ORDER: VocStatus[] = ['접수', '검토중', '처리중', '드랍', '완료'];

type Row = VocListResponse['rows'][number];

interface VocTableProps {
  rows: Row[];
  sortBy: VocSortColumn;
  sortDir: SortDir;
  onSort: (key: VocSortColumn) => void;
  onRowClick: (id: string) => void;
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, VocTypeMapEntry>;
  selectedId?: string | null;
  groupByStatus?: boolean;
  collapsedStatuses?: ReadonlySet<VocStatus>;
  onToggleStatus?: (status: VocStatus) => void;
}

/**
 * Spec §9.2.2: top-level rows host an inline expand toggle. Children render
 * directly below their parent and are excluded from top-level enumeration so
 * they never appear twice. Default collapsed; not persisted across reloads.
 */
function partition(rows: Row[]) {
  const childrenByParent = new Map<string, Row[]>();
  const topLevel: Row[] = [];
  for (const r of rows) {
    if (r.parent_id) {
      const list = childrenByParent.get(r.parent_id) ?? [];
      list.push(r);
      childrenByParent.set(r.parent_id, list);
    } else {
      topLevel.push(r);
    }
  }
  return { topLevel, childrenByParent };
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
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const { topLevel, childrenByParent } = useMemo(() => partition(rows), [rows]);

  // Auto-collapse: if a parent reports has_children but no children are in the
  // current page, drop it from `expanded` after one render. Spec §9.2.2 마지막
  // 불릿("자식 0건이면 ... 자동 접힘 처리")의 page-cross 케이스 대응.
  useEffect(() => {
    if (expanded.size === 0) return;
    let dirty = false;
    const next = new Set(expanded);
    for (const id of expanded) {
      const kids = childrenByParent.get(id);
      if (!kids || kids.length === 0) {
        next.delete(id);
        dirty = true;
      }
    }
    if (dirty) setExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenByParent]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderParent = (row: Row) => {
    const kids = childrenByParent.get(row.id) ?? [];
    const hasChildren = row.has_children || kids.length > 0;
    const isExpanded = expanded.has(row.id);
    return (
      <Fragment key={row.id}>
        <VocRow
          row={row}
          assigneeMap={assigneeMap}
          vocTypeMap={vocTypeMap}
          selected={row.id === selectedId}
          onClick={() => onRowClick(row.id)}
          hasChildren={hasChildren}
          expanded={isExpanded}
          onToggleExpand={hasChildren ? () => toggleExpand(row.id) : undefined}
        />
        {isExpanded &&
          kids.map((child) => (
            <VocRow
              key={child.id}
              row={child}
              assigneeMap={assigneeMap}
              vocTypeMap={vocTypeMap}
              selected={child.id === selectedId}
              onClick={() => onRowClick(child.id)}
              indented
            />
          ))}
      </Fragment>
    );
  };

  const groups = useMemo(() => {
    if (!groupByStatus) return null;
    const buckets: Record<VocStatus, Row[]> = {
      접수: [],
      검토중: [],
      처리중: [],
      드랍: [],
      완료: [],
    };
    for (const r of topLevel) buckets[r.status].push(r);
    return STATUS_ORDER.filter((s) => buckets[s].length > 0).map((s) => ({
      status: s,
      rows: buckets[s],
    }));
  }, [topLevel, groupByStatus]);

  return (
    <div data-testid="voc-table" className="voc-table-wrapper">
      <div role="grid" aria-label="VOC 목록" className="voc-table-grid">
        <VocListHeader sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        {!groups && topLevel.length > 0 && topLevel.map((row) => renderParent(row))}
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
                {!collapsed && groupRows.map((row) => renderParent(row))}
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
