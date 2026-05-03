# B-4b 공지/FAQ 관리 UI (Wave 2 #4) — 설계 노트

> 작성일: 2026-05-01
> 브랜치: `feat/b-4b-notice-faq-admin-ui`
> 선행: B-4a `?mode=admin` URL 토글 ✅ (PR #76 머지)

## 목적

`?mode=admin` 진입 시 공지/FAQ 페이지에 인라인 관리 액션(등록/수정/삭제/노출토글/복원) + FAQ 카테고리 관리 탭을 추가. spec `feature-notice-faq.md §10.3.4 / §10.4.3 / §10.4.4 / §10.5.3` 1:1 재현.

## spec 출처

- `feature-notice-faq.md §10.3.4` — 공지 관리 (인라인 노출 토글, 등록/수정/삭제, soft delete, 복원=Admin only)
- `feature-notice-faq.md §10.4.3` — FAQ 관리 (인라인 토글, CRUD, 카테고리 관리=Admin only)
- `feature-notice-faq.md §10.4.4` — FAQ 카테고리 관리 탭 (Admin only, 이름/순서/표시여부/액션 4컬럼, 항목 0건일 때만 삭제)
- `feature-notice-faq.md §10.5.3` — 권한 매트릭스

## 결정

1. **인라인 모드**: `admin-mode:change` 이벤트 listen → `?mode=admin` ON 일 때 notice/FAQ 행에 액션 버튼 + 상단 등록 폼 펼침. OFF 일 때는 사용자 뷰 그대로.
2. **모달 vs 인라인 폼**: 등록/수정은 **모달** (입력 필드 多, 기존 일관성 — D22 태그 마스터 패턴). 복원은 **별도 "삭제됨" 섹션** 토글 (Admin only).
3. **모듈 분리**:
   - `prototype/js/notice-admin.js` (NEW, ~250줄) — 공지 관리 모드 렌더, 모달, 액션 핸들러, soft-deleted 섹션
   - `prototype/js/faq-admin.js` (NEW, ~270줄) — FAQ 관리 모드 렌더, 모달, 카테고리 탭, 카테고리 모달
4. **CSS**: `prototype/css/admin/notice-faq-admin.css` (NEW, ~250줄) — 인라인 액션 스타일, 모달, 카테고리 테이블, soft-deleted 섹션
5. **데이터**: 기존 `NOTICES` / `FAQS` 배열 재사용. 신규 `FAQ_CATEGORIES` mock 배열 추가 (4개: 일반/계정/제출/기타). `_deleted: true` 플래그로 soft delete 표현.
6. **권한 가드**:
   - 진입 = `?mode=admin` ON + role ∈ {admin, manager} (B-4a 컨트랙트)
   - 복원 = role === 'admin' 만 (Manager는 "삭제됨" 섹션 자체 미노출)
   - 카테고리 관리 = role === 'admin' 만 (Manager는 "FAQ 항목" 탭만 노출, 카테고리 탭 DOM 미생성)

## 영향 파일

| 파일                                       | 변경                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `prototype/js/notice-admin.js`             | NEW — ~250줄                                                              |
| `prototype/js/faq-admin.js`                | NEW — ~270줄                                                              |
| `prototype/js/notice-faq.js`               | renderNotices / renderFaq 안에서 admin-mode ON 시 admin 모듈 hook         |
| `prototype/css/admin/notice-faq-admin.css` | NEW — ~250줄                                                              |
| `prototype/prototype.html`                 | `<script src="js/notice-admin.js">` `<script src="js/faq-admin.js">` 추가 |

## 모듈 API (예시)

```js
// notice-admin.js
window.NoticeAdmin = {
  init,                    // listen admin-mode:change + role:change
  renderAdminPanel(bodyEl),// inject 등록 폼 + 인라인 액션 + 삭제 섹션
  openCreateModal(),
  openEditModal(noticeId),
  toggleVisibility(id),
  softDelete(id),
  restore(id),             // admin only
  getDeleted(),            // returns NOTICES.filter(n => n._deleted)
};

// faq-admin.js
window.FaqAdmin = {
  init,
  renderAdminPanel(bodyEl),
  renderCategoryTab(bodyEl), // admin only
  openCreateFaqModal(),
  openEditFaqModal(id),
  openCreateCategoryModal(),
  openEditCategoryModal(slug),
  toggleVisibility(id),
  softDelete(id),
  restore(id),
  deleteCategory(slug),    // 0-item check
  switchAdminTab('faqs'|'categories'),
};
```

## R1 검증 (Playwright + 수동 시나리오)

| #   | 시나리오                                                                 |
| --- | ------------------------------------------------------------------------ |
| 1   | admin role + ?mode=admin: 공지 행에 [편집][삭제][토글] 버튼 노출         |
| 2   | manager role + ?mode=admin: 동일하지만 "삭제됨 (Admin only)" 섹션 미노출 |
| 3   | user role + ?mode=admin: 진입 차단 (B-4a canEnterAdminMode false)        |
| 4   | 공지 등록 모달: 제목/내용/중요도/기간/노출 입력 → 저장 → 목록 prepend    |
| 5   | 공지 노출 토글: 즉시 반영 (off 시 사용자 뷰에서 제거)                    |
| 6   | 공지 soft delete: 목록에서 제거 + 삭제됨 섹션에 추가                     |
| 7   | 공지 복원 (admin): 삭제됨 섹션 → 목록 복귀. manager: 버튼 자체 미노출    |
| 8   | FAQ 카테고리 탭 — admin: 노출 / manager: DOM 자체 없음                   |
| 9   | FAQ 카테고리 삭제 — 0 items: 성공 / ≥1 items: 토스트 차단                |
| 10  | 모드 OFF 시 모든 admin UI 깨끗이 제거 (사용자 뷰 회귀 0)                 |

## 컨벤션 준수

- 토큰 100% (hex/oklch literal 0건)
- escHtml 적용 (사용자 입력 → DOM)
- 모듈 ≤300줄 (notice-admin 250 / faq-admin 270 / css 250)
- append-only (기존 notice-faq.js / mode-toggle.css 끝에 추가)

## 알려진 한계 / out of scope

- 실제 BE API 호출 없음 — mock 배열 직접 mutate (prototype 컨벤션)
- Toast UI Editor 통합은 mock textarea로 대체 (실 구현은 Phase 8)
- 카테고리 드래그 정렬은 ↑↓ 버튼으로 대체 (드래그는 NextGen)
- "오늘 하루 보지 않기" 키 / 공지 팝업은 B-3에서 처리됨, 여기서는 관리 모드 진입만

## 다음 단계

1. 본 설계 문서 commit on branch `feat/b-4b-notice-faq-admin-ui`
2. 구현 (executor agent, model=sonnet)
3. 5-expert × 3-perspective review (architect / code / security / verifier / critic 병렬)
4. R2 fix → 평균 ≥85 PASS → user PR 요청 신호
