# docs/CLAUDE.md

## Role

Canonical documentation tree — single source of truth for everything decided outside the code.

## When to look where

- Doc-hygiene policy (where to put a doc, when to archive) → `specs/README.md`
- Current phase/wave → root `claude-progress.txt`, then `specs/plans/next-session-tasks.md`
- Reference images embedded by specs → `screenshots/` (wave-scoped: `screenshots/<wave>/`)

## `specs/` sub-tree

- `specs/requires/` — stable, long-lived product/design "what". Top-level: `requirements.md` (data model + flows). Feature: `feature-voc.md`, `feature-notice-faq.md`. Dashboard: `dashboard.md`. Design tokens/typography/spacing: `uidesign.md`. External masters: `external-masters.md`. Prototype decomposition: `voc-prototype-decomposition.md`. Index: `README.md`.
- `specs/plans/` — active "how/when" roadmaps; mutable. Entry: `next-session-tasks.md`. Future backlog: `nextgen-backlog.md`. Phase 8 trees: `phase-8*.md`. Wave 1.5 follow-ups: `wave1.5-followup-a-*.md`. Wave 1.6: `wave-1-6-voc-parity.md`, `wave-1-6-phase-c-precedent.md`. Wave 1.7: `wave-1-7-voc-create-modal.md`. Migration drafts: `migration-*-draft.md`. Closed → `archive/plans/` (do not cite as source of truth). Long-tail history: `progress-archive.md`.
- `specs/reviews/` — active reviews + adversarial audits + supporting screenshots. Wave 1.6 VOC badge audit: `wave-1-6-voc-badge-audit.md`. Wave 1.5 Follow-up A (PR #125 line): `wave1.5-followup-a/` (markdown notes + `screenshots/` evidence). Spot-check images: `c-5-voc-assignee*.png`. Closed → `archive/reviews/`.
- `specs/archive/` — completed plans (`plans/`) and reviews (`reviews/`). Reference-only; never cite as source of truth.
