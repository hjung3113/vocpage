/**
 * useAgingVocs — Wave 2 Phase C.
 * Queries /api/dashboard/aging-vocs. Date range is ignored by BE (spec).
 */
import { useQuery } from '@tanstack/react-query';
import type { AgingVocDim } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useAgingVocs(limit = 10, dim: AgingVocDim = 'all') {
  const { filter } = useDashboardFilter();
  const queryFilter = {
    systemId: filter.systemId,
    menuId: filter.menuId,
    assigneeId: filter.assigneeId,
    limit,
    dim,
  };
  return useQuery({
    queryKey: dashboardQueryKeys.agingVocs(queryFilter),
    queryFn: () => dashboardApi.getAgingVocs(queryFilter),
    staleTime: 60_000,
  });
}
