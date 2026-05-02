# B-4a `?mode=admin` URL 토글 (Wave 2 #3) — 설계 노트

> **Note:** §13.x references in this archive predate the 2026-05-02 (C-2.5 audit) rename — `uidesign.md §13` was renumbered to §14. Current equivalents: §13.1→§14.1 ... §13.12→§14.12. New §13 is "Badge System".

> 작성일: 2026-04-30
> 브랜치: `feat/b-4a-mode-admin-url`
> 상태: **R1 코드 완료, 5인 리뷰 미진행 (다음 세션)**
> 선행: Wave 2 B-5 ✅ R3 PASS / B-3 ✅ R2 PASS

## 목적

prototype의 공지/FAQ 페이지에 D19/ADR #4의 `?mode=admin` URL 토글 컨트랙트와 §13.8 Admin Mode Entry Button을 구현. B-4b (공지/FAQ 관리 UI)의 전제조건.

## spec 출처

- `feature-notice-faq.md §10.5.2` — 토글 contract (URL 쿼리, deep-link/뒤로가기/새로고침 보존, 인라인 관리 액션, 코드 분할)
- `uidesign.md §13.8` — Admin Mode Entry Button (admin/manager만 DOM 노출, .admin-btn ghost, gear 아이콘, 우측 정렬)

## 결정

1. **모듈 분리**: `prototype/js/admin-mode.js` (NEW, ~165줄). IIFE → `window.AdminMode` 공개 API: `init / isAdminMode / setMode / toggleMode / canEnterAdminMode / renderEntryButton / renderModeBanner`.
2. **URL 표현**: `?mode=admin` 존재 ↔ 관리 모드 ON. 부재 ↔ 읽기 모드 (default). `URL.searchParams` API + `history.pushState`로 토글.
3. **이벤트**: 모드 변경 시 `admin-mode:change` CustomEvent 발화 (detail = `{mode, page}`). notice-faq.js가 이 이벤트로 active page 재렌더.
4. **Role gate**: `canEnterAdminMode()` 가 admin/manager만 true. `renderEntryButton`은 슬롯에 빈 string 렌더 (DOM 노출 자체 차단 — §13.8 spec). `setMode(true)` API 호출도 무권한 시 console.warn + 차단.
5. **포팝스테이트**: 브라우저 뒤로가기/앞으로가기 시 `popstate` 리스너가 `admin-mode:change` 재발화 → page 자동 동기화.
6. **mode 진입 표시**: 페이지 admin-body 상단에 `.am-mode-banner` (brand-bg + accent border + "관리 모드 — 등록/수정/삭제 액션 인라인 노출" 텍스트 + "읽기 모드" 버튼).
7. **integration**: notice-faq.js의 `renderNotices/renderFaq` admin-topbar에 `admin-topbar-actions` 슬롯 + `id="*AdminEntrySlot"` 추가. 렌더 후 `AdminMode.renderEntryButton(slot)` + `renderModeBanner(body)` 호출.

## 영향 파일

| 파일                         | 변경                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `prototype/js/admin-mode.js` | NEW — 165줄                                                                                                  |
| `prototype/js/notice-faq.js` | renderNotices: admin-topbar에 슬롯 + admin-body id, FAQ는 wrapper IIFE로 후크. admin-mode:change 리스너 추가 |
| `prototype/js/init.js`       | `AdminMode.init()` 호출 (RoleState.init 패턴 일관)                                                           |
| `prototype/css/admin.css`    | `.admin-topbar-actions / .am-entry-btn / .am-mode-banner / .am-banner-exit` (+~70 lines append)              |
| `prototype/prototype.html`   | `<script src="js/admin-mode.js">` 추가 (init.js 직전)                                                        |

## R1 검증 (Playwright API smoke, 9 시나리오 PASS)

브라우저 캐시 제약으로 DOM 렌더 경로는 fresh 세션에서 검증 권장. 모듈 API 직접 호출은 모두 PASS:

| #   | 시나리오                                                          | 결과 |
| --- | ----------------------------------------------------------------- | ---- |
| 1   | admin role: `canEnterAdminMode()` true                            | PASS |
| 2   | `setMode(true)` → URL `?mode=admin` 추가                          | PASS |
| 3   | `setMode(false)` → URL 비움                                       | PASS |
| 4   | `renderEntryButton(slot)` → `.am-entry-btn[aria-pressed="false"]` | PASS |
| 5   | 버튼 클릭 → URL 토글 + isAdminMode true                           | PASS |
| 6   | 재렌더 시 `aria-pressed="true"`, 라벨 "읽기 모드"                 | PASS |
| 7   | `renderModeBanner` ON 시 `.am-mode-banner` 추가                   | PASS |
| 8   | OFF 시 banner 자동 제거                                           | PASS |
| 9   | user role: `canEnterAdminMode()` false, `setMode(true)` 차단      | PASS |

콘솔 에러 1건은 Playwright cache-bust로 `notice-faq.js` 재로드 시 `let faqQuery` 재선언 — 신규 사용자 환경 무관.

## 다음 세션 — B-4a 마무리 절차

1. **DOM 렌더 검증**: 브라우저 직접 열어 (ctrl+shift+R) `?mode=admin` 토글 + banner + 버튼 시각 확인. 스크린샷 저장.
2. **5인 리뷰 dispatch** (autopilot 5-expert 패턴):
   - architect (모듈 경계, B-4b/B-13 인터페이스)
   - code-reviewer (escHtml, 모듈 ≤300, append-only)
   - security-reviewer (popstate 처리, role gate cosmetic 명시, URL 직접 입력 우회 위험)
   - verifier (10 시나리오 + popstate, deep-link, 새로고침)
   - critic (UX: 모드 진입 발견성, 버튼 시각 강조, banner 적정성)
3. R1 P0/P1 fix → R2 → 리뷰 PASS 시 커밋 후 다음 갭 (B-4b)로.

## 컨벤션 준수

- 토큰 100% (hex/oklch literal 0건)
- escHtml 적용 (renderEntryButton에서 `n.id` 등 DOM에 들어가는 모든 user-controlled 값은 None — 모두 정적 라벨이지만 방어적 escape 유지)
- 모듈 ≤300줄 (admin-mode.js 165)
- append-only (admin.css end-of-file marker)

## 알려진 한계 / out of scope

- 실제 admin 액션(등록/수정/삭제)은 B-4b 범위. B-4a는 진입점 + URL 컨트랙트만.
- `admin-mode:change` 이벤트를 listening하는 다른 모듈(B-13 드로어 고급, B-15 User 가드 등)은 후속 갭에서 hook.
- React 이관 시 `history.pushState` → React Router의 `useSearchParams`. localStorage 의존성 없음.
