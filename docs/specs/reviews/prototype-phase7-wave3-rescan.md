# Phase 7 Wave 3 — 갭 재스캔

> 작성일: 2026-05-01
> 목적: Wave 3 종료 시점 prototype ↔ spec 갭 0 잔여 확인

---

## 1. VOC 도메인

| 갭 ID | 분류     | spec                  | prototype 셀렉터/파일                                                                                                                                                                                                                                                                                                                                                                                                              | 상태 |
| ----- | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| C-02  | Critical | feature-voc §8.4.1/2  | `drawer.js` `calcDueDate()` offsets {7,14,30,90} + `openDrawer()` priority→due_date 자동 갱신 + `drawer-duedate-*` input                                                                                                                                                                                                                                                                                                           | ✅   |
| N-01  | Minor    | feature-voc §8.8.2    | `modal.js` `KEYWORD_MAP` + `.tag-recommend-chips` + debounce 추천 로직                                                                                                                                                                                                                                                                                                                                                             | ✅   |
| N-02  | Minor    | feature-voc §8.10     | `dom-utils.js` `attachCharCount(input, max)` + 90% amber / 초과 red + submit disabled. 적용: modal title/body, drawer comment, internal-notes                                                                                                                                                                                                                                                                                      | ✅   |
| N-04  | Minor    | feature-voc §9.6      | `voc-list.js` `escapeRegex()` → `<mark class="search-highlight">` 래핑. `css/layout/list.css` `.search-highlight { background: var(--brand-soft) }`                                                                                                                                                                                                                                                                                | ✅   |
| N-06  | Minor    | feature-voc §9.5      | `voc-list.js` `.sort-chip` + `sort-chip--active` + `sort-chip-icon`. URL sync `?sort=&order=`. spec §9.5 "테이블 헤더" → "정렬 칩" 동시 수정 완료                                                                                                                                                                                                                                                                                  | ✅   |
| N-07  | Minor    | feature-voc §8.5      | `drawer-core.js` `buildAttachSection()` `.att-zone` + `.att-drop` + `.att-grid` + drag&drop 핸들러. 5/5 도달 시 drop disabled. `processAttachFiles()` 에러 통합                                                                                                                                                                                                                                                                    | ✅   |
| —     | 보강     | feature-voc §8.3/§8.4 | `drawer.js` `applyDrawerUserReadonly(vocId)` — User role 시 `.comment-input--readonly` + `.d-readonly-notice` + `.att-zone--readonly` + status/assignee select disabled (`.select--readonly`) + comment edit/delete icon-btn hidden + sub-task add row hidden + internal-notes write area hidden. `drawer-core.js` submitComment/editComment/deleteComment/confirmSub early-return for User role. role:change 이벤트 시 전체 복원. | ✅   |

---

## 2. Dashboard 도메인

| 갭 ID | 분류  | spec                           | prototype 셀렉터/파일                                                                                                                                                                                                                                                                                                                                                                                                                      | 상태       |
| ----- | ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| N-05  | Minor | dashboard.md §7 (W7 현황 카드) | `dashboard-states-demo.js` `renderW7Cards()` + `#w7Cards` `.w7-card` (7개, 148px) + `overflow-x:auto` + `scroll-snap-type:x proximity`. 화살표 버튼 `#w7ScrollLeft/#w7ScrollRight` (5+ 카드 시 노출). `css/admin/dashboard-overview.css` `.w7-scroll-wrap` `.w7-cards` `.w7-card`. **PARTIAL**: 정적 mock 7채널 — tab-aware swap (시스템 탭→메뉴 카드, dashboard.md §7) 은 React 이관 시 구현. 현재 prototype은 N-05 시각적 스크롤만 시연. | ⚠️ PARTIAL |
| —     | 보강  | dashboard.md W2~W11 빈 상태    | `dashboard-states-demo.js` `applyAllWidgetsState()` + `?demo` 게이트 뒤 `.dash-state-toggle` (정상/빈/오류). `.widget-empty` (SVG + "데이터 없음", `role=status`, `aria-live=polite`). `.widget-error` (배너 + 재시도, `role=alert`). `WIDGET_SECTIONS` 11개 위젯 (분포/매트릭스/트렌드/태그/처리속도/에이징 각각 분리, `data-dash-widget` 속성 기반)                                                                                      | ✅         |

---

## 3. Admin 도메인

| 갭 ID | 분류     | spec                | prototype 셀렉터/파일                                                                                                                                                                                                           | 상태 |
| ----- | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| C-10  | Critical | uidesign §13.4      | `css/components/badges.css` `.type-badge-admin` / `.type-kind-badge` — 4 variant (system/menu/issue-kind/external). `admin-master.js` `renderVocTypes()` type 셀에 적용                                                         | ✅   |
| C-11  | Critical | uidesign §13.5      | `css/components/badges.css` `.status-dot` (8px 원형) — `.on` green / `.off` gray / `.archived` red / `.pending` amber. admin-users.js / admin-tag-master.js / admin-master.js / admin-trash.js 적용                             | ✅   |
| C-14  | Critical | uidesign §13.11     | `admin-states-demo.js` — 7개 admin 페이지에 `.admin-state-toggle` 삽입 (`?demo` 게이트). `.admin-empty` (SVG + CTA) / `.admin-loading` (shimmer skeleton 5행) / `.admin-error` (재시도 버튼). `css/components/admin-states.css` | ✅   |
| M-05  | Major    | external-masters §2 | `admin-external-masters.js` `.em-field-map-section` — VOC 필드↔외부 마스터 표 (equipment_id/program_code/db_code × source key/갱신주기). 읽기 전용                                                                              | ✅   |

---

## 4. Notice-FAQ 도메인

| 갭 ID | 분류      | spec                           | prototype 셀렉터/파일                                                                                                              | 상태   |
| ----- | --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| —     | 기존 구현 | feature-notice-faq §10.3/§10.4 | `notice-faq.js` `renderNotices()` / `renderFAQs()` — 목록/상세/검색/필터 시연. `notice-admin.js` / `faq-admin.js` 관리 페이지 시연 | ✅     |
| —     | 기존 구현 | feature-notice-faq §10.5       | `notice-popup.js` `.notice-popup-overlay` — 공지 팝업 (최초 진입 시 1회). 닫기/오늘 하루 안 보기                                   | ✅     |
| N-03  | Minor     | feature-notice-faq §10.6       | **OOS** — 알림 폴링 (BE timer/SSE 의존, mock 가치 낮음). spec 한 줄 명시로 충분                                                    | ⭕ OOS |

---

## 결론

- **Critical**: 0
- **Major**: 0
- **Minor**: 0
- **OOS (의도적 제외)**:
  - N-03 알림 폴링 (BE/timer 의존, mock 시연 가치 낮음 — spec §10.6 명시로 충분)
  - N-05 tab-aware W7 swap (시스템 탭→채널별 카드 교체, dashboard.md §7): 정적 7채널 mock으로 스크롤 UI만 시연. React 이관 시 구현 예정.

Wave 3 전체 갭(C-02/C-10/C-11/C-14/M-05/N-01/N-02/N-04/N-05/N-06/N-07 + 보강 3건) 모두 prototype에서 시연 가능한 수준으로 구현 완료.
R2 batch (F1~F11): drawer User 권한 게이트 확장, raw oklch 제거, data-dash-widget 속성 기반 11위젯 분리, a11y prefers-reduced-motion, drawer.css 분리 (≤500줄), att-zone HTML 복원, scroll listener 중복 방지.
React 이관 시 재해석 없이 1:1 매핑 가능한 정답집 기준 충족.
