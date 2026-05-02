# frontend/src/components/voc/CLAUDE.md

## Role

VOC list/table components — header, row, table composition (Wave 1.6 C-7 result).

## When to look where

- Row rendering, grid layout, ARIA roles → `VocRow.tsx`
- Header (sticky, role=row) → `VocListHeader.tsx`
- Table composition (header + rows) → `VocTable.tsx`
- Token-purity CSS markers → `src/styles/index.css` (C-7 marker block)
- Tests → `__tests__/`
