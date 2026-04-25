import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth, requireManager } from '../middleware/auth';
import { applyTagRules } from '../services/autoTag';
import { emitNotification } from '../services/notifications';
import { calcDueDate, STATUS_TRANSITIONS } from '../utils/voc';
import { subtasksRouter } from './subtasks';
import { payloadRouter } from './payload';

export const vocRouter = Router();

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
  const reviewStatusRaw = (req.query as Record<string, string | undefined>).review_status;
  if (reviewStatusRaw) {
    const values = reviewStatusRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (values.length > 0) {
      const placeholders = values.map(() => `$${idx++}`).join(',');
      conditions.push(`v.review_status IN (${placeholders})`);
      params.push(...values);
    }
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
      assignee_id: string | null;
      parent_id: string | null;
    };
    const prevAssigneeId = voc.assignee_id;

    if (user.role === 'user' && voc.author_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    // M2: Sub-task system_id/menu_id are immutable
    const patchBody = req.body as { system_id?: string; menu_id?: string };
    if (voc.parent_id && (patchBody.system_id !== undefined || patchBody.menu_id !== undefined)) {
      res.status(400).json({ error: 'SUBTASK_SYSTEM_MENU_IMMUTABLE' });
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

    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      params.push(title);
    }
    if (body !== undefined) {
      updates.push(`body = $${idx++}`);
      params.push(body);
    }

    if (user.role === 'manager' || user.role === 'admin') {
      if (assignee_id !== undefined) {
        updates.push(`assignee_id = $${idx++}`);
        params.push(assignee_id);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${idx++}`);
        params.push(priority);
      }
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
    if (
      assignee_id !== undefined &&
      updated.assignee_id &&
      updated.assignee_id !== user.id &&
      updated.assignee_id !== prevAssigneeId
    ) {
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
    const { status } = req.body as { status?: string };

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

vocRouter.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: vocRows } = await client.query(
      `SELECT id, author_id FROM vocs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );

    if (vocRows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = vocRows[0] as { id: string; author_id: string };

    if (user.role === 'user' && voc.author_id !== user.id) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }
    if (user.role === 'manager') {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    await client.query(`UPDATE vocs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    await client.query(
      `UPDATE vocs SET deleted_at = NOW() WHERE parent_id = $1 AND deleted_at IS NULL`,
      [id],
    );

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'DELETE /api/vocs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  } finally {
    client.release();
  }
});

// ── Sub-routers (R7-10) ───────────────────────────────────────────────────────

vocRouter.use('/', subtasksRouter);
vocRouter.use('/', payloadRouter);
