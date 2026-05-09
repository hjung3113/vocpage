/**
 * Comments HTTP routes — feature-voc.md §8.13.
 *
 *  GET    /api/vocs/:id/comments               — list comments
 *  POST   /api/vocs/:id/comments               — create comment
 *  PATCH  /api/vocs/:id/comments/:commentId    — update comment (author / admin)
 *  DELETE /api/vocs/:id/comments/:commentId    — delete comment (author / admin)
 *
 * Mounted at `/api/vocs/:id/comments` in index.ts with mergeParams: true
 * so req.params.id resolves to the VOC id.
 */
import { Router, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import { createAuthMiddleware } from '../auth';
import * as service from '../services/comments';
import type { AuthUser } from '../auth/types';
import { ZodError } from 'zod';
import { CreateCommentInput, UpdateCommentInput } from '../../../shared/contracts/comment';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.use(auth);

// GET /api/vocs/:id/comments
commentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    const result = await service.listComments(req.params.id as string, user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/vocs/:id/comments
commentsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    let parsed: { body: string };
    try {
      parsed = CreateCommentInput.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          code: 'BODY_REQUIRED',
          message: '댓글 내용을 입력해 주세요.',
          details: err.issues,
        });
        return;
      }
      throw err;
    }
    const result = await service.createComment(req.params.id as string, parsed.body, user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/vocs/:id/comments/:commentId
commentsRouter.patch('/:commentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    let parsed: { body: string };
    try {
      parsed = UpdateCommentInput.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          code: 'BODY_REQUIRED',
          message: '댓글 내용을 입력해 주세요.',
          details: err.issues,
        });
        return;
      }
      throw err;
    }
    const result = await service.updateComment(
      req.params.id as string,
      req.params.commentId as string,
      parsed.body,
      user,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vocs/:id/comments/:commentId
commentsRouter.delete('/:commentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthUser;
    const result = await service.deleteComment(
      req.params.id as string,
      req.params.commentId as string,
      user,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});
