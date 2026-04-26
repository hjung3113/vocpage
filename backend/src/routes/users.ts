import { Router, Request, Response } from 'express';
import { pool } from '../db';
import logger from '../logger';

export const usersRouter = Router();

usersRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, display_name AS name, role FROM users WHERE is_active = true ORDER BY display_name',
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'GET /api/users failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
