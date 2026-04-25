import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const dashboardRouter = Router();

// ── Auth middleware helpers ──────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  next();
}

function requireManager(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as AuthUser | undefined;
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    res.status(403).json({ error: 'FORBIDDEN' });
    return;
  }
  next();
}

// ── Filter helpers ───────────────────────────────────────────────────────────

interface DashboardFilters {
  systemId?: string;
  menuId?: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

function extractFilters(query: Record<string, string | undefined>): DashboardFilters {
  return {
    systemId: query.systemId || undefined,
    menuId: query.menuId || undefined,
    assigneeId: query.assigneeId || undefined,
    startDate: query.startDate || undefined,
    endDate: query.endDate || undefined,
  };
}

function buildWhereClause(
  filters: DashboardFilters,
  params: unknown[],
  startIdx: number,
): { clause: string; nextIdx: number } {
  const conditions = ['v.deleted_at IS NULL'];
  let idx = startIdx;

  if (filters.systemId) {
    conditions.push(`v.system_id = $${idx++}`);
    params.push(filters.systemId);
  }
  if (filters.menuId) {
    conditions.push(`v.menu_id = $${idx++}`);
    params.push(filters.menuId);
  }
  if (filters.assigneeId === 'unassigned') {
    conditions.push('v.assignee_id IS NULL');
  } else if (filters.assigneeId) {
    conditions.push(`v.assignee_id = $${idx++}`);
    params.push(filters.assigneeId);
  }
  if (filters.startDate) {
    conditions.push(`v.created_at >= $${idx++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`v.created_at <= $${idx++}`);
    params.push(filters.endDate);
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, nextIdx: idx };
}

// ── GET /summary ─────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/summary',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) AS total_voc,
          COUNT(CASE WHEN v.status IN ('접수','검토중','처리중') THEN 1 END) AS unresolved,
          COUNT(CASE WHEN v.created_at >= now() - interval '7 days' THEN 1 END) AS new_this_week,
          COUNT(CASE WHEN v.status IN ('완료','드랍') AND v.updated_at >= now() - interval '7 days' THEN 1 END) AS completed_this_week,
          COUNT(CASE WHEN v.priority IN ('urgent','high') AND v.status IN ('접수','검토중','처리중') THEN 1 END) AS urgent_high_unresolved,
          COUNT(CASE WHEN v.status IN ('접수','검토중','처리중') AND v.created_at <= now() - interval '14 days' THEN 1 END) AS overdue_14d,
          COUNT(CASE WHEN v.status IN ('완료','드랍') THEN 1 END) AS completed_total
        FROM vocs v
        ${clause}`,
        params,
      );

      const row = result.rows[0];
      const total = parseInt(row.total_voc, 10);
      const completed = parseInt(row.completed_this_week, 10);
      const resolutionRate = total > 0 ? (completed / total) * 100 : 0;

      res.json({
        total_voc: total,
        unresolved: parseInt(row.unresolved, 10),
        new_this_week: parseInt(row.new_this_week, 10),
        completed_this_week: completed,
        avg_resolution_hours: null,
        resolution_rate: resolutionRate,
        urgent_high_unresolved: parseInt(row.urgent_high_unresolved, 10),
        overdue_14d: parseInt(row.overdue_14d, 10),
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/summary failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /distribution ────────────────────────────────────────────────────────

dashboardRouter.get(
  '/distribution',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query as { type?: string };
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      let sql: string;

      if (type === 'tag') {
        sql = `
          SELECT t.name AS label, COUNT(*) AS count
          FROM vocs v
          JOIN voc_tags vt ON v.id = vt.voc_id
          JOIN tags t ON vt.tag_id = t.id
          ${clause}
          GROUP BY t.name
          ORDER BY count DESC`;
      } else {
        const col =
          type === 'priority' ? 'v.priority' : type === 'voc_type' ? 'v.voc_type_id' : 'v.status';
        sql = `
          SELECT ${col} AS label, COUNT(*) AS count
          FROM vocs v
          ${clause}
          GROUP BY ${col}
          ORDER BY count DESC`;
      }

      const result = await pool.query(sql, params);
      res.json(result.rows.map((r) => ({ label: r.label, count: parseInt(r.count, 10) })));
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/distribution failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /priority-status-matrix ───────────────────────────────────────────────

dashboardRouter.get(
  '/priority-status-matrix',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      const result = await pool.query(
        `SELECT v.priority, v.status, COUNT(*) AS count
         FROM vocs v
         ${clause}
         GROUP BY v.priority, v.status
         ORDER BY v.priority, v.status`,
        params,
      );

      res.json({
        rows: result.rows.map((r) => ({
          priority: r.priority,
          status: r.status,
          count: parseInt(r.count, 10),
        })),
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/priority-status-matrix failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /heatmap ─────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/heatmap',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { xAxis = 'status' } = req.query as { xAxis?: string };
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      let yGroupCol: string;

      if (filters.systemId) {
        yGroupCol = 'v.menu_id';
      } else {
        yGroupCol = 'v.system_id';
      }

      let xLabelCol: string;
      let joinClause = '';

      if (xAxis === 'tag') {
        xLabelCol = 't.name';
        joinClause = 'JOIN voc_tags vt ON v.id = vt.voc_id JOIN tags t ON vt.tag_id = t.id';
      } else if (xAxis === 'priority') {
        xLabelCol = 'v.priority';
      } else {
        xLabelCol = 'v.status';
      }

      const result = await pool.query(
        `SELECT ${yGroupCol} AS y_label, ${xLabelCol} AS x_label, COUNT(*) AS count
         FROM vocs v
         ${joinClause}
         ${clause}
         GROUP BY ${yGroupCol}, ${xLabelCol}
         ORDER BY ${yGroupCol}, ${xLabelCol}`,
        params,
      );

      const xValues = [...new Set(result.rows.map((r) => r.x_label as string))];

      res.json({
        rows: result.rows.map((r) => ({
          y_label: r.y_label,
          x_label: r.x_label,
          count: parseInt(r.count, 10),
        })),
        x_values: xValues,
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/heatmap failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /weekly-trend ─────────────────────────────────────────────────────────

dashboardRouter.get(
  '/weekly-trend',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const weeksRaw = req.query.weeks as string | undefined;
    const weeks = Math.min(52, Math.max(1, parseInt(weeksRaw ?? '12', 10) || 12));
    const days = weeks * 7;

    try {
      const result = await pool.query(
        `SELECT
          created_at AS week,
          COUNT(*) AS new_count,
          COUNT(CASE WHEN status IN ('완료','드랍') THEN 1 END) AS completed_count,
          COUNT(CASE WHEN status IN ('검토중','처리중') THEN 1 END) AS in_progress_count
         FROM vocs
         WHERE deleted_at IS NULL AND created_at >= now() - interval '${days} days'
         GROUP BY created_at
         ORDER BY created_at`,
      );

      res.json({
        weeks: result.rows.map((r) => ({
          week: r.week,
          new: parseInt(r.new_count, 10),
          in_progress: parseInt(r.in_progress_count, 10),
          completed: parseInt(r.completed_count, 10),
        })),
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/weekly-trend failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /tag-distribution ─────────────────────────────────────────────────────

dashboardRouter.get(
  '/tag-distribution',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const limitRaw = req.query.limit as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw ?? '10', 10) || 10));
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause, nextIdx } = buildWhereClause(filters, params, 1);

    try {
      const result = await pool.query(
        `SELECT t.name AS tag, COUNT(*) AS count
         FROM vocs v
         JOIN voc_tags vt ON v.id = vt.voc_id
         JOIN tags t ON vt.tag_id = t.id
         ${clause}
         GROUP BY t.name
         ORDER BY count DESC
         LIMIT $${nextIdx}`,
        [...params, limit],
      );

      res.json(result.rows.map((r) => ({ tag: r.tag, count: parseInt(r.count, 10) })));
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/tag-distribution failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /system-overview ──────────────────────────────────────────────────────

dashboardRouter.get(
  '/system-overview',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      const result = await pool.query(
        `SELECT
          s.id AS system_id,
          s.name AS system_name,
          COUNT(*) AS total,
          COUNT(CASE WHEN v.status IN ('접수','검토중','처리중') THEN 1 END) AS unresolved,
          COUNT(CASE WHEN v.status IN ('완료','드랍') THEN 1 END) AS completed
         FROM vocs v
         JOIN systems s ON v.system_id = s.id
         ${clause}
         GROUP BY s.id, s.name
         ORDER BY total DESC`,
        params,
      );

      res.json(
        result.rows.map((r) => ({
          system_id: r.system_id,
          system_name: r.system_name,
          total: parseInt(r.total, 10),
          unresolved: parseInt(r.unresolved, 10),
          completed: parseInt(r.completed, 10),
        })),
      );
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/system-overview failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /assignee-stats ───────────────────────────────────────────────────────

dashboardRouter.get(
  '/assignee-stats',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { xAxis = 'status' } = req.query as { xAxis?: string };
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    try {
      let xLabelCol: string;
      let joinClause = 'LEFT JOIN users u ON v.assignee_id = u.id';

      if (xAxis === 'tag') {
        xLabelCol = 't.name';
        joinClause += ' JOIN voc_tags vt ON v.id = vt.voc_id JOIN tags t ON vt.tag_id = t.id';
      } else if (xAxis === 'priority') {
        xLabelCol = 'v.priority';
      } else {
        xLabelCol = 'v.status';
      }

      const result = await pool.query(
        `SELECT
          v.assignee_id,
          u.display_name AS assignee_name,
          ${xLabelCol} AS x_label,
          COUNT(*) AS count
         FROM vocs v
         ${joinClause}
         ${clause}
         GROUP BY v.assignee_id, u.display_name, ${xLabelCol}
         ORDER BY v.assignee_id, ${xLabelCol}`,
        params,
      );

      const xValues = [...new Set(result.rows.map((r) => r.x_label as string))];

      res.json({
        rows: result.rows.map((r) => ({
          assignee_id: r.assignee_id,
          assignee_name: r.assignee_name,
          x_label: r.x_label,
          count: parseInt(r.count, 10),
        })),
        x_values: xValues,
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/assignee-stats failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /processing-speed ─────────────────────────────────────────────────────

dashboardRouter.get(
  '/processing-speed',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    const SLA_HOURS: Record<string, number> = {
      urgent: 168,
      high: 336,
      medium: 720,
      low: 2160,
    };

    try {
      const completedClause = clause.replace(
        'WHERE v.deleted_at IS NULL',
        "WHERE v.deleted_at IS NULL AND v.status IN ('완료','드랍')",
      );

      const result = await pool.query(
        `SELECT
          v.priority,
          COUNT(*) AS total
         FROM vocs v
         ${completedClause}
         GROUP BY v.priority`,
        params,
      );

      res.json(
        result.rows.map((r) => {
          const slaHours = SLA_HOURS[r.priority] ?? 720;
          return {
            priority: r.priority,
            avg_hours: null,
            sla_hours: slaHours,
            compliance_rate: 0,
          };
        }),
      );
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/processing-speed failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /aging ────────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/aging',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause } = buildWhereClause(filters, params, 1);

    const unresolvedClause = clause.replace(
      'WHERE v.deleted_at IS NULL',
      "WHERE v.deleted_at IS NULL AND v.status IN ('접수','검토중','처리중')",
    );

    try {
      const result = await pool.query(
        `SELECT
          COUNT(CASE WHEN v.created_at >= now() - interval '7 days' THEN 1 END) AS le7,
          COUNT(CASE WHEN v.created_at < now() - interval '7 days' AND v.created_at >= now() - interval '30 days' THEN 1 END) AS d8to30,
          COUNT(CASE WHEN v.created_at < now() - interval '30 days' THEN 1 END) AS gt30
         FROM vocs v
         ${unresolvedClause}`,
        params,
      );

      const row = result.rows[0];
      res.json({
        le7: parseInt(row.le7, 10),
        d8to30: parseInt(row.d8to30, 10),
        gt30: parseInt(row.gt30, 10),
      });
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/aging failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /aging-vocs ───────────────────────────────────────────────────────────

dashboardRouter.get(
  '/aging-vocs',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const limitRaw = req.query.limit as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw ?? '10', 10) || 10));
    const filters = extractFilters(req.query as Record<string, string | undefined>);
    const params: unknown[] = [];
    const { clause, nextIdx } = buildWhereClause(filters, params, 1);

    const unresolvedClause = clause.replace(
      'WHERE v.deleted_at IS NULL',
      "WHERE v.deleted_at IS NULL AND v.status IN ('접수','검토중','처리중')",
    );

    try {
      const result = await pool.query(
        `SELECT v.id, v.title, v.created_at, v.priority, v.status, v.system_id
         FROM vocs v
         ${unresolvedClause}
         ORDER BY v.created_at ASC
         LIMIT $${nextIdx}`,
        [...params, limit],
      );

      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/aging-vocs failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /settings ─────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/settings',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;

    try {
      const result = await pool.query(
        `SELECT * FROM dashboard_settings WHERE user_id = $1
         UNION ALL
         SELECT * FROM dashboard_settings WHERE user_id IS NULL
         LIMIT 1`,
        [user.id],
      );

      if (result.rowCount === 0) {
        res.json({
          widget_order: [],
          widget_visibility: {},
          widget_sizes: {},
          default_date_range: '30d',
          heatmap_default_x_axis: 'status',
          locked_fields: [],
        });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/settings failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /menus ────────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/menus',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { systemId } = req.query as { systemId?: string };

    if (!systemId) {
      res.status(400).json({ error: 'MISSING_SYSTEM_ID' });
      return;
    }

    try {
      const result = await pool.query(
        `SELECT id, name FROM menus WHERE system_id = $1 AND is_archived = false ORDER BY name`,
        [systemId],
      );

      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/menus failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /assignees ────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/assignees',
  requireAuth,
  requireManager,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT id, display_name AS name, email
         FROM users
         WHERE role IN ('manager','admin') AND is_active = true
         ORDER BY display_name`,
      );

      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/assignees failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
