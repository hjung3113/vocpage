# External Integrations

**Analysis Date:** 2026-05-10

## APIs & External Services

**Internal REST API:**
- VOCPage backend (Express) — single internal API consumed by the SPA
  - Contract: `shared/openapi.yaml` (OpenAPI 3.1.0, `servers: /api`)
  - Generated client types: `shared/types/api.ts` (via `npm run codegen` → `openapi-typescript`)
  - Browseable at runtime: `GET /api/docs` (Swagger UI, `backend/src/index.ts:63`)
  - Tagged route groups: `auth`, `health`, `vocs`, `comments`, `notes`, `attachments`, `tags`, `notifications`, `dashboard`, `admin`, `files`

**External SDKs/services:**
- No third-party SaaS SDKs detected (no Stripe, no AWS SDK, no Sentry, no Supabase, etc.)
- MSSQL (read-only) — optional upstream master-data source (설비/DB/프로그램 마스터). Disabled when env vars empty (falls back to disk snapshot). Configured via `MSSQL_HOST`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`.

## Data Storage

**Primary database:**
- PostgreSQL 16 with pgvector — Docker image `pgvector/pgvector:pg16` (`docker-compose.yml`)
- Connection: `DATABASE_URL` env var (e.g. `postgresql://vocpage:***@postgres:5432/vocpage`)
- Client: `pg` ^8.20.0 (connection pool in `backend/src/db.ts`)
- Host port mapping: `5433:5432`
- Extensions enabled in `backend/migrations/001_extensions.sql`:
  - `vector` — pgvector for `vocs.embedding vector(1536)` (reserved for future similarity search; HNSW index in later migration)
  - `uuid-ossp` — `uuid_generate_v4()`
- Migrations: sequential SQL files `backend/migrations/001_extensions.sql` … `020_tags_name_kind_unique.sql`, run via `node-pg-migrate up -m migrations`
- Seeds: `backend/seeds/dev_seed.sql`, `backend/seeds/mock-users.sql` (run via `psql $DATABASE_URL -f …`)
- Parity check: `scripts/check-fixture-seed-parity.ts` enforces `shared/fixtures/` ↔ `backend/seeds/` alignment (`npm run check:parity`)

**Session store:**
- `express-session` — backend reads `SESSION_STORE_URL` (defaults to same Postgres). 8-hour cookie TTL, `httpOnly`, `sameSite: strict`, `secure` in production (`backend/src/index.ts`).

**File storage:**
- Local filesystem only — Docker named volume `uploads_data` mounted at `/app/backend/uploads` (`docker-compose.yml`)
- Postgres data volume: `postgres_data:/var/lib/postgresql/data`

**Caching:**
- In-process master cache only — `initMasterCache()` boot step in `backend/src/index.ts` (cold-start safe, never throws). Source: MSSQL when configured, else disk snapshot. No Redis/Memcached.

## Authentication & Identity

**Auth strategy (env-toggled):**
- `AUTH_MODE=mock` — fixed mock user for dev (`backend/src/auth/mockAuth.ts`, `backend/src/auth/mockUsers.ts`)
- `AUTH_MODE=oidc` — placeholder; currently throws `OIDC auth not implemented` (`backend/src/auth/oidcAuth.ts`). Intended target: AD/LDAP via OIDC.
- Selection: `backend/src/auth/index.ts::createAuthMiddleware()` invoked at boot — fail-fast on misconfiguration.
- Session: `express-session` cookie (`SESSION_SECRET`); production requires `SESSION_SECRET` env var.
- Frontend mirror: `VITE_AUTH_MODE` env var.

**Authorization:**
- Role-based — `backend/src/middleware/requireRole.ts`
- VOC permission predicate: `assertCanManageVoc(user, voc, action)` (services/permissions/, behavioral spec in `docs/specs/requires/feature-voc.md §8.4-bis`)
- Roles include `dev` (added in migration `013_add_dev_role.sql`)
- Role change audit: `017_user_role_log.sql`

## Monitoring & Observability

**Error tracking:**
- None (no Sentry/Datadog/Rollbar SDK detected). Errors flow through `backend/src/middleware/errorHandler.ts` + `errorEnvelope.ts`.

**Logs:**
- `pino` ^10.3.1 + `pino-http` ^11.0.0 — structured JSON logs (`backend/src/logger.ts`, used in `backend/src/index.ts` via `pinoHttp({ logger })`)
- Pretty printing in dev: `pino-pretty` ^13.1.3
- Log level: `LOG_LEVEL` env var (`debug | info | warn | error`)

**Health check:**
- `GET /api/health` — returns `{ status, db, uptime }` (defined in `shared/openapi.yaml`)
- Docker healthchecks: postgres uses `pg_isready`; backend probes `/api/health` (`docker-compose.yml`)

## CI/CD & Deployment

**Hosting:**
- Containerized — `docker-compose.yml` orchestrates `postgres`, `backend` (port 3001:3000), `frontend` (port 5173:5173)
- Both app images: `node:22-alpine`, `development` build target as committed
- Backend container entrypoint: `backend/entrypoint.sh`

**CI Pipeline:**
- No `.github/workflows/` files inspected in this scan; git-side hooks only via `husky` + `lint-staged` (`package.json`).
- Pre-commit: ESLint + Prettier on `*.{ts,tsx}`; Stylelint + Prettier on `*.{css,scss}`; Prettier on `*.{json,md,js,cjs,mjs}`.

## Environment Configuration

**Required env vars (per `.env.example`):**
- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`
- Auth: `AUTH_MODE` (`mock`|`oidc`), `SESSION_SECRET`, `SESSION_STORE_URL`
- HTTP: `CORS_ORIGIN` (default `http://localhost:5173`), `PORT` (3000 in container)
- External masters (optional): `MSSQL_HOST`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`
- Frontend: `VITE_API_BASE_URL`, `VITE_AUTH_MODE`
- Logging: `LOG_LEVEL`

**Secrets location:**
- `.env` file at repo root (contents not quoted in this report). `.env.example` is the committed template.
- Production `SESSION_SECRET` enforced — backend throws on boot if missing in `NODE_ENV=production`.

## Webhooks & Callbacks

**Incoming:**
- None detected — no webhook routes in `backend/src/routes/` (route list: `admin-masters`, `admin-tags`, `admin-trash`, `admin-users`, `auth`, `comments`, `dashboard-phase-c`, `dashboard-settings`, `dashboard-summary`, `faq-categories`, `faqs`, `masters`, `notices`, `notifications`, `voc`).

**Outgoing:**
- None detected — backend does not call third-party HTTP endpoints. MSSQL master cache is the only external read.

## Mock & Fixture Surface

**MSW (frontend):**
- `msw` ^2.14.2 — handlers in `frontend/src/test/mocks/handlers/` (`admin-masters`, `admin-tags`, `admin-trash`, `admin-users`, `auth`, `dashboard`, `dashboard-phase-c`, `faq`, `faq-categories`, `health`, `masters`, `notice`, `notifications`, `voc`)
- Server (Node/Vitest): `frontend/src/test/mocks/server.ts`
- Browser worker: `frontend/src/test/mocks/browser.ts`
- Test setup: `frontend/src/test/setup.ts`

**Shared fixtures (`shared/fixtures/`):**
- `voc.fixtures.ts`, `notice.fixtures.ts`, `faq.fixtures.ts`, `faq-category.fixtures.ts`, `notification.fixtures.ts`, `master.fixtures.ts`, `admin-masters.fixtures.ts`, `admin-tag.fixtures.ts`, `admin-trash.fixtures.ts`, `admin-user.fixtures.ts`
- Mirrored to `backend/seeds/` — parity enforced by `scripts/check-fixture-seed-parity.ts`

**Shared contracts (zod, single source of truth):**
- `shared/contracts/` subdirs: `admin/`, `comment/`, `dashboard/`, `faq/`, `master/`, `notice/`, `notification/`, `voc/`, plus `common.ts`
- Imported by FE via `@contracts` Vite alias and by BE via relative path

## Docker Services

**Defined in `docker-compose.yml`:**
| Service  | Image / Build              | Host port | Depends on        |
|----------|----------------------------|-----------|-------------------|
| postgres | `pgvector/pgvector:pg16`   | 5433      | —                 |
| backend  | `backend/Dockerfile`       | 3001      | postgres (healthy)|
| frontend | `frontend/Dockerfile`      | 5173      | backend (healthy) |

**Volumes:**
- `postgres_data` — Postgres data dir
- `uploads_data` — backend `/app/backend/uploads`
- Bind mounts: `./backend`, `./shared`, `./frontend` for hot-reload dev

---

*Integration audit: 2026-05-10*
