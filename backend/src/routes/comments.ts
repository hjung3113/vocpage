import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const commentRouter = Router({ mergeParams: true });

// ── GET /:vocId/comments ──────────────────────────────────────────────────────

commentRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId } = req.params;

  try {
    const vocResult = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      vocId,
    ]);

    if (vocResult.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = vocResult.rows[0] as { author_id: string; assignee_id: string | null };

    if (user.role === 'user' && voc.author_id !== user.id && voc.assignee_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM comments WHERE voc_id = $1 ORDER BY created_at ASC`,
      [vocId],
    );

    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:vocId/comments failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /:vocId/comments ─────────────────────────────────────────────────────

commentRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId } = req.params;
  const { body } = req.body as { body?: string };

  if (!body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  if (Buffer.byteLength(body, 'utf8') > 16 * 1024) {
    res.status(400).json({ error: 'BODY_TOO_LARGE' });
    return;
  }

  try {
    const vocResult = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      vocId,
    ]);

    if (vocResult.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = vocResult.rows[0] as { author_id: string; assignee_id: string | null };

    if (user.role === 'user' && voc.author_id !== user.id && voc.assignee_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO comments (voc_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
      [vocId, user.id, body],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'POST /api/vocs/:vocId/comments failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /:vocId/comments/:commentId ────────────────────────────────────────

commentRouter.patch('/:commentId', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId, commentId } = req.params;
  const { body } = req.body as { body?: string };

  if (!body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  try {
    const existing = await pool.query(`SELECT * FROM comments WHERE id = $1 AND voc_id = $2`, [
      commentId,
      vocId,
    ]);

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const comment = existing.rows[0] as { author_id: string };

    if (comment.author_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const result = await pool.query(`UPDATE comments SET body = $1 WHERE id = $2 RETURNING *`, [
      body,
      commentId,
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'PATCH /api/vocs/:vocId/comments/:commentId failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── DELETE /:vocId/comments/:commentId ───────────────────────────────────────

commentRouter.delete('/:commentId', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId, commentId } = req.params;

  try {
    const existing = await pool.query(`SELECT * FROM comments WHERE id = $1 AND voc_id = $2`, [
      commentId,
      vocId,
    ]);

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const comment = existing.rows[0] as { author_id: string };

    if (comment.author_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    await pool.query(`DELETE FROM comments WHERE id = $1`, [commentId]);

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'DELETE /api/vocs/:vocId/comments/:commentId failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
