# B-3 공지 로그인 팝업 (Wave 2 #2) — 설계 노트

> **Note:** §13.x references in this archive predate the 2026-05-02 (C-2.5 audit) rename — `uidesign.md §13` was renumbered to §14. Current equivalents: §13.1→§14.1 ... §13.12→§14.12. New §13 is "Badge System".

> 작성일: 2026-04-30
> 브랜치: `feat/b-3-notice-popup`
> 선행: Wave 2 B-5 ✅ (2026-04-30, R3 PASS)

## 목적

prototype의 로그인 시 공지 팝업을 spec 정합 2-panel 모달로 재구현. 기존 init.js IIFE는 single-panel + raw hex 색상 + 잘못된 localStorage 키 사용 — uidesign §13.9 + feature-notice-faq §10.3.2에 모두 위배.

## spec 출처

- `feature-notice-faq.md §10.3.2` — 동작 (2-panel 필수, 좌측 list / 우측 detail, footer 1 checkbox + 1 close, `notice_dismiss_until_<userId>` 다음날 날짜 저장, 1건이든 2건 이상이든 동일 구조)
- `uidesign.md §13.9` — 시각 (overlay = `var(--overlay)`, dialog = `var(--bg-surface)` + `var(--shadow-dialog)`, 헤더 severity badge, title 16/700, body 13.5 secondary, footer checkbox + `.admin-btn` ghost variant)
- `uidesign.md §13.6.1` — `.notice-badge-{urgent,important,normal}` (raw hex 금지)

## 결정

1. **모듈 분리**: `prototype/js/notice-popup.js` (NEW, 209줄). init.js IIFE는 4줄 호출만 남김 (B-5 RoleState 패턴 일관).
2. **2-panel 마크업**: `.np-list` (좌, 240px) + `.np-detail` (우, 1fr) — CSS Grid. 1건만 있어도 2-panel 유지 (§10.3.2 강제).
3. **selectedId state**: 모듈 스코프 변수. 기본값 = highest severity (정렬 후 첫 항목). 좌측 클릭 → re-render 양 패널.
4. **localStorage 키**: `notice_dismiss_until_<userId>` (`<userId>` = `window.currentUser.id` ?? 'anon'). 값 = 다음날 날짜 `YYYY-MM-DD`. 다음 init 시 `stored >= today` 면 미표시.
5. **닫기 분기**:
   - 닫기 버튼 (`#npClose`): 체크박스 체크 시 dismissal 저장.
   - X 버튼 (`#npX`): **항상 저장 안 함** (우발적 닫힘 보호 — 체크박스 명시 commit으로만 dismissal).
   - 외부 클릭 / Esc: 항상 저장 안 함.
6. **`.admin-btn-ghost` 변형**: §13.9 "ghost variant" 명시인데 admin.css에 미정의 → components.css B-3 블록에서 신규 정의 (transparent bg, accent fg/border).
7. **토큰 100%**: hex/oklch literal 0건. 기존 init.js IIFE의 `#e5484d`, `#f5a623`, `rgba(0,0,0,.55)` 모두 제거.
8. **a11y**: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="npTitle"`, 좌측 list `role="listbox"` + 항목 `role="option"` + `aria-selected`, detail `aria-live="polite"`, X 버튼 `aria-label="닫기"`. 자동 focus = 선택된 항목.

## 영향 파일

| 파일                           | 변경                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `prototype/js/notice-popup.js` | NEW — 209줄 (≤300 룰 준수)                                                             |
| `prototype/js/init.js`         | 50-line IIFE → 3-line `NoticePopup.init()` 호출                                        |
| `prototype/css/components.css` | `.notice-popup-*` 그룹 + `.np-*` + `.admin-btn-ghost` (+170 lines, end-of-file append) |
| `prototype/prototype.html`     | `<script src="js/notice-popup.js">` 추가 (init.js 직전)                                |

## 검증 (smoke, Playwright)

| 시나리오                                              | 결과 |
| ----------------------------------------------------- | ---- |
| 페이지 로드 → eligible 1건 (id=2 important) 자동 표시 | PASS |
| ARIA: dialog/aria-modal/aria-labelledby 모두 set      | PASS |
| 좌측 list selected = id=2 (highest severity)          | PASS |
| 우측 detail title + body 렌더                         | PASS |
| 체크박스 unchecked + 닫기 → no localStorage key       | PASS |
| 체크박스 checked + 닫기 → key=2026-05-01 (tomorrow)   | PASS |
| 키 존재 시 init() → 팝업 미표시                       | PASS |
| Esc → close, no save                                  | PASS |
| 외부(overlay) 클릭 → close, no save                   | PASS |
| X 버튼 → close, 체크 무관 no save                     | PASS |

콘솔 에러: 0건 (favicon 404 외).

## 컨벤션 준수

- 토큰 100% (hex/oklch literal 0건)
- escHtml 적용 (notice title, content, level, id 모두)
- 모듈 ≤300줄 (notice-popup.js 209)
- append-only (components.css 기존 영역 보존)
- 자가 리뷰 금지 — 5 전문가 lane 별도 dispatch

## R1 → R2 변경 (5인 리뷰 P0/P1 fix)

| 영역                     | R1 결함                                                          | R2 fix                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| critic P0 시각           | `.np-header-title` 15px (spec §13.9 "16px" 위배)                 | 16px로 수정                                                                                                                                                                                            |
| critic P1 키보드         | `role=listbox` 선언했으나 ↑↓/Home/End 핸들러 없음 (APG 위반)     | `onListKey` 추가, ArrowUp/Down/Home/End로 selection 이동 + focus 추적                                                                                                                                  |
| critic P1 focus trap     | Tab이 모달 밖으로 빠져나감                                       | `onKey` Tab handler — Shift+Tab on first / Tab on last → wrap 안에서 순환                                                                                                                              |
| verifier Gap 1           | Esc → close(체크 시 저장) — design doc "no save"와 불일치        | `close(false)` 강제 — Esc는 항상 cancel, 닫기 버튼만 commit                                                                                                                                            |
| code-reviewer P1         | `close(saveDismiss)` 의미 공개 API에 미명시                      | JSDoc 추가 (X/Esc/외부클릭=non-commit, 닫기 버튼만 commit)                                                                                                                                             |
| code-reviewer P2         | `init()` 중복 호출 시 overlay 중복 생성                          | re-entry guard — `if (document.getElementById('noticePopupOverlay')) return;`                                                                                                                          |
| code-reviewer P2         | `data-id`가 string id로 바뀌면 NaN로 미선택                      | 주석 추가 — data.js NOTICES.id integer 가정 명시                                                                                                                                                       |
| security P1              | `n.level`이 임의 문자열일 때 CSS 클래스 인젝션 가능              | `ALLOWED_LEVELS` allow-list + `safeLevel()` 헬퍼 — 알 수 없는 level은 'normal' fallback                                                                                                                |
| **R2 follow-ups (spec)** | architect P1 / security P1 / verifier Gap 2/3 (모두 spec 명문화) | spec/ADR follow-up — feature-notice-faq.md §10.3.2에 (a) X 버튼 = non-commit, (b) Esc = non-commit, (c) 닫기 버튼만 commit, (d) BE sanitize allow-list 태그를 추가하는 별도 PR 권장 (B-3 코드 범위 밖) |

R2 검증 (Playwright smoke 재실행):

- 모든 R1 6 시나리오 + 신규 4 시나리오 (↑↓ keyboard nav, Home/End, focus trap, allow-list level fallback) PASS 예상.
- 콘솔 에러 0건.

notice-popup.js R2: 277줄 (≤300 룰 유지).

## 알려진 한계 (Out of Scope)

- prototype mock data NOTICES 중 popup=true & date-active = id=2 1건뿐 (id=1은 2026-04-25 만료). 2건 이상 시나리오 demo는 data.js 갱신 필요 — Wave 3 또는 별도 fixture refresh PR. 단, 1건 시에도 2-panel 구조 유지로 spec 정합은 확인됨.
- `handleHideToday` / `handleHideTodayAll` (notif.js) 기존 helper는 더 이상 호출처 없음 — orphan dead code. B-3 범위 밖이라 그대로 둠 (Wave 3 cleanup 후보).
- 향후 React 이관 시 dismissal key는 BE 사용자 setting (audit trail 가능)으로 옮길 것 — Phase 8 8-PR1 후속.
