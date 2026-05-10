---
phase: 01-tag-rules-consolidation
plan: 04
subsystem: backend-routes, services, permissions, idor-guard
tags: [wave-2, tdd-red-green, irreversible-api, permission-matrix, idor-mitigation]
dependency_graph:
  requires:
    - 01-02 (mig 024 — keywords[]+match_mode+created_by columns)
    - 01-03 (zod contracts + nested OpenAPI paths + generated types)
  provides:
    - backend/src/routes/admin-tags.ts (5 nested handlers; legacy /admin/tag-rules removed)
    - backend/src/services/admin/tag-master.ts (listTagRules/createTagRule/updateTagRule/deleteTagRule + nested suspendTagRule)
    - dev PostgreSQL with mig 024 schema applied (tag_rules.keywords + match_mode + created_by, no `pattern`)
  affects:
    - 01-05 (FE hooks) — can now import shared zod schemas and call live BE in MSW.
    - 01-06 (FE Modal) — list endpoint returns rows; ready to render.
    - 01-07 (FE wiring) — flips legacy /admin/tag-rules call sites.
    - 01-08 (spec sync) — runtime contract is now the source of truth.
tech_stack:
  added: []
  patterns:
    - Nested REST resource (/admin/tags/:tagId/rules) reflecting FK ownership (D-08).
    - IDOR scope check at service boundary — `WHERE id=$ruleId AND tag_id=$tagId` before mutation.
    - Server-derived `created_by` via 3rd-arg `user: AuthUser` separate from validated body (D-07/T-01-09).
    - Pitfall-6 route order: `/suspend` registered before `/:ruleId` to disambiguate Express path matching.
    - Case-insensitive keyword dedupe inside service (matches FE chip dedupe per T-01-11).
key_files:
  created: []
  modified:
    - shared/contracts/admin/tag.ts (T-01-11 caps: keywords ≤50, item ≤60)
    - backend/src/services/admin/tag-master.ts (+~140 LoC; 4 new functions + suspend rename)
    - backend/src/routes/admin-tags.ts (+5 routes, –1 legacy block, RuleIdParam imported)
    - backend/src/routes/__tests__/admin-tags.test.ts (+135 LoC; matrix + IDOR + injection + route-order)
decisions:
  - "RuleIdParam.pick({tagId: true}) used for GET/POST `/tags/:tagId/rules` rather than introducing a new schema. TagIdParam from Plan 03 validates `{id}` (used by tag CRUD) and is incompatible with the nested `:tagId` parameter name; pick() keeps the single source of truth without a duplicate."
  - "Mig 024 was applied to dev DB via direct psql Up extraction (Plan body fallback (c)) because node-pg-migrate's checkOrder fails on the migration-history drift between dev (last run mig 018) and the file system (mig 024). Recorded into pgmigrations manually so subsequent migrations can be wired without retroactive cleanup."
  - "Service layer owns IDOR scope checks (SELECT before UPDATE/DELETE). Routes pass tagId+ruleId through verbatim — keeps business rule out of HTTP layer per backend/src/CLAUDE.md."
metrics:
  duration: ~50 min
  completed: 2026-05-11
---

# Phase 01 Plan 04: BE Tag Rules Routes (Nested) Summary

5 BE handlers + 4 service functions shipped for `/api/admin/tags/:tagId/rules*`. Permission matrix per D-13 enforced via `requireRole`; IDOR mitigated by service-layer `tag_id` scope checks; `created_by` server-derived via `req.user.id` (zod schema omits the field, route passes 3rd-arg AuthUser). Legacy `/admin/tag-rules*` deleted (D-09 — no compat alias). 27 new tests added; BE Jest 625 pass / 0 fail.

## Migration 024 Push

- **Command used:** `docker exec vocpage-postgres-1 psql -U vocpage -d vocpage` with the Up section from `backend/migrations/024_tag_rules_created_by.sql` piped via heredoc, then `INSERT INTO pgmigrations (name, run_on) VALUES ('024_tag_rules_created_by', NOW())` to record idempotency.
- **Why fallback (c) and not `npm run db:migrate -w backend`:** dev DB's `pgmigrations` table records 018 as last applied but has gaps (014/015/017/019–024 unapplied). `node-pg-migrate` aborts with `Not run migration 014 is preceding already run migration 016`. Applying mig 024 alone via psql is safe because the columns it depends on already exist (mig 004 created `tag_rules` with `pattern`).
- **Verification proof:**
  ```
  column_name | data_type | is_nullable
  ------------+-----------+------------
  id          | uuid      | NO
  name        | text      | NO
  kind        | text      | NO
  tag_id      | uuid      | NO
  is_active   | boolean   | NO
  sort_order  | integer   | NO
  created_at  | timestamptz | NO
  keywords    | ARRAY     | NO
  match_mode  | text      | NO
  created_by  | uuid      | YES
  ```
  `pattern` absent ✓; `keywords` + `match_mode` + `created_by` present ✓.

## Service Functions (signatures)

```ts
listTagRules(tagId: string, query: TagRuleListQueryT)
  : Promise<{ rows: TagRuleT[]; page; per_page; total }>

createTagRule(tagId: string, input: TagRuleCreateT, user: AuthUser)
  : Promise<TagRuleT>             // INSERT keywords, match_mode, created_by=user.id

updateTagRule(tagId: string, ruleId: string, input: TagRulePatchT)
  : Promise<TagRuleT>             // IDOR scope check + partial update; created_by NEVER touched

deleteTagRule(tagId: string, ruleId: string)
  : Promise<void>                 // IDOR scope check; route returns 204

suspendTagRule(tagId: string, ruleId: string, suspendedUntil: string | null)
  : Promise<TagRuleT>             // IDOR scope check; renamed from legacy 2-arg form
```

All readers project `LEFT JOIN users u ON u.id = tr.created_by` and surface `u.name AS created_by_name`. Result rows are revalidated through `TagRule.parse(...)` before returning (defensive — catches schema drift from mig 024 going forward).

## 5 Routes + Permission Matrix (D-13)

| Method | Path                                                      | Roles allowed         | Roles denied              | Body schema             | Response       |
| ------ | --------------------------------------------------------- | --------------------- | ------------------------- | ----------------------- | -------------- |
| GET    | /api/admin/tags/:tagId/rules                              | admin, manager, dev   | user                      | —                       | TagRuleListResponse |
| POST   | /api/admin/tags/:tagId/rules                              | admin, manager        | dev, user                 | TagRuleCreate           | 201 TagRule    |
| PATCH  | /api/admin/tags/:tagId/rules/:ruleId/**suspend**          | admin                 | manager, dev, user        | TagRuleSuspendInput     | 200 TagRule    |
| PATCH  | /api/admin/tags/:tagId/rules/:ruleId                      | admin, manager        | dev, user                 | TagRulePatch            | 200 TagRule    |
| DELETE | /api/admin/tags/:tagId/rules/:ruleId                      | admin                 | manager, dev, user        | —                       | 204            |

Route registration order (Pitfall 6 / T-01-10): `:ruleId/suspend` lands at line 248, before plain `:ruleId` PATCH at 267 and DELETE at 286. Express path matching never sees `/suspend` parsed as a `:ruleId` value.

## Test Results

| Workspace | Before (Plan 03) | After (Plan 04) | Delta                                                 |
| --------- | ---------------- | --------------- | ----------------------------------------------------- |
| BE Jest   | 598 pass / 0 fail | **625 pass / 0 fail** | +27 (D-13 matrix 18 + injection 1 + IDOR 3 + order 2 + 3 negative kept) |
| BE typecheck | clean         | clean           | —                                                     |

Run line: `npm run typecheck -w backend && npm run test -w backend | tail -10` → 42 suites pass, 5.21s.

## Negative Tests Passing (security)

- **T-01-09 created_by injection:** `POST /tags/:tagId/rules` with body `{keywords:['kw'], created_by:'<attacker-uuid>'}` returns 201, but the mocked `createTagRule` is invoked with the authenticated user as the 3rd argument, and the response `created_by` reflects `userArg.id`, not the attacker UUID. Body field is silently dropped by zod (TagRuleCreate omits `created_by`).
- **T-01-08 IDOR — wrong tag scope:** PATCH/DELETE/suspend with `<wrong-tag>` for a rule that belongs to a different tag → 404. Service throws `NOT_FOUND` from the scope SELECT before any mutation runs.
- **T-01-10 route order:** Calling `…/rules/:ruleId/suspend` invokes `suspendTagRule` (not `updateTagRule`); calling `…/rules/:ruleId` invokes `updateTagRule` (not `suspendTagRule`). Both verified by counting jest.mock.calls per service function.

## Sanity Greps

- `rg -n "/admin/tag-rules" backend/src/` → 0 hits.
- `grep -cE "'/tags/:tagId/rules" backend/src/routes/admin-tags.ts` → 5.
- `grep -c "LEFT JOIN users" backend/src/services/admin/tag-master.ts` → 1.
- `grep -c "user.id" backend/src/services/admin/tag-master.ts` → 1 (createTagRule INSERT).
- `grep -c "tag_id = " backend/src/services/admin/tag-master.ts` → 3 (one per IDOR scope SELECT in update/delete/suspend).

## Commits

| Phase | Hash       | Message                                                                                          |
| ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| RED   | `dc362b15` | test(01-04): add nested tag rules service + RED permission/IDOR/injection tests                  |
| GREEN | `b520278b` | feat(01-04): wire 5 nested tag-rule routes (GREEN) + drop legacy /admin/tag-rules                |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `TagIdParam` is incompatible with the nested `:tagId` route parameter name**
- **Found during:** Task 1.04.2 (test run after wiring routes — 6 GET/POST tests returned 400).
- **Issue:** The Plan body and PATTERNS.md both specified `validate({ params: TagIdParam, ... })` for GET and POST. But `TagIdParam` (defined in Plan 03 as `z.object({ id: Uuid })`) validates an `id` param, not `tagId`. Express's `req.params` for `/tags/:tagId/rules` carries `tagId`, so zod parsing strips the unknown `tagId` (or, if strict, fails); a 400 from `validate` middleware was the symptom.
- **Fix:** Use `RuleIdParam.pick({ tagId: true })` for GET and POST. `RuleIdParam` (Plan 03) already defines `{tagId: Uuid, ruleId: Uuid}` — pick gives a clean `{tagId: Uuid}` schema without introducing a new exported symbol.
- **Files modified:** `backend/src/routes/admin-tags.ts` (2 validate options).
- **Commit:** `b520278b`.

**2. [Rule 3 - Blocking] `node-pg-migrate` could not be used for mig 024 push**
- **Found during:** Task 1.04.0.
- **Issue:** `npm run db:migrate -w backend` aborts with `Error: Not run migration 014_tag_master_ops is preceding already run migration 016_notice_faq_alignment`. The dev DB's `pgmigrations` history has gaps (014/015/017/019–024 never run on this DB; only 016/018 from later runs were).
- **Fix:** Plan body's fallback (c) — applied mig 024's Up section directly via `docker exec ... psql` and recorded the row in `pgmigrations` manually. Documented in this Summary's "Migration 024 Push" section so Plan 08's spec sync can reference reproducibility. Backfilling the gap migrations is out of scope for this plan (Rule 3 scope boundary — log to deferred items if needed).
- **Files modified:** none (DB state only).

**3. [Rule 2 - Critical hardening] Worktree branch was based on stale tip without `.planning/`**
- **Found during:** Session start — same situation as Plan 03 Deviation 1.
- **Fix:** `git merge --ff-only docs/codebase-map`; branch had zero unique commits, so a fast-forward sufficed. No `git reset --hard` used.
- **Files modified:** none (branch advance only).

No other deviations — plan body executed as written aside from the schema-pick correction and migration runner fallback.

## Threat Flags

None. All threats from the plan's `<threat_model>` are mitigated:
- **T-01-07 permission matrix:** 20 supertest assertions (5 routes × 4 roles) all GREEN.
- **T-01-08 IDOR:** 3 wrong-tag scope tests + service-layer SELECT-before-mutate scope check.
- **T-01-09 created_by injection:** zod schema omits `created_by`; route passes `req.user!` 3rd-arg; tested.
- **T-01-10 route order:** `:ruleId/suspend` registered before `:ruleId` PATCH; tested by call-count.
- **T-01-11 keyword DoS:** `KeywordsArray = z.array(KeywordItem.max(60)).min(1).max(50)` enforced by zod at route entry; service dedupes case-insensitively.

## Self-Check: PASSED

- `backend/src/services/admin/tag-master.ts` exports `listTagRules`/`createTagRule`/`updateTagRule`/`deleteTagRule` + nested-form `suspendTagRule`: VERIFIED via `grep -cE "^export (async )?function (listTagRules|createTagRule|updateTagRule|deleteTagRule|suspendTagRule)"` → 5.
- `backend/src/routes/admin-tags.ts` registers 5 nested routes; legacy block removed: VERIFIED via `grep -cE "'/tags/:tagId/rules"` → 5; `rg "/admin/tag-rules" backend/src/` → 0.
- Commit `dc362b15` (RED test) reachable in `git log`: VERIFIED.
- Commit `b520278b` (GREEN feat) reachable in `git log`: VERIFIED.
- BE Jest 625 pass / 0 fail / 42 suites: VERIFIED via test run.
- BE typecheck clean: VERIFIED.
- mig 024 columns present in dev DB; `pattern` absent: VERIFIED via `psql information_schema.columns`.
