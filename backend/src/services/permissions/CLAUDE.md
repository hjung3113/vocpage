# backend/src/services/permissions/CLAUDE.md

## Role

Single source of permission truth. `assertCanManageVoc(user, voc, action)` is the entry point used everywhere.

## When to look where

- Asking "can role X do action Y on resource Z" → here
- Matrix spec (role × action × ownership) → `docs/specs/requires/feature-voc.md §8.4-bis`
- Tests covering the matrix → `__tests__/`
