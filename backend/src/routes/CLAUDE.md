# backend/src/routes/CLAUDE.md

## Role

Express route definitions — wire URL + method + middleware + controller. Declarative; no logic.

## When to look where

- Finding the entry point for a URL → here
- Validation hookup for a route → `validators/`
- REST contract reference → `shared/openapi.yaml`
- Route-level integration tests → `__tests__/`
