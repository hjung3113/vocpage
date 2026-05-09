/**
 * @module shared/contracts/admin/trash
 *
 * Trash (soft-deleted VOC restore) admin contracts (Wave 3 Phase A · W3-3).
 *
 * Source-of-truth alignment:
 *  - Spec: requirements.md §15.4 + feature-voc.md §9.4.7 (D23, ADR 0005).
 *  - DB: backend/migrations/015_trash_audit.sql (W3-2).
 *      vocs.deleted_by uuid NULL, FK → users(id)
 *      voc_restore_log (id, voc_id, action CHECK IN ('restore','hard_delete'),
 *                       actor_id, before_deleted_at, before_deleted_by, created_at)
 *  - OpenAPI: shared/openapi.yaml — TrashListItem / VocRestoreLogEntry.
 *
 * Permission: Admin only (Manager → 404, ADR 0005).
 * Endpoints:
 *   GET   /api/admin/vocs/trash         (TrashListQuery → TrashListResponse)
 *   PATCH /api/vocs/:id/restore         (no body; returns VocRestoreResponse)
 *   GET   /api/admin/vocs/:id/restore-log (returns VocRestoreLogEntry[])
 */
import { z } from 'zod';
import { Uuid } from '../common';
import { VocStatus } from '../voc/entity';

const Iso = z.string().datetime({ offset: true });

export const TrashRestoreAction = z.enum(['restore', 'hard_delete']);
export type TrashRestoreAction = z.infer<typeof TrashRestoreAction>;

/** Row shape for `GET /api/admin/vocs/trash`. */
export const TrashListItem = z.object({
  id: Uuid,
  issue_code: z.string(),
  title: z.string(),
  /** `vocs.status` snapshot 직전 값 (Soft-delete 시 보존). */
  status: VocStatus,
  system_id: Uuid,
  menu_id: Uuid,
  /** `vocs.deleted_by` (마이그 015). 과거 행은 voc_history 최신 row 백필 — NULL 허용. */
  deleted_by: Uuid.nullable(),
  deleted_at: Iso,
});
export type TrashListItem = z.infer<typeof TrashListItem>;

export const TrashListQuery = z.object({
  system_id: Uuid.optional(),
  menu_id: Uuid.optional(),
  q: z.string().trim().max(120).optional(),
  deleted_from: Iso.optional(),
  deleted_to: Iso.optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});
export type TrashListQuery = z.infer<typeof TrashListQuery>;

export const TrashListResponse = z.object({
  rows: z.array(TrashListItem),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type TrashListResponse = z.infer<typeof TrashListResponse>;

/**
 * `voc_restore_log` row projection (마이그 015).
 * `before_deleted_by` is an FK with no ON DELETE constraint that nullifies — keep nullable.
 */
export const VocRestoreLogEntry = z.object({
  id: Uuid,
  voc_id: Uuid,
  action: TrashRestoreAction,
  actor_id: Uuid,
  before_deleted_at: Iso.nullable(),
  before_deleted_by: Uuid.nullable(),
  created_at: Iso,
});
export type VocRestoreLogEntry = z.infer<typeof VocRestoreLogEntry>;

/**
 * `PATCH /api/vocs/:id/restore` response.
 * Returns the un-deleted VOC + the audit log row created in the same transaction.
 * Re-runs `tag_rules` engine (feature-voc.md §9.4.7) — re-attached `voc_tags.source='rule'`
 * are exposed via the standard `tags` field on the VOC payload.
 */
export const VocRestoreResponse = z.object({
  voc_id: Uuid,
  restored_at: Iso,
  audit: VocRestoreLogEntry,
});
export type VocRestoreResponse = z.infer<typeof VocRestoreResponse>;

export const TrashIdParam = z.object({ id: Uuid });
export type TrashIdParam = z.infer<typeof TrashIdParam>;
