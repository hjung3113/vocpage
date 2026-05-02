# frontend/src/components/voc/**tests**/CLAUDE.md

## Role

Vitest tests for VOC table components.

## When to look where

- Row/header rendering, gridcell ARIA, token purity → tests here
- Note: `getAllByRole('cell')` does not match `gridcell` (testing-library limitation) — use `'gridcell'` directly
