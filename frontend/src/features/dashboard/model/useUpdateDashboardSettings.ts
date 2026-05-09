import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DashboardSettingsUpdate } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';

export function useUpdateDashboardSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DashboardSettingsUpdate) => dashboardApi.updateSettings(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dashboardQueryKeys.settings() });
    },
  });
}
