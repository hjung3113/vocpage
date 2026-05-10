---
phase: 01-tag-rules-consolidation
plan: 01
subsystem: build-tooling, backend-test-scaffold, frontend-test-scaffold
tags: [wave-0, scaffolding, tdd-red, parity-tooling]
dependency_graph:
  requires: []
  provides:
    - 01-MATCHER-AUDIT.md (consumer enumeration for Plan 02)
    - shared/fixtures/admin-tag-rule.fixtures.ts (Wave 0 baseline; Plan 02 reshapes)
    - scripts/check-fixture-seed-parity.ts triples (Plan 02 appends mig 024)
    - backend/src/__tests__/migration-024.test.ts (RED → Plan 02 GREEN)
    - frontend/.../optimistic.test.ts (RED → Plan 05 GREEN)
  affects:
    - all Wave 1+ plans depend on Wave 0 scaffolds
tech_stack:
  added: []
  patterns:
    - TARGETS triples for multi-table fixture-seed parity
    - fs.existsSync gate to switch between test.todo and live pg-mem tests
key_files:
  created:
    - .planning/phases/01-tag-rules-consolidation/01-MATCHER-AUDIT.md
    - shared/fixtures/admin-tag-rule.fixtures.ts
    - backend/src/__tests__/migration-024.test.ts
    - frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts
  modified:
    - scripts/check-fixture-seed-parity.ts
decisions:
  - "Audit headcount: 0 production files read tag_rules.pattern (no auto-tag matcher service exists yet); Plan 02 column-rename has no live consumers."
  - "Wave 0 fixture keeps legacy `pattern` column to satisfy mig 014 schema; Plan 02 will reshape to `keywords[]` + `match_mode`."
metrics:
  duration: ~30 min
  completed: 2026-05-10
---

# Phase 01 Plan 01: Wave 0 Scaffolding Summary

Wave 0 scaffolding for the Tag Rules Consolidation phase: failing tests staged, parity script generalized, and `tag_rules.pattern` consumer audit completed.

## Files Created

- `.planning/phases/01-tag-rules-consolidation/01-MATCHER-AUDIT.md` — Plan 02 consumer enumeration.
- `shared/fixtures/admin-tag-rule.fixtures.ts` — 3 rows aligned to mig 014 schema.
- `backend/src/__tests__/migration-024.test.ts` — 5 todos that flip live once `024_*.sql` exists.
- `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` — 4 todos for `useCreateTagRule` D-11 contract.

## Files Modified

- `scripts/check-fixture-seed-parity.ts` — refactored from vocs-only hardcode to TARGETS triples; added ALTER TABLE merge; tag_rules target green.

## Audit Headcount (Plan 02 reconciliation surface)

- **0** production files read `tag_rules.pattern`. No auto-tag matcher service exists in the codebase yet.
- **8** `tag_rules` references in `backend/src/services/admin/tag-master.ts` — none touch `pattern` (count/join/rewire/suspend only).
- **3** BE test files INSERT `pattern` in setup (Plan 02 must update fixtures, not production code):
  - `backend/src/routes/__tests__/admin-tags.sql.test.ts:261`
  - `backend/src/routes/__tests__/admin-trash.sql.test.ts:289`
  - `backend/src/__tests__/migration-014.test.ts:107`
- **1** comment refresh: `backend/src/repository/trash.ts:146` (no code change).

## Verification

| Check | Result |
| --- | --- |
| `npx tsx scripts/check-fixture-seed-parity.ts` | exit 0; vocs 21/25 + tag_rules 9/9 |
| `npm run typecheck -w backend` | clean |
| `npm run typecheck -w frontend` | clean |
| `npm run lint -w frontend` | clean |
| `npm run test -w backend` | **593 passed**, 5 todo (baseline preserved) |
| `npm run test -w frontend -- --run` | **691 passed**, 4 todo, 1 skipped (baseline preserved) |

## Commits

| Task | Hash | Message |
| --- | --- | --- |
| 1.01.1 | `6336d15` | docs(01-01): audit tag_rules.pattern consumers (Wave 0) |
| 1.01.2 | `7089e53` | refactor(01-01): generalize check-fixture-seed-parity to TARGETS triples |
| 1.01.3 | `a38e98b` | test(01-01): stage failing tests for mig 024 + D-11 optimistic (RED) |

## Deviations from Plan

**1. [Rule 3 - Blocking] Worktree branch was based on stale tip without `.planning/`**

- **Found during:** Task 1 (file Write went to main repo not worktree because the worktree branch `worktree-agent-a2beb1b381056efdf` was created from `b33f641` which predates the `.planning/` tree).
- **Fix:** `git merge --ff-only docs/codebase-map` — worktree branch had zero unique commits, so a fast-forward merged the planning files into the worktree without rewriting history. No `git reset --hard` used (CLAUDE.md / destructive_git_prohibition compliant).
- **Files modified:** none (branch advance only).

**2. [Rule 1 - Bug] Initial Write of `01-MATCHER-AUDIT.md` landed in main-repo `.planning/` instead of worktree**

- **Found during:** Task 1 verification.
- **Cause:** absolute-path resolution from prior `pwd` captured before the ff-merge added `.planning/` to the worktree.
- **Fix:** ff-merge above made the file an orphan in main repo; rewrote the file inside the worktree under the same path; deleted the main-repo orphan. Verified worktree-only.

No deviations from plan body — all 3 tasks executed as specified, all acceptance criteria met.

## Surprises / Notes for Plan 02

- **Auto-tag matcher service does not yet exist** in the codebase. Plan 02's `pattern → keywords[]` reconciliation has zero live SELECT consumers. The work is **fixture + contract + migration heavy**, not service-rewrite heavy. The `auto-tag matcher` referenced in spec is an emergent service that Plan 02 (or a later plan) will introduce as a NEW module reading `keywords[] + match_mode`.
- `backend/src/repository/trash.ts:146` comment text mentions `pattern/kind/tag_id`; refresh after mig 024 lands. No SQL change.
- Wave 0 fixture keeps `name`, `pattern`, `sort_order` (mig 004 NOT NULL columns). Plan 02 must drop `name` if mig 024 drops it; current plan only drops `pattern`. Recommend Plan 02 confirm whether `tag_rules.name` remains.

## Threat Flags

None. Plan-level mitigation T-01-01 (parity script generalized + ALTER parsing) is now in place; tag_rules target reconciles 9/9 columns.

## Self-Check: PASSED

- `01-MATCHER-AUDIT.md` exists in worktree: FOUND
- `shared/fixtures/admin-tag-rule.fixtures.ts` exists: FOUND
- `backend/src/__tests__/migration-024.test.ts` exists: FOUND
- `frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts` exists: FOUND
- Commits `6336d15`, `7089e53`, `a38e98b` reachable in `git log`: FOUND
- Parity script exits 0: PASS
- BE 593 pass / FE 691 pass baselines: PRESERVED
