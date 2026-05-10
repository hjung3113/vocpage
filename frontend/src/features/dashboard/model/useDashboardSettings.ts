import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';

export function useDashboardSettings(scope: 'self' | 'admin' = 'self') {
  return useQuery({
    queryKey: dashboardQueryKeys.settings(scope),
    queryFn: () => dashboardApi.getSettings(scope),
  });
}
