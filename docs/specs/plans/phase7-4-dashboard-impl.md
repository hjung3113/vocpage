# Phase 7-4 구현 계획 — 대시보드 위젯 API + 프론트엔드

> 작성일: 2026-04-25
> 브랜치: feat/phase7-voc-crud

---

## 스코프

| 영역       | 내용                                               |
| ---------- | -------------------------------------------------- |
| 백엔드     | 13개 dashboard 집계 엔드포인트, Manager/Admin 전용 |
| 프론트엔드 | DashboardPage + GlobalFilter + 9개 위젯 컴포넌트   |

---

## 백엔드 (`backend/src/routes/dashboard.ts`)

### 공통 파라미터 파싱 헬퍼

```
extractFilters(query): { systemId?, menuId?, assigneeId?, startDate?, endDate? }
buildWhere(filters, params, idx): { clause, params, idx }
  - v.deleted_at IS NULL 항상 포함
  - systemId → v.system_id = $N
  - menuId → v.menu_id = $N
  - assigneeId === 'unassigned' → v.assignee_id IS NULL
  - assigneeId (other) → v.assignee_id = $N
  - startDate/endDate → v.created_at BETWEEN $N AND $N
```

### 엔드포인트 구현

**GET /api/dashboard/summary**

- 총 VOC, 미해결(접수+검토중+처리중), 이번주 신규, 이번주 완료
- 평균 처리시간(완료 VOC), 해결율, Urgent+High 미해결, 14일+ 미처리

**GET /api/dashboard/distribution?type=status|priority|voc_type|tag**

- GROUP BY 해당 컬럼, count 반환

**GET /api/dashboard/priority-status-matrix**

- 4×5 매트릭스: priority(urgent/high/medium/low) × status(5)

**GET /api/dashboard/heatmap?xAxis=status|priority|tag**

- Y축: systemId 없으면 시스템별, systemId+menuId 없으면 메뉴별
- X축: xAxis 파라미터에 따라 status/priority/tag

**GET /api/dashboard/weekly-trend?weeks=12**

- 12주간 신규/진행중/완료 추이
- 날짜 파라미터 무관

**GET /api/dashboard/tag-distribution?limit=10**

- tag별 VOC 수 TOP N

**GET /api/dashboard/system-overview**

- 시스템별 미해결/완료 카드 데이터

**GET /api/dashboard/assignee-stats?xAxis=status|priority|tag**

- 담당자별 × xAxis 매트릭스

**GET /api/dashboard/processing-speed**

- 우선순위별 평균 처리시간 + SLA 기준 준수율

**GET /api/dashboard/aging**

- 미완료 VOC: ≤7일 / 8~30일 / 31일+

**GET /api/dashboard/aging-vocs?limit=10**

- 미완료 VOC 장기 미처리 TOP N (created_at ASC)

**GET /api/dashboard/settings**

- dashboard_settings 조회 (user_id = req.user.id 우선, 없으면 user_id IS NULL)

**GET /api/dashboard/menus?systemId=**

- 해당 시스템의 활성 메뉴 목록

**GET /api/dashboard/assignees**

- 전체 Manager/Admin 목록 (담당자 드롭다운용)

---

## 프론트엔드

### API 클라이언트 (`frontend/src/api/dashboard.ts`)

`DashboardFilters` 인터페이스 + 각 엔드포인트 fetch 함수

### 훅 (`frontend/src/hooks/useDashboardFilter.ts`)

```typescript
interface DashboardFilterState {
  globalTab: 'all' | string; // 'all' | systemId
  activeMenu: string | null;
  assigneeId: string | null;
  dateRange: '7d' | '30d' | '90d';
  startDate: string;
  endDate: string;
}
```

### 컴포넌트 트리

```
DashboardPage
├── GlobalFilterBar (탭 + 메뉴드롭다운 + 담당자필터 + 날짜범위)
├── FilterContextBanner (필터 활성 시만 표시)
├── KpiSection (KpiCard × 8)
├── DistributionSection (탭 4종 + DonutChart stub)
├── PriorityStatusMatrix (테이블)
├── DrilldownHeatmap (xAxis 셀렉터 + 테이블)
├── WeeklyTrendChart (Recharts LineChart)
├── TagDistributionChart (Recharts BarChart horizontal)
├── SystemMenuCards (카드 가로 스크롤)
├── AssigneeTable (xAxis 셀렉터 + 테이블)
└── AgingVocList (Top 10 목록)
```

### 차트 라이브러리

- `recharts` + `@tanstack/react-query` (이미 설치됨)
- staleTime: 5분, 위젯별 독립 쿼리
