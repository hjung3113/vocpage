# VOC 대시보드 구현 계획 (v3 — 2026-04-23 확정)

> **요구사항 원문**: `docs/specs/requires/dashboard.md`
> **참조 시각화**: `prototype/dashboard/dashboard-v3.html`
> **구현 완료 후**: 위 HTML 파일을 브라우저로 열어 프로토타입과 나란히 비교 리뷰 — 누락된 인터랙션, 디자인 차이 확인 후 보완

---

## 구현 단계

### Phase 1 — 백엔드 API

- `GET /api/dashboard/*` 엔드포인트 전체 (dashboard.md API 표 참고)
- `GET /api/dashboard/menus?systemId=` — 메뉴 드롭다운용 (신규)
- `GET /api/dashboard/assignees` — 담당자 드롭다운용 (신규)
- `requireRole(['manager', 'admin'])` 미들웨어
- `vocs` 테이블:
  - 복합 인덱스: `(status, created_at)`, `(priority, status)`, `(assignee_id, status)`
  - `status_changed_at TIMESTAMPTZ` 컬럼 확인 (주간 트렌드 진행중 스냅샷·완료 전환 기준)
- `voc_tags` join 집계 쿼리 최적화
- `dashboard_settings` 테이블 마이그레이션 (시스템 순서+표시여부 포함)

### Phase 2 — 프론트엔드

```
src/pages/DashboardPage.tsx                          ← 메인 페이지
src/hooks/useDashboardFilter.ts                      ← 글로벌 필터 상태 관리
src/hooks/useDashboardData.ts                        ← React Query 쿼리 묶음
src/components/dashboard/
  GlobalFilterBar.tsx                                ← GlobalTabs + 메뉴 드롭다운 + 담당자 필터
  FilterContextBanner.tsx                            ← 필터 컨텍스트 배너
  KpiCard.tsx
  DistributionSection.tsx                            ← 탭(4종) + 도넛 차트
  DonutChart.tsx
  PriorityStatusMatrix.tsx
  DrilldownHeatmap.tsx                               ← X축 셀렉터, 합계 행, 고정 레이아웃
  WeeklyTrendChart.tsx                               ← 3선 차트
  TagDistributionChart.tsx
  SystemMenuCards.tsx                                ← 탭 연동 타이틀+내용
  AssigneeTable.tsx                                  ← X축 셀렉터, 담당자 필터 연동
  AgingVocList.tsx                                   ← dim 셀렉터 탭 연동
  SessionSettingsPanel.tsx
src/pages/admin/DashboardSettingsTab.tsx
```

**데이터 패칭**
- React Query (`@tanstack/react-query`), `staleTime: 5분`
- 글로벌 필터 변경 → 기간 연동 쿼리 전체 invalidate
- 위젯별 독립 쿼리로 병렬 fetching
- 로딩: 위젯별 스켈레톤 / 에러: 위젯 단위 인라인 에러 + 재시도 버튼 / 빈: "데이터 없음"

### Phase 3 — 디자인 토큰 (기존 유지)

```css
--chart-blue:    oklch(63% 0.19 258);   /* 신규(접수), primary */
--chart-sky:     oklch(72% 0.14 235);   /* 진행중(검토+처리) */
--chart-emerald: oklch(62% 0.19 158);   /* 완료(완료+보류) */
--chart-amber:   oklch(70% 0.16 72);    /* 보류, 경고 */
--chart-red:     oklch(58% 0.22 25);    /* Urgent, 부정 */
--chart-teal:    oklch(65% 0.16 195);   /* 보조 */
--chart-indigo:  oklch(55% 0.17 270);   /* 보조 */
```

### Phase 4 — 테스트

- BE: `/api/dashboard/*` Jest (role, 파라미터 검증, 집계 결과)
- FE: Vitest — 필터 상태 전환, 히트맵 렌더링, 브레드크럼 탐색
- E2E: 전체 → 시스템 → 메뉴 → 담당자 필터 흐름 + VOC 이동 확인

---

## 리스크

| 리스크 | 대응 |
|--------|------|
| 집계 쿼리 느림 | 복합 인덱스 + EXPLAIN 검증 |
| Recharts 번들 크기 | lazy import |
| 글로벌 필터 상태 복잡도 | `useDashboardFilter` 훅으로 단일 관리 |
| 히트맵 컬럼 수 변화 시 레이아웃 | table-layout:fixed + colgroup으로 고정 |

---

## 파일 변경 목록

**신규 생성**
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/admin/DashboardSettingsTab.tsx`
- `frontend/src/hooks/useDashboardFilter.ts`
- `frontend/src/hooks/useDashboardData.ts`
- `frontend/src/components/dashboard/GlobalFilterBar.tsx`
- `frontend/src/components/dashboard/FilterContextBanner.tsx`
- `frontend/src/components/dashboard/KpiCard.tsx`
- `frontend/src/components/dashboard/DistributionSection.tsx`
- `frontend/src/components/dashboard/DonutChart.tsx`
- `frontend/src/components/dashboard/PriorityStatusMatrix.tsx`
- `frontend/src/components/dashboard/DrilldownHeatmap.tsx`
- `frontend/src/components/dashboard/WeeklyTrendChart.tsx`
- `frontend/src/components/dashboard/TagDistributionChart.tsx`
- `frontend/src/components/dashboard/SystemMenuCards.tsx`
- `frontend/src/components/dashboard/AssigneeTable.tsx`
- `frontend/src/components/dashboard/AgingVocList.tsx`
- `frontend/src/components/dashboard/SessionSettingsPanel.tsx`
- `backend/src/routes/dashboard.ts`
- `backend/src/services/dashboardService.ts`
- `backend/src/middleware/requireRole.ts`

**수정**
- `frontend/src/router.tsx`
- `frontend/src/components/Sidebar.tsx`
- `backend/src/routes/index.ts`
- `backend/migrations/` (복합 인덱스 + dashboard_settings)
