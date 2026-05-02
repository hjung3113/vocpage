# Serena Usage Policy (for future sessions)

Serena MCP is set up and active for this project (project name: `vocpage`,
language: typescript). Onboarding done; memories cover overview, style,
commands, completion checklist, codebase structure.

## When to use Serena tools (prefer over raw Read/grep)

- **Symbol-level navigation** — `find_symbol`, `get_symbols_overview`,
  `find_referencing_symbols` instead of reading whole files to locate code
- **Symbolic edits** — `replace_symbol_body`, `insert_after_symbol`,
  `insert_before_symbol` when changing whole functions/classes/methods
- **Pattern search** — `search_for_pattern` when `grep`/`Glob` would also work
  but you need structured results within the project
- **Project memories** — `read_memory` / `list_memories` at session start to
  recall overview/style/commands without re-reading CLAUDE.md
- **LSP diagnostics** — `get_diagnostics_for_file` after edits to catch TS errors

## When NOT to use Serena

- Reading small/known files — Claude's `Read` tool is fine
- Few-line edits inside a larger symbol — use `Edit` (Claude) or
  `replace_content` (Serena regex), not `replace_symbol_body`
- Already read the full file in this session — don't re-fetch via symbol tools

## Session-start ritual (with Serena)

1. `activate_project` (path: `/Users/hyojung/Desktop/2026/vocpage`)
2. `check_onboarding_performed` → already done
3. `list_memories` → pick relevant memory files
4. `read_memory` for `project_overview`, `suggested_commands`, etc. as needed
5. Then proceed with the regular vocpage session ritual
   (`claude-progress.txt` → `next-session-tasks.md` → relevant spec)

## Notes

- Serena line numbers are **0-based** (not 1-based like Claude's Read)
- Programming language detected: typescript only — Serena's symbol tools work
  for `.ts` / `.tsx`. For `.md` / config files use file/regex tools.
