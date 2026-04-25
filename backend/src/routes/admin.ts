import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';
import type { AuthUser } from '../auth/types';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const adminRouter = Router();
export const systemsPublicRouter = Router();
export const vocTypesPublicRouter = Router();

// ── Systems (Admin) ──────────────────────────────────────────────────────────

adminRouter.get(
  '/systems',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT s.id, s.name, s.slug, s.is_archived,
                COUNT(v.id) AS voc_count
         FROM systems s
         LEFT JOIN vocs v ON v.system_id = s.id AND v.deleted_at IS NULL
         GROUP BY s.id, s.name, s.slug, s.is_archived
         ORDER BY s.name`,
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/admin/systems failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.post(
  '/systems',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { name, slug } = req.body as { name?: string; slug?: string };

    if (!name || !slug) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    // R7-5: wrap in transaction — orphan system impossible if menu insert fails
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const sysResult = await client.query(
        `INSERT INTO systems (name, slug) VALUES ($1, $2) RETURNING *`,
        [name, slug],
      );
      const system = sysResult.rows[0] as { id: string };

      const menuResult = await client.query(
        `INSERT INTO menus (system_id, name, slug) VALUES ($1, $2, $3) RETURNING *`,
        [system.id, '기타', 'other'],
      );
      const menu = menuResult.rows[0];

      await client.query('COMMIT');
      res.status(201).json({ system, menu });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error({ err }, 'POST /api/admin/systems failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }
  },
);

adminRouter.patch(
  '/systems/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, is_archived } = req.body as {
      name?: string;
      slug?: string;
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
        `UPDATE systems SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/admin/systems/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── Menus (Admin) ────────────────────────────────────────────────────────────

adminRouter.get(
  '/menus',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { systemId } = req.query as { systemId?: string };

    if (!systemId) {
      res.status(400).json({ error: 'MISSING_SYSTEM_ID' });
      return;
    }

    try {
      const result = await pool.query(
        `SELECT m.id, m.system_id, m.name, m.slug, m.is_archived,
                COUNT(v.id) AS voc_count
         FROM menus m
         LEFT JOIN vocs v ON v.menu_id = m.id AND v.deleted_at IS NULL
         WHERE m.system_id = $1
         GROUP BY m.id, m.system_id, m.name, m.slug, m.is_archived
         ORDER BY m.name`,
        [systemId],
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/admin/menus failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.post(
  '/menus',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { system_id, name, slug } = req.body as {
      system_id?: string;
      name?: string;
      slug?: string;
    };

    if (!system_id || !name || !slug) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO menus (system_id, name, slug) VALUES ($1, $2, $3) RETURNING *`,
        [system_id, name, slug],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/admin/menus failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.patch(
  '/menus/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, is_archived } = req.body as {
      name?: string;
      slug?: string;
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
        `UPDATE menus SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/admin/menus/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── VOC Types (Admin) ────────────────────────────────────────────────────────

adminRouter.get(
  '/voc-types',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT t.id, t.name, t.slug, t.color, t.sort_order, t.is_archived,
                COUNT(v.id) AS voc_count
         FROM voc_types t
         LEFT JOIN vocs v ON v.voc_type_id = t.id AND v.deleted_at IS NULL
         GROUP BY t.id, t.name, t.slug, t.color, t.sort_order, t.is_archived
         ORDER BY t.sort_order ASC`,
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/admin/voc-types failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.post(
  '/voc-types',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { name, slug, color, sort_order } = req.body as {
      name?: string;
      slug?: string;
      color?: string;
      sort_order?: number;
    };

    if (!name || !slug || !color) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
      return;
    }

    try {
      const result = await pool.query(
        `INSERT INTO voc_types (name, slug, color, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, slug, color, sort_order ?? 0],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'POST /api/admin/voc-types failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.patch(
  '/voc-types/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, color, sort_order, is_archived } = req.body as {
      name?: string;
      slug?: string;
      color?: string;
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
    if (color !== undefined) {
      updates.push(`color = $${idx++}`);
      params.push(color);
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
        `UPDATE voc_types SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/admin/voc-types/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── Users (Admin) ────────────────────────────────────────────────────────────

adminRouter.get(
  '/users',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT id, ad_username, display_name, email, role, is_active, created_at
         FROM users
         ORDER BY display_name`,
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/admin/users failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

adminRouter.patch(
  '/users/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser;
    const { id } = req.params;
    const { role, is_active } = req.body as {
      role?: string;
      is_active?: boolean;
    };

    // Cannot modify self
    if (user.id === id) {
      res.status(400).json({ error: 'CANNOT_MODIFY_SELF' });
      return;
    }

    // Check last admin guard: only relevant if we're demoting someone away from admin
    if (role !== undefined && role !== 'admin') {
      try {
        // Check if target user is currently an admin
        const targetResult = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
        if (targetResult.rowCount === 0) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const targetCurrentRole = (targetResult.rows[0] as { role: string }).role;
        if (targetCurrentRole === 'admin') {
          const countResult = await pool.query(
            `SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true`,
          );
          const count = parseInt(countResult.rows[0].count as string, 10);
          if (count <= 1) {
            res.status(400).json({ error: 'LAST_ADMIN' });
            return;
          }
        }
      } catch (err) {
        logger.error({ err }, 'PATCH /api/admin/users/:id last-admin check failed');
        res.status(500).json({ error: 'INTERNAL_ERROR' });
        return;
      }
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
      return;
    }

    params.push(id);
    try {
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      logger.error({ err }, 'PATCH /api/admin/users/:id failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ── Public read-only routes (requireAuth — for VOC creation forms) ────────────

systemsPublicRouter.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, is_archived
         FROM systems
         WHERE is_archived = false
         ORDER BY name`,
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/systems failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

systemsPublicRouter.get(
  '/:id/menus',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT id, system_id, name, slug, is_archived
         FROM menus
         WHERE system_id = $1 AND is_archived = false
         ORDER BY name`,
        [id],
      );
      res.json(result.rows);
    } catch (err) {
      logger.error({ err }, 'GET /api/systems/:id/menus failed');
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

vocTypesPublicRouter.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, color, sort_order, is_archived
         FROM voc_types
         WHERE is_archived = false
         ORDER BY sort_order ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/voc-types failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
