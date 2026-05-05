# Naming Conventions

**When to read:** 파일명·폴더명·컴포넌트명·Hook명·이벤트 핸들러 규칙이 필요할 때

> Frontend (React + TypeScript) 네이밍 정본 문서.  
> LLM 코드 생성 · 리뷰 · 리팩토링 시 이 문서를 기준으로 판단한다.  
> 이전 컴포넌트 suffix 규칙: `component-naming.md` → 본 문서 §5.3으로 통합.

---

## §5.1 폴더명

| 대상                  | 규칙            | 예시                                           |
| --------------------- | --------------- | ---------------------------------------------- |
| 레이어 / feature 폴더 | kebab-case 단수 | `voc-list-filter`, `voc-status-change`         |
| entity 폴더           | 단수 영어 명사  | `voc`, `user`, `tag`, `notice`, `notification` |
| 공통 UI 폴더          | kebab-case      | `button`, `empty-state`, `error-state`         |

도메인 자체가 복수형인 경우 단수형으로 변환한다 (`permissions` → `permission`).

---

## §5.2 파일명

**원칙:** 컴포넌트(`.tsx`) · 훅(`use*.ts`) 외 모든 파일은 **dot-suffix** 형식(`subject.role.ts`).  
subject는 kebab-case.

| 종류            | 규칙                    | 예시                                         |
| --------------- | ----------------------- | -------------------------------------------- |
| 컴포넌트        | `PascalCase.tsx`        | `VocStatusBadge.tsx`                         |
| hook            | `useSomething.ts`       | `useVocFilters.ts`                           |
| API             | `subject.api.ts`        | `voc.api.ts`, `auth.api.ts`                  |
| 타입            | `subject.types.ts`      | `voc.types.ts`                               |
| schema (Zod)    | `subject.schema.ts`     | `voc.schema.ts`, `create-voc.schema.ts`      |
| 상수            | `subject.constants.ts`  | `voc.constants.ts`                           |
| query key       | `subject.query-keys.ts` | `voc.query-keys.ts`                          |
| store (Zustand) | `subject.store.ts`      | `dashboard.store.ts`                         |
| Context         | `SomethingContext.tsx`  | `VocFilterContext.tsx`, `AuthContext.tsx`    |
| Provider        | `SomethingProvider.tsx` | `AuthProvider.tsx`, `QueryProvider.tsx`      |
| barrel          | `index.ts`              | (항상 이 이름)                               |
| MSW handler     | `subject.handler.ts`    | `voc.handler.ts`                             |
| fixture         | `subject.fixture.ts`    | `voc.fixture.ts`                             |
| util            | `subject.ts`            | `cn.ts`, `date.ts` — `shared/lib/` 하위만    |
| 테스트          | `원본파일명.test.ts(x)` | `VocStatusBadge.test.tsx`, `voc.api.test.ts` |

테스트 파일은 원본 파일의 casing을 그대로 따른다.

---

## §5.3 컴포넌트명

### Prefix 규칙

prefix = 해당 파일이 속한 최상위 entity / feature 이름. **하나만.**

| 종류            | prefix 규칙             | 예시                                                   |
| --------------- | ----------------------- | ------------------------------------------------------ |
| 도메인 컴포넌트 | entity/feature 이름 1개 | `VocStatusBadge`, `VocCommentList`, `UserRoleSelect`   |
| cross-domain    | 주(主) entity 기준      | `VocAssignee` (Voc가 주체)                             |
| 공통 UI         | prefix 없음             | `Button`, `Input`, `Dialog`, `DataTable`, `EmptyState` |
| 레이아웃        | 역할명                  | `AppShell`, `Sidebar`, `Topbar`, `PageTitle`           |

공통 UI(`Button`, `Input` 등)가 HTML · Radix 이름과 겹치는 경우,  
`@shared/ui/button` import path가 disambiguator 역할을 한다 — 이름 자체는 바꾸지 않는다.

### Suffix 규칙

| Suffix     | 역할                                              | 예시                               |
| ---------- | ------------------------------------------------- | ---------------------------------- |
| `*Drawer`  | 엣지에서 슬라이드 인하는 오버레이                 | `VocReviewDrawer`                  |
| `*Section` | Drawer · 페이지 내부 콘텐츠 영역                  | `VocMetaSection`, `VocBodySection` |
| `*Panel`   | Drawer가 아닌 플로팅 컨테이너 (popover, 사이드바) | —                                  |
| `*Card`    | 리스트 · 그리드 내 단일 카드                      | `VocCard`                          |
| `*Item`    | 리스트 내 단일 행                                 | `VocListItem`                      |
| `*Badge`   | 인라인 시맨틱 레이블                              | `VocStatusBadge`                   |
| `*Gate`    | 권한 분기 래퍼                                    | `VocPermissionGate`                |

suffix가 없는 경우: 가장 서술적인 명사를 직접 사용한다.

### Section 패턴

`VocSection`은 Drawer 내부 `title + body` 구조의 공용 래퍼.  
레이아웃이 크게 다를 경우 (`VocMetaSection` 그리드, `VocActionSection` 탭) 자체 루트 요소를 사용하고 `VocSection`을 쓰지 않는다.

```tsx
<VocSection title="첨부" testId="drawer-attachments">
  {/* section body */}
</VocSection>
```

### 결정 체크리스트

1. 엣지에서 슬라이드 인? → `*Drawer`
2. Drawer가 아닌 플로팅 오버레이? → `*Panel`
3. Drawer · 페이지 내 타이틀+바디 영역? → `*Section`
4. 그리드 · 리스트 내 반복 카드? → `*Card`
5. 리스트 단일 행? → `*Item`
6. 해당 없음 → 가장 서술적인 명사 사용

### 기존 파일 결정

| 파일                | 결정                                      |
| ------------------- | ----------------------------------------- |
| `AppProviders.tsx`  | 유지 (`app/providers/` 위치로 역할 명확)  |
| `PageTitle.tsx`     | `widgets/app-shell/` 하위 (레이아웃 전용) |
| `MockLoginPage.tsx` | `DevLoginPage.tsx`로 rename               |

---

## §5.4 Hook명

query(조회)는 **명사형**, mutation(변경)은 **동사형**, UI state는 **명사형**.

| 종류     | 규칙         | 예시                                                 |
| -------- | ------------ | ---------------------------------------------------- |
| query    | `use + 명사` | `useVocList`, `useVocDetail`, `useCurrentUser`       |
| mutation | `use + 동사` | `useCreateVoc`, `useDeleteVoc`, `useChangeVocStatus` |
| UI state | `use + 명사` | `useDisclosure`, `useVocFilter`, `useMasterCache`    |

---

## §5.5 Event Handler

| 종류            | 규칙                    | 예시                                                |
| --------------- | ----------------------- | --------------------------------------------------- |
| 내부 핸들러     | `handle` prefix         | `handleSubmit`, `handleStatusChange`, `handleClose` |
| props 콜백      | `on` prefix             | `onSubmit`, `onChange`, `onClose`                   |
| forwarded props | `on` 유지 (rename 금지) | 부모에서 받은 `onClose`를 그대로 전달할 때          |
| 라이브러리 콜백 | 라이브러리 규칙 따름    | RHF `handleSubmit(fn)` 반환값, TanStack `onSuccess` |
