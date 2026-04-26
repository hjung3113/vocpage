# Phase 7 — 프로토타입/디자인 갭 종합 리뷰 (2026-04-26)

## §1. 리뷰 개요

### 목적

Phase 7 (관리자/공지/FAQ/알림 + 5-Expert HIGH 결함 수정) 완료 시점 기준으로, 프로토타입(`prototype/`) 및 `docs/specs/requires/design.md` · `requirements.md` 와 실제 구현(`frontend/src/`) 사이의 갭을 5개 조사 영역으로 나누어 식별한다.

### 조사 범위

- **A1**: AppShell / Sidebar / 전역 레이아웃 구조
- **A2**: VOC 목록 페이지 (테이블/필터/정렬)
- **A3**: 대시보드 (KPI/탭/필터/차트)
- **A4**: design.md 토큰 준수 여부 (hex/rgba/font 하드코딩)
- **A5**: 공지/FAQ/Admin/알림/서브태스크 기능 구현률

### 결론 요약

- 가장 심각한 갭은 **AppShell/Sidebar 구조 자체의 부재** — 현재 RootLayout은 `<Outlet />`만 반환하여 프로토타입의 좌측 222px 사이드바 + main 레이아웃이 전혀 적용되지 않음. 이는 모든 페이지의 시각적 정합성에 영향을 미치는 **CRITICAL** 이슈.
- 두 번째로 심각한 갭은 **Sub-task / VOC Drawer / Internal Notes UI 전체 미구현** — 컴포넌트 파일이 0개로, 스펙 핵심 기능이 누락됨.
- 대시보드는 KPI 카드 라벨이 스펙과 다르며, GlobalTabs/FilterContextBanner/도넛차트 등 채널 탭 기반 위젯 시스템이 통째로 빠져있음.
- VOC 목록은 담당자 컬럼/정렬/Sub-task 아코디언이 없음.
- design.md 토큰 위반은 hex 1건, rgba 1건, font 하드코딩 10+건. 다만 색상 토큰은 대부분 올바르게 사용 중이며, 폰트 위반의 근본 원인은 `tokens.ts`에 `--font-ui` / `--font-code` 토큰이 정의되지 않은 것.

---

## §2. CRITICAL — 구조적 누락 (AppShell / Sidebar)

### C-1. AppShell 컨테이너 구조 부재

**현상**

- `frontend/src/components/layout/` 디렉토리 자체가 존재하지 않음.
- 현재 RootLayout은 `<Outlet />`만 렌더링.
- 프로토타입의 `.app-shell` (display: flex, sidebar + main 분할) 구조가 어디에도 적용되지 않음.

**영향 범위**

- 전체 페이지 (VOC 목록, 대시보드, 공지, FAQ, Admin, Profile 등) — 모든 라우트.

**관련 파일**

- `frontend/src/RootLayout.tsx` (혹은 동등 파일)
- `frontend/src/main.tsx` / 라우터 설정
- `prototype/index.html` (참조: `.app-shell`, `.main` 구조)

**수정 방향**

1. `frontend/src/components/layout/AppShell.tsx` 생성 — `display: flex; height: 100vh` 컨테이너.
2. `<Sidebar />` (좌측 222px 고정) + `<main className="main">` (`flex: 1; overflow: auto`) 구조로 RootLayout 재작성.
3. 라우터의 모든 페이지가 AppShell의 `<main>` 안쪽으로 들어가도록 트리 재구성.

---

### C-2. Sidebar 컴포넌트 전체 미구현

**현상**

- Sidebar 컴포넌트와 그 내부 구성요소(`SidebarLogo`, `SidebarSection`, `NavItem`, `NavBadge`, `SectionLabel`, `SidebarDivider`, `SidebarUser`)가 모두 미구현.
- 4개 섹션(보기/시스템/정보/관리자) + 사용자 영역 모두 누락.

**영향 범위**

- 전역 네비게이션 부재 → 사용자가 페이지 간 이동을 URL 직접 입력으로 해야 함.
- "시스템" 섹션의 동적 메뉴 트리 (DB 기반) 미연동.

**관련 파일 (생성 필요)**

- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/SidebarLogo.tsx`
- `frontend/src/components/layout/SidebarSection.tsx`
- `frontend/src/components/layout/NavItem.tsx`
- `frontend/src/components/layout/NavBadge.tsx`
- `frontend/src/components/layout/SidebarUser.tsx`

**스타일 규격 (design.md 기준)**

- 너비: 222px 고정
- 로고 섹션 높이: 56px
- Nav 항목 padding: `10px 12px`
- Section label: `font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-quaternary); padding: 16px 12px 6px`
- 섹션 간 gap: 최소 8px

**수정 방향**

1. 정적 섹션(보기/정보/관리자)은 라우트 상수로 하드코딩.
2. "시스템" 섹션은 `useSystemMenuTree()` 훅으로 DB에서 fetch (현재 admin에서 사용하는 시스템/메뉴 API 재활용).
3. NavItem active 상태는 `react-router-dom`의 `NavLink` 활용.
4. SidebarUser 영역은 현재 ProfilePage의 사용자 정보를 재활용.

---

### C-3. Sub-task / VOC Drawer / Internal Notes 전체 미구현

**현상**

- 관련 컴포넌트 파일 0개. 스펙 핵심 기능임에도 UI가 전혀 존재하지 않음.

**영향 범위**

- VOC 상세 화면 진입 자체가 불가 또는 매우 빈약 — 현재 `SubtaskSection.tsx`는 존재하나 드로어 외부에서 호출되는 구조.
- 사용자가 VOC 행을 클릭해도 상세를 슬라이드 패널로 열 수 없음.

**관련 파일 (생성 필요)**

- `frontend/src/components/voc/VocDrawer.tsx`
- `frontend/src/components/voc/InternalNotes.tsx`
- (기존) `SubtaskSection.tsx`를 드로어 내부에서 사용하도록 재배치

**수정 방향**

1. VocPage의 행 클릭 → 우측에서 슬라이드 인하는 `<VocDrawer voc={…}>` 오픈.
2. Drawer 내부 탭: 본문 / Sub-task / Internal Notes / 활동로그.
3. Internal Notes는 작성/수정/삭제 + 멘션 (스펙 §… 참조).

---

## §3. HIGH — 기능 미구현

### H-1. 대시보드 KPI 카드 라벨/구성 불일치

**현상**

| 구분    | 프로토타입/스펙                                           | 앱                                        |
| ------- | --------------------------------------------------------- | ----------------------------------------- |
| VOLUME  | 총VOC / 미해결 / 이번주 신규 / 이번주 완료                | 전체VOC / 미해결 / 완료 / 처리중          |
| QUALITY | 평균처리시간 / 해결율 / Urgent·High 미해결 / 14일+ 미처리 | 긴급 / 기한초과 / 평균처리일 / 이번주신규 |

추가로 증감 지표(▲/▼)와 강조 보더가 없음.

**관련 파일**

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/dashboard/KpiCard.tsx` (혹은 동등)
- `backend/.../dashboard` API — 추가 집계 필드 필요

**수정 방향**

1. 백엔드 집계 API에 `weekly_new`, `weekly_completed`, `avg_resolve_hours`, `resolve_rate`, `urgent_high_open`, `aged_14d_open`, `prev_period_*` (증감용) 필드 추가.
2. KpiCard에 `delta`, `deltaDirection` props 추가하여 ▲/▼ 표시.
3. 강조 보더는 `--border-strong` 또는 `--brand` 토큰으로.

---

### H-2. GlobalTabs (채널 탭) + FilterContextBanner 미렌더

**현상**

- `useDashboardFilter`에 `globalTab` 상태는 있으나 DashboardPage에서 GlobalTabs 컴포넌트가 렌더되지 않음.
- 활성 필터를 시각화하는 FilterContextBanner도 없음.

**관련 파일**

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/hooks/useDashboardFilter.ts`
- (생성) `frontend/src/components/dashboard/GlobalTabs.tsx`
- (생성) `frontend/src/components/dashboard/FilterContextBanner.tsx`

**수정 방향**

1. 채널 탭 = 시스템 단위 (`전체` + 시스템 N개). 선택 시 메뉴 드롭다운 노출.
2. 채널 탭 선택에 따라 dim 셀렉터 숨김/표시, 위젯 레이블 동적 변경.
3. FilterContextBanner는 `시스템: X · 메뉴: Y · 기간: 30일` 형식으로 활성 필터를 칩으로 렌더.

---

### H-3. 대시보드 도넛 차트 미구현

**현상**

- 시각화 자체가 미구현. 스펙은 도넛(상태 분포) + 막대(우선순위) 등 시각화를 요구.

**관련 파일**

- `frontend/src/components/dashboard/StatusDonut.tsx` (생성)
- 차트 라이브러리 선택 필요 (recharts 권장 — 번들 영향 검토)

---

### H-4. VOC 목록 — 담당자(Assignee) 컬럼 + Sub-task 아코디언 미구현

**현상**

- 프로토타입은 7열(체크박스/이슈ID/제목/상태/담당자/우선순위/등록일), 앱은 6열(상태/이슈코드/제목/우선순위/등록일/기한).
- 담당자 미니 아바타 + 이름 표시 없음.
- 부모 VOC 행에 expand-btn으로 sub-task를 계층 표시하는 아코디언 미구현.

**관련 파일**

- `frontend/src/pages/VocPage.tsx`
- `frontend/src/components/voc/VocRow.tsx`
- (생성) `frontend/src/components/voc/AssigneeCell.tsx`

**수정 방향**

1. 컬럼 구조를 프로토타입에 맞춰 재정의 (단, "기한" 컬럼이 의도적 추가인지 PM 확인).
2. AssigneeCell — 24px 아바타 + 이름. 미배정 시 placeholder.
3. VocRow에 `expanded` 상태 + sub-task fetch → 자식 행 렌더.

---

### H-5. VOC 목록 — 정렬 / 담당자 필터 / 태그 필터 호출 누락

**현상**

- 컬럼 헤더 클릭 정렬 없음 (스펙 `feature-voc.md §7`).
- `assignee_id` 파라미터는 API에 있으나 드롭다운 컨트롤 없음.
- `onTagChange` 콜백은 존재하지만 `VocPage.tsx`에서 호출하지 않음.

**관련 파일**

- `frontend/src/pages/VocPage.tsx`
- `frontend/src/components/voc/VocFilterBar.tsx`
- `frontend/src/components/voc/VocTable.tsx` (헤더 정렬)

---

### H-6. 공지 — 로그인 팝업 동작 미구현

**현상**

- `NoticePopup` 컴포넌트는 존재하나 2-panel 모달 + "오늘 하루 보지 않기" 동작 미구현.

**관련 파일**

- `frontend/src/components/notice/NoticePopup.tsx`
- LocalStorage 키: `notice:dismissedUntil:<noticeId>` (제안)

---

### H-7. 알림 패널 UI 미구현 (Urgent 배지 포함)

**현상**

- 폴링/ETag/`hasUrgentUnread` 플래그까지 모두 데이터 레이어에 구현됨.
- 그러나 알림 패널(드롭다운/사이드 패널) UI 컴포넌트 없음, Urgent 느낌표 배지 UI 없음.

**관련 파일**

- (생성) `frontend/src/components/notification/NotificationPanel.tsx` (현재 동명 파일 존재 — 검토 필요)
- (생성) `frontend/src/components/notification/UrgentBadge.tsx`

---

## §4. MEDIUM — 스펙 불일치 / 부분 구현

### M-1. Admin — 공지/FAQ 관리 탭 placeholder

**현상**

- AdminPage의 시스템/메뉴/유형/태그규칙/사용자/결과리뷰 탭은 구현됨.
- 공지사항 관리 / FAQ 관리 탭은 placeholder만 존재 — 등록/수정 폼 없음.

**관련 파일**

- `frontend/src/pages/AdminPage.tsx`
- (생성) `frontend/src/components/admin/NoticeAdminTab.tsx`
- (생성) `frontend/src/components/admin/FaqAdminTab.tsx`

---

### M-2. 대시보드 — 클릭 네비게이션 미연결

**스펙 명시 / 미구현**

1. KPI 카드 클릭 → VOC 목록 (해당 필터 적용 상태로) 이동
2. 차트 레전드 클릭 → VOC 목록 이동
3. 히트맵 브레드크럼 네비게이션
4. 세션설정 패널 (⚙️ 버튼)
5. 날짜 필터에 "커스텀" 옵션 (현재 7/30/90 만 존재)

**관련 파일**

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/hooks/useDashboardFilter.ts`

---

### M-3. VOC 목록 — 필터 탭 순서

**현상**

- 프로토타입: ... / 드랍 / 완료
- 앱: ... / 완료 / 드랍

**관련 파일**

- `frontend/src/components/voc/VocFilterBar.tsx`

**판정**

- 시각적/UX 일관성을 위해 프로토타입 순서로 수정 권장. (트레이드오프 없음 — 단순 순서 변경)

---

## §5. LOW — design.md 토큰 위반

### L-1. hex 값 위반 (1건)

| 위치                               | 현재                                                     | 권장                                                      |
| ---------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `frontend/src/styles/tokens.ts:16` | `defaultTypeColor: '#888888'` (eslint-disable 주석 있음) | `var(--text-tertiary)` 또는 새 토큰 `--type-default` 정의 |

---

### L-2. raw rgba 위반 (1건)

| 위치                                                             | 현재                                       | 권장                                                  |
| ---------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `frontend/src/components/notification/NotificationPanel.tsx:108` | `boxShadow: '0 4px 16px rgba(0,0,0,0.12)'` | `box-shadow: var(--shadow-elevated)` (토큰 신설 필요) |

---

### L-3. 폰트 하드코딩 위반 (10+건, 계통적)

**근본 원인**: `tokens.ts`에 `--font-ui` / `--font-code` 토큰이 정의되지 않음.

**위반 위치 (대표)**

- `AgingVocList.tsx:142` — `fontFamily: 'monospace'`
- `VocRow.tsx:37` — `fontFamily: 'D2Coding, monospace'`
- `SubtaskSection.tsx:147` — `fontFamily: 'D2Coding, monospace'`
- `AdminPage.tsx` — 8곳에서 `fontFamily: 'monospace'`

**수정 방향 (한 번에 끝내는 패치)**

1. `frontend/src/styles/tokens.ts` 및 `tokens.css`에 추가:
   ```
   --font-ui: 'Pretendard Variable', -apple-system, ...;
   --font-code: 'D2Coding', monospace;
   ```
2. 모든 위반 파일에서 `fontFamily: 'D2Coding, monospace'` → `fontFamily: 'var(--font-code)'`로 일괄 치환.
3. ESLint 룰에 `no-restricted-syntax`로 `fontFamily:` 리터럴 차단 추가.

---

## §6. 구현 순서 권장안 (Phase 7 잔여 → Phase 8)

> 의존성 / 시각적 임팩트 / 변경 범위를 고려한 권장 순서. 각 단계는 별도 PR로 분리.

### Step 1 — 토큰 보강 (반나절, LOW를 Step 1로 두는 이유: 후속 컴포넌트가 토큰 사용)

- L-3 폰트 토큰 신설 + 일괄 치환
- L-1 `#888888` 제거
- L-2 shadow 토큰 신설

### Step 2 — AppShell + Sidebar 골격 (CRITICAL, 1~2일)

- C-1 AppShell 컨테이너
- C-2 Sidebar 골격 (정적 섹션 먼저, 동적 시스템 섹션은 Step 5에서)
- 모든 페이지를 AppShell 하위로 이동
- **검증**: 모든 라우트에서 좌측 222px 사이드바가 보이는지

### Step 3 — VOC 목록 정렬 (HIGH, 0.5일)

- H-5 컬럼 헤더 정렬, 담당자 필터 드롭다운, 태그 필터 콜백 연결
- M-3 필터 탭 순서 정정

### Step 4 — VOC Drawer + Sub-task UI (CRITICAL, 2일)

- C-3 VocDrawer 골격
- SubtaskSection을 드로어 내부로 이동
- InternalNotes 컴포넌트 신규
- H-4의 행 expand-btn은 드로어로 갈음할 것인지 PM 결정 필요

### Step 5 — Sidebar 동적 메뉴 + 사용자 영역 (HIGH, 0.5일)

- C-2의 "시스템" 섹션을 useSystemMenuTree로 동적 렌더
- SidebarUser 컴포넌트

### Step 6 — 대시보드 재구성 (HIGH, 2~3일)

- H-1 KPI 카드 라벨/구성 정정 + 백엔드 집계 필드 추가
- H-2 GlobalTabs + FilterContextBanner
- H-3 도넛/막대 차트
- M-2 클릭 네비게이션

### Step 7 — 공지/FAQ Admin + 로그인 팝업 (MEDIUM, 1~2일)

- M-1 NoticeAdminTab / FaqAdminTab
- H-6 NoticePopup 2-panel + dismiss 동작

### Step 8 — 알림 패널 UI (HIGH, 1일)

- H-7 NotificationPanel + UrgentBadge

### 총 예상 소요

- Phase 7 잔여 (Step 1~3): 약 2~3일
- Phase 8 본 영역 (Step 4~8): 약 7~9일

### 주의사항

- 각 Step은 머지 전 `prototype/`과 시각 비교 (visual-verdict 권장).
- 각 Step 완료 시 `claude-progress.txt` 갱신 + 별도 커밋.
- 백엔드 변경이 있는 Step (H-1, M-1)은 BE/FE 분리 PR 권장.

---

**작성**: 2026-04-26 — 5개 조사 에이전트 결과 종합
**다음 액션**: 사용자 승인 후 Step 1 (토큰 보강) 착수
