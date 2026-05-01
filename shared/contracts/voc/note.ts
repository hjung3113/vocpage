/**
 * @module shared/contracts/voc/note
 *
 * Internal notes (manager/admin/dev visibility — User → 404 fail-closed) and
 * voc_history timeline. Aligns with openapi.yaml Note schema (U2 guard).
 */
import { z } from 'zod';

const Uuid = z.string().uuid();
const Iso = z.string().datetime({ offset: true });

export const InternalNote = z.object({
  id: Uuid,
  voc_id: Uuid,
  author_id: Uuid,
  body: z.string().min(1).max(5_000),
  created_at: Iso,
  updated_at: Iso,
  deleted_at: Iso.nullable().optional(),
});
export type InternalNote = z.infer<typeof InternalNote>;

export const InternalNoteCreate = z.object({
  body: z.string().min(1).max(5_000),
});
export type InternalNoteCreate = z.infer<typeof InternalNoteCreate>;

export const InternalNoteListResponse = z.object({
  rows: z.array(InternalNote),
});
export type InternalNoteListResponse = z.infer<typeof InternalNoteListResponse>;

export const VocHistoryEntry = z.object({
  id: Uuid,
  voc_id: Uuid,
  field: z.string().min(1),
  old_value: z.string().nullable(),
  new_value: z.string().nullable(),
  changed_by: Uuid,
  changed_at: Iso,
});
export type VocHistoryEntry = z.infer<typeof VocHistoryEntry>;

export const VocHistoryListResponse = z.object({
  rows: z.array(VocHistoryEntry),
});
export type VocHistoryListResponse = z.infer<typeof VocHistoryListResponse>;
