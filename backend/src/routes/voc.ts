import { Router, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import { createAuthMiddleware } from '../auth';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/voc';
import {
  vocListQuerySchema,
  vocUpdateSchema,
  vocCreateSchema,
  vocIdParamSchema,
  internalNoteCreateSchema,
  payloadReviewSubmitSchema,
} from '../validators/voc';
import type { AuthUser } from '../auth/types';
import * as trashRepo from '../repository/trash';
import { TrashIdParam } from '../../../shared/contracts/admin/trash';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const vocRouter = Router();

vocRouter.use(auth);

/** Existence-hiding guard: non-admin → 404 (ADR 0005). */
function requireAdminOrHide(): RequestHandler {
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

vocRouter.get('/', validate({ query: vocListQuerySchema }), controller.getList);
vocRouter.post('/', validate({ body: vocCreateSchema }), controller.postCreate);
vocRouter.get('/:id', validate({ params: vocIdParamSchema }), controller.getDetail);
vocRouter.patch(
  '/:id',
  validate({ params: vocIdParamSchema, body: vocUpdateSchema }),
  controller.patchVoc,
);
vocRouter.get('/:id/history', validate({ params: vocIdParamSchema }), controller.getHistory);
vocRouter.get('/:id/notes', validate({ params: vocIdParamSchema }), controller.getNotes);
vocRouter.post(
  '/:id/notes',
  validate({ params: vocIdParamSchema, body: internalNoteCreateSchema }),
  controller.postNote,
);
vocRouter.post(
  '/:id/payload-review',
  validate({ params: vocIdParamSchema, body: payloadReviewSubmitSchema }),
  controller.postPayloadReview,
);

// PATCH /api/vocs/:id/restore — Admin only (existence hiding, ADR 0005)
// NOTE: must be registered AFTER /:id PATCH to avoid ambiguity, but Express
// matches the more-specific path '/id/restore' before '/:id' when the literal
// segment 'restore' does not conflict with UUID patterns.
// Actually, we register this as a separate PATCH with a specific path suffix.
vocRouter.patch(
  '/:id/restore',
  requireAdminOrHide(),
  validate({ params: TrashIdParam }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = req.user as AuthUser;
      const result = await trashRepo.restoreVoc(req.params.id as string, actor.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
