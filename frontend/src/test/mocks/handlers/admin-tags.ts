/**
 * MSW handlers for Tag Master admin endpoints (W3-4)
 * Mirrors backend /api/admin/tags + /api/admin/tags/:tagId/rules shape.
 * Responses validated against shared Zod contracts.
 *
 * Phase 01 Plan 05: 4 new nested tag-rule handlers + 1 renamed suspend
 * (legacy flat suspend route deleted per D-09).
 */
import { http, HttpResponse } from 'msw';
import {
  TagMasterListResponse,
  TagMasterItem,
  TagRule,
  TagRuleListResponse,
} from '../../../../../shared/contracts/admin/tag';
import { ADMIN_TAG_FIXTURES, TAG_IDS } from '../../../../../shared/fixtures/admin-tag.fixtures';
import { ADMIN_TAG_RULE_FIXTURES } from '../../../../../shared/fixtures/admin-tag-rule.fixtures';

// Mock user identity used as server-derived created_by on POST.
const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_USER_NAME = 'Mock Admin';

// Mirrors BE LEFT JOIN users — given a created_by uuid, return display_name.
// Unknown ids resolve to null, matching the BE no-match path.
const MOCK_USER_DIRECTORY: Record<string, string> = {
  [MOCK_USER_ID]: MOCK_USER_NAME,
};
function resolveCreatedByName(createdBy: string | null): string | null {
  if (!createdBy) return null;
  return MOCK_USER_DIRECTORY[createdBy] ?? null;
}

interface RuleStoreRow {
  id: string;
  tag_id: string;
  kind: 'general';
  keywords: string[];
  match_mode: 'keyword';
  suspended_until: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

function seedRuleStore(): RuleStoreRow[] {
  return ADMIN_TAG_RULE_FIXTURES.map((r) => ({
    id: r.id,
    tag_id: r.tag_id,
    kind: r.kind,
    keywords: r.keywords,
    match_mode: r.match_mode,
    suspended_until: r.suspended_until,
    created_by: r.created_by,
    created_by_name: resolveCreatedByName(r.created_by),
    created_at: r.created_at,
  }));
}

// Mutable in-memory stores for test mutations
let tagStore = [...ADMIN_TAG_FIXTURES];
let ruleStore: RuleStoreRow[] = seedRuleStore();

function resetStore() {
  tagStore = [...ADMIN_TAG_FIXTURES];
  ruleStore = seedRuleStore();
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

  // PATCH /api/admin/tags/:id/external — registered BEFORE PATCH /tags/:id
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

  // ── Tag Rules (nested) — register suspend BEFORE :ruleId PATCH (Pitfall 6) ──

  // GET /api/admin/tags/:tagId/rules
  http.get('/api/admin/tags/:tagId/rules', ({ params, request }) => {
    const { tagId } = params as { tagId: string };
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 1);
    const per_page = Number(url.searchParams.get('per_page') ?? 20);
    const tag = tagStore.find((t) => t.id === tagId);
    if (!tag) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    const filtered = ruleStore.filter(
      (r) =>
        r.tag_id === tagId &&
        (q === '' ||
          r.keywords.some((k) => k.toLowerCase().includes(q)) ||
          tag.name.toLowerCase().includes(q)),
    );
    const total = filtered.length;
    const rows = filtered.slice((page - 1) * per_page, page * per_page);
    const body = TagRuleListResponse.parse({ rows, page, per_page, total });
    return HttpResponse.json(body);
  }),

  // POST /api/admin/tags/:tagId/rules
  http.post('/api/admin/tags/:tagId/rules', async ({ params, request }) => {
    const { tagId } = params as { tagId: string };
    const tag = tagStore.find((t) => t.id === tagId);
    if (!tag) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { keywords: string[]; match_mode?: string };
    const newRule = TagRule.parse({
      id: crypto.randomUUID(),
      tag_id: tagId,
      kind: 'general',
      keywords: body.keywords,
      match_mode: body.match_mode ?? 'keyword',
      suspended_until: null,
      created_by: MOCK_USER_ID,
      created_by_name: MOCK_USER_NAME,
      created_at: new Date().toISOString(),
    });
    ruleStore.push(newRule);
    const tagIdx = tagStore.findIndex((t) => t.id === tagId);
    const existingTag = tagStore[tagIdx];
    if (tagIdx !== -1 && existingTag) {
      tagStore[tagIdx] = TagMasterItem.parse({
        ...existingTag,
        rule_ref_count: existingTag.rule_ref_count + 1,
      });
    }
    return HttpResponse.json(newRule, { status: 201 });
  }),

  // PATCH /api/admin/tags/:tagId/rules/:ruleId/suspend — BEFORE :ruleId PATCH
  http.patch('/api/admin/tags/:tagId/rules/:ruleId/suspend', async ({ params, request }) => {
      const { tagId, ruleId } = params as { tagId: string; ruleId: string };
      const body = (await request.json()) as { suspended_until: string | null };
      const idx = ruleStore.findIndex((r) => r.id === ruleId && r.tag_id === tagId);
      if (idx === -1) {
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: '규칙을 찾을 수 없습니다.', details: null },
          { status: 404 },
        );
      }
      const updated = TagRule.parse({
        ...ruleStore[idx],
        suspended_until: body.suspended_until,
      });
      ruleStore[idx] = updated;
      return HttpResponse.json(updated);
  }),

  // PATCH /api/admin/tags/:tagId/rules/:ruleId
  http.patch('/api/admin/tags/:tagId/rules/:ruleId', async ({ params, request }) => {
    const { tagId, ruleId } = params as { tagId: string; ruleId: string };
    const body = (await request.json()) as { keywords?: string[]; match_mode?: string };
    const idx = ruleStore.findIndex((r) => r.id === ruleId && r.tag_id === tagId);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '규칙을 찾을 수 없습니다.', details: null },
        { status: 404 },
      );
    }
    const updated = TagRule.parse({
      ...ruleStore[idx],
      ...(body.keywords ? { keywords: body.keywords } : {}),
      ...(body.match_mode ? { match_mode: body.match_mode } : {}),
    });
    ruleStore[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/admin/tags/:tagId/rules/:ruleId
  http.delete('/api/admin/tags/:tagId/rules/:ruleId', ({ params }) => {
    const { tagId, ruleId } = params as { tagId: string; ruleId: string };
    const idx = ruleStore.findIndex((r) => r.id === ruleId && r.tag_id === tagId);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    ruleStore.splice(idx, 1);
    const tagIdx = tagStore.findIndex((t) => t.id === tagId);
    const existingTag = tagStore[tagIdx];
    if (tagIdx !== -1 && existingTag) {
      tagStore[tagIdx] = TagMasterItem.parse({
        ...existingTag,
        rule_ref_count: Math.max(0, existingTag.rule_ref_count - 1),
      });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── End tag rules ────────────────────────────────────────────────────────────

  // PATCH /api/admin/tags/:id (rename) — AFTER /external
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
];

// Export reset helper for tests that need a clean store
export { resetStore as resetAdminTagStore, TAG_IDS as FIXTURE_TAG_IDS };
