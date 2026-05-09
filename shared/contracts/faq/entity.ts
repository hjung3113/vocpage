/**
 * @module shared/contracts/faq/entity
 *
 * FAQ + FAQ Category core entity Zod schemas. Source-of-truth across FE/BE.
 * Authoritative DB schema: `backend/migrations/005_content.sql`.
 */
import { z } from 'zod';
import { Uuid } from '../common';

const Iso = z.string().datetime({ offset: true });

export const FaqCategory = z.object({
  id: Uuid,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  sort_order: z.number().int(),
  is_archived: z.boolean(),
});
export type FaqCategory = z.infer<typeof FaqCategory>;

export const Faq = z.object({
  id: Uuid,
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category_id: Uuid,
  is_visible: z.boolean(),
  sort_order: z.number().int(),
  author_id: Uuid,
  deleted_at: Iso.nullable(),
  created_at: Iso,
  updated_at: Iso,
});
export type Faq = z.infer<typeof Faq>;

export const FaqListItem = Faq;
export type FaqListItem = z.infer<typeof FaqListItem>;
