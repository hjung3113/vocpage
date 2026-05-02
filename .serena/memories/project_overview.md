# vocpage — Project Overview

VOC (Voice of Customer) management system. Currently in Phase 8 (Wave 1.5).

## Architecture (three-tier)

- `frontend/` — React + TypeScript + Vite + Tailwind v4 SPA
- `backend/` — Node + Express + TypeScript + PostgreSQL/pgvector REST API
- `shared/` — shared TypeScript contracts (e.g. `shared/contracts/voc/io.ts`)
- `prototype/` — static HTML visual sandbox (reference only, never copy code into prod)
- `docker-compose.yml` — `docker compose up` starts FE + BE + Postgres

## Canonical docs (read these, not the code, for "what/why")

- `CLAUDE.md` (root) — authoritative governance
- `claude-progress.txt` (≤30 lines) — current session entrypoint
- `docs/specs/plans/next-session-tasks.md` — pending tasks
- `docs/specs/plans/phase-N.md` — active phase plan (currently phase-8.md)
- `docs/specs/requires/requirements.md` — product spec
- `docs/specs/requires/uidesign.md` — design system (English only)
- `docs/specs/README.md` — Documentation Hygiene policy
- `frontend/CLAUDE.md`, `backend/CLAUDE.md`, `prototype/CLAUDE.md` — sub-dir guides

Sub-dir CLAUDE.md must be read first when working inside that sub-dir.
