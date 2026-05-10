# Mig 024 — `tag_rules.pattern` consumer audit (Wave 0)

**Date:** 2026-05-10
**Phase:** 01-tag-rules-consolidation, Plan 01 (Wave 0)
**Purpose:** Enumerate every backend reader of `tag_rules.pattern` so that Plan 02
(mig 024) can reconcile all readers to `keywords[]` + `match_mode` in a single
commit window. OQ-R3 BLOCKING resolution.

## Summary

`rg -n "tag_rules" backend/src/services/` returns **8 hits across 1 file**
(`backend/src/services/admin/tag-master.ts`). None of those hits select or
mutate the `pattern` column.

`rg -n "\.pattern" backend/src/services/ backend/src/repository/ | rg -i "tag|rule"`
returns **0 hits**. No production code reads `tag_rules.pattern`.

`rg -n "pattern" backend/src/` (broad sweep) confirms `pattern` text only
appears in:
- a single comment in `backend/src/repository/trash.ts:146` (documents the 004
  schema shape, no SELECT)
- two test fixtures (`admin-tags.sql.test.ts:261`, `admin-trash.sql.test.ts:289`)
  that INSERT rows with the `pattern` column for setup
- the `migration-014.test.ts` round-trip fixture INSERT

**Headcount for Plan 02:** **0 production files** read `tag_rules.pattern`.
**4 test/doc files** mention the column textually (fixtures + comment) and must
be updated when mig 024 drops `pattern`.

## Files that read `tag_rules.pattern` (MUST change in Plan 02)

_None._ No production service or repository file SELECTs `tag_rules.pattern`.

The auto-tag matcher referenced in Phase 1 design notes does not yet exist as a
production module — the codebase has no automatic tag attachment service today.
Only `backend/src/repository/trash.ts` re-runs `tag_rules` on VOC restore, and
its SELECT list is `tr.tag_id` only (see classification below).

> Plan 02 implication: dropping `pattern` in mig 024 has **no production code
> reconciliation cost**. The work is limited to:
> 1. fixture/seed rows (drop `pattern`, add `keywords` + `match_mode`)
> 2. test fixture INSERT statements (3 test files listed below)
> 3. trash.ts inline comment refresh (no code change)
> 4. zod contracts + OpenAPI schema (Plan 03 scope, not this audit)

## Files that read tag_rules but NOT pattern (no Plan 02 column-rename change)

- `backend/src/services/admin/tag-master.ts:54` — `LEFT JOIN tag_rules tr ON tr.tag_id = t.id` (used to join for rule_ref_count; selects no `pattern`).
- `backend/src/services/admin/tag-master.ts:112` — `(SELECT COUNT(*)::int FROM tag_rules WHERE tag_id = tags.id) AS rule_ref_count` (count only).
- `backend/src/services/admin/tag-master.ts:167-168` — `UPDATE tag_rules SET tag_id = $1 WHERE tag_id = $2` (merge re-wire; no `pattern`).
- `backend/src/services/admin/tag-master.ts:195` — same rule_ref_count subselect as line 112.
- `backend/src/services/admin/tag-master.ts:216` — `SELECT COUNT(*)::int AS cnt FROM tag_rules WHERE tag_id = $1` (count only).
- `backend/src/services/admin/tag-master.ts:238` — `UPDATE tag_rules SET suspended_until = $1 WHERE id = $2` (suspend; no `pattern`).
- `backend/src/routes/admin-tags.ts:130` — comment only (`Atomic: rewire voc_tags + tag_rules → target`).

## Trash restore re-run classification (D-14 verification)

`backend/src/repository/trash.ts:148-156` runs the idempotent re-attach query
on VOC restore. The actual SELECT list is:

```sql
INSERT INTO voc_tags (voc_id, tag_id, source, created_at)
SELECT $1, tr.tag_id, 'rule', now()
FROM tag_rules tr
WHERE tr.is_active = true
  AND (tr.suspended_until IS NULL OR tr.suspended_until <= now())
ON CONFLICT (voc_id, tag_id) DO NOTHING
```

`backend/src/repository/trash.ts` **does NOT read `tag_rules.pattern`.** The
inline comment at line 146 (`004 스키마: pattern/kind/tag_id`) is descriptive
text only — it documents the legacy schema for context, no SQL reference.
After mig 024 lands, the comment should be updated to mention `keywords/match_mode/tag_id`,
but no executable code changes.

D-14 (ADR-0005 trash idempotency carry) confirmed: REST-rename and column-drop
are both safe — restore flow only depends on `is_active`, `suspended_until`,
and `tag_id`, all of which mig 024 preserves.

## Test fixture files that INSERT `pattern` (must update in Plan 02)

These are not "readers" of `pattern` but **writers** in test setup. They will
fail at runtime once the column is dropped:

- `backend/src/routes/__tests__/admin-tags.sql.test.ts:261` — INSERT INTO tag_rules with `pattern` column.
- `backend/src/routes/__tests__/admin-trash.sql.test.ts:289` — same.
- `backend/src/__tests__/migration-014.test.ts:107` — INSERT INTO tag_rules with `pattern` column (mig 014 round-trip test; mig 024 round-trip test in Plan 01 Task 3 will use the new schema).

## Verification

```bash
$ rg -n "\.pattern" backend/src/ | rg -i "tag|rule"
# (empty — no production SELECT/property access)

$ rg -n "pattern" backend/src/services/ backend/src/repository/
backend/src/repository/trash.ts:146:    //    tag_rules 는 시스템 무관 글로벌 규칙 (004 스키마: pattern/kind/tag_id).
# (single hit — comment only, traced above)

$ rg -n "tag_rules" backend/src/services/
# 8 hits in tag-master.ts — all traced above; none touch pattern column.
```

Every hit is accounted for above.

## Conclusion for Plan 02

- Production code reconciliation surface for `pattern` drop: **0 files**.
- Test/fixture surface: **3 BE test files** + **1 shared fixture file** (Wave 0
  Task 2 creates `shared/fixtures/admin-tag-rule.fixtures.ts` aligned to
  pre-024 schema; Plan 02 re-shapes it).
- Comment refresh (no code): **1 file** (`backend/src/repository/trash.ts:146`).

Plan 02 mig-024 work is therefore schema + contracts + fixtures heavy, but
production code-flow light — no auto-tag matcher service exists yet, so
column-rename has no live consumers to break.
