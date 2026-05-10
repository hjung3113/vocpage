/**
 * Dashboard metrics repository — Wave 2 Phase B (dashboard.md §1).
 *
 * Read-only SQL surface for the 8 KPI metrics rendered by
 * `GET /api/dashboard/summary`. Two windows are computed per metric:
 * the "current" window (caller-supplied bounds) and the "prior" window
 * (`current minus 7 days`, used for the week-over-week delta).
 *
 * Filter clauses are composed identically across queries so a missing
 * `system_id` / `menu_id` / `assignee_id` cleanly drops the predicate.
 * `deleted_at IS NULL` is always applied.
 *
 * Mockable: tests `jest.mock('../repository/dashboard-metrics.repo')` to
 * exercise the service layer without touching pg.
 */
import { getPool } from '../db';

export interface MetricsScope {
  systemId?: string;
  menuId?: string;
  assigneeId?: string;
}

export interface PeriodCounts {
  total: number;
  completed: number;
  unresolved: number;
}

export interface AvgResolution {
  avg_days: number | null;
  completed_count: number;
}

const NOT_DONE = ['접수', '검토중', '처리중'];

function scopePredicates(scope: MetricsScope, startIdx: number): {
  sql: string;
  values: unknown[];
  nextIdx: number;
} {
  const clauses: string[] = ['deleted_at IS NULL'];
  const values: unknown[] = [];
  let i = startIdx;
  if (scope.systemId) {
    clauses.push(`system_id = $${i++}`);
    values.push(scope.systemId);
  }
  if (scope.menuId) {
    clauses.push(`menu_id = $${i++}`);
    values.push(scope.menuId);
  }
  if (scope.assigneeId) {
    clauses.push(`assignee_id = $${i++}`);
    values.push(scope.assigneeId);
  }
  return { sql: clauses.join(' AND '), values, nextIdx: i };
}

/** Counts created in [start, end), with a `completed_at` snapshot of completions in the window (status_changed_at). */
export async function countCreatedAndCompleted(
  scope: MetricsScope,
  start: Date,
  end: Date,
): Promise<PeriodCounts> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 3);
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE created_at >= $1 AND created_at < $2)::int AS total,
      COUNT(*) FILTER (
        WHERE status = '완료'
          AND status_changed_at >= $1
          AND status_changed_at < $2
      )::int AS completed,
      COUNT(*) FILTER (
        WHERE created_at >= $1 AND created_at < $2
          AND status = ANY($${scopeValues.length + 3})
      )::int AS unresolved
    FROM vocs
    WHERE ${scopeSql}
  `;
  const res = await pool.query(sql, [start, end, ...scopeValues, NOT_DONE]);
  const r = res.rows[0] ?? { total: 0, completed: 0, unresolved: 0 };
  return { total: Number(r.total), completed: Number(r.completed), unresolved: Number(r.unresolved) };
}

/** Snapshot count of unresolved (NOT in 완료/드랍) at instant `at`. */
export async function snapshotUnresolved(
  scope: MetricsScope,
  at: Date,
): Promise<number> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 2);
  const sql = `
    SELECT COUNT(*)::int AS n
    FROM vocs
    WHERE ${scopeSql}
      AND created_at <= $1
      AND status = ANY($${scopeValues.length + 2})
  `;
  const res = await pool.query(sql, [at, ...scopeValues, NOT_DONE]);
  return Number(res.rows[0]?.n ?? 0);
}

/** Snapshot count of `priority IN (urgent, high) AND status NOT IN (완료/드랍)` at `at`. */
export async function snapshotUrgentHighUnresolved(
  scope: MetricsScope,
  at: Date,
): Promise<number> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 2);
  const sql = `
    SELECT COUNT(*)::int AS n
    FROM vocs
    WHERE ${scopeSql}
      AND created_at <= $1
      AND priority = ANY($${scopeValues.length + 2})
      AND status = ANY($${scopeValues.length + 3})
  `;
  const res = await pool.query(sql, [at, ...scopeValues, ['urgent', 'high'], NOT_DONE]);
  return Number(res.rows[0]?.n ?? 0);
}

/** Snapshot count of overdue (created ≤ at-14d) and not in 완료/드랍 at `at`. */
export async function snapshotOverdue14d(
  scope: MetricsScope,
  at: Date,
): Promise<number> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 2);
  const sql = `
    SELECT COUNT(*)::int AS n
    FROM vocs
    WHERE ${scopeSql}
      AND created_at <= ($1::timestamptz - INTERVAL '14 days')
      AND status = ANY($${scopeValues.length + 2})
  `;
  const res = await pool.query(sql, [at, ...scopeValues, NOT_DONE]);
  return Number(res.rows[0]?.n ?? 0);
}

/** AVG(status_changed_at - created_at) in days for VOCs completed in [start,end). */
export async function avgResolutionDaysInWindow(
  scope: MetricsScope,
  start: Date,
  end: Date,
): Promise<AvgResolution> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 3);
  const sql = `
    SELECT
      AVG(EXTRACT(EPOCH FROM (status_changed_at - created_at)) / 86400.0) AS avg_days,
      COUNT(*)::int AS n
    FROM vocs
    WHERE ${scopeSql}
      AND status = '완료'
      AND status_changed_at >= $1
      AND status_changed_at < $2
  `;
  const res = await pool.query(sql, [start, end, ...scopeValues]);
  const r = res.rows[0] ?? { avg_days: null, n: 0 };
  return {
    avg_days: r.avg_days === null ? null : Number(r.avg_days),
    completed_count: Number(r.n ?? 0),
  };
}
