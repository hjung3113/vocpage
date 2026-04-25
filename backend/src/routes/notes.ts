import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const noteRouter = Router({ mergeParams: true });

function isManagerOrAdmin(user: AuthUser): boolean {
  return user.role === 'manager' || user.role === 'admin';
}

// ── GET /:vocId/notes ─────────────────────────────────────────────────────────

noteRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId } = req.params;

  if (!isManagerOrAdmin(user)) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  try {
    const vocResult = await pool.query(`SELECT id FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      vocId,
    ]);

    if (vocResult.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM voc_internal_notes WHERE voc_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [vocId],
    );

    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:vocId/notes failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /:vocId/notes ────────────────────────────────────────────────────────

noteRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId } = req.params;
  const { body } = req.body as { body?: string };

  if (!isManagerOrAdmin(user)) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  if (!body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  try {
    const vocResult = await pool.query(`SELECT id FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      vocId,
    ]);

    if (vocResult.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO voc_internal_notes (voc_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
      [vocId, user.id, body],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'POST /api/vocs/:vocId/notes failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /:vocId/notes/:noteId ───────────────────────────────────────────────

noteRouter.patch('/:noteId', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId, noteId } = req.params;
  const { body } = req.body as { body?: string };

  if (!isManagerOrAdmin(user)) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  if (!body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM voc_internal_notes WHERE id = $1 AND voc_id = $2 AND deleted_at IS NULL`,
      [noteId, vocId],
    );

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const note = existing.rows[0] as { author_id: string };

    if (note.author_id !== user.id) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const result = await pool.query(
      `UPDATE voc_internal_notes SET body = $1 WHERE id = $2 RETURNING *`,
      [body, noteId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'PATCH /api/vocs/:vocId/notes/:noteId failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── DELETE /:vocId/notes/:noteId ──────────────────────────────────────────────

noteRouter.delete('/:noteId', async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { vocId, noteId } = req.params;

  if (!isManagerOrAdmin(user)) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM voc_internal_notes WHERE id = $1 AND voc_id = $2 AND deleted_at IS NULL`,
      [noteId, vocId],
    );

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const note = existing.rows[0] as { author_id: string };

    if (note.author_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    await pool.query(`UPDATE voc_internal_notes SET deleted_at = NOW() WHERE id = $1`, [noteId]);

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'DELETE /api/vocs/:vocId/notes/:noteId failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
