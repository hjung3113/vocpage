# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project Status

**VOC (Voice of Customer) management system**, currently **Phase 6 implementation** — frontend and backend are scaffolded with working source code. Product spec: `docs/specs/requires/requirements.md`. Design system: `docs/specs/requires/uidesign.md`.

## Stack (summary — details in sub-dir CLAUDE.md)

Three-tier app: React SPA → Express REST API → PostgreSQL.

- Frontend: React + TypeScript + Vite + Tailwind v4 → `frontend/CLAUDE.md`
- Backend: Node + Express + TypeScript + PostgreSQL/pgvector → `backend/CLAUDE.md`
- Prototype: static HTML visual sandbox → `prototype/CLAUDE.md`
- Container: Docker Compose (`docker compose up` starts FE + BE + Postgres)

**Rule:** when working inside a sub-directory, read its `CLAUDE.md` first. This file covers cross-cutting governance only.

**Prototype-as-reference (shared FE/BE principle):** the prototype is a visual + behavioral reference, **not** production architecture. FE preserves UX while rebuilding cleanly; BE infers real requirements and defines stable contracts. Never copy prototype code directly into production. Detail rules: `frontend/CLAUDE.md` and `backend/CLAUDE.md`.

## Design System (canonical hard rule)

Full spec: `docs/specs/requires/uidesign.md` (§10 CSS Reference, §12 Token Architecture).

- Always use CSS custom properties — `var(--bg-app)`, `var(--brand)`, `var(--text-primary)`, etc.
- **Never write hex values** (no `#5e6ad2`, no `#ffffff`). No raw OKLCH either — go through the token.
- Typography: Pretendard Variable (UI), D2Coding (code/issue IDs).
- 8px spacing grid, max-width ~1200px, elevation via background opacity not shadow darkness.

## Start Every Session

1. Read `claude-progress.txt` (first 30 lines only)
2. Read `docs/specs/plans/next-session-tasks.md` to find current Phase and pending tasks
3. Read relevant spec in `docs/` (selectively — only what's needed)
4. Continue from progress file — don't re-read what you already know
5. Review `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — delete entries already reflected in specs or git (delete file + remove from index; do not archive)

## Core Rules

- **Grep/Glob before Read** — search first, never read full files to find one function
- **Parallel tool calls** — independent tool calls go in one message, not sequential
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe through `| tail -20`; never print full traces
- **No Read before delete** — files being deleted must never be Read first; just `rm`
- **Broad grep first pass** — use `--all` and wide keywords on first `git log` grep; never retry with a narrower pattern
- **Minimum context for decisions** — judgment tasks (e.g. "문서 업데이트"): use only the single most relevant file; open supporting files only if the first is insufficient
- **Git workflow** — feature branch only (`docs/<topic>` / `feat/<topic>` / `fix/<topic>`); never commit or push to main directly. PRs are opened by the user. Merge with `gh pr merge <n> --merge --delete-branch` (`--squash` and `--rebase` forbidden). After merge: `git branch -D <branch>`. Enforced by hookify rules in `.claude/hookify.block-*.local.md`.
- Run tests before committing; follow existing code style (read 2–3 nearby files first)
- No features beyond what the task requires (YAGNI)
- CLAUDE.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Documents (structure + coherence)

All design / review / implementation docs live under `docs/specs/`. No document files at the repo root. Tool scratch dirs (`.omc/plans/`, `.superpowers/`, etc.) are temporary — canonical docs always live in `docs/specs/`.

```
docs/specs/
├── requires/   # requirements.md (Korean), uidesign.md (English only)
├── plans/      # per-feature implementation plans, <feature-name>.md
└── reviews/    # review / brainstorming, <topic>.md
```

| Decision made                                                     | Write to                                           | Then propagate to             |
| ----------------------------------------------------------------- | -------------------------------------------------- | ----------------------------- |
| Visual design (color, layout, spacing, component pattern)         | `requires/uidesign.md` (English)                   | implementation plan           |
| Functional / behavioral (feature rule, API shape, business logic) | `requires/requirements.md` or relevant `feature-*` | implementation plan           |
| Implementation plan (task added/removed)                          | `plans/<feature>.md`                               | spec section it implements    |
| New rule in `CLAUDE.md`                                           | this file                                          | spec if rule affects behavior |

- **Never put functional/behavioral spec in `uidesign.md`** and **never put visual rules in `requirements.md`**.
- `uidesign.md` must always be English.

## Input Interpretation

Normalize a request into this frame before coding. Ask only about items that materially affect the result; otherwise state the assumption and proceed.

- **Goal** — what + why (one line)
- **Scope** — files/paths involved; what _not_ to touch
- **Done when** — verifiable conditions (test passes, build clean, observable behavior)
- **Constraints** — style, tokens, dependencies, existing patterns

Skip the frame for trivial one-liners (rename, obvious typo, single-file change with explicit path).

## Working Style

- **No completion claims** — never mark a task done until the user explicitly says so
- **No implementation without approval** — never write BE/FE code until the user says to start
- **Debate, don't defer** — raise counterarguments or missed cases before agreeing; no passive "yes"
- **Think before coding** — state assumptions; if multiple interpretations exist, present them, don't pick silently
- **Simplicity first** — minimum code; no speculative abstractions; if 200 lines could be 50, rewrite
- **Surgical changes** — touch only what the request requires; match existing style; remove only orphans your changes made unused
- **Goal-driven execution** — convert tasks into verifiable goals; for multi-step work, plan per-step verification and loop until verified

## Refactoring

A refactor changes structure without changing observable behavior. Refactor and feature change must NOT land together — separate commits/PRs.

- **Before:** state symbols/files/paths to be changed in chat; ensure tests cover affected behavior (write tests first if not).
- **During:** `git mv` for file moves; one refactor at a time.
- **After (in order):** update all references (imports, dynamic strings, config, `docs/specs/**`, plan files, README/CLAUDE.md, comments) → `grep -rn "<old>"` returns 0 hits → typecheck passes → tests pass → exercise the touched surface (UI: browser; API: endpoint).
- **Escalate to `code-reviewer`** only when public API surface changed, ≥3 modules touched, or DB schema/migration involved.

## graphify

Knowledge graph at `graphify-out/`.

- Before architecture/codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files, run `graphify update .` to keep the graph current (AST-only, no API cost)
