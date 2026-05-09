/**
 * Admin External Masters routes — Wave 3 Phase D (W3-6)
 *
 * Permission matrix (ADR 0004 + OQ-2 Option B):
 *   Read   GET  /api/admin/masters/status  — admin / manager / dev
 *   Mutate POST /api/admin/masters/refresh — admin / manager only (dev → 403)
 *
 * Spec: requirements.md §16.3, external-masters.md §0/§6
 * Error codes: requirements.md §6.1
 *   RATE_LIMITED              → 429 (5-min cooldown)
 *   EXTERNAL_MASTER_UNAVAILABLE → 503 (atomic swap failed)
 */
import { Router, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import { createAuthMiddleware } from '../auth';
import { requireRole } from '../middleware/requireRole';
import * as svc from '../services/admin/external-masters';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const adminMastersRouter = Router();

adminMastersRouter.use(auth);

// ─── GET /api/admin/masters/status ─────────────────────────────────────────
// Read: admin / manager / dev  (user → 403)

adminMastersRouter.get(
  '/masters/status',
  requireRole('admin', 'manager', 'dev'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthUser;
      const status = svc.getMasterStatus(user.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/admin/masters/refresh ───────────────────────────────────────
// Mutate: admin / manager only  (dev → 403, user → 403)

adminMastersRouter.post(
  '/masters/refresh',
  requireRole('admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthUser;
      const result = await svc.triggerRefresh(user.id);
      res.json(result);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const typed = err as { code: string; cooldown_until?: string; kept_loaded_at?: string | null; message: string };
        if (typed.code === 'RATE_LIMITED') {
          res.status(429).json({
            code: 'RATE_LIMITED',
            message: typed.message,
            details: {
              cooldown_until: typed.cooldown_until ?? null,
              kept_loaded_at: typed.kept_loaded_at ?? null,
            },
          });
          return;
        }
        if (typed.code === 'EXTERNAL_MASTER_UNAVAILABLE') {
          res.status(503).json({
            code: 'EXTERNAL_MASTER_UNAVAILABLE',
            message: typed.message,
            details: {
              kept_loaded_at: typed.kept_loaded_at ?? null,
            },
          });
          return;
        }
      }
      next(err);
    }
  },
);
