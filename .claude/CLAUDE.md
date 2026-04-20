## Core Rules

- **Grep/Glob before Read** — search first, never read full files to find one function
- **Parallel tool calls** — independent tool calls go in one message, not sequential
- **Session continuity** — every design decision documented before session ends; phase completions get a git commit
- **Git workflow** — feature branch → PR → merge; never push directly to main
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe test output through `| tail -20`; never print full traces

# Project: vocpage

general project — unknown, unknown.

## Start Every Session

1. Read `claude-progress.txt` (first 30 lines only)
2. Read relevant spec in `docs/` (selectively — only what's needed)
3. Continue from progress file — don't re-read what you already know

## Token-Saving Protocol

- `limit=30` for progress/state files
- Grep/Glob before Read
- Check `git diff` for changes instead of re-reading full files
- Reference external docs via links (don't duplicate into context)

## Key Rules

- Run tests before committing
- Follow existing code style — read 2-3 nearby files before writing new code
- Check `docs/` for domain-specific context
- No features beyond what the task requires (YAGNI)
- CLAUDE.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Document Coherence

| Changed | Must also check |
|---|---|
| Spec (design decision, constraint) | Implementation plan |
| Implementation plan (task added/removed) | Spec section it implements |
| CLAUDE.md (new rule) | Spec if rule affects behavior |

## Skills Available

When starting a new feature or onboarding this project:

```
# Detect project type, suggest improvements, generate context-aware rules:
/onboard-project

# Set up Diátaxis-based docs structure (tutorials/how-to/reference/explanation):
/setup-docs-structure
```

These skills are in `harness/skills/` of env-setup. Copy to `~/.claude/skills/` to activate.

## Docs Structure (if set up)

```
docs/
├── tutorials/       # Learning-oriented guides
├── how-to/          # Task-oriented recipes
├── reference/       # Authoritative facts
├── explanation/     # Background, design rationale
├── adr/             # Architecture Decision Records
└── internal/        # Spec, runbooks, context
```
