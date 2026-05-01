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
  FIXTURE_USERS,
} from '../../../../shared/fixtures/voc.fixtures';

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
    const status = url.searchParams.getAll('status');
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 1);
    if (limit > 100) return envelope('VALIDATION_ERROR', 'limit must be ≤ 100');
    let rows = store.filter((r) => r.deleted_at === null);
    if (status.length) rows = rows.filter((r) => status.includes(r.status));
    const total = rows.length;
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit).map((r) => ({
      ...r,
      has_children: false,
      notes_count: notes.filter((n) => n.voc_id === r.id).length,
    }));
    return HttpResponse.json({ rows: slice, page, pageSize: limit, total });
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
    if (role === 'dev' && row.assignee_id !== userId) {
      return envelope('FORBIDDEN', '담당자만 수행할 수 있는 작업입니다.', {
        action: 'changeStatus',
      });
    }
    if (role === 'user') {
      return envelope('FORBIDDEN', '접근 권한이 없습니다.', { action: 'changeStatus' });
    }
    const patch = (await request.json()) as Partial<Voc>;
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
];

export function __resetVocMocks() {
  store = [...VOC_FIXTURES];
  notes.length = 0;
  notes.push(...VOC_NOTES_FIXTURES);
}
