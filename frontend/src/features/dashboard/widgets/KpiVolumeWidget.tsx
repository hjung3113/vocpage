/**
 * KpiVolumeWidget — Wave 2 Phase B (dashboard.md §1 VOLUME 줄).
 * 4 cards: 총 VOC / 미해결 / 이번주 신규 / 이번주 완료.
 */
import { Skeleton } from '@shared/ui/skeleton';
import { useDashboardSummary } from '../model/useDashboardSummary';
import { KpiCard } from './KpiCard';

export function KpiVolumeWidget() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <div
      data-testid="widget-kpi-volume"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-3 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
        VOLUME
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4"
          data-testid="kpi-volume-loading"
        >
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
          <KpiCard label="총 VOC" metric={data.kpi_volume.total_voc} />
          <KpiCard label="미해결" metric={data.kpi_volume.unresolved} />
          <KpiCard label="이번주 신규" metric={data.kpi_volume.this_week_new} />
          <KpiCard label="이번주 완료" metric={data.kpi_volume.this_week_completed} />
        </div>
      )}
    </div>
  );
}
