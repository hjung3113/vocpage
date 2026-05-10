# Wave 2 Phase C — Widget Content (분포 / 매트릭스 / 히트맵 / 트렌드 / SLA / 담당자 / Top10)

> Canonical spec: `docs/specs/requires/dashboard.md` §2–§9 + §API (v3).
> Contract truth: `shared/contracts/dashboard/` (zod) + `shared/openapi.yaml`.
> Prerequisite: Phase D (RGL Shell) + Phase B (KPI) are merged.
> Next migration: 023 (none needed here — all reads against existing tables).

---

## Goal

Implement 7 backend endpoints + 7 frontend widgets for the remaining dashboard
content: distribution, priority-status matrix, heatmap, weekly trend, SLA
processing speed, assignee stats, and aging VOCs Top 10.

---

## Scope (in)

**BE:**

- `backend/src/routes/dashboard-phase-c.ts` — 7 GET routes wired to controllers.
- `backend/src/services/dashboard/phase-c.service.ts` — one service function per endpoint; business logic only, no SQL.
- `backend/src/repository/dashboard-phase-c.repo.ts` — SQL aggregations for all 7 endpoints.
- Auth middleware: `requireRole(['manager','admin','dev'])` on each route (same as `/summary`).

**FE:**

- `frontend/src/features/dashboard/widgets/DistributionWidget.tsx`
- `frontend/src/features/dashboard/widgets/PriorityStatusMatrixWidget.tsx`
- `frontend/src/features/dashboard/widgets/HeatmapWidget.tsx`
- `frontend/src/features/dashboard/widgets/WeeklyTrendWidget.tsx`
- `frontend/src/features/dashboard/widgets/ProcessingSpeedWidget.tsx`
- `frontend/src/features/dashboard/widgets/AssigneeStatsWidget.tsx`
- `frontend/src/features/dashboard/widgets/AgingVocsWidget.tsx`
- Shared subcomponent: `frontend/src/features/dashboard/widgets/GridTable.tsx` (see §Shared Subcomponents below).
- `frontend/src/features/dashboard/api/queries.ts` — add 7 new `dashboardApi.*` functions.
- `frontend/src/features/dashboard/api/keys.ts` — add 7 new query key factories.
- `frontend/src/features/dashboard/model/` — add 7 custom hooks (`useDistribution`, `usePriorityStatusMatrix`, `useHeatmap`, `useWeeklyTrend`, `useProcessingSpeed`, `useAssigneeStats`, `useAgingVocs`).
- `frontend/src/mocks/handlers/dashboard-phase-c.ts` — MSW handlers for all 7 endpoints.
- `recharts` already in `requirements.md §3` — confirm installed, no new dependency needed.

**Contracts (already written — Phase C architect deliverable):**

- `shared/contracts/dashboard/distribution.ts`
- `shared/contracts/dashboard/priority-status-matrix.ts`
- `shared/contracts/dashboard/heatmap.ts`
- `shared/contracts/dashboard/weekly-trend.ts`
- `shared/contracts/dashboard/processing-speed.ts`
- `shared/contracts/dashboard/assignee-stats.ts`
- `shared/contracts/dashboard/aging-vocs.ts`
- `shared/contracts/dashboard/index.ts` (re-exports updated)
- `shared/openapi.yaml` (7 paths updated with typed schemas)

## Scope (out)

- `GET /api/dashboard/tag-distribution` (§6) — out of scope per user instruction; existing stub in openapi.yaml is retained.
- `GET /api/dashboard/system-overview` (§7) — out of scope per user instruction.
- `GET /api/dashboard/aging` (§11) — out of scope per user instruction.
- `GET /api/dashboard/settings` / `PUT /api/dashboard/settings` — Phase D.
- `GET /api/dashboard/menus` / `GET /api/dashboard/assignees` — existing or separate.
- Edit mode, drag/resize — Phase D shell.
- Settings panel UI — Phase E.

---

## Done when

- [ ] BE: all 7 routes return correct shape against local dev DB, zod-validated on response.
- [ ] BE: 403 for `User` role; 401 for unauthenticated — confirmed by route tests.
- [ ] BE: `npm run typecheck -w backend` → 0 errors; `npm run test -w backend` → 0 failures.
- [ ] FE: all 7 widgets render with MSW mock data; loading/error/empty states handled.
- [ ] FE: `useHeatmap` local state (`xAxis`) independent from `useAssigneeStats` xAxis state.
- [ ] FE: `useWeeklyTrend` ignores date range from `DashboardFilterProvider` (spec: 12-week fixed).
- [ ] FE: `useAgingVocs` ignores date range (spec: current snapshot, date filter irrelevant).
- [ ] FE: `npm run typecheck -w frontend` → 0 errors; `npm run test -w frontend -- --run` → 0 failures.
- [ ] Smoke render tests pass for all 7 widgets.
- [ ] Lint 0 / token lint 0.
- [ ] PR merge (non-squash, `gh pr merge --merge --delete-branch`).

---

## Constraints

- Contracts are source of truth — FE/BE import from `shared/contracts/dashboard`.
- No hex/OKLCH in contracts or widget logic — token references only in TSX className strings.
- No `prototype/` references.
- YAGNI: implement exactly these 7 endpoints. No extras.
- TDD on BE repo SQL + route permission/validation tests.
- Smoke tests on FE widgets (happy-path render + empty state).
- `requireRole(['manager','admin','dev'])` middleware — same as Phase B.
- Max token budget per tool call: ~50% of session running total (root §Engineering Rules).

---

## Per-Endpoint Detail

### 1. 분포 — `GET /api/dashboard/distribution`

| | |
|---|---|
| **Route** | `GET /api/dashboard/distribution` |
| **Params** | `type` (required): `status\|priority\|voc_type\|tag`; `dim` (optional, default `all`): `all\|system\|menu`; + global filter |
| **Response schema** | `DistributionResponse` from `shared/contracts/dashboard/distribution.ts` |
| **Repo SQL** | `SELECT <field>, COUNT(*) FROM vocs WHERE <scope> GROUP BY <field>`. For `tag`: join `voc_tag_links + tags`, top 6 by count then aggregate remainder as "기타". For `voc_type` use `vocs.voc_type_id` join `voc_types`. |
| **Permission** | manager/admin/dev only |

### 2. 매트릭스 — `GET /api/dashboard/priority-status-matrix`

| | |
|---|---|
| **Route** | `GET /api/dashboard/priority-status-matrix` |
| **Params** | Global filter only (no extra params) |
| **Response schema** | `PriorityStatusMatrixResponse` |
| **Repo SQL** | `SELECT priority, status, COUNT(*) FROM vocs WHERE <scope> GROUP BY priority, status`. Server pivots to `MatrixRow[]`. Include all 4 priorities and 5 statuses even if count=0. |
| **Permission** | manager/admin/dev only |

### 3. 히트맵 — `GET /api/dashboard/heatmap`

| | |
|---|---|
| **Route** | `GET /api/dashboard/heatmap` |
| **Params** | `xAxis` (optional, default `status`): `status\|priority\|tag`; + global filter |
| **Response schema** | `HeatmapResponse` |
| **Repo SQL** | Y-axis = systems (level 1) or menus of systemId (level 2) or single menu (level 3). X-axis GROUP BY: status / priority / (tag join). Two queries: aggregate row + per-Y-unit rows. `tag` xAxis: subquery for top-5 tags in scope `ORDER BY count DESC, tag_name ASC` (deterministic tie-breaking), then pivot. |
| **Permission** | manager/admin/dev only |
| **Implementation note** | `totalRow` = null when `menuId` is supplied (level 3). `HeatmapRow.level` is derived server-side from which IDs are present in the request. `dim=system` + `systemId` present → 400 (zod refine). |

### 4. 트렌드 — `GET /api/dashboard/weekly-trend`

| | |
|---|---|
| **Route** | `GET /api/dashboard/weekly-trend` |
| **Params** | `weeks` (ignored, always 12); `systemId`, `menuId`, `assigneeId`; date params ignored |
| **Response schema** | `WeeklyTrendResponse` |
| **Repo SQL** | 3 separate queries, each windowed to 12 ISO-weeks back from `CURRENT_DATE`. `new`: `COUNT(*) WHERE created_at IN [week_start, week_end]`. `done`: `COUNT(*) WHERE status IN ('완료','드랍') AND status_changed_at IN week`. `enteredInProgress`: `COUNT(*) WHERE status IN ('검토중','처리중') AND status_changed_at BETWEEN week_start AND week_end`. |
| **Permission** | manager/admin/dev only |

> **Spec deviation (P0 — v3.1, 2026-05-10):** Field renamed `inProgress` → `enteredInProgress`.
> (a) This counts VOCs that *transitioned into* 검토중/처리중 within the week (via `status_changed_at`), not a "snapshot of in-progress count at Sunday 23:59" as originally specified in `dashboard.md §5`.
> (b) The original spec line "주말 스냅샷 기준 검토중+처리중 상태 VOC 수" has been amended in `dashboard.md §5 주간 트렌드` to "해당 주에 검토중 또는 처리중으로 전환된 VOC 수" — a true snapshot requires a `status_history` table which does not exist and is out of scope.
>
> TODO: Update `dashboard.md §5 주간 트렌드` click-through URL param `snapshotDate` — coordinate with BE PR (the `snapshotDate` param in the FE URL builder may need re-evaluation since there is no snapshot).

### 5. SLA — `GET /api/dashboard/processing-speed`

| | |
|---|---|
| **Route** | `GET /api/dashboard/processing-speed` |
| **Params** | `dim` (optional, default `all`): `all\|system\|menu`; + global filter |
| **Response schema** | `ProcessingSpeedResponse` |
| **Repo SQL** | `SELECT system_id (or menu_id), AVG(status_changed_at::date - created_at::date) AS avg_days, COUNT(*) FILTER (WHERE status_changed_at::date <= due_date AND due_date IS NOT NULL) AS sla_pass, COUNT(*) FILTER (WHERE due_date IS NOT NULL) AS sla_eligible, COUNT(*) FILTER (WHERE due_date IS NULL) AS missing_due_date, COUNT(*) AS completed_count FROM vocs WHERE status='완료' AND <scope> GROUP BY dim_field`. Use `status_changed_at` — there is **NO `completed_at` column**. `avg_days` null when completed_count = 0. `sla_rate` null when sla_eligible = 0 (SLA denominator footgun avoided). |
| **Permission** | manager/admin/dev only |

> **P1 validation note:** `dim=system` + `systemId` present is rejected by zod `.refine()` with "dim=system is incompatible with systemId scope". BE route must propagate this 400.

### 6. 담당자 — `GET /api/dashboard/assignee-stats`

| | |
|---|---|
| **Route** | `GET /api/dashboard/assignee-stats` |
| **Params** | `xAxis` (optional, default `status`): `status\|priority\|tag`; + global filter |
| **Response schema** | `AssigneeStatsResponse` |
| **Repo SQL** | `SELECT assignee_id, <xAxis_field>, COUNT(*) FROM vocs WHERE <scope> GROUP BY assignee_id, <xAxis_field>`. Include `assignee_id IS NULL` as 미배정 row. Join `users` for names. `tag` xAxis: top-5 tags in scope `ORDER BY count DESC, tag_name ASC` (deterministic tie-breaking — same as heatmap). |
| **Permission** | manager/admin/dev only |

### 7. Top10 — `GET /api/dashboard/aging-vocs`

| | |
|---|---|
| **Route** | `GET /api/dashboard/aging-vocs` |
| **Params** | `limit` (default 10, max 50); `dim` (`all\|system`); `systemId`, `menuId`, `assigneeId`; date params ignored |
| **Response schema** | `AgingVocsResponse` |
| **Repo SQL** | `SELECT voc_id, issue_code, title, priority, CURRENT_DATE - created_at::date AS elapsed_days, system_id, menu_id FROM vocs WHERE status IN ('접수','검토중','처리중') AND deleted_at IS NULL AND <scope> ORDER BY elapsed_days DESC LIMIT $limit`. Join systems/menus for names based on dim. |
| **Permission** | manager/admin/dev only |

---

## Shared Subcomponents

**Proposal: `GridTable.tsx`** — a reusable table rendering colored cells with intensity interpolation (`oklch(63% 0.19 258 / opacity)` where opacity = value/max_value mapped to [0.06, 0.62]).

Applies to: heatmap (§4), assignee stats (§8), and priority-status matrix (§3) — all three render a coloured grid with the same intensity model. That is 3 widgets sharing rendering logic — qualifies per the "3+ widgets" threshold in the architect brief.

`GridTable` props (draft):
```ts
interface GridTableProps {
  headers: string[];
  rows: Array<{
    id: string | null;
    name: string;
    values: number[];
    total: number;
    isHighlighted?: boolean;  // for assignee active row
    isClickable?: boolean;    // for heatmap system rows
    isSummary?: boolean;      // for heatmap totalRow
    isUnassigned?: boolean;   // italic + quaternary colour
  }>;
  maxValue: number;
  onCellClick?: (rowId: string | null, colIndex: number) => void;
  onRowClick?: (rowId: string | null) => void;
}
```

Matrix is a special case (row = priority, not system/user) but the cell rendering logic is identical. `PriorityStatusMatrixWidget` will compose `GridTable` with its own row adapter.

---

## FE Hook Names and Query Keys

| Widget | Hook | Query key factory |
|---|---|---|
| 분포 | `useDistribution(filter)` | `dashboardQueryKeys.distribution(filter)` |
| 매트릭스 | `usePriorityStatusMatrix(filter)` | `dashboardQueryKeys.priorityStatusMatrix(filter)` |
| 히트맵 | `useHeatmap(filter)` | `dashboardQueryKeys.heatmap(filter)` |
| 트렌드 | `useWeeklyTrend(filter)` | `dashboardQueryKeys.weeklyTrend(filter)` |
| SLA | `useProcessingSpeed(filter)` | `dashboardQueryKeys.processingSpeed(filter)` |
| 담당자 | `useAssigneeStats(filter)` | `dashboardQueryKeys.assigneeStats(filter)` |
| Top10 | `useAgingVocs(filter)` | `dashboardQueryKeys.agingVocs(filter)` |

`filter` is derived from `DashboardFilterProvider` context. `useWeeklyTrend` and `useAgingVocs` omit `startDate`/`endDate` from the query params sent to the API (not from the key — key includes them to stay reactive to filter context changes, but the API ignores them).

---

## MSW Handler Additions

Add to `frontend/src/mocks/handlers/dashboard-phase-c.ts` (new file, registered in `handlers/index.ts`):

- `GET /api/dashboard/distribution` → fixture: `{ type: 'status', dim: 'all', total: 42, items: [...] }`
- `GET /api/dashboard/priority-status-matrix` → fixture with 4×5 grid
- `GET /api/dashboard/heatmap` → fixture: level-1 shape (3 systems + totalRow)
- `GET /api/dashboard/weekly-trend` → fixture: 12 weeks, 3 series
- `GET /api/dashboard/processing-speed` → fixture: 3 rows (dim=all)
- `GET /api/dashboard/assignee-stats` → fixture: 3 assignees + 미배정
- `GET /api/dashboard/aging-vocs` → fixture: 5 items

Fixture data must be added to `shared/fixtures/` and the seed parity check script must pass.

---

## Test Plan

### BE (TDD required)

- `dashboard-phase-c.route.test.ts`:
  - 403 for `User` role on each of the 7 endpoints.
  - 401 when unauthenticated.
  - 400 on invalid `type` param (distribution), invalid `xAxis` (heatmap/assignee).
  - 200 happy path with mocked repo returns correct zod shape.

- `dashboard-phase-c.repo.test.ts` (integration — uses test DB):
  - Distribution by each of 4 types returns correct counts.
  - Matrix returns all 4 priority rows; 0-count cells included.
  - Heatmap level 1 returns totalRow; level 3 (menuId) returns null totalRow.
  - Weekly trend returns exactly 12 entries per series.
  - Processing speed avg_days is null when no completed VOCs.
  - Assignee stats 미배정 row always present.
  - AgingVocs orders by elapsed_days DESC; respects limit.

### FE (smoke render)

- Each widget: renders without crash with MSW fixture data.
- Each widget: renders loading skeleton while data is pending.
- Each widget: renders empty state when items array is empty.
- `GridTable`: cell click triggers `onCellClick` with correct args; 0-value cells do not trigger click.
- `HeatmapWidget`: local `xAxis` state change re-fetches and does not reset global filter.
- `AssigneeStatsWidget`: 미배정 row rendered last with italic style.

---

## Open Questions — Resolved (codex:rescue P0/P1/P2, 2026-05-10)

1. **inProgress snapshot (weekly-trend):** **RESOLVED (P0 — option A).** Field renamed `inProgress` → `enteredInProgress`. Counts VOCs transitioning into 검토중/처리중 via `status_changed_at` in week. No migration. True snapshot deferred (requires status_history table, out of scope).

2. **`vocs.status_changed_at` presence:** Confirmed present — used for `done` series and `enteredInProgress` computation.

3. **`vocs.completed_at` vs `vocs.status_changed_at`:** **RESOLVED (P1).** There is NO `completed_at` column. Processing-speed SQL uses `status_changed_at WHERE status='완료'` for both avg_days and SLA check.

4. **`vocs.due_date` presence:** Confirmed present. VOCs with null due_date are counted in `missingDueDateCount` and excluded from SLA denominator. `sla_rate` is null when `slaEligibleCount === 0`.

5. **Tag xAxis top-5 scope:** Top-5 tags are computed dynamically per request within current filter scope. `ORDER BY count DESC, tag_name ASC` for deterministic tie-breaking. Test plan updated with tag tie-break test.

6. **`dim=system` + `systemId` contradiction:** **RESOLVED (P1).** Zod `.refine()` rejects `dim=system && systemId !== undefined` with 400 for both `DistributionFilter` and `ProcessingSpeedFilter`. AgingVocs uses `dim=menu` when in system tab (dim semantics differ) — no refine added there; documented explicitly: aging-vocs `dim` values are `all|system` where `system` means "show menu column" within the active systemId, not "group by system".

7. **AgingVocs date filter:** **RESOLVED (P1).** BE silently ignores `startDate`/`endDate` (no 400). Documented in contract module comment and OpenAPI description. Zod schema already accepts them via `DashboardFilter` base.

## Test Plan Additions (P2 tie-break)

- Tag tie-break test: for heatmap xAxis=tag and assignee-stats xAxis=tag, when two tags have equal count, the lower `tag_name` ASC appears first (deterministic top-N selection).
- Add to `dashboard-phase-c.repo.test.ts`: seed two tags with equal count, assert ordering.
