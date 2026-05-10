import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';

export function useDashboardSettings() {
  return useQuery({
    queryKey: dashboardQueryKeys.settings(),
    queryFn: () => dashboardApi.getSettings(),
  });
}
