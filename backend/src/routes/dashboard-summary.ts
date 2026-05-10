/**
 * Dashboard summary route — Wave 2 Phase B (dashboard.md §1, §8.3).
 *
 * GET /api/dashboard/summary?systemId&menuId&assigneeId&range&startDate&endDate
 * → 200 DashboardSummary (KPI Volume + Quality, 8 metrics).
 *
 * Permission: dev / manager / admin only. `user` role → 403 (§8.3).
 */
import {
  Router,
  type RequestHandler,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { createAuthMiddleware } from '../auth';
import { requireRole } from '../middleware/requireRole';
import { DashboardFilter } from '../../../shared/contracts/dashboard';
import * as service from '../services/dashboard/summary.service';
import { HttpError } from '../middleware/httpError';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const dashboardSummaryRouter = Router();

dashboardSummaryRouter.use(auth);
dashboardSummaryRouter.use(requireRole('dev', 'manager', 'admin'));

dashboardSummaryRouter.get(
  '/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = DashboardFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const user = req.user as AuthUser;
      const summary = await service.getSummary({ filter: parsed.data, userId: user.id });
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
);
