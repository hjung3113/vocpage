# frontend/src/CLAUDE.md

## Role

Frontend application source.

## When to look where (top-level)

- Vite entry → `main.tsx`
- Route table → `router.tsx`
- Design token SSOT (Tailwind config + CSS vars derive from this) → `tokens.ts`
- Page-level route components (one file = one route; layout/composition only — feature impl in `features/`; reusable blocks in `components/`; tests in `__tests__/`) → `pages/`
- Custom hooks (cross-feature; API hooks → `api/`; feature-only → `features/<feature>/`) → `hooks/`
- Pure helpers, no React/DOM → `lib/`
- Global CSS / CSS-vars layer → `styles/`
- Test setup, providers, harnesses → `test/`
- App-level state (providers/contexts; local component state stays in component) → `contexts/`

## Sub-tree details

### `api/`

HTTP clients + react-query hooks — single FE↔BE boundary. One file per resource. Types/schemas in `shared/types/` + `shared/contracts/`. Tests use MSW (`__tests__/`).

### `components/`

Reusable UI shared across pages/features. **Feature-only UI lives in `src/features/<feature>/components/`.**

- `common/` — generic, app-agnostic widgets (loaders, error boundaries, formatters). Domain-coupled UI → `voc/` or `features/voc/`.
- `layout/` — app shell: navbar, sidebar, page frames, drawer host, scroll containers. Routing → `router.tsx`. Visual proportions → `uidesign.md`.
- `ui/` — shadcn/ui derivatives (Radix primitives, token-aligned). Button/Card/Input/Dialog/Popover. Token rewrite after fresh shadcn pull → `scripts/shadcn-token-rewrite.ts`.
- `voc/` — VOC list/table parts (Wave 1.6 C-7): `VocRow.tsx` (rows, gridcell ARIA), `VocListHeader.tsx` (sticky header, role=row), `VocTable.tsx` (composition). Token-purity CSS markers in `styles/index.css`. Tests in `__tests__/` — note: testing-library `getAllByRole('cell')` does NOT match `gridcell`; use `'gridcell'` directly.

### `features/`

Feature-scoped UI + logic. Pages compose features.

- `voc/` — VOC list/drawer/create implementation. Spec: `feature-voc.md`.
- `voc/components/` — VOC-only UI (filters, drawer body, create modal pieces). Reusable VOC table parts (used by multiple pages) → `components/voc/`.

### `mocks/`

MSW v2 mocks for dev + tests.

- `handlers/` — one file per resource; backend-shaped responses. Fixture data from `shared/fixtures/`.

### `shared/`

Cross-feature primitives — too cross-cutting for `components/common/`, not feature-owned.

- `ui/` — token-aligned cross-feature atoms.
- `ui/badge/` — badge system: 3 base primitives + 4 semantic wrappers (status/priority/type/count). Chip token SSOT here. Pick semantic wrapper first; primitive only when no match. New semantic wrapper here, no new colors.

### `styles/`

Global CSS — `@font-face`, CSS-vars layer (from `tokens.ts`), reset, top-level utilities. C-marker blocks (e.g. C-7) live in `index.css`. Marker purity tests → `__tests__/`.

### `test/`

Test infra — Vitest setup, providers, MSW server bootstrap, custom `render(...)` helpers.
