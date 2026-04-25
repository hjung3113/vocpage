# Phase 7 — 5-Expert Adversarial Review

> 날짜: 2026-04-25
> 방법: 5명 전문가 병렬 리뷰 (보안·아키텍처·성능·프론트엔드·QA), 각 3개 관점 × 5개 항목
> 결론: **534/750 — B (71.2%)** — 기능 완성도 탄탄, 보안 2건·Race condition 3건이 수정 필요

---

## 최상위 판단

Phase 7은 기능 구현과 기본 패턴 면에서 탄탄하다. R7-1~R7-10 수정을 통해 명백한 결함들이 해소됐다. 그러나 **보안 소유권 검증 누락 2건**, **Race condition 3건(BE autoTag·FE VOC전환·FE 알림 read-all)**, **SELECT \* + embedding 벡터 오버페치**, **쿼리 타임아웃 전무**가 프로덕션 투입 전 필수 수정 대상이다.

---

## 정량 점수 요약

| 전문가            | 영역                     | P1    | P2    | P3    | 합계        | 등급          |
| ----------------- | ------------------------ | ----- | ----- | ----- | ----------- | ------------- |
| 보안 전문가       | Auth·입력검증·API보안    | 39/50 | 37/50 | 31/50 | **107/150** | B             |
| 아키텍처 전문가   | 코드구조·REST설계·신뢰성 | 34/50 | 36/50 | 32/50 | **102/150** | B             |
| 성능 전문가       | DB쿼리·캐시전략·비동기   | 32/50 | 38/50 | 34/50 | **104/150** | B             |
| 프론트엔드 전문가 | React패턴·컴포넌트·타입  | 37/50 | 33/50 | 41/50 | **111/150** | B             |
| QA 전문가         | 커버리지·품질·설계패턴   | 37/50 | 39/50 | 34/50 | **110/150** | B+            |
| **종합**          |                          |       |       |       | **534/750** | **B (71.2%)** |

### PASS/PARTIAL/FAIL 분포 (75개 항목)

```
PASS     ████████████████████ 22개 (29%)
PARTIAL  ████████████████████████████████████ 43개 (57%)
FAIL     ██████ 10개 (13%)
```

---

## 결함 목록

### 🔴 HIGH — Phase 8 착수 전 필수 수정

| #   | 전문가   | 결함                                                                            | 위치                            |
| --- | -------- | ------------------------------------------------------------------------------- | ------------------------------- |
| H1  | 보안     | `role` 허용목록 없음 → 임의 문자열 admin PATCH 가능                             | `admin.ts:386-431`              |
| H2  | 보안     | SQL 인터폴레이션: `interval '${RETENTION_DAYS} days'`                           | `notifications.ts:33`           |
| H3  | 보안     | Sub-task POST 부모 소유권 미검증 (R7-1은 GET만 수정)                            | `subtasks.ts:48-90`             |
| H4  | 아키텍처 | `applyTagRules` fire-and-forget + 독립 트랜잭션 없음 → 태그 불일치 가능         | `autoTag.ts:55-80`              |
| H5  | 아키텍처 | `payload-review` 거절 시 `voc_payload_history.is_current` 상태 불일치           | `payload.ts:279-299`            |
| H6  | 프론트   | VOC 빠른 전환 시 stale 응답 덮어쓰기 (AbortController 미사용)                   | `VocDrawer.tsx:86-103`          |
| H7  | 프론트   | `refetchPanel`: PATCH read-all 후 GET 순서 → 에러 시 뱃지 스테일 + 에러 UI 없음 | `NotificationContext.tsx:49-63` |

### 🟠 MEDIUM — Phase 8 병행 수정 권장

| #   | 전문가   | 결함                                                                                            | 위치                          |
| --- | -------- | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| M1  | 보안     | IDOR: `GET /:id/payload-history` 소유권 미검증                                                  | `payload.ts:182-207`          |
| M2  | 보안     | 글로벌 Rate limiting 없음                                                                       | 전체 routes                   |
| M3  | 아키텍처 | `POST /vocs/:id/masters/refresh` 오배치 (subtasks 라우터, `:id` 미사용)                         | `subtasks.ts:208-238`         |
| M4  | 아키텍처 | `res.json()` 후 side-effect 발생 → 프로세스 크래시 시 알림 유실                                 | `vocs.ts:272-287`             |
| M5  | 성능     | `SELECT *` + `embedding vector(1536)` (~6KB/행) 전 요청 포함                                    | `vocs.ts:152,182,310`         |
| M6  | 성능     | `ILIKE '%keyword%'` leading wildcard → 풀 스캔                                                  | `vocs.ts:83-85`               |
| M7  | 성능     | 쿼리 타임아웃 미설정 → 느린 쿼리 시 커넥션 풀 고갈 위험                                         | 전체 routes                   |
| M8  | 성능     | `tag_rules` 캐시 만료 시 thundering herd (in-flight 중복 제거 없음)                             | `autoTag.ts:15-16`            |
| M9  | 프론트   | `PayloadSection` effect deps에 `voc.structured_payload` 객체 참조 → 부모 refetch 시 편집 초기화 | `PayloadSection.tsx:110-115`  |
| M10 | 프론트   | 접근성: 클릭 전용 div, Esc 핸들러 없음, `role="dialog"` 미사용                                  | `NotificationPanel.tsx:30-96` |
| M11 | QA       | `POST /masters/refresh` HTTP 레벨 테스트 전무 (401·403·429·200 모두 없음)                       | `subtasks.ts:208-238`         |
| M12 | QA       | `드랍` 상태 VOC의 payload 제출 분기 테스트 없음                                                 | `payload.ts:83`               |
| M13 | QA       | `notifications.test.ts` afterEach teardown 없음 → 암묵적 순서 의존성                            | `notifications.test.ts`       |

### 🟡 LOW — 기술부채

| 전문가   | 내용                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| 보안     | `slug·name·color` 형식 검증 없음, 감사 로그(role 변경·self-review 거절) 누락              |
| 아키텍처 | `tag_rules` 캐시 멀티 인스턴스 무효화 안됨, `{ok:true}` vs 리소스 반환 불일치             |
| 성능     | OFFSET 페이지네이션(대용량 시 성능 저하), `lastRefreshByUser` map 상한 없음               |
| 프론트   | inline-style 남용(Tailwind 미사용), `as unknown as` 이중 캐스팅, `formatDate` 유틸 미추출 |
| QA       | 5xx 경로 테스트 전무, 알림 cross-feature(PATCH vocs → GET notifications) E2E 없음         |

---

## 관점별 전체 체크리스트

### 보안 전문가

#### P1: 인증·인가

| 항목                                 | 결과       | 점수 |
| ------------------------------------ | ---------- | ---- |
| 미들웨어 순서 (auth → 비즈니스 로직) | ✅ PASS    | 10   |
| RBAC 완전성                          | ⚠️ PARTIAL | 7    |
| 소유권 검증                          | ⚠️ PARTIAL | 7    |
| 세션·토큰 검증 견고성                | ✅ PASS    | 8    |
| 권한 상승 방지                       | ⚠️ PARTIAL | 7    |

#### P2: 입력검증·주입 방지

| 항목                       | 결과       | 점수 |
| -------------------------- | ---------- | ---- |
| SQL Injection 방지         | ⚠️ PARTIAL | 8    |
| 입력 새니타이즈            | ⚠️ PARTIAL | 6    |
| 요청 바디 스키마 검증      | ⚠️ PARTIAL | 6    |
| 파일 업로드 검증           | N/A        | 8    |
| 에러 메시지 내부 노출 방지 | ✅ PASS    | 9    |

#### P3: 데이터·API 보안

| 항목                  | 결과       | 점수 |
| --------------------- | ---------- | ---- |
| 민감 데이터 응답 노출 | ⚠️ PARTIAL | 7    |
| CORS 설정             | ⚠️ PARTIAL | 6    |
| Rate limiting         | ❌ PARTIAL | 5    |
| IDOR 방지             | ⚠️ PARTIAL | 7    |
| 감사 로깅             | ⚠️ PARTIAL | 6    |

### 아키텍처 전문가

#### P1: 코드 구조·관심사 분리

| 항목                | 결과       | 점수 |
| ------------------- | ---------- | ---- |
| 라우트 핸들러 thin  | ⚠️ PARTIAL | 5    |
| 파일 크기·단일 책임 | ✅ PASS    | 8    |
| 일관된 에러 처리    | ✅ PASS    | 8    |
| 미들웨어 일관성     | ⚠️ PARTIAL | 6    |
| 모듈 결합도·응집도  | ⚠️ PARTIAL | 7    |

#### P2: API 설계·REST 원칙

| 항목               | 결과       | 점수 |
| ------------------ | ---------- | ---- |
| HTTP 메서드 시맨틱 | ✅ PASS    | 8    |
| 리소스 네이밍      | ⚠️ PARTIAL | 6    |
| 응답 형태 일관성   | ⚠️ PARTIAL | 6    |
| 상태 코드 정확성   | ✅ PASS    | 8    |
| 안전 연산 멱등성   | ✅ PASS    | 8    |

#### P3: 신뢰성·정확성

| 항목                  | 결과       | 점수 |
| --------------------- | ---------- | ---- |
| 트랜잭션 사용         | ⚠️ PARTIAL | 7    |
| Race condition 방지   | ❌ FAIL    | 4    |
| 에러 복구·롤백        | ⚠️ PARTIAL | 7    |
| Null/undefined 안전성 | ✅ PASS    | 8    |
| 엣지 케이스 처리      | ⚠️ PARTIAL | 6    |

### 성능 전문가

#### P1: DB 쿼리 효율

| 항목                 | 결과       | 점수 |
| -------------------- | ---------- | ---- |
| N+1 쿼리 방지        | ⚠️ PARTIAL | 7    |
| 인덱스 친화적 WHERE  | ⚠️ PARTIAL | 6    |
| 페이지네이션         | ⚠️ PARTIAL | 6    |
| 배치 연산            | ✅ PASS    | 9    |
| 불필요한 데이터 조회 | ❌ FAIL    | 4    |

#### P2: 캐시 전략

| 항목               | 결과       | 점수 |
| ------------------ | ---------- | ---- |
| 캐시 무효화 정확성 | ⚠️ PARTIAL | 7    |
| 캐시 키 설계       | ✅ PASS    | 8    |
| 메모리 누수 방지   | ⚠️ PARTIAL | 7    |
| Cold start 처리    | ✅ PASS    | 9    |
| 캐시 히트율 최적화 | ⚠️ PARTIAL | 7    |

#### P3: 비동기·동시성

| 항목                | 결과       | 점수 |
| ------------------- | ---------- | ---- |
| 이벤트 루프 블로킹  | ✅ PASS    | 9    |
| Promise 체인 정확성 | ⚠️ PARTIAL | 7    |
| 동시 요청 공유 상태 | ⚠️ PARTIAL | 6    |
| 리소스 정리         | ✅ PASS    | 9    |
| 타임아웃 처리       | ❌ FAIL    | 3    |

### 프론트엔드 전문가

#### P1: React 패턴·상태 관리

| 항목                         | 결과       | 점수 |
| ---------------------------- | ---------- | ---- |
| 불필요한 re-render 방지      | ✅ PASS    | 9    |
| useEffect 사이드이펙트       | ⚠️ PARTIAL | 7    |
| Context 메모이제이션         | ✅ PASS    | 9    |
| 로딩·에러 상태 처리          | ⚠️ PARTIAL | 6    |
| 비동기 effect Race condition | ⚠️ PARTIAL | 6    |

#### P2: 컴포넌트 설계·재사용성

| 항목                    | 결과       | 점수 |
| ----------------------- | ---------- | ---- |
| 단일 명확 책임          | ⚠️ PARTIAL | 6    |
| Props 인터페이스·타이핑 | ✅ PASS    | 8    |
| 조건부 렌더링 정확성    | ✅ PASS    | 8    |
| 이벤트 핸들러 패턴      | ⚠️ PARTIAL | 7    |
| 접근성 (aria·키보드)    | ❌ FAIL    | 4    |

#### P3: 타입 안전성·코드 품질

| 항목                   | 결과       | 점수 |
| ---------------------- | ---------- | ---- |
| TS strict (any 없음)   | ⚠️ PARTIAL | 7    |
| API 응답 타입 안전성   | ✅ PASS    | 8    |
| Null/undefined 처리    | ✅ PASS    | 8    |
| 일관된 네이밍          | ✅ PASS    | 9    |
| 데드코드·미사용 import | ✅ PASS    | 9    |

### QA 전문가

#### P1: 커버리지 완전성

| 항목                | 결과       | 점수 |
| ------------------- | ---------- | ---- |
| 해피패스 커버리지   | ✅ PASS    | 9    |
| 에러 패스 (4xx·5xx) | ⚠️ PARTIAL | 7    |
| 인가 경계 테스트    | ✅ PASS    | 9    |
| 엣지 케이스         | ⚠️ PARTIAL | 6    |
| 교차 기능 상호작용  | ⚠️ PARTIAL | 6    |

#### P2: 테스트 품질·신뢰성

| 항목                         | 결과       | 점수 |
| ---------------------------- | ---------- | ---- |
| 테스트 격리                  | ⚠️ PARTIAL | 7    |
| 의미있는 assertion (DB 레벨) | ✅ PASS    | 9    |
| 설명 명확성                  | ✅ PASS    | 9    |
| Flaky 테스트 없음            | ⚠️ PARTIAL | 7    |
| Setup/Teardown 정확성        | ⚠️ PARTIAL | 7    |

#### P3: 설계 패턴

| 항목                 | 결과       | 점수 |
| -------------------- | ---------- | ---- |
| AAA 패턴             | ✅ PASS    | 9    |
| 테스트 데이터 관리   | ⚠️ PARTIAL | 7    |
| Mock 전략            | ✅ PASS    | 8    |
| 통합 vs 단위 균형    | ⚠️ PARTIAL | 6    |
| 누락 테스트 카테고리 | ❌ FAIL    | 4    |

---

## 긍정 평가

- **R7-10 분리** (vocs.ts → subtasks.ts + payload.ts): 명확한 단일 책임 구현
- **배치 INSERT** (R7-8): autoTag N개 루프 → 단일 VALUES INSERT
- **비동기 I/O** (R7-3): `readFileSync` → `fs.promises.readFile`
- **O(1) 멤버십 검사** (R7-6): Set 사전 빌드로 verifyPayload 최적화
- **NotificationContext 폴링**: visibility, ETag(304), 지수 백오프, cancelled 플래그 모두 구현
- **CSS 토큰 준수**: hex·OKLCH 직접 사용 없음, `var(--token)` 일관 적용
- **DB 레벨 assertion**: `is_current`, `final_state`, `embed_stale`, `review_status` 직접 확인
- **커넥션 풀 정리**: 모든 `pool.connect()` 사용처에 `finally { client.release() }` 존재

---

## 다음 세션 수정 순서

```
[HIGH — 즉시]
 H1. subtasks.ts:79-90    — POST sub-task 부모 소유권 검증 (user role)
 H2. admin.ts:386-431     — role 허용목록 ['user','manager','admin'] + 감사 로그
 H3. notifications.ts:33  — interval 파라미터화 ($2::int * interval '1 day')
 H4. autoTag.ts:55-80     — INSERT+DELETE 트랜잭션 래핑
 H5. payload.ts:279-299   — 거절 시 is_current 상태 보정
 H6. VocDrawer.tsx:86-103 — ignore flag 또는 AbortController
 H7. NotificationContext  — GET 먼저 → 성공 후 PATCH + 에러 UI 추가

[MEDIUM — Phase 8 병행]
 M3. subtasks.ts:208-238  — /api/admin/masters/refresh 경로 이동
 M5. vocs.ts:152,182,310  — SELECT * → 컬럼 열거 (embedding 제외)
 M6. vocs.ts:83-85        — GIN index + to_tsvector 전환
 M7. 전체 routes           — statement_timeout 설정
 M8. autoTag.ts:15-16     — in-flight 중복 제거 (Promise 재사용)
 M9. PayloadSection.tsx   — effect deps → voc.id만 사용
M10. NotificationPanel    — role="dialog" + Esc 핸들러
M11. 신규 테스트           — /masters/refresh HTTP, 드랍 상태, notifications afterEach
```
