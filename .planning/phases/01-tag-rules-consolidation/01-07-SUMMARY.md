---
phase: 01-tag-rules-consolidation
plan: 07
subsystem: frontend/admin/tag-master
tags: [admin, tag-master, tag-rules, ui, url-state]
requires: [01-05, 01-06]
provides:
  - 'TagRulesFlatTable: cross-tag flat rules listing for view=rules'
  - 'AdminTagsPage view-mode tabs (태그 / 전체 규칙) + ?view= + ?q= URL state'
  - '규칙 N건 row badge → TagRulesManagerModal mount (SC-1, SC-2)'
affects:
  - frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx
  - frontend/src/features/admin/tag-master/ui/TagMasterRow.tsx
  - frontend/src/pages/admin/tags.tsx
tech_stack_added: []
patterns:
  - useSearchParams (read + setParams replace)
  - 'useQueries (TanStack v5 cross-tag fan-out)'
  - 250ms debounce via useEffect+setTimeout cleanup
key_files_created:
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatRow.tsx
  - frontend/src/features/admin/tag-master/ui/TagRulesFlatTableEmptyState.tsx
  - frontend/src/pages/admin/__tests__/AdminTagsPage.plan07.test.tsx
key_files_modified:
  - frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx
  - frontend/src/features/admin/tag-master/ui/TagMasterRow.tsx
  - frontend/src/pages/admin/tags.tsx
  - frontend/src/pages/admin/__tests__/AdminTagsPage.test.tsx
decisions:
  - 'D-03/D-04 implementation: ?view + ?q via useSearchParams; 250ms debounce in page (Plan 07 plan)'
  - 'useQueries fan-out instead of new BE list endpoint (Plan 07 PICKED option C)'
  - 'OutlineChip primitive lacks brand-bg/accent variant — used inline button per UI-SPEC token contract (matches existing TagMaster inline-style convention)'
metrics:
  duration: '10m'
  completed: 2026-05-11
---

# Phase 1 Plan 07: TagMaster ↔ Modal/Flat Wiring + URL State Summary

`/admin/tags` 페이지를 stateful 컨트롤러로 승격해, 태그 행의 `규칙 N건` 배지로 `TagRulesManagerModal`을 마운트하고, `전체 규칙` 탭에서 cross-tag flat rules 테이블 + 250ms 디바운스 검색을 제공한다. ?view=tags|rules 와 ?q= URL 상태로 딥링크가 가능하다. SC-1 / SC-2 / SC-4 을 페이지 통합 테스트로 검증.

## Tasks Completed

| Task | Name                                                                          | Commit   |
| ---- | ----------------------------------------------------------------------------- | -------- |
| 1    | TagMasterTable 규칙 N건 row badge + TagRulesFlatTable + extracted Row/Empty   | 141efe7c |
| 2    | AdminTagsPage view-mode tabs + ?view/?q URL state + modal mount + tests       | ec131913 |

## What Shipped

### Row badge (Task 1)
- `TagMasterRow`: `규칙 N건` 셀(브랜드 토큰 OutlineChip 스타일 button) — N=0 → `규칙 없음` TextMark, N≥1 → `규칙 {N}건` 칩. `aria-label`은 `${name}의 규칙 ${N}건 관리`.
- 클릭 시 `onOpenRules(tag)` 콜백을 호출해 페이지가 모달을 마운트.
- Plan 05 placeholder `TagMasterSuspendModal` slot + disabled `일시중지` action 제거. 규칙 단위 suspend/resume은 모달 내부에 위치(Plan 06).

### Flat table (Task 1)
- `TagRulesFlatTable` + `TagRulesFlatRow` + `TagRulesFlatTableEmptyState`: 200-line 캡 충족을 위해 분리. `useQueries`로 모든 tag.id에 대해 nested rule list (`/api/admin/tags/:tagId/rules?q=`)를 fan-out한 뒤 `{rule, tag}` 배열로 평탄화.
- 컬럼: 키워드(칩 max 3 + `+N`) | 태그(클릭 시 `onJumpToTag`) | 매칭 방식(`키워드`) | 상태(`활성`/`일시중지됨`) | 작성자(`created_by_name ?? '—'`) | 작업(`수정` → `onEditRule`).
- 빈 상태 분기: `q==''` → `등록된 규칙이 없습니다 / 태그 탭에서 태그별로 규칙을 추가할 수 있습니다`. `q!=''` → `검색 결과가 없습니다 / 다른 키워드로 다시 검색하거나 검색어를 비워 전체 규칙을 확인하세요`.

### Page wiring (Task 2)
- `useSearchParams`로 view + q 읽기. view 기본 `tags`, q 기본 `''`.
- `qDraft` 로컬 상태 + 250ms `useEffect` setTimeout 디바운스로 URL `?q=` 갱신 (replace, view=rules 잠금).
- view 전환 시 q 초기화. 태그 탭 클릭 → `?view=tags` + q 제거. 검색 input은 `view==='rules'`일 때만 노출.
- 규칙 N건 배지 클릭 → `setRulesModalTag(tag)` → `TagRulesManagerModal` 마운트.
- T-01-16 mitigation: useSearchParams 인코딩 + React JSX 자동 이스케이프 + 250ms 디바운스로 URL 라이트 게이트.

## Tests

- 신규 `AdminTagsPage.plan07.test.tsx` 6 케이스:
  1. 기본 렌더 — 태그 탭 활성, 규칙 N건 컬럼 + `규칙 1건` / `규칙 없음` 배지.
  2. `전체 규칙` 탭 클릭 → flat table 렌더, 검색 input 표시.
  3. 검색 입력 변경 → 250ms 후에도 input 값 유지(디바운스 윈도우 통과).
  4. 규칙 N건 배지 클릭 → 모달 헤더에 태그명 + 규칙 표기.
  5. 딥링크 `?view=rules&q=foo` → 검색 input value=foo, rules 탭 활성.
  6. 딥링크 `?view=rules&q=zzz` → `검색 결과가 없습니다` 카피 노출.
- 기존 `AdminTagsPage.test.tsx` 는 W3-4 baseline 6 케이스로 슬림화(max-lines 200 충족), `vi.mock` factory 내 noop 인라인 정의로 호이스팅 안전.

### Test counts

| Suite                                        | Count |
| -------------------------------------------- | ----- |
| Frontend full Vitest                         | 721   |
| Plan 01 cumulative new tests (vs 691 baseline) | +30   |
| Plan 07 net additions on this plan            | +6 (plan07 file) |

`npm run typecheck -w frontend` clean. `npm run lint -w frontend` clean. `npm run test -w frontend -- --run` 93 file / 721 test pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Lint] max-lines (200) 위반 분리**
- **Found during:** Task 1 lint pass.
- **Issue:** TagRulesFlatTable.tsx 단일 파일이 249줄로 max-lines 200 초과.
- **Fix:** Row 본문을 `TagRulesFlatRow.tsx`로, EmptyState를 `TagRulesFlatTableEmptyState.tsx`로 분리. plan에서는 단일 파일 산출물을 명시했으나 코드 컨벤션이 우선.
- **Commit:** 141efe7c.

**2. [Rule 1 - Lint] AdminTagsPage.test.tsx max-lines 위반**
- **Found during:** Task 2 lint pass.
- **Issue:** baseline + plan-07 케이스 통합 시 251줄 → max-lines 200 초과.
- **Fix:** plan-07 케이스 6개를 `AdminTagsPage.plan07.test.tsx`로 분리(자체 mock 보유). 원본은 W3-4 baseline 6 케이스로 슬림화.
- **Commit:** ec131913.

**3. [Rule 1 - Bug] vi.mock factory hoisting 충돌**
- **Found during:** Task 2 first full-batch run.
- **Issue:** `noopMutation` 외부 상수 참조로 인한 `ReferenceError: Cannot access 'noopMutation' before initialization`.
- **Fix:** factory 본문 안쪽에서 `const noop = ...`로 인라인.
- **Commit:** ec131913 (수정 후 재테스트).

**4. [Rule 1 - Cleanup] 미사용 placeholder 제거**
- **Found during:** Task 1 onSuspend prop 정리.
- **Issue:** Plan 05이 남긴 `TagMasterSuspendModal` import + state slot이 모달 도입 후 데드코드.
- **Fix:** import / state / mount 모두 제거. 파일 자체(`TagMasterSuspendModal.tsx`)는 reversibility gate(file delete = irreversible)를 고려해 보존 — 후속 plan에서 일괄 정리 권고.
- **Commit:** 141efe7c.

### UI-SPEC Copywriting Contract Deviations

None. 모든 카피 (탭 라벨, search placeholder, row 배지 N=0/N≥1, view=rules empty headings + bodies, status `활성`/`일시중지됨`, 매칭 방식 `키워드`, 작성자 `—` fallback) 가 §Copywriting Contract 그대로.

## Threat Flags

없음. T-01-16 mitigation은 plan threat_model에 등록된 대로 구현 (useSearchParams 인코딩 + JSX 자동 이스케이프 + 250ms debounce).

## Known Stubs

없음. 모든 데이터 경로가 라이브 hook (useAdminTags / useAdminTagRules / 페이지 useQueries) 에 연결됨. flat table의 `수정` 버튼은 `onEditRule(tag)` → 모달 마운트로 동작 (선택된 ruleId 자동 진입은 후속 작업 영역).

## Manual UAT Pointers

- `/admin/tags` 진입 → `규칙 1건` 배지 클릭 → 모달 열림.
- `전체 규칙` 탭 클릭 → URL `?view=rules`, flat table 표시.
- 검색 인풋 `bug` 입력 → 250ms 후 URL `?view=rules&q=bug`.
- 검색 인풋 `<script>` 입력 → URL 인코딩 + 화면 내 텍스트로만 노출 (XSS 차단 확인, T-01-16).
- 검색 클리어 → URL `?view=rules` (q 제거).
- `태그` 셀 링크 클릭 → `?view=tags` 로 복귀.

## Self-Check: PASSED

- File `frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx` — FOUND
- File `frontend/src/features/admin/tag-master/ui/TagRulesFlatRow.tsx` — FOUND
- File `frontend/src/features/admin/tag-master/ui/TagRulesFlatTableEmptyState.tsx` — FOUND
- File `frontend/src/pages/admin/__tests__/AdminTagsPage.plan07.test.tsx` — FOUND
- Commit `141efe7c` — FOUND
- Commit `ec131913` — FOUND
- typecheck pass — confirmed
- lint pass — confirmed
- 721/721 vitest pass — confirmed
