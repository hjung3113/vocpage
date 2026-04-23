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

### 1.4 권장 (잠정)

**B (4단계)** 권장. 근거:
- Jira 운영 경험상 "검토중"은 실질적으로 빈 상태로 머물거나 배정 직후 바로 처리중으로 넘어가 통계가 노이즈화됨.
- SLA(§12 SC-1) 계산은 Priority 변경 시점 기준이라 중간 단계 수가 지표에 영향 없음.
- AI 자동 분류(v2)가 도입되면 `review_status=unverified`가 "조사 중" 뉘앙스를 대체할 수 있음.

**결정 시 파급**:
- `vocs.status` enum 축소
- feature-voc.md §8.2 매트릭스 전면 재작성
- 대시보드 `분포 탭` 상태별 위젯 bucket 재조정

---

## 2. Q5 — is_golden_case 플래그

### 2.1 논점

"이 VOC는 해결 사례로서 특히 모범적이다"라는 별도 플래그를 둘지. 용도: (1) FAQ·지식베이스 소스로 우대, (2) v2 RAG에서 retrieval 가중치 상향, (3) 담당자 교육 자료.

### 2.2 옵션

**A. `vocs.is_golden_case boolean default false`** 컬럼 추가 (Manager/Admin 수동 토글)
**B. 플래그 없이 태그(`general:golden`)로 대체**
**C. 도입 유보** — v2 RAG 실제 운영 후 필요성 판단

### 2.3 트레이드오프

- A: 필드가 1급 시민이 되어 대시보드/임베딩 가중치 쿼리 단순. 오남용(아무거나 golden 체크) 위험.
- B: 스키마 변경 없음. 태그는 자유 생성이라 권한 거버넌스 약함.
- C: MVP 범위 보호. v2 도입 시점에 마이그레이션 1회 비용 감수.

### 2.4 권장 (잠정)

**C 유보 + C의 대체 조치로 "embed_stale처럼 컬럼 자리만 예약"**. 정책·UI는 v2에서 확정. 스키마 예약만 커밋해두면 나중에 backfill 비용이 줄어든다.

```sql
-- MVP: 컬럼 생성만. UI/API는 v2.
ALTER TABLE vocs ADD COLUMN is_golden_case boolean DEFAULT false;
```

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

### 3.4 권장 (잠정)

**A**. 근거:
- 실제로 내부 메모가 필요한 빈도는 높음(특히 재현 불가/정책 거부 드랍 케이스).
- 단일 테이블 + 권한 필터 방식은 이미 `vocs` soft-delete 조회에서 동일 패턴으로 관리 중이라 운영 부담 추가 없음.
- API에서 `GET /api/vocs/:id/comments`는 role에 따라 필터링. 테스트 케이스는 §13.2에 추가.

---

## 4. Q8·Q9 — 예약 컬럼

### 4.1 후보 컬럼

| 컬럼 | 용도 (v2+) | MVP 동작 |
|---|---|---|
| `vocs.source` enum('manual','chatbot','import') | 입력 경로 추적. 챗봇/마이그레이션 유입 분리. | 전부 'manual' 고정 |
| `vocs.chatbot_session_id text` | 챗봇 유입 시 원 대화 세션 참조 | NULL 유지 |
| `vocs.linked_code_refs jsonb` | 관련 PR·커밋·이슈 링크 배열 | NULL 유지 |

### 4.2 권장

세 컬럼 모두 **MVP 스키마에 예약**. 이유:
- Jira 마이그레이션(§7 확장성)이 오픈 전 일괄 이전이므로 `source='import'` 값이 실제로 필요.
- 나머지 둘은 v2 기능이 들어올 때 backfill 하지 않고 즉시 쓸 수 있게 자리만 확보.

```sql
ALTER TABLE vocs
  ADD COLUMN source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','chatbot','import')),
  ADD COLUMN chatbot_session_id text NULL,
  ADD COLUMN linked_code_refs jsonb NULL;
```

---

## 5. Q10 — 유사도 임계치 보관

### 5.1 논점

v2 RAG에서 "유사 VOC 자동 연결" 기능이 도입될 때 threshold(예: 0.82)를 어디에 두나.

### 5.2 옵션

**A. 환경변수** `SIMILARITY_THRESHOLD=0.82`
**B. `system_settings` 테이블** (키-값, Admin UI에서 조정)
**C. `tag_rules`에 이어붙여 규칙별 임계치**

### 5.3 권장

**B (system_settings 테이블 자리 예약)**. 근거:
- 환경변수는 재배포 필요. 운영 중 튜닝 빈도 높은 값이라 DB가 적합.
- 다른 운영 상수(임베딩 모델 버전, 알림 폴링 주기 등)도 같은 테이블에 수용 가능.

```sql
CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);
-- 초기 row는 v2 기능 진입 시 insert. MVP는 테이블만 생성.
```

---

## 6. 갭 #6 재정리 — tag_rules vs 엔티티 해석

### 6.1 현 상태

- v2에서 `tags.kind`는 `general`/`menu` 2종. 설비·모델·메이커·공정은 `structured_payload`로 이동.
- 그런데 `tag_rules`(자동 태깅)는 여전히 v1 잔재로 "본문 키워드 → 태그" 규칙 기반.

### 6.2 문제

- 엔티티 해석(v2 AI)이 `structured_payload.equipment`를 채운다. 자동 태깅은 `tags.general`을 채운다.
- 두 경로가 서로 건드리지 않으면 괜찮지만, "고장/긴급/재현불가" 같은 의미 태그는 `tag_rules`에 남기고, "설비명/모델명 등 엔티티성 단어"는 `structured_payload`로 라우팅해야 한다.

### 6.3 권장 규칙

- **`tag_rules` 역할 한정**: 의미·감정 분류에만 사용(예: "urgent", "duplicate-candidate"). 엔티티 탐지는 금지.
- **엔티티 해석 파이프라인 출력처 한정**: `structured_payload` 4개 배열 필드만. 태그 쓰기 금지.
- 마이그레이션 시점: v2 엔티티 해석 도입 시 기존 `tag_rules` 중 설비/모델/메이커 규칙은 삭제 또는 deprecation.

### 6.4 requirements.md 반영 위치

§4 `tag_rules` 불릿에 "의미·감정 분류 전용, 엔티티 탐지는 `structured_payload` 파이프라인으로 위임" 추가. §16에도 교차 참조.

---

## 7. 외부 검증 쿼리 명세

### 7.1 대상 필드

`structured_payload`의 `related_programs`, `related_db_tables`, `related_jobs`, `related_sps` + 칩 입력 필드 `equipment`, `maker`, `model`, `process`.

### 7.2 질문

각 필드가 **누구에게** **어떻게** 물어봐서 존재 여부를 판정하는가?

### 7.3 옵션

**A. 외부 시스템 REST API 호출** — 시스템별 API spec 수집 필요
**B. 외부 DB 직접 read-only 커넥션** — DBA 승인 + 네트워크 구성
**C. 내부 캐시 테이블 `master_cache` + 야간 sync** — 쿼리 지연 줄이지만 stale 위험

### 7.4 권장

**A+C 하이브리드**:
- 마스터 시스템이 REST API를 제공하면 우선 A로 on-demand 검증.
- 응답 p95 >500ms 또는 장애 잦은 경우 C(야간 sync 캐시)로 전환.
- 장애 fallback은 v2 §4.5 정책 유지(`review_status='unverified'`).

### 7.5 다음 액션

이 리뷰 범위 밖 — **별도 "외부 마스터 연동 명세" 문서**가 필요. 각 마스터의 owner·API endpoint·필드 매핑을 수집해야 하므로 사용자가 관련 담당자 확인 후 자료 제공 필요.

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
- 현재 §14.1 9종. 추가 필요 후보: `AUTH_MODE`, `SIMILARITY_THRESHOLD`(v2), `EMBEDDING_MODEL_VERSION`(v2), `LOG_LEVEL`.
- 권장: MVP 기준으로 `AUTH_MODE`, `LOG_LEVEL`만 먼저 추가. v2 값들은 v2 진입 시.

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

- [ ] Q3: status 4단계 축소 확정 → §4 enum, §8.2 매트릭스, 대시보드 bucket
- [ ] Q5: `is_golden_case` 컬럼만 예약
- [ ] Q7: `comments.visibility` 채택 + 권한 필터 테스트 추가
- [ ] Q8·Q9: `source`/`chatbot_session_id`/`linked_code_refs` 컬럼 예약
- [ ] Q10: `system_settings` 테이블 생성
- [ ] 갭 #6: `tag_rules` 역할 한정 문장 §4·§16 추가
- [ ] 외부 검증 쿼리: 별도 문서 착수 (담당자 자료 수집 선행)
- [ ] Phase 4 잔여 7건: AUTH_MODE·용어 통일·API endpoint 표·에러 코드 목록·파일명 규칙·KPI 유지 결정

---

## 10. 범위 밖

- 실구현 (Phase 7)
- 디자인 시스템 변경 (design.md는 v2에서 수정 안 함)
- 대시보드 위젯 사양 변경 (dashboard.md 고정)
