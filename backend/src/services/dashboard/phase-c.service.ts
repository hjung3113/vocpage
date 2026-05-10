/**
 * Dashboard Phase C service — Wave 2 Phase C.
 *
 * One function per endpoint. Business logic only — no SQL here.
 * SQL lives in dashboard-phase-c.repo.ts.
 *
 * Time semantics: all KST, using helpers from summary.service.ts.
 * Spec: docs/specs/requires/dashboard.md §2–§9 + wave-2-phase-c.md.
 *
 * Exported pure helpers (buildDistributionItems, buildMatrixResponse, etc.)
 * are also tested directly in __tests__/phase-c.service.test.ts.
 */
import type {
  DistributionFilter,
  DistributionResponse,
  DistributionItem,
  PriorityStatusMatrixFilter,
  PriorityStatusMatrixResponse,
  MatrixPriority,
  MatrixStatus,
  HeatmapFilter,
  HeatmapResponse,
  HeatmapRow,
  WeeklyTrendFilter,
  WeeklyTrendResponse,
  ProcessingSpeedFilter,
  ProcessingSpeedResponse,
  ProcessingSpeedRow,
  AssigneeStatsFilter,
  AssigneeStatsResponse,
  AssigneeStatRow,
  AgingVocsFilter,
  AgingVocsResponse,
} from '../../../../shared/contracts/dashboard';
import * as repo from '../../repository/dashboard-phase-c.repo';
import { kstStartOfWeek, shiftDays } from './summary.service';
import type { MetricsScope } from '../../repository/dashboard-metrics.repo';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ── exported pure helpers (tested independently) ──────────────────────────────

export interface DistributionRawItem {
  label: string;
  count: number;
  key: string;
}

/**
 * Build distribution items array from raw counts.
 * tagMode=true: apply top-6 + 기타 aggregation logic.
 */
export function buildDistributionItems(
  raw: DistributionRawItem[],
  opts: { tagMode?: boolean } = {},
): { items: DistributionItem[]; total: number } {
  const total = raw.reduce((s, r) => s + r.count, 0);

  let work = raw;
  let kitaRemainder = 0;

  if (opts.tagMode && raw.length > 6) {
    work = raw.slice(0, 6);
    kitaRemainder = raw.slice(6).reduce((s, r) => s + r.count, 0);
  }

  const items: DistributionItem[] = work.map((r) => ({
    label: r.label,
    count: r.count,
    percentage: total === 0 ? 0 : Math.round((r.count / total) * 1000) / 10,
    key: r.key,
  }));

  if (opts.tagMode && kitaRemainder > 0) {
    items.push({
      label: '기타',
      count: kitaRemainder,
      percentage: total === 0 ? 0 : Math.round((kitaRemainder / total) * 1000) / 10,
      key: '기타',
    });
  }

  return { items, total };
}

const MATRIX_PRIORITIES: MatrixPriority[] = ['urgent', 'high', 'medium', 'low'];
const MATRIX_STATUSES: MatrixStatus[] = ['접수', '검토중', '처리중', '완료', '드랍'];

/**
 * Build the full 4×5 matrix response from raw (priority, status, count) rows.
 * Zero-fills missing cells; preserves ordering.
 */
export function buildMatrixResponse(
  raw: Array<{ priority: string; status: string; count: number }>,
): PriorityStatusMatrixResponse {
  // Build lookup: priority → status → count
  const lookup = new Map<string, Map<string, number>>();
  for (const r of raw) {
    if (!lookup.has(r.priority)) lookup.set(r.priority, new Map());
    lookup.get(r.priority)!.set(r.status, r.count);
  }

  let max_value = 0;
  const rows = MATRIX_PRIORITIES.map((priority) => {
    const byStatus = lookup.get(priority) ?? new Map<string, number>();
    const cells = Object.fromEntries(
      MATRIX_STATUSES.map((s) => {
        const v = byStatus.get(s) ?? 0;
        if (v > max_value) max_value = v;
        return [s, v];
      }),
    ) as Record<MatrixStatus, number>;
    const row_total = MATRIX_STATUSES.reduce((s, st) => s + (cells[st] ?? 0), 0);
    return { priority, cells, row_total };
  });

  return { columns: MATRIX_STATUSES, rows, max_value };
}

/**
 * Build 12 ISO week labels + starts going back from the week containing `now`.
 * W1 = oldest, W12 = current week. Weeks are Mon-based (ISO).
 */
export function buildWeekLabels(now: Date): { weeks: string[]; weekStarts: string[] } {
  const currentWeekMon = kstStartOfWeek(now);
  const weeks: string[] = [];
  const weekStarts: string[] = [];
  for (let back = 11; back >= 0; back--) {
    const mon = shiftDays(currentWeekMon, -back * 7);
    const kstWall = new Date(mon.getTime() + KST_OFFSET_MS);
    const y = kstWall.getUTCFullYear();
    const m = String(kstWall.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kstWall.getUTCDate()).padStart(2, '0');
    weekStarts.push(`${y}-${m}-${d}`);
    weeks.push(`W${12 - back}`);
  }
  return { weeks, weekStarts };
}

/**
 * Compute SLA rate (pass/eligible) → null when eligible=0.
 */
export function computeSlaRate(slaPass: number, slaEligible: number): number | null {
  if (slaEligible === 0) return null;
  return Math.round((slaPass / slaEligible) * 1000) / 10;
}

/**
 * Sort assignee rows: named rows by name ASC, 미배정 last.
 */
export function buildAssigneeRows(
  raw: Array<{ id: string | null; name: string; values: number[]; total: number; is_unassigned: boolean }>,
): typeof raw {
  const named = raw.filter((r) => !r.is_unassigned).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const unassigned = raw.filter((r) => r.is_unassigned);
  return [...named, ...unassigned];
}

// ── scope + window helpers ────────────────────────────────────────────────────

function filterToScopeAndWindow(filter: {
  systemId?: string;
  menuId?: string;
  assigneeId?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
}): { scope: MetricsScope; start: Date | null; end: Date | null } {
  const scope: MetricsScope = {
    systemId: filter.systemId,
    menuId: filter.menuId,
    assigneeId: filter.assigneeId,
  };
  // Simple window: use provided dates if custom, else use 1m default
  const now = new Date();
  const KST_OFFSET_MS_LOCAL = 9 * 60 * 60 * 1000;
  const kstWall = new Date(now.getTime() + KST_OFFSET_MS_LOCAL);
  const todayKst = new Date(Date.UTC(kstWall.getUTCFullYear(), kstWall.getUTCMonth(), kstWall.getUTCDate()));
  const todayStart = new Date(todayKst.getTime() - KST_OFFSET_MS_LOCAL);
  const todayEnd = new Date(todayStart.getTime() + 86400_000);

  let start: Date | null = null;
  let end: Date | null = todayEnd;

  const range = filter.range;
  if (range === 'all') {
    start = null;
    end = null;
  } else if (range === 'custom' && filter.startDate && filter.endDate) {
    const [sy, sm, sd] = filter.startDate.split('-').map(Number) as [number, number, number];
    const [ey, em, ed] = filter.endDate.split('-').map(Number) as [number, number, number];
    start = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0) - KST_OFFSET_MS_LOCAL);
    end = new Date(Date.UTC(ey, em - 1, ed, 0, 0, 0) - KST_OFFSET_MS_LOCAL + 86400_000);
  } else if (range === '3m') {
    start = new Date(todayStart.getTime() - 90 * 86400_000);
  } else if (range === '1y') {
    start = new Date(todayStart.getTime() - 365 * 86400_000);
  } else {
    // default 1m
    start = new Date(todayStart.getTime() - 30 * 86400_000);
  }

  return { scope, start, end };
}

// ── 1. distribution ───────────────────────────────────────────────────────────

export async function getDistribution(filter: DistributionFilter): Promise<DistributionResponse> {
  const { scope, start, end } = filterToScopeAndWindow(filter);
  const dim = filter.dim ?? 'all';
  const type = filter.type;

  let raw: repo.DistributionRaw[];
  if (type === 'status') {
    raw = await repo.distributionByStatus(scope, start, end);
  } else if (type === 'priority') {
    raw = await repo.distributionByPriority(scope, start, end);
  } else if (type === 'voc_type') {
    raw = await repo.distributionByVocType(scope, start, end);
  } else {
    // tag
    raw = await repo.distributionByTag(scope, start, end);
  }

  const { items, total } = buildDistributionItems(raw, { tagMode: type === 'tag' });
  return { type, dim, total, items };
}

// ── 2. priority-status-matrix ─────────────────────────────────────────────────

export async function getPriorityStatusMatrix(
  filter: PriorityStatusMatrixFilter,
): Promise<PriorityStatusMatrixResponse> {
  const { scope, start, end } = filterToScopeAndWindow(filter);
  const raw = await repo.matrixCounts(scope, start, end);
  return buildMatrixResponse(raw);
}

// ── 3. heatmap ────────────────────────────────────────────────────────────────

export async function getHeatmap(filter: HeatmapFilter): Promise<HeatmapResponse> {
  const { scope, start, end } = filterToScopeAndWindow(filter);
  const xAxis = filter.xAxis ?? 'status';

  let result: repo.HeatmapRawResult;
  if (xAxis === 'status') {
    result = await repo.heatmapByStatus(scope, start, end);
  } else if (xAxis === 'priority') {
    result = await repo.heatmapByPriority(scope, start, end);
  } else {
    // tag
    result = await repo.heatmapByTag(scope, start, end);
  }

  // Determine level from scope
  const level = filter.menuId ? 'menu' : filter.systemId ? 'system' : 'all';

  const rows: HeatmapRow[] = result.systemRows.map((sr) => ({
    name: sr.name,
    id: sr.id,
    level: level === 'all' ? 'system' : level === 'system' ? 'menu' : 'menu',
    values: sr.values,
    total: sr.total,
  }));

  let max_value = 0;
  for (const row of rows) {
    for (const v of row.values) {
      if (v > max_value) max_value = v;
    }
  }

  // totalRow is null when menuId is supplied (level 3)
  const totalRow = filter.menuId ? null : result.totalValues;

  return {
    headers: result.headers,
    totalRow,
    rows,
    max_value,
  };
}

// ── 4. weekly-trend ───────────────────────────────────────────────────────────

export async function getWeeklyTrend(filter: WeeklyTrendFilter): Promise<WeeklyTrendResponse> {
  // Date range params are ignored — always 12-week fixed window.
  // systemId/menuId/assigneeId are applied.
  const scope: MetricsScope = {
    systemId: filter.systemId,
    menuId: filter.menuId,
    assigneeId: filter.assigneeId,
  };

  const now = new Date();
  const { weeks, weekStarts } = buildWeekLabels(now);
  const currentWeekMon = kstStartOfWeek(now);

  const newSeries: number[] = [];
  const enteredInProgressSeries: number[] = [];
  const doneSeries: number[] = [];

  for (let back = 11; back >= 0; back--) {
    const weekStart = shiftDays(currentWeekMon, -back * 7);
    const weekEnd = shiftDays(weekStart, 7);
    const counts = await repo.weekCounts(scope, weekStart, weekEnd);
    newSeries.push(counts.newCount);
    enteredInProgressSeries.push(counts.enteredInProgressCount);
    doneSeries.push(counts.doneCount);
  }

  return {
    weeks,
    weekStarts,
    series: {
      new: newSeries,
      enteredInProgress: enteredInProgressSeries,
      done: doneSeries,
    },
  };
}

// ── 5. processing-speed ───────────────────────────────────────────────────────

export async function getProcessingSpeed(
  filter: ProcessingSpeedFilter,
): Promise<ProcessingSpeedResponse> {
  const { scope, start, end } = filterToScopeAndWindow(filter);
  const dim = filter.dim ?? 'all';

  let rawRows: repo.ProcessingSpeedRaw[];
  if (dim === 'system') {
    rawRows = await repo.processingSpeedBySystem(scope, start, end);
  } else if (dim === 'menu') {
    rawRows = await repo.processingSpeedByMenu(scope, start, end);
  } else {
    rawRows = [await repo.processingSpeedAll(scope, start, end)];
  }

  const rows: ProcessingSpeedRow[] = rawRows.map((r) => ({
    id: r.id,
    name: r.name,
    avg_days: r.completed_count === 0 ? null : r.avg_days,
    sla_rate: computeSlaRate(r.sla_pass, r.sla_eligible),
    completed_count: r.completed_count,
    slaEligibleCount: r.sla_eligible,
    missingDueDateCount: r.missing_due_date,
  }));

  return { dim, rows };
}

// ── 6. assignee-stats ─────────────────────────────────────────────────────────

export async function getAssigneeStats(filter: AssigneeStatsFilter): Promise<AssigneeStatsResponse> {
  const { scope, start, end } = filterToScopeAndWindow(filter);
  const xAxis = filter.xAxis ?? 'status';

  let result: { headers: string[]; rows: repo.AssigneeStatRaw[] };
  if (xAxis === 'status') {
    result = await repo.assigneeStatsByStatus(scope, start, end);
  } else if (xAxis === 'priority') {
    result = await repo.assigneeStatsByPriority(scope, start, end);
  } else {
    result = await repo.assigneeStatsByTag(scope, start, end);
  }

  // Sort: named rows by name ASC, 미배정 last
  const sorted = buildAssigneeRows(result.rows);

  // max_value: across named-assignee rows only (미배정 excluded)
  const namedRows = sorted.filter((r) => !r.is_unassigned);
  let max_value = 0;
  for (const row of namedRows) {
    for (const v of row.values) {
      if (v > max_value) max_value = v;
    }
  }

  const rows: AssigneeStatRow[] = sorted.map((r) => ({
    id: r.id,
    name: r.name,
    is_unassigned: r.is_unassigned,
    values: r.values,
    total: r.total,
  }));

  return { headers: result.headers, rows, max_value };
}

// ── 7. aging-vocs ─────────────────────────────────────────────────────────────

/**
 * AgingVocs: date range params are silently ignored (per spec §9 + P1 resolution).
 * This endpoint always reflects the current snapshot of unresolved VOCs.
 */
export async function getAgingVocs(filter: AgingVocsFilter): Promise<AgingVocsResponse> {
  const scope: MetricsScope = {
    systemId: filter.systemId,
    menuId: filter.menuId,
    assigneeId: filter.assigneeId,
  };
  const dim = filter.dim ?? 'all';
  const limit = filter.limit ?? 10;

  const raw = await repo.agingVocs(scope, dim, limit);

  return {
    dim,
    items: raw.map((r) => ({
      voc_id: r.voc_id,
      issue_code: r.issue_code,
      title: r.title,
      priority: r.priority as 'urgent' | 'high' | 'medium' | 'low',
      elapsed_days: r.elapsed_days,
      system_name: r.system_name,
      menu_name: r.menu_name,
    })),
  };
}
