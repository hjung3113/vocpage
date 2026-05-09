# Phase 8 Wave 1 — Pattern Retrospective

**Status:** Active reference for Wave 2+
**Source PRs:** #110 (vertical slice) · #111 (CI baseline)
**Wave 1 closure report:** `phase-8-wave1-closure-report.md`

Wave 1 was the first vertical slice of Phase 8 (VOC list + drawer). The slice
shipped seven concrete patterns we want Wave 2+ to inherit, and three sources
of pain we want Wave 2+ to avoid.

---

## 1. Combined contract pass: C2 (entity) + C3 (io) + C5–C9 (UI surfaces)

We tried to land contracts and the first UI surfaces in one branch (`feat/phase-8-wave1`).
That worked because `shared/contracts/voc/*` is purely declarative and has no
runtime dependency on the rest of the slice — the FE, BE, and fixtures can pin
to the contract independently.

**Pattern for Wave 2+:** combine contract definition with the _first_ consumer
that exercises the contract. Don't open a contract-only PR when the consumer is
landing in the same week — review fatigue is real and a contract without a
caller is hard to evaluate. If the contract has _multiple_ consumers across
waves, split the consumer PRs but keep the contract in the wave that lands first.

## 2. Drawer single-file vs four-file split

Codex round-1 (planning) recommended a four-file split for `VocDrawer`
(presentational shell + tabs + comment thread + history). We chose a single
161-line file because the drawer's panes share state too tightly for clean
boundaries — the four-file version would have either passed every prop down
through a parent shell or pulled state up into context just to satisfy the
split.

**Pattern for Wave 2+:** split components when state can travel down naturally;
keep them combined when sub-components would force a context or prop-drill
detour. The 200-line ceiling is a smell, not a rule. Wave 2 dashboard widgets
likely _will_ split because they own independent data paths.

## 3. RTL matrix: 5 cases collapsed to 3

Initial Wave 1 plan called for five RTL cases per surface (loading / empty /
error / success / permission). We landed three (loading, success, permission)
because (a) MSW handlers cover the empty + error transitions implicitly via
status code branching, and (b) the same `useQuery` machinery is exercised by
every case, so duplicating the wrapper added line count without marginal
coverage.

**Pattern for Wave 2+:** RTL cases worth writing are the ones that exercise
_your_ code, not the library's. If `react-query` already routes to an error
boundary, you don't need a test for "does the error boundary render"; you need
one for "does our error message say the right thing." Wave 2 follow-up B will
add F-T4 (role gate) and F-T5 (filter+drawer race) — these _are_ product
surfaces and don't fall under this collapse.

## 4. U2 zod ↔ openapi guard (Wave 2+ MANDATORY)

`shared/contracts/voc/io.ts` is the single source for both runtime validation
(zod) and the OpenAPI document. The U2 guard test
(`voc-contract.test.ts`) compares the zod schema to the openapi yaml and fails
if they drift. This caught at least one real drift during Wave 1 (a status
enum value missing from openapi).

**Mandatory for Wave 2+:** every new request/response schema that gets an
openapi entry must have a corresponding U2 guard line. Without it, a contract
PR can merge with the openapi yaml lying. The guard is cheap (~30 lines per
schema) and the cost of skipping it is debugging across FE/BE later.

## 5. shared/contracts 3-way split (Wave 2 dashboard MANDATORY)

`shared/contracts/voc/` is now `entity.ts` (DB-shape types), `io.ts` (wire
schemas), `note.ts` (sub-domain). Importing the full barrel was tempting but
caused circular-import warnings during the typecheck phase (entity → io → entity
when zod inference re-exported types).

**Mandatory for Wave 2 dashboard:** create `shared/contracts/dashboard/` with
the same three files (entity / io / sub-domain) before any dashboard endpoint.
Don't co-locate dashboard types in `voc/` — the cross-domain coupling will leak
into FE bundles that don't need dashboard code.

## 6. U3 jest.mock pattern (Wave 2+ BE STANDARD)

BE tests (`backend/src/__tests__/vocs.test.ts`) use module-level
`jest.mock('../repository/voc', …)` instead of dependency-injected fakes. The
mock provides a fixture-backed in-memory store that all tests share via
`__reset()`. This let us write 9 endpoint tests without spinning up a
Postgres container per test.

**Standard for Wave 2+ BE:** module-level mock at the repository boundary,
fixture-backed store, `__reset()` between tests. Do **not** mock at the service
layer — that hides bugs like the round-1 `voc_type_id` filter drop. The cost
is that SQL-shape errors slip past these tests; that's why follow-up B adds an
unmocked integration test layer (see §10 below).

## 7. shared/contracts/voc/users.ts (Wave 1 CI rescue, document it)

Late in Wave 1 the BE prod build broke because `mockUsers.ts` imported
`shared/fixtures/voc.fixtures` from a path that violated `rootDir`. We extracted
`FIXTURE_USERS` to `shared/contracts/voc/users.ts` (a contracts file, not a
fixtures file) and pointed the prod import there.

**Pattern for Wave 2+:** anything imported by _prod_ code from `shared/` lives
under `shared/contracts/`. `shared/fixtures/` is test-only. When you find prod
code reaching into fixtures, that's a sign the data model wants to move into a
contract.

---

## 8. Wave 2 entry prerequisites

Before opening the Wave 2 dashboard branch:

1. ☐ Wave 1 closure report is reviewed and signed off by user.
2. ☐ Follow-up A (Playwright happy path) and B (RTL F-T4/F-T5 + integration
   test layer) PRs are merged.
3. ☐ Follow-up C (VITE_USE_MSW=false integration verification) result is in the
   closure report — `/voc` returns the expected fixture shape against the
   real BE/Postgres stack.
4. ☐ Follow-up D (Lighthouse a11y ≥ 95) result is in the closure report. If
   <95, fix PR `fix/wave1-a11y` is merged.
5. ☐ `shared/contracts/dashboard/{entity,io,…}.ts` skeleton exists with U2
   guard lines for every schema (per §5 above).
6. ☐ Dashboard openapi paths drafted in `openapi.yaml` and pass U2 guard.

If any of these is open, Wave 2 implementation MUST NOT start. Update plan
docs first.

---

## 9. Sources of pain (avoid in Wave 2)

- **Late CI baseline blocker:** Wave 1 was nearly done before linux-x64 native
  bindings (rollup, lightningcss, oxide) surfaced as a CI red. PR #111
  unblocked it but cost a separate review cycle. **Fix forward:** any new
  toolchain or bundler bump in Wave 2 lands its own PR with a green CI run on
  ubuntu-latest _first_, before any feature commits depend on it.
- **rootDir vs shared/:** the prod tsc emit had `rootDir './src'` which forbade
  shared/ imports. We had to widen `backend/tsconfig.json` rootDir and split
  `tsconfig.typecheck.json`. **Fix forward:** when adding a shared/ import
  from prod code, run `npm run build -w backend` locally before push — local
  `tsc --noEmit` won't catch rootDir violations.
- **Mocked repository hides SQL bugs:** the `voc_type_id` filter drop got
  through 9 BE tests because the mock filtered correctly while the real
  repository didn't. **Fix forward:** follow-up B introduces an unmocked
  integration test layer; from Wave 2 BE, every new repository function gets
  one integration test alongside the mocked endpoint tests.

---

## 10. Wave 2 day-1 checklist

- Read this doc + closure report.
- Branch `feat/phase-8-wave2` off main.
- Land `shared/contracts/dashboard/` skeleton in commit 1 (with U2 guards).
- Land first dashboard endpoint + RTL test in commit 2.
- Open PR after both commits; do not bundle Wave 2 with any further wave.
