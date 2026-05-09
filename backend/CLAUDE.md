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

## Implementation Reference (2026-05-09~)

정본은 `docs/specs/requires/requirements.md` (+ 보조 `feature-*.md`, `dashboard.md`). `prototype/` 디렉터리는 더 이상 backend reference 가 아니다 — 도메인 추론·DB 스키마·API blueprint 모두 spec 만 본다.

엔드포인트 작성 전 정의:

- Domain entities + relationships, required/optional fields, enums/statuses
- API contract (route, method, request/response shape, status codes, error shape)
- Validation rules, auth/permission rules, error cases

Rules:

- API는 **product behavior** 기준 — UI label 이 아닌 business concept 으로 모델링
- route → service → repository, 비즈니스 로직은 route handler 밖
- 모든 외부 입력 검증; status code · error shape 안정적
- FE 상태 지원: pagination, filtering, sorting, loading-friendly responses, empty/error
- 모호한 string / 제네릭 모델 / UI 배지마다 컬럼 두는 식의 설계 금지

Flow: read requirements/feature-\*.md → entities/types → API contract → service → persistence → validation/errors → FE integration 확인.

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

## Conventions

Backend-relevant convention files in `docs/specs/requires/`: `api-conventions.md` (response envelope target, auth split boundary) · `routing-conventions.md §10.1` (route list) · `test-conventions.md §17.2` (shared/fixtures parity rules).

## Sub-tree map

- `config/` — static config loaded at boot. `config/masters/` = master data JSON/CSV (VOC types/statuses/departments). Schema: `shared/contracts/master/`. Spec: `external-masters.md`. Adding/changing master = file here + matching `shared/fixtures/`.
- `migrations/` — sequential SQL (`NNN_description.sql`). Current = latest numbered (013 = dev role + voc origin metadata). pgvector `CREATE EXTENSION` runs first before any DDL.
- `seeds/` — DB seed for dev/test, mirrors `shared/fixtures/`. Parity check: `scripts/check-fixture-seed-parity.ts`.
- `src/` — see `src/CLAUDE.md`.
