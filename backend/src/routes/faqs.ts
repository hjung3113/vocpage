import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';

export const faqCategoriesRouter = Router();
export const faqsRouter = Router();

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

// ── GET /api/faq-categories ───────────────────────────────────────────────────

faqCategoriesRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const isPrivileged = user.role === 'manager' || user.role === 'admin';

  try {
    const query = isPrivileged
      ? `SELECT * FROM faq_categories ORDER BY sort_order ASC`
      : `SELECT * FROM faq_categories WHERE is_archived = false ORDER BY sort_order ASC`;

    const result = await pool.query(query);
    res.json({ data: result.rows });
  } catch (err) {
    logger.error({ err }, 'GET /api/faq-categories failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/faq-categories ──────────────────────────────────────────────────

faqCategoriesRouter.post(
  '/',
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const {
      name,
      slug,
      sort_order = 0,
    } = req.body as {
      name?: string;
      slug?: string;
      sort_order?: number;
    };

    if (!name || !slug) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO faq_categories (name, slug, sort_order) VALUES ($1, $2, $3) RETURNING *`,
        [name, slug, sort_order],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/faq-categories failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── PATCH /api/faq-categories/:id ────────────────────────────────────────────

faqCategoriesRouter.patch(
  '/:id',
  requireManager,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, sort_order, is_archived } = req.body as {
      name?: string;
      slug?: string;
      sort_order?: number;
      is_archived?: boolean;
    };

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${idx++}`);
      params.push(slug);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      params.push(sort_order);
    }
    if (is_archived !== undefined) {
      updates.push(`is_archived = $${idx++}`);
      params.push(is_archived);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
      return;
    }

    params.push(id);

    try {
      const result = await pool.query(
        `UPDATE faq_categories SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/faq-categories/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── GET /api/faqs ─────────────────────────────────────────────────────────────

faqsRouter.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const isPrivileged = user.role === 'manager' || user.role === 'admin';
  const { category_id, q } = req.query as { category_id?: string; q?: string };

  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let idx = 1;

  if (!isPrivileged) {
    conditions.push(`is_visible = true`);
  }

  if (category_id) {
    conditions.push(`category_id = $${idx++}`);
    params.push(category_id);
  }

  if (q) {
    conditions.push(`(question ILIKE $${idx} OR answer ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const result = await pool.query(
      `SELECT * FROM faqs ${where} ORDER BY sort_order ASC, created_at DESC`,
      params,
    );
    res.json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    logger.error({ err }, 'GET /api/faqs failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── GET /api/faqs/:id ─────────────────────────────────────────────────────────

faqsRouter.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const isPrivileged = user.role === 'manager' || user.role === 'admin';

  try {
    const result = await pool.query(`SELECT * FROM faqs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const faq = result.rows[0] as { is_visible: boolean };

    if (!isPrivileged && !faq.is_visible) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json(faq);
  } catch (err) {
    logger.error({ err }, 'GET /api/faqs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/faqs ────────────────────────────────────────────────────────────

faqsRouter.post('/', requireManager, async (req: Request, res: Response): Promise<void> => {
  const user = req.user as AuthUser;
  const {
    question,
    answer,
    category_id,
    is_visible = true,
    sort_order = 0,
  } = req.body as {
    question?: string;
    answer?: string;
    category_id?: string;
    is_visible?: boolean;
    sort_order?: number;
  };

  if (!question || !answer || !category_id) {
    res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO faqs (question, answer, category_id, is_visible, sort_order, author_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [question, answer, category_id, is_visible, sort_order, user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'POST /api/faqs failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── PATCH /api/faqs/:id ───────────────────────────────────────────────────────

faqsRouter.patch('/:id', requireManager, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { question, answer, category_id, is_visible, sort_order } = req.body as {
    question?: string;
    answer?: string;
    category_id?: string;
    is_visible?: boolean;
    sort_order?: number;
  };

  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (question !== undefined) {
    updates.push(`question = $${idx++}`);
    params.push(question);
  }
  if (answer !== undefined) {
    updates.push(`answer = $${idx++}`);
    params.push(answer);
  }
  if (category_id !== undefined) {
    updates.push(`category_id = $${idx++}`);
    params.push(category_id);
  }
  if (is_visible !== undefined) {
    updates.push(`is_visible = $${idx++}`);
    params.push(is_visible);
  }
  if (sort_order !== undefined) {
    updates.push(`sort_order = $${idx++}`);
    params.push(sort_order);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE faqs SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      params,
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'PATCH /api/faqs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── DELETE /api/faqs/:id ──────────────────────────────────────────────────────

faqsRouter.delete('/:id', requireManager, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE faqs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    logger.error({ err }, 'DELETE /api/faqs/:id failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ── POST /api/faqs/:id/restore ────────────────────────────────────────────────

faqsRouter.post(
  '/:id/restore',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `UPDATE faqs SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/faqs/:id/restore failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── PATCH /api/faqs/:id/visibility ────────────────────────────────────────────

faqsRouter.patch(
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
        `UPDATE faqs SET is_visible = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
        [is_visible, id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/faqs/:id/visibility failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
