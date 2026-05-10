# REQUIREMENTS — vocpage (Wave 4 + Visual Identity milestone)

Synthesized from 4 PRDs in `docs/specs/requires/` + `docs/specs/plans/admin-pages-wave.md`. Plus a milestone-specific design-identity requirement derived from PROJECT.md success metric §3.

## v1 Scope (current milestone)

### REQ-voc-system — VOC system master
- source: `docs/specs/requires/requirements.md`
- v1 surface for this milestone: existing VOC core (issue code, status / review_status state machines, permissions, voc_history, embedding) is **already implemented**; this milestone enforces it as a constraint, not as new build.
- Acceptance: existing BE 593+ Jest / FE 691+ Vitest baseline preserved across all phases; permission model per ADR-0004; trash policy per ADR-0005.
- Cross-ref: ADR-0004, ADR-0005.

### REQ-voc-dashboard — Dashboard
- source: `docs/specs/requires/dashboard.md` (LOCKED via ADR-0006)
- v1 surface: dashboard `default_date_range='custom'` persistence end-to-end (mig 023 → API → DialogUI → cron) — round-trip integration validated on production DB.
- Acceptance:
  - Migration 023 applied to operational DB.
  - `custom_start_date` / `custom_end_date` round-trip from `DashboardSettingsDialog` to `dashboard_settings` and back.
  - Cron aggregation honors persisted custom range (timezone semantics per ADR-0007 once Accepted).
- Cross-ref: ADR-0006 (LOCKED), ADR-0007 (Proposed — gate).

### REQ-notice-faq — Notice & FAQ
- source: `docs/specs/requires/feature-notice-faq.md` (2026-04-21)
- v1 surface: already shipped in earlier waves; included here for traceability completeness, no new phase work in this milestone.
- Acceptance: per source — sidebar nav + count badges + login popup + admin permissions remain functional through Wave 4.
- Cross-ref: REQ-voc-system.

### REQ-admin-pages-wave — Admin Wave 4 pages
- source: `docs/specs/plans/admin-pages-wave.md` (Draft, 2026-05-10)
- v1 surface: 4 admin pages — tag rules consolidation into `/admin/tags`, `/admin/voc-types`, `/admin/systems`, `/admin/result-review` — across phases A / B / C / D.
- Acceptance: per per-phase Done-when blocks in source. Gated by ADR-0004 (permissions) and ADR-0005 (trash).
- Cross-ref: ADR-0004, ADR-0005, `feature-voc.md §9.4.1–§9.4.7`, `routing-conventions.md`, `shared/openapi.yaml` (existing contracts).

### REQ-design-identity — Visual identity vs. Flowline
- source: PROJECT.md milestone metric §3 + `docs/specs/plans/flowline-alignment-cues.md` + `docs/specs/requires/uidesign.md §16`
- v1 surface: vocpage's `/voc` and admin surfaces are recognizably the same design family as `refSystem/Integrated Platform _ Standalone.html`. Remaining Flowline signals (S7 activity feed + sub-pixel polish) closed.
- Acceptance:
  - `uidesign.md §16` Flowline primitives spec'd and adopted (issue-id, status-glyph, etc.).
  - Visual baselines (`prototype/screenshots/`, `scripts/visual-diff.ts`) updated per primitive.
  - ADR-0008 Accepted; "묶음 도입 + impeccable:critique ≥8/10 + 사용자 sign-off + recritique" gate satisfied per primitive bundle.
- Cross-ref: ADR-0008 (Proposed — gate), `flowline-alignment-cues.md`, `uidesign.md §16`.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-admin-pages-wave (Phase A — tag rules) | Phase 1 | Pending |
| REQ-admin-pages-wave (Phase B — voc-types) | Phase 2 | Pending |
| REQ-admin-pages-wave (Phase C — systems/menus) | Phase 3 | Pending |
| REQ-voc-dashboard | Phase 4 | Pending (gated by ADR-0007) |
| REQ-design-identity | Phase 5 | Pending (gated by ADR-0008) |
| REQ-admin-pages-wave (Phase D — result-review) | Phase 6 | Deferred sub-wave (4 entry conditions) |
| REQ-voc-system (operational deploy: OIDC + MSSQL + Prod build + E2E) | Phase 7 | Deferred / NextGen |
| REQ-voc-system (constraint authority — preserved across all phases) | Phases 1–7 | Constraint |
| REQ-notice-faq | — | Already shipped (no new phase work) |

## Out of Scope (v2 / NextGen)

- 태그 규칙 다중 태그 일괄 import.
- 색상 자유 입력 (HEX picker) for `voc_types`; `voc_types` merge.
- `tag_rules.updated_by` / `last_modified_by` audit.
- 결과 검토 sub-wave full execution (entry-conditions only here).
- 운영 OIDC, 실 MSSQL 연결, Production build, full E2E suite.
