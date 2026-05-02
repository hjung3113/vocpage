# backend/src/validators/CLAUDE.md

## Role

Express middleware that wires zod schemas (from `shared/contracts/`) into routes for input validation.

## When to look where

- Wiring/changing input validation for a route → here
- Schema definitions themselves → `shared/contracts/`
- Error response shape → `middleware/` (error mapper)
