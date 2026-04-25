import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const noticesRouter = Router();

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

// ── GET /api/notices ──────────────────────────────────────────────────────────

noticesRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const isPrivileged = user.role === 'manager' || user.role === 'admin';

  try {
    let query: string;
    if (isPrivileged) {
      query = `SELECT * FROM notices WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    } else {
      query = `SELECT * FROM notices
               WHERE deleted_at IS NULL
                 AND is_visible = true
                 AND (visible_from IS NULL OR visible_from <= CURRENT_DATE)
                 AND (visible_to IS NULL OR visible_to >= CURRENT_DATE)
               ORDER BY created_at DESC`;
    }

    const result = await pool.query(query);
    res.json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    logger.error({ err }, 'GET /api/notices failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── GET /api/notices/popup ────────────────────────────────────────────────────

noticesRouter.get('/popup', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM notices
       WHERE deleted_at IS NULL
         AND is_popup = true
         AND is_visible = true
         AND (visible_from IS NULL OR visible_from <= CURRENT_DATE)
         AND (visible_to IS NULL OR visible_to >= CURRENT_DATE)
       ORDER BY
         CASE level WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END ASC`,
    );
    res.json({ notices: result.rows });
  } catch (err) {
    logger.error({ err }, 'GET /api/notices/popup failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── GET /api/notices/:id ──────────────────────────────────────────────────────

noticesRouter.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const isPrivileged = user.role === 'manager' || user.role === 'admin';

  try {
    const result = await pool.query(`SELECT * FROM notices WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const notice = result.rows[0] as {
      is_visible: boolean;
      visible_from: string | null;
      visible_to: string | null;
    };

    if (!isPrivileged) {
      // Check visibility/date range for regular users
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const from = notice.visible_from ? new Date(notice.visible_from) : null;
      const to = notice.visible_to ? new Date(notice.visible_to) : null;

      if (!notice.is_visible || (from && from > today) || (to && to < today)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'GET /api/notices/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/notices ─────────────────────────────────────────────────────────

noticesRouter.post('/', requireManager, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const {
    title,
    body,
    level = 'normal',
    is_popup = false,
    is_visible = true,
    visible_from = null,
    visible_to = null,
  } = req.body as {
    title?: string;
    body?: string;
    level?: string;
    is_popup?: boolean;
    is_visible?: boolean;
    visible_from?: string | null;
    visible_to?: string | null;
  };

  if (!title || !body) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO notices (title, body, level, is_popup, is_visible, visible_from, visible_to, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, body, level, is_popup, is_visible, visible_from, visible_to, user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'POST /api/notices failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /api/notices/:id ────────────────────────────────────────────────────

noticesRouter.patch('/:id', requireManager, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, body, level, is_popup, is_visible, visible_from, visible_to } = req.body as {
    title?: string;
    body?: string;
    level?: string;
    is_popup?: boolean;
    is_visible?: boolean;
    visible_from?: string | null;
    visible_to?: string | null;
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
  if (level !== undefined) {
    updates.push(`level = $${idx++}`);
    params.push(level);
  }
  if (is_popup !== undefined) {
    updates.push(`is_popup = $${idx++}`);
    params.push(is_popup);
  }
  if (is_visible !== undefined) {
    updates.push(`is_visible = $${idx++}`);
    params.push(is_visible);
  }
  if (visible_from !== undefined) {
    updates.push(`visible_from = $${idx++}`);
    params.push(visible_from);
  }
  if (visible_to !== undefined) {
    updates.push(`visible_to = $${idx++}`);
    params.push(visible_to);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE notices SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      params,
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'PATCH /api/notices/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── DELETE /api/notices/:id ───────────────────────────────────────────────────

noticesRouter.delete('/:id', requireManager, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE notices SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    logger.error({ err }, 'DELETE /api/notices/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/notices/:id/restore ─────────────────────────────────────────────

noticesRouter.post(
  '/:id/restore',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `UPDATE notices SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/notices/:id/restore failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── PATCH /api/notices/:id/visibility ────────────────────────────────────────

noticesRouter.patch(
  '/:id/visibility',
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_visible } = req.body as { is_visible?: boolean };

    if (is_visible === undefined) {
      res.status(400).json({ error: 'MISSING_IS_VISIBLE' });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE notices SET is_visible = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
        [is_visible, id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/notices/:id/visibility failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
