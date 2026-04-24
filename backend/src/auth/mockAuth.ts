import { Request, Response, NextFunction } from 'express';

export function mockAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.session.user) {
    req.user = req.session.user;
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}
