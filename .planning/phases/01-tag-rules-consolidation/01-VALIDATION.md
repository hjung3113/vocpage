---
phase: 1
slug: tag-rules-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.5.x (FE) · Jest 29.7.x + Supertest 6.3.x (BE) |
| **Config file** | `frontend/vitest.config.ts`, `backend/jest.config.ts` |
| **Quick run command** | `npm run test -w frontend -- --run --changed \| tail -20` (FE) · `npm run test -w backend -- --listTests --findRelatedTests <files> \| tail -20` (BE) |
| **Full suite command** | `npm run typecheck -w frontend && npm run test -w frontend -- --run \| tail -20` (FE) · `npm run typecheck -w backend && npm run test -w backend \| tail -20` (BE) |
| **Estimated runtime** | FE ~25s · BE ~40s · combined parallel ~45s |

Baselines (must preserve): BE 593+ Jest passes · FE 691+ Vitest passes (per STATE.md).

---

## Sampling Rate

- **After every task commit:** Run scoped quick run for the touched workspace.
- **After every plan wave:** Run full suite command for both workspaces in parallel (root §Engineering Rules).
- **Before `/gsd-verify-work`:** Full suite must be green and `npm run lint -w frontend` once.
- **Max feedback latency:** 60 seconds.

---

## Per-Task Verification Map

To be populated by the planner — one row per task referencing requirement REQ-admin-pages-wave (Phase A) and any threat IDs surfaced by `/gsd-secure-phase` for the route consolidation.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | REQ-admin-pages-wave | — | Migration 024 forward+rollback green on pg-mem | integration | `npm run test -w backend -- migration-024 \| tail -20` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `backend/src/repository/__tests__/migration-024.test.ts` — pg-mem forward+rollback for `mig 024` (`keywords text[]` + `match_mode text` add, `pattern` drop, `created_by uuid NULL` add). Mirrors `migration-014.test.ts`.
- [ ] `frontend/src/features/admin-tag-rules-modal/__tests__/optimistic.test.ts` — TanStack v5 onMutate/onError/onSettled rollback contract for D-11.
- [ ] `scripts/check-fixture-seed-parity.ts` — generalize from hardcoded `vocs` to `(table, migration, fixture, sampleKey)` triples + ALTER-TABLE DDL parsing. Add `tag_rules` triple after migration 024.
- [ ] `shared/fixtures/tag-rule.fixtures.ts` + `backend/src/seeds/admin-tag.fixtures.ts` — parity-enforced fixtures for `tag_rules` rows with `keywords[]` + `match_mode` + `created_by`.
- [ ] `backend/src/services/auto-tag.*` consumers — Wave 0 discovery task: `rg -n "tag_rules" backend/src/services/` enumerate readers of dropped `pattern` column and reconcile to `keywords[]`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/admin/tags` row badge `규칙 N건` increments to N+1 visually after Dialog "추가" | Success #2 | Visual + animation perception (Framer Motion fade-in) | Open `/admin/tags`, click `규칙 N건`, click `규칙 추가`, fill keywords + match_mode, save → verify row badge updates without full-page refresh and Dialog stays open with new row appended. |
| `/admin/tags` 상단 `전체 규칙 보기` 토글 → 키워드 검색 결과가 모든 태그를 가로질러 매칭 | Success #4 | Cross-tag interactive search, hard to assert as a unit test alone (visual hierarchy + count) | Toggle on, type keyword present in two different tags' rules, expect rows from both tags. |
| `/admin/tag-rules` URL 직접 입력 시 404 또는 `/admin/tags` 리다이렉트 (라우트 제거 검증) | Success #3 | Browser navigation behavior | Open `/admin/tag-rules` directly → confirm not reachable; `rg -n "/admin/tag-rules" frontend backend shared docs/specs` ⇒ 0 hits (ADRs excluded). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (mig-024 test, optimistic test, parity script generalization, fixtures, matcher reconcile)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
