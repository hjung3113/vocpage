# frontend/CLAUDE.md

React SPA for the VOC management system. Read root `CLAUDE.md` first.

**Stack:** React + TypeScript, Vite, Tailwind v4, Toast UI Editor (rich text), shadcn/ui (Radix) + Lucide, @tanstack/react-query v5, @tanstack/react-table v8, react-hook-form + zod (`shared/`), sonner, date-fns + react-day-picker, recharts (lazy), MSW v2, Vitest. Full version list: `docs/specs/requires/requirements.md §3`.

## Commands

```bash
npm run dev                              # Vite dev server
npm run build                            # Production build
npm run test                             # Vitest
npm run test -- path/to/file.test.ts     # Single test file
```

## Implementation Flow

Per FE screen (spec sources: root `CLAUDE.md`):

1. Read `requirements.md` + `uidesign.md` → map components → define types (no `any`).
2. Build with dummy data → wire interactions → connect API → finalize states / responsive.
3. Reuse existing components first; new components only when UI / logic repeats.
4. Keep page components small; extract Tailwind repetition into components or `@apply`.
5. Always handle: loading / error / empty / hover / focus / responsive.

## Architecture

- **Views:** VOC list (table with hierarchical accordion rows), side drawer for detail (preserves list context), modal for VOC creation with Toast UI rich text editor.
- **Key hooks:** `useVOCFilter`, `useAutoTag`, `useDrawer`.
- **State:** React Context or Redux for global filter / selection.
- **Base components:** Radix UI primitives — ghost buttons, translucent cards, border-focused inputs.

## Styling Architecture

FE token pipeline: `src/tokens.ts` is the raw-value SSOT — it generates `tailwind.config.ts` (utility) + CSS custom properties (`var(--*)`).

Token definitions, use rules, and the Tailwind-vs-CSS-var matrix live in `docs/specs/requires/uidesign.md` (§10 CSS Reference, §12 Token Architecture, §15 Agent Prompt Guide).

**Visual rules:**

- All colors via `var(--token)` — never hex / OKLCH literals.
- Typography: Pretendard Variable (UI), D2Coding (code / issue IDs).
- 8px grid, max-width ~1200px, elevation via background opacity, not shadow darkness.

**FE absolute rule:** when touching a visual surface, read `uidesign.md` first to confirm existing token contracts, then write code. New tokens require updating `tokens.ts` + `uidesign.md` in the same PR (or the PR immediately preceding). New components start from a §15 example.

**`uidesign.md` exclusivity (defined there only — no duplication):**

- **In scope:** token definitions and use rules, component visual contracts, §15 Agent Prompt Guide.
- **Out of scope:** implementation paths (`frontend/src/...`, `*.tsx`, `tokens.ts`) · build / lint tool names (Stylelint / ESLint / husky) · Wave / Phase / PR numbers / dates · behavior / routing / state contracts (→ `feature-*.md`) · schema / migration (→ `requirements.md`). If found, treat as a leak and split immediately.

## Conventions

Before writing FE code, scan `docs/specs/requires/*-conventions.md` filenames — pick the matching one. Read with `limit=2` first (line 2 = `When to read`), then read in full only if relevant.

Files in `docs/specs/requires/`: `naming-conventions.md` · `state-management-conventions.md` · `api-conventions.md` · `routing-conventions.md` · `error-loading-conventions.md` · `form-conventions.md` · `table-filter-conventions.md` · `datetime-conventions.md` · `test-conventions.md` · `env-conventions.md`.

## Sub-tree map (non-src)

- `docs/` — FE-local notes / screenshots. Canonical specs = root `docs/specs/`. Wave-scoped FE evidence → `docs/screenshots/<wave>/`.
- `e2e/` — Playwright (page-spanning flows, real-browser regressions: focus / keyboard / scroll). Component / unit tests → Vitest under `src/**/__tests__/`.
- `eslint-rules/` — project-local custom ESLint (e.g. token-purity: no hex / raw OKLCH outside `src/tokens.ts`). Wired in `.eslintrc.base.js`.
- `public/` — Vite static assets, served verbatim from site root. Self-hosted webfonts (Pretendard Variable UI, D2Coding code) in `public/fonts/`, referenced by `@font-face` in `src/styles/`. Typography spec: `uidesign.md`.
- `src/` — see `src/CLAUDE.md`.
