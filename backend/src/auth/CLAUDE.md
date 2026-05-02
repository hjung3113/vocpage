# backend/src/auth/CLAUDE.md

## Role

Authentication primitives. Currently dev-mode only; AD/OIDC lands in Phase 9.

## When to look where

- Dev login (`POST /api/auth/mock-login`, 4 roles) → mockLogin module
- AD session middleware (stub for Phase 9) → `validateADSession`
- Auth helper unit tests → `__tests__/`
- Permission decisions (not auth) → `services/permissions/`
