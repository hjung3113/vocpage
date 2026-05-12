---
phase: 01-tag-rules-consolidation
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - backend/migrations/024_tag_rules_created_by.sql
  - backend/src/__tests__/admin-contract.test.ts
  - backend/src/__tests__/migration-024.test.ts
  - backend/src/routes/admin-tags.ts
  - backend/src/routes/__tests__/admin-tags.test.ts
  - backend/src/services/admin/tag-master.ts
  - frontend/src/features/admin/tag-master/api/tag-master.api.ts
  - frontend/src/features/admin/tag-master/api/__tests__/optimistic.test.ts
  - frontend/src/test/mocks/handlers/admin-tags.ts
  - frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx
  - frontend/src/features/admin/tag-master/ui/TagMasterRow.tsx
  - frontend/src/features/admin/tag-master/ui/TagMasterSuspendModal.tsx
  - frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx
  - frontend/src/features/admin/tag-master/ui/TagRuleActionMenu.tsx
  - frontend/src/features/admin/tag-master/ui/TagRuleAddForm.tsx
  - frontend/src/features/admin/tag-master/ui/TagRuleConfirmDialog.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatRow.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatTableEmptyState.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesModalStates.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesSubTable.tsx
  - frontend/src/features/admin/tag-master/ui/__tests__/KeywordChipInput.test.tsx
  - frontend/src/features/admin/tag-master/ui/__tests__/TagRulesManagerModal.test.tsx
  - frontend/src/pages/admin/tags.tsx
  - frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx
  - frontend/src/pages/admin/__tests__/AdminTagsPage.plan07.test.tsx
  - scripts/check-fixture-seed-parity.ts
  - shared/contracts/admin/tag.ts
  - shared/fixtures/admin-tag-rule.fixtures.ts
  - shared/openapi.yaml
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 1: Tag Rules Consolidation — 코드 리뷰 보고서

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

VERIFICATION 보고서는 5/5 SC 통과·17/17 위협 mitigated·테스트 GREEN(625/625 BE, 721/721 FE)을 주장하나, 적대적 리뷰 결과 **프로덕션에서 즉시 SQL 에러로 터지는 BLOCKER 1건**을 포함해 9건의 이슈를 확인했다. 핵심 결함은 BE 서비스가 `users.name` 컬럼을 참조하지만 실제 스키마(`002_core_tables.sql:14`)는 `display_name`을 사용한다는 점이다. 라우트 테스트가 서비스 전체를 `jest.mock` 처리하고 migration 테스트는 DDL만 검증하므로, 이 SQL 에러는 어떤 자동 테스트로도 잡히지 않은 채 통과했다. T-01-08(IDOR), T-01-09(created_by injection), T-01-10(route order), T-01-11(keyword caps) mitigation 자체는 코드에 정확히 존재함을 확인.

또한 SC-4 "전체 규칙 보기 + 키워드 검색"은 태그가 20건을 초과하면 **silently 누락**되는 페이지네이션 한계를 가진다 (TagRulesFlatTable이 `useAdminTags()`를 default per_page=20으로만 호출). MSW handler / FE 일부에서 created_by_name이 손실되는 등 자잘한 정합성 문제도 함께 동봉.

## Critical Issues

### CR-01: BE `tag-master.ts`의 `users` JOIN이 존재하지 않는 컬럼 `u.name`을 참조 — 모든 tag-rule 엔드포인트가 런타임 SQL 에러로 실패

**File:** `backend/src/services/admin/tag-master.ts:257`

**Issue:**
`TAG_RULE_SELECT_BASE` 의 SELECT 절이 `u.name AS created_by_name`로 작성돼 있다. 그러나 `users` 테이블 스키마(`backend/migrations/002_core_tables.sql:11–20`)에는 `name` 컬럼이 존재하지 않으며, 실제 컬럼은 `display_name`이다. 동일 코드베이스의 다른 서비스(`backend/src/services/admin/user-admin.ts:36,49,56,85,101,107,143,150`, `backend/src/repository/masters.ts:17`)는 모두 `u.display_name`을 사용한다. 또한 OQ-R5(`01-CONTEXT.md:171`)는 명시적으로 "BE list endpoint JOINs `users.display_name`"이라고 LOCK한다.

이 select base는 `listTagRules` / `createTagRule` / `updateTagRule` / `suspendTagRule` 4개 핸들러 모두가 사용하는 공통 SQL이므로, `/admin/tags/:tagId/rules*` **모든 mutate + list 엔드포인트가 첫 호출에서 PostgreSQL 에러 42703 (`column u.name does not exist`)을 던진다.**

자동 테스트 5종이 이 결함을 잡지 못한 이유:
1. `backend/src/routes/__tests__/admin-tags.test.ts:30–42` — 서비스 모듈 전체를 `jest.mock(...)`으로 치환. SELECT가 실제로 실행되지 않는다.
2. `backend/src/__tests__/migration-024.test.ts` — DDL의 컬럼 추가/삭제만 검증, JOIN을 SELECT 하지 않음.
3. `backend/src/__tests__/admin-contract.test.ts` — zod ↔ openapi 정합성만 본다.
4. FE `optimistic.test.ts` + AdminTagsPage 테스트들 — MSW가 응답을 만들어 주므로 BE는 호출되지 않음.
5. `scripts/check-fixture-seed-parity.ts` — DDL 컬럼 vs 픽스처 키만 비교.

VERIFICATION §6 의 "BE Jest 625/625 GREEN" 은 사실이지만, 이 경로에 대한 **integration / live-DB 테스트가 0건**이라는 점을 가린다. 프로덕션 / staging의 첫 사용자 액션에서 500이 떨어진다.

**Fix:**
```ts
// backend/src/services/admin/tag-master.ts:248–261
const TAG_RULE_SELECT_BASE = `
  SELECT
    tr.id,
    tr.tag_id,
    tr.kind,
    tr.keywords,
    tr.match_mode,
    tr.suspended_until,
    tr.created_by,
    u.display_name AS created_by_name,   -- was: u.name
    tr.created_at
  FROM tag_rules tr
  LEFT JOIN users u ON u.id = tr.created_by
`;
```

추가로, 회귀 방지를 위해 service-layer integration 테스트를 1건 추가해야 한다(pg-mem 또는 Testcontainers Postgres 사용, 라우트 mock 없이 `listTagRules`를 실제 SQL로 호출). 이 테스트가 없으면 동일 클래스의 컬럼 오타가 또 발생해도 같은 방식으로 누락된다.

## Warnings

### WR-01: TagRulesFlatTable이 페이지 1·per_page 기본값(20)으로만 태그를 가져와 SC-4 "전체 규칙 보기"가 21번째 태그 이후의 규칙을 누락

**File:** `frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx:29`

**Issue:**
`useAdminTags()` 호출이 인자 없이 들어가므로 BE는 `page=1, per_page=20`(zod default, `shared/contracts/admin/tag.ts:60–61`)으로 응답한다. `useQueries`는 이 20개 태그에 대해서만 nested rule list를 조회하므로, 21번째 이후의 태그가 가진 규칙은 "전체 규칙" 탭에서 **조용히 사라진다**. 사용자는 "검색 결과가 없습니다" 또는 부분 결과만 보고 어디에서 누락됐는지 알 길이 없다.

ROADMAP SC-4("`전체 규칙 보기` 토글 + 키워드 검색")의 contract는 "전체"이므로, 태그 수가 20을 넘는 prod 환경에서 이 SC는 사실상 위반된다. 본 phase가 verify된 시점의 픽스처는 태그 < 20 이라 테스트는 전부 GREEN.

부수적으로 `useQueries`가 태그 수만큼 N+1 fetch를 일으키는 구조 자체가 SC-4 의 BE q 검색 의도(`01-CONTEXT.md:33` D-03 "키워드 검색은 서버측 `q` 파라미터 활용")와 어긋난다. 이 phase의 BE에는 cross-tag flat list 엔드포인트가 없고 nested 만 있으므로 FE가 N+1로 합치고 있다. v1의 MVP 한계로는 수용 가능하나 SC-4의 정합성 측면에서는 별도 BE flat-search 엔드포인트가 후속 phase에 필요하다.

**Fix (단기 — 누락 차단):**
```ts
// TagRulesFlatTable.tsx
const { data: tagsData, isLoading: tagsLoading } = useAdminTags({ per_page: 100 });
```
또는 `total` 을 보고 누락 가능성을 사용자에게 표시:
```ts
const total = tagsData?.total ?? 0;
const fetched = tags.length;
{total > fetched && (
  <div role="alert">
    {total - fetched}개 태그의 규칙이 표시되지 않았습니다. 태그 검색을 좁히거나
    태그 탭에서 직접 확인하세요.
  </div>
)}
```
**Fix (정공법):** Phase 후속에서 `GET /api/admin/tag-rules` (또는 `/api/admin/tags/rules:search`) flat-search 엔드포인트를 추가하고, FE는 단일 쿼리로 검색하도록 변경.

### WR-02: MSW `seedRuleStore`가 fixture 의 `created_by_name`을 강제로 `null`로 덮어써 deep-link 테스트 / 시각 회귀가 실제 BE의 `created_by_name = displayName` 응답과 어긋남

**File:** `frontend/src/test/mocks/handlers/admin-tags.ts:35–47`

**Issue:**
```ts
function seedRuleStore(): RuleStoreRow[] {
  return ADMIN_TAG_RULE_FIXTURES.map((r) => ({
    ...,
    created_by: r.created_by,
    created_by_name: null,   // ← 항상 null
    ...
  }));
}
```
픽스처 데이터 자체가 모두 `created_by: null` 이라 현 시점에서는 정합한 상태이지만, 픽스처에 `created_by` 가 있는 row가 추가되는 순간(현실 기획에 가까움) MSW와 BE 응답이 다른 모양을 갖는다 (BE는 `users.display_name`을 채워 응답, MSW는 항상 null). FE 테스트는 MSW 기준으로 GREEN인데 prod 실배포에선 작성자 이름이 보이는 등 인지부조화가 발생.

또한 위 CR-01 의 SQL 버그가 수정되기 전에는 MSW가 `created_by_name`을 일관되게 `null`로 비워둠으로써 "FE 측에선 OK처럼 보이는" 거짓-안전감을 강화한다.

**Fix:**
```ts
created_by_name: r.created_by ? 'Mock User' : null,
```
또는 fixture에 `created_by_name` 을 함께 정의해서 BE/MSW가 같은 값을 응답하도록 한다.

### WR-03: `TagMasterTable.handleDelete`가 `err.status` 를 본떠 분기하지만 `apiDelete`는 status 필드를 표준 envelope으로 던지지 않는다 — 409 inline 메시지가 표시되지 않을 가능성

**File:** `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx:38–48`

**Issue:**
```ts
deleteTag.mutate(tag.id, {
  onError: (err) => {
    const e = err as { status?: number; message?: string };
    if (e.status === 409) {
      setInlineError(`삭제 불가: ${e.message ?? '태그가 사용 중입니다.'}`);
    }
  },
});
```
`@shared/api/client`의 에러는 일반적으로 `{ code, message, details }` envelope과 fetch Response status를 함께 노출하지만, `e.status`가 직접 들어 있다는 보장이 없다 (코드베이스 다른 hook에서는 `err.code === 'CONFLICT'` 패턴이 일반적이다). 분기가 동작하지 않으면 `else` 가지가 없어 사용자는 **아무 에러도 보지 못하고** 태그가 그대로 남는 UX. 또한 status가 다른 값(403, 500)이면 silently 무시된다.

본 phase에서 새로 추가된 코드가 아니라 기존 admin Tag Master 코드의 결함이지만, Phase 1 변경에서 같은 파일을 광범위하게 손봤음에도 회귀가 잡히지 않았다.

**Fix:**
```ts
onError: (err) => {
  const e = err as { status?: number; code?: string; message?: string };
  if (e.code === 'CONFLICT' || e.status === 409) {
    setInlineError(`삭제 불가: ${e.message ?? '태그가 사용 중입니다.'}`);
  } else {
    setInlineError(`삭제 실패: ${e.message ?? '잠시 후 다시 시도해 주세요.'}`);
  }
},
```

### WR-04: `tags.tsx` 첫 effect가 view==='rules'일 때만 동작 — `?view=tags`로 돌아갈 때 URL 의 `?q=` 잔여 가능성 / 디바운스 미동작

**File:** `frontend/src/pages/admin/tags.tsx:40–55`

**Issue:**
```ts
useEffect(() => {
  if (view !== 'rules') return;   // tags 모드에서 effect skip
  ...
  setTimeout(() => { setParams((p) => { ... p.set('view', 'rules'); ... }); }, 250);
}, [qDraft, qParam, view, setParams]);
```
`setView('tags')`는 `q`를 즉시 지운다(:62–67). 그러나 사용자가 'rules' 탭에서 검색어를 입력 직후(timer pending 상태) 'tags'로 전환하면 pending timer는 cleanup으로 해제되므로 OK. 다만 effect dependency에 `view`가 들어 있어, `qDraft`가 변경되지 않은 상태에서 view만 토글될 때 effect가 한번 더 돈다. 가벼운 dead code path지만, 동시에 `setView('rules')` 직후 컴포넌트가 mount되며 `qDraft !== qParam`이 false라 setParams 호출은 일어나지 않으므로 실 피해 없음.

또한 50번째 줄 `p.set('view', 'rules')`을 강제하는 이유는 외부 navigation 도중 race를 막기 위해서지만, 같은 effect에서 `view !== 'rules'` 가드를 통과한 시점이므로 redundant. minor.

**Fix:**
```ts
useEffect(() => {
  if (view !== 'rules') return;
  if (qDraft === qParam) return;
  const id = setTimeout(() => {
    setParams(
      (p) => {
        if (qDraft) p.set('q', qDraft); else p.delete('q');
        // p.set('view', 'rules') 제거 — 이미 view==='rules' 가드 통과
        return p;
      },
      { replace: true },
    );
  }, SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(id);
}, [qDraft, qParam, view, setParams]);
```

## Info

### IN-01: `TagMasterSuspendModal`의 `new Date(suspendUntil).toISOString()`이 invalid input에서 RangeError로 throw — onSubmit에서 흡수 안 됨

**File:** `frontend/src/features/admin/tag-master/ui/TagMasterSuspendModal.tsx:34`

**Issue:** `<input type="datetime-local">`은 대부분 브라우저에서 형식을 강제하지만, 사용자가 키보드로 invalid 값을 타이핑하면 `value`가 빈 문자열로 떨어지므로 ternary가 `null`로 가서 안전하다. 다만 일부 모바일 / 자동입력에서 ISO-like가 아닌 문자열이 들어올 가능성은 0이 아님. try/catch 또는 isFinite(date.getTime()) 가드를 추천.

**Fix:**
```ts
let value: string | null = null;
if (suspendUntil.trim()) {
  const d = new Date(suspendUntil);
  if (Number.isNaN(d.getTime())) {
    setError('올바른 시각을 입력해 주세요.');
    return;
  }
  value = d.toISOString();
}
```

### IN-02: `TagRulesManagerModal.confirmAction`이 `kind === 'suspend'` 시 항상 `2999-12-31` 만료시각을 보내 — `TagMasterSuspendModal` 의 사용자 입력 시각과 충돌 / dead code 가능성

**File:** `frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx:47, 122`

**Issue:** TagRulesManagerModal은 일시중지를 무한 시각(`SUSPEND_FAR_FUTURE_ISO`)로만 보낸다. 별도 컴포넌트 `TagMasterSuspendModal`은 사용자 입력 datetime-local을 그대로 사용한다. 두 surface 사이에 정책 불일치(spec §9.4.1 의 "expiration" 의미 모호)가 있고, 어느 쪽도 사용자에게 "재개 예정 시각"을 입력 받지 않는 행위로 모이고 있다. 본 phase 의 modal CRUD는 `TagMasterSuspendModal`을 더 이상 호출하지 않는 것으로 보이며, 그렇다면 dead code일 가능성. `rg`로 호출부 확인 필요.

**Fix:** TagMasterSuspendModal 의 호출 사이트 확인 → 미호출이면 삭제. 호출되면 두 모달의 정책 통일 (사용자 입력 기반 expiration 채택 / 무한 만료 채택 중 spec 갱신).

### IN-03: `KeywordChipInput` 의 `key={kw}` 는 dedupe 보장에 의존 — 만약 dedupe 가드가 우회되면 React reconciler 가 잘못된 chip을 리렌더

**File:** `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx:97`

**Issue:** `commit()` 에서 case-insensitive dedupe을 하므로 현재는 안전하다. 그러나 외부에서 `value` prop 으로 중복을 포함한 배열을 주입하면 동일 key 가 두 번 등장 → React warning + 부정확한 reconciliation. 부모(TagRulesManagerModal, TagRulesSubTable)는 BE 응답 / 사용자 input 만 사용하므로 실 위험은 낮으나 방어적 코드 권장.

**Fix:** `key={`${kw}-${i}`}` 인덱스 합성 또는 컴포넌트 진입 시 dedupe 한 번 더.

### IN-04: BE `deleteTag` 의 usage/rule count 검사가 트랜잭션 외부 — TOCTOU 가능성 (본 phase 무관, 인접 코드)

**File:** `backend/src/services/admin/tag-master.ts:213–241`

**Issue:** `SELECT COUNT(*)` 두 건과 `DELETE` 가 별도 statement 로 직렬 실행. `voc_tags` / `tag_rules` 가 동시에 INSERT 되면 검사 후 삭제 사이에 race가 발생. ON DELETE 가 RESTRICT/NO ACTION 이면 PG 가 외래키 제약을 던지지만, FK 가 CASCADE 인 경우 child 가 silently 삭제될 수 있다. 본 phase 가 추가/수정한 코드는 아니지만 phase 1 의 row-action UI 가 delete 행위를 더 많이 노출하므로 race window 가 커진다.

**Fix:** `BEGIN ... SELECT ... FOR UPDATE` 트랜잭션 안에서 검사 + 삭제를 한 번에 묶거나, FK 정의를 `ON DELETE RESTRICT` 로 보장하고 23503 에러를 409로 매핑.

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
