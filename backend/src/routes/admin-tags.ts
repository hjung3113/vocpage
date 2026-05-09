/**
 * Admin Tag Master routes (W3-4)
 *
 * Permission matrix (ADR 0004 Option D):
 *   Read   GET /api/admin/tags              — admin / manager / dev
 *   Mutate POST /api/admin/tags             — manager+
 *          PATCH /api/admin/tags/:id        — manager+
 *   Admin  POST  /api/admin/tags/:id/merge  — admin only
 *          PATCH /api/admin/tags/:id/external — admin only
 *          DELETE /api/admin/tags/:id       — admin only
 *          PATCH /api/admin/tag-rules/:id/suspend — admin only
 *
 * Spec: requirements.md §15.3 + feature-voc.md §9.4.6 + shared/contracts/admin/tag.ts
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
import { validate } from '../middleware/validate';
import { z } from 'zod';
import {
  TagMasterListQuery,
  TagMasterCreate,
  TagMasterPatch,
  TagMasterMergeInput,
  TagExternalToggle,
  TagRuleSuspendInput,
  TagIdParam,
  type TagMasterListQuery as TagMasterListQueryT,
  type TagMasterCreate as TagMasterCreateT,
  type TagMasterPatch as TagMasterPatchT,
  type TagMasterMergeInput as TagMasterMergeInputT,
  type TagExternalToggle as TagExternalToggleT,
  type TagRuleSuspendInput as TagRuleSuspendInputT,
} from '../../../shared/contracts/admin/tag';
import * as svc from '../services/admin/tag-master';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

export const adminTagsRouter = Router();

adminTagsRouter.use(auth);

// ── Helpers ──────────────────────────────────────────────────────────────────

const RuleIdParam = z.object({ id: z.string().uuid() });

function mapServiceError(err: unknown): { status: number; code: string; message: string } {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const e = err as { code: string; message: string };
    if (e.code === 'NOT_FOUND') return { status: 404, code: 'NOT_FOUND', message: e.message };
    if (e.code === 'CONFLICT') return { status: 409, code: 'CONFLICT', message: e.message };
    if (e.code === 'BAD_REQUEST') return { status: 400, code: 'BAD_REQUEST', message: e.message };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

function sendServiceError(res: Response, err: unknown): boolean {
  const mapped = mapServiceError(err);
  if (mapped.status !== 500) {
    res.status(mapped.status).json({ code: mapped.code, message: mapped.message, details: null });
    return true;
  }
  return false;
}

// ── Tags ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/tags
 * Read: admin / manager / dev
 */
adminTagsRouter.get(
  '/tags',
  requireRole('admin', 'manager', 'dev'),
  validate({ query: TagMasterListQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.listTags(req.query as unknown as TagMasterListQueryT);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/admin/tags
 * Create: manager+
 */
adminTagsRouter.post(
  '/tags',
  requireRole('admin', 'manager'),
  validate({ body: TagMasterCreate }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await svc.createTag(req.body as TagMasterCreateT);
      res.status(201).json(tag);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);

/**
 * PATCH /api/admin/tags/:id
 * Rename: manager+
 */
adminTagsRouter.patch(
  '/tags/:id',
  requireRole('admin', 'manager'),
  validate({ params: TagIdParam, body: TagMasterPatch }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await svc.renameTag(req.params.id as string, (req.body as TagMasterPatchT).name);
      res.json(tag);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);

/**
 * POST /api/admin/tags/:id/merge
 * Admin only. Atomic: rewire voc_tags + tag_rules → target, hard-delete source.
 */
adminTagsRouter.post(
  '/tags/:id/merge',
  requireRole('admin'),
  validate({ params: TagIdParam, body: TagMasterMergeInput }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.mergeTags(
        req.params.id as string,
        (req.body as TagMasterMergeInputT).targetId,
      );
      res.json(result);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);

/**
 * PATCH /api/admin/tags/:id/external
 * Admin only. Toggle is_external.
 */
adminTagsRouter.patch(
  '/tags/:id/external',
  requireRole('admin'),
  validate({ params: TagIdParam, body: TagExternalToggle }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await svc.toggleExternal(
        req.params.id as string,
        (req.body as TagExternalToggleT).is_external,
      );
      res.json(tag);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);

/**
 * DELETE /api/admin/tags/:id
 * Admin only. Only if usage_count === 0 AND rule_ref_count === 0.
 */
adminTagsRouter.delete(
  '/tags/:id',
  requireRole('admin'),
  validate({ params: TagIdParam }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.deleteTag(req.params.id as string);
      res.json(result);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);

// ── Tag Rules ─────────────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/tag-rules/:id/suspend
 * Admin only. Set suspended_until timestamp (NULL = resume).
 */
adminTagsRouter.patch(
  '/tag-rules/:id/suspend',
  requireRole('admin'),
  validate({ params: RuleIdParam, body: TagRuleSuspendInput }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.suspendTagRule(
        req.params.id as string,
        (req.body as TagRuleSuspendInputT).suspended_until,
      );
      res.json(result);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);
