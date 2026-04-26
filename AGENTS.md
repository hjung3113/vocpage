# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository. It mirrors the project-level `CLAUDE.md` so Codex can follow the same repository conventions.

## Project Status

This is a **VOC (Voice of Customer) management system** currently in **Phase 9 preparation** — frontend and backend are scaffolded with working source code. See `docs/specs/requires/requirements.md` for the product spec and `docs/specs/requires/design.md` for the complete design system.

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

Each working directory has a focused `AGENTS.md` with its own commands, architecture, and rules:

- `frontend/AGENTS.md` — React SPA, hooks, state, full design tokens
- `backend/AGENTS.md` — Express REST API, DB schema, middleware
- `prototype/AGENTS.md` — visual exploration HTML, full design tokens

**Rule:** when working inside a sub-directory, read its `AGENTS.md` first. This file covers cross-cutting governance only.

## Docker

```bash
docker compose up    # Start all services (FE + BE + Postgres)
```

## Architecture Overview

Three-tier app: React SPA → Express REST API → PostgreSQL. Detailed architecture lives in each sub-directory's `AGENTS.md` and in `docs/specs/requires/`.

## Design System (Pointer)

Full spec: `docs/specs/requires/design.md`. Full token reference: §10 CSS Reference.

**Hard rule (echoed in `frontend/AGENTS.md` and `prototype/AGENTS.md`):**

- Always use CSS custom properties — `var(--bg-app)`, `var(--brand)`, `var(--text-primary)`, etc.
- **Never write hex values** (no `#5e6ad2`, no `#ffffff`). No raw OKLCH either — go through the token.
- Typography: Pretendard Variable (UI), D2Coding (code/issue IDs).
- 8px spacing grid, max-width ~1200px, elevation via background opacity not shadow darkness.

## Start Every Session

1. Read `claude-progress.txt` (first 30 lines only)
2. Read `docs/specs/plans/next-session-tasks.md` to find current Phase and pending tasks
3. Read relevant spec in `docs/` (selectively — only what's needed)
4. Continue from progress file — don't re-read what you already know

## Core Rules

- **Grep/Glob before Read** — search first, never read full files to find one function
- **Parallel tool calls** — independent tool calls go in one message, not sequential
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe test output through `| tail -20`; never print full traces
- **Git workflow** — always create a feature branch first, commit and push there. Never commit or push directly to main. Branch naming: `docs/<topic>`, `feat/<topic>`, `fix/<topic>`.
  - PRs are opened by the user, not by Codex
  - Merge PRs with `gh pr merge <n> --merge --delete-branch` — `--squash` and `--rebase` are forbidden
    - `--squash`: destroys commit history
    - `--rebase`: replays commits directly onto main, erasing PR boundaries
    - `--merge`: preserves both the merge commit (PR boundary) and individual commits ✓
  - After merging, delete the local branch: `git branch -D <branch>`
  - main changes only via PR — direct push and force push are forbidden
  - These rules are enforced by hookify rules in `.claude/hookify.block-*.local.md`
- Run tests before committing; follow existing code style (read 2-3 nearby files first)
- No features beyond what the task requires (YAGNI)
- AGENTS.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Document Structure

All design, review, and implementation documents live under `docs/specs/`. No document files at the repo root.

```
docs/specs/
├── requires/   # requirements and design specs (requirements.md, design.md, etc.)
├── plans/      # per-feature implementation plans
└── reviews/    # review and brainstorming outputs
```

### Document Roles

| File                                  | Language         | Scope                                                                                                              |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `docs/specs/requires/design.md`       | **English only** | Visual design system — color tokens, typography, component specs, layout rules, spacing, elevation, UI do's/don'ts |
| `docs/specs/requires/requirements.md` | Korean           | Functional requirements — feature specs, behavioral rules, data model, API design, business logic                  |

- New feature plan → `docs/specs/plans/<feature-name>.md`
- Review / brainstorming → `docs/specs/reviews/<topic>.md`
- **Never put functional/behavioral spec in `design.md`**
- **Never put visual design rules in `requirements.md`**
- `design.md` must always be written in English
- **Tool scratch dirs (`.omc/plans/`, `.superpowers/`, etc.) are temporary — canonical docs always live in `docs/specs/`**

## Document Coherence

**Write decisions to the right file first:**

| Decision made                                                          | Write to                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Visual design change (color, layout, spacing, component pattern)       | `docs/specs/requires/design.md` (English)                        |
| Functional/behavioral change (feature rule, API shape, business logic) | `docs/specs/requires/requirements.md` or relevant `feature-*.md` |

**Then check propagation:**

| Changed                                  | Must also check               |
| ---------------------------------------- | ----------------------------- |
| Spec (design decision, constraint)       | Implementation plan           |
| Implementation plan (task added/removed) | Spec section it implements    |
| AGENTS.md (new rule)                     | Spec if rule affects behavior |

## Session Rules

- **No completion claims** — Never mark a task as done until the user explicitly says so
- **No implementation without approval** — Never write actual BE/FE code until the user explicitly says to start implementation
- **Debate, don't defer** — Do not assume the user is always right. When you see a counterargument, trade-off, or missed case in a spec or design decision, raise it before agreeing. No passive "yes" — push back, verify, or propose alternatives as a peer engineer would.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
