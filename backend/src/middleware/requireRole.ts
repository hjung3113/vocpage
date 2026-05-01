import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'manager' | 'dev' | 'user';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.', details: null });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ code: 'FORBIDDEN', message: '접근 권한이 없습니다.', details: null });
      return;
    }
    next();
  };
}
