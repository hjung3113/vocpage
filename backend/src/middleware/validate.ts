import type { RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ZodType } from 'zod';
import { errorEnvelope } from './errorEnvelope';

export function validate<TBody = unknown, TQuery = unknown, TParams = unknown>(opts: {
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  params?: ZodType<TParams>;
}): RequestHandler {
  return (req, res, next) => {
    try {
      if (opts.body) {
        req.body = opts.body.parse(req.body);
      }
      if (opts.query) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.query = opts.query.parse(req.query) as any;
      }
      if (opts.params) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.params = opts.params.parse(req.params) as any;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json(errorEnvelope('VALIDATION_ERROR', 'Validation failed', err.issues));
        return;
      }
      next(err);
    }
  };
}
