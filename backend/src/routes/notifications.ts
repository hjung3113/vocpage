/**
 * Notifications HTTP routes — Wave 5 Phase A.
 *
 *  GET  /api/notifications              — list (lazy trim + isUrgent join)
 *  GET  /api/notifications/unread-count — count + ETag/304
 *  POST /api/notifications/mark-all-read
 *  PATCH /api/notifications/:id/read
 *
 * Auth: standard `createAuthMiddleware` (mock or AD session).
 */
import { Router, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import { createAuthMiddleware } from '../auth';
import * as service from '../services/notifications';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const notificationsRouter = Router();

notificationsRouter.use(auth);

notificationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    const result = await service.listNotifications(user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

notificationsRouter.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    const { count, etag } = await service.getUnreadCount(user.id);
    const incoming = req.headers['if-none-match'];
    if (incoming && incoming === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    await service.markAllRead(user.id);
    res.json({ unreadCount: 0 });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    const ok = await service.markOneRead(req.params.id as string, user.id);
    if (!ok) {
      res
        .status(404)
        .json({ code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다.', details: null });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
