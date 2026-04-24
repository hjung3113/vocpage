# Phase 7 진입 전 적대적 요구사항 리뷰

> 작성일: 2026-04-24  
> 방식: oh-my-claudecode:critic (공격) vs oh-my-claudecode:analyst (방어) 병렬 서브에이전트 토론  
> 대상: requirements.md / feature-voc.md / openapi.yaml / migrations 003~006 / external-masters.md  
> 결론: **조건부 진입 가능 — 아래 즉시 처리 항목 해소 후 Phase 7 착수**

---

## 1. 즉시 처리 (Phase 7 착수 전 필수)

### 1-1. migration 003 컬럼 누락 여부 확인 🔴

Critic이 `backend/migrations/003_vocs.sql`을 직접 읽고 다음 컬럼들이 없다고 주장. **사실이면 가장 치명적**.

| 컬럼         | 영향                                                      |
| ------------ | --------------------------------------------------------- |
| `parent_id`  | Sub-task 기능 전체 불가                                   |
| `issue_code` | VOC 식별자, UI 전반, issue_code 원자성 테스트 불가        |
| `due_date`   | SLA(SC-1/SC-3), 대시보드 aging/processing-speed 전체 불가 |

**확인 방법**: `grep -n "parent_id\|issue_code\|due_date" backend/migrations/003_vocs.sql`  
→ 없으면 migration 패치 + 관련 엔드포인트/테스트 추가 필요.

### 1-2. `vocs.status` enum 3방향 불일치 🔴

| 위치                                                     | 값         |
| -------------------------------------------------------- | ---------- |
| `backend/migrations/003_vocs.sql:36`                     | `'접수'`   |
| `shared/openapi.yaml:1567`                               | `'접수'`   |
| `requirements.md §4`, `feature-voc.md §8.2`, 테스트 예시 | `'접수됨'` |

**결정**: DB CHECK 제약이 진실 원천 → `'접수'`로 통일하거나, `'접수됨'`으로 migration + openapi.yaml 수정.  
한쪽으로 확정 후 3곳 동기화 필수.

### 1-3. `author_id` vs `reporter_id` 컬럼명 불일치 🔴

| 위치                                   | 이름                        |
| -------------------------------------- | --------------------------- |
| `requirements.md §4`, `feature-voc.md` | `author_id`                 |
| `backend/migrations/003_vocs.sql:39`   | `reporter_id uuid NOT NULL` |
| `shared/openapi.yaml` Voc 스키마       | `author_id: uuid, nullable` |

추가 불일치: OpenAPI는 `nullable`, migration은 `NOT NULL`.  
**결정**: `author_id`로 통일(spec 기준) → migration 003 수정 + openapi nullable:false.

### 1-4. openapi.yaml 누락 엔드포인트 🔴

"60+ 엔드포인트 전부 커버"라는 전제가 부분 허위. 다음이 없음:

| 누락 엔드포인트                                      | 기능                                |
| ---------------------------------------------------- | ----------------------------------- |
| `POST /api/vocs/:id/payload`                         | structured_payload 정식 제출        |
| `GET /api/vocs/:id/payload-history`                  | "이전 이력" 버튼 소스               |
| `POST /api/reviews/:vocId/decision` (또는 동등 경로) | Result Review approve/reject        |
| Timeline API                                         | Manager/Admin 전용 복합 타임라인    |
| `/api/admin/notices/*`                               | 공지사항 Admin CRUD                 |
| `/api/admin/faqs/*`                                  | FAQ Admin CRUD                      |
| 파일 다운로드 `GET /api/files/:id`                   | feature-voc §8.12 언급, openapi 0건 |

→ codegen 재실행 필요.

### 1-5. 기타 schema 3-way drift 🟠

| 항목                                       | drift                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `voc_types.color` default                  | migration: `'gray'`, spec: `#e5534b` 등 hex — 통일 필요             |
| `voc_internal_notes.id`                    | migration: `bigserial`, openapi: `uuid` — 하나로 통일               |
| `notifications.type`                       | migration: enum, openapi: 그냥 `string` — enum 명시 필요            |
| `comments.deleted_at`                      | openapi에 있으나 feature-voc §8.13은 Hard Delete — openapi에서 제거 |
| `mock AuthUser.ad_username`                | openapi required에 있으나 §14.5 fixture에 값 없음                   |
| `dashboard.md:639` `heatmap_default_xaxis` | requirements.md/migration은 `heatmap_default_x_axis` (밑줄 차이)    |
| `voc_payload_history` `is_current=true`    | unique partial index 없음 — 동시 제출 경합 시 복수 row 위험         |

---

## 2. Sprint 1 착수 시 결정 (BLOCKING 아님, 단 이른 결정이 이득)

### 2-1. 세션 스토어 🟠

현재 `express-session` 기본 MemoryStore. Node 재기동 시 전 세션 증발.

**권장**: `connect-pg-simple` (이미 PG 있음, 별도 인프라 불필요) → `requirements.md §14.1` 환경변수 표에 추가.

### 2-2. CORS 정책 🟠

**권장**: Vite proxy로 통일 (dev: proxy, prod: nginx same-origin) → BE `cors()` 미들웨어 불필요.  
첫 FE fetch 작성 전 확정.

### 2-3. testcontainers 도입 여부 🟠

`pg-mem`은 CRUD·권한 단위 테스트 OK. 그러나 다음은 실 PG 필요:

- `sequence_no` 트리거 재현
- `issue_code` 동시 생성 원자성 테스트 (requirements §13.2)
- pgvector 관련 DDL

**결정**: Integration 레이어를 `testcontainers-node + 실 postgres` 로 분리하거나, §13.2 원자성 테스트를 `it.skip`으로 명시적 마킹.

---

## 3. 구현 중 해결 가능 (BLOCKING 아님)

| 항목                                | 처리 시점                                                            |
| ----------------------------------- | -------------------------------------------------------------------- |
| 6-8 상태 관리 목록화                | 첫 FE PR에 동반 (React Context, filter state, drawer, unread-count)  |
| 6-9 Prototype → 컴포넌트 매핑       | 1차 페이지 착수 직전에만 분해 (전수 분해는 YAGNI)                    |
| React Query staleTime 나머지 페이지 | 각 페이지 구현 시 — VOC 목록 staleTime=30s, 상세 0+invalidate 권장   |
| ETag 생성 규칙 (§8.14)              | 알림 폴링 구현 시 — `sha1(max(created_at) + count)` 권장             |
| 댓글 이미지 업로드 순서             | Toast UI Editor 연동 시 — draft 경로 업로드 → 댓글 저장 후 이동 권장 |
| 알림 디바운스 5분 구현 위치         | 알림 서비스 구현 시 — DB 조건부 INSERT 또는 앱 레벨 체크             |
| 세션 쿠키 TTL                       | OIDC 연동 시 결정                                                    |
| 대시보드 "전주 대비" 윈도우         | dashboard API 구현 시 — "직전 7일" 권장                              |
| 마지막 Admin 강등 경쟁 상태         | users API 구현 시 — `SELECT ... FOR UPDATE` + count                  |

---

## 4. 논쟁에서 Analyst가 방어에 성공한 항목 (blocking 아님 확정)

| 비판                               | 판정            | 근거                                                                        |
| ---------------------------------- | --------------- | --------------------------------------------------------------------------- |
| 설비 마스터 MSSQL TBD blocking     | ❌ NOT blocking | `equipment-stub.json` 전략으로 E2E까지 구현 가능. 로더 함수 1개만 나중 교체 |
| 6-8/6-9 미완료 blocking            | ❌ NOT blocking | 첫 PR 동반/1차 페이지 분해로 충분                                           |
| issue_code prefix 불명확           | ❌ 이미 명확    | feature-voc.md §8.1에 `{systems.slug 대문자}-{yyyy}-{순번4자리}` 확정       |
| "31개 테스트 = 실제 커버리지 없음" | ⚠️ 부분 사실    | CRUD·권한은 OK. 원자성·트리거는 testcontainers 결정 필요                    |

---

## 5. 미명세 세부사항 (구현 중 발견 시 즉시 spec 업데이트)

다음은 요구사항 결정은 됐으나 구현 세부가 빠진 항목들. 발견 즉시 해당 spec 섹션에 덧붙여 drift 예방.

1. **`tag_rules` 매칭 로직** — "case-insensitive, HTML 태그 제거 후 plain text substring, 단어 경계 미적용" 수준이라도 명시. 정규식 지원 여부 yes/no.
2. **Urgent 알림 배지 카운터** — 벨 옆 별도 카운터(Urgent 전용) vs 1건이라도 있으면 단일 배지.
3. **Sub-task 목록 조회 응답 구조** — `GET /api/vocs`의 계층형 응답이 평면 배열인지, 부모에 `subtasks[]` 중첩인지 openapi.yaml에 미반영.
4. **`완료 → 드랍` 전이 허용 여부** — feature-voc §8.2 매트릭스에 없음. "드랍 이유 정정" 불가 시 Admin이 Soft Delete로 우회하게 됨.
5. **Mock 유저 DB seed 전략** — §14.5 "실제 DB row 없음"이나 VOC 생성 시 `author_id FK` 참조 필요 → VOC 테스트 전 users 테이블에 mock user seed 필수 (테스트 헬퍼에 반영 필요).
6. **Soft Delete된 VOC의 자식 엔티티 접근** — `vocs.deleted_at` 있을 때 댓글/첨부 응답 차단 범위 미명세.
7. **`vocs.status` 쿼리 파라미터 값** — `GET /api/vocs?status=접수됨` vs `?status=접수` 결정 후 openapi.yaml parameter schema 반영.

---

## 6. 성공 기준 검토

| 기준                           | 현황                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| SC-1 SLA 준수율 70%            | ✅ 측정 가능 — `GET /api/dashboard/processing-speed` 소스 명확 |
| SC-2 Jira 완전 전환 (신규 0건) | ⚠️ 측정 방법이 "수동 Jira 보드 확인" — 아카이브 의례화 필요    |
| SC-3 Due Date 내 처리율        | ✅ 측정 가능 — SC-1과 동일 소스                                |

SC-2는 측정 가능한 행위로 구체화 권장: "오픈 후 월 1회 Jira 보드 스크린샷 아카이브 → 3개월 연속 신규 0건 확인".

---

## 관련 파일

| 파일                                      | 검토 항목                             |
| ----------------------------------------- | ------------------------------------- |
| `backend/migrations/003_vocs.sql`         | 1-1, 1-2, 1-3 — 컬럼 누락·enum·컬럼명 |
| `backend/migrations/006_settings.sql`     | 1-5 — heatmap_default_x_axis          |
| `shared/openapi.yaml`                     | 1-2, 1-3, 1-4, 1-5 전체               |
| `docs/specs/requires/requirements.md`     | 1-2, 1-3, §14.1 세션 스토어 추가      |
| `docs/specs/requires/feature-voc.md`      | 1-2, 5-4(완료→드랍 전이)              |
| `docs/specs/requires/external-masters.md` | 4(설비 마스터 — blocking 아님 확정)   |
| `docs/specs/requires/dashboard.md`        | 1-5(heatmap 컬럼명)                   |
