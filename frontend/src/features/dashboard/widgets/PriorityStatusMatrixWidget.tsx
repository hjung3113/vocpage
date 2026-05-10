/**
 * PriorityStatusMatrixWidget — Wave 2 Phase C (dashboard.md §3).
 * 4×5 colored grid: priority rows × status cols.
 * Reuses GridTable for intensity-shaded rendering.
 * P0-2: Cell click → /voc?priority=<P>&status=<S>&...globalFilter. Empty cells not clickable.
 */
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@shared/ui/skeleton';
import type { MatrixPriority } from '@contracts/dashboard';
import { usePriorityStatusMatrix } from '../model/usePriorityStatusMatrix';
import { useDashboardFilter } from '../model/dashboardFilter';
import { GridTable, type GridTableRow } from './GridTable';
import { buildVocUrl } from './buildVocUrl';

const PRIORITY_LABELS: Record<MatrixPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

// Reverse map for label→priority key (used for navigation)
const LABEL_TO_PRIORITY: Record<string, MatrixPriority> = {
  긴급: 'urgent',
  높음: 'high',
  보통: 'medium',
  낮음: 'low',
};

export function PriorityStatusMatrixWidget() {
  const navigate = useNavigate();
  const { filter } = useDashboardFilter();
  const { data, isLoading, isError, refetch } = usePriorityStatusMatrix();

  const rows: GridTableRow[] = data?.rows.map((r) => ({
    id: r.priority,
    name: PRIORITY_LABELS[r.priority],
    values: data.columns.map((col) => r.cells[col] ?? 0),
    total: r.row_total,
    isClickable: true,
  })) ?? [];

  function handleCellClick(rowId: string | null, colIndex: number) {
    if (!rowId || !data) return;
    const status = data.columns[colIndex];
    if (!status) return;
    // Count check — only clickable if cell has value (GridTable enforces v > 0 guard)
    const priorityKey = LABEL_TO_PRIORITY[rowId] ?? rowId;
    navigate(buildVocUrl({ priority: priorityKey, status }, filter));
  }

  return (
    <div
      data-testid="widget-priority-status-matrix"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
        우선순위 × 상태
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="matrix-loading">
          <Skeleton className="h-8" />
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
          <span>데이터를 불러오지 못했습니다</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs hover:bg-[var(--bg-elevated)]"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && rows.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-quaternary)]">
          데이터 없음
        </div>
      )}

      {data && rows.length > 0 && (
        <div className="flex-1 min-h-0 overflow-auto">
          <GridTable
            headers={data.columns}
            rows={rows}
            maxValue={data.max_value}
            onCellClick={handleCellClick}
          />
        </div>
      )}
    </div>
  );
}
