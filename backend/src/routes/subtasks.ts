import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth, requireManager } from '../middleware/auth';
import { applyTagRules } from '../services/autoTag';
import { masterCache } from '../services/masterCache';
import { calcDueDate } from '../utils/voc';

export const subtasksRouter = Router({ mergeParams: true });

// ── GET /api/vocs/:id/subtasks ────────────────────────────────────────────────

subtasksRouter.get(
  '/:id/subtasks',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    try {
      // R7-1: verify parent exists and enforce ownership for user role
      const parent = await pool.query(
        `SELECT id, author_id FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (parent.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (user.role === 'user' && (parent.rows[0] as { author_id: string }).author_id !== user.id) {
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
  },
);

// ── POST /api/vocs/:id/subtasks ───────────────────────────────────────────────

subtasksRouter.post(
  '/:id/subtasks',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: parentRows } = await client.query(
        `SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      if (parentRows.length === 0) {
        await client.query('ROLLBACK');
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

      if (parent.parent_id) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'SUBTASK_NESTING_NOT_ALLOWED' });
        return;
      }

      const { rows: typeRows } = await client.query(
        `SELECT id FROM voc_types WHERE id = $1 AND is_archived = false`,
        [voc_type_id],
      );
      if (!typeRows[0]) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'INVALID_VOC_TYPE' });
        return;
      }

      if (assignee_id) {
        const { rows: userRows } = await client.query(`SELECT id FROM users WHERE id = $1`, [
          assignee_id,
        ]);
        if (!userRows[0]) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'INVALID_ASSIGNEE' });
          return;
        }
      }

      const { rows: countRows } = await client.query(
        `SELECT COUNT(*)::int + 1 AS next_n FROM vocs WHERE parent_id = $1`,
        [id],
      );
      const nextN = countRows[0].next_n as number;
      const issueCode = `${parent.issue_code}-${nextN}`;
      const effectivePriority = priority ?? 'medium';
      const dueDate = calcDueDate(effectivePriority);

      const { rows: createdRows } = await client.query(
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

      await client.query('COMMIT');

      const created = createdRows[0] as { id: string; title: string; body: string | null };

      applyTagRules(created.id, created.title, created.body ?? '', pool).catch((err) =>
        logger.warn({ err }, 'subtask auto-tag failed'),
      );

      res.status(201).json(created);
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      if ((err as { code?: string }).code === '23505') {
        res.status(409).json({ error: 'CONCURRENT_SUBTASK_CREATION' });
        return;
      }
      logger.error({ err }, 'POST /api/vocs/:id/subtasks failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }
  },
);

// ── GET /api/vocs/:id/incomplete-subtasks ─────────────────────────────────────

subtasksRouter.get(
  '/:id/incomplete-subtasks',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    try {
      // R7-1: verify parent exists and enforce ownership for user role
      const parent = await pool.query(
        `SELECT id, author_id FROM vocs WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (parent.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (user.role === 'user' && (parent.rows[0] as { author_id: string }).author_id !== user.id) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
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

// ── POST /api/vocs/:id/masters/refresh ──────────────────────────────────────

subtasksRouter.post(
  '/:id/masters/refresh',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    try {
      const result = await masterCache.refresh(user.id);
      if (!result.swapped) {
        res.status(503).json(result);
        return;
      }
      res.json(result);
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'RATE_LIMITED'
      ) {
        res.status(429).json({
          error: 'RATE_LIMITED',
          retryAfter: (err as unknown as { retryAfter: number }).retryAfter,
        });
        return;
      }
      logger.error({ err }, 'POST /api/vocs/:id/masters/refresh failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
