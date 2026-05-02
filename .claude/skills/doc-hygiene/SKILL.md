---
name: doc-hygiene
description: Documentation hygiene for vocpage. Use before creating or moving docs, editing documentation sources of truth, closing phases or waves, or handling requests to clean up docs. Canonical rules live in docs/specs/README.md.
---

# Skill: Documentation Hygiene (vocpage)

`docs/specs/README.md` is the single source of truth for documentation hygiene.

This skill is intentionally thin. Do not duplicate the rules, source-of-truth table, cleanup process, or new-doc checklist here.

## When to Use

Use this skill:

- Before creating a new `.md` file.
- Before editing documentation sources of truth, including root or folder `CLAUDE.md`, `AGENTS.md`, `docs/specs/requires/**`, `docs/specs/plans/**`, or `docs/specs/reviews/**`.
- At session start when documentation context is needed.
- At phase or wave close.
- When the user asks to clean up, reorganize, deduplicate, or audit docs.
- After a merged PR that changed `docs/specs/reviews/**` or `docs/specs/plans/**`.

## Procedure

Read and follow `docs/specs/README.md`, especially:

- `§3 Source of Truth`
- `§5 Cleanup Process`
- `§6 Before Creating a New Doc`
- `§7` folder `CLAUDE.md` refresh policy
