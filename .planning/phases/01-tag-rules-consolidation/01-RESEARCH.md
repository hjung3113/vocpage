# Phase 1: Tag Rules Consolidation — Research

**Researched:** 2026-05-10
**Domain:** Admin CRUD UI consolidation + REST resource rename + DB schema migration
**Confidence:** HIGH (codebase verified line-by-line; specs cross-referenced)

## Summary

This phase has a deceptively heavy backend footprint despite framing as "UI consolidation." Three independent but coupled changes ride in one PR:

1. **Implement** the missing `/admin/tag-rules` list/create/update/delete endpoints (currently **only `suspend` is implemented** — OpenAPI declares the others but BE has no handlers, FE has no hooks, and MSW has no mocks).
2. **Rename** the (about-to-exist + existing-suspend) endpoints to tag-nested form `/admin/tags/:tagId/rules[/:ruleId][/suspend]` — single PR, no compatibility alias.
3. **Reshape** the `tag_rules` DB row: add `created_by` (mig 024) and reconcile the schema mismatch between OpenAPI's single `pattern: string` field and CONTEXT D-05's chip-array UX (`keywords[]`) + D-06 `match_mode` select. The current 004_tags.sql schema has neither `keywords` nor `match_mode` — both must be introduced as part of mig 024 or addressed via JSON-encoded `pattern` (decision needed in plan-phase).

**Primary recommendation:** Treat this phase as **3 sub-features (BE rules CRUD impl, schema mig 024, FE consolidation)** that share a single OpenAPI/zod surface. Sequence: (a) zod + OpenAPI rewrite (single source of truth), (b) mig 024 + BE handlers + BE tests, (c) FE api hooks + MSW + UI, (d) spec sync + sidebar/route grep verification. Fixture-seed parity script needs generalisation before `tag_rules` rows can be added.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Edit Surface**
- **D-01** `규칙 N건` 뱃지 클릭 → Modal Dialog. 기존 `TagMaster*Modal` 패턴 재사용. Modal 내부에 sub-table + 인라인 추가/수정 폼 + 행별 액션. Side drawer / 인라인 확장 row 채택하지 않음.
- **D-02** Modal sub-table 컬럼 = spec §9.4.1 (`키워드 목록 | 생성 태그명 | 매칭 방식 | 작업`) + `작성자(created_by)` 추가. Dialog 헤더 = 부모 태그명 + `규칙 N건` 카운트.

**View-mode Toggle**
- **D-03** `/admin/tags` 상단 view-mode tab(`태그` / `전체 규칙`). `전체 규칙` 탭 = flat tag_rules 테이블 (`키워드 | 태그 | 매칭 방식 | 일시중지 상태 | 작성자 | 작업`), 키워드 검색은 서버측 `q` 파라미터.
- **D-04** 탭 상태 URL query 영속화: `?view=tags|rules`, `?q=...`. Default `view=tags`.

**Form Fields & Validation**
- **D-05** 키워드 입력 = chip array UX. Enter / 쉼표로 추가, x로 제거, 중복 inline 에러. **BE는 정규화된 string array로 받음** (zod contract 갱신).
- **D-06** `match_mode` select 노출. 현재 옵션 = `키워드` 1개. select 컴포넌트 자체 렌더 (future-proof).
- **D-07** `created_by`는 BE에서 현재 로그인 user의 `displayName` 자동 set. FE 미입력.

**API Rename (full migration, no alias)**
- **D-08** Tag-nested resource 완전 이행:
  - `GET  /api/admin/tag-rules?tagId=`           → `GET    /api/admin/tags/:tagId/rules`
  - `POST /api/admin/tag-rules`                  → `POST   /api/admin/tags/:tagId/rules`
  - `PATCH /api/admin/tag-rules/:id`             → `PATCH  /api/admin/tags/:tagId/rules/:ruleId`
  - `DELETE /api/admin/tag-rules/:id`            → `DELETE /api/admin/tags/:tagId/rules/:ruleId`
  - `PATCH /api/admin/tag-rules/:id/suspend`     → `PATCH  /api/admin/tags/:tagId/rules/:ruleId/suspend`
- **D-09** 단일 PR 내 동기 변경: `shared/openapi.yaml`, `shared/contracts/`, BE routes/services, FE api, MSW, BE Jest + FE Vitest, `feature-voc.md §9.4.1`, `routing-conventions.md`. 구 경로 alias 없이 즉시 제거.
- **D-10** Success criterion #3 (`rg "/admin/tag-rules"` = 0) 정책 경계: ADR / git history / `.planning/` 아카이브 제외.

**Live Badge Update**
- **D-11** Optimistic update: mutation `onMutate`에서 admin-tags list cache `tag.rule_count` ±1 (rollback 보존), `onError` rollback, `onSettled` invalidate. 동시 race = last-write-wins.

**Migration 024**
- **D-12** Mig 024 = `tag_rules.created_by` 단일 컬럼 추가. NULL 허용. backfill 정책은 plan-phase에서 결정.

**Permission Model**
- **D-13** Tag rule mutate 권한:
  - `POST /api/admin/tags/:tagId/rules` — Manager+
  - `PATCH /api/admin/tags/:tagId/rules/:ruleId` — Manager+
  - `DELETE /api/admin/tags/:tagId/rules/:ruleId` — Admin only
  - `PATCH /api/admin/tags/:tagId/rules/:ruleId/suspend` — Admin only

**Trash Restore Idempotency**
- **D-14** rename 후에도 vocs 복원 시 tag_rules 멱등 재실행 정책 유지. BE `trash.ts`의 tag_rules 호출 path/식별자만 nested 형태에 맞춰 갱신 (실제 호출은 SQL 직접 — REST path 무관, 확인 필요).

### Claude's Discretion

- Modal 폭 / sub-table 페이지네이션 임계치 (uidesign.md 토큰 + 기존 TagMaster Modal 폭 기준).
- Optimistic update race rollback context shape (TanStack Query 표준 패턴).
- `q` 검색의 BE 매칭 컬럼 (현재는 `tag_rules.keywords` + `tags.name` — researcher가 확인).
- Mig 024 `created_by` backfill 정책 (NULL 유지 / "system" sentinel / 기존 admin 한 명 backfill).

### Deferred Ideas (OUT OF SCOPE)

- 다중 태그 일괄 import (NextGen).
- match_mode 추가 옵션(regex / exact) 실제 구현 — select 슬롯만, 옵션 확장은 별 phase.
- `tag_rules.updated_by` / `last_modified_by` audit (NextGen).
- `voc_types` HEX color picker / merge — Phase 2.
- `tag_rules` 일시중지 만료 알림 / 자동 재개 cron — 미스코프.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-admin-pages-wave (Phase A) | `/admin/tags` 한 페이지에서 태그별 자동 태깅 규칙 관리 — 별 페이지 폐지 | (Standard Stack §1–3, Architecture §1–4, Pitfalls §1–6 below); current state baseline shows `/admin/tag-rules` route never existed in router/sidebar — only routing-conventions.md line 20 lists it |

## Project Constraints (from CLAUDE.md)

| Directive | Source | Compliance |
|-----------|--------|------------|
| TS/TSX symbol/refs/rename → Serena, not rg | root §3 Tool routing | Plan must specify Serena for refactor steps |
| Visual surface aligned to `uidesign.md` tokens (irreversible) | root §3 Reversibility | UI-SPEC.md already PASS — re-confirm at impl time |
| TDD for irreversible surface (BE routes / migrations / contracts) | root §3 Testing | mig 024 + BE handlers + zod = test-first |
| Stack: Vitest (FE) / Jest + Supertest (BE) | root §3 Testing | confirmed (frontend/CLAUDE.md, backend/CLAUDE.md) |
| Fixture-seed parity enforced | shared dir + `scripts/check-fixture-seed-parity.ts` | Currently `vocs`-only — must extend to `tag_rules` |
| BE 593+ Jest baseline preserve · FE 691+ Vitest baseline preserve | STATE.md §Performance | Verify after each commit |
| Tag tokens: shadcn/ui Radix + lucide-react + token-purity ESLint rule | frontend/CLAUDE.md | UI-SPEC.md confirms primitives |
| English identifiers, Korean UI copy, MEMORY.md feedback_korean_questions | root + memory | UI-SPEC.md copy already in Korean |
| Single-prompt token budget ≤ 50% session running total | root §3 Execution | Plan to use `offset/limit` for large reads of openapi.yaml |
| Layering: routes → services → repository | backend/src/CLAUDE.md | Existing tag-master.ts already follows |
| Permission decisions in `services/permissions/` (single source) | backend/src/CLAUDE.md | New rule mutate gates use existing `requireRole` middleware |
| `routes/` zod via `validate({...})` from `middleware/validate` | existing pattern in admin-tags.ts | Reuse for new routes |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tag rule CRUD persistence | API/Backend (`backend/src/services/admin/tag-master.ts`) | Database (`tag_rules` table, mig 024) | Service layer owns business logic; SQL only via repository |
| Tag rule CRUD HTTP transport | API/Backend (`backend/src/routes/admin-tags.ts`) | — | Express handlers wire zod-validated input → service → response |
| Auth identity for `created_by` | API/Backend (`req.user`) | — | Server-derived only — never accept FE input (D-07) |
| OpenAPI / zod contract authority | Shared (`shared/openapi.yaml` + `shared/contracts/admin/tag.ts`) | API (consumes), FE (consumes) | Single source of truth; codegen-driven types |
| Rule list/CRUD modal UI | Frontend (FE features `tag-master/ui/`) | shared/ui/dialog | Composes Radix Dialog + token-aligned primitives |
| URL state for view-mode + q | Frontend (page route, `useSearchParams`) | — | Client-side query param persistence per D-04 |
| Optimistic cache update | Frontend (TanStack Query `onMutate`/`onError`/`onSettled`) | API (`onSettled` invalidate confirms) | D-11 last-write-wins pattern |
| Search match (`q` against keywords + tags.name) | API/Backend (SQL `ILIKE`) | Database | Server-side, no FE filter |
| Permission gate (Manager+ vs Admin only) | API/Backend (`requireRole` middleware) | Frontend (sidebar/button visibility) | BE = primary; FE = UX secondary |
| Trash restore tag_rules re-run | API/Backend (`backend/src/repository/trash.ts`) | Database | SQL-only (no REST path coupling — D-14 verified safe) |
| Fixture-seed parity for tag_rules | Build/Tooling (`scripts/check-fixture-seed-parity.ts`) | shared/fixtures + backend/seeds | Script needs extension beyond hardcoded `vocs` table |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.3.1 | FE framework | Project standard `[VERIFIED: frontend/package.json]` |
| @tanstack/react-query | v5 (per `frontend/CLAUDE.md`) | Server state, optimistic updates, cache invalidation | Project standard; D-11 optimistic pattern fits naturally `[VERIFIED: frontend/CLAUDE.md]` |
| react-hook-form + zod (`shared/contracts/`) | zod ^4.4.1 | Form + validation | Project standard `[VERIFIED: package.json]` |
| Radix Dialog (via `shared/ui/dialog`) | shadcn pull | Modal primitive | TagMaster modals already use it (`TagMasterEditModal.tsx` etc.) `[VERIFIED: codebase]` |
| Radix Tabs (via `shared/ui/tabs`) | shadcn pull | View-mode tabs | UI-SPEC.md §Reused primitives confirms `[VERIFIED: shared/ui/ ls]` |
| react-router-dom `useSearchParams` | (existing) | URL state for `?view=`, `?q=` | Pattern already used in `useVocFilterUrlState.ts` `[VERIFIED: rg]` |
| MSW v2 | ^2.14.2 | FE test mocks | Project standard; existing `admin-tags.ts` handler file `[VERIFIED: package.json]` |
| Vitest | ^1.5.0 | FE test runner | Project standard `[VERIFIED: package.json]` |
| Express | ^4.19.2 | BE HTTP | Project standard `[VERIFIED: backend/package.json]` |
| zod (BE) | ^4.4.1 | shared contract validation | `validate({body, query, params})` middleware already wired `[VERIFIED: admin-tags.ts:24]` |
| Jest + Supertest | ^29.7.0 / ^6.3.4 | BE test runner | Project standard; existing `admin-tags.test.ts` `[VERIFIED: backend/package.json]` |
| pg (PostgreSQL) | (existing) | tag_rules table store | Project standard with pgvector `[VERIFIED: backend/CLAUDE.md]` |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| lucide-react | Icons (Plus, Pencil, Trash2, Pause, Play, X, Search) | All new icons declared in UI-SPEC.md §Design System |
| @radix-ui via shadcn `dropdown-menu` | Row-action menu in modal sub-table | Per UI-SPEC.md §TagRulesManagerModal anatomy |
| @radix-ui via shadcn `select` | match_mode select (single option, future-proof) | D-06 |
| @radix-ui via shadcn `alert-dialog` | Destructive confirmations (Delete/Suspend/Resume) | UI-SPEC.md §Destructive matrix |

### Alternatives Considered

| Instead of | Could Use | Tradeoff (Why we don't) |
|------------|-----------|--------------------------|
| Modal-based row-action | Side drawer / inline expansion | Rejected by D-01 (admin pattern consistency — TagMaster CRUD all modal) |
| Backwards-compatible alias for `/admin/tag-rules*` | Keep old routes for one PR cycle | Rejected by D-09 (single-PR breaking; no external consumers) |
| Optimistic update via local `useState` | TanStack `onMutate` cache patch | Rejected — cache patch is the only way the *parent* `/admin/tags` row badge can re-render N+1 instantly |
| Adding `tag_rules.keywords text[]` column | JSON-encode keywords inside existing `pattern` text | Both viable; **not yet decided** — see Open Questions OQ-R1 below |

**Installation:** No new packages required. Every primitive UI-SPEC.md references is already present in `shared/ui/`.

**Version verification:** Skipped — all dependencies are existing project standards. Adding any new package would violate the "no new third-party blocks" guarantee in UI-SPEC.md §Registry Safety.

## Architecture Patterns

### System Architecture Diagram

```
                   /admin/tags page (?view=tags|rules&q=...)
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
        view=tags (default)   view=rules        useSearchParams
        TagMasterTable        FlatRulesTable    (URL state SSOT)
        + 규칙 N건 column     + q search
                │                 │
                ▼                 ▼
       useAdminTags (cache patched optimistically by D-11)
       useTagRulesByTag(tagId)  /  useAllTagRules(q)
                │                 │
                ▼                 ▼
        TanStack Query → fetch → /api/admin/tags/:tagId/rules*
                                  /api/admin/tags?... (existing)
                                  │
                                  ▼
                         Express auth middleware (req.user)
                                  │
                                  ▼
                    requireRole(...) per D-13
                                  │
                                  ▼
                     validate({params, body, query})  ← zod
                                  │
                                  ▼
            services/admin/tag-master.ts  (listRules / createRule / patchRule
                                           / deleteRule / suspendTagRule)
                                  │
                                  ▼
                     repository/* SQL via getPool()
                                  │
                                  ▼
                     PostgreSQL: tag_rules (mig 024 adds created_by)
                                  │
                                  ▼
                     LEFT JOIN users ON tr.created_by = users.id
                     SELECT users.display_name AS created_by_name

                  ┌───────────────────────────────────────────────┐
                  │ Cross-cut: backend/src/repository/trash.ts §5 │
                  │ tag_rules idempotent re-run (ADR-0005, D-14)  │
                  │ → REST path agnostic (direct SQL); verify     │
                  │   no rename leakage in this file              │
                  └───────────────────────────────────────────────┘
```

### Recommended Project Structure (extensions to existing tree)

```
backend/
├── migrations/
│   └── 024_tag_rules_created_by.sql           # NEW — D-12
├── src/
│   ├── routes/admin-tags.ts                   # ADD nested rule routes; KEEP tag routes
│   ├── routes/__tests__/admin-tags.test.ts    # EXTEND with rule CRUD coverage
│   ├── services/admin/tag-master.ts           # ADD listRules / createRule / patchRule / deleteRule
│   └── __tests__/migration-024.test.ts        # NEW — pg-mem up/down round-trip (mirror migration-014.test.ts)

shared/
├── openapi.yaml                               # REWRITE: paths /admin/tag-rules* → /admin/tags/:tagId/rules*
│                                              #          schemas: TagRule.pattern → keywords[]+match_mode (?)
│                                              #          schemas: TagRule.created_by{id,display_name} (?)
├── contracts/admin/tag.ts                     # ADD TagRuleListResponse, TagRuleCreate, TagRulePatch (zod)
│                                              # KEEP TagRuleSuspendInput
└── fixtures/admin-tag-rule.fixtures.ts        # NEW — TAG_RULE_IDS already declared in admin-tag.fixtures.ts

frontend/
├── src/
│   ├── pages/admin/tags.tsx                   # EXTEND: view-mode tabs + search + flat-rules branch
│   ├── pages/admin/__tests__/AdminTagsPage.test.tsx  # EXTEND
│   ├── features/admin/tag-master/
│   │   ├── api/tag-master.api.ts              # ADD useAdminTagRules / useCreateTagRule /
│   │   │                                       # useUpdateTagRule / useDeleteTagRule
│   │   │                                       # CHANGE useSuspendTagRule URL to nested
│   │   └── ui/
│   │       ├── TagMasterTable.tsx             # ADD `규칙 N건` column + button
│   │       ├── TagRulesManagerModal.tsx       # NEW — sub-table + inline form per UI-SPEC.md
│   │       ├── TagRulesFlatTable.tsx          # NEW — view=rules surface
│   │       └── KeywordChipInput.tsx           # NEW — chip-array input per D-05
│   └── test/mocks/handlers/admin-tags.ts      # EXTEND: add rule list/create/patch/delete handlers;
│                                              # CHANGE suspend handler URL to nested

scripts/
└── check-fixture-seed-parity.ts               # GENERALISE — currently hardcodes vocs only
```

### Pattern 1: Express route + zod `validate` middleware

**What:** Existing pattern in `admin-tags.ts:78–209`. Add new routes following same shape.
**When to use:** Every new BE handler in this phase.
**Example (verified pattern from `admin-tags.ts:96–108`):**

```typescript
// Source: backend/src/routes/admin-tags.ts:96
adminTagsRouter.post(
  '/tags/:tagId/rules',
  requireRole('admin', 'manager'),
  validate({ params: TagIdParam, body: TagRuleCreate }),
  async (req, res, next) => {
    try {
      const rule = await svc.createTagRule(
        req.params.tagId,
        req.body as TagRuleCreateT,
        req.user!,        // D-07 auto-set created_by from req.user
      );
      res.status(201).json(rule);
    } catch (err) {
      if (!sendServiceError(res, err)) next(err);
    }
  },
);
```

### Pattern 2: TanStack Query optimistic cache patch (D-11)

**What:** `onMutate` snapshots `['admin','tags']` cache and increments `rule_ref_count`; `onError` restores; `onSettled` invalidates.
**When to use:** Create / Delete tag rule (Suspend / Resume don't change count).
**Example (write-up — verify exact API names in TanStack v5):**

```typescript
// Source pattern: TanStack Query v5 docs (CITED: tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
useMutation({
  mutationFn: (input) => apiPost(`/api/admin/tags/${tagId}/rules`, input, TagRule),
  onMutate: async (input) => {
    await qc.cancelQueries({ queryKey: ['admin','tags'] });
    const prev = qc.getQueryData(['admin','tags']);
    qc.setQueryData(['admin','tags'], (old) => /* increment rule_ref_count for tagId */);
    return { prev };
  },
  onError: (_err, _input, ctx) => qc.setQueryData(['admin','tags'], ctx?.prev),
  onSettled: () => qc.invalidateQueries({ queryKey: ['admin','tags'] }),
});
```

### Pattern 3: Modal Dialog pairing (D-01)

**What:** `<Dialog open={!!target} onOpenChange={...}>` controlled by parent state — exact pattern in `TagMasterEditModal.tsx`.
**When to use:** New `TagRulesManagerModal`.

### Pattern 4: URL state via `useSearchParams` (D-04)

**What:** Read+write `?view=`/`?q=` via `useSearchParams` from react-router-dom.
**Verified pattern:** `frontend/src/features/voc/list/model/useVocFilterUrlState.ts:33`.

### Anti-Patterns to Avoid

- **Renaming via `rg` only:** TS/TSX rename for symbols (e.g. `useSuspendTagRule` callsites) MUST use Serena `find_referencing_symbols` per root CLAUDE §3 — `rg` for cross-file *string* rename is fine, symbol rename is not.
- **Building chip-array input from scratch:** Use a small composable around `<Input>` + state array. Don't pull in `react-tag-input` or similar.
- **Adding alias routes:** D-09 explicitly forbids it.
- **Putting `created_by` writeable on FE:** D-07 — server-derived only.
- **Touching `prototype/` for visual reference:** root CLAUDE.md §1 forbids since 2026-05-09.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trap, Esc-to-close, overlay click | Custom modal | `shared/ui/dialog` (Radix Dialog) | Already used by all TagMaster modals; a11y handled |
| Tab state with active ring | Custom buttons | `shared/ui/tabs` (Radix Tabs) | UI-SPEC.md §View-mode tabs |
| URL query param state | manual `window.history.pushState` | `useSearchParams` from react-router-dom | Existing project pattern (`useVocFilterUrlState.ts`) |
| Debounced search input | manual `setTimeout` | Tiny inline `useEffect` w/ `setTimeout` cleanup OR the existing pattern in voc-filter (verify) | UI-SPEC.md mandates 250ms debounce |
| Optimistic cache mutation | direct DOM manipulation | TanStack `onMutate`/`onError`/`onSettled` | D-11 |
| Permission gating | role checks scattered in handlers | `requireRole(...)` middleware | Existing pattern at admin-tags.ts:80,98,116,134,155,176,196 |
| Confirmation dialog | window.confirm | `shared/ui/alert-dialog` (Radix AlertDialog) | UI-SPEC.md §Destructive matrix |
| Slug/unique generation for rules | manual | Defer to BE; rules use UUID PK only | No slug needed for rules (mig 004) |

**Key insight:** Every primitive needed already exists in `shared/ui/`. UI-SPEC.md §Registry Safety promises zero new third-party blocks — research confirms it.

## Runtime State Inventory

> Phase involves an API rename + endpoint introduction + DB column add. Inventory addresses what survives `rg "/admin/tag-rules"` going to 0 and what migration 024 must reckon with.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `tag_rules` table (mig 004) — currently rows can exist with `pattern` (text), `is_active` (bool), `suspended_until` (mig 014). No `created_by` yet. Existing rows after mig 024 will have `created_by = NULL` until backfilled. | Mig 024 adds `created_by uuid NULL REFERENCES users(id)`. Backfill policy = plan-phase decision (D-12 OQ). FE renders `—` for NULL per UI-SPEC.md OQ-UI-2. **Possibly also:** `keywords text[]` column + `match_mode text` column — see Open Questions OQ-R1 (D-05/D-06 require structural change to `tag_rules` schema OR JSON-encoding into existing `pattern` field). |
| **Live service config** | None identified. No tag_rules data lives in n8n / external service. | None. |
| **OS-registered state** | None. No cron / Task Scheduler / launchd reference to `tag-rules`. | None. |
| **Secrets / env vars** | None — `AUTH_MODE` switch (`backend/src/auth/index.ts`) governs auth but is unrelated. | None. |
| **Build artifacts / installed packages** | `shared/types/api.ts` is OpenAPI codegen output (line `display_name` references already exist for users) — **regen required** after `openapi.yaml` paths/schemas change. | Run OpenAPI codegen step after rewrite (project surely has a `openapi:gen` script — verify in plan-phase). |
| **String references (rg = 0 target)** | `rg "/admin/tag-rules"` BEFORE phase: 8 hits — `shared/openapi.yaml` (paths block 1532–1817), `shared/contracts/admin/tag.ts:19,90`, `shared/types/api.ts` (codegen mirror), `backend/src/routes/admin-tags.ts:11,191,195`, `backend/src/routes/__tests__/admin-tags.test.ts:11,251,253,257,265`, `frontend/src/test/mocks/handlers/admin-tags.ts:3,146,147`, `frontend/src/features/admin/tag-master/api/tag-master.api.ts:89`, `docs/specs/requires/routing-conventions.md:20`. AFTER phase target: 0 (excluding `.planning/`, `docs/adr/`, git history per D-10). | Each hit must rename. routing-conventions.md line 20 must be removed (the route never had a page anyway). |

**Verification command:** `rg -n "/admin/tag-rules" -g '!.planning' -g '!docs/adr' -g '!graphify-out' -g '!node_modules'` MUST return 0 lines at phase close.

## Common Pitfalls

### Pitfall 1: OpenAPI ↔ zod ↔ TypeScript codegen drift
**What goes wrong:** Editing `shared/openapi.yaml` paths/schemas without re-running codegen leaves `shared/types/api.ts` (1413 / 1422 / 1725 / 1988 carry `display_name` references already) referencing old shapes; FE tests pass against stale types, integration breaks.
**Why it happens:** Three-way SoT problem — yaml + zod + generated TS.
**How to avoid:** Single PR: edit yaml + zod + run codegen + commit generated types in same commit. Existing `admin-contract.test.ts` (`backend/src/__tests__/admin-contract.test.ts:116-123`) locks zod ↔ OpenAPI parity for `TagRuleSuspendInput` — extend it for new schemas.
**Warning signs:** TS errors in `shared/types/api.ts`; FE test passes but real API request 400s.

### Pitfall 2: Forgetting fixture-seed parity script generalisation
**What goes wrong:** `scripts/check-fixture-seed-parity.ts` is **hardcoded** to read `vocs` migration + `voc.fixtures.ts`. Adding `tag_rules` to fixtures without updating script gives false green.
**Why it happens:** Script appears to be a generic "parity check" but isn't.
**How to avoid:** Plan-phase task: refactor parity script to take a `(table, migration_path, fixture_path)` triple and run all three (vocs, tag_rules, future). STATE.md §Performance Metrics commits to `tag_rules` parity for this phase.
**Warning signs:** Parity check passes immediately after adding tag_rules fixture (it can't have unless script changed).

### Pitfall 3: `created_by` join missing from list responses
**What goes wrong:** Mig 024 adds the column; service `listTagRules` SELECT doesn't `LEFT JOIN users` to get `display_name`; FE renders `id` instead of name.
**Why it happens:** `tag_rules` join is currently absent (only `tr.tag_id = t.id` join exists at `tag-master.ts:54,168`).
**How to avoid:** Service SQL must `LEFT JOIN users u ON u.id = tr.created_by`, project `u.display_name AS created_by_name`. Zod response schema includes `created_by_name: string | null`.
**Warning signs:** UI-SPEC.md §Sub-table column "작성자" shows UUID instead of name in test rendering.

### Pitfall 4: Trash restore SQL touching renamed column
**What goes wrong:** `backend/src/repository/trash.ts:151` re-runs `tag_rules` on VOC restore. If schema reshaping (D-05 keywords[]) happens, the SQL `SELECT FROM tag_rules tr` columns matter.
**Why it happens:** ADR-0005 §복원 시 재실행 references column shape; rename of REST path is *unrelated* to SQL but **schema** changes are.
**How to avoid:** Plan-phase task: re-read `trash.ts:91–160` after schema decision (OQ-R1). REST rename = no impact (D-14). Schema reshape = potential impact.
**Warning signs:** `trash.sql.test.ts` failing after mig 024 lands.

### Pitfall 5: Optimistic update race vs concurrent mutations
**What goes wrong:** Two `+ 규칙 추가` clicks in <500ms; both `onMutate` increment from N to N+1 (instead of N+2); `onSettled` invalidate eventually corrects but UI flickers.
**Why it happens:** Concurrent `onMutate` reads stale snapshot.
**How to avoid:** D-11 says "last-write-wins" — accept the race; use `qc.cancelQueries` at `onMutate` start (TanStack pattern); rely on `onSettled` invalidate as ground truth.
**Warning signs:** Test that fires 2 mutations within same tick should converge after settle.

### Pitfall 6: Suspend route path collision with new nested rule path
**What goes wrong:** New `PATCH /api/admin/tags/:tagId/rules/:ruleId` path matches `/api/admin/tags/:tagId/rules/:ruleId/suspend`'s parent prefix. Wrong route order in Express → suspend hits patch handler.
**Why it happens:** Express matches in registration order.
**How to avoid:** Register `:ruleId/suspend` **before** `:ruleId` PATCH (or use distinct guard). Existing pattern: `/tags/:id/merge` (line 132) registered before `/tags/:id` PATCH (line 114) — so the file already needs careful reordering.
**Warning signs:** `admin-tags.test.ts` for suspend returns rule body shape instead of suspend response.

### Pitfall 7: `keywords` UX assumes array, BE storage may be single text
**What goes wrong:** D-05 mandates "BE는 정규화된 string array로 받는다 (zod contract 갱신)" — but `tag_rules.pattern` is `text NOT NULL` per mig 004. Storing `["bug","fix"]` as JSON string in `pattern` works at the SQL layer but every consumer (auto-tag service, trash restore, future regex matcher) must agree on encoding.
**Why it happens:** Schema designed for single regex pattern; product UX moved to chip array.
**How to avoid:** Plan-phase OQ-R1 — decide between (A) `keywords text[]` new column with mig 024 (clean, breaks any current pattern consumer — verify zero), (B) JSON-encode into `pattern` (no schema break, semantic mismatch).
**Warning signs:** Auto-tag service (the consumer of `tag_rules.pattern`) — must locate and reconcile in plan-phase.

## Code Examples

### Inspecting auto-tag consumer of `tag_rules.pattern`

```bash
# Source: rg verified — only consumer of .pattern is the about-to-be-rewritten admin layer.
# Auto-tag actual service (the production rule-matcher) needs a discovery step in plan-phase.
rg -n "pattern" backend/src/services/ | grep -i "tag\|rule"
```

### Modal pattern reference (verified)

```typescript
// Source: frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx (existing)
// New TagRulesManagerModal MUST follow same Dialog open/onOpenChange + form-on-submit shape.
```

### Existing zod parity contract test (extend)

```typescript
// Source: backend/src/__tests__/admin-contract.test.ts:116-123 (verified)
test('TagRuleSuspendInput required ⊆ zod + nullable parity', () => {
  zodOpenApiParity('TagRuleSuspendInput', Admin.TagRuleSuspendInput as unknown as AnyZodObject);
  zodOpenApiNullableParity('TagRuleSuspendInput', Admin.TagRuleSuspendInput as unknown as AnyZodObject);
});

// EXTEND for: TagRuleListResponse, TagRuleCreate, TagRulePatch (new schemas)
```

### Sidebar entry verification (no action needed)

```typescript
// Source: frontend/src/widgets/app-shell/Sidebar.tsx:43-49 (verified)
const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin/tags', label: '태그 마스터', icon: Tag, adminGroup: true },
  { to: '/admin/masters', label: '외부 마스터', icon: Database, adminGroup: true },
  { to: '/admin/users', label: '사용자', icon: Users, adminStrict: true },
  { to: '/admin/vocs/trash', label: '휴지통', icon: Trash2, adminStrict: true },
];
// `/admin/tag-rules` was NEVER in the sidebar. Success criterion #3 satisfied here already.
// Only routing-conventions.md:20 needs the entry removed (and openapi/code paths renamed).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rule mutate via dedicated `/admin/tag-rules` page | Inline modal on `/admin/tags` row | This phase (Phase 1) | Eliminates page; consolidates admin surface |
| OpenAPI `pattern: string` (single regex) | (Likely) `keywords: string[]` + `match_mode: enum` | Pending OQ-R1 in plan-phase | DB schema reshape; consumers reconciled |
| `/admin/tag-rules*` REST | `/admin/tags/:tagId/rules*` REST | This phase | Aligns with REST nested-resource convention |
| `tag_rules.created_by` absent | `tag_rules.created_by uuid NULL REFERENCES users(id)` | Mig 024 | Author display in UI |

**Deprecated/outdated after this phase:**
- `routing-conventions.md:20` — entry must be removed.
- OpenAPI section `/admin/tag-rules*` (lines 1532–1614, 1817–1842) — must move to `/admin/tags/{tagId}/rules*`.
- All FE/BE/MSW string occurrences of `/admin/tag-rules`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OpenAPI codegen output `shared/types/api.ts` is regenerated by a project script (not hand-written) | Pitfall 1 + Build artifacts inventory | If hand-written, plan must include manual update task |
| A2 | The auto-tag rule-matcher service that consumes `tag_rules.pattern` exists somewhere outside the admin layer | Pitfall 7 | If the matcher is missing, schema reshape risk-free; if present, plan must update it |
| A3 | `tag_rules.keywords text[]` migration approach (vs JSON-in-`pattern`) is the right call | Pitfall 7 + OQ-R1 | If Option B (JSON) is chosen, mig 024 stays smaller but every reader needs JSON parse — verify |
| A4 | TanStack Query v5 `onMutate`/`onError`/`onSettled` API stable for D-11 pattern | Pattern 2 | API change between v4→v5 already happened; project on v5 per `frontend/CLAUDE.md` |
| A5 | `req.user.name` (from `AuthUser.name`) is the correct field for `created_by` display, mapped to `users.display_name` on persist | Architecture map + D-07 | If `req.user.id` should write and `users.display_name` only reads on join, current path holds |

## Open Questions

1. **OQ-R1 — Schema for keywords + match_mode (BLOCKING for plan-phase)**
   - What we know: D-05 chip-array UX; D-06 select with single `키워드` option; current `tag_rules` schema has `pattern: text` and `kind: enum('general')` only. OpenAPI `TagRule.pattern` is `string`.
   - What's unclear: (A) Add `keywords text[]` column via mig 024 + deprecate `pattern`, (B) keep `pattern` and JSON-encode `["bug","fix"]`, (C) add both `keywords[]` and `match_mode text`.
   - Recommendation: Option C — clean separation; `match_mode` as text NOT NULL DEFAULT 'keyword' for future regex/exact extension. Plan-phase user prompt required.

2. **OQ-R2 — `created_by` backfill policy**
   - What we know: D-12 defers; UI-SPEC.md OQ-UI-2 hints at `(시스템)` sentinel option.
   - What's unclear: NULL preserved / "system" sentinel UUID / one-admin backfill.
   - Recommendation: NULL preserved; FE renders `—` per UI-SPEC.md. Plan-phase confirm.

3. **OQ-R3 — Auto-tag rule-matcher service location**
   - What we know: Trash restore re-runs rules in `backend/src/repository/trash.ts:145–160`. The actual auto-tag rule application on VOC creation must live elsewhere.
   - What's unclear: Where (`services/auto-tag.ts`? `services/voc/`?) and whether it consumes `pattern`.
   - Recommendation: Plan-phase Wave 0 discovery task — `rg "tag_rules" backend/src/services/` and reconcile any `.pattern` reads with OQ-R1 outcome.

4. **OQ-R4 — `q` search match columns for `view=rules`**
   - What we know: CONTEXT discretion area says "현재는 `tag_rules.keywords` + `tags.name` 양쪽 — researcher가 확인."
   - What's unclear: BE doesn't have any rule list endpoint yet, so there's nothing currently searchable.
   - Recommendation: Implement as `WHERE tr.keywords && ARRAY[$q] OR t.name ILIKE %q%` (assumes Option C above) OR `tr.pattern ILIKE %q%` (Option B). Decision tied to OQ-R1.

5. **OQ-R5 — How is `users.display_name` exposed? `useCurrentUser` FE hook?**
   - What we know: `/api/auth/me` returns `{id, name, role, ...}`; entity layer has `getMe` in `entities/user/api/userApi.ts:8`. No `useCurrentUser` hook exists in `entities/user/model/`.
   - What's unclear: For UI-SPEC.md §Modal "subtitle / author chip", need a hook.
   - Recommendation: BE persists `created_by = req.user.id`; FE never sets author. UI displays `created_by_name` from list response join — no FE-side current-user lookup needed. Confirm in plan-phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | FE+BE runtime | (existing project) | per project | — |
| PostgreSQL with pgvector | BE persistence + mig 024 | Docker Compose `pgvector/pgvector:pg16` | pg16 | — |
| pg-mem | mig 024 + service unit tests | Used by `migration-014.test.ts` | per project | — |
| MSW v2 | FE test mocks | ^2.14.2 | 2.14.2 | — |
| Vitest | FE test runner | ^1.5.0 | 1.5.0 | — |
| Jest + Supertest | BE test runner | ^29.7.0 / ^6.3.4 | versions confirmed | — |
| ripgrep (`rg`) | success criterion #3 verification | (assumed dev env) | n/a | grep -r |
| Serena MCP | TS symbol rename per root CLAUDE | (per project tooling) | n/a | rg + Read (slower) |

**No missing dependencies. No fallbacks required.**

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | FE: Vitest ^1.5.0 · BE: Jest ^29.7.0 + Supertest ^6.3.4 |
| Config file | FE: `frontend/vite.config.ts` (test block) · BE: `backend/jest.config.*` |
| Quick run command (FE) | `npm run typecheck -w frontend && npm run test -w frontend -- --run \| tail -20` |
| Quick run command (BE) | `npm run typecheck -w backend && npm run test -w backend \| tail -20` |
| Single FE test | `npm run test -w frontend -- path/to/file.test.ts` |
| Single BE test | `npm run test -w backend -- --testPathPattern=admin-tags.test` |
| Phase gate | Both quick commands green; BE 593+ Jest passes preserved; FE 691+ Vitest passes preserved |

### Phase Requirements → Test Map

| Req ID / Success | Behavior | Test Type | Automated Command | File Exists? |
|------------------|----------|-----------|-------------------|-------------|
| SC-1 (badge → modal CRUD) | Modal opens; rule list loads; create/update/delete/suspend round-trip | FE integration (MSW) | `npm run test -w frontend -- pages/admin/__tests__/AdminTagsPage` | ✅ AdminTagsPage.test.tsx exists — extend |
| SC-2 (badge N→N+1 + author display) | Optimistic patch increments rule_ref_count immediately | FE unit (TanStack Query) | (new) `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` | ❌ Wave 0 |
| SC-3 (rg = 0) | Verifier script | shell (CI) | `rg -n "/admin/tag-rules" -g '!.planning' -g '!docs/adr' \| wc -l` returns 0 | ❌ Wave 0 — add as CI step or post-commit hook |
| SC-4 (`전체 규칙` toggle + q search) | Tab switch URL state + server-side `q` filter | FE integration + BE Supertest | FE: AdminTagsPage tabs · BE: `admin-tags.test.ts` GET /admin/tags/.../rules with `q` | partial — extend |
| SC-5 (spec sync) | Three doc files updated in same PR | manual + CI lint | `git show HEAD --stat` includes `feature-voc.md`, `routing-conventions.md`, `openapi.yaml` | manual gate |
| Mig 024 schema | `created_by` column added/dropped | BE pg-mem round-trip | `npm run test -w backend -- --testPathPattern=migration-024` | ❌ Wave 0 — mirror migration-014.test.ts |
| Permission matrix (D-13) | Manager+ vs Admin only per route | BE Supertest | `npm run test -w backend -- --testPathPattern=admin-tags.test` (extend) | partial — extend |
| Zod ↔ OpenAPI parity | New TagRule schemas | BE Jest | `npm run test -w backend -- --testPathPattern=admin-contract.test` (extend) | partial — extend |
| Trash restore (D-14) | Re-run idempotent after rename | BE Supertest | `npm run test -w backend -- --testPathPattern=trash.sql.test` | ✅ exists — should pass unchanged if SQL untouched |
| Fixture-seed parity | tag_rules fixture matches mig schema | shell | `tsx scripts/check-fixture-seed-parity.ts` | partial — script needs generalisation |

### Sampling Rate

- **Per task commit:** corresponding workspace's quick run command.
- **Per wave merge:** both FE+BE quick commands in parallel (per `.claude/CLAUDE.md`).
- **Phase gate:** Full BE+FE suites green, baselines preserved, parity script green, `rg "/admin/tag-rules"` returns 0.

### Wave 0 Gaps

- [ ] `backend/src/__tests__/migration-024.test.ts` — pg-mem up/down round-trip (mirror `migration-014.test.ts`).
- [ ] `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` — D-11 cache patch unit test.
- [ ] CI / hook script for `rg "/admin/tag-rules"` = 0 verification.
- [ ] Generalise `scripts/check-fixture-seed-parity.ts` to accept (table, migration_path, fixture_path) triples.
- [ ] Extend `backend/src/__tests__/admin-contract.test.ts:116–123` to cover new TagRule* schemas.
- [ ] Extend `backend/src/routes/__tests__/admin-tags.test.ts` to cover all 5 nested rule routes (list/create/patch/delete/suspend) × 4 roles.
- [ ] Extend `frontend/src/test/mocks/handlers/admin-tags.ts` to mock list/create/patch/delete (currently only suspend).
- [ ] Extend `frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx` to cover view-mode tabs + flat rules table + modal open.
- [ ] New `shared/fixtures/admin-tag-rule.fixtures.ts` (TAG_RULE_IDS already declared in `admin-tag.fixtures.ts:33–37` — extend).

## Sources

### Primary (HIGH confidence — verified in this codebase)

- `backend/src/routes/admin-tags.ts:1–209` — current BE only has `suspend` for tag-rules.
- `backend/src/services/admin/tag-master.ts:1–240` — service shape and SQL patterns.
- `backend/migrations/004_tags.sql:21–32` — `tag_rules` original schema.
- `backend/migrations/014_tag_master_ops.sql:28–37` — `suspended_until` column.
- `backend/src/repository/trash.ts:91, 145–160` — tag_rules re-run on VOC restore (ADR-0005, D-14).
- `backend/src/auth/types.ts:1–22` — `AuthUser.name` field; `req.user` shape.
- `backend/migrations/002_core_tables.sql:10–20` — `users.display_name` column.
- `shared/openapi.yaml:1532–1614` — current `/admin/tag-rules` GET/POST/PATCH/DELETE paths.
- `shared/openapi.yaml:1817–1842` — current `/admin/tag-rules/:id/suspend` path.
- `shared/openapi.yaml:2960–3012` — `TagRule` / `TagRuleInput` / `TagRulePatch` schemas (no `created_by`, single `pattern`).
- `shared/contracts/admin/tag.ts:1–98` — zod schemas; only `TagRuleSuspendInput` exists for rules.
- `shared/fixtures/admin-tag.fixtures.ts:1–120` — TAG_RULE_IDS declared but no fixture rows yet.
- `frontend/src/features/admin/tag-master/api/tag-master.api.ts:1–96` — only `useSuspendTagRule` exists.
- `frontend/src/features/admin/tag-master/ui/` — TagMaster modal pattern (Edit/Suspend/Merge/Create).
- `frontend/src/test/mocks/handlers/admin-tags.ts:1–156` — only suspend handler for tag-rules.
- `frontend/src/pages/admin/tags.tsx:1–22` — currently thin wrapper over TagMasterTable.
- `frontend/src/widgets/app-shell/Sidebar.tsx:43–49` — `/admin/tag-rules` already absent.
- `frontend/src/app/router.tsx:13` — only `/admin/tags` route lazy-imported.
- `docs/specs/requires/feature-voc.md:545–549` — §9.4.1 current text (will be rewritten).
- `docs/specs/requires/routing-conventions.md:20` — line that must be removed.
- `docs/adr/0004-admin-permission-model.md:28,35,48,58` — Option D (D-13 source).
- `scripts/check-fixture-seed-parity.ts:1–80` — confirmed hardcoded for `vocs`.
- `frontend/package.json` / `backend/package.json` — versions (zod 4.4.1, react 18.3.1, msw 2.14.2, vitest 1.5.0, jest 29.7.0).

### Secondary (MEDIUM confidence)

- TanStack Query v5 optimistic update API (Pattern 2) `[CITED: tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates]` — verified by training; FE on v5 per project notes.

### Tertiary (LOW confidence)

- None — all phase claims trace to file:line in this codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package + version verified in package.json.
- Architecture: HIGH — pattern verified by direct read of admin-tags.ts/tag-master.ts/Sidebar.tsx/router.tsx.
- Pitfalls: HIGH — each pitfall traces to specific lines (e.g. Pitfall 6 to admin-tags.ts:114 vs 132 ordering).
- Schema reshape (Pitfall 7 / OQ-R1): MEDIUM — depends on plan-phase decision; both options are workable.

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (30 days; codebase is the SoT — re-verify only if rebase moves any cited lines).
