# Codebase Structure

**Analysis Date:** 2026-05-10

## Directory Layout

```
vocpage/
├── frontend/                  # React SPA (npm workspace)
│   ├── src/
│   │   ├── main.tsx           # SPA entry
│   │   ├── tokens.ts          # Design-token SSOT (raw values)
│   │   ├── app/               # Composition root: router, providers
│   │   ├── pages/             # Route-level screens (FSD)
│   │   ├── widgets/           # Composite UI blocks
│   │   ├── features/          # User capabilities
│   │   ├── entities/          # Domain models + UI/API
│   │   ├── shared/            # api/, ui/, hooks/, lib/, config/, styles/, dev/
│   │   ├── styles/            # Global CSS / fonts
│   │   └── test/              # MSW + Vitest setup
│   ├── e2e/                   # Playwright
│   ├── eslint-rules/          # Custom lint (token purity)
│   ├── public/                # Static assets, fonts
│   ├── components.json        # shadcn/ui config
│   ├── playwright.config.ts
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── CLAUDE.md
├── backend/                   # Express REST (npm workspace)
│   ├── src/
│   │   ├── index.ts           # HTTP entry
│   │   ├── db.ts              # pg.Pool singleton
│   │   ├── logger.ts          # Pino
│   │   ├── auth/              # mock + oidc strategy
│   │   ├── routes/            # Express routers
│   │   ├── controllers/       # Thin handlers
│   │   ├── services/          # Business logic (admin/, dashboard/, permissions/)
│   │   ├── repository/        # SQL access
│   │   ├── middleware/        # validate, errorHandler, requireRole
│   │   ├── validators/        # zod schemas (per-route)
│   │   └── __tests__/         # Jest + Supertest
│   ├── config/                # masters/ JSON/CSV
│   ├── migrations/            # NNN_*.sql (sequential)
│   ├── seeds/                 # dev_seed.sql, mock-users.sql
│   ├── uploads/               # Runtime upload volume
│   ├── jest.config.js
│   ├── tsconfig.json
│   ├── tsconfig.typecheck.json
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── CLAUDE.md
├── shared/                    # Cross-workspace SSOT
│   ├── contracts/             # zod schemas (admin/, comment/, dashboard/, faq/, master/, notice/, notification/, voc/, common.ts)
│   ├── types/                 # api.ts (generated), faq.ts, notice.ts
│   ├── fixtures/              # MSW + seed parity
│   ├── openapi.yaml           # REST contract reference
│   └── tsconfig.json
├── docs/
│   ├── specs/
│   │   ├── requires/          # requirements.md, feature-*.md, uidesign.md, *-conventions.md
│   │   └── plans/             # next-session-tasks.md, wave-3-admin.md, followup-bucket.md
│   ├── adr/                   # Architecture decision records (e.g. ADR 0005)
│   └── agents/                # Agent skills: issue-tracker.md, triage-labels.md, domain.md
├── scripts/                   # check-fixture-seed-parity.ts, shadcn-token-rewrite.ts, visual-diff.ts, visual-diff/
├── graphify-out/              # Generated knowledge graph (do not hand-edit)
├── prototype/                 # Legacy reference (no longer authoritative — see CLAUDE.md)
├── refSystem/                 # Reference material
├── utils/                     # Misc utilities
├── docker-compose.yml         # postgres + backend + frontend
├── tsconfig.base.json         # Shared TS config
├── package.json               # Root workspace + scripts
├── claude-progress.txt        # Active progress (first 30 lines authoritative)
├── CLAUDE.md                  # Root project rules
└── README.md
```

## Directory Purposes

**`frontend/src/app/`:**
- Purpose: Composition root for the SPA.
- Contains: `router.tsx` (lazy-route registry), `providers/` (Query, role, theme), `index.ts` (barrel).

**`frontend/src/pages/`:**
- Purpose: Route-level screens. Each entry maps to a `react-router-dom` route.
- Key files: `frontend/src/pages/voc/`, `frontend/src/pages/admin/{tags,trash,users,masters}/`, `frontend/src/pages/notice/`, `frontend/src/pages/faq/`, `frontend/src/pages/notifications/`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/voc-review.tsx`, `frontend/src/pages/mock-login/`.

**`frontend/src/widgets/`:**
- Purpose: Multi-feature composite UI.
- Key files: `frontend/src/widgets/app-shell/` (header/nav layout shell), `frontend/src/widgets/voc-workspace/`.

**`frontend/src/features/`:**
- Purpose: One user-visible behavior per folder.
- Key files: `frontend/src/features/voc/{create,list,review,model,notification,shared}`, `frontend/src/features/admin/{tag-master,trash,users,external-masters}`, `frontend/src/features/dashboard/{api,model,ui,widgets,defaultLayouts.ts,lockMerge.ts}`, `frontend/src/features/auth/`, `frontend/src/features/master-cache/`, `frontend/src/features/notice-popup/`.

**`frontend/src/entities/`:**
- Purpose: Domain entities with co-located `api/`, `model/`, `ui/`.
- Key files: `frontend/src/entities/voc/`, `frontend/src/entities/master/`, `frontend/src/entities/notice/`, `frontend/src/entities/faq/`, `frontend/src/entities/notification/`, `frontend/src/entities/user/`.

**`frontend/src/shared/`:**
- Purpose: Cross-cutting infrastructure and primitives.
- Key files:
  - `frontend/src/shared/api/client.ts` (fetch wrapper)
  - `frontend/src/shared/api/queryClient.ts` (TanStack Query singleton)
  - `frontend/src/shared/api/etagFetch.ts`
  - `frontend/src/shared/ui/` (shadcn/Radix primitives: button, dialog, table, tabs, sheet, popover, command, …)
  - `frontend/src/shared/hooks/`, `lib/`, `config/`, `styles/`, `dev/`.

**`frontend/src/test/`:**
- Purpose: Vitest setup + MSW handlers.
- Key files: `frontend/src/test/setup.ts`, `frontend/src/test/mocks/browser.ts`.

**`frontend/eslint-rules/`:**
- Purpose: Project-local ESLint rules (token purity: forbid hex/OKLCH outside `tokens.ts`).

**`frontend/e2e/`:**
- Purpose: Playwright tests for cross-page flows. Component/unit tests live under `src/**/__tests__/`.

**`frontend/public/`:**
- Purpose: Vite static assets. Self-hosted webfonts in `frontend/public/fonts/`.

**`backend/src/auth/`:**
- Purpose: Authentication strategy selection.
- Key files: `backend/src/auth/index.ts` (`createAuthMiddleware()`), `mockAuth.ts`, `oidcAuth.ts`, `mockUsers.ts`, `types.ts`.

**`backend/src/routes/`:**
- Purpose: Express routers. Each file mounts under `/api/<resource>` in `backend/src/index.ts`.
- Key files: `voc.ts`, `auth.ts`, `comments.ts`, `masters.ts`, `notices.ts`, `faqs.ts`, `faq-categories.ts`, `notifications.ts`, `admin-tags.ts`, `admin-trash.ts`, `admin-users.ts`, `admin-masters.ts`, `dashboard-phase-c.ts`, `dashboard-settings.ts`, `dashboard-summary.ts`.

**`backend/src/controllers/`:**
- Purpose: Thin orchestration between route and service.
- Key files: `backend/src/controllers/voc.ts`.

**`backend/src/services/`:**
- Purpose: Business logic.
- Key files: `voc.ts`, `comments.ts`, `notifications.ts`, `admin/{external-masters,tag-master,user-admin}.ts`, `dashboard/{summary,phase-c,settings}.service.ts`, `permissions/assertCanManageVoc.ts`.

**`backend/src/repository/`:**
- Purpose: SQL access via `pg.Pool`.
- Key files: `voc.ts`, `comments.ts`, `faqs.ts`, `masters.ts`, `notices.ts`, `notifications.ts`, `trash.ts`, `dashboard.repo.ts`, `dashboard-metrics.repo.ts`, `dashboard-phase-c.repo.ts`.

**`backend/src/middleware/`:**
- Key files: `validate.ts` (zod), `errorHandler.ts`, `errorEnvelope.ts`, `httpError.ts`, `requireRole.ts`.

**`backend/src/validators/`:**
- Purpose: Per-route zod schemas (often re-export from `shared/contracts/**`).
- Key files: `backend/src/validators/voc.ts`.

**`backend/migrations/`:**
- Purpose: Sequential SQL migrations. `001_extensions.sql` runs `CREATE EXTENSION IF NOT EXISTS vector;` before any DDL.
- Pattern: `NNN_description.sql`. Currently 001–023.

**`backend/seeds/`:**
- Purpose: Dev/test DB seed.
- Key files: `dev_seed.sql`, `mock-users.sql`.

**`backend/config/`:**
- Purpose: Static config loaded at boot. `config/masters/` holds master-data JSON/CSV mirrored by `shared/fixtures/`.

**`shared/contracts/`:**
- Purpose: zod schemas SSOT — imported by both FE and BE.
- Key files: `voc/`, `admin/`, `comment/`, `dashboard/`, `faq/`, `master/`, `notice/`, `notification/`, `common.ts`.

**`shared/types/`:**
- Purpose: TypeScript types.
- Key files: `api.ts` (generated by `npm run codegen`), `faq.ts`, `notice.ts`.

**`shared/fixtures/`:**
- Purpose: Single dataset for MSW + DB seed; parity verified by `scripts/check-fixture-seed-parity.ts`.
- Key files: `voc.fixtures.ts`, `notice.fixtures.ts`, `faq.fixtures.ts`, `faq-category.fixtures.ts`, `master.fixtures.ts`, `notification.fixtures.ts`, `admin-{masters,tag,trash,user}.fixtures.ts`.

**`shared/openapi.yaml`:**
- Purpose: REST contract reference; consumed by Swagger UI at `/api/docs` and by `openapi-typescript` codegen.

**`docs/specs/requires/`:**
- Purpose: Permanent product specs.
- Key files: `requirements.md`, `feature-*.md`, `uidesign.md`, plus naming/state/api/routing/error-loading/form/table-filter/datetime/test/env conventions.

**`docs/specs/plans/`:**
- Key files: `next-session-tasks.md` (active + deferred), `wave-3-admin.md`, `followup-bucket.md`.

**`docs/adr/`:**
- Purpose: Architecture decision records (e.g. ADR 0005 existence-hiding 404, ADR 0008 visual alignment gate).

**`docs/agents/`:**
- Purpose: Agent skill docs — `issue-tracker.md`, `triage-labels.md`, `domain.md`.

**`scripts/`:**
- `scripts/check-fixture-seed-parity.ts` — fixture/seed parity gate (root `npm run check:parity`).
- `scripts/visual-diff.ts` + `scripts/visual-diff/` — visual regression vs ground-truth PNGs (root `npm run visual-diff`).
- `scripts/shadcn-token-rewrite.ts` — token migration helper.

**`graphify-out/`:**
- Purpose: Auto-generated knowledge graph. Refresh with `graphify update .`. Do not hand-edit.

**`prototype/`:**
- Purpose: Legacy reference. **Not** authoritative since 2026-05-09; do not cite pixel/DOM/CSS from here.

## Key File Locations

**Entry Points:**
- `frontend/src/main.tsx` — SPA bootstrap.
- `frontend/index.html` — HTML host.
- `backend/src/index.ts` — Express app + listener.
- `backend/entrypoint.sh` — Docker container entry.
- `docker-compose.yml` — full stack orchestration.

**Configuration:**
- `tsconfig.base.json` — shared TS config.
- `frontend/tsconfig.json`, `frontend/vite.config.ts` (path aliases + dev proxy + Vitest config).
- `backend/tsconfig.json`, `backend/tsconfig.typecheck.json`, `backend/jest.config.js`.
- `frontend/components.json` — shadcn config.
- `frontend/playwright.config.ts` — E2E config.
- `package.json` (root) — workspaces + scripts (`dev`, `codegen`, `check:parity`, `visual-diff`).

**Core Logic:**
- Routing (FE): `frontend/src/app/router.tsx`.
- HTTP routing (BE): `backend/src/index.ts` (mount table) + `backend/src/routes/*.ts`.
- DB pool: `backend/src/db.ts`.
- Auth: `backend/src/auth/index.ts`.
- Permissions: `backend/src/services/permissions/assertCanManageVoc.ts`.
- Token SSOT: `frontend/src/tokens.ts`.

**Testing:**
- FE Vitest setup: `frontend/src/test/setup.ts`.
- FE MSW: `frontend/src/test/mocks/browser.ts`.
- FE component tests: `frontend/src/**/__tests__/`.
- FE E2E: `frontend/e2e/`.
- BE Jest: `backend/jest.config.js`, tests under `backend/src/**/__tests__/`.

## Naming Conventions

**Files:**
- TS/TSX modules: `kebab-case.ts(x)` for general files (`error-handler.ts`, `app-shell/`).
- React components: `PascalCase.tsx` when the file's primary export is a component (`DashboardPage.tsx`).
- Test files: `*.test.ts`, `*.test.tsx` (Vitest); BE Jest tests under `__tests__/` mirror source name.
- Fixtures: `<entity>.fixtures.ts` in `shared/fixtures/`.
- Migrations: `NNN_description.sql` (zero-padded sequential).
- Service modules: `<feature>.service.ts` for domain services in subfolders (e.g. `dashboard/summary.service.ts`); plain `<entity>.ts` at top level (e.g. `services/voc.ts`).
- Repositories: `<entity>.ts` or `<entity>.repo.ts`.

**Directories:**
- FSD layers: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/` — fixed names.
- Per-feature/per-entity sub-structure: `api/`, `model/`, `ui/` (FSD slice).
- Backend layers: `routes/`, `controllers/`, `services/`, `repository/`, `middleware/`, `validators/`, `auth/`.

**Path aliases (from `frontend/vite.config.ts`):**
- `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`, `@contracts/*` (`shared/contracts/`).

**ID rules (root `CLAUDE.md`):**
- Wave / Phase IDs: append-only integers; sub-decimals forbidden.
- Follow-up IDs: `FU-NNN` in `docs/specs/plans/followup-bucket.md`.

## Where to Add New Code

**New page (route-level screen):**
- Component: `frontend/src/pages/<route>/index.tsx` (or single `.tsx`).
- Register lazy import: `frontend/src/app/router.tsx`.
- Tests: `frontend/src/pages/<route>/__tests__/`.

**New feature (user capability):**
- Code: `frontend/src/features/<feature>/{api,model,ui}/`.
- Index barrel: `frontend/src/features/<feature>/index.ts`.
- Tests: `frontend/src/features/<feature>/__tests__/`.

**New shared UI primitive:**
- Code: `frontend/src/shared/ui/<component>/` (follow neighbouring shadcn pattern).
- shadcn-managed: update via shadcn CLI per `frontend/components.json`.

**New REST endpoint:**
- Contract: add zod schema to `shared/contracts/<resource>/`.
- OpenAPI: update `shared/openapi.yaml`; regenerate `npm run codegen`.
- Validator: `backend/src/validators/<resource>.ts` (re-export from contract where possible).
- Route: `backend/src/routes/<resource>.ts` — `Router` → `auth` → `validate(...)` → controller method.
- Mount: add `app.use('/api/<resource>', <resourceRouter>)` in `backend/src/index.ts`.
- Controller: `backend/src/controllers/<resource>.ts`.
- Service: `backend/src/services/<resource>.ts`.
- Repository: `backend/src/repository/<resource>.ts`.
- Tests: `backend/src/routes/__tests__/<resource>.test.ts` (Supertest).

**New DB table / schema change:**
- Migration: `backend/migrations/NNN_<description>.sql` (next sequential index).
- Seed update: `backend/seeds/dev_seed.sql` if needed.
- Fixture parity: update `shared/fixtures/<entity>.fixtures.ts`; verify `npm run check:parity`.

**New domain entity (FE):**
- Folder: `frontend/src/entities/<entity>/{api,model,ui}/`.
- Barrel: `frontend/src/entities/<entity>/index.ts`.

**Utilities:**
- Cross-workspace: `shared/` only if it must be shared; otherwise stay in workspace `shared/lib/`.
- FE-only helpers: `frontend/src/shared/lib/`.
- BE-only helpers: closest layer (avoid a generic `utils/` dump).

**New design token:**
- Update `frontend/src/tokens.ts` (raw values).
- Update `docs/specs/requires/uidesign.md` (token doc) in same PR.

**New ADR:**
- File: `docs/adr/NNNN-<slug>.md`.

**New script:**
- Code: `scripts/<name>.ts`.
- Wire into root `package.json` scripts if needed.

## Special Directories

**`graphify-out/`:**
- Purpose: Auto-generated knowledge graph (`wiki/index.md`, etc.).
- Generated: Yes (`graphify update .`).
- Committed: Yes.

**`backend/dist/`:**
- Purpose: Compiled output.
- Generated: Yes (`tsc`).
- Committed: No.

**`backend/uploads/`:**
- Purpose: Runtime upload volume (Docker-mounted).
- Generated: Yes.
- Committed: No.

**`frontend/dist/`:**
- Purpose: Vite production build.
- Generated: Yes.
- Committed: No.

**`frontend/test-results/`:**
- Purpose: Playwright artifacts.
- Generated: Yes.
- Committed: No.

**`prototype/`:**
- Purpose: Historical UI prototype.
- Authoritative: No (since 2026-05-09 per root `CLAUDE.md`).
- Committed: Yes (legacy).

**`node_modules/` (root, frontend, backend):**
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-05-10*
