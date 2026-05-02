# Phase 8 Wave 1 — 설계 계획 (VOC 리스트 + 검토 드로어 vertical slice)

> **Note:** §13.x references in this archive predate the 2026-05-02 (C-2.5 audit) rename — `uidesign.md §13` was renumbered to §14. Current equivalents: §13.1→§14.1 ... §13.12→§14.12. New §13 is "Badge System".

> 작성: 2026-05-01
> 선행: Phase 8 Wave 0 머지 (PR #102), 8-PR1 권한 인프라 머지 (PR #103)
> 정본 spec: `docs/specs/plans/phase-8.md` §"Wave 1" (line 186~250)
> 본 문서: Wave 1 단일 PR (vertical slice) 설계 계획. 코드 변경 없음.
> Architect 모드 산출 — 미해결 모호점 §12 사용자 결정 완료 (2026-05-01).

---

## 0. 결정 로그 (2026-05-01)

| ID  | 결정                                                                                                                        | 영향                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Q1  | **B** — `shared/contracts/voc/{entity,io,note}.ts` 3분할 + barrel `voc/index.ts`                                            | 200 LOC 룰 무력화 방지. Wave 2+ contract 분할 패턴 정착 |
| Q2  | **A** — BE `services/voc.ts` 단일 170 LOC 유지                                                                              | YAGNI. Wave 2 dashboard에서 위젯별 분할 패턴 첫 도입    |
| Q3  | **A** — Wave 1 신규 마이그 0건 (스키마 충족 확인: `vocs` 컬럼 일체 + `voc_history` field-level + `voc_internal_notes` 존재) | C2 BE 테스트 작성 막힘 없음                             |
| Q4  | **B** — shadcn 4종(textarea/tooltip/alert/popover)은 Wave 1 직전 별도 mini-PR (Wave 0 연장)                                 | Wave 1 PR LOC 부담 ↓. 인프라/feature 분리               |
| Q5  | **A** — F12 `setPriority` 회귀 테스트(B-T6) Wave 1 포함                                                                     | drawer form에 priority UI 자연 포함. F12 진척률 4/5     |

---

## 1. Goal / Scope / Done-when / Constraints (Input Interpretation 프레임)

### Goal

VOC 리스트 페이지와 검토(상세) 드로어를 single vertical slice (계약 + FE + BE)로 구현하여 Phase 8의 **기준 화면 패턴**을 확정한다. 폴더 구조·컴포넌트 분리 기준·queryKey 컨벤션·shadcn 토큰 매핑·테스트 깊이·에러/빈/로딩/권한 차단 표현이 본 PR로 동시에 결정된다.

### Scope (touch)

- **추가**: `shared/contracts/voc.ts`, `shared/fixtures/voc.fixtures.ts`, `frontend/src/api/voc.ts`, `frontend/src/mocks/handlers/voc.ts`, `frontend/src/features/voc/**`, `frontend/src/components/voc/**`, `frontend/src/pages/VocPage.tsx`, `backend/src/routes/voc.ts`, `backend/src/controllers/voc.ts`, `backend/src/services/voc.ts`, `backend/src/validators/voc.ts`, FE/BE `__tests__`.
- **수정**: `shared/contracts/common.ts` (Pagination/SortDir 보강), `frontend/src/router.tsx` (`/voc`, `/voc/:id` 라우트), `frontend/src/api/queryKeys.ts` (필요 시 `voc.subtree`/`voc.notes` 추가).
- **건드리지 않음**: 다른 도메인(dashboard/notice/admin/external/users) 컴포넌트, 타 마이그레이션 파일, `backend/src/services/permissions/assertCanManageVoc.ts` (이미 머지됨, 그대로 사용), Wave 0에서 머지된 AppShell/Sidebar/TopBar.

### Done-when (verifiable)

1. `npm -w shared run typecheck` clean — Zod schema가 50건 fixture 100% 파싱.
2. `npm -w frontend run typecheck && npm -w frontend run lint && npm -w frontend run test` clean — RTL 시나리오 5건 PASS, ESLint `max-lines` 위반 0.
3. `npm -w backend run test` clean — Jest+supertest 200/400/403/404 4 케이스 PASS.
4. Playwright 1 happy path PASS (리스트 → 필터 → 행클릭 → 드로어 → 노트 작성 → 닫힘).
5. `VITE_USE_MSW=false`로 FE 빌드 후 실제 BE에 붙여 5개 엔드포인트 응답 shape이 Zod schema와 일치 (수동 verification 1회).
6. 시각 확인: `prototype.html` voc 화면(2장) vs 구현본 비교 — 차이는 의도적이어야 하고 PR description에 명시.
7. PR description에 LOC 합계 + ≤1500 LOC 예외 사유 + Wave 0 패턴 적용 내역 기재.
8. (별도 PR/별도 commit) `phase-8-pattern.md`는 본 PR 머지 **이후** 회고로 작성 — Wave 2 진입 게이트.

### Constraints

- **권한**: 모든 BE 쓰기 라우트는 §8.4-bis `assertCanManageVoc(user, voc, action)` 경유. 라우트에서 직접 role 분기 금지.
- **계약 단일 출처**: FE/BE는 `shared/contracts/voc.ts`의 Zod schema만 import (FE는 RHF resolver, BE는 validator middleware).
- **mock↔real 1줄 스왑**: FE 코드는 항상 `import { vocApi } from '@/api/voc'`. MSW 분기는 `main.tsx` 부트스트랩에서만.
- **토큰 하드룰**: hex / raw OKLCH 금지. 상태 뱃지·우선순위 색은 `var(--status-*)` / `var(--priority-*)` 토큰을 통해서만.
- **LOC 룰**: pages ≤200, widgets ≤80, 일반 컴포넌트 ≤200. 위반 시 `useVocPageController` 같은 오케스트레이션 hook으로 분산 — Wave 0 룰 1번 (phase-8.md §0.0 pre-mortem 1).
- **TDD**: 모든 commit은 테스트 먼저. 본 §6 매트릭스가 commit 순서를 결정.
- **프로토타입 직역 금지**: 시각/UX 참조만. DOM 구조는 React 기준 재설계.

---

## 2. 파일 인벤토리 + LOC 예산

> 합산 예산: **≤1500 LOC** (테스트 포함, phase-8.md §Wave 1 PR LOC 목표 예외 허용).
> 200 LOC 룰 위반 위험 파일 = ★ 표기, 분리안 제시.

### 2-1A 계약 영역 (~280 LOC)

| 파일                                       | 예상 LOC | 200 룰    | 분리 근거                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | -------: | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/contracts/voc.ts`                  |    ★ 220 | 위반 위험 | Zod 9개 schema (Voc, VocStatus, VocSource, VocFilter, VocListQuery, VocListResponse, VocCreate, VocUpdate, InternalNote, VocHistory) — schema 정의는 분리 시 cross-import 비용↑. **단일 파일 유지**, ESLint `max-lines` 예외 등록. 또는 파일 단위 분리(`voc.entity.ts` / `voc.io.ts` / `voc.note.ts`) — §12 Q1 |
| `shared/contracts/common.ts` 보강          |      +20 | OK        | 기존 26 LOC + Pagination 확장(cursor/offset 양립 옵션) + `SortOrder` 헬퍼                                                                                                                                                                                                                                      |
| `shared/fixtures/voc.fixtures.ts`          |      180 | OK        | 50건 fixture (시스템 3종 × 상태 5종 + 권한 케이스 + 길이 초과 1건) — generator 함수 사용                                                                                                                                                                                                                       |
| `docs/specs/plans/phase-8-contract-voc.md` |       60 | OK        | 계약 PR 메모 (의도·spec 매핑·후속 영향) — phase-8.md §1-A 명시 산출                                                                                                                                                                                                                                            |

### 2-1B FE 영역 (~860 LOC, 테스트 포함)

| 파일                                                         | 예상 LOC | 200 룰 | 분리 근거                                                                                                                                                                      |
| ------------------------------------------------------------ | -------: | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/api/voc.ts`                                    |       90 | OK     | 5개 fetcher (list/get/create/update/addNote). client.ts 활용으로 zod parse는 1줄                                                                                               |
| `frontend/src/mocks/handlers/voc.ts`                         |      110 | OK     | MSW 핸들러 5개 + fixture 필터링 헬퍼                                                                                                                                           |
| `frontend/src/features/voc/useVocList.ts`                    |       70 | OK     | useQuery + filter→queryKey 변환                                                                                                                                                |
| `frontend/src/features/voc/useVocMutation.ts`                |       90 | OK     | create/update/addNote mutations + onSuccess invalidation                                                                                                                       |
| `frontend/src/features/voc/useVocFilters.ts`                 |       80 | OK     | URL ↔ filter 동기화 (`searchParams`)                                                                                                                                           |
| `frontend/src/features/voc/useVocPageController.ts`          |       90 | OK     | 위 3 hook + role 가드 + drawer open 상태 조합 (LOC 분산 핵심)                                                                                                                  |
| `frontend/src/components/voc/VocListPage.tsx`                |      120 | OK     | 페이지 컨테이너 — controller 호출만, presentational 위젯 조합                                                                                                                  |
| `frontend/src/components/voc/VocTable.tsx`                   |    ★ 180 | 경계   | TanStack Table 인스턴스 + 역할별 컬럼 + 인라인 펼침(§9.2.2). **분리안**: `VocTableColumns.ts` (컬럼 정의)와 `VocTableRow.tsx` (행 렌더) 분리 — 본 계획 채택. → 실제 LOC 120/60 |
| `frontend/src/components/voc/VocTableColumns.ts`             |       60 | OK     | 역할별 컬럼 매트릭스                                                                                                                                                           |
| `frontend/src/components/voc/VocFilterBar.tsx`               |      130 | OK     | 필터 칩(상태 다중/시스템 단일/유형 다중/담당자 단일/검색)                                                                                                                      |
| `frontend/src/components/voc/VocSortChips.tsx`               |       70 | OK     | §9.5 정렬 칩 6개 + URL sync                                                                                                                                                    |
| `frontend/src/components/voc/VocStatusBadge.tsx`             |       40 | OK     | 상태 뱃지 (5종 토큰)                                                                                                                                                           |
| `frontend/src/components/voc/VocRowActions.tsx`              |       60 | OK     | 행 액션 메뉴 + 권한 가드                                                                                                                                                       |
| `frontend/src/components/voc/VocDrawer.tsx`                  |      110 | OK     | Radix Dialog `side=right` + 헤더/탭 컨테이너                                                                                                                                   |
| `frontend/src/components/voc/VocDrawerHeader.tsx`            |       70 | OK     | 메타 + 풀스크린/링크/삭제/닫기 (§8.17)                                                                                                                                         |
| `frontend/src/components/voc/VocDrawerForm.tsx`              |    ★ 180 | 경계   | RHF + Zod, 상태/유형/우선순위/담당자/Due/태그 — **분리안**: `VocDrawerStatusField.tsx` (상태 머신 §8.2) 분리 → 실제 130/50                                                     |
| `frontend/src/components/voc/VocDrawerStatusField.tsx`       |       50 | OK     | 상태 5단계 + 비허용 disabled + 툴팁                                                                                                                                            |
| `frontend/src/components/voc/VocDrawerNotes.tsx`             |      110 | OK     | Internal note 리스트 + 작성 폼 (§8.16) — Dev/Manager/Admin only, User → DOM 미렌더                                                                                             |
| `frontend/src/components/voc/VocDrawerHistory.tsx`           |       70 | OK     | `voc_history` timeline (Wave 1은 read-only)                                                                                                                                    |
| `frontend/src/components/voc/VocPermissionGate.tsx`          |       50 | OK     | 권한 차단 안내 패널                                                                                                                                                            |
| `frontend/src/pages/VocPage.tsx`                             |       30 | OK     | 라우트 진입점 (`<VocListPage />` 호출만)                                                                                                                                       |
| `frontend/src/components/voc/__tests__/VocListPage.test.tsx` |      130 | OK     | RTL 5 시나리오 (빈/오류/로딩/권한 차단/필터+드로어)                                                                                                                            |
| `frontend/src/components/voc/__tests__/VocDrawer.test.tsx`   |       80 | OK     | 드로어 + Internal Note + 상태 변경                                                                                                                                             |
| `frontend/e2e/voc-happy-path.spec.ts`                        |       70 | OK     | Playwright 1 시나리오                                                                                                                                                          |
| `frontend/src/router.tsx` 갱신                               |      +15 | OK     | `/voc`, `/voc/:id` 라우트                                                                                                                                                      |

### 2-1C BE 영역 (~360 LOC, 테스트 포함)

| 파일                                | 예상 LOC | 200 룰             | 분리 근거                                                                                                                                                                                                     |
| ----------------------------------- | -------: | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/routes/voc.ts`         |       90 | OK                 | 5개 라우트 + `validate()` middleware + `assertCanManageVoc` 호출                                                                                                                                              |
| `backend/src/controllers/voc.ts`    |      110 | OK                 | req→service 변환 + response shape (계약 일치)                                                                                                                                                                 |
| `backend/src/services/voc.ts`       |    ★ 170 | 경계               | DB 쿼리 5개 (목록 페이지네이션 + 필터, 상세, 생성+issue_code sequence, 수정+history insert, note insert). **분리안**: `services/voc/list.ts`/`services/voc/detail.ts`/... 5분할 (Wave 2 패턴 학습용) — §12 Q2 |
| `backend/src/validators/voc.ts`     |       30 | OK                 | shared zod re-export + body/query/params validator middleware                                                                                                                                                 |
| `backend/src/__tests__/voc.test.ts` |      220 | 위반 (테스트 예외) | supertest 200/400/403/404 + Dev role 케이스 + fixture 파싱. **테스트 파일은 max-lines 예외** (Wave 0 ESLint 룰에서 `__tests__/**` exclude 확인 필요)                                                          |
| `backend/migrations/0XX_*.sql`      |     0~30 | OK                 | 신규 컬럼 가능성 낮음. 기존 vocs 컬럼 충분 추정 — §12 Q3                                                                                                                                                      |

### LOC 합계 (테스트 제외 / 포함)

- 계약: 280 / 280
- FE: 580 / 860
- BE: 230 / 360 (+ 마이그 0~30)
- **합계**: ~1090 / **~1500** (예외 한도 부합) — 단 Q1/Q2 분리 결정에 따라 ±100 LOC 변동.

---

## 3. 컴포넌트 props 인터페이스 sketch (TS 시그니처)

```ts
// 1. VocTable
interface VocTableProps {
  rows: VocListItem[]; // shared/contracts/voc.ts
  role: Role; // 컬럼 매트릭스 분기
  sort: { column: VocSortColumn; order: SortDir };
  onSortChange(next: { column: VocSortColumn; order: SortDir }): void;
  expandedParentIds: ReadonlySet<string>; // §9.2.2 인라인 펼침
  onToggleExpand(parentId: string): void;
  onRowClick(vocId: string): void; // 드로어 open
  loading?: boolean;
  emptyState?: ReactNode;
}

// 2. VocFilterBar
interface VocFilterBarProps {
  value: VocFilter; // shared/contracts
  onChange(next: VocFilter): void;
  systems: ReadonlyArray<SystemOption>; // master 데이터 (Wave 1은 fixture)
  menusBySystem: Record<string, MenuOption[]>;
  types: ReadonlyArray<TypeOption>;
  assignees: ReadonlyArray<UserOption>;
  role: Role; // User는 자기 VOC만 → 일부 필터 hide
}

// 3. VocSortChips
interface VocSortChipsProps {
  value: { column: VocSortColumn; order: SortDir };
  onChange(next: { column: VocSortColumn; order: SortDir }): void;
}

// 4. VocStatusBadge
interface VocStatusBadgeProps {
  status: VocStatus; // '접수'|'검토중'|'처리중'|'완료'|'드랍'
  size?: 'sm' | 'md';
}

// 5. VocDrawer
interface VocDrawerProps {
  vocId: string | null; // null이면 닫힘
  onClose(): void;
  fullscreen: boolean; // §9.9 토글
  onToggleFullscreen(): void;
}

// 6. VocDrawerForm
interface VocDrawerFormProps {
  voc: Voc;
  role: Role;
  currentUserId: string;
  onSubmit(patch: VocUpdate): Promise<void>; // mutation 위임
  onError(err: ErrorEnvelope): void;
}

// 7. VocDrawerNotes  (User → 부모가 DOM 미렌더, §8.16 fail-closed)
interface VocDrawerNotesProps {
  vocId: string;
  notes: InternalNote[];
  canWrite: boolean; // assertCanManageVoc 결과 거울
  onCreate(body: string): Promise<void>;
  onEdit(noteId: string, body: string): Promise<void>;
  onDelete(noteId: string): Promise<void>;
}

// 8. VocPermissionGate
interface VocPermissionGateProps {
  reason: 'role' | 'ownership' | 'deleted';
  action: VocAction;
  children?: never; // 명시적: 패널만 렌더, children 받지 않음
}
```

---

## 4. queryKey 명명 규칙 (기존 패턴 일관성 + Wave 1 키 목록)

기존 컨벤션(`frontend/src/api/queryKeys.ts:14-54`): `['<domain>', role, ...filters]`. role 포함이 invalidation 정책의 핵심.

### Wave 1에서 추가/사용할 키

```ts
queryKeys.voc = {
  all: (role) => ['voc', role] as const,
  list: (role, filter?) => ['voc', role, 'list', filter ?? {}] as const, // 기존
  detail: (role, id) => ['voc', role, 'detail', id] as const, // 기존
  notes: (role, id) => ['voc', role, 'notes', id] as const, // 신규
  history: (role, id) => ['voc', role, 'history', id] as const, // 신규
};
```

### Invalidation 정책

- `update(vocId)` 성공 → `voc.list(role)` + `voc.detail(role, vocId)` + `voc.history(role, vocId)` invalidate.
- `addNote(vocId)` 성공 → `voc.notes(role, vocId)` invalidate (목록은 영향 없음).
- 낙관적 업데이트는 status/priority 변경에만 적용 (서버 거부 시 onError에서 revert).
- role 변경(`useRole.set`)은 queryKey가 role을 포함하므로 자동 분리 — 기존 캐시는 GC로 정리.

---

## 5. shadcn 매핑표

| 컴포넌트             | 사용 shadcn 프리미티브                                                                        | 토큰                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| VocFilterBar         | `Select` (시스템/메뉴/담당자), `Input` (검색), `Button` (변형 ghost)                          | `var(--bg-panel)`, `var(--border-standard)`                                                           |
| VocSortChips         | `Button` (variant=outline) + 자체 active 상태                                                 | `var(--brand)` (active), `var(--text-secondary)` (idle)                                               |
| VocTable             | shadcn Table 미사용 — TanStack Table headless + 자체 wrapper. shadcn `DropdownMenu` (행 액션) | `var(--bg-app)`, `var(--bg-row-hover)`                                                                |
| VocStatusBadge       | 자체 component (shadcn Badge 미사용 — 5종 상태 토큰 분기 명시 위해)                           | `var(--status-pending)` / `--status-review` / `--status-progress` / `--status-done` / `--status-drop` |
| VocPriorityBadge     | 자체 component                                                                                | `var(--priority-urgent)` / `--priority-high` / `--priority-medium` / `--priority-low`                 |
| VocDrawer            | `Dialog` (Radix) `side=right` (Wave 0에서 추가된 dialog 변형 사용)                            | `var(--bg-panel)`, `var(--shadow-elev-2)`                                                             |
| VocDrawerHeader      | `Button` (icon variants) + `Tooltip`                                                          | 토큰 동일                                                                                             |
| VocDrawerForm        | `Label`, `Input`, `Select`, `Textarea`(Wave 1 추가 필요 — Q4)                                 | 토큰 동일                                                                                             |
| VocDrawerStatusField | `Select` + disabled 옵션 (§8.2 매트릭스)                                                      | `var(--text-disabled)`                                                                                |
| VocDrawerNotes       | `Button`, `Textarea`                                                                          | `var(--bg-warning-subtle)` (§8.16 warning 배경)                                                       |
| VocRowActions        | `DropdownMenu`                                                                                | 토큰 동일                                                                                             |
| VocPermissionGate    | `Alert` (Wave 1 추가 필요 — Q4)                                                               | `var(--bg-warning-subtle)`, `var(--text-warning)`                                                     |
| Toast                | sonner (Wave 0에서 도입)                                                                      | —                                                                                                     |

> Wave 0에서 카피된 8종: button, dialog, dropdown-menu, select, tabs, toast, input, label.
> **추가 필요 (§12 Q4)**: `textarea`, `tooltip`, `alert`, `popover` (FilterBar 칩 다중 선택 UI).

---

## 6. 테스트 매트릭스

> TDD 원칙: 본 매트릭스가 §8 commit 순서의 입력. 각 시나리오는 **실패하는 테스트가 먼저 commit** 된 뒤 구현이 따라옴.

### 6-1 Vitest + RTL (FE 5 시나리오)

| #                | Given                                       | When                                                                    | Then                                                                       | Fixture              |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------- |
| F-T1 빈          | role=manager, fixture=`[]`                  | `<VocListPage />` mount                                                 | "VOC가 없습니다" EmptyState 표시, table tbody 비어있음                     | `voc.empty.fixtures` |
| F-T2 오류        | MSW가 500 반환                              | mount                                                                   | ErrorState 컴포넌트 + 재시도 버튼 노출                                     | MSW handler override |
| F-T3 로딩        | MSW delay 100ms                             | mount                                                                   | LoadingState 스켈레톤 5행 표시 후 데이터 치환                              | 표준 fixture         |
| F-T4 권한 차단   | role=user, 본인 VOC가 아닌 id로 detail 조회 | drawer open                                                             | `<VocPermissionGate reason="role">` 표시, Form/Notes/History DOM 미렌더    | mixed fixtures       |
| F-T5 필터+드로어 | role=manager, 50건 fixture                  | 상태=`접수` 칩 클릭 → 행 클릭 → drawer open → 상태 `검토중` 변경 → 닫기 | URL `?status=접수` 동기화, drawer가 변경된 상태 반영, list invalidate 확인 | 표준 fixture         |

### 6-2 Playwright (1 happy path)

```
[Given] dev role 로그인 (mock-login), assignee=self인 VOC 1건이 fixture에 존재
[When]
  1. /voc 진입
  2. 검색 input에 'ANALYSIS' 타이핑 → 300ms debounce 후 결과 필터링
  3. 첫 행 클릭 → drawer 우측 열림 (transform 250ms)
  4. drawer Internal Notes 탭 클릭 → 노트 입력 'triage start' → 저장
  5. drawer 닫기 (Esc)
[Then]
  - drawer 닫힘 후 list 행 hover 시 노트 카운트 +1 표시
  - URL은 `/voc?q=ANALYSIS` 로 복귀 (drawer 닫히면 :id 제거)
  - 콘솔 에러 0건
```

### 6-3 Jest + supertest (BE 4 케이스 + 권한 회귀)

| #              | Given                                                    | When                                | Then                                                                                          | Fixture                  |
| -------------- | -------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------ |
| B-T1 200       | manager 세션, valid query                                | `GET /api/voc?status=접수&limit=20` | 200, body는 `VocListResponse` schema parse 성공                                               | seed_dev                 |
| B-T2 400       | manager, `limit=999`                                     | 동상                                | 400 `{code:'VALIDATION_FAILED', details:{field:'limit'}}`                                     | —                        |
| B-T3 403       | dev 세션, 타인 담당 VOC `PATCH /api/voc/:id` body=status | request                             | 403 `{code:'FORBIDDEN', action:'changeStatus'}`. **`assertCanManageVoc` 호출 1회 확인 (spy)** | seed_dev (assignee≠self) |
| B-T4 404       | manager, soft-deleted VOC id                             | `GET /api/voc/:id`                  | 404 (Admin만 `?includeDeleted=true` 통과 — §8.9)                                              | seed_dev                 |
| B-T5 권한 회귀 | dev=self assignee                                        | `POST /api/voc/:id/notes`           | 200, note row 생성                                                                            | seed_dev                 |

> §8.4-bis 회귀 5건 중 본 Wave 1은 `changeStatus` / `writeInternalNote` 두 액션을 검증. 나머지 (`setPriority` / `setDueDate` / 재배정) 는 동일 helper 경유이므로 단위 테스트는 `assertCanManageVoc.test.ts`(이미 PR #103에 포함)로 위임.

---

## 7. Prototype anchor 매핑 (CSS selector → React 컴포넌트)

> 프로토타입은 `prototype/prototype.html`의 voc 화면. **DOM 직역 금지** — selector는 시각·동작 reference 추출용으로만 사용.

| Prototype selector                            | React 컴포넌트                         | 비고                                                                            |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `.list-toolbar` (필터·검색·정렬 영역)         | `VocFilterBar` + `VocSortChips`        | 단일 toolbar를 2 컴포넌트로 분리 (책임 명확화)                                  |
| `.voc-group` (카드형 그룹)                    | `VocTable` (TanStack Table)            | 프로토타입은 카드 — Wave 1은 테이블 행. 시각은 비슷하게(행 hover · 좌측 컬러바) |
| `.voc-row[data-id]`                           | `VocTableRow` (내부 컴포넌트)          | 클릭 시 드로어 open                                                             |
| `.voc-row .expand-toggle` (▶/▼)               | `VocTableRow.ExpandToggle`             | §9.2.2 인라인 펼침                                                              |
| `.voc-row .status-pill`                       | `VocStatusBadge`                       | 토큰화                                                                          |
| `.voc-row .priority-pill`                     | `VocPriorityBadge`                     | 토큰화                                                                          |
| `.voc-drawer`                                 | `VocDrawer`                            | Radix Dialog `side=right`                                                       |
| `.voc-drawer .drawer-header .icon-fullscreen` | `VocDrawerHeader` 풀스크린 버튼 (§9.9) | URL `?view=full` 동기화                                                         |
| `.voc-drawer .drawer-header .icon-link`       | `VocDrawerHeader` 링크복사 (§8.17)     | `navigator.clipboard.writeText`                                                 |
| `.voc-drawer #internalNotes`                  | `VocDrawerNotes`                       | User → DOM 미렌더 (조건부 렌더 아님)                                            |
| `.voc-drawer #vocHistory`                     | `VocDrawerHistory`                     | timeline read-only                                                              |
| `.voc-permission-blocked`                     | `VocPermissionGate`                    | reason prop 분기                                                                |
| `.empty-state`                                | `<EmptyState />` (Wave 0 공통)         | —                                                                               |

---

## 8. Commit 순서 (단일 PR 내 ≤10 commit, 각 verifiable goal)

> Wave 0 머지 전제. 각 commit은 테스트 먼저 → 구현 → typecheck/lint clean.

| #   | Commit                                                                        | Verifiable goal                                                                                  |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| C1  | `feat(shared): voc contracts + fixtures`                                      | shared zod schema 9종 + fixture 50건. `npm -w shared run test` (zod parse) PASS. FE/BE 변경 없음 |
| C2  | `test(backend): voc routes 200/400/403/404 spec`                              | 실패 테스트만 commit. Jest는 RED                                                                 |
| C3  | `feat(backend): voc routes + service + validator`                             | C2 GREEN. `assertCanManageVoc` 5개 액션 모두 호출 확인                                           |
| C4  | `feat(frontend): voc api client + msw handlers`                               | `vocApi.list/get/create/update/addNote` + MSW 핸들러. 단위 테스트 (api 레이어) PASS              |
| C5  | `test(frontend): VocListPage 5 RTL scenarios`                                 | F-T1~F-T5 RED commit                                                                             |
| C6  | `feat(frontend): voc features hooks (useVocList/Mutation/Filters/Controller)` | features hook 단독 단위 테스트 PASS. 페이지는 아직 placeholder                                   |
| C7  | `feat(frontend): VocTable + FilterBar + SortChips + Badges`                   | C5 일부 GREEN (빈/오류/로딩/필터). drawer 테스트는 RED 유지                                      |
| C8  | `feat(frontend): VocDrawer + Form + Notes + History + Gate`                   | C5 모두 GREEN + drawer 테스트 PASS                                                               |
| C9  | `feat(frontend): /voc, /voc/:id 라우트 + VocPage 페이지 + AppShell 통합`      | router 갱신, 수동 시각 확인 (prototype 비교)                                                     |
| C10 | `test(e2e): playwright voc happy path + docs(plans): contract memo`           | Playwright PASS + `phase-8-contract-voc.md` 머지                                                 |

> commit ≤10 룰 부합. C2/C5는 RED commit이지만 CI에는 `--bail` 없는 한 후속 commit으로 GREEN 도달.

---

## 9. 검증 게이트 (PR 머지 전 체크리스트)

phase-8.md §"Wave 1" 검증과 정합:

- [ ] `npm -w shared run typecheck && test` (Zod parse 100%)
- [ ] `npm -w frontend run typecheck && lint && test` clean
- [ ] `npm -w backend run typecheck && lint && test` clean
- [ ] CI 매트릭스 (Wave 0 추가) — FE 빌드 + BE 빌드 + fixture-seed parity 모두 PASS
- [ ] Vitest+RTL 5 시나리오 PASS
- [ ] Playwright 1 시나리오 PASS
- [ ] `VITE_USE_MSW=false`로 mock 끄고 실 BE에 붙여 5 endpoint 응답 shape 일치 (수동 1회)
- [ ] Lighthouse a11y ≥ 95 (`/voc` 페이지)
- [ ] Prototype `#voc` vs 구현본 시각 비교 (오프닝 + 드로어 열림 = 2장)
- [ ] ESLint `max-lines` 위반 0 (pages ≤200 / widgets ≤80)
- [ ] hex/raw OKLCH 위반 0 (Wave 0 `no-raw-color` rule)
- [ ] PR description: LOC 합계 + ≤1500 예외 사유 + Wave 0 패턴 적용 명시
- [ ] `assertCanManageVoc` 호출 누락 0 (BE 라우트 grep verification)
- [ ] §8.4-bis 회귀 테스트 5건 중 Wave 1 범위 (changeStatus, writeInternalNote, unassigned, 재배정) 모두 GREEN
- [ ] `phase-8-contract-voc.md` 머지 (계약 PR 메모)
- [ ] (별도) 머지 후 24h 내 `phase-8-pattern.md` 작성 — Wave 2 진입 게이트

---

## 10. 영향 받는 Phase F 후속 항목

`next-session-tasks.md` "Phase F 후속" F1~F12 중 Wave 1 영향:

| ID  | 항목                                  | Wave 1 영향                                 | 처리 방식                                                                                                                |
| --- | ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| F1  | migration 013 dev role 실파일         | ✅ 8-PR1로 이미 머지 (PR #103)              | 사용                                                                                                                     |
| F2  | dev fixture                           | ✅ 머지됨                                   | 사용 — `voc.fixtures.ts`에서 dev assignee 케이스 추가                                                                    |
| F3  | `assertCanManageVoc` 헬퍼             | ✅ 머지됨                                   | 그대로 import                                                                                                            |
| F4  | FE/BE Role union                      | ✅ 머지됨 (`shared/contracts/common.ts:21`) | 사용                                                                                                                     |
| F5  | mock-login validator dev 확장         | ✅ 머지됨                                   | 사용                                                                                                                     |
| F6  | FE role guard hook                    | ✅ 머지됨 (`useRole.ts`)                    | 사용                                                                                                                     |
| F7  | Notice/FAQ `?mode=admin`              | ❌ Wave 4                                   | Wave 1 영향 없음                                                                                                         |
| F8  | Admin 서브탭 정리                     | ❌ Wave 3                                   | Wave 1 영향 없음                                                                                                         |
| F9  | uidesign §13 React 구현 (RolePill 등) | △ 부분                                      | Wave 1에서 RolePill 사용처 (FilterBar 우측) 만 적용                                                                      |
| F10 | prototype `#fff` 토큰화               | ❌ prototype 영역                           | Wave 1 영향 없음                                                                                                         |
| F11 | uidesign §5 Status Badge 토큰         | ✅ 정식화됨                                 | `VocStatusBadge`에서 사용                                                                                                |
| F12 | BE 회귀 테스트 5건                    | △ 부분                                      | Wave 1에서 `changeStatus` / `writeInternalNote` / `unassigned` / `재배정` 4건 커버. `setPriority`는 §6-3 미포함 — §12 Q5 |

---

## 11. 위험 + 완화 (Top 5)

| #   | 위험                                                                                         | 감지 신호                                                             | 완화                                                                                                                                                              | 롤백                                                                                 |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| R1  | **LOC 폭주** (vertical slice 특성) — pages/components 200 룰 위반 → ESLint 차단              | `max-lines` 위반 카운트 ≥ 1                                           | controller hook 적극 활용 (`useVocPageController`), `VocTable` → `VocTableColumns.ts` + `VocTableRow.tsx` 분할, `VocDrawerForm` → `VocDrawerStatusField.tsx` 분할 | C7/C8 partial revert + 분리 재시도                                                   |
| R2  | **계약 드리프트** — FE/BE가 같은 schema를 다르게 해석                                        | supertest body가 zod parse 실패 / FE form submit이 BE 400             | shared의 zod를 단일 import (re-declare 금지). validator middleware는 schema 객체를 직접 받음                                                                      | shared 갱신 후 양쪽 typecheck로 회귀 검출                                            |
| R3  | **Drawer state 복잡도** — fullscreen × URL × form dirty × notes mutation pending이 동시 폭발 | 테스트 F-T5에서 race condition / drawer가 close 후 form 잔여 상태     | drawer state는 `useVocPageController` 단일 출처. URL은 `vocId` 만 보유, fullscreen은 `?view=full`. form은 RHF dirty flag로 close 차단 prompt                      | drawer state machine을 xstate 도입 (NextGen 후보, Wave 1은 plain react state로 시도) |
| R4  | **권한 누수** — Internal Note가 User에게 노출 / 401-fail-open                                | `voc.test.ts` 회귀 + Playwright user role 시나리오 (Wave 1 추가 권장) | `VocDrawerNotes`는 부모(`VocDrawer`)에서 role guard로 **mount 자체 차단** (조건부 렌더 아님). BE `GET /api/voc/:id/notes`는 User → 404                            | hotfix PR로 guard 추가                                                               |
| R5  | **MSW vs 실 BE 응답 미스매치** — 개발 중에는 PASS, 통합 verification에서 발견                | `VITE_USE_MSW=false` 통합 시 zod parse 실패                           | shared zod로 양쪽 parsing 강제. 통합 verification을 §9 체크리스트에 명시. CI에 별도 `integration` job (BE 컨테이너 + FE build) 추가 검토 (Wave 2 후보)            | MSW handler를 BE 응답으로 sync                                                       |

---

## 12. 미해결 모호점 (사용자 결정 대기)

> Architect 룰: 본 항목은 **임의 결정 금지**. 양쪽 옵션 + 근거 + 영향 범위 명시 후 사용자 답변 대기.

### Q1. `shared/contracts/voc.ts` 단일 파일 vs 책임별 분리

- **옵션 A**: 단일 파일 + ESLint `max-lines` 예외 등록 (220 LOC).
  - 근거: cross-import 비용 0. Zod schema는 declarative여서 수직 스크롤 부담이 적음.
  - 영향: ESLint 룰에 `shared/contracts/voc.ts` 예외 추가 → 향후 다른 contract도 200 LOC 초과 시 동일 예외 신청 압력.
- **옵션 B**: `voc.entity.ts` (Voc/VocStatus/VocSource/VocPriority) + `voc.io.ts` (VocFilter/Query/Response/Create/Update) + `voc.note.ts` (InternalNote/VocHistory) 3분할.
  - 근거: 200 LOC 룰 위반 0. 책임 명확.
  - 영향: barrel `voc/index.ts` 추가, FE/BE import path 변경 (`@shared/contracts/voc/io` 등). Wave 2 dashboard 계약도 동일 분할 강제.
- **결정 필요 시점**: C1 commit 직전.

### Q2. BE `services/voc.ts` 5분할 여부

- **옵션 A**: 단일 파일 170 LOC 유지 (200 룰 부합).
- **옵션 B**: `services/voc/{list,detail,create,update,addNote}.ts` 5분할 — Wave 2 패턴 학습 강제.
  - 근거: 향후 Wave 2 dashboard service가 위젯별 8 쿼리 보유 예정 → 분리 패턴이 더 일찍 정착.
  - 영향: 서비스 디렉토리 컨벤션 신설 → `phase-8-pattern.md`에 기록. import 경로 변경.
- **결정 필요 시점**: C3 commit 직전.

### Q3. 신규 BE migration 필요 여부

- **현황**: 기존 `vocs` 테이블에 `due_date`, `priority`, `embedding`, `embed_stale` 등 §8 컬럼 대부분 존재(추정 — 실제 검증 필요). `voc_history` 테이블 존재 가정.
- **옵션 A**: 마이그 신규 작성 0. 기존 스키마 그대로.
  - 근거: Wave 1 범위는 read + 기본 mutation. structured payload는 §9.4.5 Result Review로 Wave 3+ 영역.
- **옵션 B**: `voc_history.event_type` enum 컬럼이 없으면 마이그 1건 (§9.4.5.1 history.event_type 가정 검증 필요).
- **결정 필요 시점**: C2 BE 테스트 작성 시 schema 충돌 발견하면 즉시 결정. 사용자에게 사전에 "기존 vocs/voc_history 스키마가 §8.2.1, §8.16 요구를 모두 만족하는지" 확인 요청 권장.

### Q4. shadcn 추가 카피본 (textarea / tooltip / alert / popover) 본 PR vs 별도 PR

- **옵션 A**: Wave 1 PR에 4종 추가 카피 (≤200 LOC 추가).
  - 근거: vertical slice가 이미 1500 LOC 한도라 burden 됨. 그러나 4종 모두 본 Wave에서 사용.
- **옵션 B**: Wave 1 직전 별도 mini-PR로 분리.
  - 근거: shadcn 카피본은 인프라 — Wave 0 연장선. PR LOC 분리.
  - 영향: PR 1개 추가, Wave 1 시작 시점 미세 지연.
- **결정 필요 시점**: Wave 1 PR open 전.

### Q5. Phase F12 `setPriority` 회귀 테스트를 Wave 1에서 함께 처리할지

- **옵션 A**: Wave 1 §6-3에 B-T6 (dev=self priority 변경 200) 추가 — F12 4/5 완료.
  - 근거: priority 변경 UI는 Wave 1 drawer form에 있으므로 자연스러움.
- **옵션 B**: Wave 1은 changeStatus + writeInternalNote만, 나머지는 별도 정리 PR.
  - 근거: Wave 1 LOC 절약.
- **결정 필요 시점**: C2 commit 직전.

---

## 부록 A. 참조 파일 (Architect 검증 출처)

- `docs/specs/plans/phase-8.md:186-250` — Wave 1 정본 spec
- `docs/specs/requires/feature-voc.md` — VOC 기능 요구사항
- `shared/contracts/common.ts:1-26` — 기존 cross-tier contract
- `frontend/src/api/queryKeys.ts:14-54` — queryKey 컨벤션
- `frontend/src/api/auth.ts:1-31` — fetcher 패턴
- `backend/src/services/permissions/assertCanManageVoc.ts:24-37` — 권한 헬퍼 (8-PR1 머지)
- `frontend/CLAUDE.md` — FE 룰 (토큰, prototype-as-reference, TDD)
- `backend/CLAUDE.md` — BE 룰 (route → service → repository, assertCanManageVoc 단일 헬퍼)
- `docs/specs/plans/next-session-tasks.md` — Phase F 후속 F1~F12
