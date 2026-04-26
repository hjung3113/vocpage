import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth, requireManager } from '../middleware/auth';

export const dashboardRouter = Router();

// ── Filter helpers ───────────────────────────────────────────────────────────

interface DashboardFilters {
  systemId: string | null;
  menuId: string | null;
  assigneeId: string | null;
  startDate: string | null;
  endDate: string | null;
}

function extractFilters(query: Record<string, string | undefined>): DashboardFilters {
  return {
    systemId: query.systemId ?? null,
    menuId: query.menuId ?? null,
    assigneeId: query.assigneeId ?? null,
    startDate: query.startDate ?? null,
    endDate: query.endDate ?? null,
  };
}

// ── GET /summary ─────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/summary',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { systemId, menuId, assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const computeSummary = async (
        sd: string | null,
        ed: string | null,
      ): Promise<{
        total: number;
        unresolved: number;
        newThisWeek: number;
        doneThisWeek: number;
        avgProcessingDays: number;
        resolvedRate: number;
        urgentHighUnresolved: number;
        over14Days: number;
      }> => {
        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const mondayStr = monday.toISOString().slice(0, 10);

        const [
          totalR,
          unresolvedR,
          urgentHighR,
          over14R,
          avgR,
          doneCountR,
          newThisWeekR,
          doneThisWeekR,
        ] = await Promise.all([
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND ($1::date IS NULL OR created_at::date >= $1::date)
                 AND ($2::date IS NULL OR created_at::date <= $2::date)
                 AND ($3::text IS NULL OR system_id = $3)
                 AND ($4::text IS NULL OR menu_id = $4)
                 AND ($5::text IS NULL OR assignee_id = $5)`,
            [sd, ed, systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND status IN ('접수','검토중','처리중')
                 AND ($1::date IS NULL OR created_at::date >= $1::date)
                 AND ($2::date IS NULL OR created_at::date <= $2::date)
                 AND ($3::text IS NULL OR system_id = $3)
                 AND ($4::text IS NULL OR menu_id = $4)
                 AND ($5::text IS NULL OR assignee_id = $5)`,
            [sd, ed, systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND priority IN ('urgent','high')
                 AND status IN ('접수','검토중','처리중')
                 AND ($1::text IS NULL OR system_id = $1)
                 AND ($2::text IS NULL OR menu_id = $2)
                 AND ($3::text IS NULL OR assignee_id = $3)`,
            [systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND status IN ('접수','검토중','처리중')
                 AND created_at::date <= (NOW() - interval '14 days')::date
                 AND ($1::text IS NULL OR system_id = $1)
                 AND ($2::text IS NULL OR menu_id = $2)
                 AND ($3::text IS NULL OR assignee_id = $3)`,
            [systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric, 1), 0)::float AS avg
               FROM vocs
               WHERE deleted_at IS NULL
                 AND status = '완료'
                 AND ($1::date IS NULL OR updated_at::date >= $1::date)
                 AND ($2::date IS NULL OR updated_at::date <= $2::date)
                 AND ($3::text IS NULL OR system_id = $3)
                 AND ($4::text IS NULL OR menu_id = $4)
                 AND ($5::text IS NULL OR assignee_id = $5)`,
            [sd, ed, systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND status IN ('완료','드랍')
                 AND ($1::date IS NULL OR created_at::date >= $1::date)
                 AND ($2::date IS NULL OR created_at::date <= $2::date)
                 AND ($3::text IS NULL OR system_id = $3)
                 AND ($4::text IS NULL OR menu_id = $4)
                 AND ($5::text IS NULL OR assignee_id = $5)`,
            [sd, ed, systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND created_at::date >= $1::date
                 AND ($2::text IS NULL OR system_id = $2)
                 AND ($3::text IS NULL OR menu_id = $3)
                 AND ($4::text IS NULL OR assignee_id = $4)`,
            [mondayStr, systemId, menuId, assigneeId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
               WHERE deleted_at IS NULL
                 AND status IN ('완료','드랍')
                 AND updated_at::date >= $1::date
                 AND ($2::text IS NULL OR system_id = $2)
                 AND ($3::text IS NULL OR menu_id = $3)
                 AND ($4::text IS NULL OR assignee_id = $4)`,
            [mondayStr, systemId, menuId, assigneeId],
          ),
        ]);

        const total: number = totalR.rows[0].n;
        const doneCount: number = doneCountR.rows[0].n;
        const resolvedRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        return {
          total,
          unresolved: unresolvedR.rows[0].n as number,
          newThisWeek: newThisWeekR.rows[0].n as number,
          doneThisWeek: doneThisWeekR.rows[0].n as number,
          avgProcessingDays: avgR.rows[0].avg as number,
          resolvedRate,
          urgentHighUnresolved: urgentHighR.rows[0].n as number,
          over14Days: over14R.rows[0].n as number,
        };
      };

      const current = await computeSummary(startDate, endDate);

      // prevWeek: shift dates back 7 days if provided, else use same relative windows
      let prevSd: string | null = null;
      let prevEd: string | null = null;
      if (startDate) {
        const d = new Date(startDate);
        d.setDate(d.getDate() - 7);
        prevSd = d.toISOString().slice(0, 10);
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - 7);
        prevEd = d.toISOString().slice(0, 10);
      }
      const prevWeek = await computeSummary(prevSd, prevEd);

      res.json({ ...current, prevWeek });
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
    const { type = 'status' } = req.query as { type?: string };
    const { systemId, menuId, assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      let rows: { name: string; count: number }[];

      if (type === 'tag') {
        const r = await pool.query(
          `SELECT t.name, COUNT(vt.voc_id)::int AS count
           FROM tags t
           JOIN voc_tags vt ON t.id = vt.tag_id
           JOIN vocs v ON v.id = vt.voc_id
           WHERE v.deleted_at IS NULL
             AND ($1::text IS NULL OR v.system_id = $1)
             AND ($2::text IS NULL OR v.menu_id = $2)
             AND ($3::text IS NULL OR v.assignee_id = $3)
             AND ($4::date IS NULL OR v.created_at::date >= $4::date)
             AND ($5::date IS NULL OR v.created_at::date <= $5::date)
           GROUP BY t.name
           ORDER BY count DESC`,
          [systemId, menuId, assigneeId, startDate, endDate],
        );
        rows = r.rows as { name: string; count: number }[];
      } else if (type === 'voc_type') {
        const r = await pool.query(
          `SELECT vt.name, COUNT(v.id)::int AS count
           FROM voc_types vt
           LEFT JOIN vocs v ON v.voc_type_id = vt.id
             AND v.deleted_at IS NULL
             AND ($1::text IS NULL OR v.system_id = $1)
             AND ($2::text IS NULL OR v.menu_id = $2)
             AND ($3::text IS NULL OR v.assignee_id = $3)
             AND ($4::date IS NULL OR v.created_at::date >= $4::date)
             AND ($5::date IS NULL OR v.created_at::date <= $5::date)
           GROUP BY vt.name
           ORDER BY count DESC`,
          [systemId, menuId, assigneeId, startDate, endDate],
        );
        rows = r.rows as { name: string; count: number }[];
      } else {
        const col = type === 'priority' ? 'priority' : 'status';
        const r = await pool.query(
          `SELECT ${col} AS name, COUNT(*)::int AS count
           FROM vocs
           WHERE deleted_at IS NULL
             AND ($1::text IS NULL OR system_id = $1)
             AND ($2::text IS NULL OR menu_id = $2)
             AND ($3::text IS NULL OR assignee_id = $3)
             AND ($4::date IS NULL OR created_at::date >= $4::date)
             AND ($5::date IS NULL OR created_at::date <= $5::date)
           GROUP BY ${col}
           ORDER BY count DESC`,
          [systemId, menuId, assigneeId, startDate, endDate],
        );
        rows = r.rows as { name: string; count: number }[];
      }

      const total = rows.reduce((s, r) => s + r.count, 0);
      res.json(
        rows.map((r) => ({
          name: r.name,
          count: r.count,
          pct: total > 0 ? Math.round((r.count / total) * 100) : 0,
        })),
      );
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
    const { systemId, menuId, assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT priority, status, COUNT(*)::int AS count
         FROM vocs
         WHERE deleted_at IS NULL
           AND ($1::text IS NULL OR system_id = $1)
           AND ($2::text IS NULL OR menu_id = $2)
           AND ($3::text IS NULL OR assignee_id = $3)
           AND ($4::date IS NULL OR created_at::date >= $4::date)
           AND ($5::date IS NULL OR created_at::date <= $5::date)
         GROUP BY priority, status`,
        [systemId, menuId, assigneeId, startDate, endDate],
      );

      const statuses = ['접수', '검토중', '처리중', '완료', '드랍'];
      const priorities = ['urgent', 'high', 'medium', 'low'];
      const matrix: Record<string, Record<string, number>> = {};
      priorities.forEach((p) => {
        matrix[p] = {};
        statuses.forEach((s) => {
          matrix[p][s] = 0;
        });
      });
      (r.rows as { priority: string; status: string; count: number }[]).forEach((row) => {
        if (matrix[row.priority]) matrix[row.priority][row.status] = row.count;
      });

      res.json({
        rows: priorities.map((p) => ({ priority: p, status: matrix[p] })),
        statuses,
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
    const { systemId, assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      // X-axis values
      let xValues: string[];
      if (xAxis === 'status') {
        xValues = ['접수', '검토중', '처리중', '완료', '드랍'];
      } else if (xAxis === 'priority') {
        xValues = ['urgent', 'high', 'medium', 'low'];
      } else {
        const tagR = await pool.query('SELECT name FROM tags ORDER BY name');
        xValues = (tagR.rows as { name: string }[]).map((r) => r.name);
      }

      // Y-axis: menus if systemId set, else systems
      interface YRow {
        id: string;
        name: string;
      }
      let yRows: YRow[];
      if (systemId) {
        const r = await pool.query(
          `SELECT id, name FROM menus WHERE system_id = $1 ORDER BY name`,
          [systemId],
        );
        yRows = r.rows as YRow[];
      } else {
        const r = await pool.query(`SELECT id, name FROM systems ORDER BY name`);
        yRows = r.rows as YRow[];
      }

      const filterCol = systemId ? 'menu_id' : 'system_id';

      const results: { id: string; name: string; values: number[]; total: number }[] = [];

      for (const yRow of yRows) {
        let counts: number[];

        if (xAxis === 'tag') {
          const r = await pool.query(
            `SELECT t.name AS xval, COUNT(DISTINCT v.id)::int AS count
             FROM vocs v
             JOIN voc_tags vt ON v.id = vt.voc_id
             JOIN tags t ON t.id = vt.tag_id
             WHERE v.deleted_at IS NULL
               AND v.${filterCol} = $1
               AND ($2::text IS NULL OR v.assignee_id = $2)
               AND ($3::date IS NULL OR v.created_at::date >= $3::date)
               AND ($4::date IS NULL OR v.created_at::date <= $4::date)
             GROUP BY t.name`,
            [yRow.id, assigneeId, startDate, endDate],
          );
          const cmap: Record<string, number> = {};
          (r.rows as { xval: string; count: number }[]).forEach((rr) => {
            cmap[rr.xval] = rr.count;
          });
          counts = xValues.map((x) => cmap[x] ?? 0);
        } else {
          const col = xAxis === 'priority' ? 'priority' : 'status';
          const r = await pool.query(
            `SELECT ${col} AS xval, COUNT(*)::int AS count
             FROM vocs
             WHERE deleted_at IS NULL
               AND ${filterCol} = $1
               AND ($2::text IS NULL OR assignee_id = $2)
               AND ($3::date IS NULL OR created_at::date >= $3::date)
               AND ($4::date IS NULL OR created_at::date <= $4::date)
             GROUP BY ${col}`,
            [yRow.id, assigneeId, startDate, endDate],
          );
          const cmap: Record<string, number> = {};
          (r.rows as { xval: string; count: number }[]).forEach((rr) => {
            cmap[rr.xval] = rr.count;
          });
          counts = xValues.map((x) => cmap[x] ?? 0);
        }

        results.push({
          id: yRow.id,
          name: yRow.name,
          values: counts,
          total: counts.reduce((a, b) => a + b, 0),
        });
      }

      const totalRow = xValues.map((_, i) => results.reduce((s, r) => s + r.values[i], 0));
      res.json({ headers: xValues, totalRow, rows: results });
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
    const { systemId, menuId } = extractFilters(req.query as Record<string, string | undefined>);

    try {
      const weekLabels: string[] = [];
      const newCounts: number[] = [];
      const inProgressCounts: number[] = [];
      const doneCounts: number[] = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date();
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = (dayOfWeek + 6) % 7;
        weekStart.setDate(weekStart.getDate() - daysToMonday - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const s = weekStart.toISOString().slice(0, 10);
        const e = weekEnd.toISOString().slice(0, 10);
        const label = `W${weeks - i}`;

        const [newR, inProgressR, doneR] = await Promise.all([
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
             WHERE deleted_at IS NULL
               AND created_at::date BETWEEN $1 AND $2
               AND ($3::text IS NULL OR system_id = $3)
               AND ($4::text IS NULL OR menu_id = $4)`,
            [s, e, systemId, menuId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
             WHERE deleted_at IS NULL
               AND status IN ('검토중','처리중')
               AND created_at::date <= $2
               AND ($3::text IS NULL OR system_id = $3)
               AND ($4::text IS NULL OR menu_id = $4)`,
            [s, e, systemId, menuId],
          ),
          pool.query(
            `SELECT COUNT(*)::int AS n FROM vocs
             WHERE deleted_at IS NULL
               AND status IN ('완료','드랍')
               AND updated_at::date BETWEEN $1 AND $2
               AND ($3::text IS NULL OR system_id = $3)
               AND ($4::text IS NULL OR menu_id = $4)`,
            [s, e, systemId, menuId],
          ),
        ]);

        weekLabels.push(label);
        newCounts.push(newR.rows[0].n as number);
        inProgressCounts.push(inProgressR.rows[0].n as number);
        doneCounts.push(doneR.rows[0].n as number);
      }

      res.json({
        weeks: weekLabels,
        series: { new: newCounts, inProgress: inProgressCounts, done: doneCounts },
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
    const { systemId, menuId, assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT t.name, COUNT(vt.voc_id)::int AS count
         FROM tags t
         JOIN voc_tags vt ON t.id = vt.tag_id
         JOIN vocs v ON v.id = vt.voc_id
         WHERE v.deleted_at IS NULL
           AND ($1::text IS NULL OR v.system_id = $1)
           AND ($2::text IS NULL OR v.menu_id = $2)
           AND ($3::text IS NULL OR v.assignee_id = $3)
           AND ($4::date IS NULL OR v.created_at::date >= $4::date)
           AND ($5::date IS NULL OR v.created_at::date <= $5::date)
         GROUP BY t.name
         ORDER BY count DESC
         LIMIT $6`,
        [systemId, menuId, assigneeId, startDate, endDate, limit],
      );

      res.json(
        (r.rows as { name: string; count: number }[]).map((row) => ({
          name: row.name,
          count: row.count,
        })),
      );
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
    const { assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT s.id, s.name, v.status, COUNT(v.id)::int AS count
         FROM systems s
         LEFT JOIN vocs v ON v.system_id = s.id
           AND v.deleted_at IS NULL
           AND ($1::text IS NULL OR v.assignee_id = $1)
           AND ($2::date IS NULL OR v.created_at::date >= $2)
           AND ($3::date IS NULL OR v.created_at::date <= $3)
         GROUP BY s.id, s.name, v.status
         ORDER BY s.name`,
        [assigneeId, startDate, endDate],
      );

      const systemMap: Record<
        string,
        { id: string; name: string; status: Record<string, number>; total: number }
      > = {};
      (r.rows as { id: string; name: string; status: string | null; count: number }[]).forEach(
        (row) => {
          if (!systemMap[row.id]) {
            systemMap[row.id] = { id: row.id, name: row.name, status: {}, total: 0 };
          }
          if (row.status) {
            systemMap[row.id].status[row.status] = row.count;
            systemMap[row.id].total += row.count;
          }
        },
      );

      res.json({ systems: Object.values(systemMap) });
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
    const { systemId, menuId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      // Determine xAxis values and column
      let xValues: string[];
      if (xAxis === 'status') {
        xValues = ['접수', '검토중', '처리중', '완료', '드랍'];
      } else if (xAxis === 'priority') {
        xValues = ['urgent', 'high', 'medium', 'low'];
      } else {
        const tagR = await pool.query('SELECT name FROM tags ORDER BY name');
        xValues = (tagR.rows as { name: string }[]).map((r) => r.name);
      }

      // Fetch assignees (managers/admins)
      const assigneeR = await pool.query(
        `SELECT id, display_name AS name FROM users WHERE role IN ('manager','admin') AND is_active = true ORDER BY display_name`,
      );
      const assignees = assigneeR.rows as { id: string; name: string }[];

      interface CountRow {
        assignee_id: string | null;
        xval: string;
        count: number;
      }

      let countRows: CountRow[];

      if (xAxis === 'tag') {
        const r = await pool.query(
          `SELECT v.assignee_id, t.name AS xval, COUNT(DISTINCT v.id)::int AS count
           FROM vocs v
           JOIN voc_tags vt ON v.id = vt.voc_id
           JOIN tags t ON t.id = vt.tag_id
           WHERE v.deleted_at IS NULL
             AND ($1::text IS NULL OR v.system_id = $1)
             AND ($2::text IS NULL OR v.menu_id = $2)
             AND ($3::date IS NULL OR v.created_at::date >= $3::date)
             AND ($4::date IS NULL OR v.created_at::date <= $4::date)
           GROUP BY v.assignee_id, t.name`,
          [systemId, menuId, startDate, endDate],
        );
        countRows = r.rows as CountRow[];
      } else {
        const col = xAxis === 'priority' ? 'priority' : 'status';
        const r = await pool.query(
          `SELECT assignee_id, ${col} AS xval, COUNT(*)::int AS count
           FROM vocs
           WHERE deleted_at IS NULL
             AND ($1::text IS NULL OR system_id = $1)
             AND ($2::text IS NULL OR menu_id = $2)
             AND ($3::date IS NULL OR created_at::date >= $3::date)
             AND ($4::date IS NULL OR created_at::date <= $4::date)
           GROUP BY assignee_id, ${col}`,
          [systemId, menuId, startDate, endDate],
        );
        countRows = r.rows as CountRow[];
      }

      // Build per-assignee map
      const assigneeMap: Record<string, Record<string, number>> = {};
      const unassignedMap: Record<string, number> = {};
      xValues.forEach((x) => {
        unassignedMap[x] = 0;
      });

      assignees.forEach((a) => {
        assigneeMap[a.id] = {};
        xValues.forEach((x) => {
          assigneeMap[a.id][x] = 0;
        });
      });

      countRows.forEach((row) => {
        if (row.assignee_id === null) {
          if (unassignedMap[row.xval] !== undefined) unassignedMap[row.xval] = row.count;
        } else if (assigneeMap[row.assignee_id]) {
          if (assigneeMap[row.assignee_id][row.xval] !== undefined)
            assigneeMap[row.assignee_id][row.xval] = row.count;
        }
      });

      const rows = [
        ...assignees.map((a) => {
          const values = xValues.map((x) => assigneeMap[a.id][x] ?? 0);
          return {
            assigneeId: a.id,
            assigneeName: a.name,
            values,
            total: values.reduce((s, v) => s + v, 0),
          };
        }),
        {
          assigneeId: 'unassigned',
          assigneeName: '미배정',
          values: xValues.map((x) => unassignedMap[x] ?? 0),
          total: Object.values(unassignedMap).reduce((s, v) => s + v, 0),
        },
      ];

      res.json({ headers: xValues, rows });
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
    const { assigneeId, startDate, endDate } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT
           s.id,
           s.name,
           COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (v.updated_at - v.created_at)) / 86400)::numeric, 1), 0)::float AS avg_days,
           ROUND(
             COUNT(CASE WHEN EXTRACT(EPOCH FROM (v.updated_at - v.created_at)) / 86400 <= 14 THEN 1 END)::numeric
             / NULLIF(COUNT(v.id), 0) * 100,
             1
           )::float AS sla_rate
         FROM systems s
         LEFT JOIN vocs v ON v.system_id = s.id
           AND v.deleted_at IS NULL
           AND v.status = '완료'
           AND ($1::text IS NULL OR v.assignee_id = $1)
           AND ($2::date IS NULL OR v.updated_at::date >= $2::date)
           AND ($3::date IS NULL OR v.updated_at::date <= $3::date)
         GROUP BY s.id, s.name
         ORDER BY s.name`,
        [assigneeId, startDate, endDate],
      );

      res.json({
        rows: (
          r.rows as { id: string; name: string; avg_days: number; sla_rate: number | null }[]
        ).map((row) => ({
          id: row.id,
          name: row.name,
          avgDays: row.avg_days,
          slaRate: row.sla_rate ?? 0,
        })),
      });
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
    const { systemId, menuId, assigneeId } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT
           s.id,
           s.name,
           COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 <= 7 THEN 1 END)::int AS safe,
           COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 BETWEEN 8 AND 30 THEN 1 END)::int AS warn,
           COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 > 30 THEN 1 END)::int AS crit
         FROM systems s
         LEFT JOIN vocs v ON v.system_id = s.id
           AND v.deleted_at IS NULL
           AND v.status IN ('접수','검토중','처리중')
           AND ($1::text IS NULL OR v.system_id = $1)
           AND ($2::text IS NULL OR v.menu_id = $2)
           AND ($3::text IS NULL OR v.assignee_id = $3)
         GROUP BY s.id, s.name
         ORDER BY s.name`,
        [systemId, menuId, assigneeId],
      );

      res.json({
        rows: (
          r.rows as { id: string; name: string; safe: number; warn: number; crit: number }[]
        ).map((row) => ({
          id: row.id,
          name: row.name,
          safe: row.safe,
          warn: row.warn,
          crit: row.crit,
          total: row.safe + row.warn + row.crit,
        })),
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
    const { systemId, menuId, assigneeId } = extractFilters(
      req.query as Record<string, string | undefined>,
    );

    try {
      const r = await pool.query(
        `SELECT
           v.id,
           v.issue_code,
           v.title,
           s.name AS system_name,
           m.name AS menu_name,
           v.priority,
           EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 AS days_since_created
         FROM vocs v
         JOIN systems s ON s.id = v.system_id
         JOIN menus m ON m.id = v.menu_id
         WHERE v.deleted_at IS NULL
           AND v.status IN ('접수','검토중','처리중')
           AND ($1::text IS NULL OR v.system_id = $1)
           AND ($2::text IS NULL OR v.menu_id = $2)
           AND ($3::text IS NULL OR v.assignee_id = $3)
         ORDER BY v.created_at ASC
         LIMIT $4`,
        [systemId, menuId, assigneeId, limit],
      );

      res.json(
        (
          r.rows as {
            id: string;
            issue_code: string | null;
            title: string;
            system_name: string;
            menu_name: string;
            priority: string;
            days_since_created: number;
          }[]
        ).map((row) => ({
          id: row.id,
          issue_code: row.issue_code,
          title: row.title,
          systemName: row.system_name,
          menuName: row.menu_name,
          priority: row.priority,
          daysSinceCreated: Math.floor(row.days_since_created),
        })),
      );
    } catch (err) {
      logger.error({ err }, 'GET /api/dashboard/aging-vocs failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── Lazy migration for dashboard_settings ─────────────────────────────────────

let settingsTableReady = false;
async function ensureSettingsTable(): Promise<void> {
  if (settingsTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_settings (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      widget_visibility JSONB DEFAULT '{}',
      default_date_range VARCHAR(10) DEFAULT '30d',
      heatmap_default_x_axis VARCHAR(20) DEFAULT 'status',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    )
  `);
  settingsTableReady = true;
}

// ── GET /settings ─────────────────────────────────────────────────────────────

dashboardRouter.get(
  '/settings',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;

    try {
      await ensureSettingsTable();

      // User-specific first, then admin default
      const result = await pool.query(
        `SELECT widget_visibility, default_date_range, heatmap_default_x_axis
         FROM dashboard_settings
         WHERE user_id = $1
         UNION ALL
         SELECT widget_visibility, default_date_range, heatmap_default_x_axis
         FROM dashboard_settings
         WHERE user_id IS NULL
         LIMIT 1`,
        [user.id],
      );

      if (result.rowCount === 0) {
        res.json({
          widget_visibility: {},
          default_date_range: '30d',
          heatmap_default_x_axis: 'status',
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

// ── PUT /settings ─────────────────────────────────────────────────────────────

dashboardRouter.put(
  '/settings',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { widget_visibility, default_date_range, heatmap_default_x_axis, target } = req.body as {
      widget_visibility?: Record<string, boolean>;
      default_date_range?: string;
      heatmap_default_x_axis?: string;
      target?: 'user' | 'admin';
    };

    try {
      await ensureSettingsTable();

      if (target === 'admin') {
        // Only admins can update the admin default
        const authUser = user as AuthUser;
        if (authUser.role !== 'admin') {
          res.status(403).json({ error: 'FORBIDDEN' });
          return;
        }
        await pool.query(
          `INSERT INTO dashboard_settings (user_id, widget_visibility, default_date_range, heatmap_default_x_axis, updated_at)
           VALUES (NULL, $1, $2, $3, NOW())
           ON CONFLICT (user_id) DO UPDATE
             SET widget_visibility = EXCLUDED.widget_visibility,
                 default_date_range = EXCLUDED.default_date_range,
                 heatmap_default_x_axis = EXCLUDED.heatmap_default_x_axis,
                 updated_at = NOW()`,
          [
            JSON.stringify(widget_visibility ?? {}),
            default_date_range ?? '30d',
            heatmap_default_x_axis ?? 'status',
          ],
        );
      } else {
        await pool.query(
          `INSERT INTO dashboard_settings (user_id, widget_visibility, default_date_range, heatmap_default_x_axis, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE
             SET widget_visibility = EXCLUDED.widget_visibility,
                 default_date_range = EXCLUDED.default_date_range,
                 heatmap_default_x_axis = EXCLUDED.heatmap_default_x_axis,
                 updated_at = NOW()`,
          [
            user.id,
            JSON.stringify(widget_visibility ?? {}),
            default_date_range ?? '30d',
            heatmap_default_x_axis ?? 'status',
          ],
        );
      }

      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'PUT /api/dashboard/settings failed');
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
        `SELECT id, name FROM menus WHERE system_id = $1 ORDER BY name`,
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
        `SELECT id, display_name AS name FROM users
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
