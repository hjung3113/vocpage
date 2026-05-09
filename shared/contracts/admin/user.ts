/**
 * @module shared/contracts/admin/user
 *
 * Users admin contracts (Wave 3 Phase A · W3-3).
 *
 * Source-of-truth alignment:
 *  - Spec: requirements.md §15.2 + §4 `user_role_log` + §2.3 D18.
 *  - DB: backend/migrations/012_*.sql (users.role enum) + 017_user_role_log.sql (W3-9).
 *  - OpenAPI: shared/openapi.yaml — AdminUserItem / AdminUserPatch / UserRoleLogEntry.
 *
 * Permission (ADR 0004): Admin only for both read and mutate.
 * Last-admin guard (§6.1 CONFLICT 409): BE rejects role-demotion / is_active=false
 * when the target is the only active admin (`assertLastAdminGuard`).
 *
 * Endpoints:
 *   GET   /api/admin/users                      → AdminUserListResponse
 *   PATCH /api/admin/users/:id                  ← AdminUserPatch  → AdminUserItem
 *   GET   /api/admin/users/:id/role-log         → UserRoleLogEntry[]
 */
import { z } from 'zod';
import { Uuid } from '../common';

const Iso = z.string().datetime({ offset: true });

/**
 * Canonical role enum — must match openapi.yaml UserRole + backend/src/auth/types.
 * Order: enumeration only, no precedence implied.
 */
export const UserRole = z.enum(['user', 'dev', 'manager', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

export const AdminUserItem = z.object({
  id: Uuid,
  ad_username: z.string(),
  display_name: z.string(),
  email: z.string().email(),
  role: UserRole,
  is_active: z.boolean(),
  created_at: Iso,
});
export type AdminUserItem = z.infer<typeof AdminUserItem>;

export const AdminUserListQuery = z.object({
  role: UserRole.optional(),
  is_active: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminUserListQuery = z.infer<typeof AdminUserListQuery>;

export const AdminUserListResponse = z.object({
  rows: z.array(AdminUserItem),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>;

/**
 * `PATCH /api/admin/users/:id` body. At least one of `role` / `is_active` required.
 * `reason` is the audit free-text written into `user_role_log.reason` (NULL allowed).
 */
export const AdminUserPatch = z
  .object({
    role: UserRole.optional(),
    is_active: z.boolean().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.role !== undefined || v.is_active !== undefined, {
    message: 'role 또는 is_active 중 하나 이상 필요합니다.',
    path: ['role'],
  });
export type AdminUserPatch = z.infer<typeof AdminUserPatch>;

/**
 * Row projection of `user_role_log` (마이그 017, OQ-3 Option A).
 * PIPA 7-year retention (§15.1.1 precedent). `changed_by` NOT NULL — actor required.
 */
export const UserRoleLogEntry = z.object({
  id: Uuid,
  user_id: Uuid,
  changed_by: Uuid,
  old_role: UserRole.nullable(),
  new_role: UserRole.nullable(),
  old_active: z.boolean().nullable(),
  new_active: z.boolean().nullable(),
  reason: z.string().nullable(),
  created_at: Iso,
});
export type UserRoleLogEntry = z.infer<typeof UserRoleLogEntry>;

export const UserIdParam = z.object({ id: Uuid });
export type UserIdParam = z.infer<typeof UserIdParam>;
