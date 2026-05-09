export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  settings: () => ['dashboard', 'settings'] as const,
} as const;
