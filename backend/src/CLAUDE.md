# backend/src/CLAUDE.md

## Role

Backend source. Layered: `routes/` → `controllers/` → `services/` → `repository/`. Auth + middleware + validators wrap the layers.

## When to look where

- App bootstrap → `index.ts`
- Postgres pool + pgvector → `db.ts`
- Structured logger → `logger.ts`
- Auth (dev `POST /api/auth/mock-login` 4 roles via mockLogin; `validateADSession` stub for Phase 9; permission decisions ≠ auth → `services/permissions/`) → `auth/`
- HTTP route definitions (URL+method+middleware+controller wiring; entry for finding a URL; REST contract → `shared/openapi.yaml`) → `routes/`
- Thin HTTP adapters (parse/validate/delegate/format; no business logic; error→HTTP status mapping in `middleware/`) → `controllers/`
- Domain logic (auto-tag, hierarchy, side-effects; behavioral spec → `feature-voc.md`) → `services/`
- Single permission truth (`assertCanManageVoc(user, voc, action)`; matrix spec → `feature-voc.md §8.4-bis`) → `services/permissions/`
- SQL against Postgres (only place touching `db.ts`; hierarchical VOC tree `parent_id` self-join → VOC repo) → `repository/`
- Express middleware (auth, logging, error mapping, request ID, CORS; single source of HTTP status from exceptions) → `middleware/`
- zod-to-Express adapters (schemas live in `shared/contracts/`) → `validators/`
- Cross-layer integration tests → `__tests__/`
