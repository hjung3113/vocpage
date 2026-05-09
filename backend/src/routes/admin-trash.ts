/**
 * Admin trash routes — Wave 3 Phase C (W3-5).
 *
 * Permission: Admin only. Non-admin → 404 (existence hiding, ADR 0005).
 * Spec: requirements.md §15.4 + feature-voc.md §9.4.7.
 *
 * Endpoints:
 *   GET  /api/admin/vocs/trash           — list soft-deleted VOCs
 *   GET  /api/admin/vocs/:id/restore-log — audit log for a voc
 */
import { Router } from 'express';
import { createAuthMiddleware } from '../auth';
import { validate } from '../middleware/validate';
import { HttpError } from '../middleware/httpError';
import * as repo from '../repository/trash';
import { TrashListQuery, TrashIdParam } from '../../../shared/contracts/admin/trash';
import type { AuthUser } from '../auth/types';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Existence-hiding guard: non-admin → 404, not 403 (ADR 0005). */
function requireAdmin(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.', details: null });
      return;
    }
    if ((req.user as AuthUser).role !== 'admin') {
      res
        .status(404)
        .json({ code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다.', details: null });
      return;
    }
    next();
  };
}

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const adminTrashRouter = Router();

adminTrashRouter.use(auth);
// FU-022: requireAdmin() applied per-route (not router-level) so non-matching
// paths fall through to the next admin-* router instead of being intercepted
// here. Mounting all four admin routers under `/api/admin` simultaneously
// (index.ts) exposes the router-level interception bug; per-route guard fixes.

/** Validate and coerce TrashListQuery from query-string. */
function parseTrashQuery(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = TrashListQuery.safeParse(req.query);
    if (!parsed.success) {
      next(
        new HttpError(
          400,
          'VALIDATION_ERROR',
          '유효하지 않은 쿼리 파라미터입니다.',
          parsed.error,
        ),
      );
      return;
    }
    (req as Request & { parsedQuery: unknown }).parsedQuery = parsed.data;
    next();
  };
}

// GET /api/admin/vocs/trash
adminTrashRouter.get(
  '/vocs/trash',
  requireAdmin(),
  parseTrashQuery(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = req.user as AuthUser;
      const query = (req as Request & { parsedQuery: TrashListQuery }).parsedQuery;
      const result = await repo.listTrashedVocs(query, actor.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/admin/vocs/:id/restore-log
adminTrashRouter.get(
  '/vocs/:id/restore-log',
  requireAdmin(),
  validate({ params: TrashIdParam }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const log = await repo.getRestoreLog(req.params.id as string);
      res.json(log);
    } catch (err) {
      next(err);
    }
  },
);
