import { HttpError } from '../../middleware/httpError';
import type { AuthUser } from '../../auth/types';

// Spec: feature-voc.md §8.4-bis. Single source for the `🟡 own` permission branch
// across every VOC operation route. Routes MUST go through this helper rather than
// open-coding role checks.

export type VocAction =
  | 'changeStatus'
  | 'setPriority'
  | 'setDueDate'
  | 'reassign'
  | 'editTags'
  | 'createSubtask'
  | 'closeSubtask'
  | 'readInternalNote'
  | 'writeInternalNote';

export interface VocPermissionContext {
  id: string;
  assignee_id: string | null;
  deleted_at: Date | string | null | undefined;
}

export function assertCanManageVoc(
  user: Pick<AuthUser, 'id' | 'role'>,
  voc: VocPermissionContext,
  action: VocAction,
): void {
  if (user.role === 'admin' || user.role === 'manager') return;

  // Reassignment (담당자 배정/해제) is manager/admin only — own-VOC branch does NOT
  // grant Dev the right to reassign self/others. Spec: feature-voc.md.
  if (action === 'reassign') {
    throw new HttpError(403, 'FORBIDDEN', '담당자 변경은 관리자만 수행할 수 있습니다.', { action });
  }

  if (user.role === 'dev') {
    if (voc.assignee_id !== null && voc.assignee_id === user.id) return;
    throw new HttpError(403, 'FORBIDDEN', '담당자만 수행할 수 있는 작업입니다.', { action });
  }

  // user role: internal-note read/write must look like a hidden endpoint (404)
  // per requirements; other actions return 403. Helper centralises the role
  // branch so route code never makes this decision (backend/CLAUDE.md rule).
  if (action === 'readInternalNote' || action === 'writeInternalNote') {
    throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  }
  throw new HttpError(403, 'FORBIDDEN', '접근 권한이 없습니다.', { action });
}
