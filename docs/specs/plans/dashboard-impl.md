# 대시보드 구현 계획 (v2 — 2026-04-26)

> 벤치마크: `benchmark/12-dashboard.png`, `benchmark/14-dashboard-layout-edit.png`  
> 스펙: `docs/specs/requires/dashboard.md`, `docs/specs/requires/design.md §11`  
> 프로토타입: `prototype/prototype.html` — CSS·HTML 구조 1:1 참조

---

## 목표

`benchmark/12-dashboard.png`와 pixel-level로 일치하는 대시보드를 구현한다.  
기존에 삭제된 파일들을 처음부터 재작성. 백엔드 API도 함께 구현.

---

## 파일 구조

### Frontend (생성 대상)

```
frontend/src/
├── pages/
│   └── DashboardPage.tsx            ← 페이지 루트, 글로벌 필터 상태 소유
├── hooks/
│   └── useDashboardFilter.ts        ← 글로벌 필터 상태 + 쿼리 파라미터 빌더
├── api/
│   └── dashboard.ts                 ← 모든 dashboard API 호출 함수
└── components/dashboard/
    ├── DashboardHeader.tsx           ← 헤더 (타이틀, 담당자·날짜 컨트롤, 편집 버튼)
    ├── GlobalTabs.tsx                ← 시스템 탭 바
    ├── FilterContextBanner.tsx       ← 필터 활성 시 표시 배너
    ├── KpiSection.tsx                ← VOLUME/QUALITY 2행 KPI 카드
    ├── DistributionWidget.tsx        ← 분포 위젯 (도넛 + 4탭 + dim셀렉터)
    ├── PriorityStatusMatrix.tsx      ← 우선순위×상태 매트릭스
    ├── DrilldownHeatmap.tsx          ← 드릴다운 히트맵
    ├── WeeklyTrendChart.tsx          ← 주간 트렌드 3선 (recharts LineChart)
    ├── TagDistributionChart.tsx      ← 태그별 분포 Top10 가로 바 (CSS only)
    ├── ProcessingSpeedWidget.tsx     ← 처리속도 SLA 테이블
    ├── AgingWidget.tsx               ← 에이징 3구간 바
    ├── AssigneeTable.tsx             ← 담당자별 처리 현황
    ├── AgingVocList.tsx              ← 장기 미처리 VOC Top10
    ├── LayoutEditPanel.tsx           ← 레이아웃 편집 사이드 패널
    └── DimSelector.tsx               ← 공통 dim 셀렉터 컴포넌트 [전체|시스템별|메뉴별]
```

### Router 업데이트

`frontend/src/router.tsx`:

- `/dashboard` 경로 추가
- Manager/Admin Guard: `role !== 'admin' && role !== 'manager'` → `<Navigate to="/" />`

### Backend (생성 대상)

```
backend/src/routes/
└── dashboard.ts    ← 15개 엔드포인트 전체
```

---

## 글로벌 필터 상태 (`useDashboardFilter.ts`)

```typescript
interface DashboardFilterState {
  dateRange: { startDate: string; endDate: string };
  datePreset: '7d' | '30d' | '90d' | 'custom';
  globalTab: 'all' | string; // 'all' | systemId
  activeMenu: string | null;
  activeAssignee: string | null;
}
```

- 초기값: `datePreset: '30d'`, `globalTab: 'all'`, 나머지 null
- `buildQueryParams(filter)` 헬퍼: 현재 필터를 `URLSearchParams`로 변환
- `datePreset` → `startDate/endDate` 자동 계산 (7d=오늘-7일, 30d=오늘-30일, 90d=오늘-90일)

---

## 구현 단계 (순서 중요)

### Step 1 — 공통 토대

1. **`dashboard.ts` API 모듈** 작성: 15개 함수, 모두 `fetch('/api/dashboard/...' + params)` 패턴
2. **`useDashboardFilter.ts`** 훅 작성
3. **`DimSelector.tsx`** 공통 컴포넌트
4. **Router** `/dashboard` 경로 + Guard 추가
5. **`DashboardPage.tsx`** 뼈대: 전체 레이아웃 컨테이너만, 위젯은 순차 추가

### Step 2 — 헤더·탭·배너

6. **`DashboardHeader.tsx`**: 헤더 고정
7. **`GlobalTabs.tsx`**: 탭 전환 → `filter.globalTab` 업데이트
8. **`FilterContextBanner.tsx`**: filter 상태 보고 조건부 표시

### Step 3 — KPI

9. **`KpiSection.tsx`**: VOLUME + QUALITY 2행
   - `GET /api/dashboard/summary` 데이터 사용
   - 카드 클릭 → `navigate('/?' + params)` (VOC 목록 필터 이동)

### Step 4 — 분포 + 매트릭스 (2-col)

10. **`DistributionWidget.tsx`**: 도넛 + 4탭 + dim셀렉터
11. **`PriorityStatusMatrix.tsx`**: 매트릭스 테이블 + 셀 색상 계산

### Step 5 — 히트맵

12. **`DrilldownHeatmap.tsx`**: breadcrumb + X축 셀렉터 + 고정 테이블

### Step 6 — 차트 위젯 (2-col)

13. **`WeeklyTrendChart.tsx`**: recharts LineChart
14. **`TagDistributionChart.tsx`**: CSS 가로 바

### Step 7 — 하단 위젯

15. **`ProcessingSpeedWidget.tsx`**: SLA 테이블 (2-col 좌)
16. **`AgingWidget.tsx`**: 3구간 바 (2-col 우)
17. **`AssigneeTable.tsx`**: 담당자별 처리 현황
18. **`AgingVocList.tsx`**: 장기 미처리 Top10

### Step 8 — 레이아웃 편집 + 백엔드

19. **`LayoutEditPanel.tsx`**: 우측 슬라이드인 패널
20. **Backend `dashboard.ts`**: 15개 엔드포인트 구현

### Step 9 — 검증

21. typecheck + 기존 Vitest 전체 통과
22. Playwright 스크린샷 → `benchmark/12-dashboard.png`와 육안 비교

---

## 컴포넌트별 정밀 스펙

### DashboardHeader

```
layout:     flex, align-items:center, justify-content:space-between
padding:    14px 24px 10px
border:     border-bottom 1px solid var(--border-subtle)
position:   sticky; top:0; z-index:20; background:var(--bg-app)

title:      font-size 17px, font-weight 700, letter-spacing -0.02em

controls (우측, gap:6px):
  ┌ menuSelectorWrap (시스템 탭 활성 시만 display:flex)
  │   separator "›"  +  <select class="filter-select">
  ├ assigneeSelect  <select class="filter-select">  "담당자: 전체"
  ├ date-btn-group  [7일][30일✓][90일][커스텀]  — 30일 기본 active
  ├ 날짜 범위 버튼  "📅 YYYY.MM.DD–MM.DD ▾"
  └ 레이아웃 편집 버튼  LayoutPanelLeft 아이콘 13px + 텍스트

filter-select CSS:
  padding:4px 8px; border-radius:6px; border:1px solid var(--border-standard)
  background:var(--bg-surface); color:var(--text-secondary); font-size:12px
```

### GlobalTabs

```
container:  flex, gap:2px, padding:0 24px
            border-bottom:1px solid var(--border-subtle)
            overflow-x:auto; background:var(--bg-app)

tab:        padding:8px 14px; font-size:12px; font-weight:500
            color:var(--text-tertiary); border:none; background:transparent
            border-bottom:2px solid transparent; margin-bottom:-1px
            white-space:nowrap

tab.active: color:var(--brand); border-bottom-color:var(--brand); font-weight:600
tab:hover:  color:var(--text-secondary)
```

### FilterContextBanner

```
padding:     6px 24px
background:  var(--brand-bg)
border-bottom: 1px solid var(--brand-border)
font-size:   12px (spec: 13px — 프로토타입 기준 12px)
color:       var(--brand)
display:     none (기본) / flex (필터 활성 시)

표시 조건: globalTab !== 'all' OR activeAssignee !== null
내용: "{시스템} › {메뉴} › 담당자: {이름} 기준"
      없는 세그먼트 생략, "›" 구분자(U+203A)
```

### KpiSection

```
섹션 레이블 (VOLUME / QUALITY):
  font-size:11px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase
  color:var(--text-quaternary); margin-bottom:8px; padding:0

kpi-grid:
  display:grid; grid-template-columns:repeat(4,1fr); gap:8px

kpi-card:
  background:var(--bg-surface); border:1px solid var(--border-subtle)
  border-radius:8px; padding:13px 15px; cursor:pointer
  transition:border-color .15s
  hover: border-color:var(--brand-border)

  alert-red:   border-color:oklch(58% 0.22 25 / 0.35)
  alert-amber: border-color:oklch(70% 0.16 72 / 0.30)

kpi-label:    font-size:11px; color:var(--text-tertiary); margin-bottom:5px
kpi-value:    font-size:24px; font-weight:700; letter-spacing:-0.03em; line-height:1; margin-bottom:3px
              단위(일/%) span: font-size:14px; font-weight:400
kpi-sublabel: font-size:10px; color:var(--text-quaternary); margin-bottom:3px
kpi-delta:    font-size:11px; font-weight:500
  delta-pos: color:oklch(62% 0.19 158)   ← 초록
  delta-neg: color:oklch(58% 0.22 25)    ← 빨강
  delta-amb: color:oklch(70% 0.16 72)    ← 앰버

카드별 특수 처리:
  Urgent·High 미해결: kpi-value color:oklch(58% .22 25), class alert-red
  14일+ 미처리:       kpi-value color:oklch(70% .16 72), class alert-amber
  평균 처리시간 delta: ▼ 감소 = delta-pos (반전)

카드 클릭 → navigate 파라미터 (dashboard.md §카드 클릭 동작 표 참조)
```

### DimSelector

```
공통 컴포넌트:
  props: options: {label, value}[], value, onChange, hiddenValues?: string[]

container: display:flex; gap:1px; background:var(--bg-elevated); border-radius:5px; padding:2px

btn: padding:2px 8px; font-size:10px; font-weight:500; border:none; background:transparent
     color:var(--text-quaternary); border-radius:3px; cursor:pointer
btn.active: background:var(--bg-surface); color:var(--brand); font-weight:600
btn:disabled: opacity:0.35; cursor:not-allowed

hiddenValues에 포함된 버튼: display:none (시스템 탭에서 "시스템별" 숨김 용)
```

### DistributionWidget

```
widget container: (표준 .widget 스타일 사용)

widget-header: 분포 타이틀 + DimSelector [전체|시스템별|메뉴별]

탭 바 (d-tabs):
  display:flex; gap:0; margin-bottom:12px
  border-bottom:1px solid var(--border-subtle)
  탭: padding:5px 11px; font-size:12px
  active: color:var(--brand); border-bottom:2px solid var(--brand); font-weight:600

탭 4종: [상태] [우선순위] [유형] [태그]

도넛 + 레전드 (donut-section):
  display:flex; align-items:center; gap:16px

도넛:
  width:96px; height:96px (flex-shrink:0)
  conic-gradient: 각 항목 비율로 stop 계산
  중앙 구멍: position:absolute; inset:20px; border-radius:50%
             background:var(--bg-surface)
             총건수: font-size:17px; font-weight:700
             "총건수" 레이블: font-size:9px; color:var(--text-quaternary)

레전드 (flex:1, flex-direction:column, gap:4px):
  각 항목: display:flex; align-items:center; gap:6px; font-size:11px; cursor:pointer
  dot: width:7px; height:7px; border-radius:50%
  name: flex:1; color:var(--text-secondary)  — hover시 color:var(--brand)
  count: font-weight:600; color:var(--text-primary); min-width:26px; text-align:right
  pct: color:var(--text-quaternary); min-width:30px; text-align:right
  bar-wrap: width:44px; height:3px; background:var(--bg-elevated); border-radius:2px
  bar-fill: height:100%; border-radius:2px; width = (count/max)*100%

색상 배정 (dashboard.md §2 참조):
  상태:     접수=var(--text-quaternary), 검토중=oklch(67% .17 240),
            처리중=oklch(55% .17 150), 완료=oklch(62% .19 158), 드랍=oklch(70% .16 72)
  우선순위: Urgent=var(--chart-red), High=oklch(60% .18 45),
            Medium=var(--text-tertiary), Low=var(--text-quaternary)
  유형:     voc_types.color 값
  태그:     순서대로 chart-blue/chart-sky/chart-red/chart-amber/chart-emerald/text-tertiary
```

### PriorityStatusMatrix

```
widget container (two-col 우측)

widget-header: 우선순위 × 상태 매트릭스 + DimSelector [전체|시스템별|메뉴별]

matrix-table:
  width:100%; border-collapse:collapse; font-size:11px

th: font-size:10px; font-weight:600; color:var(--text-quaternary); padding:4px 5px
    text-align:center; border-bottom:1px solid var(--border-subtle); white-space:nowrap
th.rh: text-align:left

td: padding:5px 4px; text-align:center; font-weight:600; font-size:12px
    cursor:pointer; border-radius:3px
td.rh: text-align:left; font-size:11px; cursor:default (행 레이블)
  Urgent: color:oklch(58% .22 25)
  High:   color:oklch(60% .18 45)
  Medium: color:var(--text-tertiary)
  Low:    color:var(--text-quaternary)

셀 색상: background:oklch(63% 0.19 258 / α)
  α = lerp(0.06, 0.62, value / maxValue)  [maxValue = 모든 셀 최대값]
  0건: background:var(--bg-elevated); color:var(--text-quaternary); "—"; cursor:default

바닥 안내문: font-size:10px; color:var(--text-quaternary); margin-top:7px
  "셀 클릭 → 해당 필터로 VOC 목록 이동"

셀 클릭: navigate('/?priority=urgent&status=접수' + 글로벌 필터)
```

### DrilldownHeatmap

```
widget container (full width)

heatmap-top (widget-header 대체):
  display:flex; align-items:center; justify-content:space-between; margin-bottom:10px
  좌측: flex gap:12px — "드릴다운 히트맵" 타이틀 + breadcrumb
  우측: btn-group [진행 현황|우선순위별|태그별]

btn-group:
  display:flex; gap:1px; background:var(--bg-elevated); border-radius:6px; padding:2px
  btn: padding:3px 9px; font-size:11px; border:none; background:transparent
       border-radius:4px; color:var(--text-tertiary)
  btn.active: background:var(--bg-surface); color:var(--brand); font-weight:600
              box-shadow:0 1px 3px oklch(0% 0 0 / .1)

breadcrumb:
  font-size:11px; color:var(--text-tertiary)
  crumb.clickable: cursor:pointer; hover color:var(--brand)
  sep "›": color:var(--text-quaternary); margin:0 4px
  레벨별 표시 (dashboard.md §4 브레드크럼 표 참조)

heatmap-table:
  width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed
  colgroup: Y축 레이블 열 130px 고정, 데이터 열 균등 분배, 합계 열 60px

  th: font-size:10px; font-weight:600; color:var(--text-quaternary)
      padding:4px 6px; text-align:center; border-bottom:1px solid var(--border-subtle)
      white-space:nowrap; overflow:hidden
  th.rl: text-align:left

  td: padding:5px 6px; text-align:center; font-size:11px; font-weight:600
      border-radius:3px; overflow:hidden
  td.rl: text-align:left; font-weight:500; color:var(--text-secondary)
         white-space:nowrap; overflow:hidden; text-overflow:ellipsis
  td.rl.clickable: cursor:pointer; hover color:var(--brand)  (전체 탭 시스템 행만)
  td.tc: color:var(--text-tertiary); font-weight:700  (합계 열)
  td.empty: color:var(--text-quaternary); background:var(--bg-elevated)!important

합계 행 (hm-total-row):
  background:var(--bg-elevated)!important; border-bottom:1px solid var(--border-standard)
  td.rl: font-weight:700; color:var(--text-primary)
  td.tc: color:var(--text-secondary); font-weight:700

셀 색상: oklch(63% 0.19 258 / α), α = lerp(0.06, 0.62, value/viewMaxValue)
시스템 행 클릭 (전체 탭): switchGlobalTab(systemId)
데이터 셀 클릭: navigate('/?systemId=...&status=...' + 글로벌 필터)
```

### WeeklyTrendChart

```
widget container (two-col 좌측, gap:16px)

widget-header: "주간 트렌드 (최근 12주)" + DimSelector [전체|시스템별|메뉴별]

chart-legend (flex, gap:14px, margin-bottom:8px):
  cleg-item: display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-secondary)
  cleg-line: width:14px; height:2px; border-radius:1px (색상 구분선)
  3선: 신규(var(--chart-blue)) / 진행중(var(--chart-sky)) / 완료(var(--chart-emerald))

chart-area: position:relative; height:110px
  recharts <LineChart> responsive
  X축: W1~W12 (font-size:9px, color:var(--text-quaternary))
  격자선: stroke:var(--border-subtle), stroke-width:0.5
  dot 클릭: navigate (dashboard.md §5 포인트 클릭 동작 참조)
  Tooltip: 주차 + 3선 값

API: GET /api/dashboard/weekly-trend?weeks=12 (날짜 필터 무관)
```

### TagDistributionChart

```
widget container (two-col 우측)

widget-header: "태그별 분포 (Top 10)" + DimSelector [전체|시스템별|메뉴별]

bar-list (flex-direction:column, gap:4px):
  bar-item: display:grid; grid-template-columns:72px 1fr 28px; align-items:center; gap:6px
            font-size:11px; cursor:pointer
  bar-label: color:var(--text-secondary); text-align:right; overflow:hidden; text-overflow:ellipsis
             hover: color:var(--brand)
  bar-track: height:5px; background:var(--bg-elevated); border-radius:3px; overflow:hidden
  bar-fill:  height:100%; background:var(--chart-blue); border-radius:3px
             width = (count / maxCount) * 100%
  bar-val:   font-weight:600; color:var(--text-tertiary)

클릭: navigate('/?tag=' + tagName + 글로벌 필터)
API: GET /api/dashboard/tag-distribution?limit=10
```

### ProcessingSpeedWidget

```
widget container (2-col 좌측, 50% 폭)

widget-header: "처리속도" + DimSelector [전체|시스템별|메뉴별]

sla-header (grid: 1fr 72px 72px):
  font-size:10px; font-weight:600; color:var(--text-quaternary)
  text-transform:uppercase; letter-spacing:.04em
  columns: 시스템/메뉴 | 평균 처리일 | SLA 준수율

sla-row (grid: 1fr 72px 72px):
  padding:5px 0; border-bottom:1px solid var(--border-subtle)
  sla-name: font-size:12px; color:var(--text-secondary)
  sla-avg: font-size:12px; font-weight:600; color:var(--text-primary); text-align:right
           font-variant-numeric:tabular-nums
  sla-rate: font-size:11px; font-weight:700; text-align:right
    good (≥80%): light-dark(oklch(42% .17 152), oklch(66% .19 155))
    warn (60~79%): light-dark(oklch(50% .16 68), oklch(72% .16 72))
    bad  (<60%): light-dark(oklch(50% .18 22), oklch(68% .20 22))

API: GET /api/dashboard/processing-speed
```

### AgingWidget

```
widget container (2-col 우측, 50% 폭)

widget-header: "에이징" + DimSelector [전체|시스템별|메뉴별]

aging-legend (flex, gap:10px, margin-bottom:8px):
  legend-item: font-size:10px; font-weight:600; color:var(--text-quaternary)
  8px 컬러 스퀘어 (border-radius:2px):
    safe: light-dark(oklch(55% .17 152), oklch(60% .19 155))   ← ≤7일
    warn: light-dark(oklch(55% .15 68), oklch(68% .16 72))     ← 8~30일
    crit: light-dark(oklch(52% .18 22), oklch(62% .20 22))     ← 31일+

각 시스템/메뉴 행:
  aging-item-label: 이름 + 우측 건수 (safe/warn/crit 색상별)
  aging-bar: height:6px; border-radius:3px; overflow:hidden; flex row
    aging-seg: 비율에 따른 width, safe/warn/crit 색상

클릭: navigate('/?status=접수,검토중,처리중&agingRange=le7|d8to30|gt30')
API: GET /api/dashboard/aging
```

### AssigneeTable

```
widget container (full width)

widget-header: "담당자별 처리 현황" + btn-group [진행 현황|우선순위별|태그별] (히트맵과 독립)

assign-table:
  width:100%; border-collapse:collapse; font-size:11px
  th: font-size:10px; font-weight:600; color:var(--text-quaternary); padding:5px 8px
      text-align:center; border-bottom:1px solid var(--border-subtle)
  th.rl: text-align:left
  td: padding:5px 8px; text-align:center; font-weight:600; border-radius:3px
  td.rl: text-align:left; font-weight:500; color:var(--text-secondary)
  td.unassigned: color:var(--text-quaternary); font-style:italic
  td.tc: color:var(--text-tertiary); font-weight:700  (합계 열)

담당자 필터 활성 시 해당 행:
  assign-row-highlight: outline:2px solid var(--brand); outline-offset:-2px
                        background:var(--brand-bg)!important

셀 색상: oklch(63% 0.19 258 / α), α = lerp(0.06, 0.62, value/tableMaxValue)
셀 클릭: navigate('/?assigneeId=X&status=...' + 글로벌 필터)
미배정 행: 항상 마지막, assigneeId=unassigned

API: GET /api/dashboard/assignee-stats?xAxis=status|priority|tag
```

### AgingVocList

```
widget container (full width)

widget-header: "장기 미처리 VOC Top 10" + DimSelector
  전체 탭: [전체|시스템별]
  시스템 탭: [전체|메뉴별]  ← JS로 버튼 텍스트 동적 변경

aging-table:
  width:100%; border-collapse:collapse; font-size:11px
  th: font-size:10px; font-weight:600; color:var(--text-quaternary); padding:5px 8px
      text-align:left; border-bottom:1px solid var(--border-subtle)
  td: padding:6px 8px; border-bottom:1px solid var(--border-subtle); color:var(--text-secondary)
  tr:hover td: background:var(--bg-elevated); cursor:pointer

열 구성:
  td.code: font-family:D2Coding,monospace; font-size:10px; color:var(--text-tertiary)
  td.title-col: color:var(--text-primary); max-width:180px; overflow:hidden; white-space:nowrap
  시스템/메뉴 열: dim 선택에 따라 헤더 변경
  우선순위: d-badge (urgent/high/medium — medium 이하 숨김 가능)
    d-badge-urgent: background:oklch(58% .22 25 / .15); color:oklch(58% .22 25)
    d-badge-high:   background:oklch(60% .18 45 / .15); color:oklch(60% .18 45)
  경과일 배지:
    14~29일: d-badge-amber
    30일+:   d-badge-red

행 클릭: VOC Drawer 열기

API: GET /api/dashboard/aging-vocs?limit=10
```

### LayoutEditPanel

```
position: absolute; right:0; top:0; bottom:0; width:256px
background:var(--bg-panel); border-left:1px solid var(--border-subtle)
z-index:50; transform:translateX(100%)
transition: transform .22s cubic-bezier(.4,0,.2,1)
display:flex; flex-direction:column; padding:18px 16px; overflow-y:auto

edit-mode 활성 시:
  패널: transform:translateX(0)
  dash-body: padding-right:260px 추가
  각 위젯: outline:1.5px dashed oklch(65% .17 242 / .35); outline-offset:2px
  위젯 hover: outline-color:oklch(65% .17 242 / .7); box-shadow:0 0 0 3px oklch(65% .17 242 / .08)

패널 내부:
  헤더: "레이아웃 편집" 타이틀 + × 닫기 버튼
  설명: "위젯을 드래그하여 순서 변경, 눈 아이콘으로 숨기기"

  저장 대상 토글 (ds-save-target-group):
    [내 설정 ✓] [기본값 (Admin)]  ← Admin만 기본값 선택 가능

  기본 설정 섹션:
    기본 기간 <select>: 최근 7일 / 최근 30일 / 최근 90일
    히트맵 기본 X축 <select>: 시스템 / 우선순위 / 태그

  [설정 저장] 버튼 — PUT /api/dashboard/settings
  [취소] 버튼

위젯 edit bar (각 위젯 최상단, edit-mode에서만 표시):
  grip(≡) + 위젯명 + [👁 눈] + [🔒 잠금]
```

---

## 레이아웃 편집 상태

`DashboardPage` 최상위에 `editMode: boolean` state 유지:

- `true`: `#page-dashboard`에 `edit-mode` 클래스 추가
- 각 `dash-widget`에 drag handle, vis/lock 버튼 표시

MVP 범위: 위젯 숨기기/표시 + 기본 날짜 범위 + 히트맵 기본 X축  
(드래그 재배치는 NextGen — `dashboard.md §커스터마이징` 참조)

---

## 백엔드 API 구현 방향

`backend/src/routes/dashboard.ts`:

```
GET /api/dashboard/summary
  → users JOIN vocs WHERE role IN ('manager','admin')
  → KPI 8종 + prev_week 비교값 반환

GET /api/dashboard/distribution?type=status|priority|voc_type|tag
  → GROUP BY 해당 컬럼, 건수+비율

GET /api/dashboard/priority-status-matrix
  → GROUP BY priority, status → 4×5 매트릭스

GET /api/dashboard/heatmap?xAxis=status|priority|tag
  → systemId/menuId에 따라 Y축 결정
  → { headers, totalRow, rows: [{name, values, total}] }

GET /api/dashboard/weekly-trend?weeks=12
  → { weeks:['W1'...'W12'], series:{new[], inProgress[], done[]} }

GET /api/dashboard/tag-distribution?limit=10
  → Top N 태그 건수

GET /api/dashboard/system-overview
  → 각 시스템/메뉴의 상태별 카드 데이터

GET /api/dashboard/assignee-stats?xAxis=status|priority|tag
  → 담당자별 × X축 교차 테이블

GET /api/dashboard/processing-speed
  → 시스템/메뉴별 평균 처리일, SLA 준수율

GET /api/dashboard/aging
  → 미완료 VOC의 ≤7일/8~30일/31일+ 분포

GET /api/dashboard/aging-vocs?limit=10
  → 장기 미처리 Top N VOC 목록

GET /api/dashboard/settings
PUT /api/dashboard/settings
  → dashboard_settings 테이블 (user_id IS NULL = Admin 기본값)

GET /api/dashboard/menus?systemId=
GET /api/dashboard/assignees
```

공통: Manager/Admin role 체크 미들웨어 적용  
공통 쿼리 파라미터: `systemId`, `menuId`, `assigneeId`, `startDate`, `endDate`

---

## 수용 기준 (베리파이 체크리스트)

- [ ] `/dashboard` 라우트 접근: Manager/Admin → 페이지 렌더링, User → `/` 리다이렉트
- [ ] 기본 진입 시: KPI 8종, 분포, 매트릭스, 히트맵, 주간 트렌드, 태그 바, 처리속도, 에이징, 담당자 테이블, 장기 미처리 모두 표시
- [ ] GlobalTab 전환 시 모든 위젯 데이터 갱신
- [ ] 시스템 탭 클릭 시 헤더 메뉴 드롭다운 표시
- [ ] 메뉴 선택 시 FilterContextBanner 표시 + 히트맵 단일 행
- [ ] 담당자 필터 선택 시 FilterContextBanner 갱신, AssigneeTable 하이라이트
- [ ] 분포 위젯 탭 4종 전환 (상태/우선순위/유형/태그)
- [ ] 히트맵 X축 전환 시 테이블 크기 변화 없음 (table-layout:fixed)
- [ ] 매트릭스 셀 클릭 → VOC 목록 이동 (올바른 필터 파라미터)
- [ ] 레이아웃 편집 패널 슬라이드인/아웃
- [ ] typecheck 통과, 기존 Vitest 전체 통과
- [ ] Playwright 스크린샷 vs benchmark/12-dashboard.png 육안 일치

---

---

## Recharts 사용 계획

| 위젯                             | 방식                                            | 이유                                                  |
| -------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `WeeklyTrendChart`               | `recharts <LineChart>`                          | 12주 다선 차트, 포인트 클릭 이벤트 필요               |
| `TagDistributionChart`           | `recharts <BarChart layout="vertical">`         | 가로 바 + Tooltip + 클릭 이벤트 일관성                |
| `AgingWidget` (시스템/메뉴별 행) | `recharts <BarChart layout="vertical" stacked>` | ≤7일/8~30일/31일+ 3색 스택 바                         |
| `DistributionWidget` 도넛        | CSS `conic-gradient` (recharts 아님)            | 스펙 명시(`design.md §11.4`), 중앙 레이블·범례 커스텀 |
| `PriorityStatusMatrix`           | HTML table (recharts 아님)                      | 셀 단위 색상+클릭, recharts 불가                      |
| `DrilldownHeatmap`               | HTML table (recharts 아님)                      | table-layout:fixed, 셀 클릭, recharts 불가            |
| `AssigneeTable`                  | HTML table (recharts 아님)                      | 동일 이유                                             |
| `ProcessingSpeedWidget`          | HTML table (recharts 아님)                      | SLA 수치 표, 단순 텍스트 표시                         |
| `AgingVocList`                   | HTML table (recharts 아님)                      | VOC 목록 테이블                                       |

### TagDistributionChart recharts 상세

```tsx
<BarChart layout="vertical" data={items} margin={{ left: 0, right: 30 }}>
  <XAxis type="number" hide />
  <YAxis
    type="category"
    dataKey="name"
    width={72}
    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
  />
  <Tooltip formatter={(v) => [v, '건']} />
  <Bar
    dataKey="count"
    fill="var(--chart-blue)"
    radius={3}
    cursor="pointer"
    onClick={(d) => navigate('/?tag=' + d.name + globalParams)}
  />
</BarChart>
```

### AgingWidget recharts 상세

```tsx
// 각 시스템/메뉴 행마다 작은 스택 바
<BarChart layout="vertical" data={[row]} height={16} margin={{all:0}}>
  <XAxis type="number" hide domain={[0,total]} />
  <YAxis type="category" hide />
  <Bar dataKey="safe" stackId="a" fill="oklch(55% .17 152)"
       onClick={() => navigate('/?agingRange=le7'+...)} />
  <Bar dataKey="warn" stackId="a" fill="oklch(55% .15 68)"
       onClick={() => navigate('/?agingRange=d8to30'+...)} />
  <Bar dataKey="crit" stackId="a" fill="oklch(52% .18 22)"
       onClick={() => navigate('/?agingRange=gt30'+...)} />
</BarChart>
```

---

## 클릭 → VOC 목록 이동 (전체 인터랙션 매핑)

모든 클릭은 `navigate('/?' + new URLSearchParams({...globalFilter, ...localFilter}))` 패턴.  
`globalFilter` = `{ systemId?, menuId?, assigneeId? }` — 현재 글로벌 필터 항상 포함.

### KPI 카드 (8종)

| 카드               | 이동 파라미터                                        |
| ------------------ | ---------------------------------------------------- |
| 총 VOC             | `startDate, endDate`                                 |
| 미해결             | `status=접수,검토중,처리중`                          |
| 이번주 신규        | `startDate=이번주월요일, endDate=오늘`               |
| 이번주 완료        | `startDate=이번주월요일, endDate=오늘, status=완료`  |
| 평균 처리시간      | `startDate, endDate, status=완료`                    |
| 해결율             | `startDate, endDate`                                 |
| Urgent·High 미해결 | `priority=urgent,high, status=접수,검토중,처리중`    |
| 14일+ 미처리       | `status=접수,검토중,처리중, createdBefore=오늘-14일` |

### 분포 위젯 — 레전드 항목 클릭

| 탭       | 클릭 대상        | 이동 파라미터                               |
| -------- | ---------------- | ------------------------------------------- |
| 상태     | 각 상태 항목     | `status={접수\|검토중\|처리중\|완료\|드랍}` |
| 우선순위 | 각 우선순위 항목 | `priority={urgent\|high\|medium\|low}`      |
| 유형     | 각 유형 항목     | `vocType={typeSlug}`                        |
| 태그     | 각 태그 항목     | `tag={tagName}`                             |

### 우선순위 × 상태 매트릭스

- **데이터 셀 클릭** → `priority={urgent|high|medium|low}&status={접수|검토중|처리중|완료|드랍}`
- **0건 셀** → 클릭 불가 (cursor:default)
- **행 헤더(Urgent/High/...)** → 클릭 불가

### 드릴다운 히트맵

| 클릭 대상                  | 조건                    | 동작                                        |
| -------------------------- | ----------------------- | ------------------------------------------- |
| Y축 시스템 행 (`▶ 채널 A`) | 전체 탭에서만 clickable | `switchGlobalTab(systemId)` — VOC 이동 아님 |
| Y축 메뉴 행                | 클릭 불가               | —                                           |
| 데이터 셀 (X=진행현황)     | 값 > 0                  | `systemId=&menuId=&status={값}`             |
| 데이터 셀 (X=우선순위별)   | 값 > 0                  | `systemId=&menuId=&priority={값}`           |
| 데이터 셀 (X=태그별)       | 값 > 0                  | `systemId=&menuId=&tag={값}`                |
| 합계 열 (tc)               | 값 > 0                  | X축 필터 없이 `systemId=&menuId=` 만        |
| 0건 셀                     | —                       | 클릭 불가                                   |
| 브레드크럼 세그먼트        | 클릭 가능 세그먼트      | `switchGlobalTab` / `setActiveMenu(null)`   |

### 주간 트렌드 (recharts 포인트 클릭)

| 선             | 클릭 파라미터                                                    |
| -------------- | ---------------------------------------------------------------- |
| 신규(파란)     | `startDate=해당주월요일, endDate=해당주일요일`                   |
| 진행중(sky)    | `status=검토중,처리중, snapshotDate=해당주일요일`                |
| 완료(에메랄드) | `status=완료,드랍, startDate=해당주월요일, endDate=해당주일요일` |

### 태그별 분포 — 바 클릭 (recharts `onClick`)

- 각 바 항목 클릭 → `tag={tagName}`

### 처리속도 (SLA)

- 각 행 클릭 → `systemId=&menuId=&status=완료` (해당 시스템/메뉴 기준 완료 VOC 목록)
- 클릭 불가 처리도 가능 (선택 사항 — 스펙에 명시 없음)

### 에이징 위젯 — recharts 스택 바 세그먼트 클릭

| 세그먼트      | 클릭 파라미터                                  |
| ------------- | ---------------------------------------------- |
| safe (≤7일)   | `status=접수,검토중,처리중, agingRange=le7`    |
| warn (8~30일) | `status=접수,검토중,처리중, agingRange=d8to30` |
| crit (31일+)  | `status=접수,검토중,처리중, agingRange=gt30`   |

### 담당자별 처리 현황

| 클릭 대상                | 파라미터                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| 데이터 셀 (X=진행현황)   | `assigneeId={userId}&status={값}` (미배정: `assigneeId=unassigned`) |
| 데이터 셀 (X=우선순위별) | `assigneeId={userId}&priority={값}`                                 |
| 데이터 셀 (X=태그별)     | `assigneeId={userId}&tag={값}`                                      |
| 합계 열 (tc)             | `assigneeId={userId}` (필터 조건 없이 해당 담당자 전체)             |
| 0건 셀                   | 클릭 불가                                                           |

### 장기 미처리 VOC Top 10

- **행 클릭** → VOC Drawer 열기 (`openDrawer(vocId)`) — VOC 목록 이동 아님
- 이슈 ID 셀: D2Coding 폰트, `color:var(--text-tertiary)`

---

## 레이아웃 편집 모드 (전체 스펙)

### 상태 관리

```typescript
// DashboardPage.tsx 최상위
const [editMode, setEditMode] = useState(false);

// widget_visibility: 위젯별 표시 여부
const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({
  'kpi-volume': true,
  'kpi-quality': true,
  distribution: true,
  matrix: true,
  heatmap: true,
  'weekly-trend': true,
  'tag-distribution': true,
  'processing-speed': true,
  aging: true,
  assignee: true,
  'aging-vocs': true,
});
```

- `editMode=true` → `<div id="page-dashboard">` 에 `className="edit-mode"` 추가
- 초기값: `GET /api/dashboard/settings` 응답의 `widget_visibility` 적용

### 편집 패널 (`LayoutEditPanel.tsx`) — 전체 스펙

```
위치: position:absolute; right:0; top:0; bottom:0; width:256px
      background:var(--bg-panel); border-left:1px solid var(--border-subtle)
      z-index:50; overflow-y:auto; padding:18px 16px
      transform:translateX(100%)  → edit-mode 시 translateX(0)
      transition: transform .22s cubic-bezier(.4,0,.2,1)

패널 진입 시 dash-body: padding-right:260px 추가

─────────────────────────────────────────────────
[레이아웃 편집]                              [×]
위젯을 드래그하여 순서 변경, 눈 아이콘으로 숨기기

저장 대상:
┌─────────────┐ ┌──────────────────┐
│ 내 설정 ✓  │ │ 기본값 (Admin)   │  ← Admin만 선택 가능
└─────────────┘ └──────────────────┘

기본 설정
기본 기간    [최근 7일 ▾]   ← select: 7d/30d/90d
히트맵 X축  [시스템    ▾]   ← select: status/priority/tag

                        [설정 저장]   ← PUT /api/dashboard/settings
                        [취소]
─────────────────────────────────────────────────
```

- **저장 대상 버튼**: `ds-save-target-group` — flex row, 각 버튼 flex:1
  - active: `background:var(--brand-bg); border-color:var(--accent); color:var(--accent); font-weight:600`
  - inactive: `background:var(--bg-surface); border:1px solid var(--border-subtle); color:var(--text-secondary)`
- **기본 설정 레이블**: `font-size:11px; color:var(--text-tertiary); font-weight:600; text-transform:uppercase; letter-spacing:.04em`
- **select**: `width:100%; padding:7px 9px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:6px; color:var(--text-primary); font-size:13px`
- **설정 저장**: `width:100%; padding:8px; background:var(--accent); border:none; border-radius:6px; color:#fff; font-size:13px; font-weight:600`
- **취소**: `width:100%; padding:7px; border:1px solid var(--border-subtle); border-radius:6px; color:var(--text-secondary); font-size:12px`

### 위젯별 편집 바 (`widget-edit-bar`)

각 `dash-widget` 최상단에 삽입. `editMode=false` 시 `display:none`.

```
display:flex; align-items:center; gap:6px; padding:4px 8px 6px; margin-bottom:4px

[≡ grip]  [위젯명 텍스트 UPPERCASE]  ... 공백 ...  [👁 눈버튼]  [🔒 잠금버튼]

grip: color:var(--text-quaternary); cursor:grab; font-size:15px; line-height:1
위젯명: font-size:11px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.04em

눈 버튼 (widget-vis-btn):
  display:flex; align-items:center; padding:3px 5px
  background:var(--bg-elevated); border:1px solid var(--border-subtle)
  border-radius:4px; color:var(--text-tertiary)
  hover: color:var(--accent); border-color:var(--accent)
  아이콘: lucide <Eye> 12px (표시중) / <EyeOff> 12px (숨김중)
  클릭 → toggleVisibility(widgetKey)

잠금 버튼 (widget-lock-btn):
  동일 스타일 (MVP에서는 클릭 무반응, NextGen 기능 placeholder)
  아이콘: lucide <Lock> 12px
```

### 숨겨진 위젯 렌더링

```tsx
// 각 dash-widget 래퍼
<div className={`dash-widget ${!widgetVisibility[key] ? 'widget-hidden' : ''}`}>
  {editMode && (
    <div className="widget-edit-bar">
      <span className="widget-edit-grip">≡</span>
      <span className="widget-edit-name">{name}</span>
      <button className="widget-vis-btn" onClick={() => toggle(key)}>
        {widgetVisibility[key] ? <Eye size={12}/> : <EyeOff size={12}/>}
      </button>
      <button className="widget-lock-btn"><Lock size={12}/></button>
    </div>
  )}

  {/* 숨김 오버레이 */}
  <div className="widget-hidden-overlay">숨겨진 위젯</div>

  {/* 실제 위젯 내용 */}
  <ActualWidget ... />
</div>
```

```css
.widget-hidden-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-app);
  opacity: 0.6;
  border-radius: 8px;
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
}
.dash-widget.widget-hidden .widget-hidden-overlay {
  display: flex;
}
```

### 설정 저장/불러오기

```
불러오기 (페이지 마운트 시):
  GET /api/dashboard/settings
  응답: { widget_visibility, default_date_range, heatmap_default_x_axis }
  → widgetVisibility 초기값 세팅
  → datePreset 초기값 세팅
  → heatmapXAxis 초기값 세팅

저장 (설정 저장 클릭):
  PUT /api/dashboard/settings
  body: { widget_visibility, default_date_range, heatmap_default_x_axis, target: 'user'|'admin' }
  → target='admin': user_id=null 행 업데이트 (Admin 기본값)
  → target='user': 현재 user_id 행 업데이트
```

---

## 구현 시 주의사항

1. **donut chart**: recharts 쓰지 말 것. `conic-gradient` CSS만으로 구현 (프로토타입 방식 그대로)
2. **recharts 대상**: `WeeklyTrendChart`(LineChart) + `TagDistributionChart`(BarChart vertical) + `AgingWidget`(BarChart stacked)
3. **table-layout:fixed**: 히트맵은 반드시 고정 레이아웃. X축 전환 시 리플로우 방지
4. **dim 숨김 규칙**: 시스템 탭에서 `시스템별` dim 버튼 hidden (display:none 또는 hiddenValues prop)
5. **색상 토큰**: 절대 hex 쓰지 말 것. oklch 직접 사용은 스펙에 명시된 경우만
6. **staleTime**: React Query staleTime=5분 (대시보드 API 전체)
7. **메뉴 선택 초기화**: 상위 탭 클릭 시 activeMenu 초기화 필수 (dashboard.md §탭 전환 시 초기화 규칙)
8. **edit-mode CSS**: `#page-dashboard.edit-mode` 클래스로 모든 편집 모드 스타일 제어 — inline style 금지
9. **클릭 파라미터**: 모든 navigate 호출은 `buildQueryParams(filter)` 헬퍼로 글로벌 필터 자동 포함
