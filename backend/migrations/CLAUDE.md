# backend/migrations/CLAUDE.md

## Role

Sequential append-only SQL migrations applied in numeric order. Filename pattern: `NNN_description.sql`.

## When to look where

- Current schema state → latest numbered migration (013 as of Wave 1.5-β: dev role + voc origin metadata)
- pgvector setup → first migration (`CREATE EXTENSION vector` runs before any DDL)
- Schema overview, business meaning of columns → `backend/CLAUDE.md` and `docs/specs/requires/requirements.md`
