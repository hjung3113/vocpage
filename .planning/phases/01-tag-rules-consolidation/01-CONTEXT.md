# Phase 1: Tag Rules Consolidation - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

`/admin/tags` 한 페이지에서 태그별 자동 태깅 규칙(`tag_rules`)을 직접 관리한다. 별도 `/admin/tag-rules` 라우트·사이드바 entry는 코드베이스에서 완전히 제거하고, REST API 경로도 `tags`-nested 리소스로 재매핑한다. 신규 규칙 추가/수정/삭제/일시중지/재개가 row-action으로 통합되며, `규칙 N건` 뱃지가 즉시 갱신된다. 상단 탭 전환으로 모든 태그의 규칙을 키워드 검색할 수 있다.

In scope:
- Modal-based row-action UI for tag_rules CRUD on `/admin/tags`.
- 상단 탭(`태그` / `전체 규칙`) 전환과 flat tag_rules 검색 테이블.
- API rename: `/api/admin/tag-rules*` → `/api/admin/tags/:tagId/rules[/:ruleId][/suspend]` (BE handler + OpenAPI + zod contracts + FE api + MSW + tests + spec sync 동시).
- Migration 024: `tag_rules.created_by` 컬럼 + 작성자 표시.
- Spec sync: `feature-voc.md §9.4.1`, `routing-conventions.md`, `shared/openapi.yaml` (TagRule 스키마 + 경로).

Out of scope:
- 다중 태그 일괄 import (NextGen).
- `tag_rules.updated_by` / `last_modified_by` audit (NextGen).
- match_mode 외 다른 매칭 방식(regex/exact) 실제 구현 — select UI 슬롯만 노출하고 옵션은 `keyword` 단일 유지.

</domain>

<decisions>
## Implementation Decisions

### Edit Surface
- **D-01:** `규칙 N건` 뱃지 클릭 → **Modal Dialog** 오픈. 기존 `TagMaster*Modal` 패턴(`TagMasterEditModal` / `TagMasterSuspendModal` / `TagMasterMergeModal`) 재사용. Modal 내부에 해당 태그의 규칙 sub-table + 인라인 추가/수정 폼 + 행별 액션(수정/일시중지/재개/삭제) 배치. Side drawer / 인라인 확장 row 채택하지 않음 (admin 패턴 일관성).
- **D-02:** Modal 내 sub-table은 spec §9.4.1 의 컬럼(`키워드 목록 | 생성 태그명 | 매칭 방식 | 작업`)을 그대로 따르되, `작성자`(created_by) 컬럼을 추가한다. Dialog 헤더에는 부모 태그명 + `규칙 N건` 카운트 표시.

### "전체 규칙 보기" 토글
- **D-03:** `/admin/tags` 상단에 view-mode **탭**(`태그` / `전체 규칙`)을 둔다. `전체 규칙` 탭은 flat `tag_rules` 테이블(`키워드 | 태그 | 매칭 방식 | 일시중지 상태 | 작성자 | 작업`)을 표시하고, 키워드 검색은 서버측 `q` 파라미터 활용.
- **D-04:** 탭 상태는 URL query(`?view=tags|rules`, `?q=...`)로 영속화하여 새로고침/공유 가능하게 한다. 기본값은 `tags`.

### Form Fields & Validation
- **D-05:** 키워드 입력은 **chip array** UX (Enter / 쉼표로 chip 추가, x로 제거, 중복 입력 시 inline 에러). 폼 제출 시 BE는 정규화된 string array로 받는다 (zod contract 갱신).
- **D-06:** `match_mode` **select 노출** — 현재 선택지는 `키워드` 한 옵션이지만 select 컴포넌트 자체는 렌더(future-proof). v2에서 regex/exact 추가 시 옵션만 확장.
- **D-07:** `created_by`는 서버에서 현재 로그인한 사용자의 `displayName`으로 자동 set (FE 미입력). Dialog 내 sub-table 컬럼과 success criterion #2 의 "Dialog에 작성자 이름 표시"를 충족.

### API Rename (full migration)
- **D-08:** **Tag-nested resource 완전 이행**:
  - `GET  /api/admin/tag-rules?tagId=` → `GET  /api/admin/tags/:tagId/rules`
  - `POST /api/admin/tag-rules`         → `POST /api/admin/tags/:tagId/rules`
  - `PATCH /api/admin/tag-rules/:id`    → `PATCH /api/admin/tags/:tagId/rules/:ruleId`
  - `DELETE /api/admin/tag-rules/:id`   → `DELETE /api/admin/tags/:tagId/rules/:ruleId`
  - `PATCH /api/admin/tag-rules/:id/suspend` → `PATCH /api/admin/tags/:tagId/rules/:ruleId/suspend`
- **D-09:** Rename은 단일 PR 내 동기 변경: `shared/openapi.yaml` (operationId 유지하되 path/`tags`/`parameters` 갱신), `shared/contracts/` zod 입력 스키마, `backend/src/routes/admin-tags.ts` 라우트 등록부, `backend/src/services/admin/tag-master.ts` 호출부, `frontend/src/features/admin/tag-master/api/tag-master.api.ts`, `frontend/src/test/mocks/handlers/admin-tags.ts`, BE Jest + FE Vitest 테스트, `feature-voc.md §9.4.1`, `routing-conventions.md`. 구 경로는 호환 alias 없이 즉시 제거 (외부 consumer 없음).
- **D-10:** Success criterion #3 (`rg "/admin/tag-rules"` = 0)의 정책 경계: ADR / git history / `.planning/` 아카이브 제외. rename 완료 후 코드(BE 라우트 + OpenAPI + 컨트랙트 + FE api + MSW + 테스트)에서 자연 0 도달.

### Live Badge Update
- **D-11:** **Optimistic update** 채택. mutation `onMutate` 에서 admin-tags list cache 의 해당 `tag.rule_count` 를 ±1 (rollback context 보존), `onError` 에서 rollback, `onSettled` 에서 admin-tags list invalidate (서버 진실 동기). 동일 태그에 대한 동시 mutation race 는 last-write-wins.

### Migration 024
- **D-12:** Mig 024는 `tag_rules.created_by` 단일 컬럼 추가만 수행 (OQ-5 lock, 2026-05-10). NULL 허용 + backfill 정책은 plan-phase 에서 결정 (대안: NULL 유지 / "system" sentinel / 기존 admin 한 명 backfill). 본 phase 내 신규 row 부터 set.

### Permission Model (carry from ADR-0004)
- **D-13:** Tag rule mutate 권한:
  - `POST /api/admin/tags/:tagId/rules` — Manager+ (일상 운영).
  - `PATCH /api/admin/tags/:tagId/rules/:ruleId` (이름/키워드 수정) — Manager+.
  - `DELETE /api/admin/tags/:tagId/rules/:ruleId` — Admin only (irreversible 보호, ADR-0004 §irreversible 정책 준용).
  - `PATCH /api/admin/tags/:tagId/rules/:ruleId/suspend` — Admin only (현행 유지).
  - 사이드바 `/admin/tags` entry visibility 는 ADR-0004 의 Tag Master 정책(Admin / Manager / Dev read) 준용.

### Trash Restore Idempotency (carry from ADR-0005)
- **D-14:** rename 후에도 `vocs` 복원 시 `tag_rules` 멱등 재실행(ADR-0005 §복원 시 재실행) 정책 유지. BE 서비스의 `tag_rules` 호출부 경로/식별자만 nested 형태에 맞춰 갱신.

### Claude's Discretion
- Modal 폭 / sub-table 페이지네이션 임계치 — uidesign.md 토큰과 기존 TagMaster Modal 폭에 맞춰 결정.
- Optimistic update 의 race rollback context shape — TanStack Query 표준 패턴.
- `q` 검색의 BE 매칭 컬럼 (현재는 `tag_rules.keywords` + `tags.name` 양쪽) — researcher가 확인.
- Mig 024 `created_by` backfill 정책 — plan-phase 에서 결정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / 요구사항
- `.planning/ROADMAP.md` — Phase 1 success criteria (5건).
- `.planning/REQUIREMENTS.md` — REQ-admin-pages-wave Phase A acceptance.
- `.planning/PROJECT.md` — current milestone + ADR registry.

### Spec (정본)
- `docs/specs/requires/feature-voc.md §9.4.1` — 태그 규칙 관리 (modal-based row-action으로 재정의 대상).
- `docs/specs/requires/feature-voc.md §9.4.6` — 태그 마스터 §9.4.6 (Manager+ / Admin-only mutate 분리, suspend = Admin only — 본 phase 의 권한 모델 baseline).
- `docs/specs/requires/feature-voc.md §9.4.7` — 휴지통 복원 시 `tag_rules` 멱등 재실행 (rename 후에도 유지).
- `docs/specs/requires/routing-conventions.md` — `/admin/tag-rules` 별 라우트 부재 명문화 + `/admin/tags` view-mode query 컨벤션.
- `docs/specs/requires/uidesign.md` — Modal / Tab / Chip / Pagination 토큰.
- `docs/specs/requires/api-conventions.md` — REST nested resource path 규칙.
- `docs/specs/requires/test-conventions.md` — Vitest / Jest fixture 패턴.

### ADR (LOCKED)
- `docs/adr/0004-admin-permission-model.md` — admin 권한 모델 (Manager+ vs Admin-only mutate).
- `docs/adr/0005-trash-restore-policy.md` — `vocs` 복원 시 `tag_rules` 재실행 (rename 후에도 유지).

### Contracts / Code (rename 대상)
- `shared/openapi.yaml:1532–1817` — 현행 `/admin/tag-rules` paths + TagRule / TagRuleInput / TagRulePatch / TagRuleSuspendInput 스키마 (paths 만 nested 로 이동, 스키마는 유지).
- `shared/contracts/` — TagRule 관련 zod 입력 스키마 (`TagRuleSuspendInput` 등).
- `backend/src/routes/admin-tags.ts` — BE 라우트 등록부.
- `backend/src/routes/__tests__/admin-tags.test.ts` — Supertest 케이스.
- `backend/src/services/admin/tag-master.ts` — 서비스 호출부.
- `backend/src/__tests__/admin-router-mount.test.ts` — 라우트 mount 검증.
- `backend/src/__tests__/admin-contract.test.ts` — 계약 테스트.
- `backend/src/__tests__/permission-matrix.test.ts` — 권한 매트릭스.
- `frontend/src/features/admin/tag-master/api/tag-master.api.ts` — FE API hooks.
- `frontend/src/features/admin/tag-master/ui/` — TagMaster*Modal 패턴 (재사용 + 신규 RuleManagerModal).
- `frontend/src/pages/admin/tags.tsx` — 페이지 호스트, 탭/검색 추가.
- `frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx` — 페이지 테스트.
- `frontend/src/test/mocks/handlers/admin-tags.ts` — MSW handler.
- `scripts/check-fixture-seed-parity.ts` — fixture-seed parity 에 `tag_rules` 추가.
- `shared/fixtures/` — `tag_rules` MSW + seed parity.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/features/admin/tag-master/ui/TagMasterEditModal.tsx`, `TagMasterSuspendModal.tsx`, `TagMasterMergeModal.tsx`, `TagMasterCreateModal.tsx` — Modal 패턴 직접 재사용. 신규 `TagRulesManagerModal` (또는 `TagMasterRulesModal`) 추가.
- `useSuspendTagRule()` (`tag-master.api.ts:84`) — suspend hook 이미 존재. URL 만 nested 로 재매핑.
- `TagRuleSuspendInput` zod (`shared/contracts/`) — 입력 스키마 재사용.
- BE 라우트 `PATCH /admin/tag-rules/:id/suspend` (`backend/src/routes/admin-tags.ts:191-205`) — handler 로직 유지, 라우트 path 만 변경.
- OpenAPI TagRule 스키마(2960-3866 영역) — paths 만 이동.

### Established Patterns
- TagMaster CRUD 는 모두 modal 기반 (인라인 row 편집 없음) — Phase 1 의 Modal 결정과 일치.
- TanStack Query mutation + invalidate 는 `tag-master.api.ts` 의 기존 패턴 답습.
- MSW handler 는 `frontend/src/test/mocks/handlers/admin-tags.ts` 에 단일 파일 집약 — rename 시 동일 파일 내 갱신.
- BE Jest + Supertest 는 `admin-tags.test.ts` 단일 스위트.
- 페이지 라우트는 `app/router.tsx:13` 에서 lazy import (`AdminTagsPage`) — 새 라우트 추가 없음.

### Integration Points
- Migration 024 (`backend/migrations/`) — `tag_rules.created_by` 컬럼 추가 (NULL 허용, FK는 plan-phase 에서 결정).
- BE service 의 voc 복원 흐름 (ADR-0005) — `tag_rules` 재실행 호출부 경로 갱신.
- Sidebar nav (admin 권한) — `/admin/tags` 단일 entry 유지, `/admin/tag-rules` entry 부재 명문화 (이미 부재).
- Fixture-seed parity 스크립트 — `tag_rules` 테이블을 parity 대상에 추가 (현재는 `vocs` only — STATE.md Performance Metrics 명시).

</code_context>

<specifics>
## Specific Ideas

- 사용자는 spec §9.4.1 의 row-action 통합 의도를 모달 + sub-table 형태로 구현하기를 명시. "인라인 폼" 표현은 modal 내부의 인라인 입력으로 해석.
- 키워드 입력 UX 는 chip(token) 형태 — Enter / 쉼표로 추가, x 로 제거. 단순 string textarea 거부.
- `match_mode` 는 현재 1옵션이지만 select 컴포넌트 자체를 렌더하여 v2 확장 슬롯을 선노출.
- API 경로 `/admin/tag-rules` 자체가 더 이상 별도 리소스가 아니므로, REST 의미론적으로도 tag-nested 가 맞다는 사용자 판단 — 단일 PR 내 breaking rename.

</specifics>

<deferred>
## Deferred Ideas

- 다중 태그 일괄 import (NextGen) — PROJECT.md Out of Scope.
- match_mode 추가 옵션(regex / exact) 실제 구현 — select 슬롯만 본 phase, 옵션 확장은 별도 phase.
- `tag_rules.updated_by` / `last_modified_by` audit (NextGen).
- `voc_types` HEX color picker / merge — Phase 2.
- `tag_rules` 일시중지 만료 알림 / 자동 재개 cron — 미스코프.

</deferred>

---

*Phase: 1-tag-rules-consolidation*
*Context gathered: 2026-05-10*
