---
name: warn-doc-cleanup-before-pr
enabled: true
event: bash
pattern: gh\s+pr\s+merge
---

**Pre-merge doc cleanup reminder** — fires only on `gh pr merge`.

**Scope: phase-close / wave-close PR only.** Intra-phase / leaf / batch PR is exempt — skip the checklist and just verify typecheck / lint / test.

If this PR closes a phase or a wave, do this once before the merge:

1. `claude-progress.txt` (first 30 lines) — reflect this PR, point to the next entry, drop entries that are no longer active context.
2. `docs/specs/plans/next-session-tasks.md` — mark closed items ✅, state the next entry point.
3. `git mv` reviews / plans whose decision has been absorbed into canonical spec (`requires/`) or an ADR to `docs/specs/archive/{reviews,plans}/`.
4. If a merged phase is cited by an active doc, inline the fact or keep a single link. Never cite archive paths as canonical.
5. Add a one-line summary (date + ID + outcome) to the active wave plan (`wave-3-admin.md` etc.) §Changelog or to the PR description. Do not create new changelog files — git log + PR description is the source of truth.
6. **CLAUDE.md 7-keep set** — `root` · `.claude` · `frontend` · `frontend/src` · `backend` · `backend/src` · `prototype`. Update a sub-CLAUDE.md only if its `## Role` / `## When to look where` actually changed in this PR. No new leaf CLAUDE.md outside the 7-keep set. On delete, do not leave stubs (`→ ancestor.md`).
7. Re-verify typecheck / lint / test green (`.claude/CLAUDE.md` test batch).

**Exceptions:** `docs/<topic>` branch or trivial 1-line fixes — user decides whether to skip.

If already done, ignore.
