# State Management Conventions

**When to read:** 상태 저장 위치(Query·URL·Context·useState) 결정이 필요할 때, Context 사용 여부 판단할 때

> Frontend 상태 관리 정본 문서.  
> LLM 코드 생성 · 리뷰 · 리팩토링 시 이 문서를 기준으로 판단한다.

---

## §8.1 상태 종류별 저장 위치

| 상태 종류             | 저장 위치                              | 비고                                    |
| --------------------- | -------------------------------------- | --------------------------------------- |
| 서버 데이터           | TanStack Query                         | `/me`, VOC 목록, 태그 등                |
| 마스터(코드성) 데이터 | TanStack Query (`staleTime: Infinity`) | 앱 초기화 시 prefetch                   |
| 폼 입력               | React Hook Form                        | `defaultValues`는 URL params에서 파생   |
| URL 필터/검색/정렬    | URL search params                      | Zod로 parse + fallback to defaults      |
| 앱 전역 인증          | React Context (selector only)          | `/me` Query 결과를 Context가 expose     |
| Cross-widget UI 상태  | React Context                          | ≥2 sibling widget + 공통 조상 없을 때만 |
| Toast 알림 표시       | sonner (라이브러리 위임)               | `toast()` 호출만 — 별도 상태 관리 없음  |
| 낙관적 업데이트       | TanStack Query `onMutate` / `onError`  | Context/useState 사용 금지              |
| 디바운스 입력         | local `useState` + `useDebounce` hook  | URL 반영은 300ms delay                  |
| 로컬 영속 상태        | `shared/lib/storage.ts` + `useState`   | localStorage 직접 접근 금지             |
| 단순 UI 상태          | local `useState`                       | 모달, Dropdown, 탭 선택                 |
| **목록에 없는 경우**  | local `useState`                       | cross-feature 필요 시 → ADR 작성        |

Zustand: 도입 시 ADR 필수.

---

## §8.2 Context 처리 방침

| Context               | 방침                               | 근거                                          |
| --------------------- | ---------------------------------- | --------------------------------------------- |
| `AuthContext`         | **유지** (selector 역할만)         | `/me` 데이터는 Query 캐시, Context는 expose만 |
| `RoleContext`         | **유지**                           | AuthContext와 연동, 앱 전역                   |
| `VOCFilterContext`    | **제거** → URL search params       | 서버 필터는 URL이 canonical                   |
| `MasterCacheContext`  | **제거** → TanStack Query          | `staleTime: Infinity` + 앱 초기화 prefetch    |
| `NotificationContext` | **제거** → TanStack Query + sonner | 서버 알림 목록/unread = Query, toast = sonner |
| `VOCDrawerContext`    | **유지**                           | Sidebar ↔ VocWorkspace 두 widget 간 공유      |

---

## §8.3 URL search params 직렬화 규칙

```
단일 값     ?status=OPEN
복수 값     repeated keys  ?tag=A&tag=B  (comma join 금지)
기본값      URL에서 omit, 파싱 시 Zod fallback
검색 입력   로컬 state → 300ms debounce → URL 반영
파싱        Zod schema로 validate, 실패 시 default로 fallback
RHF 연동    URL이 canonical; defaultValues = URL parse 결과
```

---

## §8.4 TanStack Query 규칙

```
마스터 데이터   staleTime: Infinity, gcTime: Infinity
               AppProviders에서 queryClient.prefetchQuery 호출
Query key      entity 소유 (voc.query-keys.ts 등)
Cache 무효화   mutation 소유 feature가 관련 entity queryKey 전체 invalidate
서버 데이터    Context / Zustand에 복사 저장 금지
AuthContext    /me Query 결과를 selector로만 expose — 데이터 복사 금지
```

---

## §8.5 원칙

```
서버 데이터 → Context/Zustand 중복 저장 금지
폼 입력값  → useState 여러 개 분산 금지, RHF로 통합
URL 필터   → URL이 single source of truth
Toast      → sonner 직접 호출, 별도 상태 관리 금지
Zustand    → 도입 시 ADR 필수
```
