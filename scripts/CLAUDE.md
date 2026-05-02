# scripts/CLAUDE.md

## Role

Repo-level utilities — codemods, parity checks, visual diff. Not application code.

## When to look where

- `shared/fixtures` ↔ `backend/seeds` parity broken → `check-fixture-seed-parity.ts`
- New shadcn component pulled in, needs token rewrite → `shadcn-token-rewrite.ts`
- Prototype vs frontend visual diff → `visual-diff.ts` + `visual-diff/`
