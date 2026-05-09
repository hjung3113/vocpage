# shadcn/ui Migration Plan

> 탐색 기준일: 2026-05-06  
> 범위: `frontend/src/shared/ui/`, `features/voc/review/ui/`, `features/voc/list/ui/`, `features/voc/create/ui/`  
> 3인 전문가 검토 완료 (아키텍트 · 코드 리뷰어 · 코드 품질 전문가)

---

## 1. 이미 shadcn/ui 래퍼 (작업 불필요)

| 컴포넌트                | 위치                                |
| ----------------------- | ----------------------------------- |
| `Button`                | `shared/ui/button/index.tsx`        |
| `Dialog` (+ 서브)       | `shared/ui/dialog/index.tsx`        |
| `Select` (+ 서브)       | `shared/ui/select/index.tsx`        |
| `Tabs` (+ 서브)         | `shared/ui/tabs/index.tsx`          |
| `Input`                 | `shared/ui/input/index.tsx`         |
| `Textarea`              | `shared/ui/textarea/index.tsx`      |
| `Label`                 | `shared/ui/label/index.tsx`         |
| `Tooltip` (+ Provider)  | `shared/ui/tooltip/index.tsx`       |
| `Popover` (+ 서브)      | `shared/ui/popover/index.tsx`       |
| `DropdownMenu` (+ 서브) | `shared/ui/dropdown-menu/index.tsx` |
| `Separator`             | `shared/ui/separator.tsx`           |
| `Toaster`               | `shared/ui/toast/index.tsx`         |

---

## 2. 우선순위 A — 교체 (작업량 소, 효과 명확)

### `CollapsibleSection`

- **위치:** `features/voc/review/ui/CollapsibleSection.tsx`
- **현재:** `useState` + `<button>` 수동 토글
- **교체:** `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`
- **이유:** 애니메이션, aria-expanded 자동 처리

### `NativeSelect`

- **위치:** `features/voc/create/ui/NativeSelect.tsx`
- **현재:** raw `<select>` 엘리먼트
- **교체:** `shared/ui/select` (기설치 shadcn Select 재사용)
- **이유:** 디자인 일관성; Select 이미 있음

### `IconBtn` in `DrawerActionButtons`

- **위치:** `features/voc/review/ui/DrawerActionButtons.tsx`
- **현재:** 커스텀 `<button>` 래퍼
- **교체:** `Button variant="ghost" size="icon"` + `Tooltip`
- **이유:** Button이 이미 ghost/icon 지원

### `shared/ui/alert`

- **위치:** `shared/ui/alert/index.tsx`
- **현재:** 수동 `forwardRef` + `variantClasses` 객체 — shadcn과 구조 동일
- **교체:** shadcn `Alert` + `AlertTitle` + `AlertDescription`
- **이유:** 중복 유지 불필요; 그대로 교체 가능

### `ChipGroup` + `VocStatusFilters` ★ 판정 번복

- **위치:** `features/voc/list/ui/VocAdvancedFilters.tsx`, `features/voc/list/ui/VocStatusFilters.tsx`
- **현재:** 두 파일이 독립적으로 `role="group"` + `aria-pressed` 버튼 배열로 멀티셀렉트 토글 구현 — 패턴 중복
- **교체:** shadcn `ToggleGroup` (`type="multiple"`) + `ToggleGroupItem` — Radix가 정확히 이 시나리오를 위해 설계됨
- **이유:** aria 시맨틱 자동 처리 + 두 곳의 중복 구현을 한 번에 제거

### `ActivityAvatar` ★ 신규 발굴

- **위치:** `features/voc/review/ui/ActivityAvatar.tsx`
- **현재:** `<span>` + 이니셜 조합 — shadcn Avatar의 수동 구현체
- **교체:** shadcn `Avatar` + `AvatarFallback`
- **이유:** 1:1 대응; 이미지 fallback 확장성 확보

---

## 3. 우선순위 B — 중간 작업량 (디자인 토큰 매핑 or 구조 조정 필요)

### Badge 계열 통합: `SolidChip` + `OutlineChip` + `TextMark` ★ 통합

- **위치:** `shared/ui/badge/SolidChip.tsx`, `shared/ui/badge/OutlineChip.tsx`, `shared/ui/badge/TextMark.tsx`
- **현재:** 세 컴포넌트가 각각 다른 방식으로 badge/chip UI를 구현 (inline CSS var, span 조합)
- **교체:** shadcn `Badge`를 base primitive로 `cva()` 위에 variant 추가
  - `SolidChip` → `status` variant (CSS var chain으로 `--status-*` 토큰 매핑)
  - `OutlineChip` → `outline` variant + brand 토큰 override
  - `TextMark` → `size: { xs, sm }` + `iconMode: { 'icon-only', 'icon-text' }` variant 추가 (`#` 특수 케이스 보존)
- **주의:** `SolidChipVariant` 타입 유지; SolidChip → OutlineChip → TextMark 순서로 작업 권장

### `DataTable`

- **위치:** `shared/ui/table/DataTable.tsx`
- **현재:** 완전 커스텀 `<table>` (정렬, 클릭, emptyState 포함)
- **교체:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`을 내부 primitive로
- **주의:** `sortKey`/`sortDir`/`onSort`, `onRowClick`, `DataTableColumn` 인터페이스 보존 필수

### `Pagination`

- **위치:** `shared/ui/pagination/Pagination.tsx`
- **현재:** 커스텀 (`getPageList` + Button)
- **교체:** shadcn `Pagination` (`PaginationLink`, `PaginationEllipsis`, `PaginationPrevious`, `PaginationNext`)
- **주의:** `getPageList` 로직(ellipsis 계산) 재사용 or shadcn 방식으로 재작성

### 공통 추출: `MetaField` ★ 신규 발굴

- **위치:** `features/voc/review/ui/VocDetailSection.tsx`, `features/voc/review/ui/VocPeopleSection.tsx`
- **현재:** `MetaField` 함수 + `LABEL_STYLE`/`VALUE_STYLE` 상수가 두 파일에 각각 정의됨
- **교체:** `shared/ui/meta-field/MetaField.tsx`로 추출, `label: string, value: ReactNode` 인터페이스 통일

### 공통 추출: `StatusLayout` ★ 신규 발굴

- **위치:** `shared/ui/empty-state/EmptyState.tsx`, `shared/ui/error-state/ErrorState.tsx`
- **현재:** `flex flex-col items-center justify-center gap-3 py-16 text-center` — 두 컴포넌트가 동일 레이아웃
- **교체:** `shared/ui/status-layout/` 공통 base 추출; EmptyState·ErrorState가 이를 상속 (shadcn add 불필요, 패턴만 채택)

### `AttachmentZone` 내부 primitives 교체 ★ 판정 번복

- **위치:** `shared/ui/attachment-zone/AttachmentZone.tsx`
- **현재:** 복잡한 drag-drop 로직 + raw HTML Label/Input/Button
- **방침:** 컴포넌트 존치, 내부 `<label>` → shadcn `Label`, `<input>` → shadcn `Input`, retry `<button>` → shadcn `Button`으로 교체
- **이유:** DnD 로직(WeakMap key, validateAddition, dragOver)은 shadcn 비해당 영역; UI shell만 통일

---

## 4. 우선순위 C — 결정 필요

### `LoadingState`

- **위치:** `shared/ui/skeleton/LoadingState.tsx`
- **현재:** 커스텀 회전 스피너
- **후보:** shadcn `Skeleton` (bar형 스켈레톤)
- **결정 필요:** 스피너(로딩 중) vs 스켈레톤(콘텐츠 placeholder) — UX 결정에 따라 병용 or 교체

---

## 5. 존치 확정 (shadcn 비해당 영역)

| 컴포넌트                          | 이유                                             | 비고                                  |
| --------------------------------- | ------------------------------------------------ | ------------------------------------- |
| `VocSection`                      | 단순 `<section>` 래퍼; 추상화 불필요             | —                                     |
| `ErrorBoundary`                   | 클래스 컴포넌트 에러 경계 — shadcn 미제공        | —                                     |
| `VocAdvancedFilters` (패널 shell) | open/close 애니메이션 + reset 버튼 전용 레이아웃 | 내부 ChipGroup만 ToggleGroup으로 교체 |

---

## 6. 설치 명령 (미설치 기준)

```bash
# 우선순위 A
npx shadcn add collapsible     # CollapsibleSection
npx shadcn add alert           # shared/ui/alert
npx shadcn add toggle-group    # ChipGroup + VocStatusFilters
npx shadcn add avatar          # ActivityAvatar

# 우선순위 B
npx shadcn add badge           # SolidChip + OutlineChip + TextMark 통합
npx shadcn add table           # DataTable primitive
npx shadcn add pagination      # Pagination

# 우선순위 C (결정 후)
npx shadcn add skeleton        # LoadingState
```

---

## 7. 실행 순서 권장

1. **A 묶음 한 번에** — 독립적이므로 병렬 처리 가능. 단, CollapsibleSection → VocSection 순서로 `flex flex-col gap-2` 베이스 확인 후 진행.
2. **Badge 통합(B 최우선)** — SolidChip → OutlineChip → TextMark 순. 세 컴포넌트가 하나의 `Badge` primitive tree로 통합되면 이후 UI 일관성 대폭 향상.
3. **DataTable + Pagination** — 리스트 화면 전체 영향; 테스트 커버리지 선 확인.
4. **MetaField + StatusLayout 추출** — 구조 변경이 작으므로 DataTable과 별개로 진행 가능.
5. **AttachmentZone 내부 교체** — 로직 변경 없이 UI shell만 교체; 최후 단계.
