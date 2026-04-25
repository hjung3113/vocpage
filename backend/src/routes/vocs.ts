import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { applyTagRules } from '../services/autoTag';
import { emitNotification } from '../services/notifications';

export const vocRouter = Router();

const DUE_DATE_DAYS: Record<string, number> = {
  urgent: 7,
  high: 14,
  medium: 30,
  low: 90,
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  접수: ['검토중', '드랍'],
  검토중: ['처리중', '드랍'],
  처리중: ['완료', '드랍'],
  완료: ['처리중'],
  드랍: ['검토중', '처리중'],
};

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

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as AuthUser | undefined;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'FORBIDDEN' });
    return;
  }
  next();
}

function calcDueDate(priority: string): string {
  const days = DUE_DATE_DAYS[priority] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString(); // UTC 'Z' format — avoids local-timezone offset strings that confuse pg-mem
}

// ── GET /api/vocs ─────────────────────────────────────────────────────────────

vocRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;

  const {
    status,
    priority,
    system_id,
    menu_id,
    assignee_id,
    keyword,
    page = '1',
    limit: limitRaw = '20',
    sort = 'created_at',
    order = 'desc',
  } = req.query as Record<string, string | undefined>;

  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limitRaw ?? '20', 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const allowedSorts = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
  const sortCol = allowedSorts.includes(sort ?? '') ? sort : 'created_at';
  const orderDir = order === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = ['v.deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;

  // Role-based filter
  if (user.role === 'user') {
    conditions.push(`v.author_id = $${idx++}`);
    params.push(user.id);
  }

  if (status) {
    conditions.push(`v.status = $${idx++}`);
    params.push(status);
  }
  if (priority) {
    conditions.push(`v.priority = $${idx++}`);
    params.push(priority);
  }
  if (system_id) {
    conditions.push(`v.system_id = $${idx++}`);
    params.push(system_id);
  }
  if (menu_id) {
    conditions.push(`v.menu_id = $${idx++}`);
    params.push(menu_id);
  }
  if (assignee_id) {
    conditions.push(`v.assignee_id = $${idx++}`);
    params.push(assignee_id);
  }
  if (keyword) {
    conditions.push(`(v.title ILIKE $${idx} OR v.body ILIKE $${idx})`);
    params.push(`%${keyword}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM vocs v ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT v.* FROM vocs v ${where} ORDER BY v.${sortCol} ${orderDir} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset],
    );

    res.json({ data: dataResult.rows, total, page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/vocs ────────────────────────────────────────────────────────────

vocRouter.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { title, system_id, menu_id, voc_type_id, body } = req.body as {
    title?: string;
    system_id?: string;
    menu_id?: string;
    voc_type_id?: string;
    body?: string;
  };

  if (!title || !system_id || !menu_id || !voc_type_id || !body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  const priority = 'medium';
  const status = '접수';
  const due_date = calcDueDate(priority);

  try {
    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, due_date, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, body, status, priority, user.id, system_id, menu_id, voc_type_id, due_date, 'manual'],
    );

    const newVoc = result.rows[0];
    await applyTagRules(newVoc.id, newVoc.title, newVoc.body ?? '', pool).catch((err) =>
      logger.warn({ err }, 'auto-tag failed on create'),
    );
    res.status(201).json(newVoc);
  } catch (err) {
    logger.error({ err }, 'POST /api/vocs failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── GET /api/vocs/:id ─────────────────────────────────────────────────────────

vocRouter.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = result.rows[0] as { author_id: string };

    // User can only access their own VOCs
    if (user.role === 'user' && voc.author_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json(voc);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /api/vocs/:id ───────────────────────────────────────────────────────

vocRouter.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    const existing = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = existing.rows[0] as {
      author_id: string;
      priority: string;
    };

    if (user.role === 'user' && voc.author_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const { title, body, assignee_id, priority, due_date, voc_type_id, menu_id } = req.body as {
      title?: string;
      body?: string;
      assignee_id?: string;
      priority?: string;
      due_date?: string;
      voc_type_id?: string;
      menu_id?: string;
    };

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // User: only title and body
    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      params.push(title);
    }
    if (body !== undefined) {
      updates.push(`body = $${idx++}`);
      params.push(body);
    }

    // Manager/Admin: additional fields
    if (user.role === 'manager' || user.role === 'admin') {
      if (assignee_id !== undefined) {
        updates.push(`assignee_id = $${idx++}`);
        params.push(assignee_id);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${idx++}`);
        params.push(priority);
      }
      // due_date: explicit value wins; otherwise recalculate from priority change
      if (due_date !== undefined) {
        updates.push(`due_date = $${idx++}`);
        params.push(due_date);
      } else if (priority !== undefined) {
        updates.push(`due_date = $${idx++}`);
        params.push(calcDueDate(priority));
      }
      if (voc_type_id !== undefined) {
        updates.push(`voc_type_id = $${idx++}`);
        params.push(voc_type_id);
      }
      if (menu_id !== undefined) {
        updates.push(`menu_id = $${idx++}`);
        params.push(menu_id);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
      return;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE vocs SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );

    const updated = result.rows[0] as { title: string; body: string; assignee_id: string | null };
    res.json(updated);
    if (title !== undefined || body !== undefined) {
      applyTagRules(id, updated.title, updated.body ?? '', pool).catch((err) =>
        logger.warn({ err }, 'auto-tag failed on patch'),
      );
    }
    // fire-and-forget: notify new assignee
    if (assignee_id !== undefined && assignee_id !== null && updated.assignee_id) {
      emitNotification({ pool, userId: updated.assignee_id, type: 'assigned', vocId: id }).catch(
        () => {},
      );
    }
  } catch (err) {
    logger.error({ err }, 'PATCH /api/vocs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /api/vocs/:id/status ────────────────────────────────────────────────

vocRouter.patch(
  '/:id/status',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body as { status?: string; comment?: string };

    if (!status) {
      res.status(400).json({ error: 'MISSING_STATUS' });
      return;
    }

    try {
      const existing = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
        id,
      ]);

      if (existing.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const voc = existing.rows[0] as { status: string };
      const allowed = STATUS_TRANSITIONS[voc.status] ?? [];

      if (!allowed.includes(status)) {
        res.status(400).json({ error: 'INVALID_TRANSITION' });
        return;
      }

      const result = await pool.query(`UPDATE vocs SET status = $1 WHERE id = $2 RETURNING *`, [
        status,
        id,
      ]);

      const updatedVoc = result.rows[0] as { author_id: string };
      res.json(result.rows[0]);

      // fire-and-forget: notify VOC author of status change
      emitNotification({
        pool,
        userId: updatedVoc.author_id,
        type: 'status_change',
        vocId: id,
      }).catch(() => {});
    } catch (err) {
      logger.error({ err }, 'PATCH /api/vocs/:id/status failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── DELETE /api/vocs/:id ──────────────────────────────────────────────────────

vocRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `UPDATE vocs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
        [id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.status(204).send();
    } catch (err) {
      logger.error({ err }, 'DELETE /api/vocs/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
