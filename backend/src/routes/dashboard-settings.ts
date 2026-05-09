/**
 * Dashboard settings routes — Wave 2 Phase D (dashboard.md §11).
 *
 * GET  /api/dashboard/settings  → any authenticated user, returns merged DashboardSettings.
 * PUT  /api/dashboard/settings  → any authenticated user, body: DashboardSettingsUpdate.
 *   ?scope=admin (admin only) → writes to admin-default row (user_id IS NULL).
 */
import {
  Router,
  type RequestHandler,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { createAuthMiddleware } from '../auth';
import { validate } from '../middleware/validate';
import { DashboardSettingsUpdate } from '../../../shared/contracts/dashboard';
import * as service from '../services/dashboard/settings.service';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const dashboardSettingsRouter = Router();

dashboardSettingsRouter.use(auth);

dashboardSettingsRouter.get(
  '/settings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const settings = await service.loadResolved(user.id);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },
);

dashboardSettingsRouter.put(
  '/settings',
  validate({ body: DashboardSettingsUpdate }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const scope: 'self' | 'admin' =
        req.query.scope === 'admin' ? 'admin' : 'self';
      const settings = await service.update(user, req.body as DashboardSettingsUpdate, scope);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  },
);
