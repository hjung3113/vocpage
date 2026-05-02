# shared/contracts/CLAUDE.md

## Role

zod schemas — single source of runtime validation for FE forms and BE route input. Same shape, same error messages, both sides.

## When to look where

- VOC schemas (create/update/list/filter) → `voc/`
- Notification schemas → `notification/`
- Master data schemas (lookups, enums) → `master/`
