/**
 * MSW handlers for Tag Master admin endpoints (W3-4)
 * Mirrors backend /api/admin/tags + /api/admin/tag-rules shape.
 * Responses validated against shared Zod contracts.
 */
import { http, HttpResponse } from 'msw';
import { TagMasterListResponse, TagMasterItem } from '../../../../../shared/contracts/admin/tag';
import { ADMIN_TAG_FIXTURES, TAG_IDS } from '../../../../../shared/fixtures/admin-tag.fixtures';

// Mutable in-memory store for test mutations
let tagStore = [...ADMIN_TAG_FIXTURES];

function resetStore() {
  tagStore = [...ADMIN_TAG_FIXTURES];
}

export const adminTagsHandlers = [
  // GET /api/admin/tags
  http.get('/api/admin/tags', ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get('kind');
    const q = url.searchParams.get('q')?.toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 1);
    const per_page = Number(url.searchParams.get('per_page') ?? 20);

    let rows = [...tagStore];
    if (kind) rows = rows.filter((t) => t.kind === kind);
    if (q) rows = rows.filter((t) => t.name.toLowerCase().includes(q));

    const total = rows.length;
    const offset = (page - 1) * per_page;
    rows = rows.slice(offset, offset + per_page);

    const body = TagMasterListResponse.parse({ rows, page, per_page, total });
    return HttpResponse.json(body);
  }),

  // POST /api/admin/tags
  http.post('/api/admin/tags', async ({ request }) => {
    const body = (await request.json()) as { name: string; kind: string };
    const dup = tagStore.find(
      (t) => t.name.toLowerCase() === body.name.toLowerCase() && t.kind === body.kind,
    );
    if (dup) {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: '동일한 이름과 종류의 태그가 이미 존재합니다.',
          details: null,
        },
        { status: 409 },
      );
    }
    const newId = `fixture-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newTag = TagMasterItem.parse({
      id: newId,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-').slice(0, 100),
      kind: body.kind,
      is_external: false,
      usage_count: 0,
      rule_ref_count: 0,
      created_at: new Date().toISOString(),
    });
    tagStore.push(newTag);
    return HttpResponse.json(newTag, { status: 201 });
  }),

  // PATCH /api/admin/tags/:id
  http.patch('/api/admin/tags/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { name: string };
    const idx = tagStore.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    const updated = TagMasterItem.parse({ ...tagStore[idx], name: body.name });
    tagStore[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // POST /api/admin/tags/:id/merge
  http.post('/api/admin/tags/:id/merge', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { targetId: string };
    if (id === body.targetId) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: 'source와 target 태그가 동일합니다.', details: null },
        { status: 400 },
      );
    }
    const targetExists = tagStore.some((t) => t.id === body.targetId);
    if (!targetExists) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '대상 태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    tagStore = tagStore.filter((t) => t.id !== id);
    return HttpResponse.json({ mergedCount: 1 });
  }),

  // PATCH /api/admin/tags/:id/external
  http.patch('/api/admin/tags/:id/external', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { is_external: boolean };
    const idx = tagStore.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    const updated = TagMasterItem.parse({ ...tagStore[idx], is_external: body.is_external });
    tagStore[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/admin/tags/:id
  http.delete('/api/admin/tags/:id', ({ params }) => {
    const { id } = params as { id: string };
    const tag = tagStore.find((t) => t.id === id);
    if (!tag) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    if (tag.usage_count > 0 || tag.rule_ref_count > 0) {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: `태그가 사용 중입니다. (VOC: ${tag.usage_count}, 규칙: ${tag.rule_ref_count})`,
          details: null,
        },
        { status: 409 },
      );
    }
    tagStore = tagStore.filter((t) => t.id !== id);
    return HttpResponse.json({ deleted: true });
  }),

  // PATCH /api/admin/tag-rules/:id/suspend
  http.patch('/api/admin/tag-rules/:id/suspend', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { suspended_until: string | null };
    return HttpResponse.json({ id, suspended_until: body.suspended_until });
  }),
];

// Export reset helper for tests that need a clean store
export { resetStore as resetAdminTagStore, TAG_IDS as FIXTURE_TAG_IDS };
