# frontend/src/shared/ui/badge/CLAUDE.md

## Role

Badge system — 3 base primitives + 4 semantic wrappers (status / priority / type / count). Chip token SSOT lives here.

## When to look where

- Picking a badge variant → semantic wrapper first, primitive only if no semantic match
- Adding a new semantic wrapper → here, plus chip tokens (don't introduce new colors)
- Tests → `__tests__/`
