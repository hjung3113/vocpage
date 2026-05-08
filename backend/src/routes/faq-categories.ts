/**
 * FAQ Category routes — Wave 4 (feature-notice-faq.md §10.4.4).
 *
 * - GET / → all authenticated users (FAQ filter dropdown).
 * - POST / PATCH / DELETE → admin only (Manager는 카테고리 R/O).
 *   Manager에게도 GET은 허용하지만 mutation은 admin 전용.
 * - DELETE: 해당 카테고리에 속한 FAQ 항목이 1건 이상 있으면 409 에러.
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
  FaqCategoryCreate,
  FaqCategoryUpdate,
  FaqCategoryIdParam,
} from '../../../shared/contracts/faq';
import * as repo from '../repository/faqs';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const faqCategoriesRouter = Router();

faqCategoriesRouter.use(auth);

faqCategoriesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await repo.listCategories();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

faqCategoriesRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: FaqCategoryCreate }),
  async (req, res, next) => {
    try {
      const created = await repo.createCategory(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

faqCategoriesRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: FaqCategoryIdParam, body: FaqCategoryUpdate }),
  async (req, res, next) => {
    try {
      const updated = await repo.updateCategory(req.params.id as string, req.body);
      if (!updated)
        return next(new HttpError(404, 'NOT_FOUND', 'FAQ 카테고리를 찾을 수 없습니다.'));
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

faqCategoriesRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: FaqCategoryIdParam }),
  async (req, res, next) => {
    try {
      const result = await repo.deleteCategory(req.params.id as string);
      if (!result.ok && result.reason === 'has_items') {
        return next(
          new HttpError(
            409,
            'CATEGORY_HAS_ITEMS',
            '해당 카테고리에 FAQ 항목이 있어 삭제할 수 없습니다.',
          ),
        );
      }
      if (!result.ok)
        return next(new HttpError(404, 'NOT_FOUND', 'FAQ 카테고리를 찾을 수 없습니다.'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
