# backend/seeds/CLAUDE.md

## Role

Database seed data for dev/test. Mirrors `shared/fixtures/` so FE mocks and BE tests see the same IDs and shapes.

## When to look where

- Adding/changing a seed → here, plus matching fixture in `shared/fixtures/`
- Parity check (CI) → `scripts/check-fixture-seed-parity.ts`
