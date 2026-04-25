import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardFilter } from '../hooks/useDashboardFilter';
import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchAssignees } from '../api/dashboard';
import { KpiCard } from '../components/dashboard/KpiCard';
import { DistributionSection } from '../components/dashboard/DistributionSection';
import { PriorityStatusMatrix } from '../components/dashboard/PriorityStatusMatrix';
import { DrilldownHeatmap } from '../components/dashboard/DrilldownHeatmap';
import { WeeklyTrendChart } from '../components/dashboard/WeeklyTrendChart';
import { TagDistributionChart } from '../components/dashboard/TagDistributionChart';
import { SystemMenuCards } from '../components/dashboard/SystemMenuCards';
import { AssigneeTable } from '../components/dashboard/AssigneeTable';
import { AgingVocList } from '../components/dashboard/AgingVocList';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
});

function DashboardInner() {
  const { filterState, setAssigneeId, setDateRange, apiFilters } = useDashboardFilter();

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary', apiFilters],
    queryFn: () => fetchSummary(apiFilters),
  });

  const { data: assignees } = useQuery({
    queryKey: ['dashboard', 'assignees'],
    queryFn: fetchAssignees,
  });

  const DATE_RANGES: { key: '7d' | '30d' | '90d'; label: string }[] = [
    { key: '7d', label: '7일' },
    { key: '30d', label: '30일' },
    { key: '90d', label: '90일' },
  ];

  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--bg-app)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Global filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>기간</span>
        {DATE_RANGES.map((dr) => (
          <button
            key={dr.key}
            onClick={() => setDateRange(dr.key)}
            style={{
              padding: '5px 14px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: filterState.dateRange === dr.key ? 'var(--brand)' : 'transparent',
              color:
                filterState.dateRange === dr.key ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {dr.label}
          </button>
        ))}

        <select
          value={filterState.assigneeId ?? ''}
          onChange={(e) => setAssigneeId(e.target.value || null)}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <option value="">담당자 전체</option>
          {(assignees ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* KPI row — 4+4 layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <KpiCard label="전체 VOC" value={summary?.total ?? '—'} />
          <KpiCard label="미해결" value={summary?.unresolved ?? '—'} />
          <KpiCard label="완료" value={summary?.completed ?? '—'} />
          <KpiCard label="처리중" value={summary?.in_progress ?? '—'} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <KpiCard label="긴급" value={summary?.urgent ?? '—'} />
          <KpiCard label="기한초과" value={summary?.overdue ?? '—'} />
          <KpiCard
            label="평균처리일"
            value={
              summary?.avg_resolution_days != null ? Math.round(summary.avg_resolution_days) : '—'
            }
            unit="일"
          />
          <KpiCard label="이번주 신규" value={summary?.new_this_week ?? '—'} />
        </div>
      </div>

      {/* Distribution + Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <DistributionSection apiFilters={apiFilters} />
        <PriorityStatusMatrix apiFilters={apiFilters} />
      </div>

      {/* Drilldown heatmap */}
      <DrilldownHeatmap apiFilters={apiFilters} />

      {/* Weekly trend + Tag distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <WeeklyTrendChart apiFilters={apiFilters} />
        <TagDistributionChart apiFilters={apiFilters} />
      </div>

      {/* System cards */}
      <SystemMenuCards apiFilters={apiFilters} />

      {/* Assignee table */}
      <AssigneeTable apiFilters={apiFilters} />

      {/* Aging */}
      <AgingVocList apiFilters={apiFilters} />
    </div>
  );
}

export function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardInner />
    </QueryClientProvider>
  );
}
