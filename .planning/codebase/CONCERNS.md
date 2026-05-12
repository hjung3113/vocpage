# Codebase Concerns

**Analysis Date:** 2026-05-10

> Snapshot taken mid-Wave 3 admin work. Pointers used: `claude-progress.txt` (first 30 lines), `docs/specs/plans/next-session-tasks.md`, `docs/specs/plans/admin-pages-backlog.md`, `docs/specs/plans/flowline-alignment-cues.md`, MEMORY index. There is no `wave-3-admin.md` file under `docs/specs/plans/` (active wave is tracked via `next-session-tasks.md` + `claude-progress.txt`). There is no `followup-bucket.md` either — closed-wave follow-ups are NOT captured in any registry; the canonical `next-session-tasks.md` §"구현 진입 상시 룰" explicitly states "닫힌 wave 의 follow-up 추적용 별도 등록부 없음 (2026-05-10 정리)". This is itself a concern (see §Process Concerns).

---

## Tech Debt

**OIDC authentication — stub only:**
- Issue: Production auth middleware throws unconditionally; only dev/in-memory auth is wired.
- Files: `backend/src/auth/oidcAuth.ts:1-6` (entire file is `throw new Error('OIDC auth not implemented')`).
- Impact: Cannot deploy to production. Blocks the "운영/배포 phase" listed in `docs/specs/plans/next-session-tasks.md`.
- Fix approach: Implement OIDC flow per `requirements.md` auth section; add integration tests; pair with `connect-pg-simple` session store work.

**In-memory session store in production path:**
- Issue: `express-session` is configured with the default `MemoryStore` — fine for dev, leaks memory + breaks horizontal scale in prod. `SESSION_SECRET` defaults to a hard-coded string `'dev-only-secret-change-in-prod'` if env var missing.
- Files: `backend/src/index.ts:46-58`.
- Impact: Crash on prod restart loses sessions; multi-instance deploy fails; missing `SESSION_SECRET` silently downgrades to insecure default.
- Fix approach: Wire `connect-pg-simple` (already named in `next-session-tasks.md` 운영/배포 phase); fail-fast if `SESSION_SECRET` missing in production.

**VOC create file upload — wired in FE, not in BE:**
- Issue: `VocCreateModal` passes `File[]` as 2nd arg to controller, but the upload endpoint isn't connected.
- Files: `frontend/src/features/voc/model/useVocPageController.ts:137` (TODO comment: `TODO(wave-1.6 BE): VocCreateModal now passes File[] as 2nd arg; wire upload endpoint here`).
- Impact: Attachments selected in the create flow are silently dropped.
- Fix approach: BE multipart endpoint + S3-equivalent storage; align with `shared/contracts/voc/` and `shared/openapi.yaml`.

**Admin tag-rules disabled placeholder (PR #262 hotfix):**
- Issue: `/admin/tag-rules` page does not exist; tag-master row exposes a disabled placeholder where a 규칙 선택 UI should live.
- Files: `frontend/src/features/admin/tag-master/ui/TagMasterRow.tsx:80` (comment: `규칙 선택 UI 가 들어올 때까지 disabled placeholder`).
- Impact: Tag-rule operations are inaccessible in UI even though `tag_rules` table + migration 014 exist and PRD §9.4.1 mandates them.
- Fix approach: `admin-pages-backlog.md` §3 proposes integrating into `/admin/tags` rather than building a separate `/admin/tag-rules` page. Requires spec sync (`routing-conventions.md` + `feature-voc.md §9.4.1`) before code.

**Trash hard-delete disabled placeholder (ADR 0005):**
- Issue: 영구삭제 button is rendered but disabled — soft-delete + restore only.
- Files: `frontend/src/features/admin/trash/ui/RestoreDialog.tsx:3`, `frontend/src/features/admin/trash/ui/TrashTable.tsx:4`.
- Impact: No way to actually purge trashed records from UI. Documented in ADR 0005 §3 as NextGen placeholder; not a bug, but an undocumented operational gap (DB rows accumulate forever).
- Fix approach: NextGen wave — implement purge job + audit log integration with `017_user_role_log.sql`.

**Frontend `any`-cast clusters in dashboard widgets:**
- Issue: Multiple `eslint-disable-next-line @typescript-eslint/no-explicit-any` in dashboard widget code, suggesting the widget config / chart-data types are not flowing end-to-end.
- Files: `frontend/src/features/dashboard/widgets/WeeklyTrendWidget.tsx:43,64`, `frontend/src/features/dashboard/ui/DashboardShell.tsx:78`.
- Impact: Refactoring widget data shapes loses type safety; easy to introduce runtime errors.
- Fix approach: Tighten widget data contracts in `shared/contracts/dashboard/` and propagate generics through `WidgetRegistry`/`DashboardShell`.

**VOC review surface `any`-cast cluster:**
- Issue: 3 sibling files all suppress the explicit-any rule for the same domain.
- Files: `frontend/src/features/voc/review/ui/VocReviewPanel.tsx:124`, `frontend/src/features/voc/review/ui/VocReviewDrawer.tsx:121`, `frontend/src/features/voc/review/ui/VocReviewPage.tsx:89`.
- Impact: Review panel data shape isn't typed end-to-end; risk of silent breakage when VOC schema changes.
- Fix approach: Type the review payload in `shared/contracts/voc/` (likely `structured_payload` related) — also intersects with the deferred `/admin/result-review` admin page (`feature-voc.md §9.4.5`).

**`react-hooks/exhaustive-deps` suppressions in interactive surfaces:**
- Issue: Three high-traffic surfaces silence the exhaustive-deps rule, which historically maps to subtle stale-closure bugs.
- Files: `frontend/src/features/dashboard/ui/DashboardSettingsDialog.tsx:100`, `frontend/src/features/voc/create/ui/VocCreateDialog.tsx:93`, `frontend/src/features/voc/list/ui/VocTable.tsx:76`, `frontend/src/pages/notifications/index.tsx:50`.
- Impact: Latent bugs around dialog open/close transitions and notifications polling.
- Fix approach: Each site needs individual review — either extract a `useEffectEvent`-style stable callback or add the missing deps with care.

**Sub-pixel polish backlog (Flowline):**
- Issue: 3 known sub-pixel imperfections in Flowline-aligned shared UI primitives.
- Files: `frontend/src/shared/ui/status-glyph/*` (filled-vs-ring radius 0.75px diff), `frontend/src/features/voc/list/ui/VocRow.tsx` (16px chevron slot empty rows), `frontend/src/shared/ui/icon/*` (UserX 15px asymmetry).
- Impact: Visual polish — does not affect function. Noted in `claude-progress.txt` Flowline status.
- Fix approach: Defer to next visual-alignment wave; gated by §Visual-alignment gate (impeccable:critique ≥8/10 + sign-off + recritique).

---

## Known Bugs

**Migration 023 not applied to operational DB:**
- Symptoms: `dashboard_settings.default_date_range='custom'` round-trip cannot be E2E-verified in operational DB until migration runs; FE allows `custom` selection that may then fail server-side.
- Files: `backend/migrations/023_dashboard_custom_date_range.sql` (committed via PR #312, not yet executed in ops env).
- Trigger: User selects custom range in Dashboard Settings dialog against an un-migrated DB.
- Workaround: Listed as active task in `next-session-tasks.md` — "마이그 023 운영 적용" with rogue-row diagnostic SQL prerequisite.

**Trash table column 8-char ID truncation surfaces raw UUIDs:**
- Symptoms: `system_id` and `menu_id` are rendered as `xxxxxxxx…` slices instead of human-readable master names.
- Files: `frontend/src/features/admin/trash/ui/TrashTableRow.tsx:67-72` (per the deferred admin/dashboard critique skill #3).
- Trigger: Any trash row referencing a system or menu.
- Workaround: None; deferred via `/impeccable:clarify` fix-skill (queued post-Wave 3).

**TagMasterTable doubled title:**
- Symptoms: Title rendered twice in the admin tag master surface.
- Files: `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx:87` (per critique skill #6).
- Trigger: Page load.
- Workaround: None; queued under `/impeccable:polish`.

**MasterSourceRow missing React import:**
- Symptoms: Cosmetic — JSX runtime works without explicit import on modern React, but the file is inconsistent with project convention and may break if a build target is changed.
- Files: `frontend/src/features/admin/masters/ui/MasterSourceRow.tsx:26` (per critique skill #6).
- Trigger: Build config change, or older toolchain.
- Workaround: None; queued under `/impeccable:polish`.

**WeeklyTrendWidget filter-scope badge wrong:**
- Symptoms: Badge mislabels the filter scope.
- Files: `frontend/src/features/dashboard/widgets/WeeklyTrendWidget.tsx` (per critique skill #6).
- Workaround: None; queued under `/impeccable:polish`.

---

## Security Considerations

**Default `SESSION_SECRET` fallback:**
- Risk: If `SESSION_SECRET` env var is missing in any environment, session cookies are signed with a publicly-committed string, enabling session forgery.
- Files: `backend/src/index.ts:48`.
- Current mitigation: `secure: isProduction` cookie flag (set when `NODE_ENV=production`); `httpOnly`; `sameSite: 'strict'`.
- Recommendations: Throw on missing `SESSION_SECRET` when `NODE_ENV !== 'test'`. Add startup assertion + e2e test.

**OIDC auth not implemented — relies on dev auth seam:**
- Risk: Production deployment is currently impossible; if someone wires the existing dev-auth into prod, identity guarantees evaporate.
- Files: `backend/src/auth/oidcAuth.ts:1-6`.
- Current mitigation: `oidcAuthMiddleware` throws — fails closed.
- Recommendations: Implement OIDC before any prod deploy; gate Express boot on `NODE_ENV` matching the auth strategy.

**Tag hard-delete prompts only via `confirm()`:**
- Risk: Single browser-native confirm before deleting a tag master row — no AlertDialog, no double-step.
- Files: `frontend/src/features/admin/tag-master/TagMasterRow.tsx:93` (per critique skill #2 — `/impeccable:harden`).
- Current mitigation: `confirm()` dialog + admin permission gate (ADR 0004).
- Recommendations: Replace with `AlertDialog` (shadcn) requiring explicit type-to-confirm or two-step gesture.

**Admin permission model coverage:**
- Risk: ADR 0004 defines admin permissions; some admin pages are spec-only (`/admin/systems`, `/admin/voc-types`, `/admin/result-review`, `/admin/tag-rules` — see `admin-pages-backlog.md`). Server routes for these may exist partially without UI gating, or vice-versa.
- Files: `backend/src/routes/admin-*.ts`, `frontend/src/pages/admin/*`.
- Current mitigation: ADR 0004 specifies the model; admin-only middleware exists.
- Recommendations: Audit pre-existing admin routes for backend permission checks while implementing missing pages; do not assume FE absence implies BE absence.

**`/admin/result-review` requires concurrency control (not implemented):**
- Risk: Spec (`feature-voc.md §9.4.5`) requires `SELECT FOR UPDATE` + `Idempotency-Key` for concurrent manager approvals. Page does not exist; if implemented naively, double-approval is possible.
- Current mitigation: Page is unimplemented (P3 / NextGen per `admin-pages-backlog.md`).
- Recommendations: Mandate concurrency controls in the wave plan before implementation.

---

## Performance Bottlenecks

**`backend/src/repository/dashboard-phase-c.repo.ts` (914 lines):**
- Problem: Single repository file aggregates dashboard Phase-C queries — likely hot path for dashboard load + heavy SQL.
- Files: `backend/src/repository/dashboard-phase-c.repo.ts`, consumed by `backend/src/services/dashboard/phase-c.service.ts` (420 lines).
- Cause: Multiple aggregate queries per dashboard view; size suggests opportunity to consolidate or push computation into views/materialized views.
- Improvement path: Profile against realistic dataset; consider materialized views for KPI/donut aggregations; add response-time logging.

**Sidebar re-render scope (738 lines):**
- Problem: `frontend/src/shared/ui/sidebar.tsx` is the largest FE file; if it consumes app-wide state directly, every navigation triggers expensive renders.
- Files: `frontend/src/shared/ui/sidebar.tsx`, `frontend/src/widgets/app-shell/Sidebar.tsx` (218 lines).
- Cause: Vendored shadcn primitive — not optimized for VOC's nav structure.
- Improvement path: Memoize per-item rendering; verify `useSidebar` context fan-out.

**Notifications polling in `pages/notifications/index.tsx`:**
- Problem: `react-hooks/exhaustive-deps` suppression at line 50 suggests an interval/effect not stably keyed; could mean over-fetching.
- Files: `frontend/src/pages/notifications/index.tsx:50`.
- Cause: Likely a stale `useEffect` setup with intentional dep omission.
- Improvement path: Audit polling cadence + dependency stability; consider `react-query` `refetchInterval` if not already used.

---

## Fragile Areas

**Visual-alignment surface (Flowline shared primitives):**
- Files: `frontend/src/shared/ui/issue-id/*`, `frontend/src/shared/ui/status-glyph/*`, `frontend/src/shared/ui/list-group-header/*`, `frontend/src/shared/ui/badge/OutlineChip.tsx`, `frontend/src/features/voc/list/ui/VocRow.tsx`.
- Why fragile: Tiny token/style edits cascade into `benchmark/*.png` baseline mismatches; sub-pixel polish backlog already exists; ADR-0008 §Lessons learned mandates a strict gate (impeccable:critique ≥8/10 + sign-off + recritique) before marking `implemented`.
- Safe modification: Bundle related signals into one wave; never change a single Flowline primitive in isolation; refresh `benchmark/` baselines explicitly when changes are intended.
- Test coverage: 691 vitest pass (Wave C-ext); visual diff via `scripts/visual-diff.ts`. No automated visual-diff in CI gate confirmed.

**Dashboard widget registry `any`-clusters:**
- Files: `frontend/src/features/dashboard/widgets/WeeklyTrendWidget.tsx`, `frontend/src/features/dashboard/ui/DashboardShell.tsx`, `frontend/src/features/dashboard/__tests__/useDashboardDraft.test.tsx`, `frontend/src/features/dashboard/__tests__/KpiWidgets.test.tsx`.
- Why fragile: Type-erased boundaries inside the dashboard mean refactors of widget config or props compile cleanly but break at runtime.
- Safe modification: Run `npm run typecheck -w frontend && npm run test -w frontend -- --run` after any edit; manually exercise each widget mode.
- Test coverage: Tests exist but use `any` casts of their own — they assert behavior, not contract.

**VOC review payload pipeline:**
- Files: `frontend/src/features/voc/review/ui/VocReviewPanel.tsx`, `VocReviewDrawer.tsx`, `VocReviewPage.tsx`; intersects with `backend/src/services/voc.ts` (230 lines) and the deferred `/admin/result-review` page.
- Why fragile: `structured_payload` validation gate is unimplemented (NextGen); the FE already operates on partially-typed shapes via `any` casts.
- Safe modification: Avoid changes here until result-review page wave defines payload contract.
- Test coverage: Drawer test (218 lines) exists; payload edge cases probably under-covered.

**Naming-cleanup migration in flight (Cand 1):**
- Files: `frontend/src/entities/{master,user,notification,voc,faq,notice}/api/*`, `frontend/src/features/auth/api/authApi.ts`.
- Why fragile: Active rename initiative — split-PR approach (voc → master → user → notification → faq → notice → auth). Mid-flight imports may diverge from `naming-conventions.md §5.2`.
- Safe modification: Don't introduce new files into `entities/*/api/` without using the target naming (`subject.api.ts` / `subject.query-keys.ts`); coordinate with the active rename PR sequence.

---

## Scaling Limits

**`MemoryStore` session backend:**
- Current capacity: Single Node process.
- Limit: Cannot scale horizontally; sessions evicted on restart.
- Scaling path: `connect-pg-simple` (already in 운영/배포 phase backlog).

**No materialized views for dashboard aggregations:**
- Current capacity: Live SQL aggregation per dashboard request.
- Limit: Will degrade as `vocs` table grows past hundreds of thousands of rows under realistic admin workloads.
- Scaling path: Materialized views or scheduled rollup tables; already a candidate via `requirements.md §13.4` (성능 측정 환경/툴 정의 in 운영/배포 phase).

**Real MSSQL integration deferred (G-1):**
- Current capacity: PostgreSQL-only; external master sources mocked.
- Limit: External masters (`backend/src/services/admin/external-masters.ts`, 303 lines) are read-only and not actually connected to MSSQL.
- Scaling path: Listed in `next-session-tasks.md §외부 의존 / NextGen` as G-1.

---

## Dependencies at Risk

No flagged dependency CVEs or end-of-life packages identified at this snapshot. Notable observations:
- `express-session ^1.18.0` is fine; the risk is the missing store, not the package.
- `connect-pg-simple` is referenced in plans but **not yet a dependency** in `backend/package.json` — must be added.
- `pgvector` integration assumed live (per CLAUDE.md §1) but not exercised by any current admin/dashboard query; embedding pipeline is NextGen-blocked.

---

## Missing Critical Features

**Admin pages spec-only (4 of 8):**
- Problem: 4 admin pages have specs but no UI: `/admin/systems`, `/admin/voc-types`, `/admin/result-review`, `/admin/tag-rules`.
- Files: see `docs/specs/plans/admin-pages-backlog.md` §2.
- Blocks: Operational tag-rule editing, system/menu management, VOC-type management, result-review workflow.

**Production deployment surface:**
- Problem: No `Dockerfile` for production build, no CI pipeline, no E2E tests, no real MSSQL adapter, no deployment smoke test, no Jira migration script.
- Blocks: First production deploy. Fully captured in `next-session-tasks.md §운영/배포 phase`.

**ADR 0007 (timezone) Proposed but locked-in implementation deferred:**
- Problem: Multi-timezone interpretation policy for custom date ranges is in `Proposed` state.
- Files: `docs/adr/0007-custom-date-range-timezone.md:5,19`.
- Blocks: Multi-timezone operational rollout; an explicit hard-block ("다중 timezone 운영 진입 전 별 세션. 잠금 전 다중 TZ 진입 금지").

**S7 Flowline activity-feed visual alignment + sparkline:**
- Problem: Two Flowline signals not yet implemented; gated on real usage materializing.
- Files: `frontend/src/features/voc/review/ui/VocActivityTimeline.tsx`, `ActivityAvatar.tsx`, `VocHistory.tsx` (S7 audit pending); sparkline (no current usage).
- Blocks: Visual-family completeness vs refSystem Flowline.

---

## Test Coverage Gaps

**Custom date range round-trip integration:**
- What's not tested: `dashboard_settings.default_date_range='custom'` E2E from FE dialog → BE persist → reload, against a real (post-migration 023) DB.
- Files: `backend/migrations/023_dashboard_custom_date_range.sql`, `frontend/src/features/dashboard/ui/DashboardSettingsDialog.tsx`, `backend/src/services/dashboard/settings.service.ts`.
- Risk: First production user to pick `custom` may hit a server-side error if migration is missed.
- Priority: High (active task on `next-session-tasks.md`).

**OIDC auth path:**
- What's not tested: `backend/src/auth/oidcAuth.ts` is a 6-line stub; no tests exist for the eventual real implementation.
- Risk: Auth bypass on first prod deploy.
- Priority: High (irreversible surface per CLAUDE.md §3 Reversibility gate).

**Session store under load:**
- What's not tested: Session persistence across process restart; multi-process session sharing.
- Files: `backend/src/index.ts:46-58`.
- Risk: Production session loss on routine deploys.
- Priority: High.

**Visual-diff CI enforcement:**
- What's not tested: Whether `scripts/visual-diff.ts` runs in CI; the 22 baseline PNGs in `benchmark/` may drift silently.
- Files: `scripts/visual-diff.ts`, `benchmark/01-…22-…`.
- Risk: Visual regressions land without anyone noticing until manual `/impeccable:critique` reruns.
- Priority: Medium — partially addressed by ADR-0008 visual-alignment gate but enforcement is still a manual ritual.

**`/admin/result-review` concurrency:**
- What's not tested: `SELECT FOR UPDATE` + `Idempotency-Key` for concurrent manager approval — page itself is unimplemented.
- Risk: Double-approval data corruption if implemented naively in future.
- Priority: Medium (blocked on page existence; document the test plan in the wave).

**FAQ user surface large-file test:**
- What's not tested: The 219-line `FaqPage.user.test.tsx` carries an `eslint-disable max-lines` waiver; if the file grows further, future tests may be skipped to avoid hitting the linter again.
- Files: `frontend/src/pages/faq/__tests__/FaqPage.user.test.tsx:1`.
- Risk: Procedural — splitting the file later may lose mock-block consistency.
- Priority: Low.

**Tag-rules domain:**
- What's not tested: Migration 014 + `tag_rules.suspended_until` pause flow have no UI to exercise; backend route coverage is partial.
- Files: `backend/migrations/014_tag_master_ops.sql`, `backend/src/routes/admin-tags.ts` (209 lines).
- Risk: Backend route changes go uncaught until UI lands.
- Priority: Medium — moves to High when admin-pages-backlog §3 (tag-rule integration) starts.

---

## Contract Drift Risks (openapi ↔ zod ↔ fixtures)

**Single-source claim vs three artifacts:**
- `shared/openapi.yaml` — REST contract reference.
- `shared/contracts/**` — zod schemas (declared single source per CLAUDE.md §1).
- `shared/fixtures/**` — MSW + seed (parity enforced via `scripts/check-fixture-seed-parity.ts`).
- Risk: `check-fixture-seed-parity.ts` only validates `vocs` migration NOT NULL columns vs `voc.fixtures.ts` (per script header). Other entities (`admin-tag`, `admin-trash`, `admin-user`, `admin-masters`, `master`, `notice`, `faq`, `notification`) are **not** parity-checked.
- Files: `scripts/check-fixture-seed-parity.ts:5-18` (scope limited to VOC).
- Mitigation: Extend the parity check to every entity that has a fixture + migration.

**`openapi.yaml` ↔ zod drift:**
- Risk: No automated check verifies that `shared/openapi.yaml` matches `shared/contracts/**` zod schemas. The contract layer is "single source" by convention only.
- Files: `shared/openapi.yaml`, `shared/contracts/*/`.
- Mitigation: Add an OpenAPI generator from zod (e.g., `zod-to-openapi`) or a CI check that diffs shapes.

**Routing convention drift:**
- Risk: `routing-conventions.md` references `/admin/external-masters` while implementation lives at `/admin/masters`; `/admin/notices` and `/admin/faqs` listed in routing convention are absorbed inline (`?mode=admin`) and don't exist as separate pages.
- Files: `docs/specs/requires/routing-conventions.md`, `frontend/src/pages/admin/*`.
- Mitigation: Sync routing-conventions.md with reality (already noted in `admin-pages-backlog.md §2 부수 drift`).

**Spec drift in tag-rules integration:**
- Risk: If `/admin/tag-rules` integrates into `/admin/tags` (per `admin-pages-backlog.md §3` proposal), `routing-conventions.md` and `feature-voc.md §9.4.1` need synchronized updates **before or with** the implementation PR.
- Mitigation: OQ-2 in admin-pages-backlog explicitly mandates spec sync in the same PR.

---

## Deferred Visual-Alignment Items

**Admin/Dashboard critique queue (score 23/40, 6 fix-skills):**
- Status: Deferred 2026-05-10 until Wave 3 merge (see MEMORY `project_admin_dashboard_critique_2026-05-10.md`).
- Branch target: `feat/admin-table-tokens` (or similar) post-merge.
- Order:
  1. `/impeccable:adapt` — migrate `UsersTable`, `TagMasterTable`, `TrashTable`, `MastersTable` from inline `style={{}}` to token classes; verify `--text-muted` / `--bg-subtle` exist; consider lifting dashboard `GridTable` to shared.
  2. `/impeccable:harden` — `AlertDialog` before `onDelete` in `frontend/src/features/admin/tag-master/TagMasterRow.tsx:93`.
  3. `/impeccable:clarify` — replace `system_id.slice(0,8)…` / `menu_id.slice(0,8)…` in `frontend/src/features/admin/trash/ui/TrashTableRow.tsx:67-72` with master-name joins.
  4. `/impeccable:layout` — promote primary KPIs on dashboard; lift section header weight from quaternary.
  5. `/impeccable:distill` — decide `UserRow` 작업 column: ship action or remove (`frontend/src/features/admin/users/ui/UserRow.tsx:103`).
  6. `/impeccable:polish` — doubled title in `TagMasterTable:87`; missing React import in `MasterSourceRow.tsx:26`; WeeklyTrend filter-scope badge.
- Re-run `/impeccable:critique` after to confirm score moves.

**Flowline sub-pixel polish (deferred):**
- 3 items (filled-vs-ring radius 0.75px, 16px chevron empty rows, UserX 15px asymmetry) — see §Tech Debt above.

**S7 + sparkline (Flowline) deferred:**
- Activity-feed visual audit + sparkline component pending real consumer surface.
- Files: `frontend/src/features/voc/review/ui/VocActivityTimeline.tsx`, `ActivityAvatar.tsx`, `VocHistory.tsx`.

**Visual-alignment gate process (MEMORY-tracked):**
- Rule: 시각 정합화 wave is `implemented` only after (1) related signals bundled, (2) `impeccable:critique` sibling ≥ 8/10 + user sign-off, (3) post-fix recritique to detect overcorrect.
- Source: ADR-0008 §Lessons learned + MEMORY `feedback_visual_alignment_gate.md`.
- Risk: A future contributor unaware of this rule may merge a partial visual change as "done."

---

## Process Concerns

**No follow-up registry for closed waves:**
- Issue: `next-session-tasks.md` explicitly states "닫힌 wave 의 follow-up 추적용 별도 등록부 없음 (2026-05-10 정리). 발견 시 ad-hoc 처리하거나 `admin-pages-backlog.md` 같은 주제별 문서로 묶음." There is no `followup-bucket.md` despite CLAUDE.md §1 referencing one (`docs/specs/plans/followup-bucket.md`).
- Impact: CLAUDE.md is stale on this point. Follow-ups discovered after a wave closes have no canonical home; risk is silent loss.
- Files: `CLAUDE.md` §1 (claims a file that doesn't exist), `docs/specs/plans/` (4 files, no follow-up bucket).
- Fix approach: Either reinstate `followup-bucket.md` with `FU-NNN` IDs or update root `CLAUDE.md` §1 to remove the reference.

**`wave-3-admin.md` referenced but absent:**
- Issue: Root `CLAUDE.md` §1 lists `docs/specs/plans/wave-3-admin.md` as a canonical "active wave" doc; the file does not exist. Active Wave 3 status is tracked solely via `claude-progress.txt` + `next-session-tasks.md`.
- Impact: New contributors following CLAUDE.md will look for a missing file.
- Fix approach: Same as above — sync `CLAUDE.md` with reality.

**Visual-diff baseline drift risk:**
- Issue: `benchmark/` PNGs are the source of truth for visual diffs but there's no automated CI gate that re-runs `scripts/visual-diff.ts` per PR.
- Impact: Stale baselines accumulate; visual regressions slip in.
- Fix approach: Wire into CI; or fold into the visual-alignment gate (recritique step).

---

*Concerns audit: 2026-05-10*
