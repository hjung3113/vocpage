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
import * as notifService from './notifications';
import * as repo from '../repository/voc';
import type { ListVocsRow } from '../repository/voc';
import type { AuthUser } from '../auth/types';
import type {
  Voc,
  VocListQuery,
  VocListResponse,
  VocUpdate,
  VocCreate,
  InternalNote,
  VocHistoryEntry,
  PayloadReviewSubmit,
} from '../../../shared/contracts/voc';

function toListItem(v: ListVocsRow) {
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
    has_children: v.has_children,
    notes_count: v.notes_count,
    tags: v.tags,
  };
}

export async function list(query: VocListQuery, user: AuthUser): Promise<VocListResponse> {
  const result = await repo.listVocs({
    status: query.status,
    system_id: query.system_id,
    voc_type_ids: query.voc_type_ids,
    assignees: query.assignees,
    priorities: query.priorities,
    tag_ids: query.tag_ids,
    q: query.q,
    sort_by: query.sort_by,
    sort_dir: query.sort_dir,
    page: query.page,
    per_page: query.per_page,
    includeDeleted: query.includeDeleted && user.role === 'admin',
  });
  return {
    rows: result.rows.map(toListItem),
    page: query.page,
    per_page: query.per_page,
    total: result.total,
  };
}

export async function detail(id: string, user: AuthUser): Promise<Voc> {
  const includeDeleted = user.role === 'admin';
  const row = await repo.getVocById(id, { includeDeleted });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  return row;
}

/**
 * Map every changed field in the patch to its corresponding action so the
 * helper can deny precisely. First-match (single action) was vulnerable to
 * multi-field bypass — e.g. Dev `{assignee_id, status}` would only see
 * `changeStatus` and pass the own-VOC branch while reassigning silently.
 * See PR #121 review (security/architect/test-engineer 합의).
 */
function inferActions(patch: VocUpdate): VocAction[] {
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'BAD_REQUEST', '변경할 필드가 없습니다.');
  }
  const actions: VocAction[] = [];
  if ('assignee_id' in patch) actions.push('reassign');
  if ('status' in patch) actions.push('changeStatus');
  if ('priority' in patch) actions.push('setPriority');
  if ('due_date' in patch) actions.push('setDueDate');
  // title/body/voc_type_id/system_id/menu_id/review_status/resolution_quality/
  // drop_reason 등은 own-VOC Dev 가능 범위 내 — 기존 fallback과 동일하게
  // 'changeStatus' 권한을 사용한다.
  if (actions.length === 0) actions.push('changeStatus');
  return actions;
}

export async function update(id: string, patch: VocUpdate, user: AuthUser): Promise<Voc> {
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  const actions = inferActions(patch);
  for (const action of actions) {
    assertCanManageVoc(user, existing, action);
  }
  const next = await repo.updateVoc(id, patch);
  if (!next) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  // Wave 5 Phase A — fire notifications after the patch lands. Both calls
  // are idempotent (5-min debounce inside the service) and recipient-skipping
  // (self-actions short-circuit), so we never block on failures.
  if ('status' in patch && patch.status !== existing.status) {
    await notifService.notifyOnStatusChange({ voc_id: id, actor_id: user.id });
  }
  if ('assignee_id' in patch && patch.assignee_id !== existing.assignee_id) {
    await notifService.notifyOnAssign({
      voc_id: id,
      new_assignee_id: patch.assignee_id ?? null,
      actor_id: user.id,
    });
  }
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

/**
 * Create a VOC. PR-β (Wave 1.5) — codex review HIGH 해소: FE `vocApi.create()` 가
 * 실 BE 라우트로 도달할 수 있도록 신설. 인증된 모든 역할(user 포함)이 본인을
 * author로 등록 가능 — 권한 매트릭스는 PATCH 단계에서 갈린다.
 */
// feature-voc.md §8.4 — VOC 등록 시 priority 는 BE 가 'medium' 으로 강제하고
// (클라이언트 값 무시), §8.4.1 표 그대로 due_date = created_at + 30 일을
// 자동 계산해 저장한다.
const VOC_CREATE_DUE_DATE_DAYS = 30;

export function computeInitialDueDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + VOC_CREATE_DUE_DATE_DAYS);
  return d.toISOString().slice(0, 10);
}

export async function create(payload: VocCreate, user: AuthUser): Promise<Voc> {
  return repo.createVoc(
    {
      title: payload.title,
      body: payload.body,
      status: payload.status,
      priority: 'medium',
      voc_type_id: payload.voc_type_id,
      system_id: payload.system_id,
      menu_id: payload.menu_id,
      assignee_id: payload.assignee_id ?? null,
      parent_id: payload.parent_id ?? null,
      source: payload.source,
      due_date: computeInitialDueDate(),
    },
    user.id,
  );
}

/**
 * List VOC change history. PR-β (Wave 1.5) — codex review MED 해소.
 * 실재하지 않는 voc id 는 404 (drawer silent fail 방지).
 */
export async function history(id: string, user: AuthUser): Promise<VocHistoryEntry[]> {
  const includeDeleted = user.role === 'admin';
  const existing = await repo.getVocById(id, { includeDeleted });
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  return repo.listHistory(id);
}

/**
 * Submit a Result Review decision. feature-voc.md §9.4.5.
 * Manager/admin only — gated here (assertCanManageVoc only covers per-VOC
 * mutation surfaces). 404 first when VOC absent so existence isn't leaked
 * to authorized roles via 403.
 */
export async function submitPayloadReview(
  id: string,
  payload: PayloadReviewSubmit,
  user: AuthUser,
): Promise<repo.PayloadReviewRow> {
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  assertCanManageVoc(user, existing, 'submitPayloadReview');
  return repo.insertPayloadReview({
    voc_id: id,
    reviewer_id: user.id,
    decision: payload.decision === 'approve' ? 'approved' : 'rejected',
    comment: payload.comment ?? null,
  });
}

export async function addNote(id: string, body: string, user: AuthUser): Promise<InternalNote> {
  assertNoteAccessEarly(user, id, 'writeInternalNote');
  const existing = await repo.getVocById(id);
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
  assertCanManageVoc(user, existing, 'writeInternalNote');
  const note = await repo.createNote(id, user.id, body);
  return note;
}
