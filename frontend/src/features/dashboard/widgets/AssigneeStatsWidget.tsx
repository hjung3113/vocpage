/**
 * AssigneeStatsWidget — Wave 2 Phase C (dashboard.md §8 담당자별 처리 현황 v3).
 * Grid table with intensity shading. xAxis independent from HeatmapWidget.
 */
import { Skeleton } from '@shared/ui/skeleton';
import type { HeatmapXAxis } from '@contracts/dashboard';
import { useAssigneeStats } from '../model/useAssigneeStats';
import { GridTable, type GridTableRow } from './GridTable';

const X_AXIS_OPTIONS: { id: HeatmapXAxis; label: string }[] = [
  { id: 'status', label: '상태' },
  { id: 'priority', label: '우선순위' },
  { id: 'tag', label: '태그' },
];

export function AssigneeStatsWidget() {
  const { data, isLoading, isError, refetch, xAxis, setXAxis } = useAssigneeStats();

  const rows: GridTableRow[] = data?.rows.map((r) => ({
    id: r.id,
    name: r.name,
    values: r.values,
    total: r.total,
    isUnassigned: r.is_unassigned,
    isClickable: !r.is_unassigned,
  })) ?? [];

  return (
    <div
      data-testid="widget-assignee-stats"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
          담당자 현황
        </div>
        <div className="flex gap-1">
          {X_AXIS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setXAxis(opt.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                xAxis === opt.id
                  ? 'bg-[var(--brand)] text-[var(--text-on-brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="assignee-loading">
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
            headers={data.headers}
            rows={rows}
            maxValue={data.max_value}
          />
        </div>
      )}
    </div>
  );
}
