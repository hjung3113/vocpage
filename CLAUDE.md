# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **VOC (Voice of Customer) management system** currently in **Phase 6 implementation** — frontend and backend are scaffolded with working source code. See `docs/specs/requires/requirements.md` for the product spec and `docs/specs/requires/uidesign.md` for the complete design system.

## Planned Tech Stack

| Layer     | Technology                                                                     |
| --------- | ------------------------------------------------------------------------------ |
| Frontend  | React + TypeScript, Vite, Toast UI Editor                                      |
| Backend   | Node.js + Express + TypeScript                                                 |
| Database  | PostgreSQL                                                                     |
| Testing   | Vitest (frontend), Jest + Supertest (backend)                                  |
| Container | Docker + Docker Compose                                                        |
| Styling   | Tailwind CSS v4 + CSS custom properties (mixed) — `tokens.ts` as single source |

## Sub-directory Guides

Each working directory has a focused `CLAUDE.md` with its own commands, architecture, and rules:

- `frontend/CLAUDE.md` — React SPA, hooks, state, full design tokens
- `backend/CLAUDE.md` — Express REST API, DB schema, middleware
- `prototype/CLAUDE.md` — visual exploration HTML, full design tokens

**Rule:** when working inside a sub-directory, read its `CLAUDE.md` first. This file covers cross-cutting governance only.

## Docker

```bash
docker compose up    # Start all services (FE + BE + Postgres)
```

## Architecture Overview

Three-tier app: React SPA → Express REST API → PostgreSQL. Detailed architecture lives in each sub-directory's `CLAUDE.md` and in `docs/specs/requires/`.

## Design System (Pointer)

Full spec: `docs/specs/requires/uidesign.md`. Full token reference: §10 CSS Reference.

**Hard rule (echoed in `frontend/CLAUDE.md` and `prototype/CLAUDE.md`):**

- Always use CSS custom properties — `var(--bg-app)`, `var(--brand)`, `var(--text-primary)`, etc.
- **Never write hex values** (no `#5e6ad2`, no `#ffffff`). No raw OKLCH either — go through the token.
- Typography: Pretendard Variable (UI), D2Coding (code/issue IDs).
- 8px spacing grid, max-width ~1200px, elevation via background opacity not shadow darkness.

## Start Every Session

1. Read `claude-progress.txt` (first 30 lines only)
2. Read `docs/specs/plans/next-session-tasks.md` to find current Phase and pending tasks
3. Read relevant spec in `docs/` (selectively — only what's needed)
4. Continue from progress file — don't re-read what you already know
5. Review `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — delete any entries whose work is already reflected in specs or git (delete file + remove from index; do not archive)

## Core Rules

- **Grep/Glob before Read** — search first, never read full files to find one function
- **Parallel tool calls** — independent tool calls go in one message, not sequential
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe test output through `| tail -20`; never print full traces
- **No Read before delete** — files being deleted must never be Read first; just `rm`
- **Broad grep first pass** — use `--all` and wide keywords on first `git log` grep; never retry with a narrower pattern
- **Minimum context for decisions** — "문서 업데이트" and similar judgment tasks: use only the single most relevant file (e.g. `claude-progress.txt`); do not open supporting files (next-session-tasks, git log, etc.) unless the first file is insufficient
- **Git workflow** — always create a feature branch first, commit and push there. Never commit or push directly to main. Branch naming: `docs/<topic>`, `feat/<topic>`, `fix/<topic>`.
  - PRs are opened by the user, not by Claude
  - Merge PRs with `gh pr merge <n> --merge --delete-branch` — `--squash` and `--rebase` are forbidden
    - `--squash`: destroys commit history
    - `--rebase`: replays commits directly onto main, erasing PR boundaries
    - `--merge`: preserves both the merge commit (PR boundary) and individual commits ✓
  - After merging, delete the local branch: `git branch -D <branch>`
  - main changes only via PR — direct push and force push are forbidden
  - These rules are enforced by hookify rules in `.claude/hookify.block-*.local.md`
- Run tests before committing; follow existing code style (read 2-3 nearby files first)
- No features beyond what the task requires (YAGNI)
- CLAUDE.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Document Structure

All design, review, and implementation documents live under `docs/specs/`. No document files at the repo root.

```
docs/specs/
├── requires/   # requirements and design specs (requirements.md, uidesign.md, etc.)
├── plans/      # per-feature implementation plans
└── reviews/    # review and brainstorming outputs
```

### Document Roles

| File                                  | Language         | Scope                                                                                                              |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `docs/specs/requires/uidesign.md`     | **English only** | Visual design system — color tokens, typography, component specs, layout rules, spacing, elevation, UI do's/don'ts |
| `docs/specs/requires/requirements.md` | Korean           | Functional requirements — feature specs, behavioral rules, data model, API design, business logic                  |

- New feature plan → `docs/specs/plans/<feature-name>.md`
- Review / brainstorming → `docs/specs/reviews/<topic>.md`
- **Never put functional/behavioral spec in `uidesign.md`**
- **Never put visual design rules in `requirements.md`**
- `uidesign.md` must always be written in English
- **Tool scratch dirs (`.omc/plans/`, `.superpowers/`, etc.) are temporary — canonical docs always live in `docs/specs/`**

## Document Coherence

**Write decisions to the right file first:**

| Decision made                                                          | Write to                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Visual design change (color, layout, spacing, component pattern)       | `docs/specs/requires/uidesign.md` (English)                      |
| Functional/behavioral change (feature rule, API shape, business logic) | `docs/specs/requires/requirements.md` or relevant `feature-*.md` |

**Then check propagation:**

| Changed                                  | Must also check               |
| ---------------------------------------- | ----------------------------- |
| Spec (design decision, constraint)       | Implementation plan           |
| Implementation plan (task added/removed) | Spec section it implements    |
| CLAUDE.md (new rule)                     | Spec if rule affects behavior |

## Input Interpretation

When you receive a development request, mentally normalize it into this frame before coding. Ask only about items that materially affect the result; otherwise state your assumption and proceed.

- **Goal** — what + why (one line)
- **Scope** — files/paths involved; what _not_ to touch
- **Done when** — verifiable conditions (test passes, build clean, observable behavior)
- **Constraints** — style, tokens, dependencies, existing patterns

Skip the frame for trivial one-liners (rename, obvious typo, single-file change with explicit path).

## Working Style

- **No completion claims** — never mark a task done until the user explicitly says so
- **No implementation without approval** — never write BE/FE code until the user says to start
- **Debate, don't defer** — when you see a counterargument or missed case, raise it before agreeing; no passive "yes"
- **Think before coding** — state assumptions; if multiple interpretations exist, present them, don't pick silently
- **Simplicity first** — minimum code; no speculative abstractions; if 200 lines could be 50, rewrite
- **Surgical changes** — touch only what the request requires; match existing style; only remove orphans your changes made unused
- **Goal-driven execution** — convert tasks into verifiable goals; for multi-step work, plan per-step verification and loop until verified

## Refactoring

A refactor changes structure without changing observable behavior. Most refactor bugs are mechanical (stale references, partial migration) — catch them with checks, not cleverness.

**Before:**

- State the symbols/files/paths you will change (in chat, before editing)
- Confirm tests cover the affected behavior; if not, write tests first
- Refactor and feature change must NOT land together — split into separate commits/PRs

**During:**

- Use `git mv` for file moves so history follows
- One refactor at a time

**After (mandatory, in order):**

1. **Update all references** — imports, dynamic strings, route paths, config (`*.json`/`*.yml`/`.env`), `docs/specs/**`, plan files, README/CLAUDE.md mentions, comments. **Nothing pointing to the old name/path may remain.**
2. `grep -rn "<old_name>"` and `grep -rn "<old/path>"` → 0 hits (exception: a deliberate changelog entry)
3. Typecheck passes (`tsc --noEmit` or `npm run build`)
4. Tests pass (`npm run test`)
5. Run the app and exercise the touched surface (UI: browser; API: endpoint)

**Escalate to `code-reviewer` agent only when:** public API surface changed, ≥3 modules touched, or DB schema/migration involved. Routine renames/extracts skip the agent.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
