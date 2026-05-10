/**
 * Dashboard summary service — Wave 2 Phase B (dashboard.md §1).
 *
 * Resolves the user's `default_date_range` (when caller omits `range`),
 * converts the range preset to a [start, end) window at KST midnight, then
 * computes the 8 KPIs (Volume + Quality) by fanning out to the metrics repo.
 *
 * Time semantics:
 * - All KST date boundaries are exact KST midnight (UTC+9). KST has no DST.
 * - "이번주" KPIs use the current ISO week (Mon–Sun) at KST.
 * - "전주 동기간" deltas shift the window by exactly 7 days. For `all`,
 *   the prior-period delta is null (no comparable window).
 */
import {
  type DashboardFilter,
  type DashboardSummary,
  type KpiMetric,
} from '../../../../shared/contracts/dashboard';
import { HttpError } from '../../middleware/httpError';
import * as repo from '../../repository/dashboard-metrics.repo';
import * as settingsRepo from '../../repository/dashboard.repo';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface ResolvedFilter {
  scope: repo.MetricsScope;
  range: 'custom' | '1m' | '3m' | '1y' | 'all';
  current: { start: Date; end: Date } | null;
  prior: { start: Date; end: Date } | null;
  weekCurrent: { start: Date; end: Date };
  weekPrior: { start: Date; end: Date };
  now: Date;
}

/** Construct a Date at exactly `YYYY-MM-DD 00:00:00 KST`. */
export function kstMidnight(yyyymmdd: string): Date {
  const parts = yyyymmdd.split('-').map(Number) as [number, number, number];
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - KST_OFFSET_MS);
}

/** KST midnight of the calendar day containing `now` (UTC instant). */
export function kstStartOfDay(now: Date): Date {
  const kstWall = new Date(now.getTime() + KST_OFFSET_MS);
  const day = new Date(Date.UTC(kstWall.getUTCFullYear(), kstWall.getUTCMonth(), kstWall.getUTCDate()));
  return new Date(day.getTime() - KST_OFFSET_MS);
}

/** Monday 00:00 KST of the ISO week containing `now`. */
export function kstStartOfWeek(now: Date): Date {
  const today = kstStartOfDay(now);
  const kstWall = new Date(today.getTime() + KST_OFFSET_MS);
  const dow = kstWall.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const offsetDays = dow === 0 ? 6 : dow - 1;
  return new Date(today.getTime() - offsetDays * 86400_000);
}

export function shiftDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400_000);
}

export interface ResolveOptions {
  filter: DashboardFilter;
  /** Caller-injected clock; defaults to `new Date()`. Tests override. */
  now?: Date;
  /** User id for default_date_range lookup; null skips the lookup (uses '1m'). */
  userId: string | null;
}

/**
 * Resolve filter + range → concrete windows. Implements the precedence
 * dashboard.md §1: explicit `range` wins; otherwise `dashboard_settings.default_date_range`;
 * otherwise spec default (`1m`).
 */
export async function resolveFilter(opts: ResolveOptions): Promise<ResolvedFilter> {
  const { filter, userId } = opts;
  const now = opts.now ?? new Date();

  let range = filter.range;
  if (!range) {
    if (userId) {
      const row = await settingsRepo.getByUserId(userId);
      const admin = await settingsRepo.getAdminDefault();
      range = (row?.default_date_range ?? admin?.default_date_range ?? '1m') as
        | DashboardFilter['range']
        | undefined;
    }
    range = range ?? '1m';
  }

  const todayStart = kstStartOfDay(now);
  let current: { start: Date; end: Date } | null = null;

  if (range === 'custom') {
    if (!filter.startDate || !filter.endDate) {
      throw new HttpError(400, 'BAD_REQUEST', 'range=custom requires startDate and endDate');
    }
    const start = kstMidnight(filter.startDate);
    const end = shiftDays(kstMidnight(filter.endDate), 1); // inclusive end-day
    if (end <= start) {
      throw new HttpError(400, 'BAD_REQUEST', 'endDate must be on or after startDate');
    }
    current = { start, end };
  } else if (range === '1m') {
    current = { start: shiftDays(todayStart, -30), end: shiftDays(todayStart, 1) };
  } else if (range === '3m') {
    current = { start: shiftDays(todayStart, -90), end: shiftDays(todayStart, 1) };
  } else if (range === '1y') {
    current = { start: shiftDays(todayStart, -365), end: shiftDays(todayStart, 1) };
  } else if (range === 'all') {
    current = null;
  }

  const prior =
    current === null
      ? null
      : { start: shiftDays(current.start, -7), end: shiftDays(current.end, -7) };

  const weekStart = kstStartOfWeek(now);
  const weekEnd = shiftDays(weekStart, 7);
  const weekPrior = { start: shiftDays(weekStart, -7), end: weekStart };

  return {
    scope: {
      systemId: filter.systemId,
      menuId: filter.menuId,
      assigneeId: filter.assigneeId,
    },
    range: range as ResolvedFilter['range'],
    current,
    prior,
    weekCurrent: { start: weekStart, end: weekEnd },
    weekPrior,
    now,
  };
}

function metric(value: number, prior: number | null, kind: KpiMetric['delta_kind']): KpiMetric {
  if (prior === null) return { value, delta: null, delta_kind: kind };
  if (kind === 'percent') {
    if (prior === 0) return { value, delta: null, delta_kind: kind };
    return { value, delta: ((value - prior) / prior) * 100, delta_kind: kind };
  }
  return { value, delta: value - prior, delta_kind: kind };
}

/** Compute the full 8-KPI summary. */
export async function computeSummary(resolved: ResolvedFilter): Promise<DashboardSummary> {
  const { scope, current, prior, weekCurrent, weekPrior, now } = resolved;
  // Spec §1 "현재 시점 스냅샷" — snapshot KPIs use `now` directly. Prior
  // comparison snapshot is exactly 7 days earlier (전주 동시점).
  const snapshotNow = now;
  const snapshotPrior = shiftDays(now, -7);
  const widestEnd = shiftDays(kstStartOfDay(now), 1);

  // Volume — total_voc (period), unresolved (snapshot), this_week_new/completed (week-fixed).
  const totalCurrent = current
    ? await repo.countCreatedAndCompleted(scope, current.start, current.end)
    : await repo.countCreatedAndCompleted(scope, new Date(0), widestEnd);
  const totalPrior = prior
    ? await repo.countCreatedAndCompleted(scope, prior.start, prior.end)
    : null;

  const unresolvedNow = await repo.snapshotUnresolved(scope, snapshotNow);
  const unresolvedPrior = await repo.snapshotUnresolved(scope, snapshotPrior);

  const weekNow = await repo.countCreatedAndCompleted(scope, weekCurrent.start, weekCurrent.end);
  const weekLast = await repo.countCreatedAndCompleted(scope, weekPrior.start, weekPrior.end);

  // Quality — avg_resolution_days + resolution_rate (period), urgent_high + overdue (snapshot).
  const avgCurrent = current
    ? await repo.avgResolutionDaysInWindow(scope, current.start, current.end)
    : await repo.avgResolutionDaysInWindow(scope, new Date(0), widestEnd);
  const avgPrior = prior
    ? await repo.avgResolutionDaysInWindow(scope, prior.start, prior.end)
    : null;

  // resolution_rate is "기간 연동" — both numerator and denominator must be
  // window-consistent. Denominator = unresolved snapshot at the *window end*
  // (or `now` for range=all). Prior uses prior-window end. This keeps the
  // %p delta meaningful (compares like-for-like).
  const currentEnd = current ? current.end : snapshotNow;
  const priorEnd = prior ? prior.end : snapshotPrior;
  const unresolvedAtCurrentEnd = current
    ? await repo.snapshotUnresolved(scope, currentEnd)
    : unresolvedNow;
  const unresolvedAtPriorEnd =
    totalPrior === null ? null : await repo.snapshotUnresolved(scope, priorEnd);

  const resolutionRateCurrent = computeResolutionRate(totalCurrent.completed, unresolvedAtCurrentEnd);
  const resolutionRatePrior =
    totalPrior === null || unresolvedAtPriorEnd === null
      ? null
      : computeResolutionRate(totalPrior.completed, unresolvedAtPriorEnd);

  const urgentHighNow = await repo.snapshotUrgentHighUnresolved(scope, snapshotNow);
  const urgentHighPrior = await repo.snapshotUrgentHighUnresolved(scope, snapshotPrior);

  const overdueNow = await repo.snapshotOverdue14d(scope, snapshotNow);
  const overduePrior = await repo.snapshotOverdue14d(scope, snapshotPrior);

  return {
    kpi_volume: {
      total_voc: metric(totalCurrent.total, totalPrior?.total ?? null, 'percent'),
      unresolved: metric(unresolvedNow, unresolvedPrior, 'percent'),
      this_week_new: metric(weekNow.total, weekLast.total, 'percent'),
      this_week_completed: metric(weekNow.completed, weekLast.completed, 'percent'),
    },
    kpi_quality: {
      avg_resolution_days: metric(
        avgCurrent.avg_days ?? 0,
        avgPrior?.avg_days ?? null,
        'days',
      ),
      resolution_rate: metric(
        resolutionRateCurrent,
        resolutionRatePrior,
        'percentage_point',
      ),
      urgent_high_unresolved: metric(urgentHighNow, urgentHighPrior, 'count'),
      overdue_14d: metric(overdueNow, overduePrior, 'count'),
    },
  };
}

function computeResolutionRate(completed: number, unresolved: number): number {
  const denom = completed + unresolved;
  if (denom === 0) return 0;
  return (completed / denom) * 100;
}

/** Convenience entry — resolve + compute. */
export async function getSummary(opts: ResolveOptions): Promise<DashboardSummary> {
  const resolved = await resolveFilter(opts);
  return computeSummary(resolved);
}
