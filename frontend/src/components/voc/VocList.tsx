import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { listSubtasks, type VocSummary } from '../../api/vocs';
import { VocRow } from './VocRow';
import { Pagination } from '../common/Pagination';

interface VocListProps {
  vocs: VocSummary[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onVocClick: (id: string) => void;
  isLoading?: boolean;
  sortColumn?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (col: string) => void;
}

interface HeaderDef {
  label: string;
  sortKey?: string;
  width?: string;
}

const HEADERS: HeaderDef[] = [
  { label: '이슈 ID', width: '180px' },
  { label: '제목', sortKey: 'title' },
  { label: '상태', sortKey: 'status', width: '76px' },
  { label: '담당자', width: '96px' },
  { label: '우선순위', sortKey: 'priority', width: '80px' },
  { label: '등록일', sortKey: 'created_at', width: '96px' },
];

type VocListItem = VocSummary & {
  subtasks?: VocSummary[];
  children?: VocSummary[];
  child_vocs?: VocSummary[];
};

interface VocGroup {
  parent: VocListItem;
  children: VocListItem[];
}

function getInlineChildren(voc: VocListItem): VocListItem[] {
  return [voc.subtasks, voc.children, voc.child_vocs].find((items) => Array.isArray(items)) ?? [];
}

function buildGroups(vocs: VocSummary[]): VocGroup[] {
  const items = vocs as VocListItem[];
  const byId = new Map(items.map((voc) => [voc.id, voc]));
  const childrenByParent = new Map<string, VocListItem[]>();
  const nestedChildIds = new Set<string>();

  items.forEach((voc) => {
    getInlineChildren(voc).forEach((child) => {
      nestedChildIds.add(child.id);
      const parentChildren = childrenByParent.get(voc.id) ?? [];
      parentChildren.push(child);
      childrenByParent.set(voc.id, parentChildren);
    });

    if (voc.parent_id && byId.has(voc.parent_id)) {
      const parentChildren = childrenByParent.get(voc.parent_id) ?? [];
      parentChildren.push(voc);
      childrenByParent.set(voc.parent_id, parentChildren);
    }
  });

  return items
    .filter((voc) => !nestedChildIds.has(voc.id) && !(voc.parent_id && byId.has(voc.parent_id)))
    .map((parent) => {
      const seen = new Set<string>();
      const children = (childrenByParent.get(parent.id) ?? []).filter((child) => {
        if (seen.has(child.id)) return false;
        seen.add(child.id);
        return true;
      });
      return { parent, children };
    });
}

export function VocList({
  vocs,
  total,
  page,
  limit,
  onPageChange,
  onVocClick,
  isLoading = false,
  sortColumn = null,
  sortOrder = 'desc',
  onSort,
}: VocListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [childrenByParent, setChildrenByParent] = useState<Record<string, VocSummary[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(() => new Set());
  const groups = useMemo(() => {
    const baseGroups = buildGroups(vocs);
    return baseGroups.map((group) => ({
      ...group,
      children: childrenByParent[group.parent.id] ?? group.children,
    }));
  }, [childrenByParent, vocs]);

  useEffect(() => {
    setExpandedRows(new Set());
    setChildrenByParent({});
    setLoadingChildren(new Set());
  }, [vocs]);

  const toggleExpanded = (voc: VocSummary, currentChildren: VocSummary[]) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(voc.id)) next.delete(voc.id);
      else next.add(voc.id);
      return next;
    });

    if (currentChildren.length > 0 || childrenByParent[voc.id] || (voc.subtask_count ?? 0) === 0) {
      return;
    }

    setLoadingChildren((current) => new Set(current).add(voc.id));
    listSubtasks(voc.id)
      .then((children) => {
        setChildrenByParent((current) => ({ ...current, [voc.id]: children }));
      })
      .catch(() => {
        setChildrenByParent((current) => ({ ...current, [voc.id]: [] }));
      })
      .finally(() => {
        setLoadingChildren((current) => {
          const next = new Set(current);
          next.delete(voc.id);
          return next;
        });
      });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            {HEADERS.map(({ label, width }) => (
              <col key={label} style={width ? { width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {HEADERS.map(({ label, sortKey }) => {
                const isSortable = Boolean(sortKey && onSort);
                const isActive = sortKey === sortColumn;
                return (
                  <th
                    key={label}
                    className="px-4 py-2 text-left text-xs font-medium"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      background: 'var(--bg-panel)',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={isSortable ? () => onSort!(sortKey!) : undefined}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      {label}
                      {isSortable &&
                        (isActive ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} style={{ opacity: 0.35 }} />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  불러오는 중...
                </td>
              </tr>
            ) : vocs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  VOC가 없습니다
                </td>
              </tr>
            ) : (
              groups.map(({ parent, children }) => {
                const isExpanded = expandedRows.has(parent.id);
                const hasChildren = children.length > 0 || (parent.subtask_count ?? 0) > 0;
                return (
                  <Fragment key={parent.id}>
                    <VocRow
                      voc={parent}
                      hasChildren={hasChildren}
                      isExpanded={isExpanded}
                      isLoadingChildren={loadingChildren.has(parent.id)}
                      onToggleExpand={() => toggleExpanded(parent, children)}
                      onClick={() => onVocClick(parent.id)}
                    />
                    {isExpanded &&
                      children.map((child) => (
                        <VocRow
                          key={child.id}
                          voc={child}
                          isChild
                          onClick={() => onVocClick(child.id)}
                        />
                      ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} onChange={onPageChange} />
    </div>
  );
}
