---
name: warn-doc-cleanup-before-pr
enabled: true
event: bash
pattern: gh\s+pr\s+(create|merge)
---

📋 **Pre-PR doc cleanup checklist** (canonical: `docs/specs/README.md §5`)

If this PR closes a phase / wave / PR, do the following once before the merge:

1. Update first 30 lines of `claude-progress.txt` — reflect this PR in the next-session entry point. Remove phase entries no longer needed (active context only).
2. Update `docs/specs/plans/next-session-tasks.md` — ✅ closed items, state next entry point.
3. `git mv` review docs under `docs/specs/reviews/` to `reviews/done/` if no longer needed (archives are not canonical).
4. `git mv` finished plans under `docs/specs/plans/` to `plans/done/`.
5. If a merged phase is quoted by an active doc, inline the fact or keep only a link (no archive citations).
6. Append a one-line Changelog entry to the relevant `phase-*.md` (date + ID + summary).
7. **Refresh `CLAUDE.md` for every folder this PR touched — only if it earns its tokens.** A redundant child is a net loss (auto-loaded on entry).
   - **Update** when role / "when to look where" / cross-file invariants changed.
   - **Create only if** the folder carries signal a future session can't infer from the folder name, parent `CLAUDE.md`, or a single `ls`.
   - **Do not create** in: `__tests__/`, `__snapshots__/`, `cache/`, `done/`, leaf `screenshots/`, gitignored runtime dirs, dot-folders.
   - **Delete** an existing child if its content collapses to a paraphrase of the folder name or parent.
   - Scope: only `## Role` and `## When to look where` sections.
8. Re-verify typecheck/lint clean.

**Exceptions:** `docs/<topic>` branch or trivial 1-line fixes may skip. User decides.

**Fires once before `gh pr create` or `gh pr merge`.** If done already, ignore.
