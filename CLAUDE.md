# CLAUDE.md

## 1. Project & Documents

VOC (Voice of Customer) management system. Three-tier: React SPA → Express REST → PostgreSQL/pgvector. Docker Compose runs all three.

**Canonical sources:**

- Progress: `claude-progress.txt` (first 30 lines) + `docs/specs/plans/next-session-tasks.md` (active + deferred) + `docs/specs/plans/wave-3-admin.md` (active wave) + `docs/specs/plans/followup-bucket.md` (closed-wave follow-ups, `FU-NNN`).
- Spec: `docs/specs/requires/requirements.md` + `feature-*.md`.
- Design: `docs/specs/requires/uidesign.md`.
- Sub-dir maps: `frontend/CLAUDE.md`, `backend/CLAUDE.md` (consult before editing in those trees).

**Implementation reference (2026-05-09~):** `requirements.md` + `uidesign.md` only. `prototype/` is no longer a visual / behavior reference — pixel / DOM / CSS citation forbidden.

**Document rules:**

- Permanent specs in `docs/specs/requires/`. Past history lives in git log + PR descriptions — never in standalone changelog files.
- ID rules: Wave / Phase are append-only integers; sub-decimals forbidden; batch labels are plan-table column metadata, never part of the ID.
- On merge: sync `next-session-tasks.md` + `claude-progress.txt`.
- `CLAUDE.md` / `MEMORY.md` writing: English only, objective and unambiguous, no supplementary commentary or hedging. Root `CLAUDE.md` stays under 200 lines.

**Top-level directories:**

- `benchmark/` — ground-truth PNGs (`01–22-…`) for `scripts/visual-diff.ts`. New screen = baseline + INDEX row.
- `graphify-out/` — auto-generated, do not hand-edit. Refresh: `graphify update .`.
- `scripts/` — utilities (`check-fixture-seed-parity.ts`, `shadcn-token-rewrite.ts`, `visual-diff.ts`).
- `shared/` — `types/` (FE + BE entities / enums) · `contracts/` (zod schemas, single source) · `fixtures/` (MSW + seed, parity enforced) · `openapi.yaml` (REST contract reference).

## 2. Session Workflow

**Start every session:**

1. `claude-progress.txt` (first 30 lines).
2. `next-session-tasks.md` for the current Phase.
3. Relevant spec selectively.
4. Memory index `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — purge entries already in specs / git.

**Input framing (before coding):** state **Goal** (what + why, 1 line) · **Scope** (files in / out) · **Done when** (verifiable conditions) · **Constraints** (style / tokens / patterns). Skip for trivial one-liners.

**Approval scope:** user approval covers its declared scope + reversible items inside. Plan approval → batches OK. Batch approval → leaves OK. Spec-derived → no extra approval. Re-ask on (1) new plan / batch, (2) irreversible not in spec, (3) user contradiction.

**Completion language:** leaves → report what landed, no "done"; phase / wave / PR-merge → wait for explicit user confirmation.

**Session continuity:** every design decision → spec or ADR before session ends. Phase close → `claude-progress.txt` + commit. No implementation without a spec section.

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
- Single-prompt token budget: no single tool call, subagent dispatch, or pasted context may exceed ~50% of the session's running token total. Pull only the slice you need (`offset / limit`, `find_symbol`, `rg -n` with narrow paths); pre-summarize large context before handing it to a subagent; split a bloated request into multiple smaller ops rather than one mega-prompt.

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
- Progress docs at phase / wave close only — intra-phase PRs exempt. The `warn-doc-cleanup-before-pr` hookify checklist applies on `gh pr merge` for phase / wave-close PRs only.

**Refactoring** (structure change without behavior change; never combined with feature change):

- Before: state symbols / files; ensure test coverage (write tests first if not).
- During: `git mv` for moves; one refactor at a time.
- After (in order): update all references → `rg -n "<old>"` returns 0 → Serena ref-check on renames → typecheck → tests → exercise the surface.
- Escalate to `code-reviewer` only on public API change, ≥3 modules, or DB schema / migration.

**Git workflow:** feature branch (`docs/<topic>` / `feat/<topic>` / `fix/<topic>`) before any change; never push to main; PRs opened by user; merge with `gh pr merge <n> --merge --delete-branch` (squash / rebase forbidden); after merge `git branch -D <branch>`. Enforced by `.claude/hookify.block-*.local.md`.

## 4. Agent Skills

- Issues: GitHub Issues — `docs/agents/issue-tracker.md`.
- Triage labels: needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix — `docs/agents/triage-labels.md`.
- Domain docs: single `CONTEXT.md` + `docs/adr/` — `docs/agents/domain.md`.
