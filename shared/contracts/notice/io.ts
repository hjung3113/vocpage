/**
 * @module shared/contracts/notice/io
 *
 * Request / response wire schemas for notices.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3, §10.5.1.
 */
import { z } from 'zod';
import { Notice, NoticeListItem, NoticeImportance } from './entity';
import { Uuid } from '../common';

export { Uuid };

const Iso = z.string().datetime({ offset: true });

export const NoticeListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  /** Admin/Manager only: include soft-deleted rows in the management list. */
  includeDeleted: z.coerce.boolean().optional(),
  /** Admin/Manager only: bypass visibility/period filters for management. */
  mode: z.enum(['user', 'admin']).default('user'),
});
export type NoticeListQuery = z.infer<typeof NoticeListQuery>;

export const NoticeListResponse = z.object({
  rows: z.array(NoticeListItem),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type NoticeListResponse = z.infer<typeof NoticeListResponse>;

export const NoticeCreate = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  level: NoticeImportance.default('normal'),
  is_popup: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  visible_from: Iso.nullable().optional(),
  visible_to: Iso.nullable().optional(),
});
export type NoticeCreate = z.infer<typeof NoticeCreate>;

export const NoticeUpdate = NoticeCreate.partial();
export type NoticeUpdate = z.infer<typeof NoticeUpdate>;

export const NoticeIdParam = z.object({ id: Uuid });
export type NoticeIdParam = z.infer<typeof NoticeIdParam>;

export const NoticeDetail = Notice;
export type NoticeDetail = z.infer<typeof NoticeDetail>;

/**
 * GET /api/notices/popup — login popup payload (§10.3.2).
 * Rule: BE returns the visible+is_popup notices ordered by importance desc.
 * BE is stateless; per-user "오늘 하루 보지 않기" persistence lives in FE
 * `localStorage` (`notice_dismiss_until_<userId>`). BE never reads/writes that key.
 */
export const NoticePopupResponse = z.object({
  rows: z.array(NoticeListItem),
});
export type NoticePopupResponse = z.infer<typeof NoticePopupResponse>;
