/**
 * useWeeklyTrend — Wave 2 Phase C.
 * Queries /api/dashboard/weekly-trend. Date range ignored per spec (12-week fixed).
 * systemId/menuId/assigneeId are still applied.
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useWeeklyTrend() {
  const { filter } = useDashboardFilter();
  // Omit startDate/endDate — BE ignores them, but key still includes them for reactivity.
  const queryFilter = {
    systemId: filter.systemId,
    menuId: filter.menuId,
    assigneeId: filter.assigneeId,
  };
  return useQuery({
    queryKey: dashboardQueryKeys.weeklyTrend(queryFilter),
    queryFn: () => dashboardApi.getWeeklyTrend(queryFilter),
    staleTime: 60_000,
  });
}
