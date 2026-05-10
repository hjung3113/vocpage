/**
 * useAssigneeStats — Wave 2 Phase C.
 * Queries /api/dashboard/assignee-stats. xAxis state is LOCAL (independent from heatmap).
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HeatmapXAxis } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useAssigneeStats() {
  const { filter } = useDashboardFilter();
  const [xAxis, setXAxis] = useState<HeatmapXAxis>('status');

  const queryFilter = { ...filter, xAxis };
  const query = useQuery({
    queryKey: dashboardQueryKeys.assigneeStats(queryFilter),
    queryFn: () => dashboardApi.getAssigneeStats(queryFilter),
    staleTime: 30_000,
  });

  return { ...query, xAxis, setXAxis };
}
