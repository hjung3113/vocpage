# /voc Prototype Decomposition (Wave 1.6 Phase A)

> 목적: prototype의 시각·동작 위계를 production /voc + 공통 셸과 노드 단위로 비교 가능한 형태로 분해한다. 이 문서가 Phase B(토큰 갭)·Phase C(컴포넌트 rebuild) 결정의 단일 근거이다.
>
> 정본 plan: `docs/specs/plans/wave-1-6-voc-parity.md`. 본 문서는 Phase A 산출물이며 코드 0줄을 변경한다.
>
> 분석 자료: `prototype/prototype.html` (1080줄), `prototype/css/**`, `prototype/js/**` (~18.7k줄). subagent 3종(HTML/CSS/JS) 병렬 분석 후 합본.
>
> **참조 정확도 안내**: 본 문서의 `prototype.html:Lxxx` 라인 범위는 ±10줄 오차가 있을 수 있다. Phase B/C 진입 시 해당 섹션을 다시 확인할 때는 `grep -n` 또는 `rg` 로 anchor (예: `id="page-voc"`, `class="filterbar"`)를 직접 잡아서 사용. JS 파일 라인 (`voc-list.js:Lxxx`, `drawer.js:Lxxx`)은 직접 확인하여 보다 정확하다.

---

## §1 페이지 인벤토리

### 1.1 /voc 페이지

| 항목            | 위치                                          | 비고                                                     |
| --------------- | --------------------------------------------- | -------------------------------------------------------- |
| Page root       | `prototype.html:L101–L193` (`#page-voc`)      | `topbar` + `filterbar` + `adv-filter-wrap` + `list-area` |
| Production 대응 | `frontend/src/components/voc/VocListPage.tsx` | 라우트 `/voc`                                            |

### 1.2 /voc에서 트리거되는 모달·드로어·오버레이

| Surface               | Trigger                               | Prototype 위치                                            | Production 위치                                                       |
| --------------------- | ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| VOC Create Modal      | `.btn-primary "새 VOC 등록"` (topbar) | `prototype.html:L907–L1003` (`#modalBg`)                  | `features/voc/components/VocCreateModal.tsx`                          |
| VOC Detail Drawer     | row 클릭 (`onclick="openDrawer(id)"`) | `prototype.html:L874–L891` (`#drawerOverlay` + `#drawer`) | `features/voc/components/VocReviewDrawer.tsx` (+ `VocReviewTabs.tsx`) |
| Advanced Filter Panel | `#filterMoreBtn "필터 더보기"`        | `prototype.html:L133–L165` (`#advFilterWrap`)             | `features/voc/components/VocAdvancedFilters.tsx`                      |
| Notification Panel    | `#notifBtn` 벨 아이콘                 | `prototype.html:L1007–L1024` (`#notifPanel`)              | `features/voc/components/VocNotificationsDropdown.tsx`                |
| Trash Confirm Modal   | (관리자 휴지통 컨텍스트)              | `prototype.html:L893–L905` (`#trConfirmBg`)               | (Wave 2-D admin 범위 — 본 Wave 비대상)                                |

### 1.3 라우트 구조

prototype은 SPA pseudo-routing(`data-page` / `data-view` attribute) 기반. /voc 페이지에 한정하면:

- `data-view="all" | "mine" | "assigned"` — 사이드바 필터 view (production: `useVocFilters` view 파라미터)
- URL sync: prototype은 `?sort=` + `?order=`만 동기화 (`voc-list.js:L192–195`). 나머지 필터는 in-memory.

---

## §2 공통 셸 분해 (AppShell / Sidebar / Topbar)

### 2.1 AppShell

```
div.app                                    prototype.html:L44
├─ aside.sidebar                           L47–L96
└─ main.main                               L99–L871
```

| 토큰                  | 사용                             |
| --------------------- | -------------------------------- |
| `--bg-app`            | `main.main` 페이지 배경          |
| `--sidebar-w` (222px) | `aside.sidebar` 폭 고정          |
| spacing               | grid 좌(sidebar 222px) / 우(1fr) |

Production 대응: `components/layout/AppShell.tsx`.

### 2.2 Sidebar

```
aside.sidebar
├─ div.sidebar-logo                        L47 부근
│  ├─ div.logo-mark > i[data-lucide=message-square-dot]
│  ├─ span.logo-text "VOCpage"
│  └─ span.logo-badge "BETA"
├─ div.sidebar-section (보기)
│  ├─ div.section-label "보기"
│  ├─ div.nav-item.active[data-view="all"]
│  ├─ div.nav-item[data-view="mine"]
│  ├─ div.nav-item[data-role-allow="admin manager dev"][data-view="assigned"]
│  └─ div.nav-item[data-page="dashboard"]
├─ div.sidebar-nav
│  ├─ div.sidebar-divider
│  ├─ div.sidebar-section (시스템)        ← 시스템·메뉴 accordion
│  ├─ div.sidebar-divider
│  ├─ div.sidebar-section (정보)
│  │  ├─ div.nav-item[data-view="notices"]
│  │  └─ div.nav-item[data-view="faq"]
│  ├─ div.sidebar-divider
│  └─ div.sidebar-section[data-role-section="admin"] (관리자)
│     └─ (7개 nav-item, role-allow 게이트)
└─ div.sidebar-user[data-tip="역할 전환 (데모)"]   ← role 스위처 popover trigger
   ├─ div.user-avatar "홍"
   ├─ div > div.user-name + div.user-role
   └─ i[data-lucide=chevrons-up-down]
```

| 토큰                                           | 사용                                      |
| ---------------------------------------------- | ----------------------------------------- |
| `--bg-panel`                                   | sidebar 배경                              |
| `--bg-elevated`                                | nav-item hover 배경                       |
| `--brand-bg` / `--brand-border` / `--accent`   | nav-item.active                           |
| `--text-primary/secondary/tertiary/quaternary` | section-label · nav-item · user-role      |
| `--text-on-brand` (현재 `#fff` 하드코딩)       | `.nav-badge.accent` 텍스트 — **gap §6.1** |
| `--sp-1`–`--sp-4`                              | padding/gap                               |
| `--shadow-sm`                                  | logo-mark 그림자                          |
| `--font-ui`                                    | 전체                                      |

#### 인터랙션

- `.nav-item:hover` → `bg-elevated` + `text-secondary`
- `.nav-item.active` → `brand-bg` + `accent` + `font-weight:600`
- `.sys-header.open .sys-chevron` → `rotate(90deg)` (시스템 accordion)
- 사이드바 사용자 영역 클릭 → role popover 토글 (`role-state.js:L213`)
- 키보드: ↑↓ Enter Esc 지원 (`role-state.js:L159–L287`)
- `data-role-allow` 속성으로 role별 노출 게이트 (`role-state.js:L83`, **cosmetic only — 보안 경계 아님** L5–10)

Production 대응: `components/layout/Sidebar.tsx`.

### 2.3 Topbar (Header)

```
div.topbar                                 L103–L115
├─ span.topbar-title#topbarTitle "전체 VOC"
├─ span.topbar-count#topbarCount "12개"
├─ div.spacer
├─ div.search-wrap > i[data-lucide=search] + input#searchInput
├─ div.icon-btn#notifBtn[data-tip=알림]
│  ├─ i[data-lucide=bell]
│  └─ span.notif-dot
└─ button.btn-primary > i[data-lucide=plus] + " 새 VOC 등록"
```

| 토큰                                 | 사용                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| `--bg-app`                           | topbar 배경                                                      |
| `--border-subtle`                    | 하단 1px                                                         |
| `--brand` / `--accent`               | btn-primary 배경 / hover                                         |
| `--brand-bg` / `--brand-border`      | search-wrap focus ring (`box-shadow: 0 0 0 3px var(--brand-bg)`) |
| `--text-primary/tertiary/quaternary` | title · count · placeholder                                      |
| `--shadow-sm` / `--shadow-md`        | btn / hover                                                      |
| `--sp-1`–`--sp-5`                    | padding                                                          |

#### 인터랙션

- `.search-wrap:focus-within` → border `--brand-border` + 3px focus ring + bg `--bg-elevated`
- `.search-input` 입력 → `onSearch(val)` (`voc-list.js:L152`) → `currentPage=1` reset → `renderVOCList()`
- `.icon-btn:hover` → bg `--bg-elevated` + border `--border-standard`
- `.btn-primary:hover` → bg `--accent` + `--shadow-md`
- `.btn-primary:active` → `transform:scale(0.97)`
- `#notifBtn` 클릭 → `#notifPanel` 토글 (notif.js)

Production 대응: `components/layout/TopBar.tsx` + `features/voc/components/VocTopbar.tsx`.

---

## §3 /voc 페이지 분해

### 3.1 페이지 root 트리

```
div#page-voc                                L101–L193
├─ div.topbar                               L103–L115   (§2.3 참조)
├─ div.filterbar                            L118–L130
├─ div#advFilterWrap.adv-filter-wrap        L133–L165
└─ div.list-area                            L168–L192
```

### 3.2 Filter bar (status pills)

```
div.filterbar                               L118–L130
├─ span.filter-label "필터"
├─ div.pill.active[onclick=togglePill]  "전체"
├─ div.pill                              "접수"
├─ div.pill                              "검토중"
├─ div.pill                              "처리중"
├─ div.pill                              "드랍"
├─ div.pill                              "완료"
├─ div.spacer
└─ button.btn-ghost#filterMoreBtn        "필터 더보기"
```

토큰: `--bg-elevated` · `--brand-bg` · `--brand-border` · `--accent` · `--text-tertiary` · `--sp-2/3/4` · radius 9999px (pill).

상태:

- `.pill:hover` → bg `--bg-elevated`
- `.pill:active` → `scale(0.94)`
- `.pill.active` → bg `--brand-bg` + border `--brand-border` + color `--accent` + 1px outline
- `.btn-ghost.filter-on` → border/color/bg 모두 brand 톤 (advanced 패널 열린 동안)

Production 대응: `features/voc/components/VocStatusFilters.tsx`.

### 3.3 Advanced filter panel

```
div#advFilterWrap.adv-filter-wrap           L133–L165
└─ div.adv-filter-inner
   ├─ div.af-group  (담당자)   → div.af-opts > .af-chip × N
   ├─ div.af-group  (우선순위)
   ├─ div.af-group  (유형)
   ├─ div.af-group  (태그)
   └─ div.af-actions > button.btn-ghost "초기화"
```

토큰: `--bg-app` · `--bg-elevated` · `--brand-bg` · `--brand-border` · `--accent` · `--text-secondary` · spacing 8/12/16px.

상태:

- `.af-chip:hover` → bg `--bg-elevated`
- `.af-chip.active` → bg `--brand-bg` + border `--brand-border` + color `--accent` + `font-weight:600`
- 패널 toggle → `.adv-filter-wrap.open` (높이 애니메이션)

인터랙션 (filters.js):

- `toggleAdvFilter()` L45 → `.open` 토글 + 칩 렌더 + `updateFilterBtnState()`
- `toggleAfChip(type, val)` L85 → `filterAssignees`/`filterPriorities`/`filterTypes` (Set) 업데이트
- `toggleTagChip(tag)` L78 → `filterTags` (Set) 업데이트
- `clearAdvFilter()` L100 → 모든 Set 초기화 + 칩 재렌더 + page=1

Production 대응: `features/voc/components/VocAdvancedFilters.tsx`.

### 3.4 List area (toolbar + header + rows + pagination)

```
div.list-area                               L168–L192
├─ div.list-toolbar                         L170–L180
│  ├─ span.sort-label "정렬"
│  └─ div.sort-chips#sortChips[role=radiogroup]
│     └─ button.sort-chip[data-sort-key=date|id|title|status|priority|assignee] × 6
├─ div.list-header                          L181–L189   ← sticky
│  ├─ div  (체크박스 22px)
│  ├─ div.hcell[data-sort-key=id]        "이슈 ID"     (144px)
│  ├─ div.hcell[data-sort-key=title]     "제목"        (1fr)
│  ├─ div.hcell[data-sort-key=status]    "상태"        (115px)
│  ├─ div.hcell[data-sort-key=assignee]  "담당자"      (108px)
│  ├─ div.hcell[data-sort-key=priority]  "우선순위"     (84px)
│  └─ div.hcell.sort-active[data-sort-key=date] "등록일" (96px)
├─ div#listArea                             ← rows 동적 렌더 (.voc-group / .voc-row)
└─ div#paginationRow                        ← .pagination > .page-btn
```

#### Row 단위 (`.voc-row`, voc-list.js:L109)

```
div.voc-row[onclick=openDrawer(id)]
├─ div.row-check (22px)
├─ div.issue-code (D2Coding mono)
├─ div.row-title
│  ├─ span.title-text  (highlight: <mark> for search match)
│  ├─ span.tag-pill × N
│  └─ button.expand-btn (subs 있으면)
├─ span.status-badge.s-{status}
├─ div.assignee
│  ├─ div.mini-av (color class)
│  └─ span.assignee-name
├─ div.priority (icon + label)
└─ div.date
```

토큰 (list.css):

- `--bg-panel` · `--bg-elevated` (row hover, **inline OKLCH 사용 — gap §6.2**)
- `--border-subtle` row separator
- `--status-{received|reviewing|processing|done|drop}-{bg,fg,border}` ← **prototype 전용, frontend는 `--status-dot-*`만 보유 — gap §6.3**
- `--font-mono` issue-code
- `--text-primary/secondary/tertiary` 컬럼별

상태:

- `.voc-row:hover` → bg `light-dark(oklch(94% 0.014 257), oklch(21% 0.028 261))` (raw OKLCH leak)
- `.voc-row.selected` → bg `light-dark(oklch(90% 0.03 260), oklch(24% 0.042 262))` + 1px outline `--brand-border`
- `.expand-btn:hover` → bg `--bg-elevated` + `scale(1.15)`
- `.expand-btn.open` → `rotate(90deg)`
- `.hcell:hover` → color `--text-secondary`
- `.hcell.sort-active` → color `--accent` + `sortFlip` keyframe
- `.voc-group.entering` → `rowEnter` 0.28s (opacity + translateY)

#### Pagination (`.page-btn`, misc.css)

상태:

- `.page-btn:hover:not(:disabled)` → bg `--bg-elevated`
- `.page-btn:active` → `scale(0.92)`
- `.page-btn.active` → bg `--brand-bg` + color `--accent` + `pageActivePop` 애니메이션
- `.page-btn:disabled` → `opacity:0.3` + `cursor:default`
- 7페이지 초과 시 ellipsis (`voc-list.js:L82–L89`)

#### 인터랙션 (voc-list.js)

- 검색: `onSearch(val)` L152 → `searchQuery` set → `currentPage=1` → `renderVOCList()` → `getVisible()` L2 (title/body HTML 제거 후/tags 매칭) → 정렬 → 페이지 슬라이스 → DOM 렌더 + `lucide.createIcons()` L73
- 정렬: `sortByChip(key)` L169 / `toggleSort(key)` (filters.js:L11) → `sortKey`+`sortDir` 토글 → URL `history.replaceState({sort,order})` L192–L195
- 페이지 이동: `goPage(n)` L103 → `scrollIntoView`
- 행 클릭: `openDrawer(id)` (drawer.js) — §3.6 참조
- Empty: row 0건이면 빈 영역 (별도 empty-state 클래스 미관측, **`.empty-state` 토큰만 misc.css에 존재 — production 명시 필요**)
- Loading: prototype은 mock 동기 데이터라 명시 loading state 없음 — production은 React Query `isLoading` skeleton 필요
- Error: 동일 이유로 prototype 미정의 — production은 fetch 실패 시 retry UI 필요

Production 대응:

- `features/voc/components/VocSortChips.tsx`, `VocTable.tsx`, `VocPaginationBar.tsx`
- 데이터 hook: `features/voc/useVocList.ts`, `useVocFilters.ts`, `useVocPageController.ts`

### 3.5 VOC Create Modal

```
div.modal-bg#modalBg                        L907–L1003
└─ div.modal[role=dialog][aria-modal=true]
   ├─ div.modal-header
   │  ├─ span.modal-title "새 VOC 등록"
   │  └─ div.icon-btn (close)
   ├─ div.modal-body
   │  ├─ div.form-group       (제목)
   │  ├─ div.form-row         (시스템 + 메뉴)
   │  ├─ div.form-row         (유형 + 우선순위)
   │  ├─ div.form-row         (마감일)
   │  ├─ div.form-group       (본문)
   │  │  └─ div.editor-wrap > div.editor-toolbar + div.editor-area
   │  └─ div.form-group       (첨부)
   │     ├─ input#modal-file-input[type=file][multiple]
   │     ├─ div#modal-att-drop.att-drop
   │     └─ div#modal-att-grid.att-grid
   └─ div.modal-footer
      ├─ div.footer-note
      └─ div.footer-actions  (취소 + 등록)
```

토큰: `--bg-surface` · `--bg-elevated` · `--brand` · `--brand-bg` · `--shadow-dialog` · `--overlay` (production은 `--bg-overlay` — gap §6.4) · `--font-ui` · `--font-mono`.

상태:

- `.form-input:focus` / `.form-select:focus` / `.editor-wrap:focus-within` → border `--brand` + 3px focus ring `--brand-bg`
- `.form-select:disabled` → `opacity:0.5`
- `.e-btn:hover` (editor toolbar) → bg `--bg-surface`

인터랙션 (modal.js):

- `modalProcessFiles()` L33 → MIME(image only) + size(≤10MB) + count(≤5) 검증
- 드래그-드롭 핸들러 L11–L24
- `attachCharCount()` (dom-utils.js:L15) — body input 90%/max 라이브 카운터, 초과 시 등록 버튼 disable

Production 대응: `features/voc/components/VocCreateModal.tsx` + `ToastBodyEditor.tsx` + `NativeSelect.tsx`.

### 3.6 VOC Detail Drawer

```
div.drawer-overlay#drawerOverlay            L874
div.drawer#drawer                           L875–L891
├─ div.drawer-header
│  ├─ div.drawer-header-left
│  │  ├─ div.d-code#dCode      (mono, issue code)
│  │  └─ div.d-title#dTitle
│  └─ div.drawer-actions
│     ├─ div.icon-btn#expandBtn  (큰 화면)
│     ├─ div.icon-btn             (링크 복사)
│     ├─ div.icon-btn             (삭제, Admin)
│     └─ div.icon-btn[onclick=closeDrawer()]
└─ div.drawer-body#drawerBody    ← 탭(.d-overview / .d-comments / .d-internal-notes / .d-advanced) 동적 렌더
```

토큰: `--bg-panel` · `--bg-surface` · `--bg-elevated` · `--shadow-dialog` · `--overlay` · `--drawer-w` (528px) · `--font-mono`(d-code).

상태:

- `.drawer-overlay.open` → bg `--overlay` + `pointer-events:auto`
- `.drawer.open` → `transform:translateX(0)` (from 100%)
- 풀스크린 토글 → `width:100%!important`
- `.meta-sel:focus` / `.comment-input:focus-within` → brand focus ring
- 탭 전환 → 활성 `.d-tab-btn.active` + 해당 `.d-section` 표시

인터랙션 (drawer.js, drawer-core.js, drawer-advanced.js, drawer-comments.js, internal-notes.js):

- `openDrawer(vocId)` → VOC_MAP 조회 → 탭 빌드(개요/댓글/내부노트/어드밴스드) → role gate (drawer.js:L3 `applyDrawerUserReadonly`)
- `role:change` 이벤트 수신 → 게이트 재적용 (L96)
- 댓글 편집/삭제: `currentUserId() === c.author_id` 소유권 체크 (drawer-comments.js:L18, R2 fail-closed)
- 서브태스크: 1레벨 제한 (drawer-core.js:L34)
- 첨부: 5개/10MB 제한, `attachStore[vocId]` 인메모리 (drawer-core.js:L2)
- 상태 lock: `voc.review_status === 'approved'`이면 status select 비활성 (drawer-advanced.js:L26)
- 닫기: Esc / backdrop / X → `closeDrawer()` → `.open` 제거

Production 대응: `frontend/src/features/voc/components/VocReviewDrawer.tsx` + `VocReviewTabs.tsx`.

#### 3.6.1 불변식(Invariants) — Phase C rebuild에서 절대 손실되면 안 되는 규칙

본 절은 §5의 컴포넌트 props 명세보다 우선한다. props 시그니처가 무엇이든 아래 규칙은 동일 의미로 보존되어야 한다.

| ID  | 규칙                                                                                                                                                                                     | 출처                                                    | Phase C 검증 방법                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| I-1 | 댓글 편집/삭제는 `currentUserId === comment.author_id`인 경우에만 본인용 메뉴 노출. role과 무관하게 fail-closed (prototype `drawer-comments.js:43-58` 확인 — `own=true` 외 메뉴 미렌더). | `drawer-comments.js:L18` `isOwner` + `:43-58` 렌더 분기 | unit test: 다른 author_id 댓글에 메뉴 없음                  |
| I-2 | `voc.review_status === 'approved'`이면 status select / assignee select 비활성화                                                                                                          | `drawer-advanced.js:L26`                                | unit test: review_status=approved → select disabled         |
| I-3 | 첨부 제한: `maxCount=5`, `maxBytes=10485760` (10 MiB), `acceptMime`은 `image/png`, `image/jpeg`, `image/gif`, `image/webp`만 허용. modal과 drawer 양쪽이 동일 상수 공유                  | `modal.js:L33` + `drawer-core.js:L97`                   | unit test: 6번째 파일 거부, 11MB 거부, application/pdf 거부 |
| I-4 | 서브태스크 1레벨 제한 — VOC가 `parentId` 보유 시 sub 추가 UI 숨김                                                                                                                        | `drawer-core.js:L34`                                    | unit test: parentId 있는 voc → addSub 버튼 없음             |
| I-5 | 내부 노트 표시: User=숨김, Dev=본인 작성/담당 VOC만, Manager/Admin=항상 노출                                                                                                             | `internal-notes.js` 진입부                              | unit test: role 4종 × ownership 매트릭스                    |
| I-6 | role-allow는 cosmetic only. 모든 mutation은 서버 가드 필요                                                                                                                               | `role-state.js:L5–L10`                                  | 통합 test: API 403 → UI 적절 처리                           |

> **Admin/Manager의 타인 댓글 삭제 권한**은 prototype에 없음 (메뉴 자체가 미렌더). 향후 Wave에서 정책으로 추가하려면 backend 계약 + UI 분리 PR로 별도 처리. 본 Wave는 `own=true` fail-closed만 보존.

> Phase C 진행 시 단일 모듈 `frontend/src/features/voc/permissions.ts`(가칭)에 위 규칙을 함수로 캡슐화하고 컴포넌트는 호출만 하도록 통일 권고. 신설 여부는 Phase C 첫 컴포넌트 작업 시 결정.

### 3.7 Notification Panel

```
div.notif-panel#notifPanel                  L1007–L1024
├─ div.notif-header
│  ├─ span.notif-title "알림"
│  └─ span.notif-mark "모두 읽음 처리"
├─ div.nf-chips[role=toolbar]
│  └─ button.nf-chip[data-filter=all|comment|status|assignee|urgent|notice|faq] × 7
└─ div#nfList                               ← MOCK_NOTIFS 렌더
```

토큰: `--bg-panel` · `--bg-elevated` · `--brand-bg` · `--accent` · `--shadow-md`.

상태:

- `.nf-chip--active` → `--brand-bg` + `--accent`
- 클릭 시 항목 → 관련 VOC 드로어 오픈 (production 핸들러 미구현 — 부록 A.6 참고)

Production 대응: `features/voc/components/VocNotificationsDropdown.tsx`.

---

## §4 데이터 계약

### 4.1 VOC item (data.js:L64–L109)

| Field                         | Type (inferred)        | Production 대응 (`shared/types`)        | 누락/주의                                                               |
| ----------------------------- | ---------------------- | --------------------------------------- | ----------------------------------------------------------------------- | ------------------- | ------------------- | ---------------------------- | ------------------------ |
| `id`                          | string                 | `voc.id` (uuid)                         | prototype은 `'voc1'` 같은 slug — production은 uuid                      |
| `code`                        | string                 | `voc.issue_code` (`ANALYSIS-2026-NNNN`) | prototype `'분석-2025-0001'` — 한글 prefix vs production English prefix |
| `title`                       | string                 | `voc.title`                             | —                                                                       |
| `status`                      | `'접수'                | '검토중'                                | '처리중'                                                                | '완료'              | '드랍'`             | `voc.status` enum            | 라벨 매핑 일치 확인 필요 |
| `priority`                    | `'urgent'              | 'high'                                  | 'medium'                                                                | 'low'`              | `voc.priority`      | 동일                         |
| `assignee`                    | string                 | `voc.assignee` (user id 또는 null)      | prototype은 이름 문자열, production은 user id                           |
| `assigneeInit`, `assigneeCls` | string                 | (production: 파생)                      | 컴포넌트 측에서 계산해야 함                                             |
| `systemId`                    | string                 | `voc.system_id`                         | —                                                                       |
| `menuId`                      | string                 | `voc.menu_id`                           | —                                                                       |
| `type`                        | string slug            | `voc.voc_type`                          | —                                                                       |
| `tags`                        | string[]               | `voc.tags`                              | —                                                                       |
| `author`, `author_id`         | string                 | `voc.created_by`                        | —                                                                       |
| `date`                        | `'YYYY.MM.DD'` 문자열  | `voc.created_at` (ISO)                  | 포맷 변환 필요                                                          |
| `body`                        | HTML string            | `voc.body` (HTML, sanitized)            | DOMPurify 통과 여부 (defer 항목)                                        |
| `subs`                        | string[] (sub-VOC ids) | `voc.sub_tasks`                         | 스키마 확정 필요 — sub-task가 별도 row인지 embedded인지                 |
| `subTasks`                    | `{id,title,done}[]`    | (TBD)                                   | 위와 동일                                                               |
| `review_status`               | `'unverified'          | 'approved'                              | 'rejected'                                                              | 'pending_deletion'` | `voc.review_status` | 미사용 시 status lock 미적용 |
| `comments`                    | Comment[]              | `voc.comments`                          | 별도 endpoint? embedded? — 확정 필요                                    |

### 4.2 Comment

| Field                 | Type                              | 비고                                           |
| --------------------- | --------------------------------- | ---------------------------------------------- |
| `id`                  | string                            | —                                              |
| `author`, `author_id` | string                            | 소유권 체크 `isOwner` (drawer-comments.js:L18) |
| `body`                | string (plain text)               | render 시 `escHtml()` 통과                     |
| `date`                | string (`'어제 14:30'` 등 표시용) | production은 ISO timestamp + relative format   |
| `_deleted`            | boolean                           | soft-delete 플래그                             |

### 4.3 Filter / Pagination 런타임 상태

| 변수                                                               | Type            | 위치                                                  |
| ------------------------------------------------------------------ | --------------- | ----------------------------------------------------- | ----------- | ----------- |
| `currentStatus`                                                    | string          | filterbar pill                                        |
| `currentView`                                                      | `'all'          | 'mine'                                                | 'assigned'` | sidebar nav |
| `searchQuery`                                                      | string          | topbar search                                         |
| `sortKey`, `sortDir`                                               | string · `'asc' | 'desc'`                                               | URL sync    |
| `currentPage`, `PAGE_SIZE`                                         | number          | `calcPageSize()` (helpers.js:L2) — viewport 기반 동적 |
| `activeSysId`, `activeMenuId`, `openSysId`                         | string          | sidebar accordion                                     |
| `filterAssignees`, `filterPriorities`, `filterTypes`, `filterTags` | `Set<string>`   | advanced filter                                       |

Production 대응: `features/voc/useVocFilters.ts` (Zustand 또는 RHF), URL은 `useVocPageController` 책임.

### 4.4 Notification (`MOCK_NOTIFS`, notif.js:L1–L100; 타입 enum `NOTIF_TYPES` notif.js:L3)

| Field    | Type                | 비고                                        |
| -------- | ------------------- | ------------------------------------------- | ---------- | -------- | ----- | ---------- | ------------------------------- |
| `id`     | string              | —                                           |
| `type`   | `'comment'          | 'status'                                    | 'assignee' | 'notice' | 'faq' | 'default'` | NOTIF_TYPES (L3) icon/색상 매핑 |
| `unread` | boolean             | —                                           |
| `urgent` | boolean             | —                                           |
| `actor`  | string              | 사용자 이름                                 |
| `vocId`  | string              | navigate 대상                               |
| `action` | string (plain text) | **HTML 금지 — render 시 actor + verb 합성** |
| `time`   | string              | relative                                    |

### 4.5 Role state (role-state.js:L17–L26)

```
{ id: string, name: string, role: 'admin'|'manager'|'dev'|'user', avatar: string }
```

Permission 표 (cosmetic — 서버측 가드 필수):

| Role    | Comment write | Status/Assignee edit | Internal notes | Admin 메뉴 |
| ------- | ------------- | -------------------- | -------------- | ---------- |
| user    | ×             | ×                    | hidden         | ×          |
| dev     | ○             | ×(?)                 | own VOC만      | ×          |
| manager | ○             | ○                    | ○              | 일부       |
| admin   | ○             | ○                    | ○              | 전체       |

---

## §5 컴포넌트 맵

| 컴포넌트                 | 역할                                    | 주요 props                       | 상태                            | Variants                               | Prototype                                                                    | Production                                                               | 처리                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------- | -------------------------------- | ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AppShell                 | 사이드바+메인 grid                      | children                         | —                               | —                                      | `prototype.html:L44`                                                         | `components/layout/AppShell.tsx`                                         | **token-align**                                                                                                                                                                                                                                                                                                   |
| Sidebar                  | nav + role-gate + accordion             | currentView, role                | active/hover, accordion open    | section: 보기/시스템/정보/관리자       | `prototype.html:L47–L96` + `sidebar.js`                                      | `components/layout/Sidebar.tsx`                                          | **rebuild** (시스템 accordion + role-gate UX 일치)                                                                                                                                                                                                                                                                |
| SidebarUserSwitcher      | role popover                            | currentUser                      | open/closed, focus              | —                                      | `prototype.html:L94–L96` + `role-state.js`                                   | (없음 — 신규)                                                            | **rebuild**                                                                                                                                                                                                                                                                                                       |
| Topbar                   | 페이지 상단 (제목+카운트+검색+알림+CTA) | title, count, onSearch, onCreate | search focus, notif open        | —                                      | `prototype.html:L103–L115`                                                   | `components/layout/TopBar.tsx` + `features/voc/components/VocTopbar.tsx` | **rebuild** (검색바 focus ring + count badge 일치)                                                                                                                                                                                                                                                                |
| NotifButton + NotifPanel | 알림 드롭다운                           | items, onItemClick               | open/closed, type filter        | 타입 7종                               | `prototype.html:L1007–L1024` + `notif.js`                                    | `features/voc/components/VocNotificationsDropdown.tsx`                   | **rebuild** (chip filter + nav 행동)                                                                                                                                                                                                                                                                              |
| VocStatusFilters         | 상태 pill bar                           | active, onChange                 | hover/active                    | 6 status                               | `prototype.html:L118–L130` + `filters.js`                                    | `features/voc/components/VocStatusFilters.tsx`                           | **token-align**                                                                                                                                                                                                                                                                                                   |
| VocAdvancedFilters       | 4-group chip 패널                       | filters, onToggle, onClear       | open/closed, chip active        | assignee/priority/type/tag             | `prototype.html:L133–L165` + `filters.js`                                    | `features/voc/components/VocAdvancedFilters.tsx`                         | **rebuild** (열림 애니메이션 + chip active 시각)                                                                                                                                                                                                                                                                  |
| VocSortChips             | 정렬 칩 그룹                            | sortKey, sortDir, onChange       | radio active                    | 6 keys (mapping 필요)                  | `prototype.html:L171–L179` + `voc-list.js`                                   | `features/voc/components/VocSortChips.tsx`                               | **rebuild** (정렬 키 mapping 필요 — §5.1 참고)                                                                                                                                                                                                                                                                    |
| VocListHeader            | sticky 표 헤더                          | sortKey, onSort                  | sort-active 애니메이션          | —                                      | `prototype.html:L181–L189`                                                   | (`VocTable.tsx` 내부)                                                    | **rebuild** (grid columns 정확히, sort 화살표 keyframe)                                                                                                                                                                                                                                                           |
| VocRow                   | 데이터 행                               | voc, selected, onClick           | hover/selected/expanded         | with subs / without                    | `voc-list.js:L109`                                                           | (`VocTable.tsx` 내부)                                                    | **rebuild** (raw OKLCH 토큰화 후 시각 위계 재구성)                                                                                                                                                                                                                                                                |
| VocSubRow                | 서브태스크 행                           | sub, parentId                    | hover/selected                  | —                                      | `voc-list.js` (subs 분기)                                                    | (없음)                                                                   | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocStatusBadge           | 상태 뱃지                               | status                           | —                               | 5 status                               | `helpers.js:L16` (`statusHTML`)                                              | `components/voc/VocStatusBadge.tsx`                                      | **rebuild** (status-\* 토큰 5쌍 도입 후)                                                                                                                                                                                                                                                                          |
| VocPriorityBadge         | 우선순위 뱃지                           | priority                         | —                               | 4 priority                             | `helpers.js:L13` (`priHTML`)                                                 | (없음 — VocTable 내)                                                     | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocAssignee              | mini avatar + 이름                      | name, color                      | —                               | colorCls 3종 (steel/teal/violet, hash) | `helpers.js:L19`                                                             | (VocTable 내)                                                            | **rebuild** (avatar 색상 토큰화 후) [AMENDED 2026-05-02 PR C-5: original "colorCls 6종"; rationale: prototype `list.css:L289–L303`은 default(.mini-av)+.g(teal)+.p(violet) = 3종, `helpers.js:L19` `assigneeCls` 단일 토큰도 3종에 대응. avatar 토큰 3개(--avatar-steel/teal/violet)는 PR #128 시점 이미 추가됨.] |
| VocTagPill               | 태그 핀                                 | tag                              | —                               | —                                      | `voc-list.js` row 인라인                                                     | (없음)                                                                   | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocPaginationBar         | 페이지 버튼                             | page, total, onPage              | active/hover/disabled, ellipsis | —                                      | `voc-list.js:L82–L101`                                                       | `features/voc/components/VocPaginationBar.tsx`                           | **token-align**                                                                                                                                                                                                                                                                                                   |
| VocCreateModal           | 신규 등록 폼                            | open, onSubmit, onClose          | open/closed, validation         | —                                      | `prototype.html:L907–L1003` + `modal.js`                                     | `features/voc/components/VocCreateModal.tsx`                             | **rebuild** (focus ring + 첨부 zone 시각 정합)                                                                                                                                                                                                                                                                    |
| ToastBodyEditor          | 본문 에디터                             | value, onChange                  | focus                           | —                                      | `prototype` editor placeholder                                               | `features/voc/components/ToastBodyEditor.tsx`                            | **token-align** (Toast UI Editor lazy chunk 유지)                                                                                                                                                                                                                                                                 |
| AttachmentZone           | 드롭존+썸네일 그리드                    | files, onAdd, onRemove           | hover/drag-over                 | —                                      | `modal.js` + drawer-core.js:L97                                              | (`VocCreateModal` 내)                                                    | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocReviewDrawer          | 상세 드로어 (header+body)               | vocId, open, onClose             | open/closed, fullscreen         | —                                      | `prototype.html:L874–L891` + drawer.js                                       | `features/voc/components/VocReviewDrawer.tsx`                            | **rebuild** (overlay+slide 트랜지션 + role gate)                                                                                                                                                                                                                                                                  |
| VocReviewTabs            | 4탭 콘텐츠                              | voc, role, activeTab             | tab-active                      | overview/comments/internal/advanced    | drawer-core.js + drawer-comments.js + internal-notes.js + drawer-advanced.js | `features/voc/components/VocReviewTabs.tsx`                              | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocCommentList           | 댓글 목록 + 편집 메뉴                   | comments, currentUserId          | menu open                       | own/other                              | `drawer-comments.js`                                                         | (VocReviewTabs 내)                                                       | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocInternalNotes         | 내부 노트                               | vocId, role                      | role-gated                      | —                                      | `internal-notes.js`                                                          | (VocReviewTabs 내)                                                       | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocSubTaskList           | 서브태스크 (drawer)                     | items, onToggle                  | hover/done                      | —                                      | `drawer-core.js:L22`                                                         | (VocReviewTabs 내)                                                       | **rebuild**                                                                                                                                                                                                                                                                                                       |
| VocPermissionGate        | role-allow 게이트                       | allow, role                      | —                               | —                                      | role-state.js + `data-role-allow`                                            | `components/voc/VocPermissionGate.tsx`                                   | **token-align** (보강만)                                                                                                                                                                                                                                                                                          |

총 25개 행. **rebuild 17개 / token-align 7개 / reuse 0개 / delete 0개**. (현 production 컴포넌트 일부는 rebuild 시 1:1 교체.)

### 5.1 VocSortChips 정렬 키 매핑 (rebuild 필수 컨텍스트)

prototype 정렬 키와 production API 정렬 키가 다르므로 단순 token swap 불가. Phase C에서 다음 매핑을 컴포넌트 내부에 캡슐화하거나 별도 어댑터로 분리한다.

| prototype key (`data-sort-key`) | 라벨 (prototype) | production `VocSortColumn` 매핑 | 비고                                                   |
| ------------------------------- | ---------------- | ------------------------------- | ------------------------------------------------------ |
| `date`                          | 등록일           | `created_at`                    | 1:1                                                    |
| `id`                            | 이슈 ID          | `issue_code`                    | 표시 라벨 동일                                         |
| `title`                         | 제목             | `title`                         | Issue 155 — production 지원 추가 (feature-voc.md §9.5) |
| `status`                        | 상태             | `status`                        | 1:1                                                    |
| `priority`                      | 우선순위         | `priority`                      | 1:1                                                    |
| `assignee`                      | 담당자           | `assignee`                      | Issue 155 — wire 토큰; BE는 `assignee_id` 컬럼 정렬    |

결정 (Issue 155 적용 완료): prototype 6 키 모두 production이 지원. `updated_at` / `due_date`는 spec §9.5에서 제외됨.

### 5.2 Phase C 진행 순서

> **순서 잠정**: leaf → composite → shell.
>
> 1. VocStatusBadge → VocPriorityBadge → VocTagPill → VocAssignee → VocStatusFilters / VocSortChips
> 2. VocPaginationBar → VocListHeader → VocRow → VocSubRow → VocTable 합성
> 3. VocAdvancedFilters → VocTopbar
> 4. VocCommentList → VocInternalNotes → VocSubTaskList → VocReviewTabs → VocReviewDrawer
> 5. AttachmentZone → VocCreateModal
> 6. NotifPanel → SidebarUserSwitcher → Sidebar → AppShell

---

## §6 토큰 갭 (prototype에 있고 production에 없는/이름이 다른 토큰)

### 6.1 `#fff` 하드코딩 (prototype CSS 내부)

| 위치                                    | 사용                       |
| --------------------------------------- | -------------------------- |
| `prototype/css/layout/topbar.css:L129`  | `.btn-primary` 텍스트      |
| `prototype/css/layout/filter.css:L72`   | `.fc-badge` 텍스트         |
| `prototype/css/layout/sidebar.css:L112` | `.nav-badge.accent` 텍스트 |
| `prototype/css/layout/list.css:L292`    | `.mini-av` 텍스트          |

→ production은 `--text-on-brand` 토큰 보유. Phase B에서 일괄 치환하며 production tokens.css에 동일 토큰 존재 보장.

### 6.2 raw OKLCH (prototype CSS 내부, 토큰화 필요)

| 위치                 | 용도                     | 제안 토큰                                                   |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| `list.css:L21`       | 리스트 헤더 그림자       | `--shadow-list-header` 또는 기존 `--shadow-sm` 재사용 검토  |
| `list.css:L83, L90`  | row hover/selected 배경  | `--voc-row-hover-bg`, `--voc-row-selected-bg` (신규)        |
| `list.css:L265`      | 우선순위 high 배경       | 기존 `--status-orange` 또는 `--chart-amber` 매핑            |
| `list.css:L289–L303` | assignee mini-avatar 3색 | `--avatar-steel`, `--avatar-teal`, `--avatar-violet` (신규) |
| `misc.css:L17`       | `<mark>` highlight       | `--mark-bg` (신규)                                          |

### 6.3 VOC 상태 5쌍 토큰 (spec ↔ CSS sync 격차)

prototype tokens.css: `--status-{received|reviewing|processing|done|drop}-{bg,fg,border}` (5×3 = 15개) — 정의됨 (`prototype/css/tokens.css:71–85`).
uidesign.md §10·§12: 동일 15개 토큰 명시 (`docs/specs/requires/uidesign.md:618–632`).
frontend `index.css`: **`--status-dot-{received|reviewing|processing|done|drop}` 5개만** (`frontend/src/styles/index.css:118–122`). **트리오(`-bg/-fg/-border`) 부재.**

→ 즉, **spec(uidesign.md)는 가지고 있으나 실제 CSS(`frontend/src/styles/index.css`)에 미반영**. Phase B 작업은 "신규 정의"가 아니라 "spec → CSS 동기화"이다. uidesign.md §10 토큰 값을 그대로 `frontend/src/styles/index.css`로 복사.

값(uidesign.md:618–632에서 그대로 가져올 것):

```
--status-received-{bg,fg,border}    (line 618–620)
--status-reviewing-{bg,fg,border}   (line 621–623)
--status-processing-{bg,fg,border}  (line 624–626)
--status-done-{bg,fg,border}        (line 627–629)
--status-drop-{bg,fg,border}        (line 630–632)
```

### 6.4 그 외 이름/누락 차이

| 영역              | prototype                                                     | frontend `index.css`             | uidesign.md 본문                        | 결정                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 모달/드로어 scrim | `--overlay`                                                   | `--bg-overlay` (line 130)        | `var(--overlay)` (line 1062, **stale**) | **production 이름 `--bg-overlay`를 정본으로 채택**. uidesign.md 본문 stale 표기를 Phase B에서 동시 정정. prototype 측은 `--overlay`로 두되 production 빌드에서는 `--bg-overlay` 사용 |
| 비-VOC 시맨틱     | `--status-emerald`, `--status-orange`, `--status-yellow` 보유 | 미보유                           | 미보유                                  | 필요 시 추가 (본 Wave 비대상 — /voc 영역에서 미사용 확인됨)                                                                                                                          |
| Diff highlight    | `--diff-{add,del,mod}-{bg,fg}`                                | 미보유                           | 미보유                                  | Wave 2 result-review 비대상                                                                                                                                                          |
| Dev 역할 뱃지     | `--role-dev-{fg,bg,border}`                                   | 미보유                           | 미보유                                  | Wave 2-B 비대상                                                                                                                                                                      |
| Chart 색상        | `--chart-sky` 보유                                            | `--chart-teal`, `--chart-indigo` | —                                       | 본 Wave 비대상                                                                                                                                                                       |

→ 본 Wave에서 채워야 할 토큰: §6.1 (#fff 치환) + §6.2 (raw OKLCH 토큰화) + §6.3 (status 트리오 15개 spec→CSS 동기화) + §6.4 첫 행(overlay 이름 정합).

### 6.5 Phase B 추가/동기화 토큰 통합 체크리스트 (정본)

Phase B 엔지니어가 본 Wave에서 처리해야 할 토큰 작업의 단일 체크리스트:

**A. spec → CSS 동기화 (uidesign.md → frontend/src/styles/index.css)**

- [ ] `--status-received-{bg,fg,border}` 3개
- [ ] `--status-reviewing-{bg,fg,border}` 3개
- [ ] `--status-processing-{bg,fg,border}` 3개
- [ ] `--status-done-{bg,fg,border}` 3개
- [ ] `--status-drop-{bg,fg,border}` 3개
      (값은 uidesign.md:618–632 그대로 복사)

**B. 신규 정의 (uidesign.md §10 + frontend/src/styles/index.css 동시 추가)**

- [ ] `--voc-row-hover-bg` (값: 기존 prototype list.css:L83 light-dark OKLCH)
- [ ] `--voc-row-selected-bg` (값: list.css:L90)
- [ ] `--avatar-steel`, `--avatar-teal`, `--avatar-violet` (list.css:L289–L303)
- [ ] `--mark-bg` (misc.css:L17)

**C. 정합 정정**

- [ ] uidesign.md:1062 `var(--overlay)` → `var(--bg-overlay)` 표기 정정 (stale doc fix, 코드 변경 없음)
- [ ] prototype `#fff` 4 곳 → `var(--text-on-brand)` (prototype은 reference이므로 본 Wave에서 prototype CSS 직접 수정은 선택. production 측 동등 컴포넌트 rebuild 시 토큰 사용만 강제)

**D. Phase B 게이트**

- [ ] frontend `grep -E '(#[0-9a-f]{3,8})|oklch\(|oklab\(|hsl\(|rgb\(' frontend/src/ --include='*.css' --include='*.tsx' --include='*.ts'` → 정의 파일·테스트 fixture 외 0 hit
- [ ] uidesign.md ↔ frontend index.css 토큰 명세 1:1 일치 (수동 spot-check)
- [ ] 사용자 승인

---

## §7 검증 임계 (SKIP 0 정의 + 컴포넌트별 픽셀 diff 허용치)

### 7.1 SKIP 0 정의 (categorical)

`scripts/visual-diff` harness 기준. 측정 대상: `data-pcomp` 속성을 가진 모든 노드 + **그 자손 노드**.

각 노드는 다음 3 카테고리 중 하나로 분류:

| Category             | 의미                                                                           | Wave 1.6 종료 시 허용치       |
| -------------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| **MATCH**            | prototype↔production 노드 매칭 + diff ≤ 임계                                   | 정상, 제한 없음               |
| **INTENTIONAL-DIFF** | 명시적 allowlist에 등재된 의도된 차이 (e.g., production-only loading skeleton) | allowlist에 사유 명기 시 허용 |
| **SKIP**             | 매칭 실패(prototype 또는 production only) + allowlist 미등재 / diff 임계 초과  | **0건이어야 종료 가능**       |

allowlist 위치: `scripts/visual-diff/allowlist.json` (Phase D 진입 시 신설). 항목 schema: `{node, reason, owner, expires_at}`.

### 7.2 컴포넌트별 픽셀 diff 허용치 (Phase A 잠정 — Phase B 종료 후 캘리브레이션에서 실측 갱신)

> 잠정 임계는 Wave 1.5 PR #125의 토큰 정렬 후 측정값을 기반으로 한 추정. plan §5.3 게이트 개정에 따라 Phase A에서는 표가 컴포넌트별로 채워져 있으면 통과, 실측 수치는 Phase B 종료 직후 별도 캘리브레이션 단계(prototype 1440×900 캡처 vs production 캡처 비교)에서 본 표를 갱신한다. Phase C 진입 전 본 표가 실측으로 갱신되어 있어야 한다.

| 컴포넌트             | 잠정 max diff (%) | 비고                                       |
| -------------------- | ----------------- | ------------------------------------------ |
| Sidebar (전체)       | 1.5               | 시스템 accordion 애니메이션 정지 상태 측정 |
| SidebarUserSwitcher  | 0.8               | popover 닫힘 상태만                        |
| Topbar               | 1.0               | search empty + notif badge 무 표시         |
| VocStatusFilters     | 0.5               | "전체" active 상태                         |
| VocAdvancedFilters   | 1.5               | 닫힌 상태 + 열린 상태 두 캡처              |
| VocSortChips         | 0.5               | date desc 활성                             |
| VocListHeader        | 0.8               | sort-active "등록일"                       |
| VocRow (default)     | 1.0               | hover/selected 별도 캡처 추가              |
| VocStatusBadge × 5   | 0.3               | 단독 캡처                                  |
| VocPriorityBadge × 4 | 0.3               | 단독                                       |
| VocTagPill           | 0.3               | 단독                                       |
| VocAssignee          | 0.5               | 색상 클래스 3종                            |
| VocPaginationBar     | 1.0               | 페이지 1, 중간, 마지막 3컷                 |
| VocCreateModal       | 1.5               | empty form + filled form                   |
| AttachmentZone       | 1.0               | empty + 1개 + 5개                          |
| VocReviewDrawer      | 2.0               | open 상태 + fullscreen 별도                |
| VocReviewTabs × 4    | 1.5               | 각 탭별                                    |
| NotifPanel           | 1.0               | unread 1건 + 다 읽음                       |

상태 캡처 매트릭스 (각 컴포넌트 공통):

- default / hover / focus / active / disabled / loading / empty / error
- 모든 상태가 의미 있는 컴포넌트만 해당 상태 측정 — 항목별로 Phase C 시작 시 명시.

### 7.3 추가 게이트

**색상 literal lint** — 다음 모두 0 hit (toggle: 토큰 정의 파일 `frontend/src/styles/index.css` 외):

```
grep -rE '#[0-9a-fA-F]{3,8}\b' frontend/src/ --include='*.css' --include='*.tsx' --include='*.ts' \
  --exclude-dir=__tests__ --exclude=index.css
grep -rE '\b(oklch|oklab|hsl|hsla|rgb|rgba|hwb|color)\s*\(' frontend/src/ \
  --include='*.css' --include='*.tsx' --include='*.ts' --exclude-dir=__tests__ --exclude=index.css
grep -rE 'style=\{\{[^}]*\b(color|background|border|fill|stroke)\s*:' frontend/src/ \
  --include='*.tsx' --include='*.ts' --exclude-dir=__tests__
```

(첫 두 regex는 raw value 누설, 세 번째는 inline JSX 스타일에 토큰 미경유 색상 지정 차단.)

**테스트 게이트**

- Phase C 각 rebuild 컴포넌트는 다음 셋을 동시 충족: ① unit test ≥ 1, ② visual-diff snapshot ≥ 1, ③ 영향받는 e2e spec 그린.
- Phase D 종합: vitest + Playwright e2e 전체 그린, axe-core a11y 검사 (list / drawer / modal / notif 4 화면) 통과.

**문서 게이트**

- `claude-progress.txt` + `docs/specs/plans/next-session-tasks.md` 갱신.
- 본 문서(§5 컴포넌트 맵) 처리 라벨이 모든 행 `MATCH`로 갱신됨.

---

## 부록 A. 분석에서 떠오른 Production gap (Wave 1.6 외 항목)

본 분석은 Phase A 코드 0줄 원칙을 따르므로 아래 항목은 **별도 백로그**로 기록만 한다 (`docs/specs/plans/nextgen-backlog.md`로 이전 검토):

1. URL 쿼리 동기화 미완 (sort/order 외 누락)
2. 댓글 편집 동시성 (drawer-comments.js:L93 stale 가능성)
3. 첨부 파일 영속화 (attachStore in-memory)
4. role-allow는 cosmetic — 서버측 가드 필수
5. 페이지 사이즈 viewport 변경 시 desync
6. 알림 클릭 → VOC 네비게이션 핸들러 미구현
7. 모달 첨부 미리보기 placeholder만
8. 검색 highlight `<mark>` 출력 위생 재검토
9. issue_code 형식 검증
10. 댓글 soft-delete vs hard-delete 정책

---

## 변경 로그

- 2026-05-02 신설 (Wave 1.6 Phase A 산출물). HTML/CSS/JS subagent 3종 병렬 분석 합본.
