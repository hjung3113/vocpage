import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardFilter } from '../hooks/useDashboardFilter';
import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchAssignees } from '../api/dashboard';
import { listAdminSystems } from '../api/admin';
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
  const { filterState, setAssigneeId, setDateRange, setGlobalTab, apiFilters } =
    useDashboardFilter();

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary', apiFilters],
    queryFn: () => fetchSummary(apiFilters),
  });

  const { data: assignees } = useQuery({
    queryKey: ['dashboard', 'assignees'],
    queryFn: fetchAssignees,
  });

  const { data: systems } = useQuery({
    queryKey: ['admin', 'systems'],
    queryFn: listAdminSystems,
  });

  const DATE_RANGES: { key: '7d' | '30d' | '90d'; label: string }[] = [
    { key: '7d', label: '7일' },
    { key: '30d', label: '30일' },
    { key: '90d', label: '90일' },
  ];

  const resolutionRate =
    summary != null && summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : null;

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
      {/* GlobalTabs — channel tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setGlobalTab('all')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: filterState.globalTab === 'all' ? 'var(--brand)' : 'transparent',
            color:
              filterState.globalTab === 'all' ? 'var(--text-on-brand)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: filterState.globalTab === 'all' ? 600 : 400,
          }}
        >
          전체
        </button>
        {(systems ?? [])
          .filter((s) => !s.is_archived)
          .map((s) => (
            <button
              key={s.id}
              onClick={() => setGlobalTab(s.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: filterState.globalTab === s.id ? 'var(--brand)' : 'transparent',
                color:
                  filterState.globalTab === s.id ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filterState.globalTab === s.id ? 600 : 400,
              }}
            >
              {s.name}
            </button>
          ))}
      </div>

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

      {/* KPI rows — VOLUME (4) + QUALITY (4) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{ color: 'var(--text-muted)', fontSize: '11px', width: '56px', flexShrink: 0 }}
          >
            VOLUME
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <KpiCard label="총 VOC" value={summary?.total ?? '—'} />
            <KpiCard label="미해결" value={summary?.unresolved ?? '—'} />
            <KpiCard label="이번주 신규" value={summary?.new_this_week ?? '—'} />
            <KpiCard label="이번주 완료" value={'—'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{ color: 'var(--text-muted)', fontSize: '11px', width: '56px', flexShrink: 0 }}
          >
            QUALITY
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <KpiCard
              label="평균처리시간"
              value={
                summary?.avg_resolution_days != null ? Math.round(summary.avg_resolution_days) : '—'
              }
              unit={summary?.avg_resolution_days != null ? '일' : undefined}
            />
            <KpiCard
              label="해결율"
              value={resolutionRate != null ? resolutionRate : '—'}
              unit={resolutionRate != null ? '%' : undefined}
            />
            <KpiCard label="Urgent·High 미해결" value={summary?.urgent ?? '—'} />
            <KpiCard label="14일+ 미처리" value={summary?.overdue ?? '—'} />
          </div>
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
