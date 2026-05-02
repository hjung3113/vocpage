# frontend/src/components/layout/CLAUDE.md

## Role

App shell — navbar, sidebar, page frames, drawer host. Owns viewport-level concerns.

## When to look where

- Navigation chrome, sidebar/drawer host, scroll containers → here
- Routing decisions → `router.tsx`
- Visual proportions and tokens → `docs/specs/requires/uidesign.md`
