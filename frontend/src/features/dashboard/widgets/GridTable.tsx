/**
 * GridTable — shared intensity-shaded grid for heatmap, assignee-stats, and matrix widgets.
 * Spec: dashboard.md §3/§4/§8 — intensity formula below.
 * Cell bg uses the spec-literal oklch formula; isolated to cellOpacity + inline style.
 */
import { cn } from '@shared/lib/cn';

export interface GridTableRow {
  id: string | null;
  name: string;
  values: number[];
  total: number;
  isHighlighted?: boolean;
  isClickable?: boolean;
  isSummary?: boolean;
  isUnassigned?: boolean;
}

export interface GridTableProps {
  headers: string[];
  rows: GridTableRow[];
  maxValue: number;
  totalRow?: number[] | null;
  onCellClick?: (rowId: string | null, colIndex: number) => void;
  onRowClick?: (rowId: string | null) => void;
}

/**
 * Compute cell background intensity.
 * Spec (dashboard.md §3/§4/§8): opacity ∈ [0.06, 0.62], applied via oklch inline style.
 */ // allow-raw-color: spec-literal oklch formula per dashboard.md §3/§4/§8
export function cellOpacity(value: number, maxValue: number): number {
  if (maxValue === 0 || value === 0) return 0;
  const ratio = value / maxValue;
  return 0.06 + ratio * (0.62 - 0.06);
}

export function GridTable({ headers, rows, maxValue, totalRow, onCellClick, onRowClick }: GridTableProps) {
  return (
    <div className="w-full overflow-x-auto" role="table" aria-label="데이터 그리드">
      {/* Header */}
      <div role="rowgroup">
        <div
          role="row"
          className="flex border-b border-[var(--border-subtle)] text-[11px] font-semibold uppercase tracking-wide text-[var(--text-quaternary)]"
        >
          <div role="columnheader" className="min-w-[120px] flex-1 py-2 pr-3">
            항목
          </div>
          {headers.map((h, i) => (
            <div
              key={i}
              role="columnheader"
              className="w-20 shrink-0 py-2 text-center"
            >
              {h}
            </div>
          ))}
          <div role="columnheader" className="w-16 shrink-0 py-2 text-center">
            합계
          </div>
        </div>
      </div>

      {/* Total row */}
      {totalRow && (
        <div role="rowgroup">
          <div
            role="row"
            className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)]"
          >
            <div role="rowheader" className="min-w-[120px] flex-1 py-2 pr-3">
              전체
            </div>
            {totalRow.slice(0, headers.length).map((v, i) => (
              <div key={i} role="cell" className="w-20 shrink-0 py-2 text-center tabular-nums">
                {v}
              </div>
            ))}
            <div role="cell" className="w-16 shrink-0 py-2 text-center tabular-nums font-semibold">
              {totalRow[headers.length] ?? totalRow.reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </div>
      )}

      {/* Data rows */}
      <div role="rowgroup">
        {rows.map((row) => {
          const nameClass = cn(
            'min-w-[120px] flex-1 py-2 pr-3 text-xs truncate',
            row.isUnassigned
              ? 'italic text-[var(--text-quaternary)]'
              : row.isSummary
              ? 'font-semibold text-[var(--text-secondary)]'
              : 'text-[var(--text-primary)]',
          );
          return (
            <div
              key={row.id ?? 'unassigned'}
              role="row"
              className={cn(
                'flex border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]',
                row.isClickable && 'cursor-pointer',
              )}
              onClick={row.isClickable && onRowClick ? () => onRowClick(row.id) : undefined}
            >
              <div role="rowheader" className={nameClass}>
                {row.name}
              </div>
              {row.values.map((v, i) => {
                const opacity = row.isSummary ? 0 : cellOpacity(v, maxValue);
                const canClick = !row.isSummary && v > 0 && onCellClick;
                return (
                  <div
                    key={i}
                    role="cell"
                    className={cn(
                      'w-20 shrink-0 py-2 text-center text-xs tabular-nums',
                      canClick && 'cursor-pointer',
                      v === 0 ? 'text-[var(--text-quaternary)]' : 'text-[var(--text-primary)]',
                    )}
                    style={{
                      backgroundColor: opacity > 0
                        ? `oklch(63% 0.19 258 / ${opacity.toFixed(3)})` // allow-raw-color: spec-literal intensity formula per dashboard.md §3/§4/§8
                        : undefined,
                    }}
                    onClick={
                      canClick
                        ? (e) => {
                            e.stopPropagation();
                            onCellClick!(row.id, i);
                          }
                        : undefined
                    }
                  >
                    {v}
                  </div>
                );
              })}
              <div
                role="cell"
                className="w-16 shrink-0 py-2 text-center text-xs tabular-nums font-semibold text-[var(--text-secondary)]"
              >
                {row.total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
