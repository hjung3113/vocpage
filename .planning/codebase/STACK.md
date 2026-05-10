# Technology Stack

**Analysis Date:** 2026-05-10

## Languages

**Primary:**
- TypeScript ^5.4.5 — frontend, backend, shared, scripts
- SQL — `backend/migrations/*.sql` (PostgreSQL dialect, pgvector)

**Secondary:**
- JavaScript (CJS) — `frontend/eslint-rules/check-no-raw-color.cjs` custom ESLint rule
- YAML — `shared/openapi.yaml` REST contract; `docker-compose.yml`

## Runtime

**Environment:**
- Node.js 22 (alpine) — declared in `backend/Dockerfile` and `frontend/Dockerfile` (`FROM node:22-alpine`)
- Browser runtime: modern evergreen (Vite + React 18 SPA)

**Package Manager:**
- npm with workspaces (`package.json` `workspaces: ["frontend", "backend", "shared"]`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Frontend core:**
- React ^18.3.1 + react-dom ^18.3.1 (`frontend/package.json`)
- React Router DOM ^7.14.2
- Vite ^5.2.10 + `@vitejs/plugin-react` ^4.2.1 (`frontend/vite.config.ts`)
- Tailwind CSS ^4.0.0 via `@tailwindcss/vite` (`frontend/vite.config.ts`)

**Frontend UI:**
- Radix UI primitives — `@radix-ui/react-{avatar,collapsible,dialog,dropdown-menu,label,popover,select,separator,slot,tabs,toggle,toggle-group,tooltip}`
- shadcn/ui scaffolding — `frontend/components.json`
- `lucide-react` ^1.14.0 (icons)
- `class-variance-authority` ^0.7.1, `clsx` ^2.1.1, `tailwind-merge` ^3.5.0
- `cmdk` ^1.1.1 (command palette)
- `sonner` ^2.0.7 (toasts)
- `@toast-ui/editor` ^3.2.2 + `@toast-ui/react-editor` ^3.2.3 (rich text)
- `react-day-picker` ^9.14.0
- `react-grid-layout` ^2.2.3
- `recharts` ^3.8.1 (lazy-loaded charts)
- `dompurify` 3.4.2 (HTML sanitization)
- Fonts: `pretendard` ^1.3.9 (UI) + `d2coding` ^1.3.2 (code/IDs)

**Frontend data/state:**
- `@tanstack/react-query` ^5.100.6 + `@tanstack/react-query-devtools`
- `zod` ^4.4.1 (shared schemas in `shared/contracts/`)

**Backend core:**
- Express ^4.19.2 (`backend/package.json`)
- `express-session` ^1.18.0 — session cookie store
- `cors` ^2.8.5
- `helmet` ^7.1.0
- `pino` ^10.3.1 + `pino-http` ^11.0.0 + `pino-pretty` ^13.1.3 (logging — see `backend/src/logger.ts`)
- `swagger-ui-express` ^5.0.1 — serves OpenAPI at `/api/docs` (`backend/src/index.ts:63`)
- `js-yaml` ^4.1.0 — loads `shared/openapi.yaml`
- `pg` ^8.20.0 — PostgreSQL client
- `node-pg-migrate` ^8.0.4 — migrations (`backend/migrations/`)
- `zod` ^4.4.1 (shared validation)

**Testing:**
- Vitest ^1.5.0 + `@testing-library/{dom,react,jest-dom,user-event}` + `jsdom` ^29.0.2 (frontend) — `frontend/vite.config.ts` `test` block
- Jest ^29.7.0 + `ts-jest` ^29.1.2 + `supertest` ^6.3.4 (backend) — `backend/package.json` `npm run test`
- `@playwright/test` ^1.59.1 + `playwright` ^1.52.0 (e2e — `frontend/e2e/`, `frontend/playwright.config.ts`)
- `msw` ^2.14.2 — frontend mocked APIs (`frontend/src/test/mocks/`)
- `@testcontainers/postgresql` ^11.14.0 — backend integration tests against real Postgres
- `pg-mem` ^3.0.14 — in-memory Postgres fallback for tests

**Build/Dev:**
- `tsx` ^4.21.0 — backend dev runner (`tsx watch --env-file=../.env src/index.ts`) and root scripts
- `concurrently` ^8.2.2 — root `npm run dev` runs frontend+backend in parallel
- `husky` ^9.0.11 + `lint-staged` ^15.2.2 — pre-commit hooks (`package.json`)
- `openapi-typescript` ^7.13.0 — generates `shared/types/api.ts` from `shared/openapi.yaml` via `npm run codegen`

**Lint/Format:**
- ESLint ^8.57.0 + `@typescript-eslint/{eslint-plugin,parser}` ^7.x + `eslint-plugin-{react-hooks,n,tailwindcss}`
- Prettier ^3.2.5
- Stylelint ^16.3.1 + `stylelint-declaration-strict-value` ^1.9.2
- Custom token-purity ESLint rule: `frontend/eslint-rules/check-no-raw-color.cjs` (no hex/OKLCH outside `frontend/src/tokens.ts`)

## Key Dependencies

**Critical:**
- `pg` ^8.20.0 — Postgres connection pool (`backend/src/db.ts`)
- `pgvector/pgvector:pg16` (Docker image) — vector search infra
- `@tanstack/react-query` ^5.100.6 — server-state cache for the SPA
- `zod` ^4.4.1 — single-source validation across FE/BE via `shared/contracts/`

**Infrastructure:**
- `node-pg-migrate` — sequential SQL migrations under `backend/migrations/` (001–020 currently)
- `swagger-ui-express` — runtime API browser at `/api/docs`
- `express-session` — cookie sessions (8h TTL, httpOnly, sameSite=strict, secure in prod — `backend/src/index.ts`)

## Configuration

**Environment (.env / .env.example at repo root):**
- `.env` and `.env.example` exist at repo root (contents NOT quoted)
- Frontend reads `VITE_API_BASE_URL`, `VITE_AUTH_MODE`
- Backend reads `DATABASE_URL`, `AUTH_MODE` (`mock` | `oidc`), `SESSION_SECRET`, `SESSION_STORE_URL`, `CORS_ORIGIN`, `LOG_LEVEL`, `MSSQL_HOST`/`MSSQL_USER`/`MSSQL_PASSWORD`/`MSSQL_DATABASE` (external master cache, optional)
- Postgres: `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Backend dev runner uses `--env-file=../.env`

**TypeScript:**
- `tsconfig.base.json` — `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`
- `frontend/tsconfig.json`, `backend/tsconfig.typecheck.json`, `shared/tsconfig.json`

**Build:**
- Frontend: `npm run build -w frontend` → `tsc && vite build`
- Backend: `npm run build -w backend` → `tsc` → `dist/backend/src/index.js`
- Vite path aliases (`frontend/vite.config.ts`): `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@contracts` → `../shared/contracts`
- Frontend dev proxy: `/api` → `http://localhost:3001`

## Platform Requirements

**Development:**
- Node.js 22 (matches Docker image)
- Docker + Docker Compose (postgres, backend, frontend services in `docker-compose.yml`)
- `psql` client (used by `npm run db:seed` in backend)

**Production:**
- Containerized via `backend/Dockerfile` and `frontend/Dockerfile` (both `node:22-alpine`, `development` stage in repo)
- PostgreSQL 16 with `vector` and `uuid-ossp` extensions (`backend/migrations/001_extensions.sql`)
- Optional MSSQL upstream for external master data (read-only cache source)

---

*Stack analysis: 2026-05-10*
