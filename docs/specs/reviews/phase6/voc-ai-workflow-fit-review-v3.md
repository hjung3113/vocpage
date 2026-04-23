# VOC AI 워크플로우 적합성 리뷰 v3 — Q3 이후 미결 항목

> 작성: 2026-04-24
> 선행: `voc-ai-workflow-fit-review-v2.md` (Q1·Q2 + 리뷰 플로우 확정)
> 목적: v2에서 미룬 Q3~Q10 및 잔여 갭·외부 검증 쿼리·Phase 4 5-Expert 미결 항목을 한 트랙에서 결론

---

## 0. 이 리뷰의 범위

확정할 항목 (우선순위 순):

1. **Q3** — VOC `status` 5단계 유지 vs 4단계 단순화 → §8.2 매트릭스 갱신
2. **Q5** — `is_golden_case` 플래그 도입 여부
3. **Q7** — `comments.visibility` (internal/public) 채택 여부
4. **Q8·Q9** — 예약 컬럼 `source`, `chatbot_session_id`, `linked_code_refs`
5. **Q10** — 유사도 임계치 보관 방식
6. **갭 #6 재정리** — `tag_rules` vs 엔티티 해석 역할 경계 (2-카테고리 태그 전제)
7. **외부 검증 쿼리 명세** — `related_programs/db_tables/jobs/sps`가 실제로 어디에 물어보는가
8. **Phase 4 5-Expert 잔여** — AD 인증 방식, §2.3 Sub-task 표현, 대시보드 API endpoint 목록, 환경변수, 에러 응답 포맷, 파일명 저장 방식, KPI 목표값

각 항목은 **논점 → 옵션 → 트레이드오프 → 권장(잠정)** 순. 사용자와 합의 후 `requirements.md`·`feature-voc.md`에 반영.

---

## 1. Q3 — status 5단계 vs 4단계

### 1.1 현 상태

- v1 결정: 기존 `보류`를 `드랍`으로 이름만 바꾸고 5단계 유지 (`접수됨/검토중/처리중/완료/드랍`).
- 미결: 검토중을 없애고 4단계(`접수/진행중/완료/드랍`)로 축소할지.

### 1.2 옵션

**A. 5단계 유지** (현재 스펙)
- `접수됨 → 검토중 → 처리중 → 완료 / 드랍`
- `검토중` = "담당자 배정되고 조사 시작했지만 아직 실제 조치 전" 단계를 분리

**B. 4단계 축소**
- `접수됨 → 처리중 → 완료 / 드랍`
- 검토중/처리중을 "진행중" 하나로 합침. 배정=진행중 진입.

### 1.3 트레이드오프

| 축 | A (5단계) | B (4단계) |
|---|---|---|
| 운영 시야 | 조사 vs 조치를 구분해 병목 파악 가능 | 단순하지만 "누가 조사만 하고 있는지" 식별 불가 |
| 대시보드 KPI | 단계별 평균 체류시간 4개 지점 생김 | 3개 지점, 에이징 계산 단순 |
| 사용자 학습비용 | 상태 용어 2개 구분 필요 | 저 |
| 향후 AI 분류 | 검토중에 "자동 1차 분석 완료" 상태 투영 가능 | "진행중" 플래그 재활용 필요 |

### 1.4 결정 (2026-04-24 확정)

**A (5단계 유지)** — 초기 권장이었던 B(4단계 축소)는 번복됨.

근거(최종):
- `검토중`(문제 파악) vs `처리중`(실제 해결) 의미 구분 가치 존속. 분석 업무 특성상 "조사만 하고 실제 착수 전" 단계가 SLA·에이징 분석에서 구분되어야 병목이 보임.
- Jira 마이그레이션 유입은 전부 `접수됨`/`검토중`으로만 떨어져 enum 매핑에 영향 없음.
- `review_status`는 별개 축(정형 제출 리뷰 전용)이므로 `검토중` 흡수 불가.

**파급**: 없음 — §4 enum, §8.2 매트릭스, 대시보드 bucket 모두 **기존 스펙 그대로 유지**. 축소 시나리오(B)는 폐기.

---

## 2. Q5 — is_golden_case 플래그

### 2.1 논점

"이 VOC는 해결 사례로서 특히 모범적이다"라는 별도 플래그를 둘지. 용도: (1) FAQ·지식베이스 소스로 우대, (2) NextGen RAG에서 retrieval 가중치 상향, (3) 담당자 교육 자료.

### 2.2 옵션

**A. `vocs.is_golden_case boolean default false`** 컬럼 추가 (Manager/Admin 수동 토글)
**B. 플래그 없이 태그(`general:golden`)로 대체**
**C. 도입 유보** — NextGen RAG 실제 운영 후 필요성 판단

### 2.3 트레이드오프

- A: 필드가 1급 시민이 되어 대시보드/임베딩 가중치 쿼리 단순. 오남용(아무거나 golden 체크) 위험.
- B: 스키마 변경 없음. 태그는 자유 생성이라 권한 거버넌스 약함.
- C: MVP 범위 보호. NextGen 도입 시점에 마이그레이션 1회 비용 감수.

### 2.4 결정 (2026-04-24 확정)

**C — 도입 유보(완전 제외)**. 초기 권장의 "컬럼 자리만 예약"도 **철회**. 근거:
- MVP에 골든 라벨링 실제 사용 계획이 없음. 사용 계획 없는 상태의 컬럼 예약은 backfill 불필요(default false로 충분) → 예약 이득 실종.
- `embed_stale`는 "approve 시점 트리거가 이미 MVP 로직에 존재" 케이스라 자리 예약이 정당화되지만, `is_golden_case`는 트리거 자체가 없어 예약 근거가 다름.
- NextGen 진입 시 태그 방식(B) vs 컬럼(A) 재판단. 그 시점에 마이그레이션 1회로 충분.

**파급**: 스키마 변경 없음. requirements.md §16.4 "미결" 목록에서 제거.

---

## 3. Q7 — comments.visibility

### 3.1 논점

현재 `comments`는 모두 VOC 관계자에게 공개. 담당자끼리만 보는 내부 메모(트리아지, 보류 사유, 재현 시도 로그)를 분리할지.

### 3.2 옵션

**A. `comments.visibility enum('internal','public') default 'public'`** + User는 internal 생성/조회 불가
**B. 별도 `voc_notes` 테이블** — 구조 분리
**C. 도입 유보** — MVP는 공개 댓글만

### 3.3 트레이드오프

- A: 단일 테이블 유지. 조회 쿼리에 `WHERE visibility='public' OR role IN (manager,admin)` 필터 필수 — 누락 시 정보 유출 리스크.
- B: 분리가 깔끔하지만 타임라인 통합 표시 시 join 필요.
- C: 관리자들이 결국 Slack/개인 노트로 흘러 컨텍스트 손실.

### 3.4 결정 (2026-04-24 확정)

**B — 별도 `voc_internal_notes` 테이블 + UI 분리**. 근거:
- 권한 경계가 **컬럼 필터가 아니라 테이블 접근 자체**라 쿼리 누락으로 인한 유출 사고 내성이 구조적으로 강함.
- 내부 메모가 공개 댓글로 새는 사고는 법적·평판 리스크가 크기 때문에 방어적 설계를 우선.
- Timeline 통합은 이미 events/comments/status_changes 다중 소스 union 구조라 테이블 하나 추가되어도 비용 차이 미미.
- Admin/Manager만 접근. User role은 엔드포인트 자체에 도달 불가.

#### 3.4.1 스키마

```sql
CREATE TABLE voc_internal_notes (
  id bigserial PRIMARY KEY,
  voc_id bigint NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  author_id bigint NOT NULL REFERENCES users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);
CREATE INDEX idx_voc_internal_notes_voc ON voc_internal_notes(voc_id) WHERE deleted_at IS NULL;
```

#### 3.4.2 API

- `GET /api/vocs/:id/notes` — Manager/Admin 전용. User 요청 시 404 (존재 자체를 숨김).
- `POST /api/vocs/:id/notes` — Manager/Admin.
- `PATCH /api/vocs/:id/notes/:noteId` — 작성자 또는 Admin.
- `DELETE /api/vocs/:id/notes/:noteId` — soft-delete. 작성자 또는 Admin.
- `GET /api/vocs/:id/comments`는 **공개 댓글만** 반환 (기존 유지).

#### 3.4.3 UI 분리

- VOC 상세 페이지 우측 패널(또는 탭)에 **"Internal Notes"** 영역을 공개 댓글과 별도 섹션으로 배치.
- 배경·테두리 토큰을 warning/accent 계열로 구분해 시각적으로 공개 댓글과 혼동 불가능하게 함.
- User role 로그인 시 이 섹션 자체가 DOM에 렌더링되지 않음.
- Timeline 뷰에서는 공개 댓글과 internal note를 **시간순 섞어 표시하되 배지/배경으로 명확히 구분** (Manager/Admin만).

#### 3.4.4 테스트

- `GET /api/vocs/:id/notes`를 User role이 호출하면 404.
- 공개 댓글 조회 응답에 internal note가 절대 포함되지 않음 (회귀 테스트).
- Timeline API 응답에서 User role은 internal note 이벤트를 받지 않음.

---

## 4. Q8·Q9 — 예약 컬럼

### 4.1 결정 (2026-04-24 확정)

**`source`만 MVP 도입**. `chatbot_session_id`·`linked_code_refs`는 **NextGen 계획 시점에 재결정** (YAGNI — 지금 예약해도 backfill 불필요 컬럼이라 실익 없음).

### 4.2 `source` 컬럼 사양

| 항목 | 값 |
|---|---|
| 타입 | `text NOT NULL DEFAULT 'manual'` + `CHECK (source IN ('manual','import'))` |
| MVP 허용 값 | `manual`, `import` 2종 |
| 값 추가 방식 | 운영 중 필요 시 **마이그레이션으로 CHECK 제약 재정의** (PG enum 타입 대신 text+CHECK 선택 — 값 추가/제거/이름변경 유연성) |
| NextGen 예정 값 | `chatbot` (NextGen 로드맵 확정 시 추가) |

### 4.3 `source` 값이 갖는 의미

| 값 | 의미 | 생성 주체 |
|---|---|---|
| `manual` | 사람이 웹 UI VOC 작성 폼으로 직접 입력 | User / Manager |
| `import` | 마이그레이션·일괄 이관 스크립트가 생성 | Jira 이관 스크립트 (MVP 오픈 전 1회성) |

### 4.4 활용처

1. **지표 분리**: "이번 달 신규 VOC"는 `source != 'import'` 필터 필수. 마이그레이션 건이 신규 유입으로 집계되는 왜곡 방지.
2. **SLA 정책**: `import` VOC는 SLA 타이머·알림 제외 (이미 과거 처리 완료).
3. **UI 배지**: VOC 리스트·상세에서 `source='import'`에 **"Jira Imported"** 배지 노출 (데이터 품질 표시 — 변환 과정에서 필드 유실 가능성 암시).
4. **감사 추적**: 사고 조사 시 출처 경로의 시작점.
5. **일괄 작업 타겟팅**: `WHERE source='import'`로 이관분만 한정해 자동 태깅·재분류 배치.

### 4.5 운영 규칙

- **마이그레이션 `created_at`**: Jira 원본 생성일 보존(이관 실행 시각으로 덮지 않음). 원본 맥락 유지 + 지표는 `source` 기준으로 분리되므로 왜곡 없음.
- **API 응답**: `GET /api/vocs/:id` 및 리스트 응답에 `source` 필드 기본 포함.
- **리스트 필터**: MVP는 `source` 필터 UI 미포함 (선택지가 `import` 단일이라 무의미). NextGen에서 `chatbot` 추가 시 드롭다운 도입.

### 4.6 SQL

```sql
ALTER TABLE vocs
  ADD COLUMN source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','import'));
```

---

## 5. Q10 — 유사도 임계치 보관

### 5.1 논점

NextGen RAG에서 "유사 VOC 자동 연결" 기능이 도입될 때 threshold(예: 0.82)를 어디에 두나.

### 5.2 옵션

**A. 환경변수** `SIMILARITY_THRESHOLD=0.82`
**B. `system_settings` 테이블** (키-값, Admin UI에서 조정)
**C. `tag_rules`에 이어붙여 규칙별 임계치**

### 5.3 결정 (2026-04-24 확정)

**MVP 스코프 제외. NextGen 도입 시점에 A→B 승격 여부 재논의.**

근거:
- MVP에 빈 `system_settings` 테이블을 선생성하는 것은 YAGNI 위반. NextGen 진입 시 마이그레이션 하나로 충분.
- "운영 상수 범용 KV 테이블"은 타입·검증·변경 이력·권한이 상수마다 달라 jsonb 쓰레기통이 되기 쉬움 — 도입 시 threshold 전용 칼럼 or 목적별 테이블로 설계.
- threshold는 초기엔 거의 안 바뀜(임베딩 모델 교체 같은 큰 이벤트에만 조정, 그 땐 어차피 재배포). "운영 중 자주 튜닝" 가정은 관찰 사실이 아님.
- **시작은 A(환경변수)**, Admin UI 튜닝 요구·빈도가 실측된 후 B 승격.
- C는 갭 #6의 "`tag_rules`=의미·감정 분류 전용" 원칙과 충돌하므로 탈락.

반영:
- requirements.md 변경 없음 (MVP 스키마에 `system_settings` 추가하지 않음).
- NextGen 섹션에 "유사도 임계치 보관 방식 재논의" 잔여 항목으로만 기록.

---

## 6. 갭 #6 재정리 — tag_rules vs 엔티티 해석

### 6.1 현 상태

- v2 리뷰 결정에 따라 `tags.kind`는 `general`/`menu` 2종. 설비·모델·메이커·공정은 `structured_payload`로 이동.
- 그런데 `tag_rules`(자동 태깅)는 여전히 v1 잔재로 "본문 키워드 → 태그" 규칙 기반.

### 6.2 문제

- 엔티티 해석(NextGen AI)이 `structured_payload.equipment`를 채운다. 자동 태깅은 `tags.general`을 채운다.
- 두 경로가 서로 건드리지 않으면 괜찮지만, "고장/긴급/재현불가" 같은 의미 태그는 `tag_rules`에 남기고, "설비명/모델명 등 엔티티성 단어"는 `structured_payload`로 라우팅해야 한다.

### 6.3 결정 (2026-04-24 확정)

**MVP에서 자동 태깅 엔진 실제 동작. 용도: 대시보드 현황 파악(메뉴별 빈발 문제 패턴) 입력원.**

- **`tag_rules` 역할 한정**: `kind='general'` 태그 자동 부착 전용. 엔티티성 단어(설비/모델/메이커/공정)는 `structured_payload` 파이프라인으로 위임. `menu` 태그는 메뉴 FK 기반이라 규칙 대상 아님.
- **실행 시점**: VOC 접수 + 제목/본문 편집 저장 시. status 변경만으로는 재실행 안 함.
- **규칙 충돌**: 같은 본문 복수 매칭 → 전부 부착(태그 다대다, 우선순위 없음).
- **멱등성**: `voc_tags.source text CHECK (source IN ('manual','rule'))` 컬럼 추가. 재실행은 `source='rule'` 행만 삭제 후 재부착. 수동 태깅(`manual`) 보존. (주의: `vocs.source`(Q8, manual/import)와 **이름은 같지만 축이 다름** — `voc_tags.source`는 태깅 주체 구분.)
- v3 §6.3 초안의 "엔티티 해석 파이프라인 태그 쓰기 금지"는 §16.1에 이미 명시됐으므로 중복 기재 안 함(§16.1 불릿에 §4 교차 참조만 추가).
- "설비/모델/메이커 규칙 삭제" 마이그레이션 항목은 **스펙 본문 제외**(현 스펙·스키마에 해당 규칙이 이미 없음). 운영 체크리스트로만 기록.

### 6.4 requirements.md 반영 위치

- §4 `tags`&`voc_tags` 불릿: `voc_tags.source` 컬럼 추가.
- §4 `tag_rules` 불릿: 역할 한정 + 실행 시점/충돌/멱등성 서브불릿 추가.
- §16.1: "자동 태깅 규칙은 §4 참조" 한 줄.

---

## 7. 외부 검증 — 7A 추상 계약 (2026-04-24 확정)

### 7.1 대상 필드

`structured_payload`의 `related_programs`, `related_db_tables`, `related_jobs`, `related_sps` + 칩 입력 필드 `equipment`, `maker`, `model`, `process`.

### 7.2 모델 전환

기존 초안의 "저장 시 외부 API 호출(A+C 하이브리드)" 모델은 **폐기**. 저장 시점 외부 호출 0건을 전제로 **편집 세션 중 BE 메모리 기반 검증** 모델로 전환.

- 자유 텍스트 태깅이 아니라 **트리아지 단계(Manager)에서 드롭다운 선택** 전제.
- 편집 세션 동안 FE는 BE 메모리 캐시에서 자동완성·존재 검증.
- 저장 시 BE는 자체 메모리(단일 진실 원천)로 재검증하여 `unverified_fields`를 재계산 — FE body 플래그 신뢰 금지.

### 7.3 합의 10건

| # | 항목 | 결정 |
|---|---|---|
| 1 | **모델** | 편집 세션 BE 메모리 검증. 저장 시점 외부 호출 0. 입력은 드롭다운 선택. |
| 2 | **캐시 범위** | 프로세스 전역. BE 부팅 시 마스터 3종(설비·DB·프로그램)을 통째 1회 로드. 규모 작아 전량 적재 가능. |
| 3 | **Refresh 정책** | TTL 없음, 수동 트리거. 권한 **Manager 이상**. 관리자 페이지 + 편집 화면 🔄 아이콘 양쪽 배치. **쿨다운 5분** (동일 사용자 기준, 원천 시스템 보호). |
| 4 | **부팅 시 로드 실패** | **C (디스크 스냅샷 fallback)** 채택 + Manager/Admin UI에 **"스냅샷 모드" 배지** 필수. 마스터 변동 빈도 낮아 stale 리스크 수용 가능. 보조 조건(메타 로그·한도·비동기 쓰기)은 채택 안 함(운영 필요 시 추가). |
| 5 | **수동 Refresh 실패** | **A (atomic swap)**. 3종 전부 성공해야 교체, 실패 시 기존 메모리 유지. 부분 교체 금지(일관성 시점 틀어짐 방지). |
| 6 | **저장 시 BE 재검증** | **A (필수)**. FE body 플래그 신뢰 금지. BE 메모리가 단일 진실 원천. override 여부도 BE가 재판정 → `unverified_fields` 재계산. |
| 7 | **입력 모드** | **B (자유 입력 허용 + unverified 플래그)**. 마스터 등록 지연보다 VOC 처리 흐름 보호 우선. 자동완성 UX로 정상 케이스 대부분 커버. |
| 8 | **`review_status` 단위** | **C (row 플래그 + payload 상세)**. `vocs.review_status`는 row 단일값(Manager 큐 필터용). 어느 필드가 문제인지는 `structured_payload.unverified_fields text[]`로 병기. 리뷰 화면 배지 표시용. 컬럼 승격은 운영 중 실측 후. |
| 9 | **리뷰 외 용도 처리** | 대시보드 "필드별 unverified 분포" 위젯은 **MVP 미포함**. 문제 발생 시 재고. |
| 10 | **API 접촉 시점** | 부팅 1회 + 수동 Refresh 시. 사용자 편집/저장 경로에서는 절대 호출 안 함. |

### 7.4 requirements.md 반영 위치

- §4 `structured_payload`: `unverified_fields text[]` 배열 추가.
- §11: `POST /api/admin/masters/refresh`(전역) + `POST /api/vocs/:id/masters/refresh`(편집 화면) — 두 경로 모두 Manager 이상 + 쿨다운 5분.
- §16: 신규 절 **"외부 마스터 연동 정책"** — 7.3 합의 10건 요약.
- §16.3 기존 "외부 마스터 fallback"은 §16 신규 절로 흡수하되, "마스터 장애 → 추가 허용 + unverified" 문장은 7번 항목과 일치시킴.

### 7.5 7B — 필드별 마스터 매핑 (담당자 자료 수집 후 별도 문서)

본 리뷰 범위 밖. `related_programs/db_tables/jobs/sps/equipment/maker/model/process` 각 필드의 **원천 시스템 · owner · 엔드포인트 · 스키마**를 수집해 별도 "외부 마스터 연동 명세" 문서로 작성.

---

## 8. Phase 4 5-Expert 잔여 항목

### 8.1 AD 인증 방식 최종 확정
- OIDC / OAuth2 고정됨(§2.1). 남은 것: mock 전략(§6-6) vs 실 AD 연결 시점 분리만.
- 권장: **로컬·개발은 mock user 주입, 스테이징부터 실 AD**. 환경변수 `AUTH_MODE=mock|oidc`.

### 8.2 §2.3 Sub-task 표현 통일
- 현재: "Sub-task 단일 계층", "parent_id self-join 최대 1단계"
- 갭: 요약 뷰에서 부모·자식 표기 용어가 "Sub-task" / "하위 작업" / "child" 혼재.
- 권장: 문서 전체에서 **"Sub-task" 단일 용어** 강제. 한국어 문장에서도 "Sub-task"로 표기.

### 8.3 대시보드 API endpoint 목록
- `dashboard.md`에 위젯별 정의는 있으나 endpoint 전체 목록이 §11에 표로 없음.
- 권장: §11에 `GET /api/dashboard/{widget-slug}` 목록 표 추가 (11종).

### 8.4 환경변수 누락
- 현재 §14.1 9종. 추가 필요 후보: `AUTH_MODE`, `SIMILARITY_THRESHOLD`(NextGen), `EMBEDDING_MODEL_VERSION`(NextGen), `LOG_LEVEL`.
- 권장: MVP 기준으로 `AUTH_MODE`, `LOG_LEVEL`만 먼저 추가. NextGen 값들은 NextGen 진입 시.

### 8.5 에러 응답 포맷
- §6.1에 `{code,message,details}` 정의되어 있음. 갭 없음.
- 추가할 것: **표준 에러 코드 목록** (INVALID_TRANSITION / FORBIDDEN / NOT_FOUND / VALIDATION_FAILED / EXTERNAL_MASTER_UNAVAILABLE 등) → §6.1에 표로 추가.

### 8.6 파일명 저장 방식
- 현재 `attachments.filename` + `storage_path`. 갭: 저장 파일명 충돌 방지 규칙 미정.
- 권장: `storage_path = {voc_id}/{uuid}-{원본파일명}` 형식. 원본 파일명은 Content-Disposition용으로 `filename`에 보관.

### 8.7 KPI 목표값
- §12 SC-1 SLA 70% 외 나머지 KPI(평균 처리시간, 재오픈률 등)에 목표값 없음.
- 권장: **MVP 단계는 SC-1·SC-2·SC-3만 유지**, 나머지는 오픈 3개월 후 실측 기반으로 설정. 지금 숫자 박지 않는다.

---

## 9. 확정 체크리스트 (사용자 합의 후 반영)

- [x] Q3: status **5단계 유지** 확정 (B 번복). §4 line 73 "다음 세션에서 확정" 문구 제거 (2026-04-24 확정, §1.4)
- [x] Q5: `is_golden_case` **도입 유보(완전 제외)**. 컬럼 예약도 철회 (2026-04-24 확정, §2.4)
- [x] Q7: 별도 `voc_internal_notes` 테이블 + UI 섹션 분리 (2026-04-24 확정, §3.4)
- [x] Q8·Q9: `source`만 MVP 도입(text+CHECK, 값=manual/import). 나머지 2개는 NextGen 재결정 (2026-04-24 확정, §4)
- [x] Q10: MVP 스코프 제외. 환경변수(A)로 시작, NextGen 도입 시점에 B 승격 재논의 (2026-04-24 확정, §5.3)
- [x] 갭 #6: `tag_rules` 역할 한정 + `voc_tags.source` 컬럼 + 실행/충돌/멱등성 규칙 §4·§16 반영 (2026-04-24 확정, §6.3)
- [x] 외부 검증 §7 — **7A 추상 계약 10건 확정** (편집 세션 BE 메모리 모델, 부팅 시 스냅샷 fallback, atomic swap, BE 재검증, unverified_fields 등) (2026-04-24 확정, §7.3)
- [ ] **7B — 필드별 마스터 매핑** (자료 수집 대기, §7.5)
- [ ] Phase 4 잔여 7건: AUTH_MODE·용어 통일·API endpoint 표·에러 코드 목록·파일명 규칙·KPI 유지 결정

---

## 10. 범위 밖

- 실구현 (Phase 7)
- 디자인 시스템 변경 (design.md는 NextGen에서 수정 안 함)
- 대시보드 위젯 사양 변경 (dashboard.md 고정)
