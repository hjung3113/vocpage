# Progress Archive

> `claude-progress.txt`에서 분리된 완료 이력. 최신 진행은 `claude-progress.txt`만 보면 된다.
> 분리 기준: Wave 2 종료(2026-05-01)까지의 누적 이력 전체.
> 검색용 — 신규 진입 시 읽지 말고, 특정 결정/PR 컨텍스트 추적 시에만 grep.

---

## Wave 2 (2026-04-30 ~ 2026-05-01) — autopilot 모드, 5-expert 자가-금지 리뷰

**B-5 역할 토글** ✅ R3 PASS — 브랜치 `feat/b-5-role-toggle` 4 commits (R1 21ec5e4 / R2 543b871 / R3 99028af / docs f510795). 5인 평균 R1 83.4 → R2 90.5 → R3 5/5 PASS. 사이드바 .sidebar-user 클릭 → 4역할 popover, data-role-allow nav 분기, --role-dev-\* 토큰, RolePill 4 variants, ARIA menu 키보드 컨트랙트, CustomEvent('role:change'). admin=10/manager=6/dev=3/user=0 visible.

**B-3 공지 로그인 팝업** ✅ R2 PASS — 브랜치 `feat/b-3-notice-popup` 2 commits (R1 df414fe / R2 5b0bea2). 5인 평균 R1 79 → R2 88. uidesign §13.9 + feature-notice-faq §10.3.2 정합 2-panel 모달, notice-popup.js 277줄, notice*dismiss_until*<userId> 키, ARIA dialog/listbox + ↑↓/Home/End/Esc 트랩, .admin-btn-ghost variant 신설. 닫기 버튼만 dismiss 저장, X/Esc/외부클릭 = non-commit. n.level allow-list 보안 fix.

**B-4a ?mode=admin URL 토글** ✅ R2 + R2.1 — PR #76 머지된 R1을 사후 5인 리뷰 → fix 브랜치 `fix/b-4a-r2-xss-and-monkeypatch` 2 commits f3f42bd + 990f4d7. 평균 R1 architect 78 / code 68 / security 60 / critic 65 → R2 P0 7건 fix: notice-faq.js XSS escape 7건, monkey-patch 제거 → renderFaq inline mount, 슬롯 tree-exclusion 컨트랙트, isAdminMode AND canEnterAdminMode (deep-link UI flash 차단), renderModeBanner role guard, aria-pressed 의미 명확화, DRY 클래스 5종 추출, R2.1 deep-link cold-start 추가 dispatch.

**B-4b 공지/FAQ 관리 UI** ✅ R1 + R2 — 브랜치 `feat/b-4b-notice-faq-admin-ui` 2 commits. R1 98cdd4a (additive, MutationObserver 통합, NoticeAdmin 326 / FaqAdmin 241 / FaqAdminModals 207 / notice-faq-admin.css 324, FAQ_CATEGORIES mock). R1 평균 architect 77 / code REQUEST_CHANGES / security P0 2건 / verifier APPROVE / critic REVISE → R2 9fec0a6 P0 10건 fix: rgba 리터럴 제거, inline style → 클래스, regex tag-stripper → detached div+textContent, 카테고리 visible 인터랙티브 토글, manager 카테고리 read-only 탭, 액션-시점 role gate, FAQ_CATEGORIES splice in-place, Esc 닫기, setTimeout 제거. R2 verifier 98/100 APPROVE.

**B-13 VOC 드로어 고급 6종** ✅ R1 + R2 — 브랜치 `feat/b-13-drawer-advanced` 2 commits 2cb249f + 7de9eb5. drawer-advanced.js 217 / drawer-comments.js 166 / drawer-advanced.css 257, drawer.js +1 line CustomEvent. status disabled / sub-task warn / 퍼머링크 / 전체화면 esc / 댓글 편집·삭제 (5s undo) / review_status pill 4 variants. R2 P0 fix: §8.17 perma URL `/vocs/${code}` (path-based), 복사 실패 spec 카피 + window.prompt fallback, fail-closed currentUserId, 액션-시점 ownership 재검증, undo by id.

**B-15 User 가드 토스트** ✅ R1 + R2 — 브랜치 `feat/b-15-user-guard-toasts` 2 commits d6c2a5c + fd67ffa. admin-users-guards.js 165 / admin-users.css 132. D14 last-admin / D15 self-role / D16 self-deactivate. R2 P0 fix: ADMIN_USERS에 윤대표(id=6, admin) 추가하여 D14 시나리오 도달 가능.

**B-16 첨부 에러 토스트** ✅ R1 + R2 — 브랜치 `feat/b-16-attachment-error-toasts` 2 commits d6f835c + 2f9b31a. attachment-errors.js 191 / attachment-errors.css 114. 4 시나리오 (413/415/400-count/400-other), MutationObserver hook. R2 P0: spec §8.5 정합 — 5개/PNG·JPG·GIF·WebP only, escHtml identity fallback 제거하여 fail-loud.

**B-17 Dashboard 설정 패널** ✅ R1 + R2 — PR #85 머지 2026-05-01. 브랜치 `feat/b-17-dashboard-settings-panel` commits e709547 + bdbe181. dashboard-settings-panel.js 273 / dashboard-settings-panel.css 228. 슬라이드인 우측 패널, 8 widget 토글 + ↑↓, 모드 탭 (내 설정 / 기본값[Admin]), Esc/외부클릭 닫기. R2 P0 fix: admin guard / focus return / settings:changed event / a11y tabs.

**B-9 mode+role-pill 통합 검증** ✅ — 2026-05-01, PR #86 머지. `docs/specs/reviews/b-9-mode-role-integration-verification-result.md`. Playwright MCP 기반 prototype 자동 검증. S1 role admin→user / S2 deep-link+role=user / S3 admin→manager / S4 popstate 4단계 / S5 hash 보존 / S6 race 20회 — 6/6 PASS, 콘솔 에러 0건.

**Wave 2 모든 PR 머지 완료** ✅ 2026-05-01 — PR #79 docs Wave 2 / #80 B-4a R2 / #81 B-4b / #82 B-13 / #83 B-15 / #84 B-16 / #85 B-17 / #86 B-9 verification (8건 머지). b-13/b-15/b-17은 prototype.html `<head>` CSS 링크 + `<script>` 섹션에서 main 재머지 후 충돌 해결.

**Wave 3 plan 작성** ✅ 2026-05-01 — 브랜치 `docs/prototype-phase7-wave3-plan` commit 490921d. `docs/specs/plans/prototype-phase7-wave3-plan.md`. B- 기준 = Critical 4 + Major 1 + FE-mock Minor 4 + 보강 2. 3 sub-wave: W3-A VOC 본체 / W3-B Admin 공통 / W3-C Dashboard 잔여. R-4 (tsx watch) Wave 3 종료 후 단독 PR. 의도적 제외: N-03 폴링, 풀 역할×상태 매트릭스, 신규 토큰.

---

## Wave 1 (2026-04-30) — autopilot 모드, 5인 전문가 × 3관점 자가 리뷰 금지

- **P-7 D22 태그 마스터** ✅ PR #66 머지 — admin-tag-master.js 170 + modals 184 + data 161, R1 75.7 → R2 90.4 PASS, security 96 / verifier 94.7 / code 91.3 / designer 90 / critic 80. R2 잔여 MAJOR 2건: .type-badge-admin → .tm-kind-badge 분리 + empty state §13.11 토큰.
- **P-8 D23 휴지통** ✅ PR #67 머지 — admin-trash.js 298 + modals 56 + data 165, critic 73.3 — 글로벌 모달 영구 파손 CRITICAL 2건 발견 → #trConfirmBg 전용 모달 + addEventListener 격리, §9.4.7 vs §15.4 spec 충돌 callout 명시. P-7 .a-btn.primary와 머지 시 충돌 → main 정의 보존.
- **P-10 External Masters** ✅ PR #69 머지 — admin-external-masters.js 201 + data 55, R1 평균 82.3 → critic 5건 spec 정합 fix: --status-green-bg 미정의 토큰 제거, 콜드스타트 글로벌 배너화, snapshot timestamps 분리, 5분 쿨다운 카운트다운, Q5 source-independence 시연.
- **P-12 알림 유형 + Urgent 뱃지** ✅ PR #70 머지 — notif.js 59→240 확장, 5 type + Urgent flag (orthogonal), R1 82.5 → security XSS HIGH + critic spec divergence 일괄 fix: n.text 구조화 + escHtml, 위임 리스너, urgent flag-not-type, !important 12건 제거, bell 뱃지 mutually exclusive.
- **P-5 컴포넌트 인벤토리 매핑표** ✅ baseline 74% coverage, 70/94 sections demoed.
- **P-6 갭 재스캔** ✅ 29건 잔여 갭, Wave 0 12건 중 5개 영역 해소 = 42%.

---

## Phase 7 Wave 0 / Stage A·B (2026-04-27 ~ 2026-04-30)

- **Stage A-2 CSS 분할 5파일** ✅ PR #57 머지.
- **Stage A-4 JS 분할 15파일** ✅ 2026-04-27, PR #58 머지. 부모 plan은 11파일 추정이었으나 ≤300 룰 엄수로 15파일 분할 (helpers/data/voc-list/sidebar/filters/drawer-core/drawer/modal/notif/notice-faq/admin-master/admin-users/dashboard-data/dashboard-render/dashboard-actions/init). 모든 파일 ≤300 lines (max 249). 빌드 툴 추가 없이 classic `<script src>`. screenshot diff byte-identical (SHA 일치).
- **Stage B-1 Result Review 셸** ✅ 2026-04-28, 브랜치 `feat/prototype-phase7-stage-b1`. P-1.C1. result-review.js 161 + admin.css 165 append. code-reviewer 86/96/94 → fix → 94/96/95 PASS.
- **Result Review 상세 드로어 R1~R3** ✅ 2026-04-28, PR #60. 점수 추이 R1 68.8 → R2 52.2 → R3 48 (i18n 22점 OOS 제외 시 실질 개선). 변경: result-review-data.js 신규 / result-review.js (310줄 이하, role=tab + focus-visible) / result-review-detail.js (h2/h3, role=status, aria-describedby, lucide rAF) / admin.css focus-visible / feature-voc.md §9.4.5.2 API Surface / migration 012 (vocs.source_sp, vocs.related_tables). 후속 NextGen: i18n 외부화, 풀 RBAC + DB RLS, payload_sha256, OpenAPI.
- **R4 runtime smoke 결함 3건 수정** ✅ 2026-04-28, 브랜치 `docs/result-review-r1-r3-cleanup`: ① reviewQueue dup-const SyntaxError → IIFE 래핑, ② rv-role-notice id 누락 → aria-describedby dangling 해결, ③ ArrowKey 탭 전환 시 포커스 drop → re-query 후 focus.
- **결과 검토 탭 버튼 회귀 fix** ✅ 2026-04-28, 브랜치 `fix/review-tabs-button-defaults`: .review-tab의 background/border 초기화 누락 → 대시보드 .d-tab과 동일 스펙으로 정렬.
- **Stage B-2 Internal Notes 드로어** ✅ 2026-04-28, autopilot 5-expert × 3-perspective 리뷰: 1차 87.5 → fix 4건 → 2차 95.5 PASS. internal-notes.js 275 + dom-utils.js 27, drawer.js 통합, admin.css +188, role 가드 fail-closed, sr-only 접근성, window.InternalNotes 단일 네임스페이스, hex/oklch literal 0건.
- **Stage B 추가 6건 docs 갱신** ✅ 2026-04-28, 4-domain spec 인벤토리 ~125 features → 갭 6 영역 식별 → B-4 분할(B-4a/B-4b) + B-12/B-13/B-14/B-15/B-16/B-17 신설.
- **Phase 7 plan 작성** ✅ 2026-04-27, `.omc/plans/prototype-phase7.md`. prototype.html 3,980줄 → CSS 5 + JS 11 + HTML 1 분할 후 P-1~P-9 데모. HTML markup 단일 유지 합의, CSS/JS ≤300 엄수, 새 토큰 추가 금지(§13 기존만).

---

## 2026-04-27 — Cross-review 결정 + design.md 리네이밍

- **PR #54 머지** ✅ 2026-04-27.
- **관리자 UI 커버리지 리뷰** ✅ 브랜치 `docs/admin-ui-gaps`. 23개 항목 매핑 → 4개 갭 식별 → 2개 즉시 처리(GAP-1 D22 / GAP-2 D23), 2개 NextGen 이연(GAP-3 N-1 / GAP-4 N-2). 산출물: `docs/specs/reviews/admin-ui-coverage-review.md`.
- **4-도메인 cross-review** ✅ Q1~Q5 결정 + R-5/R-7/R-10/R-11/R-12 docs 패치 단일 커밋 적용.
- **design.md → uidesign.md 리네이밍** ✅ §5 비데이터 동작 규약 requirements.md §5.1로 분리.

---

## Phase G — 설계 단계 잔여 17건 일괄 마무리 (2026-04-27)

4개 에이전트 병렬(파일 도메인별). 코드 변경 없는 명세/HTML 텍스트 작업.

| 영역          | 처리                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| R-1~R-3       | dashboard 용어/세션 스토어 NOTE/globaltabs_order 결정                                                     |
| C4~C9         | prototype + spec 동기화 (일괄 체크박스, 상태 disabled, Due Date, 태그 수동 편집, indigo 제거, 1레벨 문구) |
| 권한 분기 2건 | feature-voc Priority/태그 권한 + feature-notice-faq 담당 VOC 배지                                         |
| Minor 6건     | raw hex 제거, 자동 태그 추천, 태그 규칙 모달, FAQ 카테고리 관리, 사이드바 overflow, 분포 위젯 세그먼트    |

산출물: 5개 spec/HTML 수정 (+759/-207). 잔여 → Phase 7/8 이관 (Critical 6건, FE/BE Major 11건, F1~F12, R-4, C1~C3).

---

## Phase F — D18~D21 (2026-04-26)

`/plan` consensus. 실파일 migration 미생성 — `docs/specs/plans/migration-012-draft.md`로 격리.

| 결정                     | 처리                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D18 Dev role 추가        | `users.role` enum 4종(`user/dev/manager/admin`). Dev = User + (assignee=self) 권한. requirements §2.3·§4·§14.5·§15.2                                               |
| D19 공지/FAQ 관리 진입점 | 페이지 우상단 '관리' 버튼 + `?mode=admin` URL 쿼리. Admin 탭 서브탭 폐기                                                                                           |
| D20 uidesign.md §13 신규 | Admin/Notice/FAQ/관리 진입 버튼/로그인 팝업/사이드바 카운트 12개 컴포넌트 spec. raw color 가드 추가. `--role-dev-{bg/fg/border}` + `--text-on-brand` 4종 신규 토큰 |
| D21 `assertCanManageVoc` | BE 단일 헬퍼. ownership = primary `assignee_id`만. unassigned/재배정 직후 즉시 박탈. feature-voc.md §8.4-bis                                                       |

---

## Phase E — Pre-impl 정합 (2026-04-26)

`migrations/011_pre_impl_alignment.sql` 한 파일에 P1 4건 + P2 5건 + DB Major 1건 + GAP-1 통합. Mock User seed 신규(`seeds/mock-users.sql`). 요구문서 §17에 D9~D17 추가.

| 결정                       | 처리                                           |
| -------------------------- | ---------------------------------------------- |
| D9 status_changed_at       | 컬럼 + 트리거 + partial index                  |
| D10 dashboard preset       | 1m/3m/1y/all/custom로 3중 동기화               |
| D11 Mock User FK           | seeds/mock-users.sql + db:seed:mock 스크립트   |
| D12 tag_rules              | MVP 키워드 only 명시 (스키마 변경 없음)        |
| D13 parent_id FK           | ON DELETE SET NULL                             |
| D14 사용자 초대            | AD/SSO 자동 생성 (§15.2 신규)                  |
| D15 퍼머링크               | 전체 로그인 사용자 (feature-voc.md §8.17 신규) |
| D16 서브태스크 인라인 펼침 | 기본 접힘 (feature-voc.md §9.2.2 신규)         |
| D17 길이 CHECK             | title 200자/body 64KB/comment 16KB DB CHECK    |

잔여 → `docs/specs/reviews/schema-requirements-gap.md` (P3 4건, 운영 시점 재검토).

---

## Phase D / A / B (2026-04-26)

- **Phase D 의사결정 8건** ✅ — `requirements.md §17` 기록.
- **Phase A 스키마 확정** ✅ — 마이그레이션 008(due_date), 009(subtask 인프라+트리거), 010(인덱스 19건).
- **Phase B FE/BE 기반 구조** ✅ — tokens.ts/index.css 완성, 에러포맷 통일, errorHandler/requireRole 미들웨어, VocStatus 정리, AuthUser 단일화, MockLoginPage 수정.
- PR: `fix/pre-impl-schema-infra`.
- F-4 MemoryStore → connect-pg-simple: **Phase 8-1로 defer** (2026-04-25).

---

## 다방면 전체 리뷰 (2026-04-26)

설계/DB/FE/BE 4개 전문가 병렬 리뷰, `docs/specs/reviews/project-full-review.md`. PR: `docs/multi-expert-review`.

- Critical 15건 / Major 32건 / Minor 25건 식별
- 미구현 API 38개, 미구현 FE 화면 19개, 인덱스 누락 20건
- 의사결정 필요 포인트 8건 도출

---

## Phase 7 Preflight + 벤치마크 (2026-04-26)

- **R-5·R-6** ✅ pino baseline 설치, prototype 컴포넌트 인벤토리 문서화.
- **benchmark/ 폴더 추가** ✅ prototype 전 페이지 스크린샷 24장 + INDEX.md (PR #49).

---

## Phase 3·4 문서 구조 정리 (2026-04-23)

- **docs 폴더 정리** ✅ — stale 복사본 삭제.
- **dashboard-feature.md 분리** ✅ — `requires/dashboard.md` (요구사항) + `plans/dashboard-impl.md` (구현 계획).
- **requirements.md 섹션 분리** ✅ §8·§9 → `feature-voc.md`, §10 → `feature-notice-faq.md`. 652줄 → 273줄.
- **최종 docs/specs/requires/ 구조**: requirements.md / uidesign.md / feature-voc.md / feature-notice-faq.md / dashboard.md.

---

## requirements.md 5-Expert 리뷰 + Phase 3 (2026-04-23)

- **5-Expert 체크리스트 리뷰** ✅ 43점 → 85점.
- **인터뷰 5건 완료** ✅ AD OIDC 확정 / SLA 70% / 이메일 v2 1순위 + Urgent 느낌표 / Jira 일괄 이전 / 성공 기준 3가지.
- **requirements.md 대규모 보강** ✅ §2.1 AD OIDC, §3 Node 20 + PG 16, §6.1 OIDC 상세 + 헬스체크 + CSRF, §7 이메일/Jira, §8.3 권한, §8.5 UUID rename, §8.6 Urgent 배지, §8.14 ETag 304, §11.1 SLA 70% amber, §12 성공 기준, §13 테스트 전략, §14 운영 설정.
- **인터뷰 A/B/C** ✅ AD TBD / Admin=Manager 권한 동일 / 일 10건 / 이메일 v2 / Due Date Priority별 기본값 / Jira CSV 마이그.
- **FIX-01~29 전체 완료** ✅ P0 9건 + P1 10건 + P2 7건 + P3 3건.

---

## Phase 1 디자인 통일성 (2026-04-23)

- 공지사항/FAQ/관리자 통일성 82% → 100%. CSS 변수 추가, 하드코딩 색상 제거, `.notice-badge` 시스템, `.btn-form-save/cancel` 공통 클래스.

---

## requirements.md 전체 리뷰 + 대시보드 prototype 합치기 (2026-04-23)

- 10건 수정. dashboard-feature.md 커스터마이징 MVP 단순화, `dashboard-v2-layout-editor.md` 신규.
- 대시보드 prototype.html 합치기 ✅ — GlobalTabs 3레벨, KPI 8종, 분포 도넛 4탭, 매트릭스, 히트맵, 트렌드 3선, 태그 바, 시스템/메뉴 카드, 담당자 테이블, 장기미처리 Top 10.

---

## 대시보드 v3 / v3.1 (2026-04-23)

- **dashboard-feature.md v3** 660줄 — 글로벌 필터 3단계 + 담당자 직교, 히트맵 X축 셀렉터 3종, 주간 트렌드 3선, 담당자별 처리현황, 장기 미처리 dim 탭별 전환, API systemId/menuId/assigneeId.
- **v3.1** 660→707줄 — 레벨 3 dim `[전체]` 단일, 주간 트렌드 진행중=주말 스냅샷, 담당자 라디오, GlobalTabs overflow 드롭다운, 더보기 인라인 확장, FE 상태 `globalTab` 단일화, API 2개 추가(`/menus`, `/assignees`).
- **requirements.md §11** v3.1 동기화 + **uidesign.md §11 Dashboard Components** 신규 + **§10 `--chart-*` 토큰 7종**.
