/**
 * WeeklyTrendWidget — Wave 2 Phase C (dashboard.md §5 주간 트렌드 v3).
 * 3-line recharts LineChart: 신규 / 진입(검토중+처리중) / 완료.
 * 12-week fixed window — ignores global date range.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@shared/ui/skeleton';
import { useWeeklyTrend } from '../model/useWeeklyTrend';

export function WeeklyTrendWidget() {
  const { data, isLoading, isError, refetch } = useWeeklyTrend();

  const chartData = data?.weeks.map((week, i) => ({
    week,
    신규: data.series.new[i],
    처리진입: data.series.enteredInProgress[i],
    완료: data.series.done[i],
  })) ?? [];

  return (
    <div
      data-testid="widget-weekly-trend"
      aria-busy={isLoading}
      className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)] p-4"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-quaternary)]">
        주간 트렌드 (최근 12주)
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex-1" data-testid="trend-loading">
          <Skeleton className="h-full" />
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

      {data && chartData.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-quaternary)]">
          데이터 없음
        </div>
      )}

      {data && chartData.length > 0 && (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--text-quaternary)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-quaternary)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>
                )}
              />
              <Line type="monotone" dataKey="신규" stroke="var(--chart-blue)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="처리진입" stroke="var(--chart-amber)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="완료" stroke="var(--chart-emerald)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
