# CLAUDE.md

## Project

VOC (Voice of Customer) management system. Three-tier: React SPA → Express REST → PostgreSQL/pgvector. Docker Compose runs all three.

- Progress: `claude-progress.txt` (first 30 lines) → `docs/specs/plans/next-session-tasks.md`
- Spec: `docs/specs/requires/requirements.md` + `feature-*.md`
- Design: `docs/specs/requires/uidesign.md`
- Sub-dir maps: `frontend/CLAUDE.md`, `backend/CLAUDE.md` (consult before editing in those trees)

Implementation reference (2026-05-09~): `requirements.md` + `uidesign.md` only. `prototype/` is no longer a visual/behavior reference — pixel/DOM/CSS citation forbidden.

## Design System (canonical)

Full spec: `docs/specs/requires/uidesign.md` (§10 CSS Reference, §12 Token Architecture, §15 Agent Prompt Guide).

- All colors via `var(--token)` — never hex/OKLCH literals
- Typography: Pretendard Variable (UI), D2Coding (code/issue IDs)
- 8px grid, max-width ~1200px, elevation via background opacity not shadow darkness

### `uidesign.md` 단독 정책 (이 한 곳에서만 정의 — 복제 금지)

**포함**: 토큰 정의·use rule, 컴포넌트 visual contract, §15 Agent Prompt Guide.
**금지**: 구현 경로(`frontend/src/...`, `*.tsx`, `tokens.ts`) · 빌드/린트 툴명(Stylelint/ESLint/husky) · Wave/Phase/PR 번호·날짜 · 동작·라우팅·상태 contract(→ `feature-*.md`) · 스키마·migration(→ `requirements.md`). 발견 시 leak 으로 즉시 분리.

**FE 작업 절대 룰**: visual surface 를 만지면 `uidesign.md` 를 먼저 읽고 기존 토큰 contract 를 확인한 뒤 코드 작성. 새 토큰이 필요하면 spec 갱신을 같은 PR(또는 직전 PR)에서 끝낸다. 컴포넌트 신설은 §15 예시를 베이스로.

## Start Every Session

1. `claude-progress.txt` (first 30 lines)
2. `next-session-tasks.md` for current Phase
3. Relevant spec selectively
4. Memory index `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/memory/MEMORY.md` — purge entries already in specs/git

## Core Rules

- **Tool routing**:
  - TS/TSX symbol/refs/rename → Serena
  - Cross-file keyword/file discovery → `rg -n`
  - Small known range → `Read` with `offset/limit`
  - Architecture / dependency flow → Graphify (required once before wide refactor or unfamiliar feature)
  - Never `cat <file>` to dump source; never `Read` whole TS/TSX file when `find_symbol` works; never re-read a file already in context (modified files OK)
- **Parallel tool calls**: independent calls go in one message. Gate: "Can I write call B's args before A runs?" — if yes, batch. Common violations + exceptions: `.claude/specs/parallel-dispatch.md`.
- **Tail test output**: `| tail -20`; never full traces
- **No Read before delete**: just `rm`
- **First-pass git log**: `--all` + wide keywords; never narrow on retry
- **Minimum context for judgment**: single most relevant file first
- **Before editing**: summarize selected files/symbols + why
- **Git workflow**: feature branch (`docs/<topic>` / `feat/<topic>` / `fix/<topic>`) **before** any change; never push to main; PRs opened by user; merge with `gh pr merge <n> --merge --delete-branch` (squash/rebase forbidden); after merge `git branch -D <branch>`. Enforced by `.claude/hookify.block-*.local.md`.
- Tests before commit; match nearby code style; YAGNI
- This file stays under 200 lines

## Session Continuity

Every design decision → spec or ADR before session ends. Phase close → `claude-progress.txt` + commit. No implementation without a spec section.

## Documents

진행 상황 = `claude-progress.txt` (첫 30줄, current pointer) + `docs/specs/plans/next-session-tasks.md` (활성 작업 + 이연) + `docs/specs/plans/wave-3-admin.md` (활성 Wave 상세) + `docs/specs/plans/followup-bucket.md` (closed-wave 후속 FU-NNN). 영구 spec = `docs/specs/requires/`. 과거 이력은 git log + PR description (별도 파일 보관 금지). ID = Wave/Phase 정수 append-only, sub-decimal 금지, batch 그룹은 plan 표 column 일 뿐 ID 아님, closed wave 후속은 FU-NNN. 머지 시 `next-session-tasks.md` + `claude-progress.txt` 동기화.

## Input Interpretation

Before coding, frame: **Goal** (what + why, 1 line) · **Scope** (files in/out) · **Done when** (verifiable conditions) · **Constraints** (style/tokens/patterns). Skip for trivial one-liners.

## Working Style

### Reversibility gate

- **Irreversible**: DB schema/migration, public API contract (`shared/openapi.yaml`, `shared/contracts/**`), merged commits, external comms, file deletes, auth/billing/permissions/tenant boundary. → stop and ask, ≥90% confidence required.
- **Reversible**: code/style/test in unmerged branch, file moves, naming, local refactors. → state assumption in 1 line, proceed, report in summary.
- **Visual surface** (영향 `/voc`): `uidesign.md` 토큰·구조와 어긋나면 irreversible — 토큰 정의 변경은 spec 갱신 선결.

### Engineering

- **TDD for irreversible surface** (auth/billing/permissions/contracts/migrations/BE routes): test first, confirm fail, implement. Bug fix = failing regression test first. Stack: Vitest (FE) / Jest+Supertest (BE) — `requirements.md §3`.
- **Smoke test for reversible UI**: one happy-path render test + visual-diff baseline.
- **Debate, don't defer**: raise counterarguments before agreeing.
- **Think before coding**: state assumptions; surface multiple interpretations.
- **Simplicity first**; **surgical changes**; **goal-driven verification per step**.
- **Pre-commit**: `npm run lint -w frontend` once before first commit.
- **Progress docs at phase/wave close only** — intra-phase PRs exempt. `warn-doc-cleanup-before-pr` hookify 8-step checklist applies only on phase/wave-close PR.

### Approval scope

User approval covers its declared scope + reversible items inside. Plan approval → batches OK. Batch approval → leaves OK. Spec-derived → no extra approval. Re-ask on (1) new plan/batch, (2) irreversible not in spec, (3) user contradiction.

Completion language: leaves → report what landed, no "done"; phase/wave/PR-merge → wait for explicit user confirmation.

## Refactoring

Refactor = structure change without behavior change. Refactor + feature change MUST NOT land together.

- **Before**: state symbols/files; ensure test coverage (write tests first if not).
- **During**: `git mv` for moves; one refactor at a time.
- **After (in order)**: update all references → `rg -n "<old>"` returns 0 → Serena ref-check on renames → typecheck → tests → exercise the surface.
- **Escalate to `code-reviewer`** only on public API change, ≥3 modules, or DB schema/migration.

## Graphify

Knowledge graph at `graphify-out/`. Use for architecture / dependency / cross-domain flow questions. Prefer `wiki/index.md` over raw files; queries via `/graphify query|path|explain`. After code edits: `graphify update .`.

## Top-level directories

- `benchmark/` — ground-truth PNGs (`01–22-…`) for `scripts/visual-diff.ts`. New screen = baseline + INDEX row.
- `graphify-out/` — auto-generated, do not hand-edit. Refresh: `graphify update .`.
- `scripts/` — utilities (`check-fixture-seed-parity.ts`, `shadcn-token-rewrite.ts`, `visual-diff.ts`).
- `shared/` — `types/` (FE+BE entities/enums) · `contracts/` (zod schemas, single source) · `fixtures/` (MSW+seed, parity enforced) · `openapi.yaml` (REST contract reference).

## Agent skills

- Issues: GitHub Issues — `docs/agents/issue-tracker.md`
- Triage labels: needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix — `docs/agents/triage-labels.md`
- Domain docs: single `CONTEXT.md` + `docs/adr/` — `docs/agents/domain.md`
