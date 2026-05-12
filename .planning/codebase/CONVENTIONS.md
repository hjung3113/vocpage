# Coding Conventions

**Analysis Date:** 2026-05-10

## Naming Patterns

**Files:**
- React components / pages: `PascalCase.tsx` (`VocListPage.tsx`, `NoticePopupModal.tsx`, `DashboardShell.tsx`).
- Hooks / pure helpers: `camelCase.ts` (`useDashboardDraft.ts`, `lockMerge.ts`).
- Tests: co-located in `__tests__/` mirroring source filename (`VocListPage.test.tsx`, `voc-contract.test.ts`).
- Backend modules: kebab-case for tests (`migration-019-voc-parent-set-null.test.ts`), camelCase for source (`mockAuth.ts`, `db.ts`).
- Shared zod contracts: `<resource>/<thing>.ts` under `shared/contracts/` (e.g. `shared/contracts/voc/`, `shared/contracts/admin/`).
- Shared fixtures: `<resource>.fixtures.ts` under `shared/fixtures/`.
- Backend SQL migrations: `NNN_description.sql` (sequential, append-only) — see `backend/migrations/`.
- Detailed naming spec: `docs/specs/requires/naming-conventions.md`.

**Functions:**
- camelCase verbs (`assertCanManageVoc`, `parseDbColumns`, `generateMarkdownIndex`).
- React hooks prefixed `use` (`useVOCFilter`, `useAutoTag`, `useDrawer`, `useDashboardDraft`).

**Variables:**
- camelCase locals; UPPER_SNAKE for module-level constants (`VOC_FIXTURES`, `SELECTOR_MAP`, `ROOT`, `FIXTURE_PATH`).

**Types:**
- PascalCase for `interface` / `type` / zod schema names (`Pagination`, `RoleScopedColumns`, `VocInput`, `Voc`, `SchemaShape`).
- Enum-shaped string unions used over TS `enum`: `export type Role = 'user' | 'dev' | 'manager' | 'admin'` (`shared/contracts/common.ts`).

## Code Style

**Formatting (Prettier):**
- Config: `.prettierrc` — `semi: true`, `singleQuote: true`, `printWidth: 100`, `trailingComma: 'all'`.
- Markdown / JSON / CSS / SCSS also formatted via Prettier (see `package.json` `lint-staged`).

**Linting:**
- Base config: `.eslintrc.base.js` (root). Extends `eslint:recommended` + `plugin:@typescript-eslint/recommended`.
- Key rules:
  - `@typescript-eslint/no-explicit-any: error` — `any` is forbidden.
  - `@typescript-eslint/no-unused-vars: error` with `^_` ignore prefix.
  - `no-restricted-syntax` — banned hex color literals in source; tokens must come from `frontend/src/tokens.ts`.
- Frontend (`frontend/.eslintrc.cjs`): adds `plugin:react-hooks/recommended` + `eslint-plugin-tailwindcss`; runs `npm run lint:tokens` (`eslint-rules/check-no-raw-color.cjs`) which scans for hex / `rgb()` / `oklch()` / Tailwind named colors. Allowed exception is a line comment `// allow-raw-color: <reason>`.
- Backend (`backend/.eslintrc.js`): adds `plugin:n/recommended`; `n/no-process-exit` allowed only in `src/index.ts`.
- Shared (`shared/.eslintrc.json`): forbids importing `react*`, `express*`, `pg`, `node:*`, `@vocpage/frontend/**`, `@vocpage/backend/**` — keeps the layer environment-agnostic.
- Stylesheets: `stylelint` + `stylelint-declaration-strict-value` (token enforcement).
- Pre-commit: `husky` + `lint-staged` (`package.json`) runs `eslint --fix` + `prettier --write` on staged files.

**TypeScript (`tsconfig.base.json`):**
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`.
- `strict: true`, `noUncheckedIndexedAccess: true`, `forceConsistentCasingInFileNames: true`, `isolatedModules: true`.
- Backend has a separate `tsconfig.typecheck.json` for `npm run typecheck` (no emit).

## Import Organization

**Order (observed in source):**
1. Node / framework (`fs`, `path`, `react`, `express`).
2. Third-party packages (`zod`, `@tanstack/react-query`, `@testing-library/react`).
3. Path aliases (`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@contracts`).
4. Relative siblings (`./...`, `../...`).

**Path Aliases (frontend, `frontend/vite.config.ts`):**
- `@app` → `frontend/src/app`
- `@pages` → `frontend/src/pages`
- `@widgets` → `frontend/src/widgets`
- `@features` → `frontend/src/features`
- `@entities` → `frontend/src/entities`
- `@shared` → `frontend/src/shared`
- `@contracts` → `shared/contracts` (cross-tier zod schemas).

Backend has no path aliases — uses relative paths (`../../../shared/contracts/voc`).

## `shared/` Usage Rules

- `shared/contracts/` — zod v4 schemas, single source of truth for FE + BE input validation. Module file `shared/contracts/common.ts` declares `Uuid`, `Pagination`, `Role`, `SortDir`. Subfolders by resource: `voc/`, `admin/`, `comment/`, `dashboard/`, `faq/`, `master/`, `notice/`, `notification/`. **Environment-agnostic — no DOM, no Node, no framework imports.**
- `shared/types/` — `api.ts` is generated from `shared/openapi.yaml` via `npm run codegen` (`openapi-typescript`). Hand-written types: `faq.ts`, `notice.ts`.
- `shared/fixtures/` — MSW + DB seed fixture data. Parity with backend seeds is enforced by `scripts/check-fixture-seed-parity.ts` (`npm run check:parity`).
- `shared/openapi.yaml` — REST contract reference; cross-checked against zod by `backend/src/__tests__/voc-contract.test.ts` (drift = test failure).

## Error Handling

**Backend:**
- Layered: `routes/` → `controllers/` → `services/` → `repository/`. Business logic never lives in route handlers.
- Single source of HTTP status mapping in `backend/src/middleware/` (exception → status code).
- All external input validated via zod (schemas from `shared/contracts/`) using adapters in `backend/src/validators/`.
- Permission decisions live in `backend/src/services/permissions/` (`assertCanManageVoc(user, voc, action)`); auth ≠ permission.
- Stable response envelope + error shape — see `docs/specs/requires/api-conventions.md`.

**Frontend:**
- Always handle: loading / error / empty / hover / focus / responsive (per `frontend/CLAUDE.md`).
- Pattern guidance: `docs/specs/requires/error-loading-conventions.md`.

## Logging

**Backend:** `pino` + `pino-http`, structured logger initialized in `backend/src/logger.ts`. `pino-pretty` for dev only.

**Frontend:** No structured logger; rely on `console` during dev. Toast UX via `sonner`.

## Comments

- Module headers describe role + cross-references in JSDoc-ish blocks (see `shared/contracts/common.ts`, `scripts/check-fixture-seed-parity.ts`).
- Behavioral rules are NOT duplicated in code comments — link to the spec section instead (`feature-voc.md §8.4-bis`, etc.) per `backend/CLAUDE.md`.
- Token exception comments require a reason: `// allow-raw-color: <reason>`.

## Function Design

- No `any` — enforced by ESLint.
- React page components stay small; repeated Tailwind extracted to components or `@apply` (`frontend/CLAUDE.md`).
- Domain logic centralized in `services/` (auto-tag, hierarchy, side-effects); thin HTTP adapters in `controllers/`; SQL only in `repository/` (only place importing `db.ts`).

## Module Design

- Frontend slice layout (FSD-influenced): `app/` · `pages/` · `widgets/` · `features/` · `entities/` · `shared/` (see `frontend/src/CLAUDE.md`).
- Backend layer layout: `routes/` · `controllers/` · `services/` · `repository/` · `middleware/` · `validators/` · `auth/` · `config/` (see `backend/src/CLAUDE.md`).
- One file per resource for HTTP clients + react-query hooks (`frontend/src/api/`).
- Feature-only UI lives in `frontend/src/features/<feature>/components/`; cross-feature reusable atoms in `frontend/src/components/ui/` and `frontend/src/shared/ui/`.
- Tokens: `frontend/src/tokens.ts` is the raw-value SSOT — generates `tailwind.config.ts` + CSS custom properties. New tokens require `tokens.ts` + `docs/specs/requires/uidesign.md` updated in the same PR.
- Convention specs (read before coding the matching surface): `docs/specs/requires/{naming,state-management,api,routing,error-loading,form,table-filter,datetime,test,env}-conventions.md`.

---

*Convention analysis: 2026-05-10*
