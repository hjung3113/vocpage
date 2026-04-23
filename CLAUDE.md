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
| Styling | Linear-inspired design system (custom, dark-mode-first) |

## Commands (once scaffolded)

```bash
# Frontend (frontend/)
npm run dev          # Vite dev server
npm run build        # Production build
npm run test         # Vitest
npm run test -- path/to/file.test.ts  # Single test file

# Backend (backend/)
npm run dev          # ts-node-dev watch
npm run test         # Jest
npm run test -- --testPathPattern=filename  # Single test

# Docker
docker compose up    # Start all services (FE + BE + Postgres)
```

## Architecture

The system is a three-tier app: React SPA → Express REST API → PostgreSQL.

**Frontend** (`frontend/`)
- VOC list view (table with hierarchical accordion rows)
- Side drawer for detail view (preserves list context)
- Modal for VOC creation with Toast UI rich text editor
- Key hooks: `useVOCFilter`, `useAutoTag`, `useDrawer`
- State: React Context or Redux for global filter/selection

**Backend** (`backend/`)
- REST CRUD for VOCs, comments, attachments, tags
- `validateADSession` middleware for AD/LDAP authentication
- Auto-tagging service: matches keywords/regex rules from `tag_rules` table → assigns tags on VOC creation
- Hierarchical queries via `parent_id` self-join on the `vocs` table

**Database Schema (key tables)**
- `vocs` — core entity; `parent_id` self-join for sub-tasks
- `tags` + `voc_tags` — M:N tag relationship
- `tag_rules` — keyword/regex patterns driving auto-tagging
- `users`, `comments`, `attachments`

## Design System

The full spec is in `design.md`. Critical tokens:

- **Background palette (OKLCH):** `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--bg-elevated)` — 모두 blue-tinted OKLCH, hex 직접 사용 금지
- **Brand accent (Samsung Blue):** `var(--brand)` / `var(--accent)` / `var(--accent-hover)` — Linear 인디고(`#5e6ad2`) 구 값 사용 금지
- **Text:** `var(--text-primary)` / `var(--text-secondary)` / `var(--text-tertiary)` / `var(--text-quaternary)`
- **Typography:** Pretendard Variable (Korean+Latin UI); D2Coding (issue code, code blocks)
- **Full token reference:** `docs/specs/requires/design.md §10 CSS Reference` — 항상 CSS 커스텀 프로퍼티 사용
- **Spacing:** 8px grid base; max-width ~1200px
- **Elevation:** communicated via background opacity (not shadow darkness) — `rgba(255,255,255,0.05)` for surfaces, multi-layer shadow only for dialogs
- **Components:** Radix UI primitives as base; ghost buttons, translucent cards, border-focused inputs

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
- **Git workflow** — feature branch → PR → merge; never push directly to main
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

| Changed | Must also check |
|---|---|
| Spec (design decision, constraint) | Implementation plan |
| Implementation plan (task added/removed) | Spec section it implements |
| CLAUDE.md (new rule) | Spec if rule affects behavior |

## Session Rules

- **No completion claims** — Never mark a task as done until the user explicitly says so
- **No implementation without approval** — Never write actual BE/FE code until the user explicitly says to start implementation

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
