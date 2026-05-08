# frontend/CLAUDE.md

React SPA for the VOC management system. Read root `CLAUDE.md` first for cross-cutting governance.

**Stack:** React + TypeScript, Vite, Tailwind CSS v4, Toast UI Editor (rich text), shadcn/ui (Radix 카피본) + Lucide, @tanstack/react-query v5, @tanstack/react-table v8, react-hook-form + zod (shared/), sonner, date-fns + react-day-picker, recharts (lazy), MSW v2, Vitest. **TDD 필수** (root CLAUDE.md). 전체 OSS·버전: `docs/specs/requires/requirements.md §3`.

## Status

`/voc` 단일 PR 통합 완성 작업 중 (정본: `docs/specs/plans/voc-completion.md` — 다음 세션 신설). Current `src/` tree: `main.tsx`, `router.tsx`, `tokens.ts`, `pages/`, `api/`, `components/{common,voc,layout,ui}/`, `features/`, `contexts/`, `hooks/`, `lib/`, `mocks/` (MSW v2 handlers), `styles/`, `test/`. Next: Wave 2 (Dashboard).

## Commands

```bash
npm run dev                              # Vite dev server
npm run build                            # Production build
npm run test                             # Vitest
npm run test -- path/to/file.test.ts     # Single test file
```

## Implementation Reference (2026-05-09~)

정본은 `docs/specs/requires/requirements.md` + `docs/specs/requires/uidesign.md` 두 문서뿐. `prototype/` 디렉터리는 더 이상 reference 가 아니다 (parity·픽셀·DOM 인용 금지).

화면 구현 시:

- requirements.md 의 화면/기능 사양 → uidesign.md 의 토큰·레이아웃·상태로 치환
- Reuse existing components first; 새 컴포넌트는 UI/로직 반복 시에만
- 페이지 컴포넌트는 작게, Tailwind 중복은 `@apply` / 컴포넌트로 추출
- 데이터가 있는 경우 TypeScript 타입 먼저 (no `any`)
- 항상 처리: loading / error / empty / hover / focus / responsive

Flow: read requirements + uidesign → map components → define types → build with dummy data → wire interactions → connect API → polish states/responsive.

## Architecture

- **Views:** VOC list (table with hierarchical accordion rows), side drawer for detail (preserves list context), modal for VOC creation with Toast UI rich text editor.
- **Key hooks:** `useVOCFilter`, `useAutoTag`, `useDrawer`.
- **State:** React Context or Redux for global filter/selection.
- **Base components:** Radix UI primitives — ghost buttons, translucent cards, border-focused inputs.

## Styling Architecture

Token pipeline: `src/tokens.ts` → `tailwind.config.ts` (utility classes) + CSS custom properties (`var(--*)`)

Full token reference: `docs/specs/requires/uidesign.md §10 CSS Reference` and `§12 Token Architecture`.

**When to use which:**

- Layout / spacing / flex / grid → Tailwind utility (`flex gap-2 px-4`)
- Static color on a standard element → Tailwind utility (`bg-brand text-primary`)
- Dynamic color passed to JS (charts, Toast UI, canvas) → import from `tokens.ts` directly
- Inline style in JSX → CSS var (`style={{ color: 'var(--text-secondary)' }}`)
- Custom CSS / `@apply` → CSS var (`color: var(--text-primary)`)

**Hard rules:**

- Never write hex or raw OKLCH values outside of `src/tokens.ts`
- If a token doesn't exist for what you need, add it to `src/tokens.ts` + `uidesign.md §12` first, then use it
- Never duplicate a token value — one source, two surfaces (Tailwind + CSS vars)

Key tokens: `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--brand)` / `var(--accent)` / `var(--text-primary)` / `var(--text-secondary)`

## Conventions

Before writing FE code, look up the task in `docs/specs/README.md §0.2` (task → file + section routing table). Read any convention file with `limit=2` first — line 2 is `When to read` — then read in full only if relevant.

All files in `docs/specs/requires/`: `naming-conventions.md` · `state-management-conventions.md` · `api-conventions.md` · `routing-conventions.md` · `error-loading-conventions.md` · `form-conventions.md` · `table-filter-conventions.md` · `datetime-conventions.md` · `test-conventions.md` · `env-conventions.md`.

## Sub-tree map (non-src)

- `docs/` — FE-local notes/screenshots. Canonical specs = root `docs/specs/`. Wave-scoped FE evidence → `docs/screenshots/<wave>/`.
- `e2e/` — Playwright (page-spanning flows, real-browser regressions: focus/keyboard/scroll). Component/unit tests → Vitest under `src/**/__tests__/`.
- `eslint-rules/` — project-local custom ESLint (e.g. token-purity: no hex/raw OKLCH outside `src/tokens.ts`). Wired in `.eslintrc.base.js`.
- `public/` — Vite static assets, served verbatim from site root. Self-hosted webfonts (Pretendard Variable UI, D2Coding code) in `public/fonts/`, referenced by `@font-face` in `src/styles/`. Typography spec: `uidesign.md`.
- `src/` — see `src/CLAUDE.md`.
