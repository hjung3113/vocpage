/**
 * Masters routes — GET-only filter dropdown master data.
 * Auth required (same as VOC). PR-α Wave 1.5.
 */
import {
  Router,
  type RequestHandler,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { createAuthMiddleware } from '../auth';
import * as repo from '../repository/masters';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const mastersRouter = Router();

mastersRouter.use(auth);

mastersRouter.get('/assignees', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await repo.listAssignees();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

mastersRouter.get('/tags', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await repo.listTags();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

mastersRouter.get('/voc-types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await repo.listVocTypes();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});
