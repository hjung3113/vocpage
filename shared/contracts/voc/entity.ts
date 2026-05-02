/**
 * @module shared/contracts/voc/entity
 *
 * VOC core entity Zod schemas. Source-of-truth for runtime validation across
 * FE (RHF resolver) and BE (validate middleware). Aligns with
 * `shared/openapi.yaml#/components/schemas/Voc` (drift caught by
 * `backend/src/__tests__/voc-contract.test.ts` U2 guard).
 *
 * Authoritative DB schema: `backend/migrations/003_vocs.sql`.
 */
import { z } from 'zod';

export const VocStatus = z.enum(['접수', '검토중', '처리중', '완료', '드랍']);
export type VocStatus = z.infer<typeof VocStatus>;

export const VocPriority = z.enum(['urgent', 'high', 'medium', 'low']);
export type VocPriority = z.infer<typeof VocPriority>;

export const VocSource = z.enum(['manual', 'import']);
export type VocSource = z.infer<typeof VocSource>;

export const VocReviewStatus = z.enum(['unverified', 'approved', 'rejected', 'pending_deletion']);
export type VocReviewStatus = z.infer<typeof VocReviewStatus>;

export const VocResolutionQuality = z.enum(['근본해결', '임시조치']);
export type VocResolutionQuality = z.infer<typeof VocResolutionQuality>;

export const VocDropReason = z.enum(['중복', '정책거부', '재현불가', '범위외', '기타']);
export type VocDropReason = z.infer<typeof VocDropReason>;

const Uuid = z.string().uuid();
const Iso = z.string().datetime({ offset: true });

export const Voc = z.object({
  id: Uuid,
  issue_code: z.string().min(1),
  sequence_no: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  body: z.string().nullable().optional(),
  status: VocStatus,
  priority: VocPriority,
  voc_type_id: Uuid,
  system_id: Uuid,
  menu_id: Uuid,
  assignee_id: Uuid.nullable(),
  author_id: Uuid,
  parent_id: Uuid.nullable(),
  source: VocSource,
  review_status: VocReviewStatus.nullable().optional(),
  structured_payload: z.record(z.string(), z.unknown()).nullable().optional(),
  resolution_quality: VocResolutionQuality.nullable().optional(),
  drop_reason: VocDropReason.nullable().optional(),
  due_date: Iso.nullable(),
  deleted_at: Iso.nullable(),
  created_at: Iso,
  updated_at: Iso,
});
export type Voc = z.infer<typeof Voc>;

/** List item: lightweight projection used by table rows; same shape minus heavy fields. */
export const VocListItem = Voc.pick({
  id: true,
  issue_code: true,
  title: true,
  status: true,
  priority: true,
  voc_type_id: true,
  system_id: true,
  menu_id: true,
  assignee_id: true,
  author_id: true,
  parent_id: true,
  source: true,
  due_date: true,
  created_at: true,
  updated_at: true,
}).extend({
  has_children: z.boolean(),
  notes_count: z.number().int().nonnegative(),
});
export type VocListItem = z.infer<typeof VocListItem>;
