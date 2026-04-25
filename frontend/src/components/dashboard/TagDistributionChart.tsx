import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchTagDistribution, type DashboardFilters } from '../../api/dashboard';
import { tokens } from '../../tokens';

interface Props {
  apiFilters: DashboardFilters;
}

export function TagDistributionChart({ apiFilters }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'tag-distribution', apiFilters],
    queryFn: () => fetchTagDistribution(apiFilters, 10),
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
        태그 분포 (상위 10)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart layout="vertical" data={data ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.borderDefault} />
          <XAxis type="number" tick={{ fill: tokens.textTertiary, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="tag"
            width={80}
            tick={{ fill: tokens.textSecondary, fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: tokens.bgPanel,
              border: `1px solid ${tokens.borderDefault}`,
              color: tokens.textPrimary,
            }}
          />
          <Bar dataKey="count" name="건수" fill={tokens.brand} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
