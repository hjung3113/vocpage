# Testing Patterns

**Analysis Date:** 2026-05-10

## Test Frameworks

**Frontend — Vitest 1.5:**
- Runner: `vitest`. Config: `frontend/vite.config.ts` (`test` block).
- Environment: `jsdom` (`environment: 'jsdom'`, `globals: true`).
- Setup file: `frontend/src/test/setup.ts` — polyfills `PointerEvent`, `hasPointerCapture`, `scrollIntoView`, `URL.createObjectURL`, `ResizeObserver`; mocks Toast UI editor as a `<textarea data-testid="voc-body-editor">`; stubs CSS side-effect imports.
- Includes: `src/**/*.test.{ts,tsx}` plus `../scripts/visual-diff/**/*.test.ts` (visual-diff harness unit tests run in the FE workspace).
- Component layer: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
- HTTP mocking: MSW v2 (`frontend/src/test/mocks/server.ts` + `frontend/src/test/mocks/handlers/`).

**Backend — Jest 29 + Supertest:**
- Runner: `jest --runInBand`. Config: `backend/jest.config.js`.
- Preset: `ts-jest`. `testEnvironment: node`. `testMatch: ['**/__tests__/**/*.test.ts']`.
- Supertest 6 used for HTTP integration; in-memory DB via `pg-mem` for unit-ish runs and `@testcontainers/postgresql` for migration tests.
- Test app builder: `backend/src/__tests__/helpers/app.ts` (used as `createTestApp()`).

**E2E — Playwright:**
- Config: `frontend/playwright.config.ts`. Tests in `frontend/e2e/`.
- Commands: `npm run test:e2e -w frontend`, `npm run test:e2e:ui -w frontend`.

## Run Commands

```bash
# Frontend
npm run test -w frontend                              # Vitest watch
npm run test -w frontend -- --run                     # Single CI run
npm run test -w frontend -- path/to/file.test.tsx    # Single file
npm run typecheck -w frontend

# Backend
npm run test -w backend                                # Jest serial
npm run test -w backend -- --testPathPattern=health   # Filter
npm run typecheck -w backend

# Cross-cutting
npm run check:parity                                   # Fixture ↔ seed parity
npm run visual-diff                                    # Playwright dual-render diff
npm run test:e2e -w frontend                           # Playwright E2E
```

Per `.claude/CLAUDE.md`: combine typecheck + tests in a single workspace call (`npm run typecheck -w <ws> && npm run test -w <ws> -- --run | tail -20`); both sides → run as parallel bash in one message.

## Test File Organization

**Location pattern:** co-located `__tests__/` directories next to the source they cover.

**Backend examples (`backend/src/__tests__/`):**
- `health.test.ts` — Supertest smoke test against `createTestApp()`.
- `voc-contract.test.ts` — zod ↔ OpenAPI drift guard (loads `shared/openapi.yaml` and compares to `shared/contracts/voc`).
- `dashboard-contract.test.ts`, `admin-contract.test.ts` — contract guards.
- `migration-014.test.ts` … `migration-022-*.test.ts` — per-migration assertions (testcontainers Postgres).
- `permission-matrix.test.ts` — exhaustive role × action matrix.
- `voc-due-date.test.ts`, `vocs.test.ts`, `notices.test.ts`, `faqs.test.ts`, `masters.test.ts`, `auth.test.ts`, `logger.test.ts` — service / route integration.
- Helpers: `backend/src/__tests__/helpers/app.ts`.
- Repository-local: `backend/src/repository/__tests__/trash.sql.test.ts`.
- Auth-local: `backend/src/auth/__tests__/mockAuth.test.ts`.

**Frontend examples:**
- Page-level: `frontend/src/pages/<area>/__tests__/<Page>.test.tsx` (often split `Page.user.test.tsx` / `Page.admin.test.tsx` for role variants — see `FaqPage`, `NoticePage`).
- Widget-level: `frontend/src/widgets/voc-workspace/__tests__/VocListPage.test.tsx` + `VocListPage.integration.test.tsx`.
- Feature-level: `frontend/src/features/dashboard/__tests__/` (`DashboardShell.test.tsx`, `KpiWidgets.test.tsx`, `GridTable.test.tsx`, `PhaseC-2.test.tsx`, `lockMerge.test.ts`, …).
- MSW handler tests: `frontend/src/test/mocks/handlers/__tests__/` (`masters.test.ts`, `notifications.test.ts`, `voc-list-filters.test.ts`, `voc-patch-permissions.test.ts`).
- Visual-diff harness: `scripts/visual-diff/__tests__/` (`diff.test.ts`, `extract.test.ts`, `report.test.ts`, with `__snapshots__/`).

**Naming:**
- Unit / integration: `<Subject>.test.tsx?`.
- Variant suffixes: `.user`, `.admin`, `.integration`, `PhaseC-N` for wave-scoped suites.

## Test Structure

**Backend (Jest + Supertest):**

```typescript
// backend/src/__tests__/health.test.ts
import request from 'supertest';
import { createTestApp } from './helpers/app';

const app = createTestApp();

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

**Frontend (Vitest + RTL):**

```typescript
// frontend/src/widgets/voc-workspace/__tests__/VocListPage.integration.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocListPage } from '../VocListPage';
import { VOC_FIXTURES } from '../../../../../shared/fixtures/voc.fixtures';

vi.mock('@entities/voc/api/vocApi', () => ({
  vocApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), /* … */ },
}));
```

**Patterns:**
- `describe` blocks scoped by feature / endpoint / role.
- `it` / `test` titles describe behavior in plain Korean or English; `test.each([...])` used for parameterized contract checks (`voc-contract.test.ts`).
- Async via `await` + `waitFor` (FE) or `await request(app)` (BE).

## Mocking

**Frontend:**
- `vi.mock('@entities/<x>/api/<y>Api', () => ({ /* spies */ }))` — per-module API stubs in widget / page tests.
- `vi.mock('@toast-ui/react-editor', …)` — global mock declared in `frontend/src/test/setup.ts` because Toast UI is jsdom-incompatible.
- MSW v2 server (`frontend/src/test/mocks/server.ts`) for handler-level tests; handlers source data from `shared/fixtures/`.

**Backend:**
- DB: `pg-mem` for routing / controller tests; `@testcontainers/postgresql` for real-Postgres migration tests.
- Auth: `backend/src/auth/__tests__/mockAuth.test.ts` exercises `POST /api/auth/mock-login`.

**What to Mock:**
- External APIs / SDKs at the resource boundary.
- jsdom-incompatible browser APIs (Pointer Events, ResizeObserver, `URL.createObjectURL`, `scrollIntoView`).
- Toast UI editor (replaced with a simple textarea exposing `data-testid="voc-body-editor"`).

**What NOT to Mock:**
- `shared/contracts/` zod schemas — exercise real validation.
- `shared/fixtures/` — use as-is so seed parity holds.
- Permission matrix logic — tested directly, not stubbed.

## Fixtures and Factories

**Source of truth:** `shared/fixtures/`
- `voc.fixtures.ts` (also exports `RowSpec`, `SYS`, `FIXTURE_USERS`, `voc_history` rows)
- `master.fixtures.ts` (`ASSIGNEE_FIXTURES`, `TAG_FIXTURES`, `VOC_TYPE_FIXTURES`)
- `notification.fixtures.ts`, `notice.fixtures.ts`, `faq.fixtures.ts`, `faq-category.fixtures.ts`
- `admin-masters.fixtures.ts`, `admin-tag.fixtures.ts`, `admin-trash.fixtures.ts`, `admin-user.fixtures.ts`

**Parity check — fixture ↔ DB seed (`scripts/check-fixture-seed-parity.ts`):**
- Run: `npm run check:parity`.
- Logic: parses `backend/migrations/003_vocs.sql` for `CREATE TABLE vocs(...)`, lists every NOT NULL column that has no DEFAULT and is not trigger-populated, then asserts that `Object.keys(VOC_FIXTURES[0])` covers them.
- Earlier regex-based version produced false positives because the fixture module exports many non-row keys (`RowSpec`, `SYS`, `FIXTURE_USERS`, `voc_history`); the current version imports the compiled module instead.
- Exit 0 = OK / SKIPPED, exit 1 = mismatch (blocks merge).
- DB seeds: `backend/seeds/dev_seed.sql`, `backend/seeds/mock-users.sql` — applied via `npm run db:seed -w backend`.

**Contract parity:** `backend/src/__tests__/voc-contract.test.ts`, `dashboard-contract.test.ts`, `admin-contract.test.ts` compare zod (`shared/contracts/`) ↔ OpenAPI (`shared/openapi.yaml`) for `required[]`, enum values, and nullable. Drift fails the suite.

## Visual Regression — `scripts/visual-diff.ts` + harness

- Entry shim: `scripts/visual-diff.ts` re-exports `scripts/visual-diff/index.ts`.
- Harness modules: `scripts/visual-diff/{harness,extract,diff,overlays,report,run-diff,screenshot,screenshot-capture,screenshot-index,selectors,tcp-probe,tokens}.ts`.
- Method: Playwright dual-renders the static `prototype/prototype.html` and the React `/voc` route, then writes a prioritized markdown diff report.
- Default report path: `docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md`.
- Default ports: prototype `4174`, React `5173`.
- Component scope: `SELECTOR_MAP` in `scripts/visual-diff/selectors.ts`.
- Baseline screenshots: `prototype/screenshots/` (NOT `benchmark/`). The `01–22-*` ground-truth PNG convention referenced in root `CLAUDE.md` describes the intended baseline catalog; current screenshot output is rooted under the visual-diff report directory.
- One-time install: `npx -w frontend playwright install chromium` (~250 MB; not committed).
- CLI flags (`scripts/visual-diff/index.ts`): `--component=<id>`, `--out=<path>`, `--keep-server`, `--headed`, `--severity=HIGH|MED|LOW`, `--screenshots`.
- Harness self-tests: `scripts/visual-diff/__tests__/{diff,extract,report}.test.ts` with stored snapshots under `__snapshots__/` — these run in the FE Vitest project (see `vite.config.ts` `test.include`).

## Coverage

- No coverage target enforced in CI configs inspected. Run on demand:
  - FE: `npm run test -w frontend -- --coverage`
  - BE: `npm run test -w backend -- --coverage`
- TDD is mandatory only for irreversible surface (auth / billing / permissions / contracts / migrations / BE routes) per root `CLAUDE.md`. Reversible UI work uses a smoke test plus a visual-diff baseline.

## Test Types

**Unit:**
- Pure helpers and hooks (`features/dashboard/__tests__/lockMerge.test.ts`, `useDashboardDraft.test.tsx`).
- Visual-diff harness modules (`scripts/visual-diff/__tests__/`).

**Integration:**
- BE: route + service + repository against `pg-mem` or testcontainers Postgres.
- FE: page / widget tests rendering full route trees with mocked API modules and shared fixtures (`VocListPage.integration.test.tsx`).
- MSW handler tests cover request shape + filter / permission semantics on the mock layer.

**Contract guards:**
- zod ↔ OpenAPI parity (`*-contract.test.ts`).
- Migration assertions per file (`migration-NNN-*.test.ts`).

**E2E (Playwright):**
- Page-spanning flows, real-browser regressions (focus / keyboard / scroll). Component / unit work stays in Vitest.

## Common Patterns

**Async (FE):**
```typescript
await waitFor(() => expect(screen.getByRole('row', { name: /VOC-001/ })).toBeInTheDocument());
await userEvent.click(screen.getByRole('button', { name: /신규/ }));
```

**Async (BE):**
```typescript
const res = await request(app).post('/api/vocs').send(payload);
expect(res.status).toBe(201);
```

**Parameterized contract checks:**
```typescript
test.each(['Voc', 'VocInput'] as const)(
  '%s.required contains voc_type_id+system_id+menu_id',
  (name) => { /* … */ },
);
```

**Role variants:** split into `<Page>.user.test.tsx` and `<Page>.admin.test.tsx` rather than nesting role conditionals.

**Grid / table ARIA gotcha (`frontend/src/CLAUDE.md`):** testing-library `getAllByRole('cell')` does NOT match `gridcell`; use `'gridcell'` directly when querying VOC table rows.

**Convention spec:** `docs/specs/requires/test-conventions.md` (especially §17.2 — shared / fixtures parity rules).

---

*Testing analysis: 2026-05-10*
