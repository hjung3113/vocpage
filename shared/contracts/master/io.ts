/**
 * @module shared/contracts/master/io
 *
 * Master data list endpoints — assignees, tags, voc_types, systems, menus —
 * used by FE filter dropdowns and the VOC create modal cascade. Schemas mirror
 * DB columns:
 *  - users     → backend/migrations/002_core_tables.sql + 013_add_dev_role.sql
 *  - tags      → backend/migrations/004_tags.sql
 *  - voc_types → backend/migrations/002_core_tables.sql
 *  - systems   → backend/migrations/002_core_tables.sql
 *  - menus     → backend/migrations/002_core_tables.sql
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

export const MenuListItem = z.object({
  id: Uuid,
  system_id: Uuid,
  name: z.string(),
  slug: z.string(),
  is_archived: z.boolean(),
});
export type MenuListItem = z.infer<typeof MenuListItem>;

export const MenuListResponse = z.object({ rows: z.array(MenuListItem) });
export type MenuListResponse = z.infer<typeof MenuListResponse>;

export const SystemListItem = z.object({
  id: Uuid,
  name: z.string(),
  slug: z.string(),
  is_archived: z.boolean(),
  menus: z.array(MenuListItem),
});
export type SystemListItem = z.infer<typeof SystemListItem>;

export const SystemListResponse = z.object({ rows: z.array(SystemListItem) });
export type SystemListResponse = z.infer<typeof SystemListResponse>;
