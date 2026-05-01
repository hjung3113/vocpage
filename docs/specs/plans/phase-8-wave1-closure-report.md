# Phase 8 Wave 1 — Closure Report

**Session date:** 2026-05-01 (autonomous run)
**Author:** Claude Opus 4.7 (1M context)
**Companion doc:** `phase-8-pattern.md` (Wave 2+ inheritance)

---

## Summary

Phase 8 Wave 1 (VOC list + drawer vertical slice) shipped over 4 merged PRs in
this session. Wave 1 BE service had two real bugs caught at codex round-1
review and fixed test-first. RTL matrix expanded from 3 cases to 6.
A11y verified at 100/100. Two follow-ups carry forward (Playwright happy path,
docker-compose integration verification) with explicit blockers documented.

---

## Stage-by-stage results

### Stage 1 — PR #111 (CI baseline) ✅

- **Merge commit:** `f6d69b9`
- **Codex rounds:** 1 (APPROVE, lower-risk infra unblock)
- **Notes:** Linux-x64 native bindings (rollup, lightningcss, oxide) pinned
  in root `optionalDependencies`; `.eslintignore` widened. Unblocked CI for
  the Wave 1 PR.

### Stage 2 — PR #110 (Wave 1 vertical slice) ✅

- **Merge commit:** `9cc853a`
- **Codex rounds:** 2 (round 1 REQUEST_CHANGES → fix → round 2 APPROVE)
- **Round-1 issues + resolution:**
  1. `includeDeleted` admin gate missing in `service.list` — FIXED
     (`backend/src/services/voc.ts` now requires `AuthUser`, downgrades to
     false for non-admin roles). Regression test `B-T8` added (fail-first
     confirmed before fix).
  2. `voc_type_id` filter dropped at repository — FIXED
     (`backend/src/repository/voc.ts` adds `voc_type_id = ANY($n)`).
     Regression test `B-T9` added.
  3. Repository fully mocked → SQL paths untested — accepted as Wave 1
     §U3=A intentional pattern; deferred to follow-up B's integration test
     layer (see Open Items below).
  4. `docs/specs/plans/phase-8-contract-voc.md` flagged as "new doc" —
     verified pre-existing in commit `aedd64e` (contracts split). Not a
     session-doc-violation. Kept.
- **Test totals after merge:** BE jest 44 passed, FE vitest 32 passed.

### Stage 3 — PR #112 (retrospective) ✅

- **Merge commit:** `f10c57a`
- **Codex rounds:** 1 (APPROVE, light pass for doc-only)
- **Notes:** `docs/specs/plans/phase-8-pattern.md` shipped — 7 patterns + 3
  pain sources + Wave 2 entry prerequisites + day-1 checklist.

### Stage 4 — PR #113 (follow-up B: RTL F-T4/F-T5) ✅

- **Merge commit:** `fb1c862`
- **Branch:** `feat/wave1-followup-b` (renamed from `…-ab` once A was split out)
- **Codex rounds:** 2 (round 1 REQUEST_CHANGES → fix → round 2 APPROVE)
- **Round-1 issues + resolution:**
  1. F-T4 had no contrast role — split into F-T4a (user → no form) +
     F-T4b (manager → form present). Gate now asserted both ways.
  2. F-T5 race contract claim was undocumented — reframed to assert what
     the code actually guarantees: Escape (reachable user path) closes the
     drawer, `setVocId(null)` clears state, drawer leaves DOM.
  3. `pointerEventsCheck:0` simulated impossible click path — removed in
     favor of `userEvent.keyboard('{Escape}')`.
- **Follow-up A (Playwright happy path)** intentionally split out: adding
  `@playwright/test` introduces a ~150MB browser binary footprint and a CI
  workflow change that warrants its own review cycle. See Open Items.

### Stage 5 — Follow-up C/D verification

#### C. `VITE_USE_MSW=false` integration verification — **BLOCKED**

- Docker daemon not running on this machine (macOS Docker Desktop not
  launched). `docker ps` returned `Cannot connect to the Docker daemon`.
- Cannot bring up the FE/BE/Postgres stack from CLI without daemon, and
  cannot start Docker Desktop programmatically (GUI-launch only).
- **No code change made.** User to start Docker Desktop and re-run
  verification next session per the steps in the original brief.

#### D. Lighthouse a11y ≥ 95 on `/voc` — **PASS**

- FE dev server (Vite + MSW) launched at `http://localhost:5173/voc`.
- `npx lighthouse http://localhost:5173/voc --only-categories=accessibility --output=json --quiet --chrome-flags="--headless --no-sandbox"`
- **Score: 1.0 (100/100)**
- 25 binary audits passed, 0 failed, 23 manual checks (lighthouse manual
  checks are advisory; do not affect score).
- Final URL `/voc`, no runtime error.
- **No fix needed.** `fix/wave1-a11y` PR not opened.

---

## Decision log (autonomous self-resolved)

| #   | Decision                                                                                                       | Reviewer                                              | Lower-risk choice                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Codex flagged `phase-8-contract-voc.md` as new-doc violation. Verified it was pre-existing (commit `aedd64e`). | self-verified via git log                             | Keep (no PR change), document in round-2 reply.                                                                   |
| 2   | Codex Issue #3 (repo fully mocked → SQL untested) — accept or block?                                           | codex agent + plan §6-3                               | Accept; defer SQL-level integration to follow-up B's separate work. Documented in `phase-8-pattern.md §6` and §9. |
| 3   | Stage 4 A+B as 1 PR vs split A out?                                                                            | risk evaluation (npm dep memory + CI workflow change) | Split. B lands in #113; A deferred to next session as separate PR.                                                |
| 4   | Round-1 F-T5 race contract claim — assert undocumented contract or reframe?                                    | codex agent                                           | Reframe: assert only what the code wires up (Escape → setVocId(null) → DOM removal).                              |
| 5   | Stage 5 C blocker — wait for daemon or proceed?                                                                | environment check                                     | Document as BLOCKED; user-side action; do NOT attempt to start Docker Desktop programmatically.                   |

---

## Test counts (post-Wave-1)

| Surface                | Before Wave 1        | After Wave 1 (this session)        |
| ---------------------- | -------------------- | ---------------------------------- |
| BE jest                | (Wave 0 baseline)    | **44 passed** (B-T1–B-T9)          |
| FE vitest              | (Wave 0 baseline)    | **32 passed** (F-T1–F-T5 + others) |
| FE typecheck           | clean                | clean                              |
| BE typecheck           | clean                | clean                              |
| BE build (prod tsc)    | broken pre-`875d3ea` | clean                              |
| Lighthouse a11y `/voc` | n/a                  | **100/100**                        |

---

## Wave 2 entry prerequisites (recap from `phase-8-pattern.md §8`)

1. ✅ Wave 1 closure report exists (this doc).
2. ⏳ Follow-up A (Playwright happy path) — **DEFERRED to next session**.
3. ⏳ Follow-up C (`VITE_USE_MSW=false` integration verification) — **BLOCKED on Docker daemon**.
4. ✅ Follow-up D (Lighthouse a11y ≥ 95) — score 100, no fix PR needed.
5. ⏳ `shared/contracts/dashboard/{entity,io,…}.ts` skeleton — Wave 2 day-1.
6. ⏳ Dashboard openapi paths drafted + U2 guard lines — Wave 2 day-1.

**Wave 2 must NOT start until items 2 + 3 are closed.**

---

## Open items (user action)

1. **Follow-up A (Playwright happy path)** — open separate PR
   `feat/wave1-followup-a-playwright` next session. Scope: install
   `@playwright/test`, add `frontend/e2e/voc-happy-path.spec.ts` (list →
   filter → row click → drawer → comment → Escape close), add a CI job
   that runs `npx playwright install --with-deps chromium && npx playwright test`.
   Treat the dep + CI change as the review focus, not the spec itself.
2. **Follow-up C (integration verification)** — start Docker Desktop, run
   `docker compose up -d`, wait for Postgres healthy, set
   `VITE_USE_MSW=false` in FE env, hit `/voc` against the real BE. Capture
   30 lines of network log + a JSON diff of one row vs `VOC_FIXTURES[0]`
   shape. If a row mismatch surfaces, file `feat/wave1-followup-c-seed`
   to fix the seed SQL — `backend/seeds/dev_seed.sql` exists but was not
   audited against `shared/fixtures/voc.fixtures.ts` this session.
3. **`claude-progress.txt` + `next-session-tasks.md`** — updated as part
   of this PR (see commit log).

---

## User feedback guide (`/voc` smoke test)

When you return, run the FE locally to verify the slice visually:

```sh
cd frontend && npm run dev   # MSW mock mode
```

Then in the browser at `http://localhost:5173/voc`:

1. **List entry** — page renders header, filter chips, table with rows.
2. **Filter chips** — click "접수" / "검토중" — chip toggles `aria-pressed`,
   table re-queries.
3. **Row click → drawer** — drawer opens on the right; status + priority
   selects render; internal-notes section visible.
4. **Role switch via URL** — append `?mode=user` then `?mode=manager`:
   - `user`: drawer note authoring form (`textarea[aria-label="new note"]`)
     should NOT be visible.
   - `manager` / `admin` / `dev`: form IS visible, can post a note.
5. **Escape closes drawer** — press Escape; drawer disappears, URL `?id=`
   is removed (so subsequent filter changes don't carry a stale id).
6. **Soft-deleted leak check** — append `?includeDeleted=true` while
   logged in as non-admin (BE side; FE doesn't expose it). Should NOT
   surface row IDs ending `…000046` (the soft-deleted fixture). This is
   covered by BE `B-T8` but worth eyeballing once the integration stack is
   running (Open Item #2).

If any of 1–5 looks wrong, that's a regression in the merged Wave 1 slice
and a new PR is warranted.

---

## STUCK section

Nothing in the Wave 1 work hit the 4-round codex ceiling or the forbidden
action set. Closure is clean.

---

## User acceptance — 2026-05-01 (post-closure session)

User reviewed this report and **accepted Wave 1 ship state**, but
**deferred Wave 2 entry** after a side-by-side check of the prototype
(`prototype/prototype.html` `#page-voc`) against the merged FE
(`frontend/src/components/voc/VocListPage.tsx`).

### Gap finding (informal)

Current `/voc` is functionally a contract/MSW PoC; visually it lacks
prototype parity in:

- topbar (count badge, search box, notif bell, "새 VOC 등록" button)
- 6-status pill bar (현재는 영문 enum 그대로, 아이콘·한국어 라벨 없음)
- "필터 더보기" panel (담당자 / 우선순위 / 유형 / 태그 — 현재는 q + status만)
- sort chips toolbar (정렬 기준 6종) + header sort toggles
- table columns (현재 4열, 프로토타입은 6열 — 담당자 + 등록일 누락)
- pagination row
- "새 VOC 등록" modal (Toast UI Editor)
- notification dropdown
- review drawer 시각적 깊이 (현재 161줄 골격)

### Decision: option-2 (Wave 1 보강 우선)

Replicating Wave 1's thinness across Wave 2~5 would compound a visual
gap that the Wave 5 close-gate (시각 회귀) would then have to clean up
in five places at once. Cheaper to lift `/voc` once now and let Wave 2
inherit the higher floor.

**New direction:** add a Wave 1 보강 PR that brings `/voc` to prototype
parity, then proceed to Wave 2 from a stronger baseline. The 보강 plan
itself (mapping prototype components → React, contract deltas, test
plan) is **deferred to next session** — it requires interview-driven
ambiguity removal before implementation per project working rules.

### Effect on Wave 2 prerequisites (recap above)

| Prereq                                 | Status now                                               |
| -------------------------------------- | -------------------------------------------------------- |
| 1. closure report exists               | ✅                                                       |
| 2. Follow-up A (Playwright)            | ⏸ deferred (overlaps Wave 1 보강 — 시나리오 재작성 회피) |
| 3. Follow-up C (real-BE verify)        | ⏳ this session, separate PR (Docker 시작 후)            |
| 4. Follow-up D (Lighthouse a11y)       | ✅ 100/100                                               |
| 5. Dashboard contract skeleton         | ⏸ blocked by Wave 1 보강                                 |
| 6. Dashboard openapi paths + U2 guards | ⏸ blocked by Wave 1 보강                                 |

**Wave 2 implementation is hard-blocked until Wave 1 보강 PR merges +
follow-up A/C close.**

### Side note: BE dev crash unblocked

PR #115 (`fix(backend): install pino-pretty devDep + extract
buildLoggerOptions`) merged this session — `npm run dev` no longer
crashes at the pino transport. (A separate `AUTH_MODE` env crash
remains; that path is exercised by docker-compose, addressed via
follow-up C.)

---

## Follow-up C — verification results (2026-05-01)

### Stack startup (after BE Dockerfile fix)

`docker compose up -d postgres backend` initially failed at two layers:

1. **Stale postgres volume** — old `postgres_data` volume from a 5-day
   prior schema state (`008_alter_due_date` already applied) collided
   with newer migration ordering. Resolved by `docker compose down -v`
   - fresh start.
2. **Backend image missing `shared/`** — `backend/Dockerfile` previously
   only copied `./backend/`, but Wave 1 introduced runtime imports of
   `shared/contracts/voc/users` (and `shared/fixtures/voc.fixtures` for
   tests). Container crashed with `MODULE_NOT_FOUND` at
   `/app/backend/src/auth/mockUsers.ts`. **Fixed in this PR**:
   - `backend/Dockerfile` — `COPY shared/ ./shared/` before
     `COPY backend/ ./backend/`.
   - `docker-compose.yml` — added `./shared:/app/shared` bind mount
     under `services.backend.volumes` so `tsx watch` picks up shared
     contract edits without rebuild.

After both fixes: `docker compose ps` shows postgres + backend `(healthy)`
in ~30s; `GET /api/health` returns `200`.

### `GET /api/vocs?limit=2` against real BE/Postgres

After `npm run db:seed` inside the backend container, the endpoint
returned `total: 10` (the seed's `vocs` table count; the other inserts
populate `users`, `systems`, `menus`, `voc_types`, `tags`, `comments`
but are not part of the list response). Pagination param is `limit`
(not `per_page`) per `shared/contracts/voc/io.ts:53` — `limit=2`
returns 2 rows of the 10-row total, with `page=1` and `pageSize=2`.
Sample row 0 keys (17 fields):

```
id, issue_code, title, status, priority, voc_type_id, system_id,
menu_id, assignee_id, author_id, parent_id, source, due_date,
created_at, updated_at, has_children, notes_count
```

Shape matches `shared/contracts/voc/entity.ts` `VocListItem` exactly
(15 picked + 2 extended). `sequence_no` is intentionally projected
out by `backend/src/services/voc.ts:24-44 toListItem` — list endpoint
returns the lightweight summary, full `Voc` is fetched per-row via
`GET /api/vocs/:id`. Not a drift — by design.

### 🔴 Drift: seed UUIDs are not v4 (entity-level strict UUID)

`VocListResponse.safeParse(real-BE-response)` **FAIL** — first issue
raised on `rows[0].system_id`, then cascades to `voc_type_id`,
`menu_id`, `assignee_id`, `author_id`. Note: `shared/contracts/voc/io.ts:21`
defines a **loose hex regex `Uuid`** for query/IO use cases (legacy
fixture support) but `VocListItem` (which `VocListResponse.rows` uses)
is defined in `shared/contracts/voc/entity.ts:61` and inherits the
**strict `z.string().uuid()`** from `entity.ts:32`. Strict zod uuid
enforces RFC 4122 v1-v8 (version digit `[1-8]` at position 14 +
variant `[89abAB]` at position 19). Seed values fail both. Trace:

| Source                                          | Example UUID                           | v4 valid?              |
| ----------------------------------------------- | -------------------------------------- | ---------------------- |
| `dev_seed.sql` users                            | `00000000-0000-0000-0000-000000000003` | ❌ (version digit `0`) |
| `shared/contracts/voc/users.ts` `FIXTURE_USERS` | `00000000-0000-4000-8000-0000000000d1` | ✅ (v4 marker)         |

Zod `z.string().uuid()` enforces RFC 4122 v1-v8 with the version digit
in position 14. Seed values use all-zeros + counter, so the version
digit is `0` → schema rejection. FE in `VITE_USE_MSW=false` would
crash on first table render.

**Impact assessment:**

- ❌ Wave 1 FE never tested against real BE response — MSW handlers
  return fixture rows (which DO use v4 UUIDs) so the gap was masked.
- ❌ BE itself does not validate response shape (raw repo row → JSON).
  This means the FE strict schema is the only catch — and it never
  ran against real seed data this session.

### Fix routing

Per closure-report Open Item #2 playbook, seed UUID drift goes to a
**separate PR** `feat/wave1-followup-c-seed` (next session entry).
Audit shows the drift is broader than users: **every PK in
`dev_seed.sql` uses the `XX000000-0000-0000-0000-...` v0 pattern**
(users `00000000-…`, systems `10000000-…`, menus `20000000-…`,
voc_types `30000000-…`, vocs `50000000-…`, comments, tags).

Scope:

1. Rewrite `backend/seeds/dev_seed.sql` UUIDs into RFC 4122 v4 form
   (version digit at position 14 ∈ `[1-8]`, variant at position 19 ∈
   `[89ab]`) while preserving deterministic prefixes for grep-ability.
   Where users overlap `FIXTURE_USERS` (admin / manager / devSelf /
   devOther / user — `shared/contracts/voc/users.ts`), reuse the
   fixture UUIDs verbatim. Add `dev` role user (migration 013).
2. Cascade FK references in the seed: `vocs.author_id`,
   `vocs.assignee_id`, `vocs.system_id`, `vocs.menu_id`,
   `vocs.voc_type_id`, `comments.author_id`, `voc_tags.tag_id`, etc.
3. Per test-engineer round-1 guidance: add
   `backend/src/__tests__/seed-fixture-parity.test.ts` as a **pure
   parsing unit test** — `fs.readFileSync('seeds/dev_seed.sql')` →
   regex-extract every UUID literal → assert each passes
   `z.string().uuid()`. Faster than pg-mem and catches the same drift
   class. (FK cascade verification stays in supertest integration
   tests, not bundled here.)
4. Re-run `VocListResponse.safeParse` smoke against the running
   stack — must return `{ success: true, data: …rows: 10… }` before
   merge.

### Verification artifacts captured

- `/tmp/voc-resp.json` (44 bytes empty → 10-row response after seed)
- `/tmp/voc-cookie.txt` (admin session cookie via mock-login)
- Docker compose logs available via `docker compose logs backend`

### Status of Wave 2 prereq #3

⏳ **Real-BE verification ran**, surfaced one drift (seed UUIDs).
Stack startup blockers fixed in this PR. Drift fix is a separate PR
before Wave 2 can ship safely.
