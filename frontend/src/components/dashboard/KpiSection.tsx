import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { buildNav } from '../../utils/dashboardNav';
import './KpiSection.css';

export interface KpiSectionProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function today(): string {
  return toISODate(new Date());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

function getThisWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

interface DeltaResult {
  sign: '▲' | '▼' | '';
  diff: number;
  cls: string;
}

function calcDelta(current: number, prev: number, invertGood = false): DeltaResult {
  if (current === prev) return { sign: '', diff: 0, cls: '' };
  const diff = current - prev;
  const isIncrease = diff > 0;
  // Default: lower is better (counts like unresolved). ▲ = bad = delta-neg.
  // invertGood = true: higher is better (resolvedRate). ▲ = good = delta-pos.
  const isGood = invertGood ? isIncrease : !isIncrease;
  return {
    sign: isIncrease ? '▲' : '▼',
    diff: Math.abs(diff),
    cls: isGood ? 'delta-pos' : 'delta-neg',
  };
}

interface KpiCardProps {
  label: string;
  value: number | undefined;
  unit?: string;
  valueColor?: string;
  cardClass?: string;
  delta: DeltaResult | null;
  deltaUnit?: string;
  onClick: () => void;
}

function KpiCard({
  label,
  value,
  unit,
  valueColor,
  cardClass,
  delta,
  deltaUnit = '건',
  onClick,
}: KpiCardProps) {
  const displayValue = value === undefined ? '--' : value;
  return (
    <div className={`kpi-card${cardClass ? ` ${cardClass}` : ''}`} onClick={onClick}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={valueColor ? { color: valueColor } : undefined}>
        {displayValue}
        {unit && value !== undefined && <span className="kpi-unit"> {unit}</span>}
      </div>
      {delta && delta.sign !== '' && (
        <div className={`kpi-delta ${delta.cls}`}>
          {delta.sign} {delta.diff}
          {deltaUnit} 전주比
        </div>
      )}
      {(!delta || delta.sign === '') && (
        <div className="kpi-delta" style={{ visibility: 'hidden' }}>
          -
        </div>
      )}
    </div>
  );
}

export function KpiSection({ filter, buildQueryParams }: KpiSectionProps) {
  const navigate = useNavigate();

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: () => getDashboardSummary(params),
    staleTime: 5 * 60 * 1000,
  });

  const thisMonday = getThisWeekMonday();
  const todayStr = today();

  // Volume deltas
  const totalDelta = data ? calcDelta(data.total, data.prevWeek.total) : null;
  const unresolvedDelta = data ? calcDelta(data.unresolved, data.prevWeek.unresolved) : null;
  const newThisWeekDelta = data ? calcDelta(data.newThisWeek, data.prevWeek.newThisWeek) : null;
  const doneThisWeekDelta = data
    ? calcDelta(data.doneThisWeek, data.prevWeek.doneThisWeek, true)
    : null;

  // Quality deltas
  const avgProcessingDelta = data
    ? calcDelta(data.avgProcessingDays, data.prevWeek.avgProcessingDays)
    : null;
  const resolvedRateDelta = data
    ? calcDelta(data.resolvedRate, data.prevWeek.resolvedRate, true)
    : null;
  const urgentHighDelta = data
    ? calcDelta(data.urgentHighUnresolved, data.prevWeek.urgentHighUnresolved)
    : null;
  const over14Delta = data ? calcDelta(data.over14Days, data.prevWeek.over14Days) : null;

  return (
    <div className="kpi-section">
      <div className="kpi-section-label">Volume</div>
      <div className="kpi-grid">
        <KpiCard
          label="총 VOC"
          value={data?.total}
          delta={totalDelta}
          onClick={() =>
            navigate(
              buildNav(params, {
                startDate: filter.dateRange.startDate,
                endDate: filter.dateRange.endDate,
              }),
            )
          }
        />
        <KpiCard
          label="미해결"
          value={data?.unresolved}
          delta={unresolvedDelta}
          onClick={() => navigate(buildNav(params, { status: '접수,검토중,처리중' }))}
        />
        <KpiCard
          label="이번주 신규"
          value={data?.newThisWeek}
          delta={newThisWeekDelta}
          onClick={() => navigate(buildNav(params, { startDate: thisMonday, endDate: todayStr }))}
        />
        <KpiCard
          label="이번주 완료"
          value={data?.doneThisWeek}
          delta={doneThisWeekDelta}
          onClick={() =>
            navigate(buildNav(params, { startDate: thisMonday, endDate: todayStr, status: '완료' }))
          }
        />
      </div>

      <div className="kpi-section-label">Quality</div>
      <div className="kpi-grid">
        <KpiCard
          label="평균 처리시간"
          value={data?.avgProcessingDays}
          unit="일"
          delta={avgProcessingDelta}
          deltaUnit="일"
          onClick={() =>
            navigate(
              buildNav(params, {
                startDate: filter.dateRange.startDate,
                endDate: filter.dateRange.endDate,
                status: '완료',
              }),
            )
          }
        />
        <KpiCard
          label="해결율"
          value={data?.resolvedRate}
          unit="%"
          delta={resolvedRateDelta}
          deltaUnit="%"
          onClick={() =>
            navigate(
              buildNav(params, {
                startDate: filter.dateRange.startDate,
                endDate: filter.dateRange.endDate,
              }),
            )
          }
        />
        <KpiCard
          label="Urgent·High 미해결"
          value={data?.urgentHighUnresolved}
          valueColor="var(--status-red)"
          cardClass="alert-red"
          delta={urgentHighDelta}
          onClick={() =>
            navigate(buildNav(params, { priority: 'urgent,high', status: '접수,검토중,처리중' }))
          }
        />
        <KpiCard
          label="14일+ 미처리"
          value={data?.over14Days}
          valueColor="var(--status-amber)"
          cardClass="alert-amber"
          delta={over14Delta}
          onClick={() =>
            navigate(buildNav(params, { status: '접수,검토중,처리중', createdBefore: daysAgo(14) }))
          }
        />
      </div>
    </div>
  );
}
