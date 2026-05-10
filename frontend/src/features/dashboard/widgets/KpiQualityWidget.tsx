/**
 * KpiQualityWidget — Wave 2 Phase B (dashboard.md §1 QUALITY 줄).
 * 4 cards: 평균 처리시간 / 해결율 / Urgent·High 미해결 / 14일+ 미처리.
 *
 * - 평균 처리시간: 감소가 긍정 → KpiCard inverted=true.
 * - Urgent·High 미해결: 비-제로일 때 §1 red 강조 보더.
 * - 14일+ 미처리: 비-제로일 때 §1 amber 강조 보더.
 */
import { Skeleton } from '@shared/ui/skeleton';
import { useDashboardSummary } from '../model/useDashboardSummary';
import { KpiCard } from './KpiCard';

export function KpiQualityWidget() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <div
      data-testid="widget-kpi-quality"
      className="flex h-full flex-col gap-3 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
        QUALITY
      </div>

      {isLoading && (
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4" data-testid="kpi-quality-loading">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
          <span>KPI 데이터를 불러오지 못했습니다</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs hover:bg-[var(--bg-elevated)]"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && (
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="평균 처리시간"
            metric={data.kpi_quality.avg_resolution_days}
            inverted
          />
          <KpiCard label="해결율" metric={data.kpi_quality.resolution_rate} />
          <KpiCard
            label="Urgent·High 미해결"
            metric={data.kpi_quality.urgent_high_unresolved}
            accent="urgent"
          />
          <KpiCard label="14일+ 미처리" metric={data.kpi_quality.overdue_14d} accent="overdue" />
        </div>
      )}
    </div>
  );
}
