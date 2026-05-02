# backend/src/repository/CLAUDE.md

## Role

Persistence layer — SQL queries against Postgres. The only place that touches `db.ts`.

## When to look where

- A specific table query or join → repo file for that resource
- Hierarchical VOC tree queries (`parent_id` self-join) → VOC repository
- Schema overview → `backend/CLAUDE.md`
- Domain logic (not SQL) → `services/`
