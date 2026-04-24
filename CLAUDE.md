# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **greenfield VOC (Voice of Customer) management system** currently in the design/requirements phase. No source code exists yet. See `docs/specs/requires/requirements.md` for the product spec and `docs/specs/requires/design.md` for the complete design system.

## Planned Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript, Vite, Toast UI Editor |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Testing | Vitest (frontend), Jest + Supertest (backend) |
| Container | Docker + Docker Compose |
| Styling | Tailwind CSS v4 + CSS custom properties (혼용) — `tokens.ts` 단일 소스 |

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

Full spec: `docs/specs/requires/design.md`. Full token reference: §10 CSS Reference.

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

## Core Rules

- **Grep/Glob before Read** — search first, never read full files to find one function
- **Parallel tool calls** — independent tool calls go in one message, not sequential
- **No re-read** — never re-read a file already in session context (exception: modified files)
- **Tail test output** — pipe test output through `| tail -20`; never print full traces
- **Git workflow** — **항상 feature 브랜치를 먼저 생성**한 뒤 커밋·푸시하고 PR을 열 것. main에 직접 커밋/푸시 절대 금지. 브랜치 네이밍: `docs/<topic>`, `feat/<topic>`, `fix/<topic>`.
- Run tests before committing; follow existing code style (read 2-3 nearby files first)
- No features beyond what the task requires (YAGNI)
- CLAUDE.md stays under 200 lines

## Session Continuity

Every design decision → written to spec or ADR before session ends.
Every phase completion → update `claude-progress.txt` + git commit.
No implementation without a written spec section covering it.

## Document Structure

모든 설계·리뷰·구현 문서는 `docs/specs/` 하위에 관리한다. 루트에 문서 파일을 두지 않는다.

```
docs/specs/
├── requires/   # 요구사항·설계 스펙 (requirements.md, design.md 등)
├── plans/      # 기능별 구현 계획 (dashboard-feature.md 등)
└── reviews/    # 리뷰·브레인스토밍 결과물
```

### Document Roles

| File | Language | Scope |
|------|----------|-------|
| `docs/specs/requires/design.md` | **English only** | Visual design system — color tokens, typography, component specs, layout rules, spacing, elevation, UI do's/don'ts |
| `docs/specs/requires/requirements.md` | 한국어 | Functional requirements — feature specs, behavioral rules, data model, API design, business logic |

- 새 기능 계획 → `docs/specs/plans/<feature-name>.md`
- 리뷰·브레인스토밍 → `docs/specs/reviews/<topic>.md`
- **Never put functional/behavioral spec in `design.md`**
- **Never put visual design rules in `requirements.md`**
- `design.md` must always be written in English
- **`.omc/plans/`, `.superpowers/` 등 툴 작업 디렉토리는 임시 공간 — canonical 문서는 항상 `docs/specs/`**

## Document Coherence

**Write decisions to the right file first:**

| Decision made | Write to |
|---|---|
| Visual design change (color, layout, spacing, component pattern) | `docs/specs/requires/design.md` (English) |
| Functional/behavioral change (feature rule, API shape, business logic) | `docs/specs/requires/requirements.md` or relevant `feature-*.md` (한국어) |

**Then check propagation:**

| Changed | Must also check |
|---|---|
| Spec (design decision, constraint) | Implementation plan |
| Implementation plan (task added/removed) | Spec section it implements |
| CLAUDE.md (new rule) | Spec if rule affects behavior |

## Session Rules

- **No completion claims** — Never mark a task as done until the user explicitly says so
- **No implementation without approval** — Never write actual BE/FE code until the user explicitly says to start implementation
- **Debate, don't defer** — 사용자 말이 항상 정답이라고 가정하지 말 것. 스펙·설계 결정에서 반대 논거·트레이드오프·놓친 케이스가 보이면 동의하기 전에 짚고 토론한다. 수동적 "네" 금지 — 엔지니어 대 엔지니어로 반박/확인/대안 제시.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
