# Wave 2 Phase D 진입 프롬프트 (다음 세션용)

> 본 파일은 다음 세션 시작 시 사용자가 프롬프트로 붙여넣는 단일 메시지.
> 사용 방법: 아래 ``` 코드 블록 안의 본문을 복사해서 새 Claude 세션에 그대로 붙여넣기.

---

```
Wave 2 Phase D 진입 — RGL 쉘 + 편집 모드 + 11 위젯 placeholder + draft buffer + lock 머지.

## Context

직전 세션 (2026-05-10) 에서 Wave 2 Phase A 의 4 PR 을 오픈했고, 본 세션 시작 전에 사용자가 모두 머지한 상태:
- #291 docs(wave-2): plan + spec sync (RGL 커스터마이즈 MVP 승격)
- #292 chore(wave-2): react-grid-layout install + smoke test
- #293 feat(wave-2): migration 022 dashboard_settings.locked_widgets
- #294 feat(wave-2): contract zod v2 + openapi PUT + fixtures stub

머지가 안 됐다면 진입 거부하고 사용자에게 머지 요청. 머지됐으면 진입.

## 작업 정본

- Plan: `docs/specs/plans/wave-2-dashboard.md` §3 결정 W2-D1~D9 / §6.2 W2-5 / §7 OQ.
- Spec: `docs/specs/requires/dashboard.md` §커스터마이즈 v2 (전체) — 라이브러리 / 그리드 계약 / 브레이크포인트 / widget_sizes v2 직렬화 / 잠금 머지 / 저장-복원 (draft buffer) / RGL CSS / 시각 토큰 / 접근성.
- Contract: `shared/contracts/dashboard/io.ts` (zod 정본 — WidgetId 11종 / WidgetLayout bounds / WidgetSizesV2 / DashboardSettings / DashboardSettingsPutBody).
- Fixture: `shared/fixtures/dashboard.fixtures.ts` (`DEFAULT_DASHBOARD_SETTINGS`, `DEFAULT_WIDGET_SIZES_LG`, `WIDGET_IDS`).
- Migration: `backend/migrations/022_dashboard_locked_widgets.sql` (적용됨).

## 작업 범위 (W2-5 / Phase D — 1 PR)

브랜치: `feat/wave-2-phase-d-rgl-shell` (main 에서 분기)

### FE 신설

- `frontend/src/features/dashboard/DashboardShell.tsx` — Responsive + WidthProvider 래핑. props = `{ widgets: WidgetSlot[], settings: DashboardSettings, isAdmin: boolean }`.
- `frontend/src/features/dashboard/defaultLayouts.ts` — 11 위젯의 lg/md/sm 기본 좌표 export. `shared/fixtures` 의 `DEFAULT_WIDGET_SIZES_LG` 와 정합 (lg 동일 + md/sm 도출 룰 명시).
- `frontend/src/features/dashboard/WidgetPlaceholder.tsx` — 11 위젯 모두 동일 placeholder (Skeleton + 위젯 ID 표시 + 헤더 잠금 🔒). 실 콘텐츠는 Phase B/C 에서 채움.
- `frontend/src/features/dashboard/EditModeToggle.tsx` — "편집" / "저장" / "취소" 버튼 + isEditing state.
- `frontend/src/features/dashboard/useDashboardDraft.ts` — draft buffer hook. 서버 hydrate → draft 로 복사, drag/resize end → draft 만 갱신, 저장 = `PUT /api/dashboard/settings`, 취소 = draft 폐기 후 hydrate 재로드.
- `frontend/src/features/dashboard/lockMerge.ts` — `mergeLock(adminLocked, personalVisibility)` 헬퍼. 반환: `Record<WidgetId, boolean>` (true = static).
- `frontend/src/api/dashboard.ts` — `useDashboardSettings()` (GET) + `useUpdateDashboardSettings()` (PUT). zod 응답 검증.
- `frontend/src/pages/dashboard/DashboardPage.tsx` — Manager/Admin/Dev role guard + 라우트. User 진입 시 `/` 리다이렉트.
- `frontend/src/app/router.tsx` — `/dashboard` 라우트 추가.
- `frontend/src/styles/dashboard-rgl.css` — RGL CSS 규칙 (z-index dragging=1000 / overflow / scroll container / resize handle 토큰화). spec §RGL CSS 규칙 정합.
- 신규 토큰 3종 (`uidesign.md` 동기 PR 또는 Phase D PR 동봉): `--dashboard-grid-gap` / `--dashboard-grid-padding` / `--dashboard-widget-resize-handle`.

### BE 신설

- `backend/src/routes/dashboard-settings.ts` — `GET /api/dashboard/settings` + `PUT /api/dashboard/settings`. role guard (User 403). zod body validation.
- `backend/src/services/dashboard/settings.service.ts` — Admin 행 (`user_id IS NULL`) + 개인 행 머지 로직. `locked_widgets` mutate 는 Admin only (route guard + service assertion).
- `backend/src/repository/dashboard.repo.ts` — `dashboard_settings` SELECT/UPDATE.

### TDD (irreversible 우선 — `CLAUDE.md §3`)

이미 PR-γ (#294) 에 contract bounds 27 회귀가 있음. 본 Phase D 추가:

- `frontend/src/features/dashboard/__tests__/lockMerge.test.ts` — Admin lock + personal lock 머지 OR 검증. 개인 unlock 으로 Admin lock 해제 불가 회귀.
- `frontend/src/features/dashboard/__tests__/useDashboardDraft.test.ts` — drag → draft 갱신 / 저장 → PUT 호출 / 취소 → hydrate 재로드 / 디바운스 X 검증.
- `frontend/src/features/dashboard/__tests__/DashboardShell.test.tsx` — xs 브레이크포인트에서 `isDraggable: false` 검증. 편집 모드 토글 시 grab cursor 검증.
- `backend/src/__tests__/dashboard-settings.test.ts` — Manager/Admin/Dev 200 / User 403 / Admin 만 `locked_widgets` mutate 가능 / PUT 빈 body no-op / PUT zod 위반 400.

### 시각

- `benchmark/dashboard/01-edit-mode-grab.png` — 편집 모드 grab cursor + 11 placeholder 베이스라인 1 건.
- `benchmark/INDEX.md` row 추가.

## 작업 순서 (TDD 의무)

1. **권한·draft buffer 회귀 작성** (실패 확인) — `dashboard-settings.test.ts` + `useDashboardDraft.test.ts` + `lockMerge.test.ts`.
2. BE route + service 구현 → 회귀 그린.
3. FE hook (`useDashboardDraft`, `useDashboardSettings`) + `lockMerge` 헬퍼 구현 → 회귀 그린.
4. `DashboardShell` + `WidgetPlaceholder` + `EditModeToggle` 구현. 11 위젯 placeholder 렌더.
5. RGL CSS (`dashboard-rgl.css` + `uidesign.md` 토큰 3종) — `lint:tokens` 0 hits 확인.
6. `/dashboard` 라우트 추가 + role guard + page.
7. visual-diff baseline 캡처.
8. 회귀 전체 그린 (FE typecheck + test + lint + lint:tokens · BE typecheck + test).
9. 사용자 검수 → push → PR open. (PR merge 는 사용자.)

## 머지 가드 (사용자 확인 후에만 PR 생성)

- FE typecheck 0 / FE lint 0 / FE lint:tokens 0
- BE typecheck 0
- 회귀 그린 (BE 전체 + FE 전체)
- visual-diff baseline 자손 SKIP 0
- `dashboard.md` 정본과의 차이 0 (편집 모드 토글 / draft buffer / lock 머지 / xs read-only / RGL CSS)

## 리뷰

본 Phase 의 PLAN.md 또는 PR description 을 codex:rescue 적대적 리뷰에 디스패치 (memory `feedback_review_delegation.md` — Auto-trigger at 1000 LOC). 회신 후 `wave-2-dashboard.md §3` 또는 본 PR 코멘트로 결정 갱신.

## 비-범위 (Phase D 가 다루지 않음)

- 위젯 콘텐츠 (KPI / 분포 / 매트릭스 / 히트맵 / 트렌드 / 태그 / 시스템 / 담당자 / 장기미처리 / SLA / 에이징) — Phase B/C 별 PR.
- 설정 패널 (위젯 가시성 토글 / 기본 날짜 / X축 / GlobalTabs 순서) — Phase E.
- 모바일 편집 UI / 키보드 reorder / 위젯 export — NextGen.

## 자율 실행

사용자가 "알아서 다 진행" 위임 (이전 세션 2026-05-10). 머지 단계만 사용자 — 그 외 결정 / 구현 / TDD / 리뷰 디스패치 / push / PR open 은 모두 자동.

시작 전 첫 응답에 다음을 포함할 것:
1. 4 PR 머지 상태 확인 (`gh pr view 291/292/293/294 --json state`)
2. 머지 안 된 PR 있으면 사용자에게 머지 요청 후 종료. 모두 머지된 경우만 진입.
3. Phase D 작업 순서 확인 (위 순서 1~9) 및 첫 단계 (TDD 회귀 작성) 진입.
```

---

## 사용 메모

- 위 코드 블록 본문이 다음 세션 진입 메시지. 그대로 붙여넣으면 됨.
- 머지가 일부만 됐을 때를 대비해 첫 단계가 머지 상태 확인.
- Phase D 가 끝나면 본 파일 폐기 + 새로 Phase E 프롬프트 작성.
