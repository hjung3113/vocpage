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

## Implementation Flow

Spec/디자인 정본·정책은 root `CLAUDE.md` 참조. FE 화면 구현 순서:

1. requirements + uidesign 읽기 → 컴포넌트 매핑 → 타입 정의 (no `any`)
2. dummy data 로 빌드 → interaction → API 연결 → states/responsive 마무리
3. Reuse existing components first; 새 컴포넌트는 UI/로직 반복 시에만
4. 페이지 컴포넌트는 작게, Tailwind 중복은 `@apply` 또는 컴포넌트로 추출
5. 항상 처리: loading / error / empty / hover / focus / responsive

## Architecture

- **Views:** VOC list (table with hierarchical accordion rows), side drawer for detail (preserves list context), modal for VOC creation with Toast UI rich text editor.
- **Key hooks:** `useVOCFilter`, `useAutoTag`, `useDrawer`.
- **State:** React Context or Redux for global filter/selection.
- **Base components:** Radix UI primitives — ghost buttons, translucent cards, border-focused inputs.

## Styling Architecture

FE token pipeline: `src/tokens.ts` 가 raw 값의 단일 source — 여기서 `tailwind.config.ts` (utility) + CSS custom properties (`var(--*)`) 두 surface 가 생성된다. 새 토큰이 필요하면 `tokens.ts` + `uidesign.md` 양쪽을 같은 PR(또는 직전 PR)에서 갱신.

토큰 정의·use rule·Tailwind vs CSS var 사용 매트릭스 정본: `docs/specs/requires/uidesign.md` (§10/§12). 룰은 root `CLAUDE.md` 가 정본.

## Conventions

Before writing FE code, scan `docs/specs/requires/*-conventions.md` filenames — pick the matching one. Read with `limit=2` first — line 2 is `When to read` — then read in full only if relevant.

All files in `docs/specs/requires/`: `naming-conventions.md` · `state-management-conventions.md` · `api-conventions.md` · `routing-conventions.md` · `error-loading-conventions.md` · `form-conventions.md` · `table-filter-conventions.md` · `datetime-conventions.md` · `test-conventions.md` · `env-conventions.md`.

## Sub-tree map (non-src)

- `docs/` — FE-local notes/screenshots. Canonical specs = root `docs/specs/`. Wave-scoped FE evidence → `docs/screenshots/<wave>/`.
- `e2e/` — Playwright (page-spanning flows, real-browser regressions: focus/keyboard/scroll). Component/unit tests → Vitest under `src/**/__tests__/`.
- `eslint-rules/` — project-local custom ESLint (e.g. token-purity: no hex/raw OKLCH outside `src/tokens.ts`). Wired in `.eslintrc.base.js`.
- `public/` — Vite static assets, served verbatim from site root. Self-hosted webfonts (Pretendard Variable UI, D2Coding code) in `public/fonts/`, referenced by `@font-face` in `src/styles/`. Typography spec: `uidesign.md`.
- `src/` — see `src/CLAUDE.md`.
