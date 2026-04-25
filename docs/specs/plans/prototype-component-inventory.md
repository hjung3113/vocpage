# Prototype → React 컴포넌트 인벤토리

> 작성일: 2026-04-25 (R-6 / Phase 7-0)
> 기준: `prototype/prototype.html` (최종 확정 디자인)
> 목적: 프로토타입 섹션별 HTML 구조·CSS 클래스 → React 컴포넌트 1:1 매핑 기준 제공

---

## 1. 레이아웃 셸

| 프로토타입 요소           | React 컴포넌트 | 경로                                    |
| ------------------------- | -------------- | --------------------------------------- |
| `<div class="app-shell">` | `AppShell`     | `src/components/layout/AppShell.tsx`    |
| `<div class="sidebar">`   | `Sidebar`      | `src/components/layout/Sidebar.tsx`     |
| `<main>`                  | `MainContent`  | `src/components/layout/MainContent.tsx` |

### 1-1. Sidebar 내부 구조

| 프로토타입 요소                       | 설명                             | 컴포넌트            |
| ------------------------------------- | -------------------------------- | ------------------- |
| `.logo-wrap`                          | 로고 + 앱명                      | `SidebarLogo`       |
| `.sidebar-section` + `.section-label` | 섹션 그룹 헤더                   | `SidebarSection`    |
| `.nav-item[data-view]`                | 보기 전환 (전체/내 VOC/담당 VOC) | `NavItem`           |
| `.nav-item[data-page]`                | 페이지 전환 (대시보드/관리자)    | `NavItem`           |
| `.nav-badge.accent/.muted`            | 카운트 배지                      | `NavBadge`          |
| `.menu-nav-item`                      | 시스템 서브메뉴 항목             | `NavSubItem`        |
| `.section-count-badge`                | 섹션 카운트 배지                 | `SectionCountBadge` |

---

## 2. VOC 목록 페이지 (`#page-voc`)

**Phase 7-1 구현 대상**

### 2-1. Topbar

| 프로토타입 요소                     | 컴포넌트             | 비고                               |
| ----------------------------------- | -------------------- | ---------------------------------- |
| `.topbar`                           | `VocTopbar`          | `src/components/voc/VocTopbar.tsx` |
| `.topbar-title` + `.topbar-count`   | 내부 텍스트          | `useVOCFilter` context에서 파생    |
| `.search-wrap input`                | `SearchInput`        | debounce 300ms                     |
| `.icon-btn#notifBtn` + `.notif-dot` | `NotificationButton` | 읽지않은 배지                      |
| `button.btn-primary` (새 VOC 등록)  | `CreateVocButton`    | `VocCreateModal` 트리거            |

### 2-2. Filter Bar

| 프로토타입 요소                  | 컴포넌트               | 비고                                    |
| -------------------------------- | ---------------------- | --------------------------------------- |
| `.filterbar`                     | `VocFilterBar`         | `src/components/voc/VocFilterBar.tsx`   |
| `.pill[onclick=togglePill]`      | `StatusPill`           | 상태: 전체/접수/검토중/처리중/드랍/완료 |
| `button.btn-ghost#filterMoreBtn` | `AdvancedFilterToggle` | 고급 필터 토글                          |

### 2-3. Advanced Filter Panel

| 프로토타입 요소                       | 컴포넌트              |
| ------------------------------------- | --------------------- |
| `.adv-filter-wrap` (슬라이드 인/아웃) | `AdvancedFilterPanel` |
| `.af-group` + `.af-chip` (담당자)     | `FilterChipGroup`     |
| `.af-group` + `.af-chip` (우선순위)   | `FilterChipGroup`     |
| `#typeChips` (동적 렌더)              | `FilterChipGroup`     |
| `#tagChips` (동적 렌더)               | `FilterChipGroup`     |
| `button.btn-ghost` 초기화             | 패널 내 인라인 버튼   |

### 2-4. VOC 목록 테이블

| 프로토타입 요소                      | 컴포넌트         | 비고                                      |
| ------------------------------------ | ---------------- | ----------------------------------------- |
| `.list-area`                         | `VocList`        | `src/components/voc/VocList.tsx`          |
| `.list-header .hcell[data-sort-key]` | `SortableHeader` | 클릭 시 정렬 토글                         |
| 각 VOC 행 (동적 생성)                | `VocRow`         | drawer 열기 트리거                        |
| 상태 도트 `.status-dot`              | `StatusDot`      | `src/components/common/StatusDot.tsx`     |
| 우선순위 배지                        | `PriorityBadge`  | `src/components/common/PriorityBadge.tsx` |
| `#paginationRow`                     | `Pagination`     | `src/components/common/Pagination.tsx`    |

---

## 3. VOC 상세 Drawer (`#drawer`)

**Phase 7-1 구현 대상**

drawer 내부는 `openDrawer()` 함수로 동적 생성. 구조:

| 프로토타입 요소                                | 컴포넌트               | 비고                               |
| ---------------------------------------------- | ---------------------- | ---------------------------------- |
| `.drawer-overlay`                              | `DrawerOverlay`        | 외부 클릭 시 닫힘                  |
| `.drawer`                                      | `VocDrawer`            | `src/components/voc/VocDrawer.tsx` |
| `.drawer-header` (이슈 코드+제목+액션 버튼)    | `DrawerHeader`         | fullscreen 토글 포함               |
| `.d-section` (메타 정보: 상태/담당자/우선순위) | `DrawerMetaSection`    |                                    |
| 본문 / 댓글 탭 영역                            | `DrawerTabs`           | Phase 7-2에서 댓글 구현            |
| 첨부파일 목록                                  | `AttachmentList`       | Phase 7-2                          |
| Internal Notes 섹션                            | `InternalNotesSection` | Phase 7-2a, Manager/Admin만        |

### Drawer 내부 상세 섹션 (`.d-section`)

| 섹션                                    | Phase | 설명                 |
| --------------------------------------- | ----- | -------------------- |
| 기본 메타 (상태/담당자/우선순위/등록일) | 7-1   | 인라인 편집 드롭다운 |
| 본문 (Toast UI Viewer)                  | 7-1   | 읽기 전용            |
| 본문 편집 (Toast UI Editor)             | 7-1   | 편집 모드 전환       |
| 댓글 목록 + 입력                        | 7-2   |                      |
| 첨부파일                                | 7-2   |                      |
| Internal Notes                          | 7-2a  |                      |
| Structured Payload (Result Review)      | 7-8   |                      |
| Sub-task 목록                           | 7-9   |                      |

---

## 4. VOC 등록 모달 (`#modalBg`)

**Phase 7-1 구현 대상**

| 프로토타입 요소                                    | 컴포넌트                                                   |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `.modal`                                           | `VocCreateModal` (`src/components/voc/VocCreateModal.tsx`) |
| `.modal-header`                                    | `ModalHeader`                                              |
| `.form-group` 제목 (maxlength 200) + `.char-count` | `TitleInput`                                               |
| `.form-row` 시스템/메뉴 연동 select                | `SystemMenuSelect`                                         |
| `.form-row` 유형/우선순위 select                   | `TypePrioritySelect`                                       |
| `.editor-wrap` (Toast UI Editor 자리)              | `BodyEditor`                                               |
| `.autotag-row` 자동 태그 추천 영역                 | `AutoTagRow`                                               |
| 첨부파일 영역 (`modal-attach-list` + 추가 버튼)    | `AttachmentUpload`                                         |
| `.modal-footer` 등록 버튼                          | `ModalFooter`                                              |

---

## 5. 대시보드 (`#page-dashboard`)

**Phase 7-4 구현 대상**

### 5-1. 헤더 / 컨트롤

| 프로토타입 요소                   | 컴포넌트            |
| --------------------------------- | ------------------- |
| `.dash-header`                    | `DashboardHeader`   |
| 메뉴 셀렉터 + 담당자 셀렉터       | `DashboardFilters`  |
| 날짜 버튼 그룹 (7/30/90일/커스텀) | `DateRangeSelector` |
| `.global-tabs` (채널 탭)          | `GlobalTabs`        |
| 레이아웃 편집 버튼                | `LayoutEditButton`  |

### 5-2. 위젯 목록

| 프로토타입 위젯 ID                                                 | 컴포넌트               | Phase |
| ------------------------------------------------------------------ | ---------------------- | ----- |
| KPI Volume (총 VOC/미해결/이번주 신규/이번주 완료)                 | `KpiVolumeSection`     | 7-4   |
| KPI Quality (평균 처리시간/해결율/Urgent·High 미해결/14일+ 미처리) | `KpiQualitySection`    | 7-4   |
| 분포 위젯 (도넛 + 탭: 상태/우선순위/유형/태그)                     | `DistributionWidget`   | 7-4   |
| 우선순위×상태 매트릭스                                             | `PriorityStatusMatrix` | 7-4   |
| 드릴다운 히트맵 (`#hmTable`)                                       | `DrilldownHeatmap`     | 7-4   |
| 주간 트렌드 SVG 라인 차트                                          | `WeeklyTrendChart`     | 7-4   |
| 태그별 분포 바 리스트 (Top 10)                                     | `TagDistributionBar`   | 7-4   |
| 처리속도 (`#slaCardWrap`)                                          | `SlaWidget`            | 7-4   |
| 에이징 (`#agingCardWrap`)                                          | `AgingWidget`          | 7-4   |
| 담당자별 처리 현황 (`#assignTable`)                                | `AssigneeTable`        | 7-4   |
| 장기 미처리 VOC Top 10 (`#agingTableWrap`)                         | `LongPendingTable`     | 7-4   |

### 5-3. 레이아웃 편집 패널 (`.dash-edit-panel`)

| 프로토타입 요소                         | 컴포넌트               |
| --------------------------------------- | ---------------------- |
| 저장 대상 토글 (내 설정 / Admin 기본값) | `DashSaveTargetToggle` |
| 기본 기간 / 히트맵 기본 X축 select      | `DashDefaultSettings`  |
| 설정 저장 / 취소 버튼                   | `DashEditPanelFooter`  |

---

## 6. 공지사항 / FAQ (`#page-notices`, `#page-faq`)

**Phase 7-5 구현 대상**

두 페이지 모두 JS로 동적 렌더. 공통 구조:

| 요소                                               | 컴포넌트                 |
| -------------------------------------------------- | ------------------------ |
| `.info-page` 컨테이너                              | `NoticePage` / `FaqPage` |
| 공지 헤더 + 레벨 배지 (`.notice-badge`)            | `NoticeRow`              |
| 공지 본문 (`.notice-body`)                         | `NoticeBody`             |
| FAQ 카테고리 필터 (`.faq-filter-bar` + `.cat-btn`) | `FaqFilterBar`           |
| FAQ 항목 아코디언                                  | `FaqItem`                |

---

## 7. 관리자 페이지

**Phase 7-6 구현 대상**

모든 관리자 페이지는 공통 레이아웃 패턴 공유:

- `.admin-topbar` → `AdminTopbar`
- `.admin-body` → `AdminBody`
- `.admin-add-form` → `AdminAddForm` (토글 가능)
- `.admin-table` → `AdminTable`

| 페이지 ID             | 컴포넌트           | 핵심 테이블 컬럼                            |
| --------------------- | ------------------ | ------------------------------------------- |
| `#page-tag-rules`     | `TagRulesPage`     | 키워드 패턴 / 연결 태그 / 유형 / 상태       |
| `#page-system-menu`   | `SystemMenuPage`   | 시스템+메뉴 트리 / 슬러그 / VOC 수 / 상태   |
| `#page-voc-type`      | `VocTypePage`      | 유형 / 슬러그 / VOC 수 / 상태               |
| `#page-users`         | `UsersPage`        | 사용자 / 이메일 / 역할 / 상태 / 마지막 접속 |
| `#page-admin-notices` | `AdminNoticesPage` | 공지 관리 CRUD                              |
| `#page-admin-faq`     | `AdminFaqPage`     | FAQ 관리 CRUD                               |

---

## 8. 알림 패널 (`#notifPanel`)

**Phase 7-7 구현 대상**

| 프로토타입 요소                      | 컴포넌트            |
| ------------------------------------ | ------------------- |
| `.notif-panel` (우상단 드롭다운)     | `NotificationPanel` |
| `.notif-header` + "모두 읽음 처리"   | `NotifPanelHeader`  |
| `.notif-item.unread` / `.notif-item` | `NotifItem`         |
| `.notif-dot-unread`                  | `UnreadDot`         |

---

## 9. 공통 컴포넌트 (`src/components/common/`)

프로토타입 전역에서 재사용되는 요소:

| CSS 클래스                       | 컴포넌트                     | 비고                   |
| -------------------------------- | ---------------------------- | ---------------------- |
| `.btn-primary`                   | `Button` (variant="primary") |                        |
| `.btn-ghost`                     | `Button` (variant="ghost")   |                        |
| `.icon-btn`                      | `IconButton`                 | tooltip `data-tip`     |
| `.status-dot`                    | `StatusDot`                  | 5개 상태 색상 토큰     |
| `.filter-select`                 | `FilterSelect`               |                        |
| `.dim-selector` + `.dim-btn`     | `DimSelector`                | 위젯 내 차원 전환 버튼 |
| `.section-label`                 | `SectionLabel`               | uppercase 라벨         |
| `.topbar` / `.topbar-title`      | `Topbar`                     | VOC 목록 전용          |
| `.admin-topbar` / `.admin-title` | `AdminTopbar`                | 관리자 페이지 전용     |

---

## 10. 구현 순서 (Phase 7 기준)

```
7-0  이 문서 (완료)
7-1  AppShell + Sidebar + VocTopbar + VocFilterBar + VocList + VocRow + VocDrawer + VocCreateModal
7-2  AttachmentUpload + CommentList + CommentInput + AttachmentList
7-2a InternalNotesSection (보안 3건: User→404, Manager/Admin 노출)
7-3  TagRulesPage + AutoTagRow (갭 #6 자동 태깅)
7-4  Dashboard 전체 위젯 (DashboardHeader + 11개 위젯 컴포넌트 + LayoutEditPanel)
7-5  NoticePage + FaqPage + AdminNoticesPage + AdminFaqPage
7-6  TagRulesPage + SystemMenuPage + VocTypePage + UsersPage (관리자 CRUD 4개)
7-7  NotificationPanel + NotifItem
7-8  StructuredPayloadPanel + ResultReviewPanel (voc_payload_reviews)
7-9  SubTaskList + SubTaskItem
7-10 ExternalMasterCache UI (stub JSON — 실 MSSQL 아님)
7-11 Storybook 여부 결정 + 전 컴포넌트 티켓화
```

---

## 11. 프로토타입 미커버 항목 (구현 시 설계 필요)

아래 항목은 prototype.html에 시각적 구현이 없어 7.x 착수 전 사용자 확인 필요:

| 항목                                                        | 설계 필요 이유                                   |
| ----------------------------------------------------------- | ------------------------------------------------ |
| Structured Payload 입력 폼 (설비/maker/model/process 칩 UX) | v2 리뷰에서 설계됐으나 프로토타입에 없음         |
| Result Review 관리자 화면                                   | `feature-voc.md §9.4.5` 참조 — 프로토타입 미존재 |
| Sub-task 생성/트리 표시                                     | requirements.md §8.11 참조 — 프로토타입 미존재   |
| External Master 연동 UI (🔄 새로고침 버튼 + 스냅샷 배지)    | requirements.md §16.3 참조                       |
| Mock Login 페이지 (`/mock-login`)                           | 이미 구현됨 (6-6), 프로토타입 불필요             |
