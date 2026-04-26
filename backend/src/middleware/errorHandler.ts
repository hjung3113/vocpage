import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error({ err }, err.message);
  }

  res.status(statusCode).json({
    code,
    message: err.message ?? 'Internal server error',
    details: err.details ?? null,
  });
}
