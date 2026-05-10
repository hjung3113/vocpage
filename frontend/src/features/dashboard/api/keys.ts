import type { DashboardFilter } from '@contracts/dashboard';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  settings: () => ['dashboard', 'settings'] as const,
  summary: (filter: DashboardFilter) => ['dashboard', 'summary', filter] as const,
} as const;
