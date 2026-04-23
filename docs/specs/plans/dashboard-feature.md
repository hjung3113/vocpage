# VOC 대시보드 기능 계획 (v3 — 2026-04-23 확정)

> **참조 시각화**: `.superpowers/brainstorm/71061-1776875230/content/dashboard-v3.html`
> **구현 완료 후**: 위 HTML 파일을 브라우저로 열어 프로토타입과 나란히 비교 리뷰 — 누락된 인터랙션, 디자인 차이 확인 후 보완

---

## 요구사항 요약

- **대상 사용자**: Manager / Admin 전용 (User 접근 불가)
- **목적**: 운영 현황 요약 + 트렌드 분석 복합 대시보드
- **진입점**: Sidebar Nav — 담당 VOC 아래, 시스템 트리 위
- **날짜 필터**: 상단 우측, 7일/30일/90일/커스텀 (기본: 30일)

---

## 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: 대시보드 | [메뉴: 전체 ▾*] [담당자: 전체 ▾] [날짜] [⚙️] │
│ * 시스템 탭 선택 시에만 표시                                          │
├─────────────────────────────────────────────────────────────────────┤
│ GlobalTabs: [전체] [채널 A] [채널 B] [채널 C] ... [더보기 ▾]        │
├─────────────────────────────────────────────────────────────────────┤
│ FilterContextBanner (필터 활성 시에만 표시):                          │
│ "채널 A › 메뉴 1 (홈) › 담당자: 김지훈 기준"                         │
├──────────────────────────────────────────────────────────────────── ┤
│  [Volume]                                                           │
│  총 VOC │ 미해결 │ 이번주 신규 │ 이번주 완료   (KPI 4종)              │
├─────────────────────────────────────────────────────────────────────┤
│  [Quality]                                                          │
│  평균처리시간 │ 해결율 │ Urgent·High 미해결 │ 14일+ 미처리  (KPI 4종) │
├──────────────────────────┬──────────────────────────────────────────┤
│  분포                     │  우선순위 × 상태 매트릭스                  │
│  [상태|우선순위|유형|태그]  │  4행(Urgent/High/Med/Low) × 5열(상태)   │
│  + dim: [전체|시스템별*|메뉴별]│ + dim: [전체|시스템별*|메뉴별]         │
├──────────────────────────┴──────────────────────────────────────────┤
│  드릴다운 히트맵                                                      │
│  브레드크럼: 전체 › 채널 A › 메뉴 1 (홈)                              │
│  X축: [진행 현황 | 우선순위별 | 태그별]  (고정 테이블 레이아웃)          │
│  Y축: 합계 행 + 각 시스템/메뉴/단일 메뉴 행                            │
├──────────────────────────┬──────────────────────────────────────────┤
│  주간 트렌드 (12주)        │  태그별 분포 (Top 10)                     │
│  3선: 신규/진행중/완료     │  가로 바 차트                             │
│  + dim: [전체|시스템별*|메뉴별]│ + dim: [전체|시스템별*|메뉴별]         │
├──────────────────────────┴──────────────────────────────────────────┤
│  시스템/메뉴 현황 카드                                                 │
│  전체 탭: "시스템 현황"  /  시스템 탭: "메뉴 현황 (채널 A)"            │
├─────────────────────────────────────────────────────────────────────┤
│  담당자별 처리 현황                                                    │
│  X축: [진행 현황 | 우선순위별 | 태그별]  (히트맵과 독립 선택)            │
│  Y축: 담당자 목록 + 미배정 (담당자 필터 적용 시 해당 행 하이라이트)       │
├─────────────────────────────────────────────────────────────────────┤
│  장기 미처리 VOC Top 10                                               │
│  dim: [전체 | 시스템별*] (전체 탭) / [전체 | 메뉴별] (시스템 탭)       │
└─────────────────────────────────────────────────────────────────────┘
* 시스템 탭에서 "시스템별" 버튼은 숨김 (의미 없음)
```

---

## 글로벌 필터 시스템

대시보드 전체 scope를 제어하는 2종류의 독립 필터.

### A. 계층형 탭 필터 (전체 → 시스템 → 메뉴)

#### GlobalTabs Overflow 처리
- 탭이 화면 너비를 초과할 경우 우측에 `더보기 ▾` 드롭다운으로 병합
- Admin 설정에서 탭 **순서·표시·숨김** 관리 가능 (`dashboard_settings` — 시스템 목록 항목을 순서+표시여부 포함으로 확장)
- `더보기` 안에 있는 탭이 활성(active)인 경우 `더보기` 버튼 자체를 활성 스타일로 표시

#### 레벨 1 — 전체 탭 (기본)
- GlobalTabs에서 `[전체]` 선택 상태
- 모든 시스템의 집계 데이터 표시
- 각 위젯 dim 셀렉터: `[전체 | 시스템별 | 메뉴별]` 전부 활성
- 헤더 메뉴 드롭다운: **숨김**
- 장기 미처리 dim: `[전체 | 시스템별]`
- 히트맵 Y축: 합계 행(`전체`) + 각 시스템 행 (클릭 가능, 레벨 2로 이동)
- 시스템/메뉴 현황 섹션 타이틀: **"시스템 현황"**

#### 레벨 2 — 시스템 탭 (채널 A 등)
- GlobalTabs에서 특정 시스템 탭 클릭
- 해당 시스템 데이터만 표시 (전체 위젯 적용)
- 각 위젯 dim 셀렉터에서 `[시스템별]` 버튼 **숨김**, `[전체 | 메뉴별]`만 표시
- 헤더 메뉴 드롭다운 **표시**: `메뉴: 전체 ▾` (선택 시 레벨 3으로 진입)
- 장기 미처리 dim: `[전체 | 메뉴별]`로 버튼 텍스트 변경
- 히트맵 Y축: 합계 행(`채널 A 전체`) + 해당 시스템의 메뉴 행 (클릭 불가)
- 시스템/메뉴 현황 섹션 타이틀: **"메뉴 현황 (채널 A)"** (메뉴 카드 목록)

#### 레벨 3 — 메뉴 탭 (시스템 탭 + 메뉴 선택)
- 헤더 메뉴 드롭다운에서 특정 메뉴 선택
- 해당 메뉴 데이터만 표시 (전체 위젯 적용)
- 각 위젯 dim 셀렉터: `[전체]` 단일만 표시 (이미 메뉴 1개 scope이므로 `메뉴별` dim 무의미)
- 히트맵 Y축: **단일 행** (해당 메뉴만, 합계 행 없음)
  - **[구현 주의]** 메뉴 탭 히트맵은 단일 행만 표시. 향후 추가 드릴다운 또는 태그 레벨 확장 가능성 있음. 이 동작을 별도 플래그(`MENU_HEATMAP_SINGLE_ROW`)로 분리하여 쉽게 수정 가능하도록 구현할 것.
- 브레드크럼: `전체 › 채널 A › 메뉴 1 (홈)` (각 세그먼트 클릭 가능)

#### 탭 전환 시 초기화 규칙
- 상위 탭으로 이동 시: 하위 레벨 선택 초기화
  - 전체 탭 클릭 → activeSystem, activeMenu 초기화, 메뉴 드롭다운 리셋
  - 시스템 탭 클릭 → activeMenu 초기화, 메뉴 드롭다운 리셋
- 시스템 탭 전환 시: 메뉴 드롭다운에 해당 시스템의 메뉴 목록 동적 채우기

### B. 담당자 필터 (직교 필터)

- 위치: 헤더 우측, 항상 표시 (`담당자: 전체 ▾`)
- **선택 방식**: 단일 선택 (라디오) — 한 번에 한 명만 선택 가능, `전체` 선택 시 필터 해제
- 계층형 필터(전체/시스템/메뉴)와 독립적으로 중첩 적용
- 선택 시: 전체 위젯 데이터를 해당 담당자 기준으로 필터링
- 담당자별 처리 현황 위젯: 선택된 담당자 행만 표시(+미배정) + 행 하이라이트
- Filter Context Banner에 함께 표시

### C. Filter Context Banner

- 위치: GlobalTabs 아래, 대시보드 본문 위
- 표시 조건: 전체 탭 + 담당자 전체 = 기본값 → **숨김** / 그 외 → **표시**
- 내용: `채널 A › 메뉴 1 (홈) › 담당자: 김지훈 기준`
  - 구분자 `›` 사용
  - 담당자 없으면 담당자 파트 생략
- 스타일: `var(--brand-bg)` 배경, `var(--brand)` 텍스트, 하단 `var(--brand-border)` 보더

---

## 위젯 상세 명세

### 1. KPI 카드 (8개, 2줄)

#### 글로벌 필터 적용 동작
- **전체 탭**: 전체 시스템 집계
- **시스템 탭**: 해당 시스템 데이터 기준
- **메뉴 탭**: 해당 메뉴 데이터 기준
- **담당자 필터**: 해당 담당자가 처리한/담당한 VOC 기준
- 담당자 필터 적용 시 KPI 8종 그대로 유지 — 해당 담당자 scope로 필터링하여 표시.

#### 날짜 의존성 분류

| 그룹 | 카드 | 날짜 필터 적용 |
|------|------|--------------|
| **현재 상태** | 미해결 / Urgent·High 미해결 / 14일+ 미처리 | 무관 (현재 시점 스냅샷) |
| **기간 연동** | 총 VOC / 평균 처리시간 / 해결율 | 선택 날짜 범위 적용 |
| **이번주 고정** | 이번주 신규 / 이번주 완료 | 현재 캘린더 주 (월~일) 고정 |

**VOLUME 줄**

| 카드 | 날짜 그룹 | 값 | 증감 기준 | 비고 |
|------|----------|-----|----------|------|
| 총 VOC | 기간 연동 | 선택 기간 내 생성 건수 | 전주 동기간 대비 % | |
| 미해결 | 현재 상태 | 완료/보류 제외 건수 | 전주 동시점 대비 % | |
| 이번주 신규 | 이번주 고정 | 이번 주 생성 건수 | 전주 전체 대비 % | 서브레이블: N일차 |
| 이번주 완료 | 이번주 고정 | 이번 주 완료 건수 | 전주 전체 대비 % | 서브레이블: N일차 |

**QUALITY 줄**

| 카드 | 날짜 그룹 | 값 | 증감 기준 | 비고 |
|------|----------|-----|----------|------|
| 평균 처리시간 | 기간 연동 | 완료 VOC 기준 일수 | 전주 동기간 대비 일수 차이 | 감소가 긍정 → 색상 반전 |
| 해결율 | 기간 연동 | 완료/(완료+미해결) | 전주 동기간 대비 %p | |
| Urgent·High 미해결 | 현재 상태 | priority=urgent OR high AND 미완료 | 전주 동시점 대비 건수 | 증가 시 red 강조 보더 |
| 14일+ 미처리 | 현재 상태 | created_at ≤ 오늘-14일 AND 미완료 | 전주 동시점 대비 건수 | 증가 시 amber 강조 보더 |

**카드 클릭 동작**: 카드 클릭 → 해당 필터 조건으로 VOC 목록 페이지 이동
(현재 글로벌 필터 `systemId`, `menuId`, `assigneeId`는 모든 카드에 공통 추가)

| 카드 | VOC 목록 이동 파라미터 |
|------|----------------------|
| 총 VOC | `?startDate=&endDate=` |
| 미해결 | `?status=접수됨,검토중,처리중` |
| 이번주 신규 | `?startDate=이번주월요일&endDate=오늘` |
| 이번주 완료 | `?startDate=이번주월요일&endDate=오늘&status=완료` |
| 평균 처리시간 | `?startDate=&endDate=&status=완료` |
| 해결율 | `?startDate=&endDate=` |
| Urgent·High 미해결 | `?priority=urgent,high&status=접수됨,검토중,처리중` |
| 14일+ 미처리 | `?status=접수됨,검토중,처리중&createdBefore=오늘-14일` |

**디자인**
- 배경: `var(--bg-surface)`, 보더: `1px solid var(--border-subtle)`
- VOLUME/QUALITY 섹션 레이블: `var(--text-quaternary)`, `11px; font-weight:600; letter-spacing:0.07em; uppercase`
- Urgent·High 강조 보더: `oklch(58% 0.22 25 / 0.35)`
- 14일+ 강조 보더: `oklch(70% 0.16 72 / 0.30)`
- 증감 양수: `oklch(62% 0.19 158)`, 음수: `oklch(58% 0.22 25)`, 처리시간은 반전

---

### 2. 분포 탭 섹션

#### 탭 4종 (v3 추가: 태그 탭)
```
[상태] [우선순위] [유형] [태그]   ← 탭 전환, 동일 영역
```

#### Dim 셀렉터
```
[전체] [시스템별*] [메뉴별]
* 시스템 탭에서 숨김
```
- `전체`: 현재 글로벌 필터 scope 내 전체 집계
- `시스템별`: 시스템별로 분류 (전체 탭에서만 유효)
- `메뉴별`: 메뉴별로 분류

#### 각 탭 레이아웃
```
[도넛 차트 96×96]  [레전드 목록: 색상 점 · 항목명 · 건수 · % · 미니 바]
```
- 도넛: `conic-gradient` 방식, 가운데 총 건수 + "총건수" 레이블
- 레전드 항목 클릭 → 해당 필터로 VOC 목록 이동
  - 상태 탭: `?status=접수됨` (해당 상태값)
  - 우선순위 탭: `?priority=urgent` (해당 우선순위값)
  - 유형 탭: `?vocType=X`
  - 태그 탭: `?tag=X`
  - + 현재 글로벌 필터 공통 추가

#### 상태 탭 (design.md §3 Status Colors 준수)
| 상태 | 색상 |
|------|------|
| 접수됨 | `var(--text-quaternary)` |
| 검토중 | `oklch(67% 0.17 240)` (dark) |
| 처리중 | `oklch(55% 0.17 150)` (dark) |
| 완료 | `oklch(62% 0.19 158)` (dark) |
| 보류 | `oklch(70% 0.16 72)` (dark) |

#### 우선순위 탭
| 우선순위 | 색상 |
|----------|------|
| Urgent | `oklch(58% 0.22 25)` |
| High | `oklch(60% 0.18 45)` |
| Medium | `var(--text-tertiary)` |
| Low | `var(--text-quaternary)` |

#### 유형 탭
- `voc_types.color` 값 사용

#### 태그 탭 (v3 신규)
- Top 6 태그 + "기타" 집계
- 색상: `var(--chart-blue)`, `var(--chart-sky)`, `var(--chart-red)`, `var(--chart-amber)`, `var(--chart-emerald)`, `var(--text-tertiary)` 순으로 할당
- 항목 클릭 → 해당 태그 필터로 VOC 목록 이동

---

### 3. 우선순위 × 상태 매트릭스

#### Dim 셀렉터
```
[전체] [시스템별*] [메뉴별]
* 시스템 탭에서 숨김
```

#### 구조
- 행: Urgent / High / Medium / Low
- 열: 접수됨 / 검토중 / 처리중 / 완료 / 보류

#### 셀 동작
- 셀 값: 해당 우선순위+상태 조합의 건수
- 셀 배경: 전체 셀 최대값 기준 `oklch(63% 0.19 258 / 0.05~0.65)` 선형 보간
- 셀 클릭 → `?priority=urgent&status=접수됨` 형태로 VOC 목록 이동
- 빈 셀(0건): `var(--bg-elevated)` + `—`, 클릭 불가

---

### 4. 드릴다운 히트맵 (v3 전면 개편)

#### X축 셀렉터 (위젯 우측 상단, btn-group 스타일)
```
[진행 현황] [우선순위별] [태그별]
```

| X축 옵션 | 열 구성 |
|---------|---------|
| 진행 현황 | 접수됨 / 검토중 / 처리중 / 완료 / 보류 (5열) |
| 우선순위별 | Urgent / High / Medium / Low (4열) |
| 태그별 | Top 5 태그 (5열) — 해당 scope 내 상위 5개 |

**크기 고정**: `table-layout: fixed`, `colgroup`으로 Y축 레이블 열 130px 고정, 나머지 데이터 열 균등 분배. X축 전환 시 테이블 너비/높이 변화 없음.

#### Y축 구조 (글로벌 탭에 연동)

**전체 탭 (레벨 1)**
```
합계 행: [전체        | 합계값1 | 합계값2 | ... | 총합계]  ← 볼드, bg-elevated
데이터: [▶ 채널 A     | v1 | v2 | ... | 소계]  ← 클릭 → 채널 A 탭으로 이동
        [▶ 채널 B     | v1 | v2 | ... | 소계]
        ...
```
- 합계 행: 전체 시스템 합산, 항상 최상단
- 시스템 행: `▶` 아이콘 + 클릭 가능, 클릭 시 해당 시스템 GlobalTab으로 전환

**시스템 탭, 메뉴 미선택 (레벨 2)**
```
합계 행: [채널 A 전체  | 합계값1 | 합계값2 | ... | 총합계]  ← 볼드, bg-elevated
데이터: [메뉴 1 (홈)   | v1 | v2 | ... | 소계]  ← 클릭 불가
        [메뉴 2 (검색) | v1 | v2 | ... | 소계]
        ...
```
- 합계 행: 해당 시스템 메뉴 전체 합산
- 메뉴 행: 클릭 불가 (메뉴 선택은 헤더 드롭다운에서만)

**시스템 탭, 메뉴 선택 (레벨 3)**
```
[메뉴 1 (홈) | v1 | v2 | ... | 소계]  ← 단일 행, 합계 행 없음
```
- [구현 주의] 단일 행 표시 동작은 향후 변경 가능. `MENU_HEATMAP_SINGLE_ROW` 플래그로 분리.

#### 브레드크럼 (위젯 좌측 상단, 히트맵 타이틀 우측)

| 상태 | 브레드크럼 표시 |
|------|----------------|
| 전체 탭 | `전체` (클릭 불가) |
| 시스템 탭 (채널 A) | `전체 ›` (클릭 → 전체 탭) + `채널 A` |
| 메뉴 탭 (채널 A > 메뉴 1) | `전체 ›` + `채널 A ›` (클릭 → 채널 A 탭, 메뉴 초기화) + `메뉴 1 (홈)` |

- `›` 구분자
- 클릭 가능한 세그먼트: hover 시 `var(--brand)` 색상

#### 셀 동작
- 값이 있는 셀 클릭 → VOC 목록 이동, 파라미터:
  - X축=진행현황: `?systemId=&menuId=&status=접수됨` (해당 상태값)
  - X축=우선순위별: `?systemId=&menuId=&priority=urgent` (해당 우선순위값)
  - X축=태그별: `?systemId=&menuId=&tag=X`
  - + 현재 글로벌 필터(`assigneeId`) 공통 추가
- 빈 셀(0건): `var(--bg-elevated)` + `—`, 클릭 불가
- 색상 강도: 현재 뷰 내 최대값 기준 `oklch(63% 0.19 258 / 0.06~0.62)` 선형 보간

#### 빈 상태
- 데이터 없음: 위젯 중앙 "해당 기간 데이터 없음" 안내

---

### 5. 주간 트렌드 (v3 변경: 3선)

#### 3선 구성

| 선 | 정의 | 계산 기준 | 색상 |
|----|------|----------|------|
| 신규(접수) | 해당 주에 생성된 VOC 수 | `created_at` 기준 | `var(--chart-blue)` |
| 진행중(검토+처리) | 해당 주 일요일 23:59 스냅샷 기준 검토중+처리중 상태 VOC 수 | 주말 스냅샷 | `var(--chart-sky)` |
| 완료(완료+보류) | 해당 주에 완료 또는 보류 상태로 전환된 VOC 수 | `status_changed_at` 기준 | `var(--chart-emerald)` |

> 세 선은 계산 기준이 다르므로 합산해도 총 VOC 수와 일치하지 않음 — 의도된 동작.

#### 기타
- 기간: 최근 12주 고정 (커스텀 날짜 필터와 무관)
- X축 레이블: W1~W12 (W1=12주 전, W12=이번 주, **좌→우 = 과거→현재**)
- 레전드: 차트 상단 좌측 (색상 선 + 레이블)

#### 포인트 클릭 동작
- 각 주 데이터 포인트 클릭 → VOC 목록 이동
  - 신규 선: `?startDate=해당주월요일&endDate=해당주일요일` (+ 글로벌 필터)
  - 진행중 선: `?status=검토중,처리중&snapshotDate=해당주일요일` (+ 글로벌 필터)
  - 완료 선: `?status=완료,보류&startDate=해당주월요일&endDate=해당주일요일` (+ 글로벌 필터)

#### Dim 셀렉터
```
[전체] [시스템별*] [메뉴별]
* 시스템 탭에서 숨김
```

---

### 6. 태그별 분포 (Top 10)

- 가로 바 차트, 건수 내림차순 10개
- 단일 색상: `var(--chart-blue)`
- 항목 클릭 → `?tag=X` (+ 현재 글로벌 필터 공통 추가) 로 VOC 목록 이동

#### Dim 셀렉터
```
[전체] [시스템별*] [메뉴별]
* 시스템 탭에서 숨김
```

---

### 7. 시스템/메뉴 현황 카드 (v3 변경: 타이틀+내용 연동)

| 글로벌 탭 | 섹션 타이틀 | 카드 내용 |
|----------|------------|----------|
| 전체 탭 | "시스템 현황" | 각 시스템 카드 (시스템명, 전체 건수, 미해결 건수) |
| 시스템 탭 | "메뉴 현황 (채널 A)" | 해당 시스템의 메뉴 카드 (메뉴명, 전체 건수, 미해결 건수) |
| 메뉴 탭 | "메뉴 현황 (채널 A)" | 해당 시스템의 모든 메뉴 카드 + **선택된 메뉴 카드 하이라이트** (`2px solid var(--brand)`) |

- 전체 탭: 최대 8개 + "더보기" 카드 (대시 보더, 투명 배경)
  - "더보기" 클릭: 나머지 카드 **인라인 확장** (토글), 확장 후 "접기" 버튼으로 복귀
- 시스템 탭: 해당 시스템의 모든 메뉴 카드 표시
- 메뉴 탭: 해당 시스템의 모든 메뉴 카드 표시 + 선택된 메뉴 카드 하이라이트 (다른 메뉴 카드 클릭 시 해당 메뉴로 전환)
- 카드 클릭: 전체 탭에서 시스템 카드 클릭 → 해당 시스템 탭으로 이동 / 시스템 탭에서 메뉴 카드 클릭 → 해당 메뉴 탭으로 이동

---

### 8. 담당자별 처리 현황 (v3 신규 위젯)

#### X축 셀렉터 (히트맵과 독립 선택)
```
[진행 현황] [우선순위별] [태그별]
```

| X축 옵션 | 열 구성 |
|---------|---------|
| 진행 현황 | 접수됨 / 검토중 / 처리중 / 완료 / 보류 + 합계 |
| 우선순위별 | Urgent / High / Medium / Low + 합계 |
| 태그별 | Top 5 태그 + 합계 |

#### Y축 구조
- 담당자 목록 (이름순 정렬)
- `미배정` 행: 항상 마지막, 이탤릭체 + `var(--text-quaternary)` 색상

#### 담당자 필터 적용 시 동작
- 담당자 필터로 특정 인원 선택: 해당 행만 표시 + `미배정` 행 유지
- 선택된 행: `var(--brand-bg)` 배경 + `2px solid var(--brand)` outline 하이라이트

#### 셀 동작
- 값이 있는 셀 클릭 → VOC 목록 이동, 파라미터:
  - X축=진행현황: `?assigneeId=X&status=접수됨` (해당 상태값)
  - X축=우선순위별: `?assigneeId=X&priority=urgent` (해당 우선순위값)
  - X축=태그별: `?assigneeId=X&tag=Y`
  - 미배정 행: `assigneeId=unassigned`
  - + 현재 글로벌 필터(`systemId`, `menuId`) 공통 추가
- 색상 강도: 현재 테이블 내 최대값 기준 `oklch(63% 0.19 258 / 0.06~0.62)`
- 빈 셀(0건): `var(--bg-elevated)` + `—`, 클릭 불가

---

### 9. 장기 미처리 VOC Top 10 (v3 변경: 탭별 dim 전환)

#### Dim 셀렉터 (탭별 동적 변경)

| 글로벌 탭 | 셀렉터 구성 | 동작 |
|----------|-----------|------|
| 전체 탭 | `[전체] [시스템별]` | 시스템별: 시스템 컬럼 표시 |
| 시스템 탭 | `[전체] [메뉴별]` | 메뉴별: 컬럼 "시스템" → "메뉴"로 변경 |

- dim 버튼 텍스트는 JS로 동적 변경 (`시스템별` ↔ `메뉴별`)
- 전체 탭 + 시스템별 active: 시스템 컬럼 표시
- 시스템 탭 + 메뉴별 active: 메뉴 컬럼 표시 (해당 시스템 내 메뉴별 미처리 Top 10)

#### 테이블 구조
| 열 | 내용 |
|----|------|
| Issue | issue_code (D2Coding 폰트) |
| 제목 | VOC 제목 (max-width 말줄임) |
| 시스템/메뉴 | dim 선택에 따라 변경 |
| 우선순위 | Urgent/High/Medium badge |
| 경과일 | 14~29일 amber badge, 30일+ red badge |

- 정렬: 경과일 내림차순 (가장 오래된 것 상단)
- 행 클릭 → VOC Drawer 열기
- 장기 미처리는 시스템 탭에서 `메뉴별` 차원만 제공. `시스템별` 차원은 레벨 2 이하에서 의미 없으므로 제공하지 않음 (전체 탭에서만 시스템별).

---

## API 엔드포인트 (v3 업데이트)

모든 엔드포인트에 글로벌 필터 파라미터 추가:

```
공통 파라미터:
  startDate, endDate    — 날짜 범위 (기간 연동 엔드포인트)
  systemId              — 시스템 탭 활성 시 (optional)
  menuId                — 메뉴 탭 활성 시 (optional)
  assigneeId            — 담당자 필터 활성 시 (optional)
```

| 엔드포인트 | 용도 | 날짜 파라미터 |
|-----------|------|-------------|
| `GET /api/dashboard/summary` | KPI 8종 + 전주 대비 | 기간 연동 포함 |
| `GET /api/dashboard/distribution?type=status\|priority\|voc_type\|tag` | 분포 탭 (태그 추가) | 기간 연동 |
| `GET /api/dashboard/priority-status-matrix` | 매트릭스 | 기간 연동 |
| `GET /api/dashboard/heatmap?xAxis=status\|priority\|tag` | 히트맵 (xAxis 파라미터 추가) | 기간 연동 |
| `GET /api/dashboard/weekly-trend?weeks=12` | 주간 트렌드 3선 | 무관 (12주 고정) |
| `GET /api/dashboard/tag-distribution?limit=10` | 태그별 분포 | 기간 연동 |
| `GET /api/dashboard/system-overview` | 시스템/메뉴 카드 | 기간 연동 |
| `GET /api/dashboard/assignee-stats?xAxis=status\|priority\|tag` | 담당자별 처리 현황 | 기간 연동 |
| `GET /api/dashboard/aging-vocs?limit=10` | 장기 미처리 | 무관 |
| `GET /api/dashboard/settings` | 역할별 기본 설정 | — |
| `PUT /api/dashboard/settings` | 설정 저장 (Admin) | — |
| `GET /api/dashboard/menus?systemId=` | 시스템별 메뉴 목록 (드롭다운용) | — |
| `GET /api/dashboard/assignees` | 담당자 목록 (드롭다운용) | — |

### 히트맵 API 변경사항
```
GET /api/dashboard/heatmap
  ?xAxis=status|priority|tag    ← v3 신규: X축 종류
  &systemId=...                 ← 시스템 탭 시
  &menuId=...                   ← 메뉴 탭 시
  &assigneeId=...               ← 담당자 필터 시
  &startDate=...&endDate=...

응답:
  {
    headers: string[],          // X축 컬럼명
    totalRow: number[],         // 합계 행 값 (menuId 있으면 null)
    rows: [
      { name: string, values: number[], total: number }
    ]
  }
```

### 주간 트렌드 API 변경사항
```
응답 변경: created/resolved 2선 → 신규/진행중/완료 3선

{
  weeks: string[],             // ['W1', ..., 'W12']
  series: {
    new:        number[],      // 해당 주 신규 접수
    inProgress: number[],      // 해당 주 검토중+처리중 전환
    done:       number[]       // 해당 주 완료+보류 전환
  }
}
```

---

## 프론트엔드 상태 관리

### 대시보드 전역 필터 상태
```typescript
interface DashboardFilterState {
  // 날짜
  dateRange: { startDate: string; endDate: string };
  datePreset: '7d' | '30d' | '90d' | 'custom';

  // 글로벌 탭 (계층형) — systemId 단일 값으로 관리 (activeSystem 별도 불필요)
  globalTab: 'all' | string;   // 'all' | systemId('A', 'B', ...)
  activeMenu: string | null;   // menuId | null

  // 담당자 (직교 필터, 단일 선택)
  activeAssignee: string | null; // userId | null
}
```
> `globalTab`이 `'all'`이면 레벨 1, systemId이면 레벨 2, systemId + `activeMenu`가 있으면 레벨 3.

### 히트맵 로컬 상태
```typescript
interface HeatmapState {
  xAxis: 'status' | 'priority' | 'tag';
}
// Y축(드릴다운)은 DashboardFilterState의 globalTab/activeMenu와 연동 — 별도 상태 없음
```

### 담당자별 처리현황 로컬 상태
```typescript
interface AssigneeTableState {
  xAxis: 'status' | 'priority' | 'tag';  // 히트맵과 독립
}
```

---

## 수용 기준 (v3 업데이트)

- [ ] Manager/Admin 계정으로 로그인 시 사이드바에 'Dashboard' 메뉴가 보인다
- [ ] User 계정으로 로그인 시 Dashboard 메뉴가 없고 URL 직접 접근 시 403 + 홈 리다이렉트
- [ ] 전체 탭 기본 뷰: KPI 8종, 분포(4탭), 매트릭스, 히트맵, 주간 트렌드(3선), 태그 바, 시스템 카드, 담당자 테이블, 장기 미처리 표시
- [ ] GlobalTab 전환 시 모든 위젯 데이터가 해당 scope로 갱신됨
- [ ] 시스템 탭 선택 시 헤더에 메뉴 드롭다운이 나타남
- [ ] 메뉴 드롭다운에서 메뉴 선택 시 Filter Context Banner가 표시되고 히트맵이 단일 행으로 변경됨
- [ ] 담당자 드롭다운 선택 시 Filter Context Banner에 담당자 정보가 표시됨
- [ ] 담당자 선택 시 담당자별 처리현황 테이블이 해당 인원 행 하이라이트 + 미배정 행 유지
- [ ] 분포 섹션 탭: 상태/우선순위/유형/태그 4종 전환 동작
- [ ] 히트맵 X축 전환 ([진행현황|우선순위별|태그별]) 시 테이블 크기 변화 없음
- [ ] 히트맵 합계 행이 모든 레벨(전체/시스템/메뉴) 최상단에 표시됨
- [ ] 전체 탭 히트맵에서 시스템 행 클릭 시 해당 시스템 탭으로 전환
- [ ] 히트맵 브레드크럼 각 세그먼트 클릭 시 해당 레벨로 복귀
- [ ] 주간 트렌드: 신규(파란)/진행중(sky)/완료(에메랄드) 3선 표시
- [ ] 시스템 탭에서 카드 섹션 타이틀이 "메뉴 현황 (채널 X)"으로 변경되고 메뉴 카드 표시
- [ ] 장기 미처리 dim: 전체 탭에서 [전체|시스템별], 시스템 탭에서 [전체|메뉴별]
- [ ] 매트릭스 셀 클릭 → VOC 목록 이동 (priority+status 필터 적용)
- [ ] 히트맵 셀 클릭 → VOC 목록 이동 (시스템/메뉴 + X축 필터 적용)
- [ ] 분포 레전드 클릭 → VOC 목록 이동
- [ ] 장기 미처리 행 클릭 → VOC Drawer
- [ ] 페이지 최초 로드 3초 이내 (LCP 기준, 로컬 네트워크, DB 10만 건 이하)

---

## 커스터마이징

### Admin 역할별 기본값 (persistent)

```sql
dashboard_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          ENUM('admin','manager') NOT NULL,
  setting_key   VARCHAR(64) NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role, setting_key)
)
```

설정 항목: 기본 날짜 범위, 히트맵 기본 X축, 표시 시스템 목록, 표시 태그 목록

### ⚙️ 세션 임시 설정 (sessionStorage)

- 슬라이드오버 패널, 동일 항목 오버라이드
- sessionStorage 저장, 탭 닫으면 초기화
- "기본값으로 초기화" 버튼 제공

---

## 구현 단계

### Phase 1 — 백엔드 API

- `GET /api/dashboard/*` 엔드포인트 전체 (위 표 참고)
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
- `requirements.md` §11 대시보드 섹션
- `design.md` 대시보드 컴포넌트 스펙
