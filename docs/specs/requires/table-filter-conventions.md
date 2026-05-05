# Table / Filter Conventions

**When to read:** 테이블·페이지네이션·필터 URL 동기화·컬럼 정의 규칙이 필요할 때

> Frontend 테이블·필터 정본 문서.

---

## §14.1 기본 정책

| 대상        | 정책                                      |
| ----------- | ----------------------------------------- |
| VOC 목록    | 서버 페이지네이션 + 서버 필터 + 서버 정렬 |
| 관리자 목록 | 서버 페이지네이션                         |
| 대시보드    | 서버 집계 데이터                          |
| 필터 상태   | URL search params (canonical)             |
| row click   | 상세 Drawer 열기 (`?drawer={id}` 추가)    |

---

## §14.2 URL Query 규칙

```
페이지네이션   ?page=1&pageSize=20          기본값: page=1, pageSize=20
허용 pageSize  10 | 20 | 50                 그 외 → 기본값 fallback
정렬           ?sort=createdAt&order=desc   단일 정렬만 허용
필터 단일값    ?status=OPEN
필터 복수값    repeated keys  ?tag=A&tag=B
Drawer         ?drawer={vocId}
parse 실패     Zod fallback → default + replaceState (URL 자동 교정)
```

---

## §14.3 Filter Form ↔ URL 동기화

```ts
// filter form은 URL이 canonical
const parsed = vocFilterSchema.parse(Object.fromEntries(searchParams));
const form = useForm({ values: parsed }); // URL → form (초기화)
const values = form.watch();
useEffect(() => {
  setSearchParams(values);
}, [values]); // form → URL (단방향)
```

URL parse 실패 시 default로 fallback 후 `replaceState` (history stack 오염 방지).

---

## §14.4 TanStack Query Key 패턴

```ts
// URL filter params가 query key에 포함
vocQueryKeys.list(role, parsedFilters); // → ['voc', role, 'list', { page, status, ... }]
```

URL 변경 → `parsedFilters` 변경 → Query 자동 refetch.

---

## §14.5 테이블 컬럼 정의

```
widgets/voc-workspace/
├─ VocWorkspace.tsx
├─ VocTable.tsx
├─ voc-workspace.columns.tsx   ← 컬럼 정의 분리
└─ VocFilterBar.tsx
```

컬럼 정의 파일에서 권한별 분기 처리 (role prop 전달).

---

## §14.6 원칙

```
페이지네이션·정렬·필터    서버 처리 (클라이언트 처리 금지)
필터 상태                URL이 single source of truth
다중 정렬                금지 (단일 정렬만)
빈 필터 파라미터         URL에서 omit = 미설정과 동치
컬럼 정의                별도 파일 분리 필수
```
