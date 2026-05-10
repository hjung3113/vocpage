# PROJECT — vocpage

## One-liner

VOC (Voice of Customer) management system — internal tool for tracking customer voice across systems with admin / dashboard / notice / faq surfaces.

## Tech Runtime

- Frontend: React SPA (Vite), TanStack Query, RHF + Zod, MSW, Vitest + Playwright.
- Backend: Express REST, Jest + Supertest.
- Database: PostgreSQL with `pgvector` (embeddings).
- Orchestration: Docker Compose (FE + BE + DB).
- Monorepo: `frontend/` + `backend/` + `shared/` (types, contracts, fixtures, openapi).
- Locale: Korean-language UI and specs.

## Current Milestone (M)

**Wave 4 admin + visual identity.** Success metric:

1. Wave 4 admin 미구현 페이지 4개 출시 (per `docs/specs/plans/admin-pages-wave.md`):
   태그 규칙 통합 → 유형 → 시스템/메뉴 → 결과 검토 (sub-wave).
2. 운영 DB 마이그 023 적용 완료 (PR #312 후속) + Dashboard `custom` round-trip 통합 검증.
3. 디자인 완성도 — `refSystem/Integrated Platform _ Standalone.html` 과 동일 패밀리로 인식되는 정도. Flowline 정합화 잔여 시그널 (S7 활동 피드 + sub-pixel polish) 마무리. ADR-0008 의 "묶음 도입 + impeccable:critique ≥8/10 + 사용자 sign-off + recritique" 게이트 적용.

## Decisions

<decisions>

### ADR-0004 — Admin pages permission model — LOCKED
- source: `docs/adr/0004-admin-permission-model.md`
- Per-screen mutate/read permissions for Wave 3+ admin pages (Tag Master, Trash, External Masters, Users) across admin / manager / dev / user roles. BE route guards + FE sidebar guards enforce.
- Binding for: REQ-admin-pages-wave (all phases), REQ-voc-system permission surfaces.

### ADR-0005 — Trash restore policy — LOCKED
- source: `docs/adr/0005-trash-restore-policy.md`
- Indefinite retention; Admin-only restore; hard-delete disabled in MVP; sub-task individual restore allowed; cascade on parent restore; `voc_restore_log` audit; `vocs.deleted_by` tracks deletion actor; tag_rules re-run on restore. Migration 015.
- Binding for: Trash UI, VOC soft-delete, REQ-voc-system.

### ADR-0006 — Dashboard `default_date_range='custom'` persistence — LOCKED
- source: `docs/adr/0006-custom-date-range-default.md`
- Schema, CHECK constraints, zod, API, and UI semantics for persisting custom default date range in `dashboard_settings`. Migration 023.
- Binding for: REQ-voc-dashboard, Phase 4 (mig 023 운영 적용).

### ADR-0007 — Dashboard custom date range timezone semantics — Proposed
- source: `docs/adr/0007-custom-date-range-timezone.md`
- Proposed timezone interpretation for `custom_start_date` / `custom_end_date` and cron aggregation day boundary.
- **Gate:** Phase 4 (Dashboard custom round-trip) cannot close until ADR-0007 is Accepted by user.

### ADR-0008 — Flowline design alignment — Proposed
- source: `docs/adr/0008-flowline-design-alignment.md`
- Proposed visual alignment of vocpage with Flowline reference module via 5 new shared UI primitives spec'd in `uidesign.md §16`.
- **Gate:** Phase 5 (Flowline 정합화 잔여) cannot start until ADR-0008 is Accepted with the "묶음 도입 + impeccable:critique ≥8/10 + 사용자 sign-off + recritique" entry pattern.

### ADR-0001 / 0002 / 0003 — Implicit (non-locked)
- ADR-0001: `inferActions` field→action mapping owned by service layer.
- ADR-0002: VOC list `has_children` / `notes_count` via SQL aggregates.
- ADR-0003: `backend/src/validators/` retained as documented seam.
- Treated as advisory; no Status header in source.

</decisions>

## Constraint Authority

- VOC core: `docs/specs/requires/feature-voc.md` (status state machine, review_status, permissions, voc_history, embedding).
- External integrations: `docs/specs/requires/external-masters.md`.
- Frontend conventions (10): api · datetime · env · error-loading · form · naming · routing · state-management · table-filter · test (`docs/specs/requires/*-conventions.md`).
- Design system: `docs/specs/requires/uidesign.md` (OKLCH tokens, light/dark, §16 Flowline primitives).

## Out of Scope (NextGen)

- 운영 OIDC + 실 MSSQL + Production build + E2E (Phase 7 deferred).
- 태그 규칙 다중 태그 일괄 import.
- `voc_types` 색상 자유 입력 (HEX picker), `voc_types` merge.
- `tag_rules.updated_by` / `last_modified_by` audit.
- 결과 검토 sub-wave (Phase D) — listed under Phase 6, gated by 4 entry conditions.
