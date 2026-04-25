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
      assignee_id: string | null;
    };
    const prevAssigneeId = voc.assignee_id;

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
    // fire-and-forget: notify new assignee — skip self-assign and no-op re-assignments.
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

// ── POST /api/vocs/:id/payload ────────────────────────────────────────────────

vocRouter.post(
  '/:id/payload',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    const {
      equipment,
      maker,
      model,
      process: proc,
      symptom,
      root_cause,
      resolution,
      status: newStatus,
    } = req.body as {
      equipment?: string;
      maker?: string;
      model?: string;
      process?: string;
      symptom?: string;
      root_cause?: string;
      resolution?: string;
      status?: string;
      unverified_fields?: string[];
    };

    if (!symptom || !root_cause || !resolution) {
      res.status(400).json({ error: 'VALIDATION_FAILED' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // C2: row-level lock to serialize concurrent payload submissions on the same VOC.
      const { rows } = await client.query(
        `SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const voc = rows[0] as {
        status: string;
        assignee_id: string | null;
        review_status: string | null;
      };

      // M1: status may be transitioned together with payload submission.
      const effectiveStatus = newStatus ?? voc.status;
      if (effectiveStatus !== '완료' && effectiveStatus !== '드랍') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'INVALID_STATUS_FOR_PAYLOAD' });
        return;
      }
      if (newStatus && !STATUS_TRANSITIONS[voc.status]?.includes(newStatus)) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'INVALID_TRANSITION' });
        return;
      }
      if (user.role !== 'admin' && voc.assignee_id !== user.id) {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
      }

      // M2: requirements.md §4 — never trust FE's unverified_fields flags. BE will recompute
      // after §16.3 external master cache lands (Phase 7-10). MVP: force empty array.
      const payload = {
        equipment,
        maker,
        model,
        process: proc,
        symptom,
        root_cause,
        resolution,
        unverified_fields: [] as string[],
      };
      // M5: wasApproved derived from the FOR UPDATE row inside the transaction.
      const wasApproved = voc.review_status === 'approved';

      await client.query(
        `UPDATE voc_payload_history SET is_current = false WHERE voc_id = $1 AND is_current = true`,
        [id],
      );
      const histResult = await client.query(
        `INSERT INTO voc_payload_history (voc_id, payload, submitted_by, final_state, is_current)
         VALUES ($1, $2, $3, 'active', true) RETURNING *`,
        [id, JSON.stringify(payload), user.id],
      );
      await client.query(
        `UPDATE vocs SET structured_payload = $1, review_status = 'unverified', embed_stale = $2,
           status = COALESCE($3, status), updated_at = now() WHERE id = $4`,
        [JSON.stringify(payload), wasApproved, newStatus ?? null, id],
      );
      await client.query('COMMIT');
      res.json(histResult.rows[0]);
    } catch (err: unknown) {
      await client.query('ROLLBACK').catch(() => {});
      // C2: UNIQUE INDEX on voc_payload_history(voc_id) WHERE is_current=true
      // can still race in transaction overlap; surface 409 instead of 500.
      if ((err as { code?: string }).code === '23505') {
        res.status(409).json({ error: 'CONCURRENT_SUBMISSION' });
        return;
      }
      logger.error({ err }, 'POST /api/vocs/:id/payload failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }
  },
);

// ── PATCH /api/vocs/:id/payload-draft ─────────────────────────────────────────

vocRouter.patch(
  '/:id/payload-draft',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    const { draft } = req.body as { draft?: Record<string, unknown> };

    try {
      const { rows } = await pool.query(
        `SELECT id, status, assignee_id FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const voc = rows[0] as { status: string; assignee_id: string | null };
      if (user.role !== 'admin' && voc.assignee_id !== user.id) {
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
      }
      // M4: draft only meaningful while VOC is in a payload-eligible state.
      if (voc.status !== '완료' && voc.status !== '드랍') {
        res.status(400).json({ error: 'INVALID_STATUS_FOR_DRAFT' });
        return;
      }
      const draftValue = draft && Object.keys(draft).length > 0 ? JSON.stringify(draft) : null;
      await pool.query(
        `UPDATE vocs SET structured_payload_draft = $1, updated_at = now() WHERE id = $2`,
        [draftValue, id],
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'PATCH /api/vocs/:id/payload-draft failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /api/vocs/:id/payload-history ─────────────────────────────────────────

vocRouter.get(
  '/:id/payload-history',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT id FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const histResult = await pool.query(
        `SELECT * FROM voc_payload_history WHERE voc_id = $1 ORDER BY submitted_at DESC`,
        [id],
      );
      res.json(histResult.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/vocs/:id/payload-history failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── POST /api/vocs/:id/payload-review ─────────────────────────────────────────

vocRouter.post(
  '/:id/payload-review',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    const { decision, comment } = req.body as { decision?: string; comment?: string | null };

    if (decision !== 'approved' && decision !== 'rejected') {
      res.status(400).json({ error: 'VALIDATION_FAILED' });
      return;
    }

    // C4: TODO(MVP): 제출자(voc_payload_history.submitted_by) === reviewer 셀프 리뷰 방지 미구현.
    // Phase 8 이후 voc_payload_history.submitted_by != req.user.id 체크 추가 예정.

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const voc = rows[0] as { review_status: string | null };
      const rs = voc.review_status;
      if (rs !== 'unverified' && rs !== 'pending_deletion') {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'INVALID_REVIEW_STATUS' });
        return;
      }
      const action = rs === 'unverified' ? 'submission' : 'deletion';

      await client.query(
        `INSERT INTO voc_payload_reviews (voc_id, action, reviewer_id, decision, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, action, user.id, decision, comment ?? null],
      );

      if (action === 'submission') {
        if (decision === 'approved') {
          await client.query(
            `UPDATE vocs SET review_status = 'approved', embed_stale = false, updated_at = now() WHERE id = $1`,
            [id],
          );
          await client.query(
            `UPDATE voc_payload_history SET final_state = 'approved' WHERE voc_id = $1 AND is_current = true`,
            [id],
          );
        } else {
          await client.query(
            `UPDATE vocs SET review_status = 'rejected', updated_at = now() WHERE id = $1`,
            [id],
          );
          await client.query(
            `UPDATE voc_payload_history SET final_state = 'rejected', is_current = false WHERE voc_id = $1 AND is_current = true`,
            [id],
          );
        }
      } else {
        // deletion
        if (decision === 'approved') {
          await client.query(
            `UPDATE vocs SET structured_payload = NULL, review_status = NULL, updated_at = now() WHERE id = $1`,
            [id],
          );
          await client.query(
            `UPDATE voc_payload_history SET final_state = 'deleted', is_current = false WHERE voc_id = $1 AND is_current = true`,
            [id],
          );
        } else {
          await client.query(
            `UPDATE vocs SET review_status = 'approved', updated_at = now() WHERE id = $1`,
            [id],
          );
        }
      }

      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error({ err }, 'POST /api/vocs/:id/payload-review failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }
  },
);

// ── POST /api/vocs/:id/payload-delete-request ─────────────────────────────────

vocRouter.post(
  '/:id/payload-delete-request',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT review_status FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (rows[0].review_status !== 'approved') {
        res.status(400).json({ error: 'INVALID_REVIEW_STATUS' });
        return;
      }
      await pool.query(
        `UPDATE vocs SET review_status = 'pending_deletion', updated_at = now() WHERE id = $1`,
        [id],
      );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'POST /api/vocs/:id/payload-delete-request failed');
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

      // Sub-task cascade soft delete
      await pool.query(
        `UPDATE vocs SET deleted_at = NOW() WHERE parent_id = $1 AND deleted_at IS NULL`,
        [id],
      );

      res.status(204).send();
    } catch (err) {
      logger.error({ err }, 'DELETE /api/vocs/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /api/vocs/:id/subtasks ────────────────────────────────────────────────

vocRouter.get('/:id/subtasks', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const parent = await pool.query(`SELECT id FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    if (parent.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    const { rows } = await pool.query(
      `SELECT * FROM vocs WHERE parent_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [id],
    );
    res.json(rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:id/subtasks failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/vocs/:id/subtasks ───────────────────────────────────────────────

vocRouter.post('/:id/subtasks', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { title, body, priority, voc_type_id, assignee_id } = req.body as {
    title?: string;
    body?: string;
    priority?: string;
    voc_type_id?: string;
    assignee_id?: string;
  };

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'VALIDATION_FAILED' });
    return;
  }
  if (!voc_type_id) {
    res.status(400).json({ error: 'VALIDATION_FAILED' });
    return;
  }

  try {
    const { rows: parentRows } = await pool.query(
      `SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (parentRows.length === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    const parent = parentRows[0] as {
      id: string;
      parent_id: string | null;
      issue_code: string;
      system_id: string;
      menu_id: string;
    };

    // 1-level limit
    if (parent.parent_id) {
      res.status(400).json({ error: 'SUBTASK_NESTING_NOT_ALLOWED' });
      return;
    }

    // Sequential numbering — include soft-deleted to prevent reuse
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int + 1 AS next_n FROM vocs WHERE parent_id = $1`,
      [id],
    );
    const nextN = countRows[0].next_n as number;
    const issueCode = `${parent.issue_code}-${nextN}`;
    const effectivePriority = priority ?? 'medium';
    const dueDate = calcDueDate(effectivePriority);

    // Pre-populate sequence_no & issue_code so the BEFORE INSERT trigger (WHEN sequence_no IS NULL) does not fire.
    const { rows: createdRows } = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, assignee_id, parent_id, issue_code, sequence_no, due_date, source)
         VALUES ($1, $2, '접수', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'manual')
         RETURNING *`,
      [
        title,
        body ?? '',
        effectivePriority,
        user.id,
        parent.system_id,
        parent.menu_id,
        voc_type_id,
        assignee_id ?? null,
        id,
        issueCode,
        nextN,
        dueDate,
      ],
    );
    const created = createdRows[0] as { id: string; title: string; body: string | null };

    // Sub-task auto-tagging (independent from parent)
    applyTagRules(created.id, created.title, created.body ?? '', pool).catch((err) =>
      logger.warn({ err }, 'subtask auto-tag failed'),
    );

    res.status(201).json(created);
  } catch (err) {
    logger.error({ err }, 'POST /api/vocs/:id/subtasks failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── GET /api/vocs/:id/incomplete-subtasks ─────────────────────────────────────

vocRouter.get(
  '/:id/incomplete-subtasks',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM vocs
         WHERE parent_id = $1 AND deleted_at IS NULL AND status NOT IN ('완료','드랍')`,
        [id],
      );
      res.json({ count: rows[0].count });
    } catch (err) {
      logger.error({ err }, 'GET /api/vocs/:id/incomplete-subtasks failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
