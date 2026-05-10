/**
 * Dashboard API functions.
 * Spec: shared/openapi.yaml#/paths/~1dashboard~1settings + ~1dashboard~1summary
 */
import { apiGet, apiPut } from '@shared/api/client';
import {
  DashboardSettings,
  DashboardSettingsUpdate,
  DashboardSettingsResponse,
  DashboardSummary,
  type DashboardFilter,
} from '@contracts/dashboard';

export const dashboardApi = {
  getSettings(): Promise<DashboardSettings> {
    return apiGet('/api/dashboard/settings', DashboardSettingsResponse);
  },

  updateSettings(payload: DashboardSettingsUpdate): Promise<DashboardSettings> {
    return apiPut('/api/dashboard/settings', payload, DashboardSettingsResponse);
  },

  getSummary(filter: DashboardFilter): Promise<DashboardSummary> {
    const qs = new URLSearchParams();
    if (filter.systemId) qs.set('systemId', filter.systemId);
    if (filter.menuId) qs.set('menuId', filter.menuId);
    if (filter.assigneeId) qs.set('assigneeId', filter.assigneeId);
    if (filter.range) qs.set('range', filter.range);
    if (filter.startDate) qs.set('startDate', filter.startDate);
    if (filter.endDate) qs.set('endDate', filter.endDate);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet(`/api/dashboard/summary${suffix}`, DashboardSummary);
  },
};
