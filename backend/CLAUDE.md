# backend/CLAUDE.md

Express REST API for the VOC management system. Read root `CLAUDE.md` first for cross-cutting governance.

**Stack:** Node.js + Express + TypeScript, PostgreSQL with pgvector extension (`pgvector/pgvector:pg16`), zod v4 (shared/ 계약 — FE와 단일 schema 공유, 라우트 입력 검증), Jest + Supertest (test), tsx (dev runner). **TDD 필수** (root CLAUDE.md). 전체 OSS·버전: `docs/specs/requires/requirements.md §3`.

## Status

Phase 8 Wave 1.5-β merged (POST /api/vocs + history routes). `src/` layout follows route → controller → service → repository: `index.ts`, `db.ts`, `logger.ts`, `auth/` (mockLogin only — `validateADSession` is a stub for Phase 9), `routes/`, `controllers/`, `services/`, `repository/`, `middleware/`, `validators/`. Migrations 001-013 applied (013 = dev role + voc origin metadata). Next: Wave 2 — see `docs/specs/plans/next-session-tasks.md`.

## Commands

```bash
npm run dev                                      # tsx watch
npm run test                                     # Jest
npm run test -- --testPathPattern=filename       # Single test
```

## Working from the Prototype

The frontend prototype (`prototype/`) is a **product/UX reference**, not a backend spec. Treat it as evidence of real requirements — never as a DB schema or API blueprint.

Infer backend needs from: pages, user actions, forms, displayed data, filters/sorting, status values, empty/error states, permission hints.

Before coding an endpoint, define:

- Domain entities + relationships, required/optional fields, enums/statuses
- API contract (route, method, request/response shape, status codes, error shape)
- Validation rules, auth/permission rules, error cases

Rules:

- Design APIs around **product behavior**, not UI layout — models reflect business concepts, not screen labels
- Keep business logic out of route handlers (route → service → repository)
- Validate all external input; use clear status codes and stable error shapes
- Support FE states: pagination, filtering, sorting, loading-friendly responses, empty/error semantics
- Avoid vague strings, generic models, and prototype-driven DB design (e.g., a column per UI badge)

Flow: review prototype behavior → define entities/types → design API contract → service logic → persistence → validation/errors → confirm FE integration.

## Architecture

Planned (Phase 8 implementation):

- REST CRUD for VOCs, comments, attachments, tags.
- Auth: dev uses `POST /api/auth/mock-login` (4 roles: admin/manager/dev/user). `validateADSession` / OIDC = Phase 9.
- Auto-tagging service: keyword/regex rules from `tag_rules` → assigns tags on VOC creation.
- Hierarchical queries via `parent_id` self-join on `vocs` (sub-task trees).
- `assertCanManageVoc(user, voc, action)` is the single permission helper — see `feature-voc.md §8.4-bis`.

## Database Schema

- **PostgreSQL + pgvector extension** — Docker image `pgvector/pgvector:pg16`. Initial migration must run `CREATE EXTENSION IF NOT EXISTS vector;` before any table DDL.
- `vocs` — core entity; `parent_id` self-join for sub-tasks. Includes `embedding vector(1536) NULL` column reserved for future similarity search / RAG — **MVP does not populate or query this column**. HNSW index added in a later migration when the feature lands.
- `tags` + `voc_tags` — M:N tag relationship.
- `tag_rules` — keyword/regex patterns driving auto-tagging.
- `users` — identity; linked to AD session on login.
- `comments` — FK → `vocs.id`.
- `attachments` — FK → `vocs.id`; file metadata only, blob in object storage.
- `users.role` — enum `admin`/`manager`/`dev`/`user` (migration 012).
- `notices` / `faqs` / `faq_categories` — content tables (migration 005).
- `voc_internal_notes` — admin/manager-only annotations (User → 404 fail-closed).
- `voc_payload_reviews` — Result Review flow with `review_status` enum.

Full schema DDL and column-level spec: `docs/specs/requires/requirements.md` (data model section).

## Business Rules (cross-reference)

Behavioral contracts (what auto-tagging does, what the AD session middleware rejects, sub-task propagation rules) live in `docs/specs/requires/requirements.md`. **Do not duplicate behavioral rules into code comments** — link to the spec section.

## Sub-tree map

- `config/` — static config loaded at boot. `config/masters/` = master data JSON/CSV (VOC types/statuses/departments). Schema: `shared/contracts/master/`. Spec: `external-masters.md`. Adding/changing master = file here + matching `shared/fixtures/`.
- `migrations/` — sequential SQL (`NNN_description.sql`). Current = latest numbered (013 = dev role + voc origin metadata). pgvector `CREATE EXTENSION` runs first before any DDL.
- `seeds/` — DB seed for dev/test, mirrors `shared/fixtures/`. Parity check: `scripts/check-fixture-seed-parity.ts`.
- `src/` — see `src/CLAUDE.md`.
