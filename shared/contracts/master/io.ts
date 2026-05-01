/**
 * @module shared/contracts/master/io
 *
 * Master data list endpoints — assignees, tags, voc_types — used by FE filter
 * dropdowns. Schemas mirror DB columns:
 *  - users   → backend/migrations/002_core_tables.sql + 013_add_dev_role.sql
 *  - tags    → backend/migrations/004_tags.sql
 *  - voc_types → backend/migrations/002_core_tables.sql
 */
import { z } from 'zod';
import { Uuid } from '../common';

export const AssigneeListItem = z.object({
  id: Uuid,
  ad_username: z.string(),
  display_name: z.string(),
});
export type AssigneeListItem = z.infer<typeof AssigneeListItem>;

export const AssigneeListResponse = z.object({ rows: z.array(AssigneeListItem) });
export type AssigneeListResponse = z.infer<typeof AssigneeListResponse>;

export const TagListItem = z.object({
  id: Uuid,
  name: z.string(),
  slug: z.string(),
  kind: z.string(),
});
export type TagListItem = z.infer<typeof TagListItem>;

export const TagListResponse = z.object({ rows: z.array(TagListItem) });
export type TagListResponse = z.infer<typeof TagListResponse>;

export const VocTypeListItem = z.object({
  id: Uuid,
  name: z.string(),
  slug: z.string(),
  color: z.string().nullable(),
  sort_order: z.number().int(),
  is_archived: z.boolean(),
});
export type VocTypeListItem = z.infer<typeof VocTypeListItem>;

export const VocTypeListResponse = z.object({ rows: z.array(VocTypeListItem) });
export type VocTypeListResponse = z.infer<typeof VocTypeListResponse>;
