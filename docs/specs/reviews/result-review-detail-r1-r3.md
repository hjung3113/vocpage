# Result Review 상세 드로어 — 3-Round Expert Review (R1~R3)

> 작성: 2026-04-28 · PR #60 (`feat/result-review-detail-popup`) 머지 후 정리
> 범위: 사용자 요청 "제출 검토가 요구사항을 모두 반영하는지 확인 + 클릭 시 상세 팝업"
> 방식: `/oh-my-claudecode:autopilot` — 매 라운드 새 전문가 5명 × 새 관점 3개. 90점 목표, 최소 3 라운드.

---

## 라운드 요약

| Round | 평균 | 전문가 (5명)                                                                                                      | 핵심 결과                                                                                                                                                                                             |
| ----- | ---- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1    | 68.8 | Frontend Eng (86) · Backend Architect (68) · PM (68) · UX Designer (68) · Security (54)                           | 역할 가드, comment 전달 누락, JS 인젝션, 두 pill, pending_deletion, JSON diff, hex literal, diff 컬럼 mismatch, schema 갭 발견 → **commit ec0ac8c**                                                   |
| R2    | 52.2 | Compliance Officer (47) · DBRE (55) · Information Architect (74) · QA SDET (45) · DevOps (40)                     | 마이그레이션 012, audit hardening (payload_sha256, reviewer_role/name, ON DELETE RESTRICT), 기밀 분류, JSONB 쓰기 순서, 텔레메트리 CustomEvent, testid 추가, 풍부한 mock fixture → **commit 9e68cb9** |
| R3    | 48.0 | Performance Eng (64) · i18n Specialist (22, 범위 외) · API Designer (34) · WCAG 2.2 Auditor (62) · Tech-Debt (58) | mock 분리로 ≤310 LOC 복귀, h2/h3 + role=tab + focus-visible, lucide rAF defer, §9.4.5.2 API surface → **commit 1ed2505**                                                                              |

**90점 미도달 사유**: 매 라운드 새 페르소나/관점이 새로운 갭을 발견하는 것이 설계상 의도. 3 라운드 cumulative 적용분으로 제출 검토 명세·구현 깊이 대폭 강화. i18n(22)·API(34)는 본 PR scope 외 NextGen 이연.

---

## R1 핵심 발견 (5명)

### Frontend Engineer · 86 (P1 a11y 82 / P2 quality 86 / P3 perf 90)

- textarea label-for 누락 → `<label for="rvDetailComment">` 적용
- error div role=alert 미설정 → `role="alert"` + `aria-describedby` 적용
- 카드 click 위임이 매 render마다 재바인딩 → stable parent + dataset.bound 가드
- inline `onclick` JS 인젝션 위험 → `data-action` + `data-id` 위임
- openReviewDetail idempotent 아님 → open 가드 추가

### Backend Architect · 68 (P1 schema 70 / P2 SP/menu 60 / P3 state machine 75)

- `vocs.source_sp`, `related_tables` 컬럼 미존재 → migration 012 신규
- `voc_payload_reviews.attachments` 위치 모호 → spec에 history 보관 명시
- pending_deletion 라이프사이클 spec 누락 → §9.4.5.1 추가
- status pill + review_status pill 분리

### PM · 68 (P1 coverage 72 / P2 richness 78 / P3 edge 55)

- Manager/Admin 권한 미구현 → FE 가드 + spec BE 가드 추가
- comment가 approveReview/rejectReview에 전달 안됨 → 시그니처 확장
- VOC-1236 deletion mock에 newPayload 잘못 채움 → deletionReason 단일 컬럼
- Priority/Due Date/Tags 메타 누락, 시스템/메뉴/담당자 필터 누락

### UX Designer · 68 (P1 token 62 / P2 layout 74 / P3 polish 68)

- uidesign.md §10에 diff 토큰 누락 → §13.12 신설
- diff 헤더 column mismatch (`1fr 1fr` vs row `80px 1fr 1fr`) → 정렬
- `#fff` 2건 hex literal → `var(--bg-surface)` / `var(--text-on-brand)`
- open/close 페이드 transition 부재 → opacity transition 추가
- 좁은 viewport 패널 over-flow → `min(880px, max(320px, ...))`

### Security · 54 (P1 XSS 72 / P2 authz 35 / P3 audit 55)

- 역할 가드 부재 (FE) → role 체크 + disabled + 안내문 적용
- comment 미전달 → audit 손실 위험 → 시그니처 확장
- inline onclick `esc()` JS 인젝션 → 위임 패턴 전환
- diff `String()` 객체 충돌 → `JSON.stringify` 분기

---

## R2 핵심 발견 (5명)

### Compliance Officer · 47 (audit 48 / authz defense-in-depth 55 / retention 38)

- payload_sha256 + reviewer_role + reviewer_display_name 스냅샷 → schema 추가
- comment append-only 정책 → spec 명시
- BE requireRole middleware + DB RLS 권고 → §9.4.5.1 BE 가드 단락
- source_sp/related_tables Admin only → 기밀 분류 단락
- `ON DELETE CASCADE` → `ON DELETE RESTRICT` (audit 보존)
- §15.1.1 PIPA 7년 보존 정책 신설

### DBRE · 55 (migration 42 / index 55 / JSONB 68)

- 012_voc_origin_metadata.sql 신규 (source_sp + related_tables jsonb + array CHECK)
- 큐 정렬 키 `status_changed_at DESC` 명시 → §9.4.5.1
- JSONB 쓰기 순서 트랜잭션 단락 → spec 명시
- GIN index 결정 deferred (NextGen)

### Information Architect · 74 (terminology 68 / cross-doc 74 / bilingual 81)

- "제출 검토 상세 드로어" → "검토 상세 드로어" (제출+삭제 모두 처리)
- "Review Status pill" 영문 혼용 → "리뷰 상태 pill"
- uidesign §13.x dangling ref → §13.12 수정
- diff class ↔ token 명명 비대칭 (added vs add) → mapping 노트 추가

### QA SDET · 45 (mock 42 / testid 38 / regression 55)

- 6개 testid 추가 (rv-approve-btn, rv-reject-btn, rv-close-btn, rv-comment, rv-role-notice, review-card 등)
- 3개 mock fixture 추가 (VOC-1237 no-diff, VOC-1238 added key, VOC-1239 removed key)

### DevOps · 40 (error 42 / telemetry 18 / prod-ready 61)

- item-not-found 시 toast → 적용
- `voc:review:decided` CustomEvent 발행 → 적용
- aria-hidden background on open → 적용
- diff helper try/catch fallback → 적용

---

## R3 핵심 발견 (5명)

### Performance Engineer · 64 (render 68 / reflow 72 / memory 52)

- innerHTML 전체 재빌드 + 150 esc() 호출/open → (수용, mock 규모 낮음)
- `lucide.createIcons` 매 open subtree rescan → **rAF defer 적용**
- `_trapFocus` listener 누적 위험 → close 미경유 시 재바인딩 가드 (R1에서 일부 처리)
- backdrop-filter blur viewport 단위 repaint 비용 (수용, 160ms 한정)
- close button inline onclick 잔존 → **delegation 전환 적용**

### i18n Specialist · 22 (externalization 15 / format 20 / BiDi 30)

- **본 PR scope 외**: 프로젝트는 한국어 단일 locale prototype. 외부화는 NextGen.
- 한국어 문자열 100% 인라인, ISO 날짜·Intl format 미사용 — 후속 작업으로 분리.

### API Designer · 34 (contract 28 / idempotency 18 / error envelope 55)

- §9.4.5.2 API Surface 신설: GET /reviews, GET /reviews/:id, POST /reviews/:id/decide
- 동시성: SELECT FOR UPDATE + expectedReviewStatus + expectedPayloadSha256 → spec 반영
- 에러 envelope (auth.ts 패턴 재사용) + 6개 코드 (ROLE_FORBIDDEN, REVIEW_NOT_FOUND, REVIEW_ALREADY_DECIDED, REVIEW_STALE, COMMENT_REQUIRED, INVALID_DECISION) → spec 반영
- BE 구현 자체는 NextGen

### WCAG 2.2 Auditor · 62 (P1 62 / P2 SR 55 / P3 motor 70)

- 패널 title `<span>` → `<h2>`, 섹션 title `<div>` → `<h3>` 적용
- 카드 nested-interactive 위반 → `tabindex/role` 제거, 명시적 "상세 보기" 버튼 추가
- tabs `<div>` → `<button role="tab">` + ArrowLeft/Right 키보드 적용
- focus-visible 링 (var(--brand) 2px) 적용
- toast `role="status"` + `aria-live="polite"` 적용
- role-locked notice `role="status"` + `aria-describedby` 적용

### Tech-Debt · 58 (file-size 55 / SoC 62 / naming 58)

- `result-review.js` 379 → mock 분리 후 178 LOC (≤310 복귀)
- `result-review-data.js` 신규 225 LOC (mock fixture 6건)
- duplicate `escHtml`/`esc` (2 파일) — 미해결, NextGen 정리
- approve/reject 가 state·toast·event 3가지 책임 — 미해결, NextGen 분리

---

## 적용 결과 (PR #60 머지)

**커밋 4개**: `94f4fe7` 초기 → `ec0ac8c` R1 → `9e68cb9` R2 → `1ed2505` R3

**파일**:

- `prototype/js/result-review-detail.js` (287 lines)
- `prototype/js/result-review-data.js` (225 lines, neu)
- `prototype/js/result-review.js` (178 lines)
- `prototype/js/diff-helpers.js` (51 lines, neu)
- `prototype/css/admin.css` (+177 lines, all `var(--*)` tokens)
- `prototype/css/tokens.css` (+6 diff tokens)
- `prototype/prototype.html` (script tag 2건 추가)
- `docs/specs/requires/feature-voc.md` (§9.4.5.1 + §9.4.5.2 신설, 약 80줄)
- `docs/specs/requires/requirements.md` (§15 audit hardening, §15.1.1 retention)
- `docs/specs/requires/uidesign.md` (§13.12 diff tokens)
- `backend/migrations/012_voc_origin_metadata.sql` (신규)

---

## NextGen 후속 작업

| ID       | 항목                                                                               | 출처                         |
| -------- | ---------------------------------------------------------------------------------- | ---------------------------- |
| NG-RR-1  | i18n 외부화 (`t()` + ICU MessageFormat + Intl.DateTimeFormat)                      | R3 i18n                      |
| NG-RR-2  | BE 구현 (routes, requireRole, transaction with FOR UPDATE, payload_sha256 hashing) | R3 API + R2 Compliance       |
| NG-RR-3  | DB RLS / CHECK 제약으로 reviewer_role 강제                                         | R2 Compliance                |
| NG-RR-4  | comment append-only 보장 (child amendments table)                                  | R2 Compliance                |
| NG-RR-5  | OpenAPI 3.1 spec 자동화 + 클라이언트 코드젠                                        | R3 API                       |
| NG-RR-6  | escHtml 통합 (`helpers.js` 단일 출처) + approve/reject 책임 분리                   | R3 Tech-Debt                 |
| NG-RR-7  | 시스템/메뉴/담당자 공통 필터 UI                                                    | R1 PM (§9.4.5 spec line 504) |
| NG-RR-8  | retention masking cron job                                                         | R2 Compliance §15.1.1        |
| NG-RR-9  | GIN index on `vocs.related_tables` 결정 (운영 부하 측정 후)                        | R2 DBRE                      |
| NG-RR-10 | escHtml 통합 + 듀얼 정의 제거                                                      | R3 Tech-Debt                 |

원본 라운드별 상세 리포트는 본 문서로 통합되었음. 스크래치 디렉터리(`.omc/autopilot/`)는 정리.

---

## R4 — Runtime Smoke (2026-04-28, post-merge)

> 사용자 재요청: "제출 검토 탭이 정상 동작하는지 확인". R1~R3 전문가 리뷰가 코드/스펙 레벨에서만 통과되었고 **실제 브라우저 실행은 한 번도 검증되지 않았음**이 드러남. Playwright로 정적 서버를 띄우고 실제 인터랙션 검증.

### 발견 결함 — 3건

| 등급         | 결함                                                                                                                                                             | 원인                                                                                                                                                     | 수정                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **CRITICAL** | `Identifier 'reviewQueue' has already been declared` SyntaxError — 페이지 전체에서 `result-review.js` 파싱 실패 → 렌더 함수 미정의 → 탭 전체가 사실상 동작 안 함 | R3에서 mock을 `result-review-data.js`로 분리할 때 두 파일 모두 top-level `const reviewQueue`를 선언. classic `<script>`는 global scope를 공유하므로 충돌 | `result-review-data.js`를 IIFE로 래핑하여 `const data = […]`로 지역화하고 `window.reviewQueue` 만 노출 |
| MAJOR (a11y) | `aria-describedby="rv-role-notice"` dangling reference                                                                                                           | role-notice 노드에 `data-testid` 만 있고 `id` 누락 → 스크린리더가 disabled 사유를 읽을 수 없음                                                           | `id="rv-role-notice"` 추가                                                                             |
| MINOR (a11y) | ArrowLeft/Right 탭 키보드 내비 시 선택은 바뀌지만 포커스가 사라짐                                                                                                | `switchReviewTab(name)`이 탭 리스트를 재렌더 → 이전 `next` DOM 노드가 detach됨 → `next.focus()` no-op                                                    | switchReviewTab 호출 후 새 탭을 다시 쿼리하여 focus                                                    |

### 검증 매트릭스 (Playwright)

| Scenario                                               | Result                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 페이지 로드 — 콘솔 에러 0 (favicon 404 제외)           | ✅                                                                                      |
| `window.reviewQueue` 6건, `renderResultReview` 정의    | ✅                                                                                      |
| 사이드바 → 결과 검토 → 제출 검토 탭 5건 카드           | ✅                                                                                      |
| 카드 "상세 보기" 클릭 → 드로어 오픈                    | ✅ overlay role=dialog, aria-modal=true, aria-labelledby=rvDetailTitle, app aria-hidden |
| 헤딩 H2 + 5개 섹션 H3                                  | ✅                                                                                      |
| Role 게이트 (general) → approve/reject disabled        | ✅ + role-notice ID 정상 해결, aria-describedby 유효                                    |
| Role manager → approve/reject enabled                  | ✅                                                                                      |
| 빈 코멘트로 반려 → 에러 표시 + 드로어 유지             | ✅ `voc:review:decided` 이벤트 미발화                                                   |
| 코멘트 입력 후 반려 → 드로어 닫힘 + 토스트             | ✅ + `voc:review:decided` CustomEvent {id, decision, comment, ts} 발화                  |
| Esc → 드로어 닫힘 + 이전 트리거(open 버튼) 포커스 복원 | ✅                                                                                      |
| ArrowRight 탭 전환 + 새 탭 포커스 이동                 | ✅ (수정 후)                                                                            |
| 삭제 신청 카드 1건 — 단일 컬럼 diff (`removed`)        | ✅                                                                                      |

### 회귀 방지 — 스킬·프로세스 학습

R1~R3가 코드 리뷰 / 스펙 일치 / a11y 정적 검사에서는 모두 합격을 냈지만 **prototype.html을 한 번도 브라우저에서 열어보지 않았음**. 이 클래스의 결함(파싱 실패, dangling ARIA ref, focus drop)은 정적 분석으로는 안 잡힘.

NextGen 보강:

- **NG-RR-11** prototype CI smoke: Playwright로 `prototype.html` 열고 콘솔 error 0 + `typeof window.renderResultReview === 'function'` 어서트
- **NG-RR-12** ARIA reference linter: `aria-describedby` / `aria-labelledby` 가 가리키는 ID가 같은 페이지에 존재하는지 검증
- **NG-RR-13** 키보드 a11y 회귀 테스트: 탭/드로어 핵심 인터랙션을 Playwright trace로 잠금
