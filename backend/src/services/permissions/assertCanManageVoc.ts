import { HttpError } from '../../middleware/httpError';
import type { AuthUser } from '../../auth/types';

// Spec: feature-voc.md §8.4-bis. Single source for the `🟡 own` permission branch
// across every VOC operation route. Routes MUST go through this helper rather than
// open-coding role checks.

export type VocAction =
  | 'changeStatus'
  | 'setPriority'
  | 'setDueDate'
  | 'editTags'
  | 'createSubtask'
  | 'closeSubtask'
  | 'readInternalNote'
  | 'writeInternalNote';

export interface VocPermissionContext {
  id: string;
  assignee_id: string | null;
  deleted_at: Date | null;
}

export function assertCanManageVoc(
  user: Pick<AuthUser, 'id' | 'role'>,
  voc: VocPermissionContext,
  action: VocAction,
): void {
  if (user.role === 'admin' || user.role === 'manager') return;

  if (user.role === 'dev') {
    if (voc.assignee_id !== null && voc.assignee_id === user.id) return;
    throw new HttpError(403, 'FORBIDDEN', '담당자만 수행할 수 있는 작업입니다.', { action });
  }

  throw new HttpError(403, 'FORBIDDEN', '접근 권한이 없습니다.', { action });
}
