# Phase 1: Tag Rules Consolidation — Pattern Map

**Mapped:** 2026-05-10
**Phase dir:** `.planning/phases/01-tag-rules-consolidation/`
**Files analyzed:** 17 (10 modified · 7 new)
**Analogs found:** 17 / 17 (100%)

> Sources consumed: `01-CONTEXT.md` (D-01..D-14 + 5 OQs), `01-RESEARCH.md` (Standard Stack, Architecture, Pitfalls 1–7, Sources), `01-UI-SPEC.md` (visual contract). All citations are file-path + line-number; planner can copy excerpts verbatim.

---

## File Classification

| File | Status | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `backend/migrations/024_tag_rules_created_by.sql` | NEW | migration | DDL | `backend/migrations/014_tag_master_ops.sql` | exact (same table, additive ALTER) |
| `backend/src/__tests__/migration-024.test.ts` | NEW | test (BE Jest, pg-mem) | DDL round-trip | `backend/src/__tests__/migration-014.test.ts` | exact |
| `backend/src/routes/admin-tags.ts` | MODIFIED | route (Express + zod) | request-response (CRUD + suspend) | self (lines 78–209) — extend in same file | exact (same module) |
| `backend/src/routes/__tests__/admin-tags.test.ts` | MODIFIED | test (BE Supertest) | HTTP integration | self — extend with rule CRUD × 4 roles | exact |
| `backend/src/services/admin/tag-master.ts` | MODIFIED | service | CRUD + SQL | self (`listTags` lines 19–75, `createTag` 77–103) | exact |
| `backend/src/__tests__/admin-contract.test.ts` | MODIFIED | test (zod ↔ OpenAPI parity) | schema | self (lines 116–123 — `TagRuleSuspendInput`) | exact |
| `shared/openapi.yaml` | MODIFIED | contract | OpenAPI paths + schemas | self (lines 1532–1614, 1817–1842, 2960–3012) | exact |
| `shared/contracts/admin/tag.ts` | MODIFIED | contract (zod) | schema | self (`TagRuleSuspendInput` line 91; `TagMasterListQuery` 49) | exact |
| `shared/fixtures/admin-tag-rule.fixtures.ts` | NEW | fixture | static data | `shared/fixtures/admin-tag.fixtures.ts` (TAG_RULE_IDS already declared) | exact |
| `frontend/src/features/admin/tag-master/api/tag-master.api.ts` | MODIFIED | api hook (TanStack v5) | server-state + optimistic | self (`useSuspendTagRule` lines 84–95) | exact |
| `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` | NEW | test (Vitest) | mutation cache patch | (none — first optimistic test in this slice) | partial — pattern from TanStack v5 docs + existing `tag-master.api.ts` mutation shape |
| `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx` | MODIFIED | component | render + click handler | self (existing) | exact |
| `frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx` | NEW | component (Dialog) | modal CRUD UI | `frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx` | exact |
| `frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx` | NEW | component | table + URL `q` search | `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx` (existing pattern) | role-match |
| `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx` | NEW | component | controlled chip array | (no chip-input precedent) — compose `<Input>` + array state | partial |
| `frontend/src/pages/admin/tags.tsx` | MODIFIED | page | layout + URL state | self (lines 1–22) + `frontend/src/features/voc/list/model/useVocFilterUrlState.ts:33` | role-match (URL state pattern lifted from VOC) |
| `frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx` | MODIFIED | test (Vitest + MSW) | UI integration | self — extend tabs + flat rules + modal open | exact |
| `frontend/src/test/mocks/handlers/admin-tags.ts` | MODIFIED | MSW handler | mock HTTP | self (existing 7 handlers) — add 4 new + rename 1 (suspend) | exact |
| `scripts/check-fixture-seed-parity.ts` | MODIFIED | tool (script) | static parse | self (lines 21–53 hardcoded `vocs`) — generalize to triples | exact |
| `docs/specs/requires/feature-voc.md` | MODIFIED | spec | doc | self (§9.4.1 lines 545–549) | exact |
| `docs/specs/requires/routing-conventions.md` | MODIFIED | spec | doc | self (line 20 — remove entry) | exact |

---

## Pattern Assignments

### `backend/migrations/024_tag_rules_created_by.sql` — migration / DDL

**Analog:** `backend/migrations/014_tag_master_ops.sql` (full file, 38 lines)

**Header pattern** (014:1–22 — comment block declares spec sources, ADR refs, regression test path):
```sql
-- 024: tag_rules.created_by 추가 (Phase 1 — D-12)
--
-- Spec: docs/specs/requires/feature-voc.md §9.4.1 (rewritten this phase)
--       .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md D-12
--
-- Adds tag_rules.created_by uuid NULL REFERENCES users(id). Backfill = NULL preserved
-- (D-12 + UI-SPEC OQ-UI-2). FE renders `—` for legacy rows.
--
-- IF OQ-R1 resolves to Option C (RESEARCH §Open Questions): also add
--   tag_rules.keywords text[] NOT NULL DEFAULT '{}'  -- chip-array per D-05
--   tag_rules.match_mode text NOT NULL DEFAULT 'keyword'  -- D-06 select slot
-- (Option B = JSON-encode in existing pattern column → no DDL beyond created_by.)
--
-- 회귀 테스트: backend/src/__tests__/migration-024.test.ts (pg-mem up/down round-trip).
```

**Up/Down marker pattern** (014:23–37 — `-- Up Migration` / `-- Down Migration` parsed by test loader):
```sql
-- Up Migration

ALTER TABLE tag_rules
  ADD COLUMN created_by uuid NULL REFERENCES users(id);

-- Down Migration

ALTER TABLE tag_rules
  DROP COLUMN IF EXISTS created_by;
```

**Notes:**
- Markers `-- Up Migration` / `-- Down Migration` are required — `migration-014.test.ts:43–44` regex-matches them.
- Use `NULL` (no `NOT NULL DEFAULT`) so legacy rows survive without backfill (Pitfall 3 + D-12).
- If OQ-R1 = Option C, the test must also assert `keywords text[]` and `match_mode text` — extend up/down accordingly.

---

### `backend/src/__tests__/migration-024.test.ts` — pg-mem round-trip

**Analog:** `backend/src/__tests__/migration-014.test.ts` (full file, 145 lines)

**Boot + parse pattern** (014:21–69 — set `MIGRATIONS_DIR`, stub `vocs`, drop `embedding`/`uuid_generate_v4`, register `gen_random_uuid`, run prerequisite `004_tags.sql` then 014):
```typescript
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');
const VOCS_STUB = `CREATE TABLE vocs (id uuid PRIMARY KEY);`;
const BASE_FILES = ['004_tags.sql', '014_tag_master_ops.sql']; // for 024, 014 is also a prereq

function stripUnsupported(sql: string): string {
  return sql
    .split('\n').filter((line) => !/CREATE EXTENSION/i.test(line)).join('\n')
    .replace(/,?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
}

function readMigration(file: string): { up: string; down: string } {
  const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const upMatch = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  const downMatch = raw.match(/-- Down Migration([\s\S]*)$/i);
  // ...
}
```

**Three-test structure** (014:87–144 — `up adds`, `defaults`, `down removes`):
```typescript
describe('migration 024 — tag_rules.created_by', () => {
  test('up adds created_by column referencing users(id)', async () => { /* describeColumns */ });
  test('created_by defaults to NULL for existing rows', async () => { /* INSERT then SELECT */ });
  test('down removes created_by', async () => { /* up then down then describeColumns */ });
});
```

**Notes:**
- 024 needs `users` table also stubbed (FK target). Pattern: add `USERS_STUB = 'CREATE TABLE users (id uuid PRIMARY KEY);'` alongside `VOCS_STUB` (014:26).
- Reuse `describeColumns` helper (014:78–85) verbatim.
- pg-mem nullability quirk: assert via behavioral INSERT, not `is_nullable` column (014:103–114).

---

### `backend/src/routes/admin-tags.ts` — route additions + rename

**Analog:** self (same file). Pattern is already in-file at 96–108 (`POST /tags`).

**Imports & boilerplate** (lines 15–47 — no change needed; only new contract imports):
```typescript
import {
  TagIdParam,
  TagRuleSuspendInput,
  // ADD this phase:
  TagRuleListQuery,
  TagRuleCreate,
  TagRulePatch,
  RuleIdParam,            // new — `{ ruleId: Uuid }` (replaces local `RuleIdParam = z.object({ id: ... })` at line 51)
  type TagRuleCreate as TagRuleCreateT,
  type TagRulePatch as TagRulePatchT,
} from '../../../shared/contracts/admin/tag';
```

**Route registration template** (96–108, mirror for each new method):
```typescript
adminTagsRouter.post(
  '/tags/:tagId/rules',
  requireRole('admin', 'manager'),                              // D-13: Manager+ create
  validate({ params: TagIdParam, body: TagRuleCreate }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rule = await svc.createTagRule(
        req.params.tagId as string,
        req.body as TagRuleCreateT,
        req.user!,                                              // D-07: BE-derived created_by
      );
      res.status(201).json(rule);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);
```

**CRITICAL — Pitfall 6 (route order):** Existing pattern at lines 132 (`/tags/:id/merge`) registered BEFORE 114 (`PATCH /tags/:id`). Apply same to the 5 new tag-rules routes:

```
1. GET    /tags/:tagId/rules                          (list)              — Manager+/Admin/Dev (read)
2. POST   /tags/:tagId/rules                          (create)            — Manager+ (D-13)
3. PATCH  /tags/:tagId/rules/:ruleId/suspend          (suspend/resume)    — Admin only  ← REGISTER BEFORE next
4. PATCH  /tags/:tagId/rules/:ruleId                  (update)            — Manager+
5. DELETE /tags/:tagId/rules/:ruleId                  (delete)            — Admin only
```
Express matches in registration order — if step 4 is registered first, suspend payloads hit the patch handler.

**Removal:** Delete lines 188–209 (current `/tag-rules/:id/suspend`) — D-09 forbids alias.

**Error mapping** (53–70): reuse `mapServiceError` / `sendServiceError` verbatim — no change.

---

### `backend/src/routes/__tests__/admin-tags.test.ts` — Supertest expansion

**Analog:** self (existing tests at lines 251, 253, 257, 265 use `/admin/tag-rules` — rename + extend).

**Test matrix to add** (per D-13):
| Route | Roles to assert pass | Roles to assert 403 |
|-------|----------------------|---------------------|
| `GET /tags/:tagId/rules` | admin, manager, dev | user |
| `POST /tags/:tagId/rules` | admin, manager | dev, user |
| `PATCH /tags/:tagId/rules/:ruleId` | admin, manager | dev, user |
| `DELETE /tags/:tagId/rules/:ruleId` | admin | manager, dev, user |
| `PATCH /tags/:tagId/rules/:ruleId/suspend` | admin | manager, dev, user |

**Path rewrite:** `rg "/admin/tag-rules" backend/src/routes/__tests__/admin-tags.test.ts` → 5 hits at lines 11, 251, 253, 257, 265 — all rewrite to nested form.

---

### `backend/src/services/admin/tag-master.ts` — service additions

**Analog:** self (`listTags` 19–75 for SQL+pagination; `createTag` 77–103 for INSERT + unique-violation mapping).

**`listRules` SQL pattern** (mirror `listTags` 36–67 — must include the join Pitfall 3 calls out):
```typescript
export async function listRules(tagId: string, query: TagRuleListQueryT) {
  const pool = getPool();
  // ... build WHERE: tr.tag_id = $1 [AND (tr.keywords && ARRAY[$q] OR t.name ILIKE %q%)]
  const rowsSql = `
    SELECT
      tr.id, tr.tag_id, tr.kind,
      tr.keywords,                  -- if OQ-R1=C; otherwise tr.pattern
      tr.match_mode,                -- if OQ-R1=C; otherwise omit
      tr.suspended_until,
      tr.created_by,
      u.display_name AS created_by_name,    -- Pitfall 3 LEFT JOIN
      tr.created_at
    FROM tag_rules tr
    LEFT JOIN tags t  ON t.id = tr.tag_id
    LEFT JOIN users u ON u.id = tr.created_by
    WHERE tr.tag_id = $1 ${conditions.length ? 'AND ' + conditions.join(' AND ') : ''}
    ORDER BY tr.created_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `;
```

**`createTagRule` write path** (mirror `createTag` 88–102 — with `req.user.id` for `created_by`):
```typescript
export async function createTagRule(
  tagId: string,
  input: TagRuleCreateT,
  user: AuthUser,                   // D-07 — BE-derived
) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO tag_rules (tag_id, kind, keywords, match_mode, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, tag_id, kind, keywords, match_mode, suspended_until,
               created_by, created_at`,
    [tagId, 'general', input.keywords, input.match_mode ?? 'keyword', user.id],
  );
  // ... join users for created_by_name in returned row, OR return id-only and let list refetch
  return result.rows[0];
}
```

**Search match (OQ-R4):** when `q` present, `WHERE (tr.keywords && ARRAY[$q] OR t.name ILIKE %q% ESCAPE '\\')` — reuse `escapeLikePattern` (imported at line 17).

---

### `backend/src/__tests__/admin-contract.test.ts` — zod ↔ OpenAPI parity

**Analog:** self (lines 116–123).

**Existing pattern (verbatim)**:
```typescript
test('TagRuleSuspendInput required ⊆ zod + nullable parity', () => {
  zodOpenApiParity('TagRuleSuspendInput', Admin.TagRuleSuspendInput as unknown as AnyZodObject);
  zodOpenApiNullableParity('TagRuleSuspendInput', Admin.TagRuleSuspendInput as unknown as AnyZodObject);
});
```

**Add (Pitfall 1):**
```typescript
test('TagRuleListQuery / TagRule / TagRuleCreate / TagRulePatch parity', () => {
  zodOpenApiParity('TagRuleListQuery', Admin.TagRuleListQuery as unknown as AnyZodObject);
  zodOpenApiParity('TagRule', Admin.TagRule as unknown as AnyZodObject);
  zodOpenApiParity('TagRuleCreate', Admin.TagRuleCreate as unknown as AnyZodObject);
  zodOpenApiParity('TagRulePatch', Admin.TagRulePatch as unknown as AnyZodObject);
  zodOpenApiNullableParity('TagRule', Admin.TagRule as unknown as AnyZodObject);
});
```

---

### `shared/openapi.yaml` — paths + schemas rewrite

**Analog:** self.

**Path block to delete:** lines 1532–1614 (`/admin/tag-rules` GET/POST/PATCH/DELETE) + lines 1817–1842 (`/admin/tag-rules/:id/suspend`).

**New path block (insert under `/admin/tags/{id}` siblings, ~line 1500):**
```yaml
/admin/tags/{tagId}/rules:
  get:    { summary: list rules for tag, parameters: [tagId, q?, page?, per_page?], responses: {200: TagRuleListResponse, 401, 403, 404} }
  post:   { summary: create rule, parameters: [tagId], requestBody: TagRuleCreate, responses: {201: TagRule, 400, 401, 403, 404, 409} }
/admin/tags/{tagId}/rules/{ruleId}:
  patch:  { summary: update rule, parameters: [tagId, ruleId], requestBody: TagRulePatch, responses: {200: TagRule, ...} }
  delete: { summary: delete rule, parameters: [tagId, ruleId], responses: {204, ...} }
/admin/tags/{tagId}/rules/{ruleId}/suspend:
  patch:  { summary: suspend/resume, parameters: [tagId, ruleId], requestBody: TagRuleSuspendInput, responses: {200, ...} }
```

**Schema reshape (lines 2960–3012):**
- `TagRule` — add `created_by: { type: string, format: uuid, nullable: true }`, `created_by_name: { type: string, nullable: true }`. Replace `pattern: string` with `keywords: { type: array, items: string }` + `match_mode: { type: string, enum: [keyword] }` (if OQ-R1=C).
- New: `TagRuleListResponse` (mirror `TagMasterListResponse` shape — rows/page/per_page/total).
- New: `TagRuleCreate` (`keywords: string[] minItems 1`, `match_mode?` default `keyword`).
- New: `TagRulePatch` (all fields optional).

**Codegen reminder (Pitfall 1):** after edit, run `openapi:gen` script (verify name in plan-phase) and commit `shared/types/api.ts` in same commit.

---

### `shared/contracts/admin/tag.ts` — zod additions + param rename

**Analog:** self (full file, 98 lines).

**Existing patterns to mirror:**
- `TagMasterListQuery` (49–55) — pagination + `q` search → mirror for `TagRuleListQuery`.
- `TagMasterListResponse` (57–63) → mirror for `TagRuleListResponse`.
- `TagMasterCreate` (66–70), `TagMasterPatch` (73–76) → mirror for `TagRuleCreate`, `TagRulePatch`.
- `TagIdParam` (96) — keep + add `TagRuleIdParam = z.object({ tagId: Uuid, ruleId: Uuid })`.

**New schema sketch:**
```typescript
export const TagRule = z.object({
  id: Uuid,
  tag_id: Uuid,
  kind: z.literal('general'),
  keywords: z.array(z.string().trim().min(1)).min(1),     // D-05
  match_mode: z.enum(['keyword']).default('keyword'),     // D-06
  suspended_until: Iso.nullable(),
  created_by: Uuid.nullable(),                            // D-12 mig 024
  created_by_name: z.string().nullable(),                 // Pitfall 3 join
  created_at: Iso,
});
export const TagRuleCreate = z.object({
  keywords: z.array(z.string().trim().min(1)).min(1),
  match_mode: z.enum(['keyword']).optional(),
});
export const TagRulePatch = TagRuleCreate.partial();
export const TagRuleListQuery = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});
```

**Header comment update (line 19):** rewrite line `PATCH  /api/admin/tag-rules/:id/suspend` → `PATCH  /api/admin/tags/:tagId/rules/:ruleId/suspend`.

---

### `shared/fixtures/admin-tag-rule.fixtures.ts` — NEW fixture file

**Analog:** `shared/fixtures/admin-tag.fixtures.ts` (existing file, ~120 lines; `TAG_RULE_IDS` already declared at lines 33–37 per RESEARCH source list).

**Pattern:** export an array of TagRule rows referencing `TAG_IDS` and `TAG_RULE_IDS`. Each row must satisfy the new zod `TagRule` schema (parse-on-import to catch drift).

**Parity contract:** rows must populate every NOT NULL non-DEFAULT column on `tag_rules` after mig 024. Updated parity script (below) reads this file.

---

### `frontend/src/features/admin/tag-master/api/tag-master.api.ts` — new hooks + suspend rename

**Analog:** self (full file, 96 lines).

**Existing imports + query key** (lines 5–19 — copy structure):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet, apiPost, apiPatch, apiDelete } from '@shared/api/client';
import { TagMasterListResponse, /* + new */ TagRuleListResponse, TagRule, TagRuleCreate, TagRulePatch, TagRuleSuspendInput } from '@contracts/admin/tag';

const QUERY_KEY = ['admin', 'tags'] as const;
const RULES_KEY = (tagId: string) => ['admin', 'tags', tagId, 'rules'] as const;
const ALL_RULES_KEY = ['admin', 'rules'] as const;
```

**Query hook pattern** (mirror `useAdminTags` 23–36):
```typescript
export function useAdminTagRules(tagId: string, query?: { q?: string; page?: number; per_page?: number }) {
  const params = new URLSearchParams();
  if (query?.q) params.set('q', query.q);
  // ...
  return useQuery({
    queryKey: [...RULES_KEY(tagId), query],
    queryFn: ({ signal }) =>
      apiGet(`/api/admin/tags/${tagId}/rules${params.toString() ? `?${params}` : ''}`, TagRuleListResponse, { signal }),
  });
}
```

**Optimistic mutation pattern (D-11 — extend the `useSuspendTagRule` shape at 84–95 with `onMutate`/`onError`/`onSettled`):**
```typescript
export function useCreateTagRule(tagId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof TagRuleCreate>) =>
      apiPost(`/api/admin/tags/${tagId}/rules`, input, TagRule),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });          // Pitfall 5 — cancel before snapshot
      const prev = qc.getQueryData(QUERY_KEY);
      qc.setQueryData(QUERY_KEY, (old: any) => /* increment rule_ref_count for tagId in rows */);
      return { prev };
    },
    onError: (_err, _input, ctx) => qc.setQueryData(QUERY_KEY, ctx?.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: RULES_KEY(tagId) });
    },
  });
}
```

**URL rename:** line 89 `/api/admin/tag-rules/${id}/suspend` → `/api/admin/tags/${tagId}/rules/${ruleId}/suspend`. The hook signature changes to `({ tagId, ruleId, ...body })`.

---

### `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` — NEW

**Analog:** none in repo for optimistic mutations. Compose from:
- `tag-master.api.ts` mutation shape (lines 84–95).
- TanStack Query v5 testing pattern (per RESEARCH §Sources Secondary).

**Required assertions (D-11):**
1. `onMutate` snapshots prev cache, sets new with `rule_ref_count + 1`.
2. `onError` restores prev (rollback).
3. `onSettled` invalidates both `['admin','tags']` and rules subkey.
4. Concurrent double-fire (Pitfall 5) — both `cancelQueries` first, last write wins after `onSettled`.

---

### `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx` — add `규칙 N건` column

**Analog:** self (existing). Insert column between `사용 VOC 수` and `작업` per UI-SPEC.md §Layout.

**Cell rendering pattern (UI-SPEC §Row badge states):**
- N=0: TextMark `규칙 없음` (`--text-quaternary`, 11.5px / 500). Still `<button>` for a11y.
- N≥1: `OutlineChip` `규칙 {N}건` with brand tokens. Click → opens `TagRulesManagerModal`.
- `aria-label`: `{태그명}의 규칙 {N}건 관리`.

**State pattern:** controlled-by-parent target tag (mirror `TagMasterEditModal` at `pages/admin/tags.tsx`):
```typescript
const [rulesModalTag, setRulesModalTag] = useState<TagMasterItem | null>(null);
// ... in cell: <button onClick={() => setRulesModalTag(tag)}>...</button>
{rulesModalTag && <TagRulesManagerModal tag={rulesModalTag} onClose={() => setRulesModalTag(null)} />}
```

---

### `frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx` — NEW

**Analog:** `frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx` (full file, 95 lines).

**Modal scaffold pattern** (TagMasterEditModal:23–93):
```typescript
interface Props { tag: TagMasterItem; onClose: () => void; }

export function TagRulesManagerModal({ tag, onClose }: Props) {
  return (
    <ModalOverlay onClose={onClose}>           {/* reuse from TagMasterCreateModal exports */}
      <ModalHeader title={`${tag.name} · 규칙 ${tag.rule_ref_count}건`}
                   subtitle="자동 태깅 규칙 관리"
                   onClose={onClose} />
      {/* Body — vertical stack: KeywordChipInput add form (top) + sub-table (below) */}
    </ModalOverlay>
  );
}
```

**Mutation submit pattern (mirror EditModal:28–45):**
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  createRule.mutate(
    { keywords, match_mode },
    { onSuccess: () => setKeywords([]), onError: (err) => setError(...) },
  );
}
```

**Sub-table rendering:** consume `useAdminTagRules(tag.id)`. Map rows → use `.admin-table` recipe (uidesign §14.2). Action column → `DropdownMenu` (`shared/ui/dropdown-menu`).

**Permission gating (D-13):** on row action menu, hide `삭제` / `일시중지` / `재개` for non-admin (use `useRole().isAdmin`).

**A11y:** Radix Dialog handles focus trap + Esc; UI-SPEC §`규칙 N건` row interaction mandates `Enter` / `Space` opens modal — Radix handles this when trigger is `<button>`.

---

### `frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx` — NEW

**Analog:** `TagMasterTable.tsx` (existing) for `.admin-table` shell + pagination wiring.

**Hook:** consume new `useAllTagRules({ q })` (or `useAdminTagRules` with no tagId — needs BE endpoint or list-all variant — confirm in plan-phase per OQ-R4).

**Search input pattern (UI-SPEC §Search input recipe):** 250ms debounce. Reuse `useSearchParams` for `q` state per below. Empty result → `EmptyState` primitive with copy from UI-SPEC.md §Copywriting.

**Tag link cell:** parent tag column → `<button>` switches `?view=tags` and scrolls to that tag row (UI-SPEC §`view=rules` flat table).

---

### `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx` — NEW

**Analog:** none (no existing chip-array input in repo). Per RESEARCH §Anti-Patterns: do NOT pull `react-tag-input`.

**Composition:** `<Input>` + local `string[]` state + Enter/`,` to commit + `X` per chip + Backspace-on-empty removes last.

**Validation (D-05 + UI-SPEC inline errors):**
- Trim + dedupe (case-insensitive) — render `이미 추가된 키워드입니다`.
- Empty submit — `키워드를 한 개 이상 입력하세요`.
- Chip recipe: `--bg-elevated` bg, NOT brand (UI-SPEC §Color §Forbidden accent uses).

---

### `frontend/src/pages/admin/tags.tsx` — extend with view-mode tabs + URL state

**Analogs:**
- Self (current page, lines 1–22) — keep `useRole` guard + `StickyHeaderLayout`.
- `frontend/src/features/voc/list/model/useVocFilterUrlState.ts:1–60` — `useSearchParams` URL-state pattern.

**URL state pattern (extracted from useVocFilterUrlState:33):**
```typescript
const [params, setParams] = useSearchParams();
const view = params.get('view') === 'rules' ? 'rules' : 'tags';   // default
const q = params.get('q') ?? '';
const setView = (v: 'tags' | 'rules') => setParams((p) => { p.set('view', v); if (v !== 'rules') p.delete('q'); return p; });
const setQ = (next: string) => setParams((p) => { if (next) p.set('q', next); else p.delete('q'); return p; });
```

**Layout (UI-SPEC §`/admin/tags` page anatomy):**
- Toolbar row (44px) — left `<Tabs>` (`shared/ui/tabs`), right Search (`view=rules` only).
- Body — `view === 'tags'` ? `<TagMasterTable />` : `<TagRulesFlatTable q={q} />`.

---

### `frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx` — extend

**Analog:** self.

**New test cases:**
- `view=tags` default renders TagMasterTable.
- Click `?view=rules` tab → URL updates + flat table renders.
- Click `규칙 N건` badge → modal opens with sub-table.
- Optimistic SC-2: click `+ 규칙 추가` → parent table badge increments before MSW resolves.
- Empty SC-4: `?view=rules&q=zzz` shows empty-state copy `검색 결과가 없습니다`.

---

### `frontend/src/test/mocks/handlers/admin-tags.ts` — extend handlers

**Analog:** self (full file, 156 lines).

**Existing handler shape** (lines 39–67 — `POST /api/admin/tags` — copy for rule create):
```typescript
http.post('/api/admin/tags/:tagId/rules', async ({ params, request }) => {
  const { tagId } = params as { tagId: string };
  const body = (await request.json()) as { keywords: string[]; match_mode?: string };
  // duplicate check, build TagRule.parse(...), push to ruleStore, return 201
});
```

**Pattern checklist (mirror existing):**
- Mutable in-memory store (line 11 `let tagStore = [...ADMIN_TAG_FIXTURES]` → add `let ruleStore = [...ADMIN_TAG_RULE_FIXTURES]`).
- `resetStore` helper (line 13).
- 4 new handlers: GET list (lines 19–36 shape) · POST create (39–67 shape) · PATCH update (70–83 shape) · DELETE (123–144 shape).
- 1 rename: line 147 `/api/admin/tag-rules/:id/suspend` → `/api/admin/tags/:tagId/rules/:ruleId/suspend`. Update path params destructure.
- All responses parsed through new `TagRule` / `TagRuleListResponse` zod schemas (lines 34, 55, 80 pattern).

---

### `scripts/check-fixture-seed-parity.ts` — generalize to triples

**Analog:** self (full file, 120 lines — currently hardcoded `vocs` only at lines 22–23).

**Refactor target (Pitfall 2):**
```typescript
const TARGETS: Array<{ table: string; migration: string; fixture: string; sampleKey: string; triggerCols?: Set<string> }> = [
  { table: 'vocs',     migration: 'backend/migrations/003_vocs.sql', fixture: 'shared/fixtures/voc.fixtures.ts',           sampleKey: 'VOC_FIXTURES',           triggerCols: new Set(['sequence_no','issue_code']) },
  { table: 'tag_rules',migration: 'backend/migrations/024_tag_rules_created_by.sql', /* + base 004_tags.sql */ fixture: 'shared/fixtures/admin-tag-rule.fixtures.ts', sampleKey: 'ADMIN_TAG_RULE_FIXTURES' },
];
```

**Note:** parsing must merge base table DDL (`004_tags.sql` `CREATE TABLE tag_rules`) + each subsequent `ALTER TABLE tag_rules ADD COLUMN` from later migrations (014 adds `suspended_until`, 024 adds `created_by`). Existing `parseDbColumns` (lines 31–53) only handles `CREATE TABLE` — extend to `ALTER TABLE … ADD COLUMN`.

---

### `docs/specs/requires/feature-voc.md` §9.4.1 — rewrite

**Analog:** self (lines 545–549). Rewrite to describe modal-based consolidation, view-mode tabs, nested REST paths.

### `docs/specs/requires/routing-conventions.md` line 20 — remove

**Analog:** self. Delete the `/admin/tag-rules` entry (route never had a page; removal aligns with SC-3).

---

## Shared Patterns

### S-1. Express route + zod `validate` middleware (BE)
**Source:** `backend/src/routes/admin-tags.ts:96–108` (POST /tags), `:114–126` (PATCH /tags/:id), `:194–209` (existing rule suspend).
**Apply to:** all 5 new tag-rule routes.
**Excerpt:** see §`backend/src/routes/admin-tags.ts` above.
**Pitfall hooks:** Pitfall 6 (route order — register `:ruleId/suspend` BEFORE `:ruleId` PATCH).

### S-2. Service-layer error mapping
**Source:** `backend/src/routes/admin-tags.ts:53–70` (`mapServiceError` / `sendServiceError`).
**Apply to:** all new route handlers — wrap service calls in `try { … } catch (err) { if (!sendServiceError(res, err)) next(err); }`.

### S-3. zod ↔ OpenAPI parity test
**Source:** `backend/src/__tests__/admin-contract.test.ts:116–123`.
**Apply to:** every new schema in `shared/contracts/admin/tag.ts` (TagRule, TagRuleListQuery, TagRuleCreate, TagRulePatch, TagRuleListResponse).
**Pitfall hooks:** Pitfall 1 (codegen drift — must commit `shared/types/api.ts` regen in same commit).

### S-4. TanStack Query v5 optimistic update (FE)
**Source:** new pattern (no in-repo analog) — composed from `tag-master.api.ts:84–95` mutation shape + TanStack v5 docs (RESEARCH §Sources Secondary).
**Apply to:** `useCreateTagRule`, `useDeleteTagRule` (count-changing mutations only — Suspend/Resume/Update don't change `rule_ref_count`).
**Pitfall hooks:** Pitfall 5 (race — `await qc.cancelQueries` at `onMutate` start; rely on `onSettled` invalidate as ground truth).

### S-5. Modal Dialog (FE)
**Source:** `frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx:23–93`.
**Apply to:** `TagRulesManagerModal`. Reuse `ModalOverlay` / `ModalHeader` / `InlineError` exports from `TagMasterCreateModal` (line 7).
**Notes:** Radix Dialog (via `shared/ui/dialog`) handles Esc / overlay click / focus trap.

### S-6. URL state via `useSearchParams` (FE)
**Source:** `frontend/src/features/voc/list/model/useVocFilterUrlState.ts:33`.
**Apply to:** `pages/admin/tags.tsx` (`?view=`, `?q=`) and `TagRulesFlatTable` (`?q=` + 250ms debounce).

### S-7. Migration up/down test (BE)
**Source:** `backend/src/__tests__/migration-014.test.ts` (full file).
**Apply to:** new `migration-024.test.ts`.
**Required:** include `004_tags.sql` AND `014_tag_master_ops.sql` in `BASE_FILES` (mig 024 inherits both); add `users` table stub for `created_by` FK target.

### S-8. MSW handler with mutable in-memory store
**Source:** `frontend/src/test/mocks/handlers/admin-tags.ts:11, 17–144`.
**Apply to:** all 4 new tag-rule handlers + 1 renamed (suspend).

### S-9. Permission gating (D-13)
**Source:** `backend/src/middleware/requireRole` usage across `admin-tags.ts:80, 98, 116, 134, 155, 176, 196`.
**Matrix this phase:**
- `requireRole('admin', 'manager', 'dev')` — GET list (read).
- `requireRole('admin', 'manager')` — POST create, PATCH update.
- `requireRole('admin')` — DELETE, PATCH suspend.

### S-10. Role guard + redirect (FE)
**Source:** `frontend/src/pages/admin/tags.tsx:11–15` (`useRole` + `<Navigate to="/voc" replace />`).
**Apply to:** Keep current guard on extended page (no change). Use `useRole().isAdmin` inside modal row-action for D-13 hide-non-admin actions.

---

## No Analog Found

| File | Role | Reason | Fallback |
|------|------|--------|----------|
| `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` | TanStack Query mutation cache test | First optimistic test in repo | Compose from `tag-master.api.ts` mutation shape + RESEARCH §Pattern 2 + TanStack v5 docs |
| `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx` | chip-array input | No precedent in codebase | Compose `<Input>` + array state per UI-SPEC §Add form keyword input |

---

## Pitfall ↔ Pattern Cross-Reference

| Pitfall (RESEARCH §Common Pitfalls) | Affected file(s) | Mitigation pattern |
|-------------------------------------|------------------|---------------------|
| 1. OpenAPI ↔ zod ↔ TS codegen drift | `openapi.yaml`, `contracts/admin/tag.ts`, `types/api.ts`, `admin-contract.test.ts` | S-3; codegen + commit in same commit |
| 2. Fixture-seed parity script hardcoded | `scripts/check-fixture-seed-parity.ts`, `shared/fixtures/admin-tag-rule.fixtures.ts` | Generalize to triples (above) |
| 3. `created_by` join missing | `services/admin/tag-master.ts` `listRules` | LEFT JOIN users excerpt above |
| 4. Trash restore SQL | `backend/src/repository/trash.ts:91, 145–160` | REST-rename safe (D-14); re-read AFTER OQ-R1 schema decision |
| 5. Optimistic update race | `useCreateTagRule`, `useDeleteTagRule` | S-4 — `cancelQueries` + `onSettled` invalidate |
| 6. Suspend route path collision | `routes/admin-tags.ts` registration order | Register `:ruleId/suspend` BEFORE `:ruleId` PATCH |
| 7. `keywords` UX vs schema | mig 024 + service + zod + auto-tag consumer | OQ-R1 plan-phase decision (Option C recommended) |

---

## Metadata

**Analog search scope:** `backend/src/{routes,services,migrations,__tests__}`, `frontend/src/{features/admin,pages/admin,test/mocks,features/voc/list/model}`, `shared/{openapi.yaml,contracts/admin,fixtures}`, `scripts/`.

**Files scanned for patterns (all read in-context this session):**
- `backend/src/routes/admin-tags.ts` (full)
- `backend/src/services/admin/tag-master.ts:1–120`
- `backend/migrations/014_tag_master_ops.sql` (full)
- `backend/src/__tests__/migration-014.test.ts` (full)
- `shared/contracts/admin/tag.ts` (full)
- `frontend/src/features/admin/tag-master/api/tag-master.api.ts` (full)
- `frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx` (full)
- `frontend/src/test/mocks/handlers/admin-tags.ts` (full)
- `frontend/src/pages/admin/tags.tsx` (full)
- `frontend/src/features/voc/list/model/useVocFilterUrlState.ts:1–60`
- `scripts/check-fixture-seed-parity.ts` (full)

**Pattern extraction date:** 2026-05-10
