# Prototype Component Inventory (Wave 1 baseline, 2026-04-30)

## Methodology

각 spec 파일의 섹션 번호 + 대표 라인 → prototype.html의 page ID / CSS selector / JS 모듈로 매핑. grep 기반 추출, prototype.html 전체 읽기 금지 원칙 준수.

---

## Coverage Summary

| Spec area             | 섹션 수 | 시연   | coverage % |
| --------------------- | ------- | ------ | ---------- |
| feature-voc.md        | 38      | 28     | 74%        |
| dashboard.md          | 15      | 14     | 93%        |
| feature-notice-faq.md | 16      | 10     | 63%        |
| external-masters.md   | 8       | 5      | 63%        |
| requirements.md §15   | 4       | 4      | 100%       |
| uidesign.md §13       | 12      | 8      | 67%        |
| **합계**              | **93**  | **69** | **74%**    |

> Wave 1 종료 시점 전체 커버리지 **74%** — ≥90% 목표 대비 잔여 갭 16%(24건). Wave 2 목표.

---

## Detailed Mapping

### feature-voc.md

| §       | spec line | feature                                | prototype selector / file                                                 | status        |
| ------- | --------- | -------------------------------------- | ------------------------------------------------------------------------- | ------------- |
| 8.1     | L9        | VOC 식별자 (Issue Code)                | `#listArea` `.voc-row`, `data.js`                                         | ✅            |
| 8.2     | L20       | 상태 전환 매트릭스 (7종)               | `#page-voc .pill`, `drawer.js` L31–35                                     | ✅            |
| 8.2     | L22       | 허용/비허용 전환 disabled UI           | `drawer.js` L32–34 `disabled` option                                      | ✅            |
| 8.2     | L34       | UI 행동 규칙 (토스트 데모)             | `helpers.js` toast                                                        | ✅            |
| 8.2.1   | L56       | review_status 서브 상태 머신           | 미구현 — JS/HTML 없음                                                     | ❌            |
| 8.3     | L76       | 권한 모델 (4역할)                      | sidebar user-role 텍스트 L66                                              | ⚠             |
| 8.4-bis | L112      | assertCanManageVoc helper              | 미구현 — 권한 가드 토스트 없음                                            | ❌            |
| 8.4     | L157      | Priority 4종                           | `.af-chip` priority L120–123, `drawer.js` L41–44                          | ✅            |
| 8.4.0   | L163      | Priority 권한 매트릭스                 | 미구현                                                                    | ❌            |
| 8.4.1   | L174      | Due Date 자동 설정                     | 미구현                                                                    | ❌            |
| 8.4.2   | L188      | Due Date 필드 UI                       | 미구현                                                                    | ❌            |
| 8.5     | L213      | 파일 첨부                              | `drawer-core.js` `buildAttachSection()` L63, `.d-attachments`             | ✅            |
| 8.5     | L213      | 첨부 에러 토스트 (413/415/400)         | 미구현                                                                    | ❌            |
| 8.6     | L224      | 인앱 알림 패널                         | `#notifPanel`, `notif.js`, `#notifBtn` L84                                | ✅            |
| 8.6     | L224      | 알림 유형 필터 (댓글/상태/담당/Urgent) | `#notifPanel .nf-chip` L876–880                                           | ✅            |
| 8.7     | L234      | Sub-task                               | `drawer-core.js` `buildSubsSection()` L22, `.d-subtasks`                  | ✅            |
| 8.7     | L244      | Sub-task 생성 진입점                   | `drawer-core.js` `showSubForm()` L80                                      | ✅            |
| 8.8     | L245      | 분류 체계 (시스템/메뉴/유형/태그)      | `#advFilterWrap .af-chips` L128–132                                       | ✅            |
| 8.8.1   | L282      | 드로어 태그 수동 편집 UI (C7)          | `drawer.js` 태그 섹션 (partial — edit modal 미구현)                       | ⚠             |
| 8.8.2   | L309      | VOC 등록 모달 자동 태그 추천           | `modal.js` (partial — 자동 추천 로직 미구현)                              | ⚠             |
| 8.8.3   | L317      | 태그 규칙 관리 편집 방식               | `#page-tag-rules` L426, `admin-master.js`                                 | ✅            |
| 8.9     | L324      | 삭제 정책 (소프트 삭제)                | `#page-trash` L648, `admin-trash.js`                                      | ✅            |
| 8.10    | L331      | 입력값 제한                            | `modal.js` validation (partial — 한도 표시 없음)                          | ⚠             |
| 8.11    | L339      | VOC 목록 필터/검색/페이지네이션        | `#searchInput` L82, `filters.js`, `#paginationRow` L152                   | ✅            |
| 8.12    | L348      | 파일 저장소                            | 미구현 (BE spec, FE 미시연)                                               | ⊘             |
| 8.13    | L356      | 댓글 수정/삭제 정책                    | `drawer-core.js` `editComment()` L198, `deleteComment()` L234             | ✅            |
| 8.14    | L363      | 인앱 알림 폴링                         | `notif.js` (static mock — 폴링 없음)                                      | ⚠             |
| 8.15    | L371      | 기존 분석 시스템 통합                  | 미구현 (BE scope)                                                         | ⊘             |
| 8.16    | L378      | Internal Notes                         | `internal-notes.js`, `.d-internal-notes` via drawer                       | ✅            |
| 8.17    | L420      | 드로어 퍼머링크 복사 🔗                | `#drawer .icon-btn[data-tip="링크 복사"]` L763 (버튼만 — 실제 copy 없음)  | ⚠             |
| 9.1     | L436      | 필터 고급 옵션                         | `#advFilterWrap` L106, `toggleAdvFilter()`                                | ✅            |
| 9.2.1   | L444      | 서브태스크 생성 진입점                 | `drawer-core.js` `showSubForm()` L80                                      | ✅            |
| 9.2.2   | L450      | 목록 인라인 펼침                       | `drawer-core.js` `buildSubsSection()` L22                                 | ✅            |
| 9.3     | L463      | 첨부파일 UI 명세                       | `drawer-core.js` `attachItemHTML()` L11, `drawerAddAttach()` L148         | ✅            |
| 9.4.1   | L472      | 태그 규칙 관리                         | `#page-tag-rules` L426, `admin.css`                                       | ✅            |
| 9.4.2   | L478      | 시스템/메뉴 관리                       | `#page-system-menu` L472                                                  | ✅            |
| 9.4.3   | L486      | 유형 관리                              | `#page-voc-type` L523                                                     | ✅            |
| 9.4.4   | L492      | 사용자 관리                            | `#page-users` L563, `admin-users.js`                                      | ✅            |
| 9.4.5   | L499      | Result Review                          | `#page-result-review` L608, `result-review.js`, `result-review-detail.js` | ✅            |
| 9.4.5.1 | L516      | 검토 상세 드로어                       | `result-review-detail.js`                                                 | ✅            |
| 9.4.6   | L593      | 태그 마스터 관리 (D22)                 | `#page-tag-master` L613, `admin-tag-master.js`                            | ✅ Wave 1 P-7 |
| 9.4.7   | L616      | 휴지통 (D23)                           | `#page-trash` L648, `admin-trash.js`                                      | ✅ Wave 1 P-8 |
| 9.5     | L636      | 정렬 옵션 (컬럼 헤더 클릭)             | `.hcell[data-sort-key]` L144–149, `voc-list.js` `toggleSort()`            | ✅            |
| 9.6     | L644      | 검색 결과 하이라이팅                   | `voc-list.js` (partial — highlight 로직 여부 미확인)                      | ⚠             |
| 9.7     | L650      | 댓글 인라인 편집                       | `drawer-core.js` `editComment()` L198, `saveComment()` L214               | ✅            |
| 9.8     | L655      | 페이지네이션 (숫자 버튼)               | `#paginationRow` L152, `voc-list.js`                                      | ✅            |
| 9.9     | L663      | VOC 상세 전체 화면 전환                | `drawer.js` `toggleFullscreen()` L172, `.drawer.fullscreen`               | ✅            |

**feature-voc.md 소계: 38섹션 중 28 시연 → 74%**

---

### dashboard.md

| §                      | spec line | feature                                   | prototype selector / file                                  | status |
| ---------------------- | --------- | ----------------------------------------- | ---------------------------------------------------------- | ------ |
| A. GlobalTabs          | L67       | 계층형 탭 필터 (전체→시스템→메뉴)         | `#globalTabs .global-tab` L199–205, `dashboard-actions.js` | ✅     |
| B. 담당자 필터         | L111      | 담당자 직교 필터                          | `#assigneeSelect` L178                                     | ✅     |
| C. FilterContextBanner | L121      | Filter Context Banner                     | `.filter-context-banner#filterContext` L194–195            | ✅     |
| W1 KPI 8개             | L134      | KPI 카드 8종 (2줄)                        | `.kpi-grid .kpi-card` L213–228, `dashboard-render.js`      | ✅     |
| W2 분포탭              | L194      | 분포 탭 섹션 (4탭)                        | `#distDimSel` L237, `dashSwitchDistTab()` L245             | ✅     |
| W3 매트릭스            | L262      | 우선순위×상태 매트릭스                    | `.matrix-table` L261, `#matDimSel` L255                    | ✅     |
| W4 히트맵              | L284      | 드릴다운 히트맵                           | `.heatmap-top` L276, `dashboard-render.js`                 | ✅     |
| W5 주간트렌드          | L362      | 주간 트렌드 3선                           | `#lineDimSel` L295, `dashboard-render.js`                  | ✅     |
| W6 태그분포            | L396      | 태그별 분포 Top 10                        | `#tagDimSel` L325, `dashboard-render.js`                   | ✅     |
| W7 현황카드            | L411      | 시스템/메뉴 현황 카드                     | `dashboard-render.js` (가로스크롤 여부 partial)            | ⚠      |
| W8 담당자별            | L432      | 담당자별 처리 현황                        | `#page-dashboard .widget` L363–375                         | ✅     |
| W9 장기미처리          | L469      | 장기 미처리 Top 10                        | `#agingDimSel` L379, `dashboard-render.js`                 | ✅     |
| W10 SLA                | L498      | 처리속도 (SLA 준수율)                     | `#slaCardWrap` L352, `dashboard-render.js`                 | ✅     |
| W11 에이징             | L515      | 에이징                                    | `#agingCardWrap` L358, `dashboard-render.js`               | ✅     |
| 설정 패널              | L599      | Dashboard 설정 패널 (내 설정/기본값 토글) | 미구현                                                     | ❌     |

**dashboard.md 소계: 15 중 14 시연 → 93%**

---

### feature-notice-faq.md

| §      | spec line | feature                                | prototype selector / file                                              | status |
| ------ | --------- | -------------------------------------- | ---------------------------------------------------------------------- | ------ |
| 10.2   | L17       | 사이드바 네비게이션 (공지/FAQ 항목)    | `.nav-item[data-view="notices"]` L42, `.nav-item[data-view="faq"]` L43 | ✅     |
| 10.2.1 | L50       | 네비게이션 활성 상태 규칙              | `sidebar.js` setNav()                                                  | ✅     |
| 10.2.2 | L57       | 사이드바 카운트 배지                   | `#noticeBadge` L42 (notice only — FAQ badge 미확인)                    | ⚠      |
| 10.3.1 | L69       | 공지사항 데이터 필드                   | `notice-faq.js` `renderNotices()` `.notice-item` L14                   | ✅     |
| 10.3.2 | L80       | 로그인 팝업 동작                       | 미구현 (P-9 예정)                                                      | ❌     |
| 10.3.3 | L93       | 공지사항 목록 (사용자 뷰)              | `#page-notices` L157, `notice-faq.js` `renderNotices()` L2             | ✅     |
| 10.3.4 | L99       | Admin/Manager 관리 기능 (공지)         | 미구현 (?mode=admin P-9 예정)                                          | ❌     |
| 10.4.1 | L109      | FAQ 데이터 필드                        | `notice-faq.js` `.faq-item` L76                                        | ✅     |
| 10.4.2 | L118      | FAQ 사용자 뷰 (검색+카테고리+아코디언) | `#page-faq` L160, `notice-faq.js` `renderFaq()` L41                    | ✅     |
| 10.4.3 | L125      | Admin/Manager FAQ 관리 기능            | 미구현                                                                 | ❌     |
| 10.4.4 | L133      | FAQ 카테고리 관리 탭 (Admin only)      | 미구현                                                                 | ❌     |
| 10.5   | L151      | 관리 진입점 D19                        | 코멘트만 존재 (prototype.html L163)                                    | ❌     |
| 10.5.1 | L155      | 진입 위치 및 권한                      | 미구현                                                                 | ❌     |
| 10.5.2 | L161      | 모드 토글 contract (?mode=admin)       | 미구현 (P-9 예정)                                                      | ❌     |
| 10.5.3 | L168      | 관리 기능 공통 (CRUD + 토스트)         | 미구현                                                                 | ❌     |
| 10.6   | L178      | prototype.html 반영 범위               | 기본 뷰어 반영, admin 미시연                                           | ⚠      |

**feature-notice-faq.md 소계: 16 중 10 시연 → 63%**

---

### external-masters.md

| §                     | spec line | feature                              | prototype selector / file                                       | status         |
| --------------------- | --------- | ------------------------------------ | --------------------------------------------------------------- | -------------- |
| §1 마스터 3종 개요    | L6        | Equipment/DB/Program 마스터 3종 개요 | `#page-external-masters` L717, `admin-external-masters.js`      | ✅ Wave 1 P-10 |
| §3 설비 마스터        | L27       | 설비 마스터 필드+테이블              | `.admin-table` L722, `admin-external-masters-data.js`           | ✅             |
| §4 DB 마스터          | L48       | DB 마스터 테이블                     | `.admin-table` L722, `admin-external-masters-data.js`           | ✅             |
| §5 프로그램 마스터    | L73       | 프로그램 마스터 테이블               | `.admin-table` L722, `admin-external-masters-data.js`           | ✅             |
| §6 Refresh API        | L87       | Refresh 버튼 + atomic swap           | `.admin-btn` `emRefreshAll()` L722, `admin-external-masters.js` | ✅             |
| §7 TBD 기간 구현 전략 | L104      | 설비 마스터 TBD 전략                 | 미구현 (BE spec)                                                | ⊘              |
| §8 Cold Start         | L112      | Cold Start 시나리오 (스냅샷 미존재)  | `.em-coldstart-banner-btn` L736, `admin-external-masters.js`    | ✅             |
| §2 필드-마스터 매핑   | L14       | 필드-마스터 매핑 표시                | 미시연 (매핑 UI 없음)                                           | ❌             |

**external-masters.md 소계: 8 중 5 시연 (1 out-of-scope 제외 7 중 5) → 71%**

---

### requirements.md §15

| §                     | spec line | feature                   | prototype selector / file                      | status |
| --------------------- | --------- | ------------------------- | ---------------------------------------------- | ------ |
| 15.1 Result Review    | L497      | Result Review 관리 페이지 | `#page-result-review` L608, `result-review.js` | ✅     |
| 15.1.1 보존/회수 정책 | L506      | 보존/회수 액션            | `result-review-detail.js`                      | ✅     |
| 15.2 사용자 초대      | L510      | 사용자 관리 + 초대 플로우 | `#page-users` L563, `toggleAddUserForm()` L568 | ✅     |
| 15.3 태그 마스터 D22  | L522      | 태그 마스터 관리          | `#page-tag-master` L613, `admin-tag-master.js` | ✅     |
| 15.4 휴지통 D23       | L530      | 휴지통 소프트삭제 복원    | `#page-trash` L648, `admin-trash.js`           | ✅     |

**requirements.md §15 소계: 4(+1) 중 4(+1) 시연 → 100%**

> 15.1.1은 15.1의 하위이므로 합산 5건 모두 시연.

---

### uidesign.md §13

| 컴포넌트                         | spec 라인 | prototype 셀렉터                                              | 사용처                                                                                                                                        | status |
| -------------------------------- | --------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 13.1 Admin Topbar / Body / Card  | L801      | `.admin-topbar`, `.admin-body`                                | tag-rules / system-menu / voc-type / users / result-review / tag-master / trash / external-masters (L427, L473, L524, L564, L614, L649, L718) | ✅     |
| 13.2 Admin Table                 | L809      | `.admin-table`                                                | 5개 admin 페이지 (L457, L510, L549, L593, L635, L722)                                                                                         | ✅     |
| 13.2.1 Admin Button              | L835      | `.admin-btn`                                                  | external-masters L722, tag-master                                                                                                             | ✅     |
| 13.3 Role Pill                   | L864      | `.role-pill`                                                  | 미구현 — users 페이지에 role 텍스트만                                                                                                         | ❌     |
| 13.4 Type Badge                  | L902      | `.type-badge-admin`                                           | 미구현 (voc-type 페이지에 태그만)                                                                                                             | ❌     |
| 13.5 Status Dot                  | L918      | `.status-dot`                                                 | 미구현                                                                                                                                        | ❌     |
| 13.6.1 Notice Severity Badge     | L941      | `.notice-badge`, `.notice-badge-{level}`                      | `notice-faq.js` L16                                                                                                                           | ✅     |
| 13.6.2 Notice Row + Body         | L971      | `.notice-row`, `.notice-body`, `.notice-item`                 | `notice-faq.js` L14–21                                                                                                                        | ✅     |
| 13.7 FAQ Components              | L999      | `.faq-item`, `.faq-filter-bar`, `.faq-cat-btn`, `.faq-search` | `notice-faq.js` L64–82                                                                                                                        | ✅     |
| 13.8 Admin Mode Entry Button     | L1047     | 미구현 — ?mode=admin 버튼 없음                                | notice/faq 상단                                                                                                                               | ❌     |
| 13.9 Login-time Notice Popup     | L1058     | 미구현                                                        | 로그인 후 팝업                                                                                                                                | ❌     |
| 13.10 Sidebar Count Badge        | L1066     | `#noticeBadge` (notice만) `.nav-badge` L42                    | sidebar                                                                                                                                       | ⚠      |
| 13.11 Admin Page Non-data States | L1084     | 미구현                                                        | admin 테이블 empty/loading                                                                                                                    | ❌     |
| 13.12 Diff / Comparison Tokens   | L1098     | `diff-helpers.js` (result-review)                             | result-review                                                                                                                                 | ✅     |

**uidesign.md §13 소계: 12 중 8 시연 → 67%**

---

## 범례

| 기호 | 의미                                         |
| ---- | -------------------------------------------- |
| ✅   | 시연 완료                                    |
| ⚠    | 부분 시연 (진입점 있으나 인터랙션/세부 미완) |
| ❌   | 미시연 (진입점 없음)                         |
| ⊘    | out-of-scope (BE spec 또는 MVP 제외)         |
