import { useQuery } from '@tanstack/react-query';
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
import { fetchWeeklyTrend, type DashboardFilters } from '../../api/dashboard';
import { tokens } from '../../tokens';

interface Props {
  apiFilters: DashboardFilters;
}

export function WeeklyTrendChart({ apiFilters }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'weekly-trend', apiFilters],
    queryFn: () => fetchWeeklyTrend(apiFilters),
  });

  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>로딩 중...</p>;
  if (isError) return <p style={{ color: 'var(--danger)' }}>데이터를 불러오지 못했습니다.</p>;

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
        주간 트렌드
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data?.weeks ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderDefault} />
          <XAxis dataKey="week" tick={{ fill: tokens.textTertiary, fontSize: 11 }} />
          <YAxis tick={{ fill: tokens.textTertiary, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: tokens.bgPanel,
              border: `1px solid ${tokens.borderDefault}`,
              color: tokens.textPrimary,
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: tokens.textSecondary }} />
          <Line
            type="monotone"
            dataKey="new"
            name="신규"
            stroke={tokens.chartBlue}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="in_progress"
            name="진행중"
            stroke={tokens.chartSky}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="완료"
            stroke={tokens.chartEmerald}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
