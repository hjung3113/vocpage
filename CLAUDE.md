# CLAUDE.md

Guidance for Claude Code in this repo.

## Project

**VOC (Voice of Customer) management system.**

- Current progress: `claude-progress.txt` (first 30 lines) → `docs/specs/plans/next-session-tasks.md`
- Product spec: `docs/specs/requires/requirements.md`
- Design system: `docs/specs/requires/uidesign.md`

Do not record phase/wave progress in this file — canonical source is the progress + plan docs above.

## Stack (summary — details in sub-dir CLAUDE.md)

Three-tier app: React SPA → Express REST API → PostgreSQL.

- Frontend: React + TypeScript + Vite + Tailwind v4 → `frontend/CLAUDE.md`
- Backend: Node + Express + TypeScript + PostgreSQL/pgvector → `backend/CLAUDE.md`
- Prototype: static HTML visual sandbox → `prototype/CLAUDE.md`
- Container: Docker Compose (`docker compose up` starts FE + BE + Postgres)

**Rule:** folder-level `CLAUDE.md` files are the project map. Before code investigation or editing, use this root file plus the nearest relevant sub-directory `CLAUDE.md` files to choose likely folders/domains. This file covers cross-cutting governance only.

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
5. Review `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — delete entries already reflected in specs or git

## Core Rules

- **Tool routing — match task to tool, picking the wrong tool wastes tokens and is itself a rule violation:**
  - TS/TSX symbol body / references / rename → **Serena** (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`, `rename_symbol`)
  - Cross-file keyword / literal / error string / file discovery → **`rg -n`**
  - Known small range or tight cluster needing imports+body together → **`Read`** with `offset`/`limit` (or `sed -n 'A,Bp'`)
  - Architecture map / dependency graph / UI→API→DB flow / "what connects to X" → **Graphify** — required at least once before a wide refactor or first entry into an unfamiliar feature; details below
  - **Never** `cat <file>` to dump source, **never** `Read` a whole TS/TSX file you could `find_symbol` instead, **never** re-read a file already in context. Exception: config/JSON under ~1KB.
- **Parallel tool calls** — independent tool calls MUST go in one single message, never sequential. Gate: "Can I write call B's exact arguments right now, before call A runs?" — if yes, batch it. Common violations: (1) typecheck + test as separate Bash calls (use `&&` instead); (2) consecutive Read calls on unrelated files; (3) consecutive Bash greps; (4) sequential subagent dispatches. Full violation patterns, exceptions, and rationalization table: `.claude/specs/parallel-dispatch.md`.
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe through `| tail -20`; never print full traces
- **No Read before delete** — files being deleted must never be Read first; just `rm`
- **Broad git history first pass** — use `--all` and wide keywords on first `git log --grep`; never retry with a narrower pattern
- **Minimum context for decisions** — for judgment tasks, use only the single most relevant file; open supporting files only if the first is insufficient
- **Before editing** — summarize selected files/symbols and why they are in scope
- **Git workflow** — Create the feature branch (`docs/<topic>` / `feat/<topic>` / `fix/<topic>`) **before** making any changes; never work on main then move commits after. Never commit or push to main directly. PRs are opened by the user. Merge with `gh pr merge <n> --merge --delete-branch` (`--squash` and `--rebase` forbidden). After merge: `git branch -D <branch>`. Enforced by hookify rules in `.claude/hookify.block-*.local.md`.
- Run tests before committing; follow existing code style (read 2–3 nearby files first)
- No features beyond what the task requires (YAGNI)
- CLAUDE.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Documents

Documentation hygiene canonical source: **`docs/specs/README.md`**. Consult it before creating, moving, or cleaning up any doc.

**Index IDs (Wave / Phase / Task / FU)** — when assigning, citing, or closing any ID, consult these three canonical sources:

- Rules — `docs/specs/README.md §7` (R1–R7: append-only / flat integer / grouping is metadata / Issue# is cross-ref / no bundle IDs / closed waves use FU bucket / one work unit per ID)
- Wave lineage + batch glossary — `docs/specs/plans/wave-index.md`
- Follow-up flat-ID register — `docs/specs/plans/followup-bucket.md`

Before assigning a new ID, check the next free integer in `wave-index.md`. Follow-ups against closed waves get the next `FU-NNN` in `followup-bucket.md`. On merge, update the status column in both docs and sync the first 30 lines of `claude-progress.txt`.

## Input Interpretation

Normalize a request into this frame before coding. Ask only about items that materially affect the result; otherwise state the assumption and proceed.

- **Goal** — what + why (one line)
- **Scope** — files/paths involved; what _not_ to touch
- **Done when** — verifiable conditions (test passes, build clean, observable behavior)
- **Constraints** — style, tokens, dependencies, existing patterns

Skip the frame for trivial one-liners (rename, obvious typo, single-file change with explicit path).

## Working Style

### Reversibility gate (apply before any pause)

Classify the decision first; the gate level follows the class.

- **Irreversible** — DB schema/migration, public API contract (`shared/openapi.yaml`, `shared/contracts/**`), merged commits, external comms (push, PR merge, issue/comment), file deletes, anything touching auth / billing / permissions / tenant boundary.
- **Reversible** — code/style/test changes inside an unmerged feature branch, file moves within the working tree, naming choices, local refactors.

Rules:

- **Irreversible**: stop and ask. State both options + rationale. No proceeding under 90% confidence.
- **Reversible**: state the assumption in one line, proceed, report what was done in the end-of-turn summary. Do not block on user response for reversible decisions.
- **Visual-surface decisions** (anything affecting `/voc` parity, prototype-as-reference output) are treated as irreversible during a parity wave (currently Wave 1.6) — keep the gate.

### Engineering rules

- **TDD for irreversible surface** — auth, billing, permissions, contracts, migrations, BE routes: write the test first, confirm it fails, then implement. Bug fixes start with a failing regression test. Stack: Vitest (FE) / Jest+Supertest (BE) — see `requirements.md §3`.
- **Smoke test for reversible UI** — components and styles only need a single happy-path render test plus the visual-diff baseline. Don't author exhaustive unit tests for trivial JSX.
- **Debate, don't defer** — raise counterarguments or missed cases before agreeing; no passive "yes".
- **Think before coding** — state assumptions; if multiple interpretations exist, present them, don't pick silently.
- **Simplicity first** — minimum code; no speculative abstractions; if 200 lines could be 50, rewrite.
- **Surgical changes** — touch only what the request requires; match existing style; remove only orphans your changes made unused.
- **Goal-driven execution** — convert tasks into verifiable goals; for multi-step work, plan per-step verification and loop until verified.
- **Pre-commit lint dry-run** — before the first `git commit`, run `npm run lint -w frontend` once. Fix and re-stage on failure to avoid a husky retry loop. (Backend lint script is undefined — same pattern applies once added.)
- **Progress docs at phase/wave close only** — sync `claude-progress.txt` + the relevant plan doc on the same branch only when the PR closes a phase or wave. Intra-phase PRs are exempt; do not commit progress diffs for every leaf. The `warn-doc-cleanup-before-pr` hookify rule fires on every `gh pr` — apply its 8-step checklist only if this PR is a phase/wave-close PR.

### Approval scope

A user approval applies to its declared scope and everything reversible inside it:

- **Plan approval** → all batches in that plan are approved; per-batch ack not required
- **Batch approval** → all leaves in that batch are approved; per-leaf ack not required
- **Spec-derived implementation** → no extra approval needed; the spec is the approval

Re-ask only when (1) crossing into a new plan/batch, (2) hitting an irreversible decision not covered by the spec, or (3) the user contradicts the prior approval.

Completion language:

- For leaves and intra-batch work: report what landed in the end-of-turn summary, do not declare "done".
- For phase / wave / PR-merge milestones: wait for explicit user confirmation before declaring closure.

## Refactoring

A refactor changes structure without changing observable behavior. Refactor and feature change must NOT land together — separate commits/PRs.

- **Before:** state symbols/files/paths to be changed in chat; ensure tests cover affected behavior (write tests first if not).
- **During:** `git mv` for file moves; one refactor at a time.
- **After (in order):** update all references (imports, dynamic strings, config, `docs/specs/**`, plan files, README/CLAUDE.md, comments) → `rg -n "<old>"` returns 0 hits → Serena reference checks when symbols moved/renamed → typecheck passes → tests pass → exercise the touched surface (UI: browser; API: endpoint).
- **Escalate to `code-reviewer`** only when public API surface changed, ≥3 modules touched, or DB schema/migration involved.

## Graphify

Knowledge graph at `graphify-out/`. Triggered by the routing rule above (architecture / dependency / cross-domain flow questions only). Prefer `graphify-out/wiki/index.md` over raw files; specific queries via `/graphify query|path|explain`. After modifying code files, run `graphify update .` to keep the graph current.

## Top-level directories

- `benchmark/` — visual ground-truth PNGs (`01-…`–`22-…`) compared by `scripts/visual-diff.ts`. Index: `INDEX.md`. New screen = baseline + INDEX row.
- `graphify-out/` — auto-generated knowledge-graph output. Do not hand-edit. Architecture/community Q → `GRAPH_REPORT.md` or `wiki/index.md`. Refresh: `graphify update .`.
- `scripts/` — repo utilities. Fixture↔seed parity: `check-fixture-seed-parity.ts`. Shadcn token rewrite: `shadcn-token-rewrite.ts`. Visual diff: `visual-diff.ts` + `visual-diff/` (helpers + `__tests__/`).
- `shared/` — types/zod-schemas/fixtures used by **both** FE+BE.
  - `shared/types/` — TS domain entities/enums/response shapes. Single-side types stay in that side.
  - `shared/contracts/` — zod schemas (FE forms + BE route input, single source). Sub-trees: `voc/`, `notification/`, `master/` (source data in `backend/config/masters/`).
  - `shared/fixtures/` — FE MSW + BE seed shared data; parity enforced by `scripts/check-fixture-seed-parity.ts`.
  - REST contract reference → `shared/openapi.yaml`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` at the repo root + `docs/adr/`. See `docs/agents/domain.md`.
