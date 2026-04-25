import { Router, Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { masterCache } from '../services/masterCache';
import type { AuthUser } from '../auth/types';

export const mastersRouter = Router();
export const adminMastersRouter = Router();

// ── Auth middleware helpers ───────────────────────────────────────────────────

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

// ── Shared refresh handler ────────────────────────────────────────────────────

async function handleRefresh(req: Request, res: Response): Promise<void> {
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
    logger.error({ err }, 'masters/refresh failed');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

// ── GET /api/masters/status ──────────────────────────────────────────────────

mastersRouter.get('/status', requireAuth, requireManager, (_req: Request, res: Response): void => {
  const { mode, loaded_at } = masterCache.get();
  res.json({ mode, loaded_at });
});

// ── GET /api/masters/search?type=&q= ────────────────────────────────────────

const VALID_TYPES = [
  'equipment',
  'maker',
  'model',
  'process',
  'db_tables',
  'jobs',
  'sps',
  'programs',
];

mastersRouter.get('/search', requireAuth, requireManager, (req: Request, res: Response): void => {
  const { type, q } = req.query as { type?: string; q?: string };
  if (!type || typeof type !== 'string') {
    res.status(400).json({ error: 'MISSING_TYPE' });
    return;
  }
  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ error: 'INVALID_TYPE' });
    return;
  }
  if (typeof q !== 'string' || q.trim().length === 0 || q.length > 64) {
    res.status(400).json({ error: 'INVALID_Q', message: 'q must be 1-64 chars' });
    return;
  }
  const items = masterCache.search(type, q);
  const { mode } = masterCache.get();
  res.json({ items, mode });
});

// ── POST /api/masters/vocs/:id/refresh (mounted on mastersRouter) ─────────────
// Handles POST /api/vocs/:id/masters/refresh via vocRouter → mastersRouter mounting

mastersRouter.post('/refresh', requireAuth, requireManager, handleRefresh);

// ── POST /api/admin/masters/refresh ─────────────────────────────────────────

adminMastersRouter.post('/refresh', requireAuth, requireManager, handleRefresh);
