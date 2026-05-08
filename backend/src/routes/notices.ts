/**
 * Notices routes — Wave 4 (feature-notice-faq.md §10.3, §10.5).
 *
 * - GET / GET /:id / GET /popup → all authenticated users (visibility filtered).
 * - POST / PATCH / DELETE → admin or manager (role guard).
 * - POST /:id/restore → admin only.
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
import { validate } from '../middleware/validate';
import { HttpError } from '../middleware/httpError';
import {
  NoticeListQuery,
  NoticeCreate,
  NoticeUpdate,
  NoticeIdParam,
} from '../../../shared/contracts/notice';
import * as repo from '../repository/notices';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const noticesRouter = Router();

noticesRouter.use(auth);

noticesRouter.get(
  '/',
  validate({ query: NoticeListQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as unknown as import('../../../shared/contracts/notice').NoticeListQuery;
      const role = (req.user as AuthUser).role;
      const isAdmin = role === 'admin' || role === 'manager';
      const mode = q.mode === 'admin' && isAdmin ? 'admin' : 'user';
      const includeDeleted = Boolean(q.includeDeleted) && isAdmin;
      const { rows, total } = await repo.list({
        page: q.page,
        per_page: q.per_page,
        mode,
        includeDeleted,
      });
      res.json({ rows, page: q.page, per_page: q.per_page, total });
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.get('/popup', async (_req, res, next) => {
  try {
    const rows = await repo.popup();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

noticesRouter.get(
  '/:id',
  validate({ params: NoticeIdParam }),
  async (req, res, next) => {
    try {
      const n = await repo.getById(req.params.id as string);
      if (!n) return next(new HttpError(404, 'NOT_FOUND', '공지를 찾을 수 없습니다.'));
      res.json(n);
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.post(
  '/',
  requireRole('admin', 'manager'),
  validate({ body: NoticeCreate }),
  async (req, res, next) => {
    try {
      const created = await repo.create(req.body, (req.user as AuthUser).id);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.patch(
  '/:id',
  requireRole('admin', 'manager'),
  validate({ params: NoticeIdParam, body: NoticeUpdate }),
  async (req, res, next) => {
    try {
      const updated = await repo.update(req.params.id as string, req.body);
      if (!updated) return next(new HttpError(404, 'NOT_FOUND', '공지를 찾을 수 없습니다.'));
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.delete(
  '/:id',
  requireRole('admin', 'manager'),
  validate({ params: NoticeIdParam }),
  async (req, res, next) => {
    try {
      const ok = await repo.softDelete(req.params.id as string);
      if (!ok) return next(new HttpError(404, 'NOT_FOUND', '공지를 찾을 수 없습니다.'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// 복원: Admin 전용 — Manager가 삭제한 공지도 Admin만 복원 (§10.3.4).
noticesRouter.post(
  '/:id/restore',
  requireRole('admin'),
  validate({ params: NoticeIdParam }),
  async (req, res, next) => {
    try {
      const restored = await repo.restore(req.params.id as string);
      if (!restored) return next(new HttpError(404, 'NOT_FOUND', '공지를 찾을 수 없습니다.'));
      res.json(restored);
    } catch (err) {
      next(err);
    }
  },
);
