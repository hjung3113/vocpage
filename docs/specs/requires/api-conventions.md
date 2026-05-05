# API Conventions

**When to read:** API 파일 위치·응답 형식·query key·cache 무효화 규칙이 필요할 때

> Frontend API 레이어 정본 문서.  
> LLM 코드 생성 · 리뷰 · 리팩토링 시 이 문서를 기준으로 판단한다.

---

## §9.1 응답 형식 (목표 — 백엔드 정합화 필요)

> **현재 백엔드는 엔드포인트별 raw 형식 반환 중.** 아래는 migration target.  
> 백엔드 정합화 전까지 `client.ts`의 에러 인터셉터가 에러 envelope만 표준화.

```ts
// 성공
type ApiSuccessResponse<T> = { success: true; data: T; message?: string };

// 실패
type ApiErrorResponse = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

// 공통
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 페이지네이션 — ApiSuccessResponse<PaginatedResponse<T>>로 래핑
type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
```

---

## §9.2 파일 위치

| 대상                               | 위치                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| HTTP client                        | `shared/api/client.ts`                                                    |
| QueryClient 설정                   | `shared/api/queryClient.ts`                                               |
| 에러 처리 (`ApiError` 클래스 포함) | `shared/api/error.ts`                                                     |
| 도메인 조회 API (query)            | `entities/{entity}/api/{entity}.api.ts`                                   |
| 도메인 query key factory           | `entities/{entity}/api/{entity}.query-keys.ts`                            |
| feature 전용 mutation API          | `features/{feature}/api/{feature}.api.ts`                                 |
| MSW handler                        | `test/mocks/handlers/{entity}.handler.ts`                                 |
| 레이어 공개 인터페이스             | `entities/{entity}/index.ts`, `features/{feature}/index.ts` (barrel 필수) |

---

## §9.3 auth 레이어 경계 (엄격)

| 소유                                   | 내용                              |
| -------------------------------------- | --------------------------------- |
| `entities/user/api/user.api.ts`        | `getMe` query                     |
| `entities/user/api/user.query-keys.ts` | user query key factory            |
| `entities/user/model/user.types.ts`    | `User` 타입                       |
| `features/auth/api/auth.api.ts`        | login · logout · refresh mutation |
| `features/auth/model/`                 | 로그인 폼 schema · `useAuth` hook |

**Import 방향:** `features/auth` → `entities/user` 허용. 역방향 금지.

---

## §9.4 Query Key 규칙

```ts
// 예시 — entities/voc/api/voc.query-keys.ts
export const vocQueryKeys = {
  all: (role: Role) => ['voc', role] as const,
  list: (role: Role, filters: VocFilters) => ['voc', role, 'list', filters] as const,
  detail: (role: Role, id: string) => ['voc', role, 'detail', id] as const,
};
```

- **role param 필수** — 모든 query key factory에 `role` 포함 (현재 패턴 유지)
- entity 소유, feature는 참조만
- `entities → entities` import 금지 — 공유 타입은 `shared/types/`를 통한다

---

## §9.5 Cache 무효화 세분화 규칙

mutation 후 무효화 granularity:

```
단일 항목 변경      → detail(role, id) 무효화
목록에 영향 (CRUD)  → list(role) 무효화
관계 변경           → all(role) 무효화
```

기본: 가장 좁은 key 먼저. 관계 변경이 확실한 경우에만 `all` 사용.

---

## §9.6 원칙

```
fetch/axios 직접 호출   shared/api/client.ts 외 금지 (컴포넌트·hook에서 직접 호출 금지)
Zod 검증               서버 응답은 Zod schema로 parse — 실패 시 ApiError throw
entities → entities    import 금지 (공유 타입은 shared/types/ 경유)
shared/contracts/*     entities/*/api 및 features/*/api 양쪽에서 import 허용
barrel index.ts        entity · feature 슬라이스마다 필수 (FSD public API)
ApiError 위치          shared/api/error.ts 단일 위치 (client.ts 내 중복 금지)
```

---

## §9.7 현재 파일 → 새 위치 매핑

| 현재                         | 새 위치                                         | 비고              |
| ---------------------------- | ----------------------------------------------- | ----------------- |
| `api/client.ts`              | `shared/api/client.ts`                          |                   |
| `api/queryClient.ts`         | `shared/api/queryClient.ts`                     |                   |
| `api/queryKeys.ts`           | entity별 `{entity}.query-keys.ts`로 분리        | role-scoping 유지 |
| `api/voc.ts`                 | `entities/voc/api/voc.api.ts`                   |                   |
| `api/auth.ts` (getMe)        | `entities/user/api/user.api.ts`                 |                   |
| `api/auth.ts` (login·logout) | `features/auth/api/auth.api.ts`                 |                   |
| `api/masters.ts`             | `entities/master/api/master.api.ts`             |                   |
| `api/notifications.ts`       | `entities/notification/api/notification.api.ts` |                   |
| `mocks/handlers/*.ts`        | `test/mocks/handlers/{entity}.handler.ts`       |                   |

**마이그레이션 전략:** 구 경로에 re-export shim 1 wave 유지 → 이후 제거.  
완료 검증: `rg -n "from '.*api/voc'"` 0건 확인.
