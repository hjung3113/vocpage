const BASE = '/api/dashboard';

export interface DashboardQueryParams {
  systemId?: string;
  menuId?: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummary {
  total: number;
  unresolved: number;
  newThisWeek: number;
  doneThisWeek: number;
  avgProcessingDays: number;
  resolvedRate: number;
  urgentHighUnresolved: number;
  over14Days: number;
  prevWeek: {
    total: number;
    unresolved: number;
    newThisWeek: number;
    doneThisWeek: number;
    avgProcessingDays: number;
    resolvedRate: number;
    urgentHighUnresolved: number;
    over14Days: number;
  };
}

export interface DistributionItem {
  name: string;
  count: number;
  pct: number;
  color?: string;
}

export interface MatrixData {
  rows: { priority: string; status: Record<string, number> }[];
  statuses: string[];
}

export interface HeatmapData {
  headers: string[];
  totalRow: number[];
  rows: { name: string; id: string; values: number[]; total: number }[];
}

export interface WeeklyTrendData {
  weeks: string[];
  series: { new: number[]; inProgress: number[]; done: number[] };
}

export interface TagDistItem {
  name: string;
  count: number;
}

export interface SystemOverviewData {
  systems: { id: string; name: string; status: Record<string, number>; total: number }[];
}

export interface AssigneeStatsData {
  headers: string[];
  rows: { assigneeId: string; assigneeName: string; values: number[]; total: number }[];
}

export interface ProcessingSpeedData {
  rows: { id: string; name: string; avgDays: number; slaRate: number }[];
}

export interface AgingData {
  rows: { id: string; name: string; safe: number; warn: number; crit: number; total: number }[];
}

export interface AgingVoc {
  id: string;
  issue_code: string | null;
  title: string;
  systemName: string;
  menuName: string;
  priority: string;
  daysSinceCreated: number;
}

export interface DashboardSettings {
  widget_visibility: Record<string, boolean>;
  default_date_range: '7d' | '30d' | '90d';
  heatmap_default_x_axis: 'status' | 'priority' | 'tag';
}

export interface DashboardSettingsPayload extends DashboardSettings {
  target: 'user' | 'admin';
}

export interface MenuItem {
  id: string;
  name: string;
}

export interface AssigneeItem {
  id: string;
  name: string;
}

function buildParams(p: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, v);
  });
  return params.toString() ? `?${params}` : '';
}

function queryToRecord(p: DashboardQueryParams): Record<string, string | undefined> {
  return {
    systemId: p.systemId,
    menuId: p.menuId,
    assigneeId: p.assigneeId,
    startDate: p.startDate,
    endDate: p.endDate,
  };
}

export async function getDashboardSummary(p: DashboardQueryParams): Promise<DashboardSummary> {
  const res = await fetch(`${BASE}/summary${buildParams(queryToRecord(p))}`);
  if (!res.ok) throw new Error(`getDashboardSummary: ${res.status}`);
  return res.json() as Promise<DashboardSummary>;
}

export async function getDistribution(
  p: DashboardQueryParams & { type: 'status' | 'priority' | 'voc_type' | 'tag' },
): Promise<DistributionItem[]> {
  const { type, ...rest } = p;
  const res = await fetch(`${BASE}/distribution${buildParams({ ...queryToRecord(rest), type })}`);
  if (!res.ok) throw new Error(`getDistribution: ${res.status}`);
  return res.json() as Promise<DistributionItem[]>;
}

export async function getPriorityStatusMatrix(p: DashboardQueryParams): Promise<MatrixData> {
  const res = await fetch(`${BASE}/priority-status-matrix${buildParams(queryToRecord(p))}`);
  if (!res.ok) throw new Error(`getPriorityStatusMatrix: ${res.status}`);
  return res.json() as Promise<MatrixData>;
}

export async function getHeatmap(
  p: DashboardQueryParams & { xAxis: 'status' | 'priority' | 'tag' },
): Promise<HeatmapData> {
  const { xAxis, ...rest } = p;
  const res = await fetch(`${BASE}/heatmap${buildParams({ ...queryToRecord(rest), xAxis })}`);
  if (!res.ok) throw new Error(`getHeatmap: ${res.status}`);
  return res.json() as Promise<HeatmapData>;
}

export async function getWeeklyTrend(
  p: Pick<DashboardQueryParams, 'systemId' | 'menuId'> & { weeks?: number },
): Promise<WeeklyTrendData> {
  const res = await fetch(
    `${BASE}/weekly-trend${buildParams({
      systemId: p.systemId,
      menuId: p.menuId,
      weeks: p.weeks !== undefined ? String(p.weeks) : undefined,
    })}`,
  );
  if (!res.ok) throw new Error(`getWeeklyTrend: ${res.status}`);
  return res.json() as Promise<WeeklyTrendData>;
}

export async function getTagDistribution(
  p: DashboardQueryParams & { limit?: number },
): Promise<TagDistItem[]> {
  const { limit, ...rest } = p;
  const res = await fetch(
    `${BASE}/tag-distribution${buildParams({
      ...queryToRecord(rest),
      limit: limit !== undefined ? String(limit) : undefined,
    })}`,
  );
  if (!res.ok) throw new Error(`getTagDistribution: ${res.status}`);
  return res.json() as Promise<TagDistItem[]>;
}

export async function getSystemOverview(p: DashboardQueryParams): Promise<SystemOverviewData> {
  const res = await fetch(`${BASE}/system-overview${buildParams(queryToRecord(p))}`);
  if (!res.ok) throw new Error(`getSystemOverview: ${res.status}`);
  return res.json() as Promise<SystemOverviewData>;
}

export async function getAssigneeStats(
  p: DashboardQueryParams & { xAxis: 'status' | 'priority' | 'tag' },
): Promise<AssigneeStatsData> {
  const { xAxis, ...rest } = p;
  const res = await fetch(
    `${BASE}/assignee-stats${buildParams({ ...queryToRecord(rest), xAxis })}`,
  );
  if (!res.ok) throw new Error(`getAssigneeStats: ${res.status}`);
  return res.json() as Promise<AssigneeStatsData>;
}

export async function getProcessingSpeed(p: DashboardQueryParams): Promise<ProcessingSpeedData> {
  const res = await fetch(`${BASE}/processing-speed${buildParams(queryToRecord(p))}`);
  if (!res.ok) throw new Error(`getProcessingSpeed: ${res.status}`);
  return res.json() as Promise<ProcessingSpeedData>;
}

export async function getAging(p: DashboardQueryParams): Promise<AgingData> {
  const res = await fetch(`${BASE}/aging${buildParams(queryToRecord(p))}`);
  if (!res.ok) throw new Error(`getAging: ${res.status}`);
  return res.json() as Promise<AgingData>;
}

export async function getAgingVocs(
  p: DashboardQueryParams & { limit?: number },
): Promise<AgingVoc[]> {
  const { limit, ...rest } = p;
  const res = await fetch(
    `${BASE}/aging-vocs${buildParams({
      ...queryToRecord(rest),
      limit: limit !== undefined ? String(limit) : undefined,
    })}`,
  );
  if (!res.ok) throw new Error(`getAgingVocs: ${res.status}`);
  return res.json() as Promise<AgingVoc[]>;
}

export async function getDashboardSettings(): Promise<DashboardSettings> {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error(`getDashboardSettings: ${res.status}`);
  return res.json() as Promise<DashboardSettings>;
}

export async function putDashboardSettings(body: DashboardSettingsPayload): Promise<void> {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`putDashboardSettings: ${res.status}`);
}

export async function getDashboardMenus(systemId: string): Promise<MenuItem[]> {
  const res = await fetch(`${BASE}/menus${buildParams({ systemId })}`);
  if (!res.ok) throw new Error(`getDashboardMenus: ${res.status}`);
  return res.json() as Promise<MenuItem[]>;
}

export async function getDashboardAssignees(
  p?: Pick<DashboardQueryParams, 'systemId' | 'menuId'>,
): Promise<AssigneeItem[]> {
  const res = await fetch(
    `${BASE}/assignees${buildParams({ systemId: p?.systemId, menuId: p?.menuId })}`,
  );
  if (!res.ok) throw new Error(`getDashboardAssignees: ${res.status}`);
  return res.json() as Promise<AssigneeItem[]>;
}
