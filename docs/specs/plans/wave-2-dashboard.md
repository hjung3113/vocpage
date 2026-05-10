# Wave 2 — Dashboard

> 정본: `docs/specs/requires/dashboard.md` (§11 settings, §13.1 RGL).
> 진행 포인터: `next-session-tasks.md` → 본 문서 → Phase 단위 PR.

## Phase 구성

| Phase | 범위                                                              | 상태       |
| ----- | ----------------------------------------------------------------- | ---------- |
| **D** | RGL Shell — settings BE + DashboardShell FE (위젯 콘텐츠 X)       | ⏳ 진행중  |
| B     | KPI Volume / Quality 위젯 콘텐츠 + `/dashboard/summary` BE        | 후속       |
| C     | 분포 / 매트릭스 / 히트맵 / 트렌드 / SLA / 담당자 / Top10 위젯     | 후속       |
| E     | 설정 패널 UI (위젯 토글, default_date_range, heatmap x-axis)      | 후속       |

Phase 라벨은 의존성 우선순위 (D = shell 기반, B/C = 콘텐츠, E = 설정 패널). A 라벨은 사용 안 함.

---

## Phase D — RGL Shell

### Goal

`/dashboard` 라우트에 react-grid-layout 기반 shell 진입. 위젯은 `<WidgetPlaceholder>` (slot only). 사용자별 layout / visibility / locked_fields 영속화. Admin 잠금 머지 룰 동작.

### Scope (in)

**BE:**

- `backend/src/routes/dashboard-settings.ts` — `GET /api/dashboard/settings`, `PUT /api/dashboard/settings`.
- `backend/src/services/dashboard/settings.service.ts` — `loadResolved(user)` (admin default ∘ user row 머지), `update(user, patch)` (권한 enforcement).
- `backend/src/repository/dashboard.repo.ts` — `getByUserId / getAdminDefault / upsert`.
- 권한: `locked_fields` / `globaltabs_order` mutate = Admin only (역할 외 → 403). 그 외 필드 = 자기 행 self-mutate 가능.
- `user_id IS NULL` (Admin default row) write = Admin only.
- 테이블: `dashboard_settings` (마이그 006/007/011 그대로 사용 — 원래 신규 마이그 X).
  - **P0 버그 수정으로 마이그 022 추가됨** (`022_dashboard_admin_default_unique.sql`): Postgres NULL UNIQUE 맹점 — `ON CONFLICT (user_id)` 는 `user_id IS NULL` 에 반응하지 않아 admin-default 중복 행 생성. Partial unique index `WHERE user_id IS NULL` 로 차단. 다음 마이그 번호 = 023.

**FE:**

- `frontend/src/features/dashboard/` 신규.
  - `defaultLayouts.ts` — 8 widget × 5 breakpoint (xs/sm/md/lg/xl) 기본 레이아웃.
  - `lockMerge.ts` — `mergeLockedLayout(adminDefault, userDraft, lockedFields)`. lockedFields 의 widget id 는 admin layout 강제.
  - `useDashboardDraft.ts` — load → editing draft → save (PUT) → discard. dirty state.
  - `useDashboardSettings.ts` (TanStack Query GET) + `useUpdateDashboardSettings.ts` (mutation).
  - `DashboardShell.tsx` — `<ResponsiveReactGridLayout>` wrapping. xs breakpoint 단일 컬럼.
  - `WidgetPlaceholder.tsx` — slot only, prop `widgetId` 표시.
  - `EditModeToggle.tsx` — 편집 모드 on/off (사용자 권한 체크).
  - `DashboardPage.tsx` + 라우트 (현재 StubPage 교체).
  - `dashboard-rgl.css` — RGL container styling (token 3종 신규: `--dashboard-grid-margin`, `--dashboard-grid-row-h`, `--dashboard-handle-size`).

**TDD (필수):**

- `lockMerge` — admin 잠금 widget 만 admin layout 강제, 비잠금 widget 은 user draft 유지.
- `useDashboardDraft` — load → edit → save 사이클, dirty 플래그.
- `DashboardShell` — xs breakpoint 단일 컬럼 stack 렌더.
- `dashboard-settings` route — 권한 매트릭스 (admin can mutate `locked_fields`, manager/dev/user 403; PUT body 검증; admin default row write Admin only).

### Scope (out)

- 위젯 콘텐츠 컴퓨테이션 (KPI / 분포 / 히트맵 등 `/dashboard/summary` 외 엔드포인트) → Phase B/C.
- 설정 패널 UI (`SettingsPanel` 컴포넌트, default_date_range / heatmap_x_axis editor) → Phase E.
- `widget_visibility` 토글 UI → Phase E (단, `widget_visibility` PUT 은 BE 가 받음).
- 위젯 드래그/리사이즈 — Edit Mode on 시에만 활성, save 시 `widget_sizes` 컬럼에 RGL Layouts 객체로 저장.

### Done when

- [ ] BE: `GET /api/dashboard/settings` (인증 필수) + `PUT` (권한 enforcement) — 모든 테스트 그린.
- [ ] FE: `/dashboard` 진입 시 8 widget placeholder 렌더, edit mode 토글, drag/resize → save 사이클 동작.
- [ ] lockMerge / useDashboardDraft / DashboardShell xs / dashboard-settings 권한 4종 TDD 그린.
- [ ] BE typecheck 0 / FE typecheck 0 / lint 0 / 토큰 lint 0.
- [x] codex:rescue 적대적 리뷰 P0/P1/P2 close (migration 022, permission semantics, race guard, contract partial, strict).
- [ ] PR merge (squash/rebase 금지, `gh pr merge --merge --delete-branch`).

### Constraints

- Contract 정본: `shared/contracts/dashboard/` (zod) + `shared/openapi.yaml` (DashboardSettings/Update). FE/BE 모두 여기 import.
- shadcn/ui 우선 재사용 (Button, Tooltip, Dialog 등). 토큰 신규 3종 외 기존 토큰 재사용.
- TDD 필수 — fail 확인 후 구현.
- 권한 enforcement = `requireRole` middleware + service-level guard 이중. middleware 만으론 부족 (locked_fields per-field 검증 필요).

### Widget IDs (canonical)

`kpi-volume` / `kpi-quality` / `dist-matrix` / `heatmap` / `trend-tag` / `sla-aging` / `assignee` / `aging-top10`.

### RGL Breakpoints (신규 정의 — spec gap fill)

| Breakpoint | Cols | minWidth (px) |
| ---------- | ---- | ------------- |
| xs         | 1    | 0             |
| sm         | 2    | 480           |
| md         | 6    | 768           |
| lg         | 12   | 996           |
| xl         | 12   | 1200          |

`rowHeight = 64`, `margin = [16, 16]`. defaultLayouts.ts 가 8 widget × 5 breakpoint 좌표 제공.
