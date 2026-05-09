/**
 * Comments service — orchestrates list / create / update / delete.
 *
 * See feature-voc.md §8.13 for spec. Business rules:
 *  - Any authenticated user may list or post comments on a non-deleted VOC
 *    (commenting is a public surface — no role gate beyond VOC existence).
 *  - PATCH / DELETE: author OR admin only (inline check).
 *  - body must not be empty after HTML tag stripping (Toast UI emits
 *    `<p><br></p>` for an empty editor state → 422 BODY_REQUIRED).
 *  - After successful insert, fire notifyOnComment (debounced, async but awaited).
 */
import { HttpError } from '../middleware/httpError';
import * as repo from '../repository/comments';
import * as vocRepo from '../repository/voc';
import * as notifService from './notifications';
import type { AuthUser } from '../auth/types';
import type { Comment } from '../../../shared/contracts/comment';

/**
 * Strip HTML tags and trim whitespace. Used to reject semantically-empty
 * bodies produced by Toast UI Editor (e.g. `<p><br></p>`).
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function assertNonEmptyBody(body: string): void {
  if (!stripHtml(body)) {
    throw new HttpError(422, 'BODY_REQUIRED', '댓글 내용을 입력해 주세요.', null);
  }
}

/** Verify VOC exists and is not deleted. Throws 404 otherwise. */
async function requireVoc(voc_id: string) {
  const voc = await vocRepo.getVocById(voc_id);
  if (!voc) throw new HttpError(404, 'VOC_NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  return voc;
}

export async function listComments(voc_id: string, _user: AuthUser): Promise<{ rows: Comment[] }> {
  await requireVoc(voc_id);
  const rows = await repo.listByVocId(voc_id);
  return { rows };
}

export async function createComment(
  voc_id: string,
  body: string,
  user: AuthUser,
): Promise<{ comment: Comment }> {
  await requireVoc(voc_id);
  assertNonEmptyBody(body);
  const comment = await repo.insert({ voc_id, author_id: user.id, body });
  // Fire-and-forget with await for consistency (W5 wire style — matches services/voc.ts update()).
  await notifService.notifyOnComment({ voc_id, actor_id: user.id });
  return { comment };
}

export async function updateComment(
  voc_id: string,
  comment_id: string,
  body: string,
  user: AuthUser,
): Promise<{ comment: Comment }> {
  // VOC existence check (404 if gone)
  await requireVoc(voc_id);
  const existing = await repo.getById(comment_id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', '댓글을 찾을 수 없습니다.');
  // Author or admin only
  if (existing.author_id !== user.id && user.role !== 'admin') {
    throw new HttpError(403, 'FORBIDDEN', '댓글 수정 권한이 없습니다.');
  }
  assertNonEmptyBody(body);
  const updated = await repo.update(comment_id, body);
  if (!updated) throw new HttpError(404, 'NOT_FOUND', '댓글을 찾을 수 없습니다.');
  return { comment: updated };
}

export async function deleteComment(
  voc_id: string,
  comment_id: string,
  user: AuthUser,
): Promise<{ ok: true }> {
  await requireVoc(voc_id);
  const existing = await repo.getById(comment_id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', '댓글을 찾을 수 없습니다.');
  // Author or admin only
  if (existing.author_id !== user.id && user.role !== 'admin') {
    throw new HttpError(403, 'FORBIDDEN', '댓글 삭제 권한이 없습니다.');
  }
  await repo.deleteById(comment_id);
  return { ok: true };
}
