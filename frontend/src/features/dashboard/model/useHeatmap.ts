/**
 * useHeatmap — Wave 2 Phase C.
 * Queries /api/dashboard/heatmap. xAxis state is LOCAL to this hook
 * (spec: independent from useAssigneeStats xAxis).
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HeatmapXAxis } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useHeatmap() {
  const { filter } = useDashboardFilter();
  const [xAxis, setXAxis] = useState<HeatmapXAxis>('status');

  const queryFilter = { ...filter, xAxis };
  const query = useQuery({
    queryKey: dashboardQueryKeys.heatmap(queryFilter),
    queryFn: () => dashboardApi.getHeatmap(queryFilter),
    staleTime: 30_000,
  });

  return { ...query, xAxis, setXAxis };
}
