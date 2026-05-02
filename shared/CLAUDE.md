# shared/CLAUDE.md

## Role

Types, schemas, and fixtures used by **both** `frontend/` and `backend/`. The single contract surface neither side owns alone.

## When to look where

- Domain types shared by FE/BE → `types/`
- zod schemas (runtime validation, form + route input from one source) → `contracts/`
- Mock + seed shared data → `fixtures/`
- REST contract reference → `openapi.yaml`
- Workspace config → `package.json`, `tsconfig.json`
