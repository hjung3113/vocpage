/**
 * @module shared/contracts/notice/entity
 *
 * Notice core entity Zod schemas. Source-of-truth for runtime validation across
 * FE (RHF resolver) and BE (validate middleware). Aligns with
 * `shared/openapi.yaml#/components/schemas/Notice`.
 *
 * Authoritative DB schema: `backend/migrations/005_content.sql` +
 * `backend/migrations/016_notice_faq_alignment.sql` (visible_from/to → timestamptz).
 */
import { z } from 'zod';
import { Uuid } from '../common';

export const NoticeImportance = z.enum(['normal', 'important', 'urgent']);
export type NoticeImportance = z.infer<typeof NoticeImportance>;

const Iso = z.string().datetime({ offset: true });

export const Notice = z.object({
  id: Uuid,
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  level: NoticeImportance,
  is_popup: z.boolean(),
  is_visible: z.boolean(),
  visible_from: Iso.nullable(),
  visible_to: Iso.nullable(),
  author_id: Uuid,
  deleted_at: Iso.nullable(),
  created_at: Iso,
  updated_at: Iso,
});
export type Notice = z.infer<typeof Notice>;

export const NoticeListItem = Notice;
export type NoticeListItem = z.infer<typeof NoticeListItem>;
