/**
 * usePriorityStatusMatrix — Wave 2 Phase C.
 * Queries /api/dashboard/priority-status-matrix with the active filter.
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function usePriorityStatusMatrix() {
  const { filter } = useDashboardFilter();
  return useQuery({
    queryKey: dashboardQueryKeys.priorityStatusMatrix(filter),
    queryFn: () => dashboardApi.getPriorityStatusMatrix(filter),
    staleTime: 30_000,
  });
}
