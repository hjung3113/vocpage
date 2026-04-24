import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function oidcAuthMiddleware(_req: Request, _res: Response, _next: NextFunction): never {
  throw new Error('OIDC auth not implemented');
}
