---
phase: 01-tag-rules-consolidation
plan: 02
subsystem: backend-migration, fixtures, parity-tooling
tags: [wave-1, tdd-green, schema-reshape]
dependency_graph:
  requires:
    - 01-01 (Wave 0 RED tests + parity TARGETS scaffolding)
  provides:
    - backend/migrations/024_tag_rules_created_by.sql (DDL: keywords[]+match_mode+created_by, drops pattern)
    - tag_rules post-024 schema (id, name, tag_id, kind, is_active, sort_order, created_at, suspended_until, keywords, match_mode, created_by)
    - shared/fixtures/admin-tag-rule.fixtures.ts reshaped to new schema
    - scripts/check-fixture-seed-parity.ts handles multi-clause ALTER TABLE
  affects:
    - Plan 03 (zod contracts) consumes the post-024 column set as schema source of truth
    - Plan 04 (BE routes) writes against the new columns; pushes mig 024 in [BLOCKING] gate
tech_stack:
  added: []
  patterns:
    - Multi-clause ALTER TABLE parsing in parity script (split body by top-level commas before ADD/DROP/ALTER/RENAME)
    - Behavioural NULL probe for ALTER-added nullable columns (pg-mem information_schema quirk)
key_files:
  created:
    - backend/migrations/024_tag_rules_created_by.sql
  modified:
    - backend/src/__tests__/migration-024.test.ts
    - scripts/check-fixture-seed-parity.ts
    - shared/fixtures/admin-tag-rule.fixtures.ts
decisions:
  - "Mig 024 is irreversible (DDL push gated by Plan 04). Down migration restores `pattern text NOT NULL DEFAULT ''` and drops the three additions; pg-mem round-trip verifies both directions."
  - "OQ-R1 Option C confirmed in DDL: keywords text[] NOT NULL DEFAULT '{}' + match_mode text NOT NULL DEFAULT 'keyword'. No JSON-encoded pattern column."
  - "Audit (01-MATCHER-AUDIT.md) preserved: 0 production reads of tag_rules.pattern. No service/repository edits required this plan."
  - "Parity script generalized to support multi-clause ALTER TABLE statements — needed because mig 024 uses the comma-separated form for atomicity (ADD 3 + DROP 1 in one statement)."
metrics:
  duration: ~7 min
  completed: 2026-05-10
---

# Phase 01 Plan 02: Mig 024 GREEN Summary

TDD GREEN phase for mig 024. RED tests staged in Plan 01-01 are now live and passing; tag_rules schema reshape (`pattern → keywords[]` + `match_mode` + `created_by`) is committed; parity script and fixture speak the new shape.

## Migration shape (final tag_rules columns after mig 024)

| Column          | Type          | Null | Default     | Source mig |
| --------------- | ------------- | ---- | ----------- | ---------- |
| id              | uuid          | NO   | uuid_generate_v4() | 004 |
| name            | text          | NO   | —           | 004 |
| tag_id          | uuid          | NO   | —           | 004 |
| kind            | text          | NO   | 'general'   | 004 |
| is_active       | boolean       | NO   | true        | 004 |
| sort_order      | int           | NO   | 0           | 004 |
| created_at      | timestamptz   | NO   | now()       | 004 |
| suspended_until | timestamptz   | YES  | —           | 014 |
| **keywords**    | **text[]**    | NO   | '{}'        | **024** |
| **match_mode**  | **text**      | NO   | 'keyword'   | **024** |
| **created_by**  | **uuid**      | YES  | —           | **024** |

Removed: `pattern text NOT NULL` (legacy single-regex column).

## Reconciled files

| File | Action | Verification |
| --- | --- | --- |
| `backend/migrations/024_tag_rules_created_by.sql` | NEW — Up adds 3 cols + drops pattern; Down restores pattern + drops 3 cols. | 8 grep assertions all pass (Task 1.02.1 acceptance). |
| `backend/src/__tests__/migration-024.test.ts` | RED→GREEN: removed `fs.existsSync` gate + `test.todo` scaffolding; switched `created_by` nullability to behavioral INSERT probe. | 5/5 GREEN. |
| `shared/fixtures/admin-tag-rule.fixtures.ts` | Dropped `pattern` field, added `keywords: string[]`, `match_mode: 'keyword'`, `created_by: null`. Re-typed `AdminTagRuleFixtureRow`. | Parity OK: 10 fixture keys reconciled against 11 db columns (sort_order has DEFAULT — tolerated). |
| `scripts/check-fixture-seed-parity.ts` | Appended mig 024 to tag_rules `migrations` array; generalized `parseAlters` to handle multi-clause `ALTER TABLE` (split body by top-level commas before ADD/DROP/ALTER/RENAME). | `npx tsx ... ; exit 0`. |

## Pattern → keywords[] reconciliation surface

Per `01-MATCHER-AUDIT.md` (Wave 0): **0 production files** read `tag_rules.pattern`. No auto-tag matcher service exists yet in the codebase. Verified post-mig-024:

```
$ rg -n "tag_rules.*\.pattern|\.pattern.*tag_rules" backend/src/services/ backend/src/repository/
(0 hits)
```

No service/repository edits were required. The `auto-tag matcher` referenced in spec is an emergent module that Plan 04 (or later) will introduce as a NEW reader of `keywords[]`.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck -w backend` | clean |
| `npm run test -w backend` | **598 passed** (593 baseline + 5 new from migration-024) |
| `npm run test -w backend -- --testPathPattern=migration-024` | **5/5 GREEN** |
| `npx tsx scripts/check-fixture-seed-parity.ts` | exit 0; vocs 21/25 + tag_rules 10/11 |
| `rg -n "tag_rules.*\.pattern\|\.pattern.*tag_rules" backend/src/services/ backend/src/repository/` | 0 hits |
| `grep -cE "test\.todo\|test\.skip\|describe\.skip" backend/src/__tests__/migration-024.test.ts` | 0 |
| `grep -c "024_tag_rules_created_by.sql" scripts/check-fixture-seed-parity.ts` | 1 |
| `grep -c "keywords:" shared/fixtures/admin-tag-rule.fixtures.ts` | 4 (1 type + 3 rows) |
| `grep -c "match_mode:" shared/fixtures/admin-tag-rule.fixtures.ts` | 4 |
| `grep -cE "^\s*pattern:" shared/fixtures/admin-tag-rule.fixtures.ts` | 0 |

## Commits

| Task | Hash | Message |
| --- | --- | --- |
| 1.02.1 | `493d28e` | feat(01-02): add mig 024 — tag_rules keywords[]+match_mode+created_by, drop pattern |
| 1.02.2 | `c304dee` | test(01-02): flip migration-024 RED→GREEN, reshape fixture + parity for mig 024 |

## TDD Gate Compliance

`type: tdd` plan — RED → GREEN cycle verified:

- **RED gate (Plan 01-01 commit `a38e98b`):** `test(01-01): stage failing tests for mig 024 + D-11 optimistic (RED)` — 5 `test.todo` placeholders for migration-024.
- **GREEN gate (Plan 01-02 commits `493d28e` + `c304dee`):** mig SQL written; tests flipped live; 5/5 GREEN.

REFACTOR not required — no duplication or hidden complexity introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree branch was based on stale tip without `.planning/` and Plan 01-01's RED tests**

- **Found during:** Initial state load — `backend/src/__tests__/migration-024.test.ts` did not exist in the worktree.
- **Cause:** Worktree branch `worktree-agent-ad6c092d3e9faf205` was created from `b33f641`, predating Plan 01-01's commits on `docs/codebase-map`.
- **Fix:** `git merge --ff-only docs/codebase-map` — fast-forward (worktree had zero unique commits) advanced the branch to include Plan 01-01's three commits + the planning files. No `git reset --hard` used (CLAUDE.md / destructive_git_prohibition compliant).
- **Files modified:** none (branch advance only).

**2. [Rule 1 - Bug] pg-mem `information_schema.is_nullable` reports `'NO'` for ALTER-added nullable columns**

- **Found during:** First migration-024 test run after writing mig 024 SQL.
- **Issue:** `expect(createdBy!.is_nullable).toBe('YES')` failed — pg-mem returned `'NO'` even though the SQL declares `NULL` (no `NOT NULL` constraint, no default). Real PostgreSQL behaves correctly; this is a documented pg-mem quirk (`migration-014.test.ts:103–114` worked around the same issue for `suspended_until`).
- **Fix:** Replaced the metadata assertion with the established behavioral probe — INSERT a tag_rules row without `created_by`, SELECT it back, assert the column is `null`. Same pattern as `migration-014.test.ts`.
- **Files modified:** `backend/src/__tests__/migration-024.test.ts` (test 4 only).
- **Commit:** `c304dee`.

**3. [Rule 1 - Bug] `parseAlters()` regex couldn't parse multi-clause ALTER TABLE statements**

- **Found during:** First parity script run after appending mig 024 to TARGETS.
- **Issue:** Plan body's exact mig-024 SQL (which I wrote verbatim from the plan) uses a single multi-clause `ALTER TABLE tag_rules ADD ..., ADD ..., ADD ..., DROP ...;` statement. The parity script's `addRe` and `dropRe` regexes both required `;` at the end of each clause, so they only matched the first ADD (`keywords`) and missed `match_mode`, `created_by`, and the `DROP COLUMN pattern`. Result: parity reported `pattern: required column missing` and `match_mode/created_by: not in schema`.
- **Fix:** Generalized `parseAlters()` to (a) match the entire `ALTER TABLE <table> ... ;` statement body, then (b) split the body on top-level commas before ADD/DROP/ALTER/RENAME tokens, then (c) parse each clause independently. Real PostgreSQL accepts both the single-statement multi-clause form (atomic; preferred for related changes) and the multi-statement form, so the script should support both.
- **Files modified:** `scripts/check-fixture-seed-parity.ts` (parseAlters function).
- **Commit:** `c304dee`.

No deviations from plan body — both tasks executed as specified, all acceptance criteria met. The three auto-fixes above were corrections to staged scaffolding (Plan 01-01 deliverables) that the plan body's `<read_first>` and `<behavior>` sections did anticipate (e.g. plan body line 184: "pg-mem nullability metadata is unreliable, use behavioral INSERT instead").

## Threat Model Compliance

| Threat | Mitigation status |
| --- | --- |
| **T-01-02** (DDL irreversibility) | mitigate — Down migration tested; pg-mem up→down→cols-removed path verified GREEN. |
| **T-01-03** (auto-tag matcher consumer reconciliation) | mitigate — 0 production readers of `tag_rules.pattern` per audit; trash.ts reads only `is_active`/`suspended_until`/`tag_id` (D-14 verified). |
| **T-01-04** (legacy `pattern` payload loss) | accept — pre-024 rows lose pattern at migration time per D-12. No external consumers per D-09. |

## Threat Flags

None. No new attack surface introduced by this plan (DDL only; no new endpoints, auth paths, or trust boundary changes).

## Surprises / Notes for Plan 03+

- **`name` column survives mig 024.** The Plan body's "schema invariant" success criterion lists 8 columns (excluding `name`), but mig 004's `CREATE TABLE tag_rules` declares `name text NOT NULL`. Mig 024 doesn't drop it. The actual post-024 column set has 11 columns including `name` (and `is_active`, `sort_order` from 004). Plan 03 (zod contracts) and Plan 04 (BE service `createTagRule`) will need to decide whether `name` stays on the API contract. Recommend Plan 03 keep `name` as required string for backward compatibility with any seed/fixture flows; Plan 04 can derive it from `keywords[0]` if the spec calls for that.
- **Parity script change has phase-spanning impact.** Other future migrations using multi-clause ALTER TABLE will now parse correctly. No migration on disk today depends on this — vocs is single-statement, tag_rules's mig 024 is the first multi-clause case. Worth noting in test-conventions.md if Plan 08 docs revision touches it.
- **Behavioral nullability pattern** is now established in 2 tests (014, 024). If a third migration adds another nullable column, lift the helper into a shared util.

## Self-Check: PASSED

- `backend/migrations/024_tag_rules_created_by.sql` exists in worktree: FOUND
- `backend/src/__tests__/migration-024.test.ts` exists, 0 test.todo/skip: FOUND
- `shared/fixtures/admin-tag-rule.fixtures.ts` has `keywords:` + `match_mode:` + no `pattern:`: FOUND
- `scripts/check-fixture-seed-parity.ts` references mig 024: FOUND
- Commits `493d28e`, `c304dee` reachable in `git log`: FOUND
- `npm run test -w backend` 598 passes: PASS
- `npx tsx scripts/check-fixture-seed-parity.ts` exits 0: PASS
- `rg -n "tag_rules.*\.pattern" backend/src/` 0 hits: PASS
