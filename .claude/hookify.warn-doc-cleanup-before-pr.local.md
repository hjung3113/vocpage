---
name: warn-doc-cleanup-before-pr
enabled: true
event: bash
pattern: gh\s+pr\s+(create|merge)
---

**Pre-PR doc cleanup reminder** (canonical: `docs/specs/README.md`)

If this PR closes a phase / wave / PR, do this once before the merge:

1. Run `docs/specs/README.md §5` cleanup.
2. Apply `docs/specs/README.md §7` folder `CLAUDE.md` refresh policy for touched folders.
3. Re-verify typecheck/lint clean.

**Exceptions:** `docs/<topic>` branch or trivial 1-line fixes may skip. User decides.

**Fires once before `gh pr create` or `gh pr merge`.** If done already, ignore.
