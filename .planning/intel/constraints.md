# Constraints (SPECs)

Synthesized from 12 SPEC-class documents covering API contracts, schemas, conventions, and the design system.

---

## VOC core feature spec
### feature-voc — VOC issue code, status state machine, permissions
- source: `docs/specs/requires/feature-voc.md`
- type: api-contract + schema + protocol
- content: VOC issue code format, status transition matrix, review_status sub-state machine, permission model, voc_history, voc_payload_history, embedding integration.
- scope: VOC issue code, status transitions, review_status, permissions, voc_history, voc_payload_history, embedding

## External integrations
### external-masters — External master integration
- source: `docs/specs/requires/external-masters.md`
- type: api-contract + schema
- content: Field mappings, MSSQL queries, cache structures, refresh contracts for equipment / DB / program masters; admin refresh API; structured_payload validation.
- scope: external masters (equipment, DB, program), MSSQL integration, admin refresh API
- cross_refs: requirements.md, ADR-0004 (admin permissions binding)

## Frontend conventions (10 SPECs)

### api-conventions — Frontend API layer
- source: `docs/specs/requires/api-conventions.md`
- type: api-contract
- content: Response envelopes, file locations, query key factories, auth boundaries, cache invalidation rules, MSW handler structure, pagination shape.
- scope: HTTP client, React Query, query keys, auth boundary, MSW handlers

### datetime-conventions — Date / time handling
- source: `docs/specs/requires/datetime-conventions.md`
- type: protocol
- content: UTC storage, Asia/Seoul display, date-fns-tz usage, `shared/lib/date.ts` function contracts, LocalDate vs Instant types.
- scope: shared/lib/date.ts, date-fns-tz, UTC↔Asia/Seoul

### env-conventions — Env variable handling
- source: `docs/specs/requires/env-conventions.md`
- type: protocol
- content: File location, Zod-validated implementation pattern, test setup, variable list, access principles. `shared/config/env.ts`.
- scope: import.meta.env, Vite, Zod schema validation, vitest test env

### error-loading-conventions — Error / Loading / Empty
- source: `docs/specs/requires/error-loading-conventions.md`
- type: protocol
- content: 401/403/422 mapping, component placement for loading/empty/error states, permission UI patterns.
- scope: shared/ui error/loading/empty components

### form-conventions — Forms & validation
- source: `docs/specs/requires/form-conventions.md`
- type: protocol
- content: RHF + Zod tooling, schema file locations, naming rules, feature module structure, hook return shape, server error mapping.
- scope: react-hook-form, zod schemas, shared/contracts, features module structure

### naming-conventions — Naming
- source: `docs/specs/requires/naming-conventions.md`
- type: protocol
- content: Folder/file/component/hook/event-handler naming rules for FE (React + TS).
- scope: frontend naming

### routing-conventions — Routing
- source: `docs/specs/requires/routing-conventions.md`
- type: protocol
- content: Route list, URL conventions, Drawer deep-link rules, query string rules, auth redirect behavior, admin routes.
- scope: frontend routing, drawer deep-links, auth redirects

### state-management-conventions — State management
- source: `docs/specs/requires/state-management-conventions.md`
- type: protocol
- content: Where to store state (Query / URL / Context / useState); rules for TanStack Query, Context, URL params; AuthContext / VOCFilterContext / MasterCacheContext semantics.
- scope: TanStack Query, React Context, URL search params, RHF

### table-filter-conventions — Tables & filters
- source: `docs/specs/requires/table-filter-conventions.md`
- type: protocol
- content: Table pagination, server-side filtering, URL query synchronization, column definition conventions.
- scope: pagination, filters, URL params, TanStack Query keys, column defs

### test-conventions — Test & mocks
- source: `docs/specs/requires/test-conventions.md`
- type: protocol
- content: Test prioritization, fixture locations, MSW structure/setup, test file organization. Vitest + Playwright.
- scope: Vitest, Playwright, MSW, fixture parity (check-fixture-seed-parity.ts)

## Design system

### uidesign — VOCpage UI Design System
- source: `docs/specs/requires/uidesign.md`
- type: schema (visual tokens)
- content: OKLCH color tokens, typography, surfaces & elevation, border-radius, shadows, spacing, component visuals, layout rules. Light/dark themes. §16 contains Flowline-alignment primitives spec.
- scope: design tokens, color palette (OKLCH), theme system, typography, surfaces, component visuals
- note: Authoritative visual spec; per project CLAUDE.md, prototype/ is no longer a visual reference (since 2026-05-09).
