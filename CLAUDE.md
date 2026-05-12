# CLAUDE.md

## 1. Project & Documents

VOC (Voice of Customer) management system. Three-tier: React SPA → Express REST → PostgreSQL/pgvector. Docker Compose runs all three.

**Canonical sources:**

- Project state: `.planning/STATE.md` (current milestone + active phase) + `.planning/ROADMAP.md` (all phases) + `.planning/PROJECT.md` (LOCKED decisions). Managed by GSD commands — do not hand-edit.
- Decisions: `docs/adr/` (ADRs are immutable history; LOCKED decisions also surface in `.planning/PROJECT.md` `<decisions>` blocks).
- Spec: `docs/specs/requires/requirements.md` + `feature-*.md` + `*-conventions.md`.
- Design: `docs/specs/requires/uidesign.md`.
- Codebase map: `.planning/codebase/` (refresh via `/gsd-map-codebase`).
- Sub-dir maps: `frontend/CLAUDE.md`, `backend/CLAUDE.md` (consult before editing in those trees).

**Implementation reference (2026-05-09~):** `requirements.md` + `uidesign.md` only. `prototype/` is no longer a visual / behavior reference — pixel / DOM / CSS citation forbidden.

**Document rules:**

- Permanent specs in `docs/specs/requires/`. Past history lives in git log + PR descriptions — never in standalone changelog files.
- Phase / plan / state files in `.planning/` are owned by GSD commands (`/gsd-plan-phase`, `/gsd-execute-phase`, `/gsd-progress`, `/gsd-resume-work`). Hand-edit only when GSD itself produces or asks for it.
- `CLAUDE.md` / `MEMORY.md` writing: English only, objective and unambiguous, no supplementary commentary or hedging. Root `CLAUDE.md` stays under 200 lines.

**Top-level directories:**

- `graphify-out/` — auto-generated, do not hand-edit. Refresh: `graphify update .`.
- `scripts/` — utilities (`check-fixture-seed-parity.ts`, `shadcn-token-rewrite.ts`, `visual-diff.ts`).
- `shared/` — `types/` (FE + BE entities / enums) · `contracts/` (zod schemas, single source) · `fixtures/` (MSW + seed, parity enforced) · `openapi.yaml` (REST contract reference).

## 2. Session Workflow

**Start every session:**

1. `/gsd-progress` (or `/gsd-resume-work`) — restores state from `.planning/STATE.md` + active phase.
2. Relevant spec from `docs/specs/requires/` and ADRs from `docs/adr/` selectively.
3. Memory index `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — purge entries already in specs / git.

**Input framing (before coding):** state **Goal** (what + why, 1 line) · **Scope** (files in / out) · **Done when** (verifiable conditions) · **Constraints** (style / tokens / patterns). Skip for trivial one-liners. Inside a GSD phase, the active PLAN.md provides this framing — only frame manually for ad-hoc work.

**Approval scope:** user approval covers its declared scope + reversible items inside. Plan approval → batches OK. Batch approval → leaves OK. Spec-derived → no extra approval. Re-ask on (1) new plan / batch, (2) irreversible not in spec, (3) user contradiction.

**Completion language:** leaves → report what landed, no "done"; phase / wave / PR-merge → wait for explicit user confirmation.

**Session continuity:** every design decision → ADR (or `.planning/PROJECT.md` `<decisions>` block via GSD) before session ends. Phase progress is tracked by GSD in `.planning/STATE.md` + phase manifest — no separate progress file. No implementation without a spec section.

## 3. Engineering Rules

**Tool routing:**

- TS / TSX symbol / refs / rename → Serena.
- Cross-file keyword / file discovery → `rg -n`.
- Small known range → `Read` with `offset / limit`.
- Architecture / dependency flow → Graphify (required once before wide refactor or unfamiliar feature). Knowledge graph at `graphify-out/`; prefer `wiki/index.md` over raw files; queries via `/graphify query|path|explain`. After code edits: `graphify update .`.
- Never `cat <file>` to dump source; never `Read` whole TS / TSX file when `find_symbol` works; never re-read a file already in context (modified files OK).

**Execution:**

- Parallel tool calls: independent calls go in one message. Gate: "Can I write call B's args before A runs?" — if yes, batch. Common violations + exceptions: `.claude/specs/parallel-dispatch.md`.
- Tail test output: `| tail -20`; never full traces.
- No `Read` before delete: just `rm`.
- First-pass git log: `--all` + wide keywords; never narrow on retry.
- Minimum context for judgment: single most relevant file first.
- Before editing: summarize selected files / symbols + why.
- Single-prompt token budget (applies to Claude's outgoing ops only — never gates user input): no single tool call, subagent dispatch, or pasted context may exceed ~50% of the session's running token total. Pull only the slice you need (`offset / limit`, `find_symbol`, `rg -n` with narrow paths); pre-summarize large context before handing it to a subagent; split a bloated request into multiple smaller ops rather than one mega-prompt.

**Reversibility gate:**

- **Irreversible**: DB schema / migration, public API contract (`shared/openapi.yaml`, `shared/contracts/**`), merged commits, external comms, file deletes, auth / billing / permissions / tenant boundary. → stop and ask, ≥90% confidence required.
- **Reversible**: code / style / test in unmerged branch, file moves, naming, local refactors. → state assumption in 1 line, proceed, report in summary.
- **Visual surface** (affecting `/voc`): if it diverges from `uidesign.md` tokens / structure, it is irreversible — token-definition changes require a spec update first.

**Testing & quality:**

- TDD for irreversible surface (auth / billing / permissions / contracts / migrations / BE routes): test first, confirm fail, implement. Bug fix = failing regression test first. Stack: Vitest (FE) / Jest + Supertest (BE) — `requirements.md §3`.
- Smoke test for reversible UI: one happy-path render test + visual-diff baseline.
- Debate, don't defer: raise counterarguments before agreeing.
- Think before coding: state assumptions; surface multiple interpretations.
- Simplicity first; surgical changes; goal-driven verification per step. YAGNI. Match nearby code style.
- Pre-commit: `npm run lint -w frontend` once before first commit. Tests before commit.
- Progress docs at phase / wave close only — intra-phase PRs exempt.

**Refactoring** (structure change without behavior change; never combined with feature change):

- Before: state symbols / files; ensure test coverage (write tests first if not).
- During: `git mv` for moves; one refactor at a time.
- After (in order): update all references → `rg -n "<old>"` returns 0 → Serena ref-check on renames → typecheck → tests → exercise the surface.
- Escalate to `code-reviewer` only on public API change, ≥3 modules, or DB schema / migration.

## 4. Agent Skills

- Issues: GitHub Issues — `docs/agents/issue-tracker.md`.
- Triage labels: needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix — `docs/agents/triage-labels.md`.
- Domain docs: single `CONTEXT.md` + `docs/adr/` — `docs/agents/domain.md`.
