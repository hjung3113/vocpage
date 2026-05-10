---
phase: 01-tag-rules-consolidation
plan: 03
subsystem: shared-contract, openapi, codegen, parity-tests
tags: [wave-1, contract-rewrite, tdd-red-green, api-irreversible]
dependency_graph:
  requires:
    - 01-01 (Wave 0 scaffolding — TARGETS triples + fixtures baseline)
  provides:
    - shared/openapi.yaml (nested /admin/tags/{tagId}/rules paths + reshaped TagRule schema)
    - shared/contracts/admin/tag.ts (TagRule / TagRuleCreate / TagRulePatch / TagRuleListQuery / TagRuleListResponse / RuleIdParam)
    - shared/types/api.ts (regenerated)
    - backend/src/__tests__/admin-contract.test.ts (5 new parity tests, all GREEN)
  affects:
    - Plan 04 (BE routes) imports zod schemas + paths from this rewrite.
    - Plan 05 (FE hooks) imports zod schemas + uses generated types.
    - Plan 07 (FE wiring) flips legacy /admin/tag-rules call sites.
    - Plan 08 (spec sync) updates docs/specs after consumers migrate.
tech_stack:
  added: []
  patterns:
    - zod-openapi parity guard (zodOpenApiParity / zodOpenApiNullableParity) extended to TagRule cluster
    - Nested REST resource (/admin/tags/{tagId}/rules) reflecting FK ownership (D-08)
key_files:
  created: []
  modified:
    - shared/openapi.yaml
    - shared/contracts/admin/tag.ts
    - shared/types/api.ts
    - backend/src/__tests__/admin-contract.test.ts
decisions:
  - "OpenAPI path coverage = 3 path keys × 5 operations (List/Create/Update/Delete/Suspend). Plan AC mentioning ≥4 grep hits for `/admin/tags/{tagId}/rules` was off-by-one; actual count is 3 (one per path key) which exactly matches plan body spec."
  - "TagRuleSuspendInput zod + openapi schema unchanged; only the route URL changed (now nested). No schema-level migration needed."
  - "TagRuleListResponse parity uses `expectRequiredSubset` (rows array of $ref); the existing helper handles `required[]` shape as-is — no helper extension needed."
metrics:
  duration: ~25 min
  completed: 2026-05-10
---

# Phase 01 Plan 03: Tag Rules Contract Consolidation Summary

Single source-of-truth rewrite for the tag rules contract — nested resource paths, `keywords[]+match_mode` reshape, `created_by`+`created_by_name` server-derived author, regenerated TS types, and 5 new parity tests guarding zod ↔ openapi drift.

## Files Modified

- `shared/openapi.yaml` — paths and schemas (irreversible API surface).
- `shared/contracts/admin/tag.ts` — zod schemas (header doc-comment refreshed).
- `shared/types/api.ts` — regenerated via `npm run codegen`.
- `backend/src/__tests__/admin-contract.test.ts` — 5 new parity tests appended.

## OpenAPI Path Diff

**Removed (5 operations, 3 path keys):**
- `GET /admin/tag-rules` (`adminListTagRules`)
- `POST /admin/tag-rules` (`adminCreateTagRule`)
- `PATCH /admin/tag-rules/{id}` (`adminUpdateTagRule`)
- `DELETE /admin/tag-rules/{id}` (`adminDeleteTagRule`)
- `PATCH /admin/tag-rules/{id}/suspend` (`adminSuspendTagRule`)

**Added (5 operations, 3 path keys):**
- `GET /admin/tags/{tagId}/rules` (`adminTagRulesList`) → `TagRuleListResponse`
- `POST /admin/tags/{tagId}/rules` (`adminTagRulesCreate`) ← `TagRuleCreate` → `TagRule`
- `PATCH /admin/tags/{tagId}/rules/{ruleId}` (`adminTagRulesUpdate`) ← `TagRulePatch` → `TagRule`
- `DELETE /admin/tags/{tagId}/rules/{ruleId}` (`adminTagRulesDelete`) → 204
- `PATCH /admin/tags/{tagId}/rules/{ruleId}/suspend` (`adminTagRulesSuspend`) ← `TagRuleSuspendInput` → `TagRule`

operationIds renamed from legacy `adminListTagRules`-style to consistent `adminTagRules{Verb}` form (consumed by Plan 04 BE wiring; no live consumers in current codebase per 01-01-SUMMARY audit).

## OpenAPI Schema Diff

**Removed (1):** `TagRuleInput`.

**Reshaped (1):** `TagRule` — `name/pattern/is_active` removed; `keywords[]`, `match_mode`, `suspended_until?`, `created_by?`, `created_by_name?`, `created_at` added. Required tightened to `[id, tag_id, kind, keywords, match_mode, suspended_until, created_by, created_by_name, created_at]`.

**Reshaped (1):** `TagRulePatch` — pattern/name fields removed; `keywords?` + `match_mode?` only.

**Added (4):**
- `TagRuleCreate` — `keywords` (min 1) required, `match_mode` default `keyword`. Omits `created_by` (D-07).
- `TagRuleListQuery` — `q?`, `page` default 1, `per_page` default 20 max 100.
- `TagRuleListResponse` — `{rows, page, per_page, total}` mirroring `TagMasterListResponse`.

**Unchanged:** `TagRuleSuspendInput` (only route URL changed).

## zod Contract Additions (`shared/contracts/admin/tag.ts`)

```ts
export const TagRule           = z.object({ id, tag_id, kind: 'general', keywords: array(string).min(1), match_mode: 'keyword', suspended_until: nullable, created_by: nullable, created_by_name: nullable, created_at })
export const TagRuleCreate     = z.object({ keywords: min1, match_mode: default 'keyword' })  // OMITS created_by — D-07
export const TagRulePatch      = z.object({ keywords?, match_mode? })
export const TagRuleListQuery  = z.object({ q?, page: default 1, per_page: default 20 max 100 })
export const TagRuleListResponse = z.object({ rows: TagRule[], page, per_page, total })
export const RuleIdParam       = z.object({ tagId: Uuid, ruleId: Uuid })
```

Header doc-comment URL list rewritten to nested form.

## Codegen

- Script: `npm run codegen` → `openapi-typescript 7.13.0 shared/openapi.yaml -o shared/types/api.ts`.
- Output: `shared/types/api.ts` regenerated and committed (`92eced24`).
- Verified: `rg -F "TagRuleInput" shared/types/api.ts` returns 0; nested paths present at lines 995/1015/1036; `TagRuleListResponse` and `TagRuleCreate` present.

## Parity Tests Added (BE Jest)

`backend/src/__tests__/admin-contract.test.ts` — appended after existing `TagRuleSuspendInput` parity:

| # | Test | Assertion |
| --- | --- | --- |
| 1 | `TagRule required ⊆ zod + nullable parity` | `expectRequiredSubset` + `expectNullableSubset` |
| 2 | `TagRuleCreate required ⊆ zod` | `expectRequiredSubset` |
| 3 | `TagRulePatch all-optional parity` | `expectRequiredSubset` (no required keys) |
| 4 | `TagRuleListQuery defaults parity` | `expectRequiredSubset` (no required keys) |
| 5 | `TagRuleListResponse required ⊆ zod` | `expectRequiredSubset` (rows + totals) |

## Test Results

| Workspace | Before (Plan 02) | After (Plan 03) | Delta |
| --- | --- | --- | --- |
| BE Jest | 593 pass / 5 todo | **598 pass** / 5 todo | +5 (parity tests) |
| FE typecheck | clean | clean | — |
| BE typecheck | clean | clean | — |

`npm run typecheck -w backend && npm run test -w backend | tail -20` → 42 suites pass, 598 + 5 todo, 5.65s.
`npm run typecheck -w frontend` → clean.

## Sanity Greps

- `rg -n "/admin/tag-rules" shared/openapi.yaml shared/contracts/ shared/types/api.ts` → 0 hits.
- `rg -nF "TagRuleInput" shared/openapi.yaml shared/contracts/ shared/types/api.ts` → 0 hits.
- `grep -c "/admin/tags/{tagId}/rules" shared/openapi.yaml` → 3 (one per path key — see Decisions).
- `grep -E "operationId: adminTagRules(List|Create|Update|Delete|Suspend)" shared/openapi.yaml` → 5 hits.
- `grep -c "TagRuleListResponse" shared/openapi.yaml` → 2 (definition + GET 200 ref).
- `grep -E "^export const (TagRule|TagRuleCreate|TagRulePatch|TagRuleListQuery|TagRuleListResponse|RuleIdParam) " shared/contracts/admin/tag.ts` → 6 hits.
- `grep -c "created_by_name" shared/contracts/admin/tag.ts` → 2 (TagRule property + doc).

## Commits

| Phase | Hash | Message |
| --- | --- | --- |
| RED | `f631c23` | test(01-03): add parity tests for TagRule schemas (RED) |
| GREEN | `6d02cb71` | feat(01-03): consolidate tag rules contract to nested resource + keywords[] |
| Codegen | `92eced24` | chore(01-03): regen shared/types/api.ts |

## Deviations from Plan

**1. [Rule 3 - Blocking] Worktree branch was based on stale tip without `.planning/`**
- **Found during:** session start (the worktree branch `worktree-agent-af1af6376df74c2cf` was created from `b33f641` predating the `.planning/` tree).
- **Fix:** `git merge --ff-only docs/codebase-map` — branch had zero unique commits, so a fast-forward was sufficient. No `git reset --hard` used (CLAUDE.md / destructive_git_prohibition compliant).
- **Files modified:** none (branch advance only).

**2. [Plan AC clarification — not a deviation in execution]** Plan AC said `grep -c "/admin/tags/{tagId}/rules" shared/openapi.yaml ≥ 4`; actual is 3 because the plan body specifies exactly 3 top-level path keys. Plan body spec was followed exactly; AC count was off-by-one. All 5 operations across the 3 path keys are present (verified independently via the operationId grep).

No other deviations — plan body was executed exactly as written. Threats T-01-05 (three-SoT lockstep) and T-01-06 (server-derived author) both satisfied.

## Threat Flags

None. Mitigations T-01-05 and T-01-06 are now in place:
- T-01-05: 5 new parity tests cover every TagRule schema; BE typecheck + Jest GREEN.
- T-01-06: `TagRuleCreate` and `TagRulePatch` zod schemas explicitly omit `created_by`; OpenAPI matches; Plan 04 will read `req.user.id` at INSERT.

## Self-Check: PASSED

- `shared/openapi.yaml` modified, no `/admin/tag-rules` legacy paths remain: VERIFIED
- `shared/contracts/admin/tag.ts` exports 6 new symbols: VERIFIED
- `shared/types/api.ts` regenerated, no `TagRuleInput` references: VERIFIED
- `backend/src/__tests__/admin-contract.test.ts` includes 5 new parity tests: VERIFIED
- Commits `f631c23`, `6d02cb71`, `92eced24` reachable in `git log`: VERIFIED
- BE 598 pass / 5 todo: VERIFIED
- FE+BE typecheck clean: VERIFIED
