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

const Uuid = z.string().uuid();

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
export const VocFilter = z.object({
  status: z.array(VocStatus).optional(),
  system_id: Uuid.optional(),
  voc_type_id: z.array(Uuid).optional(),
  assignee_id: Uuid.optional(),
  q: z.string().trim().max(120).optional(),
});
export type VocFilter = z.infer<typeof VocFilter>;

export const VocListQuery = VocFilter.extend({
  sort: VocSortColumn.default('created_at'),
  order: SortDir.default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeDeleted: z.coerce.boolean().optional(),
});
export type VocListQuery = z.infer<typeof VocListQuery>;

export const VocListResponse = z.object({
  rows: z.array(VocListItem),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
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
