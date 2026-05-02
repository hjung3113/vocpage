# frontend/src/features/CLAUDE.md

## Role

Feature-scoped UI + logic. Pages compose features; features own the components and hooks specific to them.

## When to look where

- VOC feature (list view composition, filters, drawer wiring) → `voc/`
- Cross-feature reusable primitives → `src/components/` or `src/shared/ui/`
