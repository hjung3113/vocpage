/**
 * FAQ routes — Wave 4 (feature-notice-faq.md §10.4, §10.5).
 *
 * - GET / GET /:id → all authenticated users (visibility filtered).
 * - POST / PATCH / DELETE → admin or manager.
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
  FaqListQuery,
  FaqCreate,
  FaqUpdate,
  FaqIdParam,
} from '../../../shared/contracts/faq';
import * as repo from '../repository/faqs';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const faqsRouter = Router();

faqsRouter.use(auth);

faqsRouter.get(
  '/',
  validate({ query: FaqListQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as unknown as import('../../../shared/contracts/faq').FaqListQuery;
      const role = (req.user as AuthUser).role;
      const isAdmin = role === 'admin' || role === 'manager';
      const mode = q.mode === 'admin' && isAdmin ? 'admin' : 'user';
      const includeDeleted = Boolean(q.includeDeleted) && isAdmin;
      const { rows, total } = await repo.listFaqs({
        page: q.page,
        per_page: q.per_page,
        category_id: q.category_id,
        q: q.q,
        mode,
        includeDeleted,
      });
      res.json({ rows, page: q.page, per_page: q.per_page, total });
    } catch (err) {
      next(err);
    }
  },
);

faqsRouter.get('/:id', validate({ params: FaqIdParam }), async (req, res, next) => {
  try {
    const f = await repo.getFaqById(req.params.id as string);
    if (!f) return next(new HttpError(404, 'NOT_FOUND', 'FAQ를 찾을 수 없습니다.'));
    res.json(f);
  } catch (err) {
    next(err);
  }
});

faqsRouter.post(
  '/',
  requireRole('admin', 'manager'),
  validate({ body: FaqCreate }),
  async (req, res, next) => {
    try {
      const created = await repo.createFaq(req.body, (req.user as AuthUser).id);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

faqsRouter.patch(
  '/:id',
  requireRole('admin', 'manager'),
  validate({ params: FaqIdParam, body: FaqUpdate }),
  async (req, res, next) => {
    try {
      const updated = await repo.updateFaq(req.params.id as string, req.body);
      if (!updated) return next(new HttpError(404, 'NOT_FOUND', 'FAQ를 찾을 수 없습니다.'));
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

faqsRouter.delete(
  '/:id',
  requireRole('admin', 'manager'),
  validate({ params: FaqIdParam }),
  async (req, res, next) => {
    try {
      const ok = await repo.softDeleteFaq(req.params.id as string);
      if (!ok) return next(new HttpError(404, 'NOT_FOUND', 'FAQ를 찾을 수 없습니다.'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

faqsRouter.post(
  '/:id/restore',
  requireRole('admin'),
  validate({ params: FaqIdParam }),
  async (req, res, next) => {
    try {
      const restored = await repo.restoreFaq(req.params.id as string);
      if (!restored) return next(new HttpError(404, 'NOT_FOUND', 'FAQ를 찾을 수 없습니다.'));
      res.json(restored);
    } catch (err) {
      next(err);
    }
  },
);
