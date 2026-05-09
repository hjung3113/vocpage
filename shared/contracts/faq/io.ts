/**
 * @module shared/contracts/faq/io
 *
 * Request / response wire schemas for FAQ + FAQ categories.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4, §10.5.1.
 */
import { z } from 'zod';
import { Faq, FaqListItem, FaqCategory } from './entity';
import { Uuid } from '../common';

export { Uuid };

export const FaqListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  category_id: Uuid.optional(),
  /** FAQ §10.4.2 keyword search across question/answer text. */
  q: z.string().trim().max(120).optional(),
  /** Admin/Manager only: include soft-deleted rows in the management list. */
  includeDeleted: z.coerce.boolean().optional(),
  /** Admin/Manager only: bypass `is_visible` filter for management. */
  mode: z.enum(['user', 'admin']).default('user'),
});
export type FaqListQuery = z.infer<typeof FaqListQuery>;

export const FaqListResponse = z.object({
  rows: z.array(FaqListItem),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type FaqListResponse = z.infer<typeof FaqListResponse>;

export const FaqCreate = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category_id: Uuid,
  is_visible: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});
export type FaqCreate = z.infer<typeof FaqCreate>;

export const FaqUpdate = FaqCreate.partial();
export type FaqUpdate = z.infer<typeof FaqUpdate>;

export const FaqIdParam = z.object({ id: Uuid });
export type FaqIdParam = z.infer<typeof FaqIdParam>;

export const FaqDetail = Faq;
export type FaqDetail = z.infer<typeof FaqDetail>;

// --- FAQ Category --------------------------------------------------------

export const FaqCategoryListResponse = z.object({
  rows: z.array(FaqCategory),
});
export type FaqCategoryListResponse = z.infer<typeof FaqCategoryListResponse>;

export const FaqCategoryCreate = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  sort_order: z.number().int().default(0),
  is_archived: z.boolean().default(false),
});
export type FaqCategoryCreate = z.infer<typeof FaqCategoryCreate>;

export const FaqCategoryUpdate = FaqCategoryCreate.partial();
export type FaqCategoryUpdate = z.infer<typeof FaqCategoryUpdate>;

export const FaqCategoryIdParam = z.object({ id: Uuid });
export type FaqCategoryIdParam = z.infer<typeof FaqCategoryIdParam>;
