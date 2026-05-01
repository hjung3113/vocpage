import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../logger';

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
    traceId?: string;
  };
}

export function errorEnvelope(code: string, message: string, details?: unknown): ErrorEnvelope {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorEnvelopeMiddleware(
  err: unknown,
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
      logger.error({ err }, err.message);
    }
    res.status(err.status).json(errorEnvelope(err.code, err.message, err.details));
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error({ err }, message);
  res.status(500).json(errorEnvelope('INTERNAL_ERROR', message));
}
