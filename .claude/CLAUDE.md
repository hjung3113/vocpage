# .claude/CLAUDE.md

**Root `CLAUDE.md` is authoritative.** This file contains only tool-specific supplements — not governance, not session ritual, not doc structure. If a rule appears in both files, root wins.

## Token-Saving Protocol

- Use `limit=30` (or similar) when reading progress/state files
- Check `git diff` for changes instead of re-reading full files
- Reference external docs via links (don't duplicate into context)
- **Test batch** — verify per workspace in a single call:
  - FE: `npm run typecheck -w frontend && npm run test -w frontend -- --run | tail -20`
  - BE: `npm run typecheck -w backend && npm run test -w backend | tail -20`
  - If both sides touched, run the two commands as parallel bash in one message (root §"Parallel tool calls").
  - Do not split tsc and vitest into separate calls.

## Pointers

- Canonical docs → `docs/specs/` (the `requires/`, `plans/`, `reviews/` layout in root governs )
