/**
 * Dashboard Phase C routes — Wave 2 Phase C.
 *
 * 7 GET endpoints:
 *   GET /api/dashboard/distribution
 *   GET /api/dashboard/priority-status-matrix
 *   GET /api/dashboard/heatmap
 *   GET /api/dashboard/weekly-trend
 *   GET /api/dashboard/processing-speed
 *   GET /api/dashboard/assignee-stats
 *   GET /api/dashboard/aging-vocs
 *
 * Permission: dev / manager / admin only (same as /api/dashboard/summary).
 * User role → 403. Unauthenticated → 401.
 * Spec: docs/specs/requires/dashboard.md §2–§9 + wave-2-phase-c.md.
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
import {
  DistributionFilter,
  PriorityStatusMatrixFilter,
  HeatmapFilter,
  WeeklyTrendFilter,
  ProcessingSpeedFilter,
  AssigneeStatsFilter,
  AgingVocsFilter,
} from '../../../shared/contracts/dashboard';
import * as service from '../services/dashboard/phase-c.service';
import { HttpError } from '../middleware/httpError';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const dashboardPhaseCRouter = Router();

dashboardPhaseCRouter.use(auth);
dashboardPhaseCRouter.use(requireRole('dev', 'manager', 'admin'));

// ── GET /distribution ─────────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/distribution',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = DistributionFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getDistribution(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /priority-status-matrix ───────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/priority-status-matrix',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = PriorityStatusMatrixFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getPriorityStatusMatrix(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /heatmap ──────────────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/heatmap',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = HeatmapFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getHeatmap(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /weekly-trend ─────────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/weekly-trend',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = WeeklyTrendFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getWeeklyTrend(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /processing-speed ─────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/processing-speed',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ProcessingSpeedFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getProcessingSpeed(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /assignee-stats ───────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/assignee-stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AssigneeStatsFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getAssigneeStats(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /aging-vocs ───────────────────────────────────────────────────────────

dashboardPhaseCRouter.get(
  '/aging-vocs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AgingVocsFilter.safeParse(req.query);
      if (!parsed.success) {
        throw new HttpError(400, 'BAD_REQUEST', 'Invalid query', parsed.error.flatten());
      }
      const result = await service.getAgingVocs(parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
