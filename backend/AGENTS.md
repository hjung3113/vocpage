# backend/AGENTS.md

Express REST API for the VOC management system. Read root `AGENTS.md` first for cross-cutting governance.

## Commands

```bash
npm run dev                                      # tsx watch
npm run test                                     # Jest
npm run test -- --testPathPattern=filename       # Single test
```

## Architecture

- REST CRUD for VOCs, comments, attachments, tags.
- `validateADSession` middleware for AD/LDAP authentication — runs before every protected route.
- Auto-tagging service: matches keyword/regex rules from the `tag_rules` table → assigns tags on VOC creation.
- Hierarchical queries via `parent_id` self-join on the `vocs` table (sub-task trees).

## Database Schema

- **PostgreSQL + pgvector extension** — Docker image `pgvector/pgvector:pg16`. Initial migration must run `CREATE EXTENSION IF NOT EXISTS vector;` before any table DDL.
- `vocs` — core entity; `parent_id` self-join for sub-tasks. Includes `embedding vector(1536) NULL` column reserved for future similarity search / RAG — **MVP does not populate or query this column**. HNSW index added in a later migration when the feature lands.
- `tags` + `voc_tags` — M:N tag relationship.
- `tag_rules` — keyword/regex patterns driving auto-tagging.
- `users` — identity; linked to AD session on login.
- `comments` — FK → `vocs.id`.
- `attachments` — FK → `vocs.id`; file metadata only, blob in object storage.

Full schema DDL and column-level spec: `docs/specs/requires/requirements.md` (data model section).

## Business Rules (cross-reference)

Behavioral contracts (what auto-tagging does, what the AD session middleware rejects, sub-task propagation rules) live in `docs/specs/requires/requirements.md`. **Do not duplicate behavioral rules into code comments** — link to the spec section.
