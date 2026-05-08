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
import { requireRole } from '../middleware/requireRole';
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

// VOC 등록 모달 cascade — archived 시스템 제외, nested menus 포함.
mastersRouter.get('/systems', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await repo.listSystems();
    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

// Admin 단독 — system_id 필터 + includeArchived 옵션. (contracts/master/io.ts:50)
mastersRouter.get(
  '/menus',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const systemId = typeof req.query.system_id === 'string' ? req.query.system_id : undefined;
      const includeArchived = req.query.includeArchived === 'true';
      const rows = await repo.listMenus({ systemId, includeArchived });
      res.json({ rows });
    } catch (err) {
      next(err);
    }
  },
);
