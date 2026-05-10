/**
 * useDashboardSummary — Wave 2 Phase B.
 * Reads the active filter from `DashboardFilterProvider` and queries
 * `/api/dashboard/summary`. The filter object is part of the queryKey so
 * any patch invalidates the cache automatically.
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useDashboardSummary() {
  const { filter } = useDashboardFilter();
  return useQuery({
    queryKey: dashboardQueryKeys.summary(filter),
    queryFn: () => dashboardApi.getSummary(filter),
    staleTime: 30_000,
  });
}
