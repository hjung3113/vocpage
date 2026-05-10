# Decisions (ADRs)

Synthesized from 8 ADRs in `docs/adr/`. Three decisions are explicitly LOCKED (Accepted with locked=true). One is Proposed. Four lack explicit Status fields and are recorded as non-locked.

---

## LOCKED Decisions (cannot be auto-overridden)

### ADR-0004 — Admin pages permission model
- source: `docs/adr/0004-admin-permission-model.md`
- status: Accepted, LOCKED
- decision: Per-screen mutate/read permissions for Wave 3 admin pages (Tag Master, Trash, External Masters, Users) across admin/manager/dev/user roles. BE route guards + FE sidebar guards enforce.
- scope: Admin pages, role-based access control, BE route guards, FE sidebar guards
- cross_refs: requirements.md, feature-voc.md, uidesign.md, external-masters.md

### ADR-0005 — Trash restore policy
- source: `docs/adr/0005-trash-restore-policy.md`
- status: Accepted, LOCKED
- decision: Indefinite retention; Admin-only restore; hard-delete disabled in MVP; sub-task individual restore allowed; cascade on parent restore; `voc_restore_log` provides audit; `vocs.deleted_by` tracks deletion actor; tag_rules re-run on restore. Migration 015.
- scope: Trash UI, VOC soft delete, voc_restore_log, vocs.deleted_by, Admin permissions
- cross_refs: feature-voc.md, requirements.md, ADR-0004, next-session-tasks.md

### ADR-0006 — Dashboard `default_date_range='custom'` persistence
- source: `docs/adr/0006-custom-date-range-default.md`
- status: Accepted, LOCKED
- decision: Schema, CHECK constraints, zod, API, and UI semantics for persisting custom default date range in `dashboard_settings`. Migration 023.
- scope: dashboard_settings, default_date_range, custom date range, zod contracts, DashboardSettingsDialog, Admin default row
- cross_refs: dashboard.md, requirements.md, ADR-0007 (timezone follow-up), shared/openapi.yaml, shared/contracts/

---

## Proposed / Non-Locked Decisions

### ADR-0001 — field→action mapping owned by service layer
- source: `docs/adr/0001-field-to-action-mapping-in-service.md`
- status: implicit (no Status header; "채택" inline) — recorded as non-locked
- decision: `inferActions` field-to-action mapping stays in the service layer rather than moving into the permissions module, preserving concern separation.
- scope: services/voc.ts, services/permissions/assertCanManageVoc.ts, VocUpdate, VocAction

### ADR-0002 — VOC list response aggregated fields via SQL
- source: `docs/adr/0002-list-response-aggregated-fields.md`
- status: implicit — recorded as non-locked
- decision: Compute `VocListItem.has_children` and `notes_count` via SQL aggregates in `listVocs` instead of hardcoded defaults.
- scope: VocListItem, shared/contracts/voc/entity.ts, services/voc.ts, repository/voc.ts, voc_internal_notes

### ADR-0003 — validators/ layer kept as a documented seam
- source: `docs/adr/0003-validators-layer-kept-as-documented-seam.md`
- status: implicit — recorded as non-locked
- decision: Retain `backend/src/validators/voc.ts` as a documented architectural seam for BE-only validation rules even though it currently only re-exports `shared/contracts`.
- scope: backend/src/validators, shared/contracts/voc, BE-only validation

### ADR-0007 — Dashboard custom date range timezone semantics (PROPOSED)
- source: `docs/adr/0007-custom-date-range-timezone.md`
- status: **Proposed** (open questions outstanding)
- decision (proposed): Timezone interpretation semantics for dashboard `custom_start_date`/`custom_end_date` fields and cron aggregation day boundary.
- scope: dashboard_settings, custom_start_date, custom_end_date, timezone interpretation, cron aggregation day boundary
- cross_refs: ADR-0006 (parent), dashboard.md
- note: Flag as open follow-up. Not yet a binding decision.

### ADR-0008 — Flowline design alignment (PROPOSED)
- source: `docs/adr/0008-flowline-design-alignment.md`
- status: **Proposed**
- decision (proposed): Visual alignment of vocpage with the Flowline reference module via 5 new shared UI primitives spec'd in `uidesign.md §16`.
- scope: Flowline alignment, shared/ui primitives (issue-id, status-glyph, etc.), VocRow.tsx, VocActivityTimeline, globals.css
- cross_refs: refSystem/Integrated Platform _ Standalone.html, uidesign.md, flowline-alignment-cues.md
