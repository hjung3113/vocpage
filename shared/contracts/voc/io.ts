/**
 * @module shared/contracts/voc/io
 *
 * Request / response wire schemas. Filter, list query/response, create/update
 * payloads. Aligns with openapi.yaml VocInput/VocPatch (U2 guard enforces).
 */
import { z } from 'zod';
import {
  Voc,
  VocListItem,
  VocStatus,
  VocPriority,
  VocSource,
  VocReviewStatus,
  VocResolutionQuality,
  VocDropReason,
} from './entity';
import { Uuid } from '../common';

export { Uuid };

export const VocSortColumn = z.enum([
  'created_at',
  'updated_at',
  'priority',
  'status',
  'due_date',
  'issue_code',
]);
export type VocSortColumn = z.infer<typeof VocSortColumn>;

export const SortDir = z.enum(['asc', 'desc']);
export type SortDir = z.infer<typeof SortDir>;

/** URL filter shape — primitive-only so it round-trips through URLSearchParams. */
const arrayOrSingle = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (Array.isArray(v) ? v : v == null ? undefined : [v]), z.array(item));

export const VocFilter = z.object({
  status: arrayOrSingle(VocStatus).optional(),
  system_id: Uuid.optional(),
  voc_type_ids: arrayOrSingle(Uuid).optional(),
  assignees: arrayOrSingle(Uuid).optional(),
  priorities: arrayOrSingle(VocPriority).optional(),
  tag_ids: arrayOrSingle(Uuid).optional(),
  q: z.string().trim().max(120).optional(),
});
export type VocFilter = z.infer<typeof VocFilter>;

export const VocListQuery = VocFilter.extend({
  sort_by: VocSortColumn.default('created_at'),
  sort_dir: SortDir.default('desc'),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  includeDeleted: z.coerce.boolean().optional(),
});
export type VocListQuery = z.infer<typeof VocListQuery>;

export const VocListResponse = z.object({
  rows: z.array(VocListItem),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type VocListResponse = z.infer<typeof VocListResponse>;

export const VocCreate = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(10_000).optional(),
  status: VocStatus.default('접수'),
  priority: VocPriority.default('medium'),
  voc_type_id: Uuid,
  system_id: Uuid,
  menu_id: Uuid,
  assignee_id: Uuid.optional(),
  parent_id: Uuid.optional(),
  source: VocSource.default('manual'),
});
export type VocCreate = z.infer<typeof VocCreate>;

export const VocUpdate = z
  .object({
    title: z.string().min(1).max(200),
    body: z.string().max(10_000),
    status: VocStatus,
    priority: VocPriority,
    voc_type_id: Uuid,
    system_id: Uuid,
    menu_id: Uuid,
    assignee_id: Uuid.nullable(),
    review_status: VocReviewStatus,
    resolution_quality: VocResolutionQuality,
    drop_reason: VocDropReason,
    due_date: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
export type VocUpdate = z.infer<typeof VocUpdate>;

export const VocIdParam = z.object({ id: Uuid });
export type VocIdParam = z.infer<typeof VocIdParam>;

export const VocDetail = Voc;
export type VocDetail = z.infer<typeof VocDetail>;
