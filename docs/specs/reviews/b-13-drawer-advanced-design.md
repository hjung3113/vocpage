# B-13 VOC 드로어 고급 5종 (Wave 2 #6) — 설계 노트

> 작성일: 2026-05-01
> 브랜치: `feat/b-13-drawer-advanced` (다음 단계)
> 선행: B-4b 완료 후 진행

## 목적

P-11 (next-session-tasks Phase 7) — VOC 드로어에 6가지 고급 기능을 추가:
1. **상태 disabled** — `review_status='approved'` 시 status 변경 차단
2. **미완 sub-task 경고** — VOC 완료/드랍 전환 시도 시 미완 sub-task 있으면 confirm 다이얼로그
3. **퍼머링크 복사** — 드로어 우상단 🔗 아이콘 → 클립보드 (`feature-voc.md §8.17`)
4. **전체화면 토글** — 드로어 width 100vw, esc 또는 다시 클릭 시 복귀 (drawer.js:175 부분 기존 — 시각/포커스 강화 필요)
5. **댓글 편집/삭제** — 본인 댓글에 한해 인라인 편집/soft-delete
6. **review_status 뱃지** — 메타 헤더에 status pill 옆 review_status pill 추가 (unverified/approved/rejected/pending_deletion)

## spec 출처

- `feature-voc.md §8.17` — 퍼머링크 (`/voc/:id` 절대 URL, 클립보드 복사 후 토스트)
- `feature-voc.md §8.2.1` — review_status 서브 상태 머신 (5상태)
- `feature-voc.md §9.2.2` — sub-task 미완 경고
- `uidesign.md §13.x` — pill/뱃지 토큰

## 결정

1. **신규 파일**: `prototype/js/drawer-advanced.js` (~280줄). drawer.js 미수정 — `drawer:opened` 커스텀 이벤트 listen 또는 MutationObserver 적용.
2. **상태 disabled**: drawer 헤더의 status select에 `disabled` + tooltip "결과 검토가 승인되어 상태 변경이 잠겨 있습니다."
3. **미완 sub-task 경고**: status를 완료/드랍으로 변경 시도 → mock subTasks에서 `done !== true` 카운트 → ≥1이면 `window.confirm("미완 sub-task N건이 있습니다. 그래도 변경할까요?")`. Cancel = revert.
4. **퍼머링크**: 헤더 우측 🔗 아이콘 (lucide `link-2`). 클릭 → `navigator.clipboard.writeText(window.location.origin + '/voc/' + voc.id)` → 토스트 "링크가 복사되었습니다." (3s).
5. **전체화면 보강**: 기존 drawer.js:175 `toggleFullscreen()` 호출. 보강 — esc 키 → 전체화면 해제, focus return to status btn, aria-expanded 갱신.
6. **댓글 편집/삭제**: 댓글 .comment-item 우측에 "..." 메뉴 → [편집][삭제]. 작성자 본인만 노출. 편집 = inline `<textarea>` 치환. 삭제 = soft-delete (`_deleted: true` 플래그, 목록에서 제거). undo 토스트 5s.
7. **review_status 뱃지**: drawer 메타 헤더에 신규 `.rs-pill` (status pill 옆). 5 variant 색상:
   - unverified → `--status-yellow`
   - approved → `--status-green`
   - rejected → `--status-red`
   - pending_deletion → `--status-orange`
   - null → 미노출

## 모듈 API

```js
window.DrawerAdvanced = {
  init,                       // listen drawer:opened, drawer:closed
  attachToDrawer(drawerEl, vocId),
  copyPermalink(vocId),
  toggleFullscreen(drawerEl),
  warnUnfinishedSubtasks(vocId, nextStatus),
  isStatusLocked(vocId),
  renderReviewStatusPill(metaEl, voc),
  attachCommentActions(commentEl, comment),
  startEditComment(commentId),
  saveEditComment(commentId, text),
  softDeleteComment(commentId),
  undoDeleteComment(commentId),
};
```

## 영향 파일

| 파일                                       | 변경                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| `prototype/js/drawer-advanced.js`          | NEW — ~280줄                                                  |
| `prototype/css/admin/drawer-advanced.css`  | NEW — ~200줄 (.rs-pill, .perma-btn, .comment-action-menu 등) |
| `prototype/prototype.html`                 | `<script src="js/drawer-advanced.js">` 추가                   |
| `prototype/js/data.js`                     | review_status 필드 mock 추가 (3건 정도 다른 상태)             |
| `prototype/js/drawer.js`                   | `drawer:opened` CustomEvent 발화 한 줄만 추가 (necessary hook) |

> **drawer.js 한 줄 수정 불가피** — `drawer:opened` 이벤트 발화. monkey-patch 대안도 가능하지만 여기는 1줄 추가가 더 깨끗.

## R1 검증 시나리오

| #   | 시나리오                                                                |
| --- | ----------------------------------------------------------------------- |
| 1   | review_status=approved VOC 열기 → status select disabled + tooltip      |
| 2   | 미완 sub-task 2건 VOC → 완료 시도 → confirm "2건 있습니다" → cancel: 상태 유지 |
| 3   | 퍼머링크 클릭 → 클립보드에 `/voc/V-1234` 복사 + 토스트 표시              |
| 4   | 전체화면 토글 → drawer.fullscreen 클래스 + esc 키로 해제                  |
| 5   | 댓글 편집: 본인 댓글에서 ... 메뉴 → 편집 → 저장 → 본문 갱신             |
| 6   | 댓글 삭제: 삭제 → 목록에서 제거 + undo 토스트 → undo: 복원                |
| 7   | review_status pill 5 variant 시각 확인 (yellow/green/red/orange/없음)   |
| 8   | 타인 댓글: ... 메뉴 미노출                                              |

## 컨벤션 준수

- 토큰 100% (--status-yellow 등 기존 토큰 재사용, 없으면 uidesign 추가 후 사용)
- escHtml 모든 사용자 콘텐츠
- 모듈 ≤300줄
- append-only

## 알려진 한계

- 클립보드 API 권한 거부 시 fallback (textarea select + execCommand) — graceful degradation
- 댓글 편집/삭제 BE 실연동은 Phase 8 (mock 배열 직접 mutate)
- review_status 머신 전체 재현은 Result Review (B-1)에서 처리 — 여기는 표시만
