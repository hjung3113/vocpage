# Wave 4 Adversarial Code Review

**Reviewer**: oh-my-claudecode:code-reviewer (Opus, read-only adversarial pass)
**Date**: 2026-05-09
**Branch**: `feat/wave-4-fe` (16 commits ahead of main: 4 BE + 12 FE)
**Spec**: `docs/specs/requires/feature-notice-faq.md` §10.1–10.6
**Verdict**: **REQUEST CHANGES** (1 P0, 5 P1, 4 P2)

## Counts

- P0: 1 must-fix
- P1: 5 should-fix
- P2: 4 nice-to-have

---

## P0 — Must-fix before merge

### P0-1 — `/admin/notices` and `/admin/faqs` paths in openapi.yaml are phantom contracts

- **File**: `shared/openapi.yaml:1680–1933` (admin block) vs `backend/src/index.ts:67–69` (only `/api/notices`, `/api/faqs`, `/api/faq-categories` mounted).
- **Issue**: openapi 스펙은 `/admin/notices`, `/admin/notices/{id}`, `/admin/faqs`, `/admin/faqs/{id}` 의 GET/POST/PATCH/DELETE 60+ 줄을 광고하지만, 어떤 Express 라우트 핸들러도 마운트되지 않음. 스펙 §10.5 D19 는 admin sub-route surface 를 명시적으로 폐기하고 `?mode=admin` 으로 일원화. 같은 wave 가 그것을 documented contract 로 다시 도입 — §10.5 직접 위반, 클라이언트 코드 생성 시 깨진 stub 발생.
- **Fix**: `shared/openapi.yaml` 의 `/admin/notices`, `/admin/notices/{id}`, `/admin/faqs`, `/admin/faqs/{id}` 블록 제거. `/notices`, `/notices/popup`, `/notices/{id}`, `/notices/{id}/restore`, `/faqs`, `/faqs/{id}`, `/faqs/{id}/restore`, `/faq-categories`, `/faq-categories/{id}` 만 유지.

---

## P1 — Should-fix

### P1-1 — Missing DB indexes for the hot read paths (visibility/popup/search)

- **Files**: `backend/migrations/005_content.sql` (notices/faqs/faq_categories 인덱스 없음), `010_indexes.sql` (content 테이블 skip), `016_notice_faq_alignment.sql` (컬럼 타입 변경만).
- **Issue**: 모든 로그인이 `GET /api/notices/popup` (filter `deleted_at, is_visible, is_popup, visible_from, visible_to`) 발동 + 모든 notice 목록은 같은 predicate 위에서 `count(*) + select`. FAQ 는 `question, answer` 위 `ILIKE '%q%'` 를 trigram 인덱스 없이 수행. 어느 컬럼도 인덱스 없음 → 데이터 규모 무관하게 sequential scan 보장.
- **Fix**: 마이그 017 추가:
  ```sql
  CREATE INDEX ON notices (is_popup, is_visible) WHERE deleted_at IS NULL;
  CREATE INDEX ON notices (visible_from, visible_to) WHERE deleted_at IS NULL;
  CREATE INDEX ON faqs (category_id) WHERE deleted_at IS NULL;
  CREATE INDEX ON faqs (is_visible) WHERE deleted_at IS NULL;
  -- pg_trgm GIN for FAQ keyword search (or accept FE-only filtering as MVP)
  ```

### P1-2 — Dynamic SQL `SET` composition trusts caller key strings

- **Files**: `backend/src/repository/notices.ts:108–112`, `backend/src/repository/faqs.ts:115–119`, `repository/faqs.ts:181–185`.
- **Issue**: `for (const [k, v] of Object.entries(patch)) { sets.push(\`${k} = $${args.length}\`) }`—`k`가 SQL 에 직접 보간. **현재는 안전** (모든 caller 가 zod`.partial()`검증 통과 + closed key set), 그러나 contract 는 fragile — 향후`validate({ body: NoticeUpdate })` 우회 caller (예: 내부 admin 도구) 시 SQL identifier injection.
- **Fix**: 컬럼 allowlist 추가 (`const ALLOWED_COLS = new Set([...])` + `if (!ALLOWED_COLS.has(k)) continue;`).

### P1-3 — `dangerouslySetInnerHTML` ships unsanitized to 3 surfaces with no follow-up logged

- **Files**: `frontend/src/pages/notice/NoticeRow.tsx:96`, `features/notice-popup/NoticePopupModal.tsx:114`, `pages/faq/FaqRow.tsx:136`.
- **Issue**: 3 surfaces 모두 `// TODO(security): wrap with DOMPurify once available` — 코멘트는 있으나 `followup-bucket.md` 에 FU 미등록. MVP 수용 가능하나 owner 없는 stale TODO.
- **Fix**: (a) `FU-NNN: DOMPurify integration for notice/faq richtext` 를 `followup-bucket.md` 에 등록하고 3개 TODO 코멘트에 FU id 참조; (b) 보상 통제로 BE 응답 헤더에 `Content-Security-Policy: script-src 'self'` 즉시 추가.

### P1-4 — Notice popup uses string-compare for date guard

- **File**: `frontend/src/features/notice-popup/useNoticePopupTrigger.ts:54` — `if (stored && stored >= todayKst()) dismissed = true;`.
- **Issue**: `YYYY-MM-DD` lexicographic 비교는 정확하지만 `todayKst()` 가 ISO en-CA 로 lock 되어 있을 때만 성립. locale 이 `ko-KR` 로 바뀌면(`2026. 5. 10.`) 비교가 silently 깨짐.
- **Fix**: `new Date(stored + 'T00:00:00+09:00') > new Date()` 로 교체 OR regression 테스트 `expect(todayKst()).toMatch(/^\d{4}-\d{2}-\d{2}$/)` 추가.

### P1-5 — Optimistic update may bleed across query keys (popup feed included)

- **File**: `frontend/src/pages/notice/index.tsx:64–73` — `qc.getQueriesData({ queryKey: noticeQueryKeys.lists() })`.
- **Issue**: `noticeQueryKeys.lists()` 가 popup-feed 캐시도 매치하면 patch 가 popup 캐시에 적용. `{ ...r, ...patch }` blanket spread → form 의 `undefined` 값이 새어들어감.
- **Fix**: `entities/notice/api/keys.ts` 의 lists vs popup 분리 검증; undefined 키 제거: `Object.fromEntries(Object.entries(patch).filter(([,v]) => v !== undefined))`.

---

## P2 — Nice-to-have

### P2-1 — Notice list `total` counts pre-filter, FE displays post-filter count

`backend/src/repository/notices.ts:55` 의 DB total vs `frontend/src/pages/notice/index.tsx:88` 의 `visibleRows.length` 가 BE/FE 시계 drift 시 불일치.

### P2-2 — `popup()` ordering CASE expression is fragile vs `NoticeImportance` enum drift

`backend/src/repository/notices.ts:74`. enum 4번째 레벨 추가 시 silently last 정렬. `level_priority smallint generated always as` 컬럼 또는 enum 멤버 verification 단위 테스트.

### P2-3 — Admin restore button DOM gating not asserted in manager mode

`frontend/src/pages/notice/__tests__/NoticePage.admin.test.tsx` — soft-deleted row 가 admin 에서 복원 버튼, manager 에서 미렌더 단언 spot-check 필요.

### P2-4 — `FaqCategoriesTab` defense-in-depth missing

`pages/faq/index.tsx:185` 의 `isAdmin` parent gating 만 있음. 컴포넌트 자체에 `useRole()` early-return 추가.

---

## Positive observations

- Role guards on routes tight and consistent: `requireRole('admin')` for restore + all faq-categories mutations matches §10.3.4 / §10.4.3 / §10.5.3.
- Test coverage thorough: 403/admin-only matrix per route × admin/manager/user/dev × create/update/delete/restore.
- Migration 016 picks `timestamptz` over `date` — correct §10.3.1 노출 기간 interpretation.
- No hex / raw `oklch()` in diff; all colors via `var(--*)` tokens.
- localStorage key format exactly matches spec §10.3.2.
- Optimistic update + `onError` rollback + `onSettled` invalidate textbook react-query pattern.
- Single dismiss checkbox in modal footer (not per-row) matches §10.3.2.

---

## Verdict

**REQUEST CHANGES** — P0-1 (phantom openapi /admin paths) 머지 전 필수 처리. P1-1 (인덱스) + P1-3 (FU 등록) 동일 PR 권장. 나머지 P1/P2 follow-up 가능.

## Top 3 findings

1. **P0-1** — `shared/openapi.yaml:1680–1933` `/admin/notices`+`/admin/faqs` phantom paths, §10.5 D19 위반.
2. **P1-1** — `005_content.sql`+`010_indexes.sql` notices/faqs hot path 인덱스 0개.
3. **P1-2** — `repository/{notices,faqs}.ts` SET 절 컬럼 allowlist 부재.
