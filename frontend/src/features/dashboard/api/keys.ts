import type { DashboardFilter, DistributionFilter, HeatmapFilter, WeeklyTrendFilter, ProcessingSpeedFilter, AssigneeStatsFilter, AgingVocsFilter } from '@contracts/dashboard';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  settings: (scope: 'self' | 'admin' = 'self') => ['dashboard', 'settings', scope] as const,
  summary: (filter: DashboardFilter) => ['dashboard', 'summary', filter] as const,
  // Phase C
  distribution: (filter: DistributionFilter) => ['dashboard', 'distribution', filter] as const,
  priorityStatusMatrix: (filter: DashboardFilter) => ['dashboard', 'priority-status-matrix', filter] as const,
  heatmap: (filter: HeatmapFilter) => ['dashboard', 'heatmap', filter] as const,
  weeklyTrend: (filter: WeeklyTrendFilter) => ['dashboard', 'weekly-trend', filter] as const,
  processingSpeed: (filter: ProcessingSpeedFilter) => ['dashboard', 'processing-speed', filter] as const,
  assigneeStats: (filter: AssigneeStatsFilter) => ['dashboard', 'assignee-stats', filter] as const,
  agingVocs: (filter: AgingVocsFilter) => ['dashboard', 'aging-vocs', filter] as const,
} as const;
