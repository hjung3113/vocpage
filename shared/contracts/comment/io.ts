/**
 * @module shared/contracts/comment/io
 *
 * Comment API contract — feature-voc.md §8.13.
 * Body is HTML (Toast UI editor output), max 16KB per DB CHECK.
 */
import { z } from 'zod';
import { Uuid } from '../common';

export { Uuid };

export const Comment = z.object({
  id: Uuid,
  voc_id: Uuid,
  author_id: Uuid,
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Comment = z.infer<typeof Comment>;

export const CommentListResponse = z.object({
  rows: z.array(Comment),
});
export type CommentListResponse = z.infer<typeof CommentListResponse>;

export const CommentResponse = z.object({
  comment: Comment,
});
export type CommentResponse = z.infer<typeof CommentResponse>;

/** 16 384 bytes = 16 KB (matches DB CHECK octet_length(body) <= 16384) */
const MAX_BODY_BYTES = 16_384;

export const CreateCommentInput = z.object({
  body: z
    .string()
    .min(1, 'BODY_REQUIRED')
    .refine(
      (s) => Buffer.byteLength(s, 'utf8') <= MAX_BODY_BYTES,
      { message: 'BODY_TOO_LARGE' },
    ),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInput>;

export const UpdateCommentInput = CreateCommentInput;
export type UpdateCommentInput = z.infer<typeof UpdateCommentInput>;

export const DeleteResponse = z.object({ ok: z.literal(true) });
export type DeleteResponse = z.infer<typeof DeleteResponse>;
