import type { ReactNode } from 'react';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
}

function ariaSortFor(
  active: boolean,
  dir?: 'asc' | 'desc',
): 'ascending' | 'descending' | 'none' | undefined {
  if (!active) return undefined;
  return dir === 'desc' ? 'descending' : 'ascending';
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyState,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <table
      data-pcomp="data-table"
      className="w-full border-collapse text-sm text-[color:var(--text-primary)]"
    >
      <thead>
        <tr className="border-b border-[color:var(--border-standard)]">
          {columns.map((col) => {
            const active = sortKey === col.key;
            const sortable = col.sortable && onSort;
            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={ariaSortFor(active, sortDir)}
                onClick={sortable ? () => onSort!(col.key) : undefined}
                className={cn(
                  'px-3 py-2 text-left font-medium text-[color:var(--text-secondary)]',
                  sortable && 'cursor-pointer select-none',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sortable &&
                    (active ? (
                      sortDir === 'desc' ? (
                        <ChevronDown size={12} aria-hidden />
                      ) : (
                        <ChevronUp size={12} aria-hidden />
                      )
                    ) : (
                      <ChevronsUpDown size={12} aria-hidden className="opacity-50" />
                    ))}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'border-b border-[color:var(--border-standard)]',
              onRowClick && 'cursor-pointer hover:bg-[color:var(--bg-panel)]',
            )}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={cn('px-3 py-2 text-[color:var(--text-primary)]', col.cellClassName)}
              >
                {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
