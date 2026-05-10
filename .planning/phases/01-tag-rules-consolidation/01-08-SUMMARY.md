---
phase: 01-tag-rules-consolidation
plan: 08
subsystem: spec-sync
tags: [spec, docs, routing, sc-3-gate, phase-close]
dependency_graph:
  requires:
    - 01-04-SUMMARY  # nested BE routes (5 endpoints + D-13 matrix + IDOR)
    - 01-07-SUMMARY  # FE page wiring (TagRulesManagerModal + view-mode tabs + ?view/?q)
  provides:
    - feature-voc.md §9.4.1 single source of truth (consolidation)
    - routing-conventions.md /admin/tags ?view/?q convention
    - SC-3 grep gate evidence (Phase 1 ROADMAP close)
  affects:
    - shared/openapi.yaml (cross-reference target — not edited here, already nested)
tech-stack:
  added: []
  patterns:
    - spec-sync at phase close (D-10 boundary: ADR / .planning / git-history excluded)
key-files:
  created:
    - .planning/phases/01-tag-rules-consolidation/01-08-SC3-EVIDENCE.md
    - .planning/phases/01-tag-rules-consolidation/01-08-SUMMARY.md
  modified:
    - docs/specs/requires/feature-voc.md
    - docs/specs/requires/routing-conventions.md
decisions:
  - "feature-voc.md §9.4.1 rewritten as as-built consolidation (modal row-action + view-mode tabs + nested REST + keywords[]+match_mode+created_by_name + D-11 optimistic + D-13 perms + ADR-0005 carry)."
  - "routing-conventions.md drops the legacy admin route entry; new §10.4.1 documents /admin/tags ?view=tags|rules + ?q= URL convention."
  - "SC-3 grep gate now returns 0 hits (excl. ADR / .planning / graphify-out / node_modules / .git) per D-10 policy boundary."
metrics:
  duration_minutes: 12
  completed_date: "2026-05-11"
  tasks: 2
  files_changed: 2
  files_created: 2
  be_tests: "625 pass (baseline 593, +32)"
  fe_tests: "721 pass (baseline 691, +30)"
---

# Phase 1 Plan 08: Spec Sync Summary

**One-liner.** Rewrote `feature-voc.md §9.4.1` to describe the as-built consolidated `/admin/tags` experience and removed the legacy `/admin/tag-rules` entry from `routing-conventions.md`; SC-3 final grep gate proves 0 residual references in live spec / code surface.

## What landed

### `docs/specs/requires/feature-voc.md` §9.4.1

Replaced the 3-bullet placeholder section with a structured as-built specification covering:

- **Edit surface**: row-badge `규칙 N건` → `TagRulesManagerModal` Dialog (header + add form + sub-table with `키워드 목록 | 매칭 방식 | 일시중지 상태 | 작성자 | 작업`).
- **View-mode tabs**: page-level `태그` / `전체 규칙` tabs; `?view=tags|rules` (default `tags`) + `?q=<text>` URL state, single source of truth.
- **Form / validation**: chip array UX for `keywords` (Enter / 쉼표 / x); `match_mode` select rendered with `keyword` only; `created_by` server-derived, `created_by_name` LEFT JOIN of `users.display_name`; pre-existing NULL → `—`.
- **REST API (nested)**: 5 endpoints under `/api/admin/tags/{tagId}/rules[/{ruleId}][/suspend]`; legacy single-resource paths removed without alias.
- **Schema (mig 024)**: `keywords text[] NOT NULL DEFAULT '{}'`, `match_mode text NOT NULL DEFAULT 'keyword'`, `created_by uuid NULL REFERENCES users(id)`; `pattern text` dropped.
- **Permissions (D-13)**: GET = Admin / Manager / Dev; POST + PATCH(edit) = Manager+; DELETE + PATCH(suspend) = Admin only.
- **Optimistic update (D-11)**: `onMutate` ±1 on `rule_ref_count`, `onError` rollback, `onSettled` invalidate; race = last-write-wins.
- **Trash restore idempotency**: ADR-0005 / §9.4.7 carry, only call-site identifiers updated for nested form.

### `docs/specs/requires/routing-conventions.md`

- `§10.1 라우트 목록` — dropped the `/admin/tag-rules` entry; relabeled `/admin/tags` as `태그 마스터 + 태그 규칙 통합 관리`.
- New `§10.4.1 Admin 페이지 URL 컨벤션` — documents `/admin/tags?view=tags|rules&q=<text>` deep-link contract; cross-references `§10.4` general rules.

### `.planning/phases/01-tag-rules-consolidation/01-08-SC3-EVIDENCE.md`

Records the final grep command + 0-hit result, BE/FE test pass counts, parity + lint passes, and the SC-1..5 → verification map for Phase 1 close.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocker] Worktree baseline drift**

- **Found during:** initial verification of Task 1 edits.
- **Issue:** The agent worktree was forked from an older commit (`b33f6418`) that pre-dates plans 01-01..01-07 merging into `docs/codebase-map`. Without correction, `.planning/` was absent and `/admin/tag-rules` references existed across `shared/openapi.yaml`, `shared/types/api.ts`, `shared/contracts/admin/tag.ts`, `backend/src/routes/admin-tags.ts` + tests, and `frontend` MSW + api hooks — making the SC-3 gate fail through no fault of plan 01-08.
- **Fix:** `git fetch /Users/hyojung/Desktop/2026/vocpage docs/codebase-map && git reset --hard 10134705` to align worktree HEAD with the post-01-07 state recorded in main. Pre-commit head safety + branch-namespace assertions (#2924) re-validated post-reset.
- **Result:** Post-reset SC-3 baseline reduced from 23 hits to 1 hit (`routing-conventions.md:20`), matching the plan's documented prereq.

**2. [Rule 1 — Bug] Wording self-conflict in §9.4.1 draft**

- **Found during:** dry-run of the SC-3 grep against the new section.
- **Issue:** Initial §9.4.1 draft mentioned `/admin/tag-rules` literally to point out that it had been removed — which itself triggered the SC-3 grep gate and produced self-defeating hits.
- **Fix:** Rephrased to `구 단독 규칙 경로` (legacy single-resource path) without literal mention. Same semantic content; SC-3 now clean.

### Auth Gates

None.

## Verification Snapshot

| Check | Result |
| --- | --- |
| `rg "/admin/tag-rules"` (excl. .planning / docs/adr / graphify-out / node_modules / .git) | **0 hits** |
| `npm run typecheck -w backend` | PASS |
| `npm run test -w backend` | PASS — **625 / 625** |
| `npm run typecheck -w frontend` | PASS |
| `npm run test -w frontend -- --run` | PASS — **721 / 721** |
| `scripts/check-fixture-seed-parity.ts` | PASS — `[parity:vocs]`, `[parity:tag_rules] 10/11` |
| `npm run lint -w frontend` | PASS |

## Phase 1 ROADMAP Close

All 5 success criteria are satisfied; see `01-08-SC3-EVIDENCE.md` for the per-SC verification map.

- SC-1, SC-2, SC-4 — verified by tests delivered in plans 01-06 / 01-07.
- SC-3 — verified by this commit (live grep returns 0).
- SC-5 — spec + openapi + nested code paths aligned in the same worktree branch.

## Self-Check: PASSED

- Files created exist: `.planning/phases/01-tag-rules-consolidation/01-08-SC3-EVIDENCE.md`, `.planning/phases/01-tag-rules-consolidation/01-08-SUMMARY.md`.
- Commit `5a0a41d1` present in worktree-agent branch (`docs(01-08): rewrite §9.4.1 + drop legacy admin route entry`).
- SC-3 gate independently re-run: 0 hits.
