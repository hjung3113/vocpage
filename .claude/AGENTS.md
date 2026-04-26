# .claude/AGENTS.md

**Root `AGENTS.md` is authoritative.** This file contains only tool-specific supplements copied from `.claude/CLAUDE.md` for Codex visibility — not governance, not session ritual, not doc structure. If a rule appears in both files, root wins.

## Token-Saving Protocol

- Use `limit=30` (or similar) when reading progress/state files
- Grep/Glob before Read — never read a full file to find a function
- Check `git diff` for changes instead of re-reading full files
- Reference external docs via links (don't duplicate into context)
- Tail test output: pipe through `| tail -20`; never print full traces

## Pointers

- Session ritual, Core Rules, Document Structure, Session Continuity → root `AGENTS.md`
- Sub-directory guides → `frontend/AGENTS.md`, `backend/AGENTS.md`, `prototype/AGENTS.md`
- Canonical docs → `docs/specs/` (the `requires/`, `plans/`, `reviews` layout in root governs — this project does **not** use Diátaxis)
