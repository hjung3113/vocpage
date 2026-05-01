/**
 * VOC service — business logic between routes and repository.
 *
 * Wave 1 §U3=A: routes import service, service imports repository. Tests use
 * `jest.mock('../repository/voc')` for module-level isolation.
 *
 * Permission policy: every mutating call funnels through `assertCanManageVoc`
 * (single source per backend/CLAUDE.md). Read-of-internal-notes uses the
 * same helper with `readInternalNote` action — User → 404 fail-closed handled
 * inside the helper to keep route code free of role branching.
 */
import { HttpError } from '../middleware/httpError';
import { assertCanManageVoc, type VocAction } from './permissions/assertCanManageVoc';
import * as repo from '../repository/voc';
import type { AuthUser } from '../auth/types';
import type {
  Voc,
  VocListQuery,
  VocListResponse,
  VocUpdate,
  InternalNote,
} from '../../../shared/contracts/voc';

function toListItem(v: Voc) {
  return {
    id: v.id,
    issue_code: v.issue_code,
    title: v.title,
    status: v.status,
    priority: v.priority,
    voc_type_id: v.voc_type_id,
    system_id: v.system_id,
    menu_id: v.menu_id,
    assignee_id: v.assignee_id,
    author_id: v.author_id,
    parent_id: v.parent_id,
    source: v.source,
    due_date: v.due_date ?? null,
    created_at: v.created_at,
    updated_at: v.updated_at,
    has_children: false,
    notes_count: 0,
  };
}

export async function list(query: VocListQuery, user: AuthUser): Promise<VocListResponse> {
  const result = await repo.listVocs({
    status: query.status,
    system_id: query.system_id,
    voc_type_id: query.voc_type_id,
    assignee_id: query.assignee_id,
    q: query.q,
    sort: query.sort,
    order: query.order,
    page: query.page,
    limit: query.limit,
    includeDeleted: query.includeDeleted && user.role === 'admin',
  });
  return {
    rows: result.rows.map(toListItem),
    page: query.page,
    pageSize: query.limit,
    total: result.total,
  };
}

export async function detail(id: string, user: AuthUser): Promise<Voc> {
  const includeDeleted = user.role === 'admin';
  const row = await repo.getVocById(id, { includeDeleted });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  return row;
}

/** Patch picks the dominant action so the helper can deny precisely. */
function inferAction(patch: VocUpdate): VocAction {
  if ('status' in patch) return 'changeStatus';
  if ('priority' in patch) return 'setPriority';
  if ('due_date' in patch) return 'setDueDate';
  if ('assignee_id' in patch) return 'changeStatus';
  return 'changeStatus';
}

export async function update(id: string, patch: VocUpdate, user: AuthUser): Promise<Voc> {
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  const action = inferAction(patch);
  assertCanManageVoc(user, existing, action);
  const next = await repo.updateVoc(id, patch);
  if (!next) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  return next;
}

/**
 * For internal-note endpoints, evaluate the helper with a placeholder voc when
 * the role would be denied regardless (User → 404). This short-circuits before
 * any DB hit so unauthenticated requests can never leak existence via timing
 * or 500 errors. The helper still owns the role decision (no role branching
 * here) — see `assertCanManageVoc.ts:32-39`.
 */
function assertNoteAccessEarly(
  user: AuthUser,
  id: string,
  action: 'readInternalNote' | 'writeInternalNote',
) {
  if (user.role === 'user') {
    assertCanManageVoc(user, { id, assignee_id: null, deleted_at: null }, action);
  }
}

export async function notes(id: string, user: AuthUser): Promise<InternalNote[]> {
  assertNoteAccessEarly(user, id, 'readInternalNote');
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  assertCanManageVoc(user, existing, 'readInternalNote');
  return repo.listNotes(id);
}

export async function addNote(id: string, body: string, user: AuthUser): Promise<InternalNote> {
  assertNoteAccessEarly(user, id, 'writeInternalNote');
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  assertCanManageVoc(user, existing, 'writeInternalNote');
  return repo.createNote(id, user.id, body);
}
