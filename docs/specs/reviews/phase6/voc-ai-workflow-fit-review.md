# VOC AI 워크플로우 적합성 리뷰 (Phase 6)

> 작성: 2026-04-23
> 대상 워크플로우: VOC 등록 → 엔티티 해석 → LLM 정규화 → Vector Store / Code KG → RAG → 유사도 분기 → 내부노트 / 챗봇 답변 → 피드백 보강
> 범위: **현 스펙이 해당 워크플로우에 얼마나 부합하는가**. 기능 확장 제안이 아니라 **구조적 부적합·누락** 식별.
> 전제: 기본 VOC 관리 + pgvector `vocs.embedding` 컬럼은 이미 반영됨 (requirements.md §4).

---

## 갭 요약

| # | 갭 | 영향도 | MVP 반영 |
|---|---|---|---|
| 1 | 설비 마스터 테이블 부재 (equipment/sensor/line) | 🔴 치명 | 필수 |
| 2 | LLM 정규화 결과 저장 필드 없음 (`structured_payload jsonb`) | 🔴 치명 | 필수 |
| 3 | 증상/원인/해결 구분 없음 (`resolution`, `root_cause`) | 🟠 큼 | 권장 |
| 4 | 임베딩 대상(scope) 명문화 필요 | 🟡 중 | 한 줄 스펙 |
| 5 | 피드백 루프 메타필드 없음 (`is_golden_case`, `embed_stale`) | 🟡 중 | 최소 1개 |
| 6 | 자동 태깅(`tag_rules`) ↔ 엔티티 해석 역할 충돌 | 🟡 중 | 역할 분리 주석 |
| 7 | 코멘트 내부/외부 구분 없음 (`visibility enum`) | 🟠 큼 | 권장 |
| 8 | 챗봇 세션 ↔ VOC 연결 없음 (`source`, `chatbot_session_id`) | 🟢 작음 | 예약 컬럼 |
| 9 | Code Knowledge Graph 연결점 없음 (`linked_code_refs jsonb`) | 🟢 작음 | 예약 컬럼 |
| 10 | 유사도 분기 임계치 스펙 없음 | 🟢 작음 | 구현 단계 |

---

## 1. 설비 마스터 도메인 부재 🔴

**현 스펙**: `systems`, `menus`, `voc_types`, `tags` — 모두 **조직적 분류**.
**워크플로우 요구**: 엔티티 해석 레이어가 "사용자 키워드 → 설비 마스터 ID" 로 매핑. 마스터 캐시는 **설비 / 센서 / 라인** (물리 리소스).

**문제**: 태그로 대체하면 semantic 뭉개짐. 엔티티 해석 결과를 FK 로 안전하게 묶을 곳이 없음.

**제안**:
- `equipment`, `sensors`, `production_lines` 테이블 (id, code, name, parent_id, aliases text[], is_active)
- `voc_equipment_refs` (voc_id, equipment_id, confidence, source enum('manual','nlp','llm'))
- 마스터 동기화 경로는 기존 시스템 master sync 결과 반영 (워크플로우 다이어그램 최상단 "마스터 동기화" 흐름과 일치)

## 2. LLM 정규화 결과 저장 필드 없음 🔴

**현 스펙**: `vocs.body(HTML)` = 자유 텍스트 원본.
**워크플로우 요구**: "자유 텍스트 + 마스터 컨텍스트 → 표준 JSON" 의 **출력 영속화**.

**제안**:
- `vocs.structured_payload jsonb NULL` — LLM이 뽑은 `{equipment_id, symptom_type, severity, suspected_cause, ...}` 저장
- `vocs.raw_input text NULL` — 챗봇 멀티턴 원문 또는 폼 입력 원본 (감사용, `body` 와 별도)
- `vocs.normalization_model_version` — 재처리 판단용

## 3. 증상 / 원인 / 해결 구분 없음 🟠

**문제**: Vector Store 검색이 "유사 사례 + **해결 방법**" 인데, 해결책이 구조화 안 됨. `comments` 평면 → "어느 코멘트가 해결책" 메타 없음.

**제안**:
- `vocs.root_cause text NULL`, `vocs.resolution text NULL` — VOC 종결 시 관리자 입력
- 또는 `comments.kind enum('note','root_cause','resolution','user_reply')` 로 대체

## 4. 임베딩 대상 명문화 🟡

**현 스펙**: `vocs.embedding vector(1536)` 1개 컬럼 — 대상/갱신 시점 미정.

**제안 (스펙에 명시할 것)**:
- 임베딩 대상: `title + structured_payload.symptom_text` (정규화 후)
- 갱신 조건: 생성 시 1회, body/resolution 수정 시 stale 마킹 후 배치 재임베딩
- (옵션) 해결책 검색이 필요해지면 `vocs.resolution_embedding vector(1536)` 별도 컬럼 추가 — 현 단계는 미반영

## 5. 피드백 루프 메타필드 🟡

**워크플로우**: "처리 완료 후 피드백 → Vector Store 보강".
**현 스펙**: 피드백 기록 필드 없음.

**최소 제안**:
- `vocs.is_golden_case boolean default false` — 재사용 가치 있는 케이스 마킹
- `vocs.embed_stale boolean default false` — 재임베딩 대상 플래그

## 6. 자동 태깅 ↔ 엔티티 해석 역할 충돌 🟡

**문제**: `tag_rules` (키워드/regex → 태그) 와 엔티티 해석 (키워드 → 마스터 ID) 이 동일 입력을 두고 역할 겹침.

**결정 필요**:
- (A) 역할 분리: 태그=사용자 표시용 분류, 엔티티 해석=마스터 ID 링크 → `tag_rules` 유지
- (B) 통합: `tag_rules` 를 엔티티 해석으로 흡수 → 태그 테이블은 LLM/수동 결과물만

**권장**: (A). `tag_rules` 는 시각 분류, 엔티티 해석은 별도 파이프라인 — 스펙에 역할 경계 한 줄 추가.

## 7. 코멘트 내부/외부 구분 없음 🟠

**워크플로우 마지막**: 관리자 전용 **내부 노트(분석 결과 + 처리 추천)** 와 사용자 **챗봇 답변(스트리밍)** 분리.
**현 스펙**: `comments` 평면 — visibility 구분 없음.

**제안**: `comments.visibility enum('internal','public') default 'public'`. (스키마 단순 추가)

## 8. 챗봇 세션 ↔ VOC 연결 🟢

**갭**: 챗봇 멀티턴 → VOC 생성 경로 불명. 원본 세션과 VOC 의 연결 고리 없음.

**최소 제안 (예약 컬럼만)**:
- `vocs.source enum('form','chatbot') default 'form'`
- `vocs.chatbot_session_id uuid NULL` — 세션 저장소 테이블은 **MVP 범위 밖**, FK 제약 없이 예약만

## 9. Code KG 연결점 🟢

**갭**: VOC ↔ SP/과서/프론트 엔티티 참조 흔적 없음.

**제안 (예약)**: `vocs.linked_code_refs jsonb NULL` — Code KG 쿼리 결과 스냅샷. Code KG 자체는 외부 시스템 전제.

## 10. 유사도 분기 임계치 🟢

**갭**: 빠른 경로 / 깊은 경로 컷오프가 스펙에 없음 → 구현 단계에서 임의값 위험.

**제안**: 구현 시점 결정이지만 `requirements.md` 에 "유사도 ≥ X → fast path" 자리만 예약 (값은 TBD).

---

## 제안 스키마 변경 요약 (MVP 필수·권장)

```sql
-- 필수
CREATE TABLE equipment (
  id uuid PRIMARY KEY, code text UNIQUE NOT NULL, name text NOT NULL,
  parent_id uuid REFERENCES equipment(id), aliases text[],
  is_active boolean DEFAULT true, created_at timestamptz, updated_at timestamptz
);
-- sensors, production_lines 동일 패턴

CREATE TABLE voc_equipment_refs (
  voc_id uuid REFERENCES vocs(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES equipment(id),
  confidence real, source text CHECK (source IN ('manual','nlp','llm')),
  PRIMARY KEY (voc_id, equipment_id)
);

ALTER TABLE vocs
  ADD COLUMN structured_payload jsonb,
  ADD COLUMN raw_input text,
  ADD COLUMN normalization_model_version text,
  ADD COLUMN root_cause text,
  ADD COLUMN resolution text,
  ADD COLUMN is_golden_case boolean DEFAULT false,
  ADD COLUMN embed_stale boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'form' CHECK (source IN ('form','chatbot')),
  ADD COLUMN chatbot_session_id uuid,
  ADD COLUMN linked_code_refs jsonb;

ALTER TABLE comments
  ADD COLUMN visibility text DEFAULT 'public' CHECK (visibility IN ('internal','public'));
```

---

## 반영 위치

- [ ] `requirements.md` §4 데이터 스키마 — 위 필드·테이블 반영
- [ ] `requirements.md` 새 섹션 "AI 워크플로우 적합성" — 임베딩 범위 / 엔티티 해석 vs 태깅 역할 / 피드백 루프 한 단락씩
- [ ] `backend/CLAUDE.md` Database Schema — equipment/sensor/line 마스터 언급 추가
- [ ] Phase 6-7 DB 마이그레이션 태스크에 "마스터 테이블 + vocs 확장 필드 + voc_equipment_refs" 포함

## 결론

1·2·3·7번은 **스키마 수준 변경이라 지금(설계 단계) 결정 필수**. 나중이면 마이그레이션 비용. 4·5·6번은 스펙 문장 추가 수준. 8·9·10번은 예약·구현 단계로 미뤄도 OK.
