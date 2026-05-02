# backend/config/CLAUDE.md

## Role

Static configuration data loaded by the backend at boot.

## When to look where

- Master data (enums, lookup tables) seeded into the DB or served via `external-masters` endpoints → `masters/`
- Spec for master data shape → `docs/specs/requires/external-masters.md`
- Schema for master files → `shared/contracts/master/`
