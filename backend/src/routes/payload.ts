import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth, requireManager } from '../middleware/auth';
import { masterCache } from '../services/masterCache';
import { STATUS_TRANSITIONS } from '../utils/voc';

export const payloadRouter = Router({ mergeParams: true });

// ── POST /api/vocs/:id/payload ────────────────────────────────────────────────

payloadRouter.post(
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

    if (!symptom?.trim() || !root_cause?.trim() || !resolution?.trim()) {
      res.status(400).json({ error: 'VALIDATION_FAILED' });
      return;
    }

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
      const voc = rows[0] as {
        status: string;
        assignee_id: string | null;
        review_status: string | null;
      };

      // MEDIUM-2: permission check before transition check to prevent info leakage.
      if (user.role !== 'admin' && voc.assignee_id !== user.id) {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
      }

      // LOW-1: block submission while deletion is pending.
      if (voc.review_status === 'pending_deletion') {
        await client.query('ROLLBACK');
        res.status(400).json({
          error: 'INVALID_STATUS_FOR_PAYLOAD',
          message: 'Cannot submit payload while deletion is pending',
        });
        return;
      }

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

      // M2: never trust FE's unverified_fields flags — BE recomputes via master cache (§16.3).
      const payloadForVerify = { equipment, maker, model, process: proc };
      const payload = {
        equipment,
        maker,
        model,
        process: proc,
        symptom,
        root_cause,
        resolution,
        unverified_fields: masterCache.verifyPayload(payloadForVerify),
      };
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

payloadRouter.patch(
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

payloadRouter.get(
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

payloadRouter.post(
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

      // MEDIUM-1: MVP self-review prevention
      const histRow = await client.query(
        `SELECT submitted_by FROM voc_payload_history WHERE voc_id = $1 AND is_current = true`,
        [id],
      );
      if (histRow.rows.length > 0 && histRow.rows[0].submitted_by === user.id) {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'SELF_REVIEW_NOT_ALLOWED' });
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

payloadRouter.post(
  '/:id/payload-delete-request',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT review_status FROM vocs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (rows[0].review_status !== 'approved') {
        await client.query('ROLLBACK');
        res
          .status(400)
          .json({ error: 'INVALID_STATUS', message: 'review_status must be approved' });
        return;
      }
      await client.query(
        `UPDATE vocs SET review_status = 'pending_deletion', updated_at = now() WHERE id = $1`,
        [id],
      );
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error({ err }, 'POST /api/vocs/:id/payload-delete-request failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }
  },
);
