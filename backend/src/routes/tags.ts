import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

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

// ── GET /api/tags ─────────────────────────────────────────────────────────────

export const tagsRouter = Router();

tagsRouter.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT * FROM tags ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/tags failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── /api/vocs/:id/tags ────────────────────────────────────────────────────────

export const vocTagsRouter = Router({ mergeParams: true });

vocTagsRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user as AuthUser;

  try {
    const vocRes = await pool.query(`SELECT * FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    if (vocRes.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const voc = vocRes.rows[0] as { author_id: string };
    if (user.role === 'user' && voc.author_id !== user.id) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const result = await pool.query(
      `SELECT vt.voc_id, vt.tag_id, vt.source, vt.created_at, t.name, t.slug, t.kind
       FROM voc_tags vt JOIN tags t ON vt.tag_id = t.id
       WHERE vt.voc_id = $1
       ORDER BY vt.created_at ASC`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/vocs/:id/tags failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

vocTagsRouter.post(
  '/',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { tag_id } = req.body as { tag_id?: string };

    if (!tag_id) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    try {
      const vocRes = await pool.query(`SELECT id FROM vocs WHERE id = $1 AND deleted_at IS NULL`, [
        id,
      ]);
      if (vocRes.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const tagRes = await pool.query(`SELECT id FROM tags WHERE id = $1`, [tag_id]);
      if (tagRes.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const existing = await pool.query(
        `SELECT 1 FROM voc_tags WHERE voc_id = $1 AND tag_id = $2`,
        [id, tag_id],
      );
      if ((existing.rowCount ?? 0) > 0) {
        res.status(409).json({ error: 'CONFLICT' });
        return;
      }

      await pool.query(`INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'manual')`, [
        id,
        tag_id,
      ]);

      const result = await pool.query(
        `SELECT vt.voc_id, vt.tag_id, vt.source, vt.created_at, t.name, t.slug, t.kind
         FROM voc_tags vt JOIN tags t ON vt.tag_id = t.id
         WHERE vt.voc_id = $1 AND vt.tag_id = $2`,
        [id, tag_id],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/vocs/:id/tags failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

vocTagsRouter.delete(
  '/:tagId',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id, tagId } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM voc_tags WHERE voc_id = $1 AND tag_id = $2 RETURNING voc_id`,
        [id, tagId],
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      logger.error({ err }, 'DELETE /api/vocs/:id/tags/:tagId failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── /api/tag-rules ────────────────────────────────────────────────────────────

export const tagRulesRouter = Router();

tagRulesRouter.get(
  '/',
  requireAuth,
  requireManager,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT * FROM tag_rules ORDER BY sort_order ASC, created_at ASC`,
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/tag-rules failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

tagRulesRouter.post(
  '/',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { name, pattern, tag_id, is_active, sort_order } = req.body as {
      name?: string;
      pattern?: string;
      tag_id?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    if (!name || !pattern || !tag_id) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO tag_rules (name, pattern, tag_id, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, pattern, tag_id, is_active ?? true, sort_order ?? 0],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/tag-rules failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

tagRulesRouter.patch(
  '/:id',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, pattern, tag_id, is_active, sort_order } = req.body as {
      name?: string;
      pattern?: string;
      tag_id?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (pattern !== undefined) {
      updates.push(`pattern = $${idx++}`);
      params.push(pattern);
    }
    if (tag_id !== undefined) {
      updates.push(`tag_id = $${idx++}`);
      params.push(tag_id);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      params.push(is_active);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      params.push(sort_order);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
      return;
    }

    params.push(id);
    try {
      const result = await pool.query(
        `UPDATE tag_rules SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/tag-rules/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

tagRulesRouter.delete(
  '/:id',
  requireAuth,
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const result = await pool.query(`DELETE FROM tag_rules WHERE id = $1 RETURNING id`, [id]);
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      logger.error({ err }, 'DELETE /api/tag-rules/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
