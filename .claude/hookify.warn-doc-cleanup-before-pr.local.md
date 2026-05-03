---
name: warn-doc-cleanup-before-pr
enabled: true
event: bash
pattern: gh\s+pr\s+(create|merge)
---

**Pre-PR doc cleanup reminder** (canonical: `docs/specs/README.md`)

If this PR closes a phase / wave / PR, do this once before the merge:

1. Update first 30 lines of `claude-progress.txt` — reflect this PR in the next-session entry point. Remove phase entries no longer needed (active context only).
2. Update `docs/specs/plans/next-session-tasks.md` — ✅ closed items, state next entry point.
3. `git mv` review docs under `docs/specs/reviews/` to `docs/specs/archive/reviews/` if no longer needed (archives are not canonical).
4. `git mv` finished plans under `docs/specs/plans/` to `docs/specs/archive/plans/`.
5. If a merged phase is quoted by an active doc, inline the fact or keep only a link (no archive citations).
6. Append a one-line Changelog entry to the relevant `phase-*.md` (date + ID + summary).
7. **CLAUDE.md 8-keep set** — only `root`, `.claude`, `frontend`, `backend`, `frontend/src`, `backend/src`, `docs`, `prototype`. Update one of these only if its `## Role` / `## When to look where` changed in this PR.
   - No new leaf CLAUDE.md outside the 8-keep set — fold any directory guidance into the nearest ancestor.
   - No stub on delete — `→ ancestor.md` one-liners are auto-loaded noise.
8. Re-verify typecheck/lint clean.

**Exceptions:** `docs/<topic>` branch or trivial 1-line fixes may skip. User decides.

**Fires once before `gh pr create` or `gh pr merge`.** If done already, ignore.
