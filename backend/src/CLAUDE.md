# backend/src/CLAUDE.md

## Role

Backend source. Layered: `routes/` → `controllers/` → `services/` → `repository/`.

## When to look where

- App bootstrap → `index.ts`
- Postgres pool + pgvector → `db.ts`
- Structured logger → `logger.ts`
- Auth (mockLogin, AD session stub) → `auth/`
- HTTP route definitions → `routes/`
- Thin HTTP adapters (parse/validate/delegate) → `controllers/`
- Domain logic (auto-tag, permissions, side-effects) → `services/`
- SQL queries → `repository/`
- Express middleware → `middleware/`
- zod-to-Express adapters → `validators/`
- Cross-layer integration tests → `__tests__/`
