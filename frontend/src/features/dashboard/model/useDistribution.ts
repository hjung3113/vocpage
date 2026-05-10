/**
 * useDistribution — Wave 2 Phase C.
 * Queries /api/dashboard/distribution with the active filter + requested type.
 */
import { useQuery } from '@tanstack/react-query';
import type { DistributionType, DistributionDim } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useDistribution(type: DistributionType, dim?: DistributionDim) {
  const { filter } = useDashboardFilter();
  const queryFilter = { ...filter, type, ...(dim ? { dim } : {}) };
  return useQuery({
    queryKey: dashboardQueryKeys.distribution(queryFilter),
    queryFn: () => dashboardApi.getDistribution(queryFilter),
    staleTime: 30_000,
  });
}
