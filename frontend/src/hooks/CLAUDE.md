# frontend/src/hooks/CLAUDE.md

## Role

App-wide custom hooks — `useVOCFilter`, `useAutoTag`, `useDrawer`, etc.

## When to look where

- Cross-feature behavior abstracted as a hook → here
- API-specific hooks (`useXxxQuery`) → `src/api/`
- Feature-only hooks → `src/features/<feature>/`
