# frontend/src/api/CLAUDE.md

## Role

HTTP clients and react-query hooks — the single boundary between FE and the backend.

## When to look where

- A specific resource's calls (`vocs.ts`, `comments.ts`, …) → file per resource
- Types / runtime schemas → `shared/types/`, `shared/contracts/`
- Tests using MSW handlers → `__tests__/`
