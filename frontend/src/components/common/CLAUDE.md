# frontend/src/components/common/CLAUDE.md

## Role

Generic, app-agnostic widgets — error boundaries, loaders, date/text formatters.

## When to look where

- Reaching for a small reusable widget (no domain coupling) → here
- Tests → `__tests__/`
- Domain-coupled component (e.g. references "VOC") → `components/voc/` or `features/voc/`
