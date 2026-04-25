export interface DashboardFilters {
  systemId?: string;
  menuId?: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummary {
  total: number;
  unresolved: number;
  completed: number;
  in_progress: number;
  urgent: number;
  overdue: number;
  avg_resolution_days: number | null;
  new_this_week: number;
}

function buildParams(
  filters: DashboardFilters,
  extra?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (filters.systemId) params.set('systemId', filters.systemId);
  if (filters.menuId) params.set('menuId', filters.menuId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (extra) {
    for (const [key, val] of Object.entries(extra)) {
      if (val !== undefined) params.set(key, val);
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`dashboard fetch error: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

export function fetchSummary(filters: DashboardFilters): Promise<DashboardSummary> {
  return get(`/api/dashboard/summary${buildParams(filters)}`);
}

export function fetchDistribution(
  filters: DashboardFilters,
  type: 'status' | 'priority' | 'voc_type' | 'tag',
): Promise<{ label: string; count: number }[]> {
  return get(`/api/dashboard/distribution${buildParams(filters, { type })}`);
}

export function fetchPriorityStatusMatrix(
  filters: DashboardFilters,
): Promise<{ rows: { priority: string; status: string; count: number }[] }> {
  return get(`/api/dashboard/priority-status-matrix${buildParams(filters)}`);
}

export function fetchHeatmap(
  filters: DashboardFilters,
  xAxis: 'status' | 'priority' | 'tag',
): Promise<{ rows: { y_label: string; x_label: string; count: number }[]; x_values: string[] }> {
  return get(`/api/dashboard/heatmap${buildParams(filters, { xAxis })}`);
}

export function fetchWeeklyTrend(
  filters: DashboardFilters,
): Promise<{ weeks: { week: string; new: number; in_progress: number; completed: number }[] }> {
  return get(`/api/dashboard/weekly-trend${buildParams(filters)}`);
}

export function fetchTagDistribution(
  filters: DashboardFilters,
  limit?: number,
): Promise<{ tag: string; count: number }[]> {
  return get(
    `/api/dashboard/tag-distribution${buildParams(filters, { limit: limit?.toString() })}`,
  );
}

export function fetchSystemOverview(
  filters: DashboardFilters,
): Promise<
  { system_id: string; system_name: string; total: number; unresolved: number; completed: number }[]
> {
  return get(`/api/dashboard/system-overview${buildParams(filters)}`);
}

export function fetchAssigneeStats(
  filters: DashboardFilters,
  xAxis: 'status' | 'priority' | 'tag',
): Promise<{
  rows: {
    assignee_id: string | null;
    assignee_name: string;
    x_label: string;
    count: number;
  }[];
  x_values: string[];
}> {
  return get(`/api/dashboard/assignee-stats${buildParams(filters, { xAxis })}`);
}

export function fetchAging(
  filters: DashboardFilters,
): Promise<{ le7: number; d8to30: number; gt30: number }> {
  return get(`/api/dashboard/aging${buildParams(filters)}`);
}

export function fetchAgingVocs(filters: DashboardFilters, limit?: number): Promise<unknown[]> {
  return get(`/api/dashboard/aging-vocs${buildParams(filters, { limit: limit?.toString() })}`);
}

export function fetchDashboardMenus(systemId: string): Promise<{ id: string; name: string }[]> {
  return get(`/api/dashboard/menus?systemId=${encodeURIComponent(systemId)}`);
}

export function fetchAssignees(): Promise<{ id: string; name: string; email: string }[]> {
  return get('/api/dashboard/assignees');
}
