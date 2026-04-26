import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type {
  Formatter,
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import { getTagDistribution } from '../../api/dashboard';
import type { DashboardQueryParams, TagDistItem } from '../../api/dashboard';
import type { DashboardFilterState } from '../../hooks/useDashboardFilter';
import { DimSelector } from './DimSelector';
import { buildNav } from '../../utils/dashboardNav';
import './TagDistributionChart.css';

export interface TagDistributionChartProps {
  filter: DashboardFilterState;
  buildQueryParams: () => DashboardQueryParams;
}

export function TagDistributionChart({ filter, buildQueryParams }: TagDistributionChartProps) {
  const navigate = useNavigate();
  const [dim, setDim] = useState<'all' | 'system' | 'menu'>('all');

  const params = useMemo(() => buildQueryParams(), [buildQueryParams]);

  const { data = [] } = useQuery({
    queryKey: ['dashboard-tag-dist', params],
    queryFn: () => getTagDistribution({ ...params, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const tooltipFormatter: Formatter<ValueType, NameType> = (value) => [
    String(value) + '건',
    '건수',
  ];

  return (
    <div className="widget">
      <div className="widget-header">
        <span className="widget-title">태그별 분포 (Top 10)</span>
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

      <div style={{ height: Math.max(data.length * 22, 80) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={tooltipFormatter}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-blue)"
              radius={3}
              cursor="pointer"
              onClick={(d) =>
                navigate(buildNav(params, { tag: (d as unknown as TagDistItem).name }))
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
