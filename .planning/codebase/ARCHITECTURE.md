<!-- refreshed: 2026-05-10 -->
# Architecture

**Analysis Date:** 2026-05-10

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Browser — React SPA                         │
├──────────────────┬──────────────────┬───────────────────────┤
│   Pages (FSD)    │  Features / Wid. │   Entities / Shared   │
│  `frontend/src/  │  `frontend/src/  │  `frontend/src/       │
│     pages/`      │     features/`   │     entities/`        │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │ React Query (TanStack v5) + fetch (`@shared/api/client`)
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│   MSW (dev only) ── `frontend/src/test/mocks/browser.ts`     │
│   bypasses to real backend when disabled (`USE_MSW=false`)   │
└────────┬────────────────────────────────────────────────────┘
         │ HTTP — Vite dev proxy `/api → http://localhost:3001`
         ▼
┌─────────────────────────────────────────────────────────────┐
│             Express REST API — `backend/src/index.ts`        │
│  routes/  →  controllers/  →  services/  →  repository/      │
│  middleware: auth, validate (zod), errorHandler              │
└────────┬────────────────────────────────────────────────────┘
         │ pg Pool (`backend/src/db.ts`)
         ▼
┌─────────────────────────────────────────────────────────────┐
│   PostgreSQL 16 + pgvector  (`pgvector/pgvector:pg16`)       │
│   migrations: `backend/migrations/NNN_*.sql`                 │
│   seeds:      `backend/seeds/*.sql`                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Shared workspace — `shared/`                                 │
│   contracts/  zod schemas (FE+BE input validation, SSOT)     │
│   types/      generated `api.ts` from `openapi.yaml`         │
│   fixtures/   MSW + seed parity (enforced by script)         │
│   openapi.yaml  REST contract reference                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Frontend entry | Bootstraps React, MSW, providers, router | `frontend/src/main.tsx` |
| Router | Lazy route registration (FSD pages) | `frontend/src/app/router.tsx` |
| App providers | Query client, role context, theming | `frontend/src/app/providers/` |
| HTTP client | Fetch wrapper + ETag handling | `frontend/src/shared/api/client.ts`, `frontend/src/shared/api/etagFetch.ts` |
| Query client | TanStack Query singleton | `frontend/src/shared/api/queryClient.ts` |
| Backend entry | Express app, middleware wiring, route mount | `backend/src/index.ts` |
| Routes | HTTP method binding + zod validate | `backend/src/routes/*.ts` |
| Controllers | Thin handler — calls services | `backend/src/controllers/voc.ts` |
| Services | Business rules, permissions, orchestration | `backend/src/services/**` |
| Repositories | SQL queries against `pg.Pool` | `backend/src/repository/*.ts` |
| Auth | Mock + OIDC strategy selection | `backend/src/auth/index.ts` |
| Validators | Per-route zod schemas | `backend/src/validators/voc.ts` |
| Shared contracts | FE+BE zod schemas (SSOT) | `shared/contracts/**` |
| Shared fixtures | MSW + DB seed parity | `shared/fixtures/*.fixtures.ts` |
| OpenAPI spec | REST contract + Swagger UI source | `shared/openapi.yaml` |

## Pattern Overview

**Overall:** Three-tier (React SPA → Express REST → PostgreSQL), monorepo with three npm workspaces (`frontend`, `backend`, `shared`), Feature-Sliced Design on the frontend, classic layered architecture (`routes → controllers → services → repository`) on the backend, with `shared/` as the schema/contract SSOT.

**Key Characteristics:**
- Contracts-first: zod schemas in `shared/contracts/**` are imported by both FE and BE; FE additionally consumes generated TypeScript from `shared/openapi.yaml` via `npm run codegen`.
- Strict layer boundaries enforced by `backend/CLAUDE.md` (`routes/ → services/ → repository/`; business logic forbidden in route handlers).
- FSD on the frontend: `app → pages → widgets → features → entities → shared` — higher layers import only from lower layers (path aliases `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@contracts`).
- Dev workflow runs full stack via Docker Compose (`docker-compose.yml`) or `npm run dev` (concurrently).
- MSW v2 powers FE-only iteration without a running backend; same fixture set seeds the DB (parity gated by `scripts/check-fixture-seed-parity.ts`).

## Layers

**Frontend — `app/`:**
- Purpose: Composition root.
- Location: `frontend/src/app/`
- Contains: `router.tsx`, `providers/`, `index.ts`.
- Depends on: `widgets`, `pages`, `shared`.
- Used by: `frontend/src/main.tsx`.

**Frontend — `pages/`:**
- Purpose: Route-level screens, lazy-loaded.
- Location: `frontend/src/pages/`
- Contains: `voc/`, `admin/{tags,trash,users,masters}`, `notice/`, `faq/`, `notifications/`, `DashboardPage.tsx`, `voc-review.tsx`, `mock-login/`.
- Depends on: `widgets`, `features`, `entities`, `shared`.

**Frontend — `widgets/`:**
- Purpose: Composite UI blocks spanning multiple features.
- Location: `frontend/src/widgets/`
- Contains: `app-shell/`, `voc-workspace/`.

**Frontend — `features/`:**
- Purpose: User-facing capabilities (one feature = one user-visible behavior).
- Location: `frontend/src/features/`
- Contains: `voc/{create,list,review,model,notification,shared}`, `admin/{tag-master,trash,users,external-masters}`, `dashboard/{api,model,ui,widgets,...}`, `auth/`, `master-cache/`, `notice-popup/`.

**Frontend — `entities/`:**
- Purpose: Domain models + their UI/API helpers.
- Location: `frontend/src/entities/`
- Contains: `voc/{api,model,ui}`, `master/`, `notice/`, `faq/`, `notification/`, `user/`.

**Frontend — `shared/`:**
- Purpose: Cross-cutting primitives and infrastructure.
- Location: `frontend/src/shared/`
- Contains: `api/` (client, queryClient, etagFetch), `ui/` (shadcn primitives), `hooks/`, `lib/`, `config/`, `styles/`, `dev/`.

**Backend — `routes/`:**
- Purpose: HTTP method binding + zod validation gate.
- Location: `backend/src/routes/`
- Depends on: `validators/`, `middleware/`, `controllers/`, `auth/`.
- Pattern (`backend/src/routes/voc.ts`): `Router` → `auth` middleware → `validate({ params, body, query })` → controller method.

**Backend — `controllers/`:**
- Purpose: Thin orchestration. Extract user, call service, shape response, forward errors to `next`.
- Location: `backend/src/controllers/voc.ts`
- Pattern: `async (req, res, next) => { try { const r = await service.x(...); res.json(r); } catch (e) { next(e); } }`.

**Backend — `services/`:**
- Purpose: Business rules, permission checks, multi-repo orchestration.
- Location: `backend/src/services/`
- Contains: `voc.ts`, `comments.ts`, `notifications.ts`, `admin/{external-masters,tag-master,user-admin}.ts`, `dashboard/{summary,phase-c,settings}.service.ts`, `permissions/assertCanManageVoc.ts`.

**Backend — `repository/`:**
- Purpose: SQL access against `pg.Pool`.
- Location: `backend/src/repository/`
- Contains: `voc.ts`, `comments.ts`, `faqs.ts`, `notices.ts`, `masters.ts`, `notifications.ts`, `trash.ts`, `dashboard.repo.ts`, `dashboard-metrics.repo.ts`, `dashboard-phase-c.repo.ts`.

**Backend — `middleware/`:**
- Location: `backend/src/middleware/`
- Files: `validate.ts` (zod gate), `errorHandler.ts` + `errorEnvelope.ts` (terminal handler), `httpError.ts`, `requireRole.ts`.

**Backend — `auth/`:**
- Location: `backend/src/auth/`
- Files: `index.ts` (`createAuthMiddleware()` selects strategy via `AUTH_MODE`), `mockAuth.ts`, `oidcAuth.ts`, `mockUsers.ts`, `types.ts`.

**Shared — `contracts/`:**
- Purpose: SSOT zod schemas. Imported by both FE forms and BE `validate` middleware.
- Location: `shared/contracts/{admin,comment,common.ts,dashboard,faq,master,notice,notification,voc}`.

**Shared — `types/`:**
- Purpose: Generated OpenAPI types (`api.ts`) + hand-written domain types (`faq.ts`, `notice.ts`).
- Generation: `npm run codegen` → `openapi-typescript shared/openapi.yaml -o shared/types/api.ts`.

**Shared — `fixtures/`:**
- Purpose: One dataset feeds MSW (FE dev / tests) and DB seed (BE dev). Parity enforced by `scripts/check-fixture-seed-parity.ts`.

## Data Flow

### Primary Request Path (VOC list)

1. Page renders, calls hook `useVOCList` → React Query fires fetch (`frontend/src/entities/voc/api/`).
2. Request hits Vite proxy `/api → http://localhost:3001` (`frontend/vite.config.ts`).
3. Express stack: `pinoHttp` → `cors` → `express.json` → `express-session` (`backend/src/index.ts:36-58`).
4. Mount: `app.use('/api/vocs', vocRouter)` → `vocRouter.use(auth)` → `validate({ query: vocListQuerySchema })` → `controller.getList` (`backend/src/routes/voc.ts:42`).
5. Controller calls `service.list(query, user)` (`backend/src/controllers/voc.ts:9`).
6. Service applies permission rules (`backend/src/services/permissions/assertCanManageVoc.ts`) and calls `repository/voc.ts`.
7. Repository runs SQL via `getPool()` (`backend/src/db.ts:5`).
8. Response flows back; errors funnel to `errorHandler` (`backend/src/middleware/errorHandler.ts`).

### Auth Flow

1. `createAuthMiddleware()` invoked at module load — fails fast on misconfigured `AUTH_MODE` (`backend/src/index.ts:28`).
2. Strategy selected by env: `mock` → `mockAuth.ts`; `oidc` → `oidcAuth.ts`.
3. Session cookie issued via `express-session` (8 h TTL, `httpOnly`, `sameSite: strict`).
4. FE in `mock` mode renders `MockLoginPage` (`frontend/src/pages/mock-login/`); routed conditionally in `frontend/src/app/router.tsx:9`.

### Dev Mock Flow (MSW)

1. `frontend/src/main.tsx:14` calls `enableMocking()`.
2. Worker `frontend/src/test/mocks/browser.ts` started with `onUnhandledRequest: 'bypass'` — only mocked routes intercepted; others pass to real backend.
3. Disabled by `VITE_USE_MSW=false`.

**State Management:**
- Server state: TanStack Query v5 (`frontend/src/shared/api/queryClient.ts`).
- Cross-cutting client state: React Context (e.g. `RoleProvider` in `frontend/src/entities/user/model/RoleContext`).
- Form state: react-hook-form + zod resolver against `shared/contracts/**`.

## Key Abstractions

**Permission gate `assertCanManageVoc(user, voc, action)`:**
- Purpose: Centralized RBAC + existence-hiding.
- File: `backend/src/services/permissions/assertCanManageVoc.ts`
- Pattern: Throws on deny; called from services before mutating ops.

**Existence-hiding 404 (`requireAdminOrHide`):**
- Purpose: Non-admin sees `404 NOT_FOUND` instead of `403` (ADR 0005).
- File: `backend/src/routes/voc.ts:23` (per-router pattern).

**Validation gate (`validate`):**
- Purpose: Single zod entry point for params/body/query.
- File: `backend/src/middleware/validate.ts`
- Pattern: `validate({ params, body, query })` consuming schemas from `backend/src/validators/*` (which re-export from `shared/contracts/**` where applicable).

**Pool proxy (`backend/src/db.ts`):**
- Purpose: Lazy singleton `Pool` with test override (`setPool` forbidden in production).

**Master cache:**
- Purpose: Boot-time cold-start cache of external master data (VOC types/statuses/departments).
- File: `backend/src/services/admin/external-masters.ts` (`initMasterCache()` called from `backend/src/index.ts:31`).

**Frontend HTTP client:**
- Purpose: Fetch wrapper with ETag handling for optimistic concurrency.
- Files: `frontend/src/shared/api/client.ts`, `frontend/src/shared/api/etagFetch.ts`.

## Entry Points

**Frontend SPA:**
- Location: `frontend/src/main.tsx`
- Triggers: `frontend/index.html` (Vite).
- Responsibilities: Start MSW (dev), mount `QueryClientProvider` → `RoleProvider` → `AppProviders` → `RouterProvider`.

**Backend HTTP:**
- Location: `backend/src/index.ts`
- Triggers: `tsx watch src/index.ts` (dev) / compiled `dist/index.js` (prod) / Docker `backend/entrypoint.sh`.
- Responsibilities: Validate `AUTH_MODE`, init master cache, build Express app, mount routes, listen on `PORT` (default 3001).

**Database:**
- Location: `docker-compose.yml` `postgres` service (`pgvector/pgvector:pg16`, port `5433:5432`).
- Migrations: `backend/migrations/001_extensions.sql` … `023_dashboard_custom_date_range.sql`.

**Scripts:**
- `scripts/check-fixture-seed-parity.ts` — fixture/seed parity gate.
- `scripts/visual-diff.ts` — visual regression vs `benchmark/` ground-truth PNGs.
- `scripts/shadcn-token-rewrite.ts` — token migration helper.

## Architectural Constraints

- **Threading:** Single-threaded Node event loop; no worker threads. PostgreSQL pool sized by default `pg` driver settings.
- **Global state:** Backend `_pool` singleton in `backend/src/db.ts`; `setPool()` forbidden in production (throws). Master cache initialized once at boot.
- **Circular imports:** None observed in routes/services/repository chain.
- **FSD import direction:** Higher layer → lower only (`app → pages → widgets → features → entities → shared`). Path aliases enforce intent; lint rules in `frontend/eslint-rules/`.
- **Token purity:** No hex / raw OKLCH outside `frontend/src/tokens.ts` (custom ESLint rule under `frontend/eslint-rules/`).
- **Contract SSOT:** zod schemas live in `shared/contracts/**` only — never duplicated to FE or BE.
- **API contract irreversibility:** `shared/openapi.yaml` and `shared/contracts/**` are irreversible-tier per root `CLAUDE.md` — schema change must precede code.

## Anti-Patterns

### Business logic in route handlers

**What happens:** Inline DB calls or branching policy directly inside an `app.get(...)` handler.
**Why it's wrong:** Bypasses `services/` layer, makes permissions inconsistent, breaks reuse from background jobs.
**Do this instead:** Route validates → calls controller → controller calls a function in `backend/src/services/**`. See `backend/src/routes/voc.ts:42` and `backend/src/controllers/voc.ts:9`.

### Direct repository imports from routes

**What happens:** A route imports `repository/voc.ts` directly and skips the service.
**Why it's wrong:** Permission checks and audit logging live in the service; bypassing skips them.
**Do this instead:** Always call `services/`; only services import `repository/`.

### Duplicating zod schemas in FE and BE

**What happens:** Hand-written validators on the FE diverge from BE validators.
**Why it's wrong:** Drift between client-side and server-side validation.
**Do this instead:** Import from `shared/contracts/**` on both sides. See `backend/src/routes/voc.ts:13` (`import { TrashIdParam } from '../../../shared/contracts/admin/trash'`).

### Hex / OKLCH literals in components

**What happens:** Color hard-coded inside a `.tsx` file.
**Why it's wrong:** Breaks token contract; ESLint rule fails.
**Do this instead:** Reference `var(--token)` from `frontend/src/tokens.ts`. See `uidesign.md §10`.

### Reading `prototype/` for behavior

**What happens:** Inferring DOM/CSS/behavior from `prototype/`.
**Why it's wrong:** Per root `CLAUDE.md` (2026-05-09~), `prototype/` is no longer a reference.
**Do this instead:** Source from `docs/specs/requires/requirements.md` + `feature-*.md` + `uidesign.md` only.

## Error Handling

**Strategy:** Backend uses a terminal Express error middleware producing a stable envelope `{ code, message, details }`.

**Patterns:**
- Controllers `try/catch` and forward to `next(err)` (see `backend/src/controllers/voc.ts`).
- Custom errors via `backend/src/middleware/httpError.ts`.
- Envelope shape via `backend/src/middleware/errorEnvelope.ts`.
- Existence-hiding 404 returned in-router for non-admin (e.g. `backend/src/routes/voc.ts:23`).
- Frontend distinguishes loading / error / empty states via `frontend/src/shared/ui/{empty-state,error-state,skeleton}` (mandated by `docs/specs/requires/error-loading-conventions.md`).

## Cross-Cutting Concerns

**Logging:** Pino — backend logger at `backend/src/logger.ts`, HTTP request log via `pinoHttp` (`backend/src/index.ts:36`).
**Validation:** zod, gated by `backend/src/middleware/validate.ts`; schemas from `backend/src/validators/*` and `shared/contracts/**`.
**Authentication:** `backend/src/auth/index.ts` strategy switch on `AUTH_MODE` env (`mock` | `oidc`); session via `express-session`.
**Authorization:** `backend/src/services/permissions/assertCanManageVoc.ts` + per-router `requireRole`/`requireAdminOrHide`.
**API documentation:** Swagger UI mounted at `/api/docs` in non-production from `shared/openapi.yaml` (`backend/src/index.ts:62`).
**Health:** `GET /api/health` performs `SELECT 1` against the pool (`backend/src/index.ts:69`).

---

*Architecture analysis: 2026-05-10*
