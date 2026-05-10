/**
 * Dashboard Phase C repository — Wave 2 Phase C.
 *
 * SQL aggregations for the 7 new widget endpoints:
 *   distribution, priority-status-matrix, heatmap, weekly-trend,
 *   processing-speed, assignee-stats, aging-vocs.
 *
 * All queries:
 *   - Filter soft-deleted vocs (deleted_at IS NULL).
 *   - Use status_changed_at — there is NO completed_at column.
 *   - Date math is performed at UTC (KST conversion handled in service).
 *
 * Spec: docs/specs/requires/dashboard.md §2–§9 + wave-2-phase-c.md.
 */
import { getPool } from '../db';
import type { MetricsScope } from './dashboard-metrics.repo';

// ── helpers ───────────────────────────────────────────────────────────────────

function scopePredicates(
  scope: MetricsScope,
  startIdx: number,
): { sql: string; values: unknown[]; nextIdx: number } {
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

// ── distribution ──────────────────────────────────────────────────────────────

export interface DistributionRaw {
  label: string;
  count: number;
  key: string;
}

/**
 * Count VOCs grouped by status within scope+window.
 */
export async function distributionByStatus(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<DistributionRaw[]> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues, nextIdx } = scopePredicates(scope, 1);
  const windowClauses: string[] = [];
  const windowValues: unknown[] = [];
  let i = nextIdx;
  if (start) { windowClauses.push(`created_at >= $${i++}`); windowValues.push(start); }
  if (end)   { windowClauses.push(`created_at < $${i++}`);  windowValues.push(end);   }
  const windowSql = windowClauses.length ? ' AND ' + windowClauses.join(' AND ') : '';
  const sql = `
    SELECT status AS label, status AS key, COUNT(*)::int AS count
    FROM vocs
    WHERE ${scopeSql}${windowSql}
    GROUP BY status
    ORDER BY count DESC, status ASC
  `;
  const res = await pool.query(sql, [...scopeValues, ...windowValues]);
  return res.rows.map((r) => ({ label: r.label, count: Number(r.count), key: r.key }));
}

/**
 * Count VOCs grouped by priority within scope+window.
 */
export async function distributionByPriority(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<DistributionRaw[]> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues, nextIdx } = scopePredicates(scope, 1);
  const windowClauses: string[] = [];
  const windowValues: unknown[] = [];
  let i = nextIdx;
  if (start) { windowClauses.push(`created_at >= $${i++}`); windowValues.push(start); }
  if (end)   { windowClauses.push(`created_at < $${i++}`);  windowValues.push(end);   }
  const windowSql = windowClauses.length ? ' AND ' + windowClauses.join(' AND ') : '';
  const sql = `
    SELECT priority AS label, priority AS key, COUNT(*)::int AS count
    FROM vocs
    WHERE ${scopeSql}${windowSql}
    GROUP BY priority
    ORDER BY count DESC, priority ASC
  `;
  const res = await pool.query(sql, [...scopeValues, ...windowValues]);
  return res.rows.map((r) => ({ label: r.label, count: Number(r.count), key: r.key }));
}

/**
 * Count VOCs grouped by voc_type within scope+window.
 * Joins voc_types for the display name.
 */
export async function distributionByVocType(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<DistributionRaw[]> {
  const pool = getPool();
  // Rebuild scope predicates with v. alias (cannot use scopePredicates helper — needs alias).
  const scopeClausesV = ['v.deleted_at IS NULL'];
  const scopeValuesV: unknown[] = [];
  let j = 1;
  if (scope.systemId)   { scopeClausesV.push(`v.system_id = $${j++}`);   scopeValuesV.push(scope.systemId);   }
  if (scope.menuId)     { scopeClausesV.push(`v.menu_id = $${j++}`);      scopeValuesV.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClausesV.push(`v.assignee_id = $${j++}`);  scopeValuesV.push(scope.assigneeId); }
  const jWindow = j;
  const windowClausesV: string[] = [];
  const windowValuesV: unknown[] = [];
  let k = jWindow;
  if (start) { windowClausesV.push(`v.created_at >= $${k++}`); windowValuesV.push(start); }
  if (end)   { windowClausesV.push(`v.created_at < $${k++}`);  windowValuesV.push(end);   }
  const windowSqlV = windowClausesV.length ? ' AND ' + windowClausesV.join(' AND ') : '';
  const sql2 = `
    SELECT
      COALESCE(vt.name, v.voc_type_id::text) AS label,
      v.voc_type_id::text AS key,
      COUNT(*)::int AS count
    FROM vocs v
    LEFT JOIN voc_types vt ON vt.id = v.voc_type_id
    WHERE ${scopeClausesV.join(' AND ')}${windowSqlV}
    GROUP BY v.voc_type_id, vt.name
    ORDER BY count DESC, label ASC
  `;
  const res = await pool.query(sql2, [...scopeValuesV, ...windowValuesV]);
  return res.rows.map((r) => ({ label: r.label ?? r.key, count: Number(r.count), key: r.key ?? '' }));
}

/**
 * Count VOCs by tag. Returns all tag counts ordered by count DESC, tag_name ASC.
 * Caller applies top-6 + 기타 logic.
 */
export async function distributionByTag(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<DistributionRaw[]> {
  const pool = getPool();
  const scopeClausesV = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClausesV.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClausesV.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClausesV.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClausesV.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClausesV.push(`v.created_at < $${i++}`);  allValues.push(end);   }
  const sql = `
    SELECT
      t.name AS label,
      t.id::text AS key,
      COUNT(*)::int AS count
    FROM vocs v
    JOIN voc_tag_links vtl ON vtl.voc_id = v.id
    JOIN tags t ON t.id = vtl.tag_id
    WHERE ${scopeClausesV.join(' AND ')}
    GROUP BY t.id, t.name
    ORDER BY count DESC, t.name ASC
  `;
  const res = await pool.query(sql, allValues);
  return res.rows.map((r) => ({ label: r.label, count: Number(r.count), key: r.key }));
}

// ── priority-status-matrix ────────────────────────────────────────────────────

export interface MatrixRaw {
  priority: string;
  status: string;
  count: number;
}

export async function matrixCounts(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<MatrixRaw[]> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues, nextIdx } = scopePredicates(scope, 1);
  const windowClauses: string[] = [];
  const windowValues: unknown[] = [];
  let i = nextIdx;
  if (start) { windowClauses.push(`created_at >= $${i++}`); windowValues.push(start); }
  if (end)   { windowClauses.push(`created_at < $${i++}`);  windowValues.push(end);   }
  const windowSql = windowClauses.length ? ' AND ' + windowClauses.join(' AND ') : '';
  const sql = `
    SELECT priority, status, COUNT(*)::int AS count
    FROM vocs
    WHERE ${scopeSql}${windowSql}
    GROUP BY priority, status
  `;
  const res = await pool.query(sql, [...scopeValues, ...windowValues]);
  return res.rows.map((r) => ({ priority: r.priority, status: r.status, count: Number(r.count) }));
}

// ── heatmap ───────────────────────────────────────────────────────────────────

export interface HeatmapSystemRow {
  id: string;
  name: string;
  /** column values matching the headers order */
  values: number[];
  total: number;
}

export interface HeatmapRawResult {
  headers: string[];
  systemRows: HeatmapSystemRow[];
  /** null means no column-level aggregation needed (caller handles) */
  totalValues: number[] | null;
}

/**
 * Heatmap grouped by status (xAxis=status).
 * Y-axis: systems (level 1) or menus of systemId (level 2) or single menu (level 3 → use level 2 query w/ menuId).
 */
export async function heatmapByStatus(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<HeatmapRawResult> {
  const STATUSES = ['접수', '검토중', '처리중', '완료', '드랍'];
  const pool = getPool();

  const allValues: unknown[] = [];
  const scopeClauses = ['v.deleted_at IS NULL'];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }

  let yField: string;
  let joinClause: string;
  if (scope.menuId) {
    // Level 3: single menu row
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else if (scope.systemId) {
    // Level 2: menus within the system
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else {
    // Level 1: all systems
    yField = 's.id::text AS row_id, s.name AS row_name';
    joinClause = 'JOIN systems s ON s.id = v.system_id';
  }

  const sql = `
    SELECT ${yField}, v.status, COUNT(*)::int AS count
    FROM vocs v
    ${joinClause}
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY row_id, row_name, v.status
  `;
  const res = await pool.query(sql, allValues);

  const rowMap = new Map<string, { id: string; name: string; byStatus: Record<string, number> }>();
  for (const r of res.rows) {
    if (!rowMap.has(r.row_id)) {
      rowMap.set(r.row_id, { id: r.row_id, name: r.row_name, byStatus: {} });
    }
    rowMap.get(r.row_id)!.byStatus[r.status] = Number(r.count);
  }

  const systemRows: HeatmapSystemRow[] = [];
  const totalByStatus: Record<string, number> = {};
  for (const STATUSES_item of STATUSES) totalByStatus[STATUSES_item] = 0;

  for (const row of rowMap.values()) {
    const values = STATUSES.map((s) => row.byStatus[s] ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    systemRows.push({ id: row.id, name: row.name, values, total });
    for (let idx = 0; idx < STATUSES.length; idx++) {
      const s = STATUSES[idx]!;
      totalByStatus[s] = (totalByStatus[s] ?? 0) + (values[idx] ?? 0);
    }
  }

  const totalValues = STATUSES.map((s) => totalByStatus[s] ?? 0);
  return { headers: STATUSES, systemRows, totalValues };
}

/**
 * Heatmap grouped by priority.
 */
export async function heatmapByPriority(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<HeatmapRawResult> {
  const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
  const pool = getPool();

  const allValues: unknown[] = [];
  const scopeClauses = ['v.deleted_at IS NULL'];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }

  let yField: string;
  let joinClause: string;
  if (scope.menuId) {
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else if (scope.systemId) {
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else {
    yField = 's.id::text AS row_id, s.name AS row_name';
    joinClause = 'JOIN systems s ON s.id = v.system_id';
  }

  const sql = `
    SELECT ${yField}, v.priority, COUNT(*)::int AS count
    FROM vocs v
    ${joinClause}
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY row_id, row_name, v.priority
  `;
  const res = await pool.query(sql, allValues);

  const rowMap = new Map<string, { id: string; name: string; byPriority: Record<string, number> }>();
  for (const r of res.rows) {
    if (!rowMap.has(r.row_id)) {
      rowMap.set(r.row_id, { id: r.row_id, name: r.row_name, byPriority: {} });
    }
    rowMap.get(r.row_id)!.byPriority[r.priority] = Number(r.count);
  }

  const totalByPriority: Record<string, number> = {};
  for (const p of PRIORITIES) totalByPriority[p] = 0;

  const systemRows: HeatmapSystemRow[] = [];
  for (const row of rowMap.values()) {
    const values = PRIORITIES.map((p) => row.byPriority[p] ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    systemRows.push({ id: row.id, name: row.name, values, total });
    for (let idx = 0; idx < PRIORITIES.length; idx++) {
      const p = PRIORITIES[idx]!;
      totalByPriority[p] = (totalByPriority[p] ?? 0) + (values[idx] ?? 0);
    }
  }

  const totalValues = PRIORITIES.map((p) => totalByPriority[p] ?? 0);
  return { headers: PRIORITIES, systemRows, totalValues };
}

/**
 * Returns top-5 tags in scope (ORDER BY count DESC, tag_name ASC).
 */
export async function topTagsInScope(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
  limit = 5,
): Promise<Array<{ id: string; name: string }>> {
  const pool = getPool();
  const allValues: unknown[] = [];
  const scopeClauses = ['v.deleted_at IS NULL'];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }
  allValues.push(limit);
  const sql = `
    SELECT t.id::text, t.name, COUNT(*)::int AS count
    FROM vocs v
    JOIN voc_tag_links vtl ON vtl.voc_id = v.id
    JOIN tags t ON t.id = vtl.tag_id
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY t.id, t.name
    ORDER BY count DESC, t.name ASC
    LIMIT $${i}
  `;
  const res = await pool.query(sql, allValues);
  return res.rows.map((r) => ({ id: r.id, name: r.name }));
}

/**
 * Heatmap grouped by tag (top-5 tags = columns).
 */
export async function heatmapByTag(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<HeatmapRawResult> {
  const pool = getPool();
  const topTags = await topTagsInScope(scope, start, end, 5);
  if (topTags.length === 0) {
    return { headers: [], systemRows: [], totalValues: [] };
  }

  const allValues: unknown[] = [];
  const scopeClauses = ['v.deleted_at IS NULL'];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }

  // Tag id filter
  const tagIds = topTags.map((t) => t.id);
  allValues.push(tagIds);
  const tagIdxParam = `$${i++}`;

  let yField: string;
  let joinClause: string;
  if (scope.menuId) {
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else if (scope.systemId) {
    yField = 'm.id::text AS row_id, m.name AS row_name';
    joinClause = 'JOIN menus m ON m.id = v.menu_id';
  } else {
    yField = 's.id::text AS row_id, s.name AS row_name';
    joinClause = 'JOIN systems s ON s.id = v.system_id';
  }

  const sql = `
    SELECT ${yField}, t.id::text AS tag_id, COUNT(*)::int AS count
    FROM vocs v
    ${joinClause}
    JOIN voc_tag_links vtl ON vtl.voc_id = v.id
    JOIN tags t ON t.id = vtl.tag_id AND t.id = ANY(${tagIdxParam}::uuid[])
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY row_id, row_name, t.id
  `;
  const res = await pool.query(sql, allValues);

  const rowMap = new Map<string, { id: string; name: string; byTag: Record<string, number> }>();
  for (const r of res.rows) {
    if (!rowMap.has(r.row_id)) {
      rowMap.set(r.row_id, { id: r.row_id, name: r.row_name, byTag: {} });
    }
    rowMap.get(r.row_id)!.byTag[r.tag_id] = Number(r.count);
  }

  const totalByTag: Record<string, number> = {};
  for (const t of topTags) totalByTag[t.id] = 0;

  const systemRows: HeatmapSystemRow[] = [];
  for (const row of rowMap.values()) {
    const values = topTags.map((t) => row.byTag[t.id] ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    systemRows.push({ id: row.id, name: row.name, values, total });
    for (let idx = 0; idx < topTags.length; idx++) {
      const tag = topTags[idx]!;
      totalByTag[tag.id] = (totalByTag[tag.id] ?? 0) + (values[idx] ?? 0);
    }
  }

  const headers = topTags.map((t) => t.name);
  const totalValues = topTags.map((t) => totalByTag[t.id] ?? 0);
  return { headers, systemRows, totalValues };
}

// ── weekly-trend ──────────────────────────────────────────────────────────────

export interface WeekCounts {
  newCount: number;
  enteredInProgressCount: number;
  doneCount: number;
}

/**
 * Count VOCs for a single ISO week window [weekStart, weekEnd).
 * All three series in one query for efficiency.
 */
export async function weekCounts(
  scope: MetricsScope,
  weekStart: Date,
  weekEnd: Date,
): Promise<WeekCounts> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues } = scopePredicates(scope, 5);
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE created_at >= $1 AND created_at < $2)::int AS new_count,
      COUNT(*) FILTER (
        WHERE status = ANY($3)
          AND status_changed_at >= $1
          AND status_changed_at < $2
      )::int AS entered_in_progress,
      COUNT(*) FILTER (
        WHERE status = ANY($4)
          AND status_changed_at >= $1
          AND status_changed_at < $2
      )::int AS done_count
    FROM vocs
    WHERE ${scopeSql}
  `;
  const res = await pool.query(sql, [
    weekStart,
    weekEnd,
    ['검토중', '처리중'],
    ['완료', '드랍'],
    ...scopeValues,
  ]);
  const r = res.rows[0] ?? { new_count: 0, entered_in_progress: 0, done_count: 0 };
  return {
    newCount: Number(r.new_count),
    enteredInProgressCount: Number(r.entered_in_progress),
    doneCount: Number(r.done_count),
  };
}

// ── processing-speed ──────────────────────────────────────────────────────────

export interface ProcessingSpeedRaw {
  id: string | null;
  name: string;
  avg_days: number | null;
  completed_count: number;
  sla_pass: number;
  sla_eligible: number;
  missing_due_date: number;
}

/**
 * Processing speed for dim=all — single aggregate row.
 */
export async function processingSpeedAll(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<ProcessingSpeedRaw> {
  const pool = getPool();
  const { sql: scopeSql, values: scopeValues, nextIdx } = scopePredicates(scope, 1);
  const windowClauses: string[] = [];
  const windowValues: unknown[] = [];
  let i = nextIdx;
  if (start) { windowClauses.push(`status_changed_at >= $${i++}`); windowValues.push(start); }
  if (end)   { windowClauses.push(`status_changed_at < $${i++}`);  windowValues.push(end);   }
  const windowSql = windowClauses.length ? ' AND ' + windowClauses.join(' AND ') : '';
  const sql = `
    SELECT
      AVG(EXTRACT(EPOCH FROM (status_changed_at - created_at)) / 86400.0) AS avg_days,
      COUNT(*)::int AS completed_count,
      COUNT(*) FILTER (WHERE due_date IS NOT NULL AND status_changed_at::date <= due_date)::int AS sla_pass,
      COUNT(*) FILTER (WHERE due_date IS NOT NULL)::int AS sla_eligible,
      COUNT(*) FILTER (WHERE due_date IS NULL)::int AS missing_due_date
    FROM vocs
    WHERE ${scopeSql} AND status = '완료'${windowSql}
  `;
  const res = await pool.query(sql, [...scopeValues, ...windowValues]);
  const r = res.rows[0] ?? {};
  return {
    id: null,
    name: '전체',
    avg_days: r.avg_days === null || r.avg_days === undefined ? null : Number(r.avg_days),
    completed_count: Number(r.completed_count ?? 0),
    sla_pass: Number(r.sla_pass ?? 0),
    sla_eligible: Number(r.sla_eligible ?? 0),
    missing_due_date: Number(r.missing_due_date ?? 0),
  };
}

/**
 * Processing speed grouped by system.
 */
export async function processingSpeedBySystem(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<ProcessingSpeedRaw[]> {
  const pool = getPool();
  const scopeClauses = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.status_changed_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.status_changed_at < $${i++}`);  allValues.push(end);   }
  const sql = `
    SELECT
      s.id::text AS id,
      s.name,
      AVG(EXTRACT(EPOCH FROM (v.status_changed_at - v.created_at)) / 86400.0) AS avg_days,
      COUNT(*)::int AS completed_count,
      COUNT(*) FILTER (WHERE v.due_date IS NOT NULL AND v.status_changed_at::date <= v.due_date)::int AS sla_pass,
      COUNT(*) FILTER (WHERE v.due_date IS NOT NULL)::int AS sla_eligible,
      COUNT(*) FILTER (WHERE v.due_date IS NULL)::int AS missing_due_date
    FROM vocs v
    JOIN systems s ON s.id = v.system_id
    WHERE ${scopeClauses.join(' AND ')} AND v.status = '완료'
    GROUP BY s.id, s.name
    ORDER BY s.name ASC
  `;
  const res = await pool.query(sql, allValues);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    avg_days: r.avg_days === null || r.avg_days === undefined ? null : Number(r.avg_days),
    completed_count: Number(r.completed_count ?? 0),
    sla_pass: Number(r.sla_pass ?? 0),
    sla_eligible: Number(r.sla_eligible ?? 0),
    missing_due_date: Number(r.missing_due_date ?? 0),
  }));
}

/**
 * Processing speed grouped by menu.
 */
export async function processingSpeedByMenu(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<ProcessingSpeedRaw[]> {
  const pool = getPool();
  const scopeClauses = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.status_changed_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.status_changed_at < $${i++}`);  allValues.push(end);   }
  const sql = `
    SELECT
      m.id::text AS id,
      m.name,
      AVG(EXTRACT(EPOCH FROM (v.status_changed_at - v.created_at)) / 86400.0) AS avg_days,
      COUNT(*)::int AS completed_count,
      COUNT(*) FILTER (WHERE v.due_date IS NOT NULL AND v.status_changed_at::date <= v.due_date)::int AS sla_pass,
      COUNT(*) FILTER (WHERE v.due_date IS NOT NULL)::int AS sla_eligible,
      COUNT(*) FILTER (WHERE v.due_date IS NULL)::int AS missing_due_date
    FROM vocs v
    JOIN menus m ON m.id = v.menu_id
    WHERE ${scopeClauses.join(' AND ')} AND v.status = '완료'
    GROUP BY m.id, m.name
    ORDER BY m.name ASC
  `;
  const res = await pool.query(sql, allValues);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    avg_days: r.avg_days === null || r.avg_days === undefined ? null : Number(r.avg_days),
    completed_count: Number(r.completed_count ?? 0),
    sla_pass: Number(r.sla_pass ?? 0),
    sla_eligible: Number(r.sla_eligible ?? 0),
    missing_due_date: Number(r.missing_due_date ?? 0),
  }));
}

// ── assignee-stats ────────────────────────────────────────────────────────────

export interface AssigneeStatRaw {
  id: string | null;
  name: string;
  is_unassigned: boolean;
  values: number[];
  total: number;
}

export async function assigneeStatsByStatus(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<{ headers: string[]; rows: AssigneeStatRaw[] }> {
  const STATUSES = ['접수', '검토중', '처리중', '완료', '드랍'];
  const pool = getPool();
  const scopeClauses = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }
  const sql = `
    SELECT
      v.assignee_id::text AS assignee_id,
      u.name AS assignee_name,
      v.status,
      COUNT(*)::int AS count
    FROM vocs v
    LEFT JOIN users u ON u.id = v.assignee_id
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY v.assignee_id, u.name, v.status
  `;
  const res = await pool.query(sql, allValues);
  return buildAssigneeStatRows(res.rows, STATUSES);
}

export async function assigneeStatsByPriority(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<{ headers: string[]; rows: AssigneeStatRaw[] }> {
  const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
  const pool = getPool();
  const scopeClauses = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }
  const sql = `
    SELECT
      v.assignee_id::text AS assignee_id,
      u.name AS assignee_name,
      v.priority AS status,
      COUNT(*)::int AS count
    FROM vocs v
    LEFT JOIN users u ON u.id = v.assignee_id
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY v.assignee_id, u.name, v.priority
  `;
  const res = await pool.query(sql, allValues);
  return buildAssigneeStatRows(res.rows, PRIORITIES);
}

export async function assigneeStatsByTag(
  scope: MetricsScope,
  start: Date | null,
  end: Date | null,
): Promise<{ headers: string[]; rows: AssigneeStatRaw[] }> {
  const pool = getPool();
  const topTags = await topTagsInScope(scope, start, end, 5);
  if (topTags.length === 0) {
    return { headers: [], rows: [{ id: null, name: '미배정', is_unassigned: true, values: [], total: 0 }] };
  }

  const tagIds = topTags.map((t) => t.id);
  const scopeClauses = ['v.deleted_at IS NULL'];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  if (start) { scopeClauses.push(`v.created_at >= $${i++}`); allValues.push(start); }
  if (end)   { scopeClauses.push(`v.created_at < $${i++}`);  allValues.push(end);   }
  allValues.push(tagIds);
  const tagParam = `$${i++}`;

  const sql = `
    SELECT
      v.assignee_id::text AS assignee_id,
      u.name AS assignee_name,
      t.id::text AS status,
      COUNT(*)::int AS count
    FROM vocs v
    LEFT JOIN users u ON u.id = v.assignee_id
    JOIN voc_tag_links vtl ON vtl.voc_id = v.id
    JOIN tags t ON t.id = vtl.tag_id AND t.id = ANY(${tagParam}::uuid[])
    WHERE ${scopeClauses.join(' AND ')}
    GROUP BY v.assignee_id, u.name, t.id
  `;
  const res = await pool.query(sql, allValues);
  const headers = topTags.map((t) => t.name);
  const tagIdToIdx = new Map(topTags.map((t, idx) => [t.id, idx]));

  // Build rows indexed by tag id
  return buildAssigneeStatRowsWithHeaders(res.rows, headers, tagIdToIdx);
}

function buildAssigneeStatRows(
  dbRows: Array<{ assignee_id: string | null; assignee_name: string | null; status: string; count: number }>,
  columns: string[],
): { headers: string[]; rows: AssigneeStatRaw[] } {
  const rowMap = new Map<string | null, { id: string | null; name: string; byCols: Record<string, number> }>();
  for (const r of dbRows) {
    const key = r.assignee_id ?? null;
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        id: key,
        name: r.assignee_name ?? '미배정',
        byCols: {},
      });
    }
    rowMap.get(key)!.byCols[r.status] = Number(r.count);
  }
  // Ensure 미배정 always present
  if (!rowMap.has(null)) {
    rowMap.set(null, { id: null, name: '미배정', byCols: {} });
  }

  const rows: AssigneeStatRaw[] = [];
  for (const [key, row] of rowMap.entries()) {
    const values = columns.map((c) => row.byCols[c] ?? 0);
    const total = values.reduce((a, b) => a + b, 0);
    rows.push({ id: row.id, name: row.name, is_unassigned: key === null, values, total });
  }
  return { headers: columns, rows };
}

function buildAssigneeStatRowsWithHeaders(
  dbRows: Array<{ assignee_id: string | null; assignee_name: string | null; status: string; count: number }>,
  headers: string[],
  colKeyToIdx: Map<string, number>,
): { headers: string[]; rows: AssigneeStatRaw[] } {
  const rowMap = new Map<string | null, { id: string | null; name: string; values: number[] }>();
  for (const r of dbRows) {
    const key = r.assignee_id ?? null;
    if (!rowMap.has(key)) {
      rowMap.set(key, { id: key, name: r.assignee_name ?? '미배정', values: new Array(headers.length).fill(0) });
    }
    const idx = colKeyToIdx.get(r.status);
    if (idx !== undefined) {
      const vals = rowMap.get(key)!.values;
      vals[idx] = (vals[idx] ?? 0) + Number(r.count);
    }
  }
  if (!rowMap.has(null)) {
    rowMap.set(null, { id: null, name: '미배정', values: new Array(headers.length).fill(0) });
  }
  const rows: AssigneeStatRaw[] = [];
  for (const [key, row] of rowMap.entries()) {
    const total = row.values.reduce((a, b) => a + b, 0);
    rows.push({ id: row.id, name: row.name, is_unassigned: key === null, values: row.values, total });
  }
  return { headers, rows };
}

// ── aging-vocs ────────────────────────────────────────────────────────────────

export interface AgingVocRaw {
  voc_id: string;
  issue_code: string;
  title: string;
  priority: string;
  elapsed_days: number;
  system_name: string | null;
  menu_name: string | null;
}

export async function agingVocs(
  scope: MetricsScope,
  dim: 'all' | 'system',
  limit: number,
): Promise<AgingVocRaw[]> {
  const pool = getPool();
  const scopeClauses = [
    "v.deleted_at IS NULL",
    "v.status = ANY('{접수,검토중,처리중}'::text[])",
  ];
  const allValues: unknown[] = [];
  let i = 1;
  if (scope.systemId)   { scopeClauses.push(`v.system_id = $${i++}`);   allValues.push(scope.systemId);   }
  if (scope.menuId)     { scopeClauses.push(`v.menu_id = $${i++}`);      allValues.push(scope.menuId);     }
  if (scope.assigneeId) { scopeClauses.push(`v.assignee_id = $${i++}`);  allValues.push(scope.assigneeId); }
  allValues.push(limit);

  const joinSystems = dim === 'all' ? 'LEFT JOIN systems s ON s.id = v.system_id' : '';
  const joinMenus = dim === 'system' ? 'LEFT JOIN menus m ON m.id = v.menu_id' : '';
  const systemNameCol = dim === 'all' ? 's.name' : 'NULL';
  const menuNameCol = dim === 'system' ? 'm.name' : 'NULL';

  const sql = `
    SELECT
      v.id::text AS voc_id,
      v.issue_code,
      v.title,
      v.priority,
      (CURRENT_DATE - v.created_at::date)::int AS elapsed_days,
      ${systemNameCol} AS system_name,
      ${menuNameCol} AS menu_name
    FROM vocs v
    ${joinSystems}
    ${joinMenus}
    WHERE ${scopeClauses.join(' AND ')}
    ORDER BY elapsed_days DESC
    LIMIT $${i}
  `;
  const res = await pool.query(sql, allValues);
  return res.rows.map((r) => ({
    voc_id: r.voc_id,
    issue_code: r.issue_code,
    title: r.title,
    priority: r.priority,
    elapsed_days: Number(r.elapsed_days),
    system_name: r.system_name ?? null,
    menu_name: r.menu_name ?? null,
  }));
}
