# backend/CLAUDE.md

Express REST API for the VOC management system. Read root `CLAUDE.md` first.

**Stack:** Node.js + Express + TypeScript, PostgreSQL with pgvector (`pgvector/pgvector:pg16`), zod v4 (shared `shared/contracts/` schema for FE+BE input validation), Jest + Supertest, tsx (dev runner). Full version list: `docs/specs/requires/requirements.md §3`.

## Commands

```bash
npm run dev                                      # tsx watch
npm run test                                     # Jest
npm run test -- --testPathPattern=filename       # Single test
```

## Implementation Reference

Sources of truth: `docs/specs/requires/requirements.md` (+ `feature-*.md`, `dashboard.md`). `prototype/` is not a backend reference — domain inference, DB schema, and API blueprints all come from spec only.

Before writing an endpoint, define:

- Domain entities + relationships, required / optional fields, enums / statuses.
- API contract — route, method, request / response shape, status codes, error shape.
- Validation rules, auth / permission rules, error cases.

Rules:

- Model APIs by **product behavior** (business concept) — never by UI label.
- Layering: `routes/` → `services/` → `repository/`. Business logic lives outside route handlers.
- Validate every external input. Stable status codes + error shape.
- Support FE state needs: pagination, filtering, sorting, loading-friendly responses, empty / error.
- Forbidden: ambiguous strings, generic catch-all models, one column per UI badge.

Flow: read `requirements.md` / `feature-*.md` → entities + types → API contract → service → persistence → validation / errors → verify FE integration.

## Architecture & Schema

Behavioral contracts (auto-tagging, AD session middleware, sub-task propagation, permission matrix `assertCanManageVoc(user, voc, action)`) and full DB schema DDL live in `docs/specs/requires/requirements.md` and `feature-voc.md §8.4-bis`. Do not duplicate behavioral rules into code comments — link to the spec section.

Notable schema points (full DDL in spec):

- `vocs.embedding vector(1536) NULL` — reserved for future similarity search; MVP does not populate or query. HNSW index added in a later migration.
- `vocs.parent_id` self-join for sub-task hierarchy.
- Initial migration runs `CREATE EXTENSION IF NOT EXISTS vector;` before any table DDL.

## Conventions

Backend-relevant files in `docs/specs/requires/`: `api-conventions.md` (response envelope, auth split) · `routing-conventions.md §10.1` (route list) · `test-conventions.md §17.2` (shared / fixtures parity).

## Sub-tree map

- `config/` — static config loaded at boot. `config/masters/` = master data JSON / CSV (VOC types / statuses / departments). Schema: `shared/contracts/master/`. Spec: `external-masters.md`. Adding / changing a master = file here + matching `shared/fixtures/`.
- `migrations/` — sequential SQL (`NNN_description.sql`). pgvector `CREATE EXTENSION` runs first, before any DDL.
- `seeds/` — DB seed for dev / test, mirrors `shared/fixtures/`. Parity check: `scripts/check-fixture-seed-parity.ts`.
- `src/` — see `src/CLAUDE.md`.
