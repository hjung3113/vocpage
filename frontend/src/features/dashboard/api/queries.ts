/**
 * Dashboard settings API functions.
 * Spec: shared/openapi.yaml#/paths/~1dashboard~1settings
 */
import { apiGet, apiPut } from '@shared/api/client';
import {
  DashboardSettings,
  DashboardSettingsUpdate,
  DashboardSettingsResponse,
} from '@contracts/dashboard';

export const dashboardApi = {
  getSettings(): Promise<DashboardSettings> {
    return apiGet('/api/dashboard/settings', DashboardSettingsResponse);
  },

  updateSettings(payload: DashboardSettingsUpdate): Promise<DashboardSettings> {
    return apiPut('/api/dashboard/settings', payload, DashboardSettingsResponse);
  },
};
