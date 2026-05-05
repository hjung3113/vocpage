# Error / Loading / Empty State Conventions

**When to read:** 에러·로딩·빈 상태 컴포넌트 선택, 401/403/422 처리 방식이 필요할 때

> Frontend 에러·로딩·빈 상태 처리 정본 문서.

---

## §12.1 에러 처리

| 상황                   | 처리 방식                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------- |
| 목록 조회 실패         | 화면 안에 `<ErrorState>` 컴포넌트                                                  |
| 상세 조회 실패         | Drawer 내부 `<ErrorState>`                                                         |
| 생성/수정/삭제 실패    | sonner `toast.error()`                                                             |
| 폼 validation 오류     | RHF field error (인라인 표시)                                                      |
| BE 422 field error     | `setError(field, {type:'server'})` 매핑 → field error                              |
| BE 422 non-field error | sonner `toast.error()`                                                             |
| 401 세션 만료          | `/login?returnTo={현재 경로}` redirect + `toast.warning('세션이 만료되었습니다.')` |
| 403 권한 없음          | `/403` redirect 또는 disabled action (§12.4 기준)                                  |
| 네트워크 오류          | `<ErrorState>` + 재시도 버튼                                                       |
| 서버 장애 (5xx)        | `<ErrorState>` + 공통 에러 메시지                                                  |

---

## §12.2 로딩 처리

| 상황                      | 처리 방식                                           |
| ------------------------- | --------------------------------------------------- |
| 목록 초기 로딩            | `<TableSkeleton>`                                   |
| 목록 refetch (백그라운드) | 테이블 우상단 `<RefetchIndicator>` (spinner 소형)   |
| Drawer 초기 로딩          | `<DetailSkeleton>`                                  |
| 버튼 submit 중            | 버튼 `loading` prop + `disabled`                    |
| 페이지 전체 로딩          | `<PageSkeleton>`                                    |
| 3초 초과 시               | 로딩 메시지 "데이터를 불러오는 중입니다…" 추가 표시 |

---

## §12.3 빈 상태 처리

| 조건                                 | 컴포넌트       | 메시지                        |
| ------------------------------------ | -------------- | ----------------------------- |
| 필터/검색 파라미터 없음 + 데이터 0건 | `<EmptyState>` | "등록된 VOC가 없습니다."      |
| 필터/검색 파라미터 있음 + 결과 0건   | `<EmptyState>` | "조건에 맞는 VOC가 없습니다." |
| 권한상 볼 수 없음                    | `<EmptyState>` | "접근 권한이 없습니다."       |

필터 파라미터 기준: URL에 `status`, `keyword`, `tag` 등 1개 이상 있으면 "검색 결과 없음".

---

## §12.4 권한별 UI 처리 기준

```
읽기 권한 없음    → 메뉴·버튼·섹션 숨김 (display: none)
쓰기 권한 없음    → disabled + tooltip ("권한이 없습니다.")
```

보안 최종 책임은 백엔드. 프론트 권한 처리는 UX 목적.

---

## §12.5 컴포넌트 위치

```
shared/ui/skeleton/       TableSkeleton, DetailSkeleton, PageSkeleton
shared/ui/empty-state/    EmptyState
shared/ui/error-state/    ErrorState, ErrorBoundary
```

`RefetchIndicator`는 `widgets/voc-workspace/` 하위 (도메인 맥락).
