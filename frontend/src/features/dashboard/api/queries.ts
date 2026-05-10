/**
 * Dashboard API functions.
 * Spec: shared/openapi.yaml#/paths/~1dashboard~1settings + ~1dashboard~1summary + Phase C
 */
import { apiGet, apiPut } from '@shared/api/client';
import {
  DashboardSettings,
  DashboardSettingsUpdate,
  DashboardSettingsResponse,
  DashboardSummary,
  type DashboardFilter,
  DistributionResponse,
  type DistributionFilter,
  PriorityStatusMatrixResponse,
  HeatmapResponse,
  type HeatmapFilter,
  WeeklyTrendResponse,
  type WeeklyTrendFilter,
  ProcessingSpeedResponse,
  type ProcessingSpeedFilter,
  AssigneeStatsResponse,
  type AssigneeStatsFilter,
  AgingVocsResponse,
  type AgingVocsFilter,
} from '@contracts/dashboard';

/** Build URLSearchParams from a filter object, omitting undefined values. */
function filterToQs(filter: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  return qs.toString() ? `?${qs.toString()}` : '';
}

export const dashboardApi = {
  getSettings(scope: 'self' | 'admin' = 'self'): Promise<DashboardSettings> {
    const suffix = scope === 'admin' ? '?scope=admin' : '';
    return apiGet(`/api/dashboard/settings${suffix}`, DashboardSettingsResponse);
  },

  updateSettings(
    payload: DashboardSettingsUpdate,
    scope: 'self' | 'admin' = 'self',
  ): Promise<DashboardSettings> {
    const suffix = scope === 'admin' ? '?scope=admin' : '';
    return apiPut(`/api/dashboard/settings${suffix}`, payload, DashboardSettingsResponse);
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

  // Phase C endpoints

  getDistribution(filter: DistributionFilter): Promise<import('@contracts/dashboard').DistributionResponse> {
    return apiGet(`/api/dashboard/distribution${filterToQs(filter as Record<string, unknown>)}`, DistributionResponse);
  },

  getPriorityStatusMatrix(filter: DashboardFilter): Promise<import('@contracts/dashboard').PriorityStatusMatrixResponse> {
    return apiGet(`/api/dashboard/priority-status-matrix${filterToQs(filter as Record<string, unknown>)}`, PriorityStatusMatrixResponse);
  },

  getHeatmap(filter: HeatmapFilter): Promise<import('@contracts/dashboard').HeatmapResponse> {
    return apiGet(`/api/dashboard/heatmap${filterToQs(filter as Record<string, unknown>)}`, HeatmapResponse);
  },

  getWeeklyTrend(filter: WeeklyTrendFilter): Promise<import('@contracts/dashboard').WeeklyTrendResponse> {
    return apiGet(`/api/dashboard/weekly-trend${filterToQs(filter as Record<string, unknown>)}`, WeeklyTrendResponse);
  },

  getProcessingSpeed(filter: ProcessingSpeedFilter): Promise<import('@contracts/dashboard').ProcessingSpeedResponse> {
    return apiGet(`/api/dashboard/processing-speed${filterToQs(filter as Record<string, unknown>)}`, ProcessingSpeedResponse);
  },

  getAssigneeStats(filter: AssigneeStatsFilter): Promise<import('@contracts/dashboard').AssigneeStatsResponse> {
    return apiGet(`/api/dashboard/assignee-stats${filterToQs(filter as Record<string, unknown>)}`, AssigneeStatsResponse);
  },

  getAgingVocs(filter: AgingVocsFilter): Promise<import('@contracts/dashboard').AgingVocsResponse> {
    return apiGet(`/api/dashboard/aging-vocs${filterToQs(filter as Record<string, unknown>)}`, AgingVocsResponse);
  },
};
