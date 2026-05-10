# Synthesis Summary

Entry point for downstream consumers (`gsd-roadmapper`). All claims trace to `source:` paths in the per-type intel files.

## Doc counts

- **Total**: 31 classifications
- **ADR**: 8 (3 LOCKED, 2 Proposed, 3 implicit/non-locked)
- **PRD**: 4
- **SPEC**: 12
- **DOC**: 7

## Decisions

- **LOCKED**: 3
  - ADR-0004 — `docs/adr/0004-admin-permission-model.md` (admin pages permissions)
  - ADR-0005 — `docs/adr/0005-trash-restore-policy.md` (trash retention/restore)
  - ADR-0006 — `docs/adr/0006-custom-date-range-default.md` (dashboard custom date persistence)
- **Proposed**: 2
  - ADR-0007 — timezone semantics (open questions; blocks dashboard-cron)
  - ADR-0008 — Flowline design alignment (blocks visual-alignment wave)
- **Implicit (no Status header)**: 3 — ADR-0001, ADR-0002, ADR-0003

Detail: `decisions.md`

## Requirements

4 PRD-derived requirements:
- `REQ-voc-system` — VOC system master (`requirements.md`)
- `REQ-voc-dashboard` — dashboard (`dashboard.md`, locked via ADR-0006)
- `REQ-notice-faq` — notice & FAQ (`feature-notice-faq.md`)
- `REQ-admin-pages-wave` — admin Wave 4 plan (`admin-pages-wave.md`, gated by ADR-0004 / 0005)

Detail: `requirements.md`

## Constraints

12 SPEC entries:
- VOC core: `feature-voc.md` (state machines, permissions, history, embedding)
- Integrations: `external-masters.md`
- Frontend conventions (10): api, datetime, env, error-loading, form, naming, routing, state-management, table-filter, test
- Design system: `uidesign.md` (OKLCH tokens, light/dark, §16 Flowline primitives spec)

Detail: `constraints.md`

## Context topics

7 DOC entries: project shape, active wave (Wave 4 admin), closed-wave history (git-only), visual baselines location, planning memos (admin-pages-backlog, flowline-alignment-cues, next-session-tasks), agent docs (domain, issue-tracker, triage-labels), glossary.

Detail: `context.md`

## Conflicts

- **BLOCKERS**: 0
- **WARNINGS**: 2 (ADR-0007 Proposed gates dashboard-cron; ADR-0008 Proposed gates Flowline-alignment wave)
- **INFO / auto-resolved**: 5 (closed-wave history references; PRD/SPEC hybrid in requirements.md; feature-voc dual-surface; visual-baselines path correction; ADRs 0001-0003 missing Status headers)

Report: `/Users/hyojung/Desktop/2026/vocpage/.planning/INGEST-CONFLICTS.md`

## Files

- `/Users/hyojung/Desktop/2026/vocpage/.planning/intel/decisions.md`
- `/Users/hyojung/Desktop/2026/vocpage/.planning/intel/requirements.md`
- `/Users/hyojung/Desktop/2026/vocpage/.planning/intel/constraints.md`
- `/Users/hyojung/Desktop/2026/vocpage/.planning/intel/context.md`
- `/Users/hyojung/Desktop/2026/vocpage/.planning/INGEST-CONFLICTS.md`

## Status

**AWAITING USER** — 2 WARNINGS (Proposed ADRs 0007 and 0008 gate dashboard-cron and Flowline-alignment routing respectively). No BLOCKERS. Safe to route everything else.
