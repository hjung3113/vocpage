import { Router, type RequestHandler } from 'express';
import { createAuthMiddleware } from '../auth';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/voc';
import {
  vocListQuerySchema,
  vocUpdateSchema,
  vocCreateSchema,
  vocIdParamSchema,
  internalNoteCreateSchema,
} from '../validators/voc';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const vocRouter = Router();

vocRouter.use(auth);

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
