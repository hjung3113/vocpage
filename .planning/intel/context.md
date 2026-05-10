# Context (DOCs)

Running notes from 7 DOC-class documents (planning memos, agent guides, working queues).

---

## Project shape

VOC (Voice of Customer) management system. Three-tier:
- React SPA frontend
- Express REST backend
- PostgreSQL with pgvector (embeddings)
- Docker Compose runs all three

Monorepo: `frontend/` + `backend/` + `shared/`. Korean-language specs and ADRs.

## Active wave

**Wave 4 — Admin unimplemented pages.** Phases A/B/C/D per `docs/specs/plans/admin-pages-wave.md` (PRD).
- Phase scope: tag-rules consolidation into `/admin/tags`, `/admin/voc-types`, `/admin/systems`, `/admin/result-review`.
- Constrained by LOCKED ADR-0004 (admin permissions) and ADR-0005 (trash policy).

## Closed-wave history

Per user decision (commit `16d2517`, 2026-05-10), closed-wave history lives in **git log + PR descriptions** only. Standalone changelog files were intentionally retired:
- `docs/specs/plans/wave-3-admin.md` — retired
- `docs/specs/plans/followup-bucket.md` — retired
Historical references to those paths in older ADRs are expected and not errors.

## Visual baselines

Visual ground-truth lives in `prototype/screenshots/` (NOT `benchmark/` — root CLAUDE.md was corrected this session). `scripts/visual-diff.ts` consumes these. New screen → add baseline + INDEX row.

Per project CLAUDE.md (2026-05-09): `prototype/` is no longer a visual / behavior / DOM / CSS reference. The authoritative visual spec is `uidesign.md`.

## Planning / backlog memos (DOC)

### admin-pages-backlog (2026-05-10)
- source: `docs/specs/plans/admin-pages-backlog.md`
- topic: Catalog of implemented vs. unimplemented admin pages with a proposal to integrate `tag_rules` into `/admin/tags`. Source for the Wave 4 PRD.

### flowline-alignment-cues
- source: `docs/specs/plans/flowline-alignment-cues.md`
- topic: Working queue mapping Flowline visual signals to vocpage and proposing a wave plan for design alignment. Feeds ADR-0008 (Proposed).

### next-session-tasks
- source: `docs/specs/plans/next-session-tasks.md`
- topic: Active + deferred session task plan. Tracks next entry candidates, structure/naming cleanup, and ops/deploy phase candidates. Canonical alongside `claude-progress.txt`.

## Agent / workflow docs

### agents/domain
- source: `docs/agents/domain.md`
- topic: Engineering-skill guidance for consuming repo domain docs (`CONTEXT.md` and ADRs).

### agents/issue-tracker
- source: `docs/agents/issue-tracker.md`
- topic: GitHub Issues conventions and `gh` CLI commands for managing issues / PRDs as GitHub issues.

### agents/triage-labels
- source: `docs/agents/triage-labels.md`
- topic: Maps five canonical triage roles (mattpocock/skills) to repo issue-tracker label strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

## Glossary

- **VOC** — Voice of Customer (the issue/ticket entity at the heart of the system)
- **issue code** — Human-readable VOC identifier (format defined in `feature-voc.md`)
- **status / review_status** — Two-level state machines on VOC; review_status is a sub-state of status (`feature-voc.md`)
- **dashboard_settings** — Persisted dashboard configuration including `default_date_range` (ADR-0006)
- **tag_rules** — Auto-tagging rule engine; targeted for consolidation into `/admin/tags` (Wave 4 phase)
- **external masters** — Equipment / DB / program reference data sourced from MSSQL (`external-masters.md`)
- **Flowline** — Reference design system at `refSystem/Integrated Platform _ Standalone.html`; subject of ADR-0008 (Proposed) alignment effort
