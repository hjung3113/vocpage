# frontend/src/CLAUDE.md

## Role

Frontend application source.

## When to look where

- Vite entry → `main.tsx`
- Route table → `router.tsx`
- Design token SSOT (Tailwind config + CSS vars derive from this) → `tokens.ts`
- HTTP clients + react-query hooks → `api/`
- Page-level route components → `pages/`
- Reusable UI (generic / layout / shadcn / VOC table) → `components/{common,layout,ui,voc}/`
- Feature-scoped UI + logic → `features/<feature>/`
- Cross-feature primitives (badges, etc.) → `shared/ui/`
- Custom hooks → `hooks/`
- Pure helpers, no React → `lib/`
- MSW handlers + test fixtures → `mocks/`
- Global CSS / CSS-vars layer → `styles/`
- Test setup, providers, harnesses → `test/`
- App-level state (providers/contexts) → `contexts/`
