import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DashboardSettingsUpdate } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';

export function useUpdateDashboardSettings(scope: 'self' | 'admin' = 'self') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DashboardSettingsUpdate) => dashboardApi.updateSettings(payload, scope),
    onSuccess: () => {
      // Invalidate both scopes — admin write affects merged self view too.
      void qc.invalidateQueries({ queryKey: dashboardQueryKeys.settings('self') });
      void qc.invalidateQueries({ queryKey: dashboardQueryKeys.settings('admin') });
    },
  });
}
