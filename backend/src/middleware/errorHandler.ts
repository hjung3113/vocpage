import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../logger';
import { errorEnvelope, HttpError } from './errorEnvelope';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler — emits the canonical envelope shape:
 *   { error: { code, message, details? } }
 *
 * - ZodError → 400 VALIDATION_ERROR
 * - HttpError / err.statusCode known → original message preserved
 * - Unknown 500 → server-side stack log; client gets generic 'Internal server error'
 *   (never leak err.message for unknown errors).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json(errorEnvelope('VALIDATION_ERROR', 'Validation failed', err.issues));
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, stack: err.stack }, err.message);
    }
    res.status(err.status).json(errorEnvelope(err.code, err.message, err.details));
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    // Log full stack server-side, do NOT leak err.message to the client.
    logger.error({ err, stack: err.stack }, err.message ?? 'Internal server error');
    res.status(statusCode).json(errorEnvelope('INTERNAL_ERROR', 'Internal server error'));
    return;
  }

  res.status(statusCode).json(errorEnvelope(code, err.message ?? 'Request failed', err.details));
}
