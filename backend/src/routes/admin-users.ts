/**
 * Admin Users routes (W3-7 Phase E)
 *
 * Permission: Admin only. Non-admin → 404 (existence hiding, consistent with admin-trash ADR 0005 pattern).
 * Spec: requirements.md §15.2 + wave-3-admin.md §6.2 W3-7.
 *
 * Endpoints:
 *   GET   /api/admin/users           — list users (paginated, filterable)
 *   PATCH /api/admin/users/:id       — update role / is_active
 *
 * Last-admin guard: PATCH that reduces active admin count to 0 → 409 CONFLICT.
 * Audit: every successful PATCH → INSERT into user_role_log (migration 017).
 */
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import { createAuthMiddleware } from '../auth';
import { validate } from '../middleware/validate';
import {
  AdminUserListQuery,
  AdminUserPatch,
  UserIdParam,
  type AdminUserListQuery as AdminUserListQueryT,
  type AdminUserPatch as AdminUserPatchT,
} from '../../../shared/contracts/admin/user';
import * as svc from '../services/admin/user-admin';
import type { AuthUser } from '../auth/types';

const auth: RequestHandler = (req, res, next) => createAuthMiddleware()(req, res, next);

/** Existence-hiding guard: non-admin → 404, not 403 (mirrors admin-trash pattern). */
function requireAdmin(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다.',
        details: null,
      });
      return;
    }
    if ((req.user as AuthUser).role !== 'admin') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: '리소스를 찾을 수 없습니다.',
        details: null,
      });
      return;
    }
    next();
  };
}

function mapServiceError(err: unknown): { status: number; code: string; message: string } {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const e = err as { code: string; message: string };
    if (e.code === 'NOT_FOUND') return { status: 404, code: 'NOT_FOUND', message: e.message };
    if (e.code === 'CONFLICT') return { status: 409, code: 'CONFLICT', message: e.message };
    if (e.code === 'BAD_REQUEST') return { status: 400, code: 'BAD_REQUEST', message: e.message };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export const adminUsersRouter = Router();

adminUsersRouter.use(auth);
// FU-022: requireAdmin() applied per-route (not router-level) so non-matching
// paths fall through to the next admin-* router instead of being intercepted
// here. See admin-trash.ts and __tests__/admin-router-mount.test.ts.

/**
 * GET /api/admin/users
 * List all users with optional filters: role, is_active, q, page, per_page
 */
adminUsersRouter.get(
  '/users',
  requireAdmin(),
  validate({ query: AdminUserListQuery }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as AdminUserListQueryT;
      const result = await svc.listUsers(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/admin/users/:id
 * Update role and/or is_active. Last-admin demotion → 409.
 */
adminUsersRouter.patch(
  '/users/:id',
  requireAdmin(),
  validate({ params: UserIdParam, body: AdminUserPatch }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const patch = req.body as AdminUserPatchT;
      const actor = req.user as AuthUser;

      const updated = await svc.patchUser(id, patch, actor.id);
      res.json(updated);
    } catch (err) {
      const mapped = mapServiceError(err);
      if (mapped.status !== 500) {
        res.status(mapped.status).json({
          code: mapped.code,
          message: mapped.message,
          details: null,
        });
        return;
      }
      next(err);
    }
  },
);
