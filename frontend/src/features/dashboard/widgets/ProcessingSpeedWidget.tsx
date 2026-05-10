/**
 * ProcessingSpeedWidget — Wave 2 Phase C (dashboard.md §10 처리속도 SLA).
 * Table + SLA rate progress bar per row. Color thresholds: ≥80% green, 60–79% amber, <60% red.
 */
import { Skeleton } from '@shared/ui/skeleton';
import type { ProcessingSpeedDim } from '@contracts/dashboard';
import { useProcessingSpeed } from '../model/useProcessingSpeed';

const DIM_OPTIONS: { id: ProcessingSpeedDim; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'system', label: '시스템' },
  { id: 'menu', label: '메뉴' },
];

function slaColor(rate: number | null): string {
  if (rate === null) return 'var(--text-quaternary)';
  if (rate >= 80) return 'var(--status-green)';
  if (rate >= 60) return 'var(--status-amber)';
  return 'var(--status-red)';
}

function slaBarColor(rate: number | null): string {
  if (rate === null) return 'var(--border-subtle)';
  if (rate >= 80) return 'var(--status-green)';
  if (rate >= 60) return 'var(--status-amber)';
  return 'var(--status-red)';
}

export function ProcessingSpeedWidget() {
  const { data, isLoading, isError, refetch, dim, setDim } = useProcessingSpeed();

  return (
    <div
      data-testid="widget-processing-speed"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
          처리속도 / SLA
        </div>
        <div className="flex gap-1">
          {DIM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDim(opt.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                dim === opt.id
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
        <div role="status" aria-live="polite" className="flex flex-1 flex-col gap-2" data-testid="speed-loading">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10" />)}
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

      {data && data.rows.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-quaternary)]">
          데이터 없음
        </div>
      )}

      {data && data.rows.length > 0 && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-quaternary)]">
                <th className="py-2 text-left font-medium">항목</th>
                <th className="py-2 text-right font-medium">평균처리일</th>
                <th className="py-2 text-right font-medium">완료건</th>
                <th className="py-2 text-center font-medium w-28">SLA 준수율</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row.id ?? 'total'}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                >
                  <td className="py-2 text-[var(--text-primary)] truncate max-w-[120px]">{row.name}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                    {row.avg_days !== null ? `${row.avg_days.toFixed(1)}일` : '—'}
                  </td>
                  <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                    {row.completed_count}
                  </td>
                  <td className="py-2">
                    {row.sla_rate !== null ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between">
                          <span style={{ color: slaColor(row.sla_rate) }} className="font-semibold tabular-nums">
                            {row.sla_rate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--border-subtle)]">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, row.sla_rate)}%`,
                              backgroundColor: slaBarColor(row.sla_rate),
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[var(--text-quaternary)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.rows.some((r) => r.missingDueDateCount > 0) && (
            <p className="mt-2 text-[10px] text-[var(--text-quaternary)]">
              * due_date 미설정 VOC 포함됨
            </p>
          )}
        </div>
      )}
    </div>
  );
}
