/**
 * MSW handlers for the VOC slice — mirrors `backend/src/routes/voc.ts` shape so
 * `VITE_USE_MSW=false` can be flipped without touching call-sites.
 *
 * Permission semantics (helper-level):
 *   - manager/admin → full access
 *   - dev          → mutate only own (assignee_id === self)
 *   - user         → notes 404 fail-closed
 */
import { http, HttpResponse } from 'msw';
import {
  VOC_FIXTURES,
  VOC_NOTES_FIXTURES,
  VOC_HISTORY_FIXTURES,
  VOC_TAG_RELATIONS,
  FIXTURE_USERS,
} from '../../../../shared/fixtures/voc.fixtures';
import { TAG_FIXTURES } from '../../../../shared/fixtures/master.fixtures';
import { VocListQuery } from '../../../../shared/contracts/voc';

const TAG_NAME_BY_ID = new Map(TAG_FIXTURES.map((t) => [t.id, t.name] as const));
function tagsForVoc(vocId: string): string[] {
  return VOC_TAG_RELATIONS.filter((rel) => rel.voc_id === vocId)
    .map((rel) => TAG_NAME_BY_ID.get(rel.tag_id))
    .filter((n): n is string => typeof n === 'string')
    .sort();
}

type Voc = (typeof VOC_FIXTURES)[number];
type Note = (typeof VOC_NOTES_FIXTURES)[number];

let store: Voc[] = [...VOC_FIXTURES];
const notes: Note[] = [...VOC_NOTES_FIXTURES];

function envelope(code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    { error: { code, message, details } },
    { status: code === 'NOT_FOUND' ? 404 : code === 'FORBIDDEN' ? 403 : 400 },
  );
}

// Mock session — MSW reads role from a header set by FE bootstrap (see
// `mocks/auth.ts`, falls back to `manager` for storybook-style preview).
function currentRole(req: Request): { role: 'admin' | 'manager' | 'dev' | 'user'; id: string } {
  const role = (req.headers.get('x-mock-role') ?? 'manager') as
    | 'admin'
    | 'manager'
    | 'dev'
    | 'user';
  const id =
    role === 'admin'
      ? FIXTURE_USERS.admin
      : role === 'manager'
        ? FIXTURE_USERS.manager
        : role === 'dev'
          ? FIXTURE_USERS.devSelf
          : FIXTURE_USERS.user;
  return { role, id };
}

export const vocHandlers = [
  http.get('/api/vocs', ({ request }) => {
    const url = new URL(request.url);
    const { role } = currentRole(request);
    // Mirror BE: shared VocListQuery zod validates sort_by/sort_dir enum +
    // page/per_page positive int. Repeated keys (status, assignees, etc.)
    // must be preserved as arrays for arrayOrSingle preprocess.
    const obj: Record<string, unknown> = {};
    for (const k of url.searchParams.keys()) {
      if (k in obj) continue;
      const all = url.searchParams.getAll(k);
      obj[k] = all.length > 1 ? all : all[0];
    }
    const parsed = VocListQuery.safeParse(obj);
    if (!parsed.success) return envelope('VALIDATION_ERROR', 'invalid query');
    const query = parsed.data;
    const status = query.status ?? [];
    const voc_type_ids = query.voc_type_ids ?? [];
    const assignees = query.assignees ?? [];
    const priorities = query.priorities ?? [];
    const tag_ids = query.tag_ids ?? [];
    const q = query.q?.toLowerCase() ?? '';
    const { sort_by, sort_dir, page, per_page } = query;

    // Mirror BE service: includeDeleted only honored for admin (services/voc.ts).
    const includeDeleted = query.includeDeleted === true && role === 'admin';
    let rows = includeDeleted ? [...store] : store.filter((r) => r.deleted_at === null);
    if (query.system_id) rows = rows.filter((r) => r.system_id === query.system_id);
    if (status.length) rows = rows.filter((r) => status.includes(r.status));
    if (voc_type_ids.length) rows = rows.filter((r) => voc_type_ids.includes(r.voc_type_id));
    if (assignees.length)
      rows = rows.filter((r) => r.assignee_id !== null && assignees.includes(r.assignee_id));
    if (priorities.length) rows = rows.filter((r) => priorities.includes(r.priority));
    // tag_ids: BE는 EXISTS voc_tags 조인. MSW는 shared 픽스처
    // VOC_TAG_RELATIONS 로 동일 의미 재현.
    if (tag_ids.length) {
      rows = rows.filter((r) =>
        VOC_TAG_RELATIONS.some((rel) => rel.voc_id === r.id && tag_ids.includes(rel.tag_id)),
      );
    }
    if (q) {
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.issue_code.toLowerCase().includes(q),
      );
    }

    const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const STATUS_RANK: Record<string, number> = {
      접수: 0,
      검토중: 1,
      처리중: 2,
      완료: 3,
      드랍: 4,
    };
    const dir = sort_dir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sort_by) {
        case 'priority':
          av = PRIORITY_RANK[a.priority] ?? 99;
          bv = PRIORITY_RANK[b.priority] ?? 99;
          break;
        case 'status':
          av = STATUS_RANK[a.status] ?? 99;
          bv = STATUS_RANK[b.status] ?? 99;
          break;
        case 'due_date':
          av = a.due_date ?? '';
          bv = b.due_date ?? '';
          break;
        case 'issue_code':
          av = a.issue_code;
          bv = b.issue_code;
          break;
        case 'updated_at':
          av = a.updated_at;
          bv = b.updated_at;
          break;
        default:
          av = a.created_at;
          bv = b.created_at;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const total = rows.length;
    const start = (page - 1) * per_page;
    const slice = rows.slice(start, start + per_page).map((r) => ({
      ...r,
      has_children: false,
      notes_count: notes.filter((n) => n.voc_id === r.id).length,
      tags: tagsForVoc(r.id),
    }));
    return HttpResponse.json({ rows: slice, page, per_page, total });
  }),

  http.post('/api/vocs', async ({ request }) => {
    const { role, id: userId } = currentRole(request);
    if (role === 'user') return envelope('FORBIDDEN', '접근 권한이 없습니다.');
    const payload = (await request.json()) as Partial<Voc>;
    const now = new Date().toISOString();
    const idHex = `aaaaaaaa-0000-4000-8000-${String(store.length + 1).padStart(12, '0')}`;
    const created: Voc = {
      id: idHex,
      issue_code: `VOC-${String(store.length + 1).padStart(4, '0')}`,
      sequence_no: store.length + 1,
      title: payload.title ?? '',
      body: payload.body ?? '',
      status: payload.status ?? '접수',
      priority: payload.priority ?? 'medium',
      voc_type_id: payload.voc_type_id!,
      system_id: payload.system_id!,
      menu_id: payload.menu_id!,
      assignee_id: payload.assignee_id ?? null,
      author_id: userId,
      parent_id: null,
      source: payload.source ?? 'manual',
      review_status: null,
      resolution_quality: null,
      drop_reason: null,
      due_date: null,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    } as Voc;
    store.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get('/api/vocs/:id', ({ params, request }) => {
    const { role } = currentRole(request);
    const row = store.find((r) => r.id === params.id);
    if (!row) return envelope('NOT_FOUND', 'VOC를 찾을 수 없습니다.');
    if (row.deleted_at !== null && role !== 'admin')
      return envelope('NOT_FOUND', 'VOC를 찾을 수 없습니다.');
    return HttpResponse.json(row);
  }),

  http.patch('/api/vocs/:id', async ({ params, request }) => {
    const { role, id: userId } = currentRole(request);
    const idx = store.findIndex((r) => r.id === params.id);
    if (idx < 0) return envelope('NOT_FOUND', 'VOC를 찾을 수 없습니다.');
    const row = store[idx]!;
    const patch = (await request.json()) as Partial<Voc>;
    // Mirror backend `inferActions` (services/voc.ts) — `assignee_id` patch
    // requires manager/admin; multi-field patch (e.g. {assignee_id, status})
    // must fail on the reassign branch first to avoid Dev own-VOC bypass.
    // See PR-121 codex re-review Finding 2.
    const isReassign = 'assignee_id' in patch;
    if (isReassign && role !== 'admin' && role !== 'manager') {
      return envelope('FORBIDDEN', '담당자 변경은 관리자만 수행할 수 있습니다.', {
        action: 'reassign',
      });
    }
    if (role === 'dev' && row.assignee_id !== userId) {
      return envelope('FORBIDDEN', '담당자만 수행할 수 있는 작업입니다.', {
        action: 'changeStatus',
      });
    }
    if (role === 'user') {
      return envelope('FORBIDDEN', '접근 권한이 없습니다.', { action: 'changeStatus' });
    }
    const next = { ...row, ...patch, updated_at: new Date().toISOString() } as Voc;
    store[idx] = next;
    return HttpResponse.json(next);
  }),

  http.get('/api/vocs/:id/notes', ({ params, request }) => {
    const { role } = currentRole(request);
    if (role === 'user') return envelope('NOT_FOUND', 'Not found.');
    const rows = notes.filter((n) => n.voc_id === params.id);
    return HttpResponse.json({ rows });
  }),

  http.post('/api/vocs/:id/notes', async ({ params, request }) => {
    const { role, id: userId } = currentRole(request);
    if (role === 'user') return envelope('NOT_FOUND', 'Not found.');
    const row = store.find((r) => r.id === params.id);
    if (!row) return envelope('NOT_FOUND', 'VOC를 찾을 수 없습니다.');
    if (role === 'dev' && row.assignee_id !== userId) {
      return envelope('FORBIDDEN', '담당자만 수행할 수 있는 작업입니다.', {
        action: 'writeInternalNote',
      });
    }
    const body = (await request.json()) as { body: string };
    const now = new Date().toISOString();
    const note: Note = {
      id: `dddddddd-0000-4000-8000-${String(notes.length + 1).padStart(12, '0')}`,
      voc_id: String(params.id),
      author_id: userId,
      body: body.body,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    notes.push(note);
    return HttpResponse.json(note);
  }),

  http.get('/api/vocs/:id/history', ({ params }) => {
    const rows = VOC_HISTORY_FIXTURES.filter((h) => h.voc_id === params.id);
    return HttpResponse.json({ rows });
  }),
];

export function __resetVocMocks() {
  store = [...VOC_FIXTURES];
  notes.length = 0;
  notes.push(...VOC_NOTES_FIXTURES);
}
