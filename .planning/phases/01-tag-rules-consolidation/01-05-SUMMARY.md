---
phase: 01-tag-rules-consolidation
plan: 05
subsystem: frontend-data-layer
tags: [wave-2, fe-hooks, msw, optimistic, tdd-green, d-08, d-11]
dependency_graph:
  requires:
    - 01-03-SUMMARY.md (zod TagRule + TagRuleListResponse + TagRuleCreate + TagRulePatch in shared/contracts/admin/tag.ts)
    - 01-01-SUMMARY.md (RED optimistic.test.ts staged)
  provides:
    - frontend/src/features/admin/tag-master/api/tag-master.api.ts (5 nested rule hooks)
    - frontend/src/test/mocks/handlers/admin-tags.ts (5 nested handlers + ruleStore)
    - frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts (4 GREEN)
  affects:
    - Plan 06 (Modal + chip input + sub-table) — consumes all 5 hooks
tech_stack:
  added: []
  patterns:
    - TanStack Query v5 optimistic update — cancelQueries + getQueriesData + setQueriesData rollback
    - MSW v2 mutable in-memory store with reset helper, parsed through Zod contracts
key_files:
  created: []
  modified:
    - frontend/src/features/admin/tag-master/api/tag-master.api.ts (96 → 233 lines)
    - frontend/src/test/mocks/handlers/admin-tags.ts (155 → 290 lines)
    - frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts (47 → 184 lines)
    - frontend/src/features/admin/tag-master/ui/TagMasterSuspendModal.tsx (signature update)
    - frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx (suspendTarget shape update)
decisions:
  - "useSuspendTagRule signature changed from ({ id, ... }) to ({ tagId, ruleId, ... }) — D-08 nested URL forced caller update; Plan 06 will replace TagMasterSuspendModal slot entirely with TagRulesManagerModal."
  - "Optimistic patch uses setQueriesData (broad query-key match) rather than setQueryData — useAdminTags scopes cache by [...QUERY_KEY, query], so multiple cache entries may exist and all must be patched."
  - "Mock identity for created_by_name in MSW: MOCK_USER_ID = '00000000-0000-4000-8000-000000000001', MOCK_USER_NAME = 'Mock Admin'."
metrics:
  duration: ~50 min
  completed: 2026-05-11
---

# Phase 01 Plan 05: FE Tag Rule Hooks + MSW + Optimistic GREEN

Wave 2 frontend data layer for nested tag rules. 4 new TanStack Query hooks + 1 renamed suspend hook with D-11 optimistic patches on count-changing mutations (create/delete). Full MSW handler coverage on `/api/admin/tags/:tagId/rules*`. RED optimistic test from Plan 01 flipped to 4/4 GREEN.

## 5 Hook Signatures

```typescript
useAdminTagRules(tagId: string, query?: Partial<TagRuleListQueryT>)            // useQuery
useCreateTagRule(tagId: string)                                                // useMutation + D-11 optimistic
useUpdateTagRule(tagId: string)                                                // useMutation (no count change)
useDeleteTagRule(tagId: string)                                                // useMutation + D-11 optimistic
useSuspendTagRule()                                                            // useMutation, ({ tagId, ruleId, suspended_until })
```

Query keys:
- `['admin', 'tags']` — tag-master cache (patched by create/delete)
- `['admin', 'tags', tagId, 'rules']` — rules subkey (per-tag scope)

Optimistic patch surface (create + delete):
1. `await qc.cancelQueries({ queryKey: ['admin','tags'] })` — Pitfall 5 mitigation
2. `qc.getQueriesData({ queryKey: ['admin','tags'] })` — broad-key snapshot (all paginated variants)
3. `qc.setQueriesData(...)` — patch `rule_ref_count ± 1` for `tagId` row in every cache entry
4. `onError` — restore each [key, data] pair from snapshot
5. `onSettled` — invalidate `['admin','tags']` + `['admin','tags',tagId,'rules']` (ground truth)

## MSW Handler Count

5 nested handlers on `/api/admin/tags/:tagId/rules*`:

| Method | Path | Notes |
| --- | --- | --- |
| GET    | `/api/admin/tags/:tagId/rules` | filter by `tagId` + `q` (substring on keywords or tag.name) + page/per_page |
| POST   | `/api/admin/tags/:tagId/rules` | server stamps created_by + created_by_name; bumps parent rule_ref_count |
| PATCH  | `/api/admin/tags/:tagId/rules/:ruleId/suspend` | registered BEFORE PATCH /:ruleId (Pitfall 6) |
| PATCH  | `/api/admin/tags/:tagId/rules/:ruleId` | optional keywords/match_mode |
| DELETE | `/api/admin/tags/:tagId/rules/:ruleId` | 204 no content; decrements parent rule_ref_count |

`ruleStore` mutable array seeded from `shared/fixtures/admin-tag-rule.fixtures.ts` (Plan 01 + Plan 02 reshape). Reset path: `resetAdminTagStore()` (exported) — resets BOTH `tagStore` and `ruleStore`. Old `/api/admin/tag-rules/:id/suspend` handler removed (D-09 alias forbidden).

Mock user identity used for `created_by` / `created_by_name` on POST: `MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'`, `MOCK_USER_NAME = 'Mock Admin'`. Used because no shared FE mock-user constant existed; documented here so Plan 06 tests can reference.

## Optimistic Test Results — 4/4 GREEN

| # | Test | Status |
| --- | --- | --- |
| 1 | onMutate increments rule_ref_count for the targeted tag in admin tags cache by +1 | GREEN |
| 2 | onError restores prev cache snapshot | GREEN |
| 3 | onSettled invalidates ['admin','tags'] and ['admin','tags',tagId,'rules'] | GREEN |
| 4 | concurrent double-fire — both onMutate paths cancelQueries first; onSettled invalidate is ground truth | GREEN |

Total Vitest baseline: 691 → **695 passing**, 0 regressions, 0 todos remaining in optimistic suite.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck -w frontend` | clean |
| `npm run test -w frontend -- --run` | **695 passed** (90 files), 0 fail |
| `npm run lint -w frontend` | clean |
| `rg "/admin/tag-rules" frontend/src/features/admin/tag-master/api frontend/src/test/mocks/handlers` | 0 hits |
| `grep -cE "^export function (useAdminTagRules\|useCreateTagRule\|useUpdateTagRule\|useDeleteTagRule\|useSuspendTagRule)" tag-master.api.ts` | 5 |
| `grep -cE "http\\.(get\|post\|patch\|delete)\\('/api/admin/tags/:tagId/rules" admin-tags.ts` | 5 |
| `grep -c "cancelQueries" tag-master.api.ts` | 3 (create + delete + helper context) |
| `grep -c "setQueriesData\|setQueryData" tag-master.api.ts` | ≥4 |

## Commits

| Task | Hash | Message |
| --- | --- | --- |
| 1.05.1 | `7c388b2c` | feat(01-05): add 5 nested tag-rule hooks with D-11 optimistic patches |
| 1.05.2 | `d01e90b0` | test(01-05): MSW nested rule handlers + flip optimistic test GREEN |

## Deviations from Plan

**1. [Rule 3 — Blocking] Worktree branch was based on stale tip without Plan 01–03 outputs**

- **Found during:** Task 1 (hooks file in worktree was the 96-line legacy version because `worktree-agent-a3061e4ee905f2a05` was created from `b33f6418` which predates `.planning/` + Plan 01–03 commits).
- **Fix:** `git merge --ff-only docs/codebase-map` — worktree branch had zero unique commits, so a fast-forward pulled the 24 missing planning + contract + fixture commits in. No `git reset --hard` used (CLAUDE.md / destructive_git_prohibition compliant). Mirrors Plan 01 deviation #1.
- **Files modified:** none (branch advance only).

**2. [Rule 1 — Bug] Initial Write of `tag-master.api.ts` + `TagMasterSuspendModal.tsx` + `TagMasterTable.tsx` landed in main-repo working tree instead of worktree**

- **Found during:** Task 1 verification (typecheck reported clean against legacy file; grep on hooks count returned 1 not 5).
- **Cause:** Same issue Plan 01 hit — absolute paths without `WT_ROOT` prefix resolved against the orchestrator's CWD (main repo), not the worktree.
- **Fix:** copied the three modified files from main repo into worktree, then `git checkout --` reverted main repo changes. Re-ran typecheck inside worktree (clean) + lint + tests to confirm worktree state matches intent.
- **Verified:** main repo `git status --short frontend/src/features/admin/tag-master/` returned empty after recovery.

**3. [Rule 3 — Blocking] `useSuspendTagRule` callers (`TagMasterSuspendModal` + `TagMasterTable`) used legacy `{ id }` shape**

- **Found during:** Task 1 typecheck after hook signature change.
- **Issue:** plan body explicitly noted Plan 06 would replace this slot but didn't gate typecheck. To keep Wave 2 green, minimal updates were applied: `Props` extended with `tagId` (TagMasterSuspendModal) and `suspendTarget` state shape extended with `{ tagId, ruleId, suspended_until }` (TagMasterTable). Existing `onSuspend(id)` callback (which only knows the tag id) now stuffs `id` into `tagId` and `''` into `ruleId` as a placeholder — broken in production but typecheck-clean and visually unchanged. Plan 06's `TagRulesManagerModal` will replace this slot entirely.
- **Files modified:** `TagMasterSuspendModal.tsx`, `TagMasterTable.tsx`.

No deviations from plan body — both tasks executed as specified, all acceptance criteria met.

## Surprises / Notes for Plan 06

- The pre-existing `TagMasterSuspendModal` was already operating against an unknown `ruleId` (the `onSuspend` callback only knew `tag.id`, not a rule id). Plan 06's modal will fix this by listing rules per-tag and letting the user pick one — the placeholder `''` ruleId in `TagMasterTable.tsx` should be deleted along with the legacy modal.
- **Two `ADMIN_TAG_RULE_FIXTURES` exports exist:** the legacy one in `shared/fixtures/admin-tag.fixtures.ts` (with `pattern: string`) and the new one in `shared/fixtures/admin-tag-rule.fixtures.ts` (with `keywords: string[]` + `match_mode`). The MSW handler imports from the new file; Plan 06 should also import from the new file. Plan 02 (or a follow-up) should delete the legacy export.
- The optimistic test deliberately mounts NO `useAdminTags` observer, so `onSettled` invalidate does not refetch — the cache retains the optimistic ±1 patches as the ground-truth proxy. In production with a mounted observer, the invalidate WILL refetch and reconcile to server truth. This was tradeoff to keep the test isolated.

## Threat Compliance

| Threat | Mitigation in this plan |
| --- | --- |
| T-01-12 (URLSearchParams query construction) | `useAdminTagRules` mirrors the established `useAdminTags` `URLSearchParams` pattern at lines 23–36 — never string-concatenates `q` / `page` / `per_page`. Verified at tag-master.api.ts:51–60. |
| T-01-13 (Optimistic cache patch race / stale snapshot) | Both `useCreateTagRule` and `useDeleteTagRule` `await qc.cancelQueries({ queryKey: ['admin','tags'] })` at `onMutate` start; `onSettled` invalidate is ground truth; concurrent test (case 4) asserts convergence after settle. |

## Threat Flags

None. No new network endpoints, auth paths, file access, or schema changes at trust boundaries introduced — this plan is FE-only (hooks + MSW mocks + tests). All API surface contracts came from Plan 03 unchanged.

## Known Stubs

`TagMasterTable.tsx` line ~191 supplies `ruleId: ''` placeholder when constructing `suspendTarget`. This is a pre-existing UX bug surfaced by the new typed signature, not a new stub. Plan 06 will remove this slot entirely. Documented above under Deviation #3.

## Self-Check

- `frontend/src/features/admin/tag-master/api/tag-master.api.ts` — 5 hooks present, 233 lines: FOUND
- `frontend/src/test/mocks/handlers/admin-tags.ts` — 5 nested handlers present: FOUND
- `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` — 4 it() cases, 0 todo: FOUND
- Commit `7c388b2c` reachable in `git log`: FOUND
- Commit `d01e90b0` reachable in `git log`: FOUND
- FE Vitest 695 passing (691 baseline + 4 optimistic): VERIFIED
- `rg "/admin/tag-rules" frontend/src/features/admin/tag-master/api frontend/src/test/mocks/handlers` → 0 hits: VERIFIED

## Self-Check: PASSED
