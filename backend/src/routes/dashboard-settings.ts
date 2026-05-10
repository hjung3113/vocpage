/**
 * Dashboard settings routes — Wave 2 Phase D + E (dashboard.md §11).
 *
 * GET  /api/dashboard/settings           → authenticated, returns merged (admin∘personal).
 * GET  /api/dashboard/settings?scope=admin → admin only, returns admin-default raw row.
 * PUT  /api/dashboard/settings           → authenticated, body: DashboardSettingsUpdate.
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
import { HttpError } from '../middleware/httpError';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const dashboardSettingsRouter = Router();

dashboardSettingsRouter.use(auth);

dashboardSettingsRouter.get(
  '/settings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const scope: 'self' | 'admin' = req.query.scope === 'admin' ? 'admin' : 'self';
      if (scope === 'admin') {
        if (user.role !== 'admin') {
          throw new HttpError(
            403,
            'FORBIDDEN_ADMIN_SCOPE',
            '관리자만 ?scope=admin 으로 조회할 수 있습니다.',
          );
        }
        const settings = await service.loadAdminDefault();
        res.json(settings);
        return;
      }
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
