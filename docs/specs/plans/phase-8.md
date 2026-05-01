# Phase 8 — FE 실구현 + Per-Screen Contract-First (A′)

> 작성: 2026-05-01
> 선행: Phase 7 close (PR #93/#94/#95) — 프로토타입·spec 완성
> 전제: 폐쇄망 환경. 모든 OSS는 build-time 번들/벤더링만 허용 (runtime fetch / telemetry 금지)
> 산출 단위: **계약 PR 1개 → FE/BE 병렬 PR (스크린 또는 스크린 그룹 단위)**

---

## 0′. RALPLAN-DR 요약 (consensus 입력)

### Principles (5)

1. **프로토타입은 명세, 코드 원본 아님** — JSX 직역 금지, React 기준 재설계.
2. **Contract-first per screen** — 모든 화면은 `shared/contracts/` Zod schema 머지 후 FE/BE 시작.
3. **재사용 우선** — 신규 화면은 기존 컴포넌트 80%+ 조립. 신규 추가는 "기존 불가 증명" 후만.
4. **단일 책임 + 작은 파일** — 페이지 ≤200 LOC, 위젯 ≤80 LOC. 폼·테이블·필터·hook·mock·테스트 모두 별도 파일.
5. **폐쇄망 안전** — runtime fetch/telemetry OSS 금지. 미러 부재 시 raw 벤더링 절차 명문화.

### Decision Drivers (top 3)

1. **다음 Phase와 충돌 무방지** (사용자 1순위 요구) — 계약 동기화로 해결.
2. **적정 단위 분해** — 너무 작으면 반복 구현 비용, 너무 크면 PR 리뷰 불가.
3. **폐쇄망 운영 가능성** — 모든 OSS는 build-time 번들만, 외부 송신 zero.

### Viable Options (consensus 단계 평가)

**Option A — 채택안: A′ Contract-first per-screen, 6 Wave (계약+FE+BE 분리 PR)**

- Pros: 충돌 방지(계약 PR이 동기화 게이트), FE/BE 병렬 가능, mock→real 1줄 스왑, 화면 단위 demoable
- Cons: 계약 PR이 매 도메인마다 추가됨 (PR 수 증가 ~18개), shared/ 폴더 신규 도입 비용

**Option B — 기각: BE+FE per-page 통합 (사용자 초안)**

- Pros: 계약 드리프트 없음, 한 PR이 vertical slice 완결
- Cons: PR당 1~2주, FE 반복 속도 저하, 병렬화 불가, 화면 폭증
- **기각 이유**: 충돌 방지 효과는 A′가 동등하게 제공하면서 비용은 절반 이하. 계약 드리프트의 진짜 원인은 "타입 단일 출처 부재"이지 "BE 분리"가 아님.

**Option C — 기각: FE-only 6 Wave, BE는 Phase 9로 분리**

- Pros: FE 속도 최대, 단일 영역 집중
- Cons: 계약 검증이 mock에 의존 → BE 합류 시 재작업 위험. Phase 9에서 계약 재협상 비용
- **기각 이유**: 계약 PR이 어차피 필요 → BE도 같은 계약을 동시에 검증하는 게 retest 비용을 줄임.

### Pre-mortem (3 시나리오, detection signal + rollback 포함)

1. **Wave 1 기준 화면이 LOC 룰 폭주** → 컴포넌트 분리 기준 흔들림.
   - **감지**: ESLint `max-lines` 위반 카운트 (CI에서 차단), `pages/VocListPage.tsx` ≥ 200 LOC.
   - **완화**: Wave 1 회고 필수 + `phase-8-pattern.md` 머지가 Wave 2 진입 게이트 (회고만 통과는 인정 안 함).
   - **롤백**: Wave 1 PR revert 후 컴포넌트 분리 기준 재설계, `useVocPageController` 같은 오케스트레이션 hook 신설로 LOC 분산.
2. **shadcn 카피본이 우리 토큰과 충돌해 매 컴포넌트 재작업** → 매 화면마다 hex/Tailwind 색 클래스 수동 치환.
   - **감지**: `eslint-plugin-tailwindcss` + 자체 룰로 `bg-white|text-black|#[0-9a-f]{3,6}|tw color literal` 패턴 차단. PR diff에 위반 발생.
   - **완화**: Wave 0-2에서 base 8 종으로 토큰 매핑 codemod (`scripts/shadcn-token-rewrite.ts`) 작성, 이후 신규 카피본에 자동 적용.
   - **롤백**: 위반 컴포넌트만 hotfix PR로 토큰 치환 (전체 revert 불필요).
3. **사내 npm 미러 부재 발견이 Wave 1 진행 중** → 모든 의존성 도입 차단.
   - **감지**: Wave 0 첫 작업 = `npm config get registry` + `npm install @tanstack/react-query --dry-run` 시도, 실패 시 즉시 STOP.
   - **완화**: Wave 0-10 OSS 가이드 + 사전 점검을 Wave 0 첫 commit으로 강제. 미러 부재 확정 시 §7 raw 벤더링 절차로 우회 결정 (사용자 승인 필요).
   - **롤백**: Wave 0 진행 중 발견이면 의존성 추가 commit revert, 미러 확보까지 Phase 8 holding.

### ADR seed (Critic 통과 후 §10에서 본 ADR로 확정)

- **Decision**: Phase 8 = A′ Contract-first per-screen, 6 Wave, shadcn/ui + TanStack 스택
- **Drivers**: 다음 Phase 충돌 방지 / 적정 PR 단위 / 폐쇄망 안전
- **Alternatives considered**: B (BE+FE 통합), C (FE-only)
- **Why chosen**: 충돌 방지 효과 동등 + 병렬화·반복 속도·테스트 fixture 공유 이점
- **Consequences**: shared/ 신규 디렉토리 + tsconfig path / 계약 PR 18개 추가 / Zod 양쪽 도입 / shadcn 카피본 리포 보유
- **Follow-ups**: NextGen 시점에 contract 진화 정책(versioning) 재논의, 시각 회귀 자동화는 별도 phase

---

## 0. 원칙 (Phase 8 전체 관통)

1. **프로토타입 = 시각·동작 명세**, 코드 원본 아님. JSX로 직역 금지. (`prototype/CLAUDE.md` + 루트 prototype-as-reference)
2. **Contract-first**: 모든 화면은 `shared/contracts/<domain>.ts` (TS type + Zod) 확정 PR이 먼저 머지된 뒤 FE/BE 구현 PR이 시작됨.
3. **재사용 우선**: 신규 화면은 기존 컴포넌트로 80% 이상 조립. 새 컴포넌트는 "기존으로 재현 불가"가 증명될 때만 추가.
4. **파일 1개 = 단일 책임**. 페이지 컴포넌트는 ≤200 LOC 목표, 초과 시 컴포넌트 분리. hook·query·mock·테스트는 모두 별도 파일.
5. **mock → real 스왑은 1줄**. FE는 항상 `import { vocApi } from '@/api/voc'` — 내부에서 MSW vs real fetch가 환경변수로 분기.
6. **CSS 토큰 하드룰** 유지 — `var(--bg-app)` 등. Tailwind v4 `@theme`는 `tokens.ts` 단일 출처 (이미 적용됨).
7. **PR 단위**: 한 화면(또는 좁은 화면 그룹) = 1 PR. 한 PR은 ≤800 LOC 목표 (테스트 제외).

---

## 1. 폴더 구조 (확정)

```
shared/
  contracts/
    common.ts           # Pagination, Role, ErrorEnvelope, ListResponse<T>
    voc.ts              # Voc, VocFilter, VocCreate, VocUpdate, VocDrawerState
    dashboard.ts        # WidgetId, WidgetData, DashboardConfig
    notice.ts           # Notice, FAQ, NoticePopupState
    tag.ts              # TagMaster, TagRule
    external-master.ts  # External*, MasterSnapshot
    user.ts             # User, RoleAssignment
    notification.ts     # Notification, NotificationKind, UrgentBadge
  fixtures/             # MSW + supertest 공유 더미 데이터
    voc.fixtures.ts
    dashboard.fixtures.ts
    ...

frontend/src/
  api/                  # 도메인별 fetcher (real or msw)
    client.ts           # fetch wrapper (credentials, error envelope, zod parse)
    voc.ts
    dashboard.ts
    ...
  mocks/                # MSW handlers (개발/테스트 전용, prod 빌드에서 제외)
    browser.ts
    server.ts
    handlers/
      voc.ts
      dashboard.ts
      ...
  components/
    ui/                 # shadcn copy-paste (button, dialog, dropdown, ...)
    layout/             # AppShell, Sidebar, TopBar, PageTitle
    common/             # 우리 도메인 공통 — DataTable, FilterBar, EmptyState, Toast wrapper
    voc/                # VocList, VocFilters, VocDrawer, VocDrawerForm, ...
    dashboard/          # WidgetGrid, Widget카드들
    notice/             # NoticeAdmin, FAQAdmin, NoticePopup
    admin/              # TagMasterPage, TrashPage, ExternalMastersPage, UsersPage
  hooks/                # useRole, useToast, useFilters, ...
  features/             # 도메인별 비즈니스 hook (useVocList, useVocMutation, ...)
  pages/                # 라우트 진입점 (얇은 컨테이너만)
  contexts/             # 클라이언트 전용 상태 (RoleContext)
  styles/index.css      # @theme + tokens
  tokens.ts             # 단일 출처

backend/src/
  routes/
    voc.ts              # 라우터 (얇음, 검증 + 컨트롤러 호출)
    dashboard.ts
    ...
  controllers/          # request → service 변환, response shape
  services/             # DB·비즈니스 로직
  validators/           # shared/contracts/*의 Zod 재사용
```

`shared/`는 신규 디렉토리. **빌드 타겟 누수 방지가 핵심**:

- `shared/tsconfig.json`: `lib: ["ES2022"]` only — DOM·Node 타입 금지
- `shared/.eslintrc.json`: `no-restricted-imports`로 `node:*`·browser-only API 차단, 허용 import는 `zod` + 순수 TS만
- `tsconfig.paths`로 FE/BE 양쪽에서 `@shared/*` import
- **CI 매트릭스**: GitHub Actions에서 `frontend` 빌드(Vite, browser target) + `backend` 빌드(tsc, node target) 양쪽이 동시에 통과해야 PR merge 가능 (조건 #A1)

---

## 2. Wave 분해 (총 5 Wave + 0번 Foundation)

> 각 Wave는 (a) 계약 PR → (b) FE PR → (c) BE PR 순서. (b)/(c)는 병렬 가능.
> 화면 수가 작은 Wave는 (b)+(c)를 1 PR로 묶을 수 있음.

### Wave 0 — Foundation (계약·인프라·기준 화면 직전 준비)

| ID   | 항목                                                                        | 산출 파일                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-0  | **사내 npm 미러 사전 점검** (Wave 0 첫 commit)                              | `npm config get registry` 결과 기록, `npm install zod --dry-run` 성공/실패 캡처 → `docs/specs/plans/phase-8-mirror-check.md`                                                                                                                         |
| 0-1  | `shared/` 디렉토리 + 독립 tsconfig + ESLint import 제약                     | `shared/contracts/common.ts`, `shared/tsconfig.json` (lib ES2022 only), `shared/.eslintrc.json` (no-restricted-imports), `tsconfig.base.json`, `frontend/tsconfig.json`, `backend/tsconfig.json`                                                     |
| 0-2  | shadcn 초기화 + 기본 프리미티브 8종 카피 + **토큰 매핑 codemod**            | `frontend/components.json`, `frontend/src/components/ui/{button,dialog,dropdown-menu,select,tabs,toast,input,label}.tsx`, `frontend/src/lib/utils.ts`, `scripts/shadcn-token-rewrite.ts`                                                             |
| 0-3  | TanStack Query Provider + devtools (dev-only) + **queryKey 컨벤션 문서**    | `frontend/src/main.tsx` 수정, `frontend/src/api/client.ts`, `frontend/src/api/queryKeys.ts` (`['<domain>', role, ...filters]` 패턴 명시)                                                                                                             |
| 0-4  | MSW 부트스트랩 + 첫 핸들러 (`/health`)                                      | `frontend/src/mocks/{browser,server,handlers/health}.ts`, `frontend/public/mockServiceWorker.js`, `frontend/src/main.tsx` 분기                                                                                                                       |
| 0-5  | API client (zod parse, error envelope, credentials) + ErrorBoundary         | `frontend/src/api/client.ts`, `frontend/src/components/common/ErrorBoundary.tsx`                                                                                                                                                                     |
| 0-6  | AppShell + Sidebar + TopBar + 라우트 골격                                   | `frontend/src/components/layout/{AppShell,Sidebar,TopBar,PageTitle}.tsx`, `frontend/src/router.tsx` 확장                                                                                                                                             |
| 0-7  | RoleContext + `?mode=admin` 토글 + **role 변경 시 query invalidation 정책** | `frontend/src/contexts/RoleContext.tsx`, `frontend/src/hooks/useRole.ts` (role 변경 시 `queryClient.invalidateQueries()` 또는 queryKey에 role 포함 — 후자 채택)                                                                                      |
| 0-8  | Toast (Sonner) + 공통 EmptyState/ErrorState/LoadingState                    | `frontend/src/components/common/{Toast,EmptyState,ErrorState,LoadingState}.tsx`                                                                                                                                                                      |
| 0-9  | BE: Zod 의존성 추가 + validator 헬퍼 + ErrorEnvelope 응답 표준화            | `backend/package.json`, `backend/src/middleware/validate.ts`, `backend/src/middleware/errorEnvelope.ts`                                                                                                                                              |
| 0-10 | **폐쇄망 OSS 도입 가이드 + PR template + CI 워크플로**                      | `docs/specs/plans/phase-8-oss-vendoring.md`, `.github/pull_request_template.md` (§7 4 체크박스 강제), `.github/workflows/ci.yml` (FE/BE 빌드 매트릭스 + ESLint + max-lines + 토큰 lint)                                                              |
| 0-11 | **ESLint 강제 룰 추가**                                                     | `frontend/.eslintrc.cjs` — `max-lines: [error, {max: 200, skipBlankLines: true, skipComments: true}]` (`pages/**`, `features/**`), `max-lines: [error, {max: 80}]` (`components/**/widgets/**`), `eslint-plugin-tailwindcss` no-arbitrary-color rule |
| 0-12 | **shadcn 토큰 lint 룰**                                                     | `frontend/eslint-rules/no-raw-color.js` (자체 룰: hex/rgb/oklch literal in className 차단), `frontend/.eslintrc.cjs` 등록                                                                                                                            |
| 0-13 | **Pretendard / D2Coding self-host 점검**                                    | `frontend/public/fonts/` 존재 확인, `index.css` `@font-face` self-host 경로 확정. Google Fonts CDN 발견 시 즉시 교체                                                                                                                                 |
| 0-14 | **Fixture vs DB seed 정합성 자동 검증**                                     | `scripts/check-fixture-seed-parity.ts` — `shared/fixtures/voc.fixtures.ts` 와 `backend/seeds/dev_seed.sql` 의 컬럼/제약 일치 검증, CI에서 실행                                                                                                       |

**PR**: Wave 0은 1개 PR (모두 인프라, 화면 변경 없음). LOC 목표 ≤1100 (확장된 산출물 반영).
**검증**:

- `pnpm -w typecheck` clean
- `pnpm -w lint` clean (max-lines + 토큰 lint 룰 활성화 확인)
- `/health` 화면이 MSW를 통해 200 응답
- AppShell이 빈 본문으로 렌더, RoleContext 토글로 사이드바 메뉴 항목 변화
- CI에서 FE 빌드 + BE 빌드 + fixture-seed parity check 모두 PASS
- `.github/pull_request_template.md` 가 PR 작성 시 자동 적용됨

---

### Wave 1 — 기준 화면: VOC 리스트 + 검토 드로어 (vertical slice 1 PR)

> 가이드 6단계 "기준 화면 완성". 이 Wave에서 폴더 구조·스타일 패턴·상태/에러/빈/권한 표현·테스트 깊이를 모두 확정.
>
> **Architect 조건 #A2 반영**: Wave 1은 contract+FE+BE를 **단일 PR (vertical slice)** 로 머지. 패턴이 잡히지 않은 상태에서 contract PR을 먼저 머지하면 1-B/1-C 단계에서 contract 재타협 비용이 발생. Wave 2 부터는 학습된 패턴으로 contract-first 분리 PR로 진행.
> **PR LOC 목표**: ≤1500 (예외 — vertical slice 특성상 일반 ≤800 룰 초과 허용. PR description에 명시).
> **머지 후 산출**: `docs/specs/plans/phase-8-pattern.md` 동시 머지 — 폴더·네이밍·테스트 깊이·에러 처리·queryKey·shadcn 매핑 결정 기록. **이 문서 머지가 Wave 2 진입 게이트** (회고만으로는 통과 불가).

#### 1-A 계약 영역 (vertical slice 내)

| 파일                                       | 내용                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/contracts/voc.ts`                  | `Voc`, `VocStatus`, `VocSource`, `VocFilter`, `VocListQuery`, `VocListResponse`, `VocCreate`, `VocUpdate`, `InternalNote`, `VocHistory` (Zod schema + inferred TS) |
| `shared/contracts/common.ts` 보강          | `Pagination`, `SortDir`, `RoleScopedColumns`                                                                                                                       |
| `shared/fixtures/voc.fixtures.ts`          | 50건 더미 (역할별 케이스 다 포함: 빈, 1건, 100건, 권한 차단, 길이 초과)                                                                                            |
| `docs/specs/plans/phase-8-contract-voc.md` | 본 계약 PR 메모 (의도·스펙 매핑·후속 영향)                                                                                                                         |

**검증**: `pnpm -w typecheck` 통과 + Zod schema로 fixture 파싱 100% 통과. FE/BE 코드 변경 없음.

#### 1-B FE 영역 (vertical slice 내) — VOC 리스트 + 드로어

| 파일                                                | 역할                                                                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/api/voc.ts`                           | `vocApi.list / get / create / update / addNote` (TanStack Query 함수)                                                                          |
| `frontend/src/mocks/handlers/voc.ts`                | MSW: 위 5개 endpoint 핸들러, fixture 사용                                                                                                      |
| `frontend/src/features/voc/useVocList.ts`           | useInfiniteQuery 또는 useQuery + 필터/정렬/페이지 상태 hook                                                                                    |
| `frontend/src/features/voc/useVocMutation.ts`       | create/update/addNote mutations + 낙관적 업데이트                                                                                              |
| `frontend/src/features/voc/useVocFilters.ts`        | URL 쿼리스트링 ↔ 필터 상태 동기화                                                                                                              |
| `frontend/src/components/voc/VocListPage.tsx`       | 페이지 컨테이너 (얇음, ≤120 LOC)                                                                                                               |
| `frontend/src/features/voc/useVocPageController.ts` | 위 3 hook(`useVocList`, `useVocMutation`, `useVocFilters`) 조합 + role 권한 체크 — `VocListPage`가 이 controller만 호출 (Principle 4 LOC 분산) |
| `frontend/src/components/voc/VocTable.tsx`          | TanStack Table 인스턴스 + 역할별 컬럼                                                                                                          |
| `frontend/src/components/voc/VocFilterBar.tsx`      | 필터 칩/멀티셀렉트/검색 (shadcn Select·Input·Popover)                                                                                          |
| `frontend/src/components/voc/VocSortMenu.tsx`       | 정렬 드롭다운                                                                                                                                  |
| `frontend/src/components/voc/VocStatusBadge.tsx`    | 상태 뱃지 (토큰 var)                                                                                                                           |
| `frontend/src/components/voc/VocRowActions.tsx`     | 행 액션 메뉴 (역할 가드)                                                                                                                       |
| `frontend/src/components/voc/VocDrawer.tsx`         | 드로어 컨테이너 (Radix Dialog `side=right`)                                                                                                    |
| `frontend/src/components/voc/VocDrawerHeader.tsx`   | 헤더 + 닫기 + 메타                                                                                                                             |
| `frontend/src/components/voc/VocDrawerForm.tsx`     | RHF + Zod, 검토 결과·태그·담당자                                                                                                               |
| `frontend/src/components/voc/VocDrawerNotes.tsx`    | 내부 노트 리스트 + 작성 (권한별)                                                                                                               |
| `frontend/src/components/voc/VocDrawerHistory.tsx`  | 변경 이력                                                                                                                                      |
| `frontend/src/components/voc/VocPermissionGate.tsx` | 권한 차단 안내 패널                                                                                                                            |
| `frontend/src/pages/VocPage.tsx`                    | 라우트 진입점 (`<VocListPage />` 호출만)                                                                                                       |
| `frontend/src/components/voc/__tests__/*.test.tsx`  | RTL: 빈/오류/로딩/권한 차단/필터 동작/드로어 열림                                                                                              |
| `frontend/src/router.tsx` 갱신                      | `/voc`, `/voc/:id` (드로어 deeplink) 추가                                                                                                      |

**검증**:

- Vitest + RTL: 위 5개 상태 시나리오 통과
- Playwright: VOC 리스트 진입 → 필터 적용 → 행 클릭 → 드로어 열림 → 노트 작성 → 닫힘 (1 happy path)
- Lighthouse a11y ≥ 95
- 프로토타입 `prototype.html#voc` 와 시각 비교 (오프닝 화면 + 드로어 열린 상태 2장)

#### 1-C BE 영역 (vertical slice 내) — VOC API

| 파일                                     | 역할                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `backend/src/routes/voc.ts`              | 라우트 정의 (`GET /api/voc`, `GET /api/voc/:id`, `POST /api/voc`, `PATCH /api/voc/:id`, `POST /api/voc/:id/notes`) |
| `backend/src/controllers/voc.ts`         | req→service 변환, response shape (계약 일치)                                                                       |
| `backend/src/services/voc.ts`            | DB 쿼리 (목록/상세/생성/수정/노트)                                                                                 |
| `backend/src/validators/voc.ts`          | `shared/contracts/voc.ts`의 Zod 재export + `validate(schema)` 미들웨어 적용                                        |
| `backend/src/__tests__/voc.test.ts`      | supertest: 200/400/403/404 케이스 + fixture 파싱                                                                   |
| (필요 시) `backend/migrations/0XX_*.sql` | 신규 컬럼 (예: 길이 제한) — 없을 가능성                                                                            |

**검증**: Jest pass + `curl`로 5개 엔드포인트 응답 shape이 Zod schema와 일치 + FE PR의 mock을 끄고(`VITE_USE_MSW=false`) 실제 BE에 연결해도 화면이 동작함.

---

### Wave 2 — Dashboard

#### 2-A 계약 PR

| 파일                                    | 내용                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `shared/contracts/dashboard.ts`         | `WidgetId`, `WidgetSpec`, `WidgetData<T>`, `DashboardConfig` (위젯 ON/OFF, 순서) |
| `shared/fixtures/dashboard.fixtures.ts` | 위젯 8종 더미                                                                    |

#### 2-B FE PR

| 파일                                                                                                                                                  | 역할                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `frontend/src/api/dashboard.ts`                                                                                                                       | `dashboardApi.getConfig / saveConfig / getWidget(id)` |
| `frontend/src/mocks/handlers/dashboard.ts`                                                                                                            | MSW                                                   |
| `frontend/src/features/dashboard/useDashboardConfig.ts`                                                                                               | config query + mutation                               |
| `frontend/src/components/dashboard/DashboardPage.tsx`                                                                                                 | 컨테이너                                              |
| `frontend/src/components/dashboard/WidgetGrid.tsx`                                                                                                    | 그리드 + 순서                                         |
| `frontend/src/components/dashboard/WidgetSettingsPanel.tsx`                                                                                           | Wave 2 W-15 패널                                      |
| `frontend/src/components/dashboard/widgets/{StatusBreakdown,TagDistribution,UrgentList,RecentActivity,SlaWatch,SourceMix,AssigneeWorkload,Trend}.tsx` | 위젯 8종 (각 ≤80 LOC)                                 |
| `frontend/src/components/dashboard/widgets/WidgetCard.tsx`                                                                                            | 공통 래퍼 (제목·로딩·빈·에러)                         |
| `frontend/src/components/dashboard/__tests__/*.test.tsx`                                                                                              | RTL                                                   |
| `frontend/src/pages/DashboardPage.tsx`                                                                                                                | 라우트 진입                                           |

#### 2-C BE PR

| 파일                                      | 역할                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `backend/src/routes/dashboard.ts`         | `GET /api/dashboard/config`, `PUT /api/dashboard/config`, `GET /api/dashboard/widgets/:id` |
| `backend/src/controllers/dashboard.ts`    |                                                                                            |
| `backend/src/services/dashboard.ts`       | 위젯별 집계 쿼리 (8종)                                                                     |
| `backend/src/__tests__/dashboard.test.ts` |                                                                                            |

**검증**: 위젯 8종 모두 빈/로딩/에러 상태 표시 + `?mode=admin` 토글 시 설정 패널 노출. Playwright 1 시나리오 (config 변경 → 위젯 재배치 반영).

---

### Wave 3 — 관리자 페이지군 (4 화면)

> 4 화면이 도메인은 다르나 폴더 구조·CRUD 패턴이 유사 → contract만 분리, FE/BE는 화면별 PR.

#### 3-A 계약 PR

| 파일                                  | 내용                                                 |
| ------------------------------------- | ---------------------------------------------------- |
| `shared/contracts/tag.ts`             | `TagMaster`, `TagRule` (CRUD shape)                  |
| `shared/contracts/external-master.ts` | `ExternalMaster*`, `MasterSnapshot`, `RefreshResult` |
| `shared/contracts/user.ts`            | `User`, `RoleAssignment`, `UserCreateGuardError`     |
| `shared/fixtures/admin.fixtures.ts`   | 4 도메인 더미                                        |

#### 3-B FE/BE PRs (병렬 4개)

각 화면은 **FE+BE를 1 PR로 묶음** (도메인이 작아 분리 효율 < 통합 효율).

1. **Tag Master** — `frontend/src/components/admin/tag/{TagMasterPage,TagTable,TagFormDialog,TagRuleEditor}.tsx` + `pages/TagMasterPage.tsx` + `api/tag.ts` + `mocks/handlers/tag.ts` + `backend/src/{routes,controllers,services}/tag.ts` + tests
2. **Trash (휴지통)** — `frontend/src/components/admin/trash/{TrashPage,TrashTable,RestoreDialog}.tsx` + 대응 BE
3. **External Masters** — `frontend/src/components/admin/external/{ExternalMastersPage,SourceCard,RefreshButton,SnapshotInspector}.tsx` + 대응 BE (source별 독립 atomic swap — Q5 결정)
4. **Users** — `frontend/src/components/admin/users/{UsersPage,UserTable,UserGuardToast,RoleAssignDialog}.tsx` + 대응 BE

각 PR ≤500 LOC 목표.

**검증**: 각 화면별 RTL + supertest. 권한 차단 시 페이지 자체 접근 불가(라우트 가드 redirect).

---

### Wave 4 — 공지/FAQ + Notice Popup

#### 4-A 계약 PR

| 파일                                 | 내용                                               |
| ------------------------------------ | -------------------------------------------------- |
| `shared/contracts/notice.ts`         | `Notice`, `FAQ`, `NoticePopupState`, `FAQCategory` |
| `shared/fixtures/notice.fixtures.ts` |                                                    |

#### 4-B FE PR

| 파일                                                          | 역할                                       |
| ------------------------------------------------------------- | ------------------------------------------ |
| `frontend/src/api/notice.ts` + `mocks/handlers/notice.ts`     |                                            |
| `frontend/src/components/notice/NoticeAdminPage.tsx`          | 인라인 관리 (req §15 결정대로 같은 라우트) |
| `frontend/src/components/notice/FAQAdminPage.tsx`             | 카테고리 정렬 ↑↓ (드래그는 NextGen)        |
| `frontend/src/components/notice/NoticePopup.tsx`              | 2-panel 공지 팝업 (Wave 1 B-3)             |
| `frontend/src/components/notice/__tests__/*.test.tsx`         |                                            |
| `frontend/src/pages/NoticeAdminPage.tsx` / `FAQAdminPage.tsx` |                                            |

#### 4-C BE PR

- `backend/src/{routes,controllers,services}/notice.ts` + tests

---

### Wave 5 — 알림 + 셸 통합 마감 (N-03 BE polling 필수 격상)

> **Architect 조건 #A3 반영**: N-03 알림 폴링 BE는 Wave 5 close 필수. ETag 304 최적화만 NextGen으로 분리 (단순 GET polling은 MVP 필수, requirements §13 N-03).

#### 5-A 계약 PR

- `shared/contracts/notification.ts` — `Notification`, `NotificationKind`, `UrgentBadge`

#### 5-B FE PR

| 파일                                                                              | 역할                                                                          |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `frontend/src/api/notification.ts` + `mocks/handlers/notification.ts`             |                                                                               |
| `frontend/src/features/notification/useNotifications.ts`                          | TanStack Query (refetchInterval — N-03 BE 미준비라 polling은 mock에서만 동작) |
| `frontend/src/components/notification/NotificationBell.tsx`                       | TopBar 통합                                                                   |
| `frontend/src/components/notification/NotificationDropdown.tsx`                   | 유형별 + Urgent 뱃지                                                          |
| `frontend/src/components/notification/NotificationItem.tsx`                       |                                                                               |
| RouteGuard 마감 + 진입 점검 + 전체 시각 회귀 (프로토타입 vs 실구현 스크린샷 비교) | `frontend/src/components/layout/RouteGuard.tsx`, Playwright 회귀 스위트       |

#### 5-C BE PR (필수)

- `GET /api/notifications` — 단순 GET, 사용자별 미확인 + Urgent 알림 반환 (페이지네이션 100건 cap)
- `POST /api/notifications/:id/read` — 읽음 표시
- `backend/src/{routes,controllers,services}/notification.ts` + supertest 200/403/404
- ETag 304 최적화는 **명시적 NextGen 분리** (`nextgen-backlog.md`에 N-03-ETag로 분리 항목 추가)
- **Wave 5 close 시 BE polling 동작 필수** — 빈 배열 반환만으로는 close 미충족

**Phase 8 close 조건** (Wave 5 PR 머지 직후):

1. **빌드/테스트 게이트**
   - `pnpm -w typecheck` clean (FE/BE 양쪽)
   - `pnpm -w test` clean (Vitest + Jest)
   - `pnpm -w lint` clean (max-lines + 토큰 lint 룰 위반 0)
   - CI fixture-seed parity check PASS

2. **Playwright 회귀 — 정확히 9 시나리오**
   1. `/voc` 진입 → 필터 적용 → 행 클릭 → 드로어 열림 → 노트 작성 → 닫힘
   2. `/voc` admin 권한 토글 → 행 액션 메뉴 변화 확인 (권한 가드)
   3. `/dashboard` 진입 → 위젯 8종 렌더 → 설정 패널 토글 → 위젯 ON/OFF 반영
   4. `/admin/tags` CRUD 1회전
   5. `/admin/trash` 복원 1회전
   6. `/admin/external-masters` source별 refresh 버튼 → snapshot 갱신
   7. `/admin/users` 사용자 가드 토스트
   8. `/notice` 공지/FAQ 인라인 관리 + 공지 팝업 노출
   9. 알림 벨 → 드롭다운 → 항목 클릭 → 읽음 표시 + 카운트 감소

3. **시각 회귀 — 핵심 12 화면 명시 리스트, yes/no 체크**
   | # | 라우트 | 상태 | 통과 기준 |
   |---|---|---|---|
   | 1 | `/voc` (user role, 데이터 있음) | default | 레이아웃·컬럼 셋·토큰 컬러 일치 |
   | 2 | `/voc` (admin role, 빈 상태) | empty | EmptyState 노출 + 사이드바 admin 메뉴 |
   | 3 | `/voc/:id` 드로어 열림 (manager role) | drawer-open | 드로어 폼·노트 패널·권한 표시 |
   | 4 | `/voc` 권한 차단 화면 (dev role) | permission-blocked | VocPermissionGate 표시 |
   | 5 | `/dashboard` 위젯 8종 모두 ON | default | 그리드 정렬 + 차트 컬러 토큰 일치 |
   | 6 | `/dashboard` 설정 패널 열림 | settings-open | 위젯 토글 UI |
   | 7 | `/admin/tags` 리스트 + 폼 다이얼로그 | dialog-open | 폼 레이아웃 |
   | 8 | `/admin/trash` 리스트 | default | 휴지통 표시 |
   | 9 | `/admin/external-masters` 카드 + 스냅샷 | default | source별 카드 |
   | 10 | `/admin/users` + 가드 토스트 | toast-shown | 토스트 위치·컬러 |
   | 11 | `/notice` 인라인 관리 + 공지 팝업 | popup-shown | 2-panel 팝업 |
   | 12 | TopBar 알림 드롭다운 열림 (Urgent 1건) | dropdown-open | Urgent 뱃지 컬러 |

   **결정자**: 사용자 (close gate). **통과 기준**: "주요 레이아웃 일치 + 토큰 컬러 일치 + 누락 컴포넌트 0" 3 항목 yes/no, 모두 yes여야 화면 통과. **실패 시**: 해당 화면 hotfix PR 머지 후 재검증, 다른 화면 통과 여부와 독립.

4. **NextGen 분리 leger** — Phase 8 close 시 다음 항목 `nextgen-backlog.md`에 명시 추가:
   - N-03-ETag (304 폴링 최적화)
   - 시각 회귀 자동화 (pixel-diff)
   - shadcn 카피본 라이선스 inventory 자동화
   - contract semver/breaking-change 정책

---

## 3. PR 단위 / 충돌 방지 규칙

| 규칙                                                           | 근거                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **계약 PR 머지 전엔 그 도메인의 FE/BE PR 시작 금지**           | 계약이 흔들리면 양쪽 다 흔들림                                                    |
| **shared/contracts/** 파일은 한 PR에서 한 도메인만 수정        | 머지 충돌 최소화                                                                  |
| **shadcn UI 프리미티브 추가는 별도 commit** (페이지 PR 안에서) | review 시 분리해서 보기 위함                                                      |
| **`tokens.ts` / `index.css` 수정은 별도 PR**                   | 시각 회귀 영향이 크므로 격리                                                      |
| **FE PR에 BE 코드 변경 금지, BE PR에 FE 코드 변경 금지**       | 단, 같은 도메인의 FE/BE를 1 PR로 묶기로 한 경우는 예외 (Wave 3) — 명시적으로 표기 |

---

## 4. 의존성 추가 매트릭스 (Wave별)

| Wave | FE 추가 (메이저 lock)                                                                                                                                                                                                                                                                                                                | BE 추가                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 0    | `@tanstack/react-query@^5`, `@tanstack/react-query-devtools@^5`, `zod@^3`, `msw@^2`, `lucide-react@^0.4xx` (현재 안정), `sonner@^1`, `class-variance-authority@^0.7`, `clsx@^2`, `tailwind-merge@^2`, `@radix-ui/react-{dialog,dropdown-menu,select,tabs,popover,toast,label,slot}@^1` (shadcn peer), `eslint-plugin-tailwindcss@^3` | `zod@^3`                                    |
| 1    | `@tanstack/react-table@^8`, `react-hook-form@^7`, `@hookform/resolvers@^3`, `date-fns@^3` (드로어 날짜 표기)                                                                                                                                                                                                                         | (없음)                                      |
| 2    | `recharts@^2`, `react-day-picker@^9` (Dashboard 기간 필터)                                                                                                                                                                                                                                                                           | (없음)                                      |
| 3    | (없음)                                                                                                                                                                                                                                                                                                                               | (없음)                                      |
| 4    | `react-markdown@^9`, `remark-gfm@^4` (FAQ 렌더 — 본 단계 합의 시)                                                                                                                                                                                                                                                                    | (없음)                                      |
| 5    | (없음)                                                                                                                                                                                                                                                                                                                               | (필요 시 `pg-boss@^9` — NextGen SLA 준비차) |

> **lockfile 정책**: 각 Wave PR에 `package-lock.json` diff 포함. 메이저 변경(`^X` → `^Y`)은 별도 PR로 분리 (라이선스·바이너리 영향 격리).
> **shadcn 컴포넌트는 npm 의존성 아님** — `npx shadcn add` 또는 raw 카피 (§7).

shadcn 컴포넌트는 npm 의존성 아님 — `npx shadcn add` 또는 raw 카피 (§7).

---

## 5. 테스트 깊이 합의

| 종류      | 도구                   | 적용 범위                                                        |
| --------- | ---------------------- | ---------------------------------------------------------------- |
| Unit      | Vitest                 | 순수 함수, Zod schema 검증                                       |
| Component | RTL + MSW              | 모든 페이지 컴포넌트의 빈/로딩/에러/권한 4 상태 + happy path 1개 |
| API       | supertest + pg-mem     | BE 라우트 200/400/403/404                                        |
| E2E       | Playwright (이미 도입) | Wave 종료 시 1 시나리오                                          |
| Visual    | 스크린샷 수동 비교     | Wave 종료 시 프로토타입 vs 실구현 (자동화는 NextGen)             |

테스트는 각 도메인 폴더 안 `__tests__/`에 둠. 한 파일 ≤200 LOC.

---

## 6. 위험과 완화

| 위험                                                                 | 완화                                                                                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn 카피본이 우리 토큰 시스템과 충돌 (Tailwind 클래스 vs CSS var) | 카피 직후 색상·radius·shadow 클래스를 우리 토큰 매핑으로 일괄 치환. Wave 0에서 base 8개로 패턴 확정 후 이후 자동 적용                  |
| BE 응답 shape 드리프트 → FE 깨짐                                     | API client에서 Zod parse 강제. parse 실패 시 ErrorBoundary로 흡수 + 콘솔 경고                                                          |
| MSW가 prod 빌드에 섞임                                               | `import.meta.env.DEV && import.meta.env.VITE_USE_MSW`로 게이트. Vite의 dead-code-elimination으로 prod 번들에서 제거 검증               |
| 화면 LOC 폭증 → 200 LOC 룰 위반                                      | Wave 1 직후 회고 — 패턴이 안 잡히면 컴포넌트 분리 기준 재정의 후 진행                                                                  |
| 기준 화면(Wave 1)에서 결정 누락 → 후속 Wave에서 패턴 흔들림          | Wave 1 머지 직후 `docs/specs/plans/phase-8-pattern.md` 작성 (폴더·네이밍·테스트 깊이·에러 처리 결정 기록) — 이후 Wave는 이 문서를 참조 |
| 폐쇄망 미러 부재                                                     | §7 — 사전 점검 + raw 벤더링 절차 명시                                                                                                  |

---

## 7. 폐쇄망 OSS 도입 가이드 (별도 README급으로 항상 참조)

> 본 문서를 `docs/specs/plans/phase-8-oss-vendoring.md`로도 분리 산출 (Wave 0-10 산출물).

### 7.1 npm 미러 우선 시도

```
npm config get registry          # 사내 미러 URL이어야 함
npm install <pkg>                # 평소처럼
```

### 7.2 미러 부재 시 — 라이브러리별 raw 도입 절차

| 항목                                                          | 미러 없을 때                                                                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **shadcn/ui 컴포넌트**                                        | npx 미사용. https://github.com/shadcn-ui/ui 의 `apps/www/registry/default/ui/<name>.tsx` 를 raw로 받아 `frontend/src/components/ui/`에 직접 커밋. 라이선스(MIT) LICENSE 파일도 같은 폴더에 보관        |
| **Lucide 아이콘**                                             | 미러가 있어야 정상. 부재 시 `lucide-react` 대신 사용하는 아이콘만 SVG로 직접 추출 → `frontend/src/components/ui/icons/`에 개별 컴포넌트                                                                |
| **Pretendard / D2Coding 폰트**                                | Google Fonts CDN 절대 금지. `pretendard` npm 패키지 또는 GitHub release `.woff2`를 받아 `frontend/public/fonts/`에 두고 `@font-face`로 self-host. 현재 로딩 경로가 CDN이면 즉시 교체 (Wave 0에서 점검) |
| **TanStack 라이브러리류, Zod, RHF, Recharts, Sonner, MSW 등** | 모두 표준 npm — 미러 없으면 사실상 작업 불가. 사내 미러 확보가 선결 조건. 임시로는 회사 정책 허용 시 외부 PC에서 `npm pack` 으로 tarball 추출 → 사내 반입 → `npm install ./<pkg>.tgz`                  |
| **MSW Service Worker 파일**                                   | `mockServiceWorker.js`는 npm 패키지 안에 동봉 — `npx msw init public/` 후 그대로 커밋. 외부 fetch 없음                                                                                                 |
| **shadcn CLI 스타일 빌더**                                    | CLI가 GitHub raw에서 코드를 fetch함. 사내에서 막히면 7.2 1행대로 직접 커밋                                                                                                                             |
| **Recharts**                                                  | npm 표준. CDN 폴백 코드 없음 (확인됨)                                                                                                                                                                  |
| **Vite/Tailwind/Vitest**                                      | 이미 설치됨 — 추가 작업 없음                                                                                                                                                                           |

### 7.3 추가 OSS 도입 시 사전 체크리스트

1. `package.json`의 `scripts.postinstall`이 외부로 ping 보내는지
2. 라이브러리가 런타임에 telemetry/analytics 엔드포인트를 호출하는지 (`grep -r "fetch\|XMLHttpRequest" node_modules/<pkg>/dist`)
3. 빌드 산출물에 외부 CDN URL이 포함되는지 (`grep -r "cdn\|googleapis\|jsdelivr\|unpkg" frontend/dist`)
4. 라이선스가 사내 OSS 정책과 호환되는지 (MIT/Apache/BSD 우선)

본 4 항목은 **새 라이브러리 추가 PR마다 description에 체크박스로 포함**.

---

## 8. Spec 정합성 (수정 영향 없음)

본 Phase 8 계획은 spec 본문(`requirements.md`, `feature-*.md`, `dashboard.md`, `uidesign.md`, `external-masters.md`)을 변경하지 않음. 모두 spec을 **소비**하는 구현 단계.

단, Wave별 PR 머지 시 `next-session-tasks.md` Phase 8 표를 업데이트.

---

## 9. 다음 단계

1. 본 계획서 사용자 승인
2. `docs/specs/plans/next-session-tasks.md`에 Phase 8 섹션 추가 + Wave 0~5 표 삽입
3. `claude-progress.txt` 다음 세션 시작점을 "Phase 8 Wave 0 시작"으로 갱신
4. Wave 0 PR 시작 (`feat/phase-8-foundation`)

---

## 10. ADR — Phase 8 채택안 확정 (consensus 통과 후)

### Decision

Phase 8 = **A′ Contract-first per-screen, 6 Wave** (단, **Wave 1만 vertical slice** 1 PR로 패턴 확정 후 Wave 2~5 분리 PR).
스택: shadcn/ui (Radix) + TanStack Query/Table + RHF/Zod + MSW + Recharts + Sonner + Lucide + react-day-picker, 모두 폐쇄망 self-host 가능.

### Drivers (가중치)

1. **다음 Phase 충돌 무방지** (가중치 0.45) — 사용자 1순위 요구
2. **적정 PR 단위·병렬화 throughput** (가중치 0.35) — Phase 7 Wave 3 경험
3. **폐쇄망 안전성** (가중치 0.20) — runtime fetch/telemetry zero

### Alternatives considered (정량 비교)

| 옵션                            | PR 수 (추산)                    | 화면당 리드타임             | 충돌 리스크                    | 폐쇄망 적합 |
| ------------------------------- | ------------------------------- | --------------------------- | ------------------------------ | ----------- |
| **A′ (채택)**                   | 18 (Wave 1 vertical 통합 후 16) | 계약 0.5d + FE/BE 병렬 3~5d | 낮음 (계약 게이트 + Zod parse) | 동등        |
| B (전 Wave vertical)            | 14                              | 1~2주 (직렬)                | 매우 낮음                      | 동등        |
| C (FE-only Phase 8, BE Phase 9) | 12                              | FE 빠름, BE 합류 시 재작업  | 높음 (mock 의존 검증)          | 동등        |

### Why chosen

- A′가 충돌 방지 효과는 B와 사실상 동등 (Zod 단일 출처가 기술적으로 보장)
- 병렬화로 throughput ~2x (FE/BE 동시 진행)
- Wave 1만 vertical로 시작해 패턴 확정 후 분리 — Architect 지적한 "어려운 Wave를 가장 엄격한 분리로 시작하는 역설" 회피
- B 대비 리뷰 부하는 PR 수 +2~4개 trade-off로 수용 가능

### Positive consequences

- shared/contracts 단일 출처 → FE/BE 타입 드리프트 컴파일 단계에서 차단
- Wave별 화면 단위 demoable → 사용자 피드백 루프 짧음
- mock→real 1줄 스왑 → 인프라 BE 미준비 영역(O-01 파일 저장소 등)도 FE 진행 가능

### Negative consequences (별도)

- `shared/` 신규 디렉토리 + tsconfig 복잡도 ↑ — 빌드 타겟 누수 위험 (조건 #A1으로 차단)
- 계약 PR 16~18개 추가 — 리뷰 라운드 부담 (Wave 2~5에서 평균 0.5d/PR 가정 시 +8d 누적)
- shadcn 카피본 리포 보유 — 라이선스 inventory 자동화 부재 (NextGen 분리)

### Follow-ups

- NextGen에서 contract semver/breaking-change 정책 수립
- 시각 회귀 자동화 (현재는 수동 12 화면 체크)
- shadcn 라이선스 inventory 자동화
- N-03-ETag 304 폴링 최적화 (NextGen 분리 명시)

### Pre-mortem 적용 결과 reference

- §0′ Pre-mortem 3 시나리오 + detection signal + rollback 본 ADR 결정의 risk acceptance 기반

---

## 11. Changelog (consensus revision 적용 이력)

| 일자                    | 변경                                                                                                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-01 (초안)       | Wave 0~5 + §0~§9 작성, A′ 채택 결정                                                                                                                                                                                                                                                                            |
| 2026-05-01 (revision 1) | Architect 4 조건 + Critic 1 Critical + 5 Major 반영 — shared/ 독립 tsconfig·ESLint·CI 매트릭스 / Wave 1 vertical slice / N-03 BE 필수 격상 / queryKey·shadcn lint Wave 0 / Wave 5 close 12 화면 명시 / max-lines ESLint / 의존성 메이저 lock / PR template / §10 ADR 신설 / pre-mortem detection·rollback 보강 |
