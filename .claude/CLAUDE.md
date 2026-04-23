# .claude/CLAUDE.md

**Root `CLAUDE.md` is authoritative.** This file contains only tool-specific supplements — not governance, not session ritual, not doc structure. If a rule appears in both files, root wins.

## Token-Saving Protocol

- Use `limit=30` (or similar) when reading progress/state files
- Grep/Glob before Read — never read a full file to find a function
- Check `git diff` for changes instead of re-reading full files
- Reference external docs via links (don't duplicate into context)
- Tail test output: pipe through `| tail -20`; never print full traces

## Pointers

- Session ritual, Core Rules, Document Structure, Session Continuity → root `CLAUDE.md`
- Sub-directory guides → `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `prototype/CLAUDE.md`
- Canonical docs → `docs/specs/` (the `requires/`, `plans/`, `reviews/` layout in root governs — this project does **not** use Diátaxis)
