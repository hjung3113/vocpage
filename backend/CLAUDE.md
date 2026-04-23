# backend/CLAUDE.md

Express REST API for the VOC management system. Read root `CLAUDE.md` first for cross-cutting governance.

## Status

Not yet scaffolded. This file is a spec stub — it captures architectural decisions so design-phase planning stays consistent.

## Commands (once scaffolded)

```bash
npm run dev                                      # ts-node-dev watch
npm run test                                     # Jest
npm run test -- --testPathPattern=filename       # Single test
```

## Architecture

- REST CRUD for VOCs, comments, attachments, tags.
- `validateADSession` middleware for AD/LDAP authentication — runs before every protected route.
- Auto-tagging service: matches keyword/regex rules from the `tag_rules` table → assigns tags on VOC creation.
- Hierarchical queries via `parent_id` self-join on the `vocs` table (sub-task trees).

## Database Schema

- `vocs` — core entity; `parent_id` self-join for sub-tasks.
- `tags` + `voc_tags` — M:N tag relationship.
- `tag_rules` — keyword/regex patterns driving auto-tagging.
- `users` — identity; linked to AD session on login.
- `comments` — FK → `vocs.id`.
- `attachments` — FK → `vocs.id`; file metadata only, blob in object storage.

Full schema DDL and column-level spec: `docs/specs/requires/requirements.md` (data model section).

## Business Rules (cross-reference)

Behavioral contracts (what auto-tagging does, what the AD session middleware rejects, sub-task propagation rules) live in `docs/specs/requires/requirements.md`. **Do not duplicate behavioral rules into code comments** — link to the spec section.

## Safety Echoes (also in root)

- **No implementation without approval** — never write route/service code until the user explicitly says to start
- **Never push directly to main** — feature branch → PR → merge
- **Canonical docs live in `docs/specs/`** — not `.omc/plans/` or tool scratch dirs
