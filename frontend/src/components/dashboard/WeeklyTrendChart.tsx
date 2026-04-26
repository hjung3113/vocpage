import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  Formatter,
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import { getWeeklyTrend } from '../../api/dashboard';
import type { DashboardQueryParams } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import './WeeklyTrendChart.css';

export interface WeeklyTrendChartProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

export function WeeklyTrendChart({ filter, buildQueryParams }: WeeklyTrendChartProps) {
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data } = useQuery({
    queryKey: ['dashboard-weekly-trend', params],
    queryFn: () => getWeeklyTrend({ systemId: params.systemId, menuId: params.menuId, weeks: 12 }),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = (data?.weeks ?? []).map((week, i) => ({
    week,
    new: data?.series.new[i] ?? 0,
    inProgress: data?.series.inProgress[i] ?? 0,
    done: data?.series.done[i] ?? 0,
  }));

  const tooltipFormatter: Formatter<ValueType, NameType> = (value, name) => {
    const labels: Record<string, string> = { new: '신규', inProgress: '진행중', done: '완료' };
    return [value, labels[String(name ?? '')] ?? String(name ?? '')];
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">주간 트렌드 (최근 12주)</span>
        <DimSelector
          options={[
            { label: '전체', value: 'all' },
            { label: '시스템별', value: 'system' },
            { label: '메뉴별', value: 'menu' },
          ]}
          value={dim}
          onChange={(v) => setDim(v as 'all' | 'system' | 'menu')}
          hiddenValues={filter.globalTab !== 'all' ? ['system'] : []}
        />
      </div>

      <div className="chart-legend">
        <div className="cleg-item">
          <span className="cleg-line" style={{ background: 'var(--chart-blue)' }} />
          <span>신규</span>
        </div>
        <div className="cleg-item">
          <span className="cleg-line" style={{ background: 'var(--chart-sky)' }} />
          <span>진행중</span>
        </div>
        <div className="cleg-item">
          <span className="cleg-line" style={{ background: 'var(--chart-emerald)' }} />
          <span>완료</span>
        </div>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" strokeWidth={0.5} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={tooltipFormatter}
            />
            <Line
              dataKey="new"
              stroke="var(--chart-blue)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              dataKey="inProgress"
              stroke="var(--chart-sky)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              dataKey="done"
              stroke="var(--chart-emerald)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
