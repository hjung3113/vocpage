# VOC AI 워크플로우 적합성 리뷰 v2 — Q1·Q2 재설계

> 작성: 2026-04-24
> 선행: `voc-ai-workflow-fit-review.md` (Phase 6-1, 2026-04-23)
> 변경 범위: Q1(태그 구조)·Q2(structured_payload) 재리뷰 + 리뷰 플로우·임시저장·이력 신규

---

## 1. 개편 방향

**태그와 정형 데이터의 역할을 완전 분리한다.**

| 영역 | 역할 | 대상 |
|---|---|---|
| `tags` | 관리·조회용 분류 (사용자 필터/그룹핑) | `general`, `menu` 두 카테고리만 |
| `structured_payload` | 담당자 정형 입력 + AI 파이프라인 입력 | 설비/메이커/모델/공정 + 증상·원인·조치 |

v1 초안의 `tags.kind='equipment'` 카테고리로 엔티티 해석 결과를 누적한다는 방침은 **폐기**한다. 설비 관련 값은 전부 `structured_payload`로 이동.

---

## 2. 태그 구조 (Q1 재결정)

```sql
-- v1: enum('general','equipment','menu')  ❌
-- v2:
ALTER TYPE tag_kind AS ENUM ('general', 'menu');
```

- `general`: 자유 태그 (담당자 분류용 라벨)
- `menu`: 주메뉴(`vocs.menu_id`) 외 **영향받는 다른 메뉴**를 태깅. 주메뉴와 역할 분리.

설비/공정/메이커/모델 관련 정보는 더 이상 태그로 들어가지 않는다.

---

## 3. `structured_payload` 스키마 (Q2 재결정)

```json
{
  "equipment": ["설비A", "설비B"],
  "maker":     ["메이커X"],
  "model":     ["모델-123"],
  "process":   ["공정1"],
  "symptom":     "현상 (필수 텍스트)",
  "root_cause":  "원인 (필수 텍스트)",
  "resolution":  "조치내역 (필수 텍스트)",
  "related_menus":    [...],
  "related_programs": [...],
  "related_db_tables":[...],
  "related_jobs":     [...],
  "related_sps":      [...]
}
```

### 3.1 필드 타입
- `equipment`/`maker`/`model`/`process` 전부 **`text[]` (문자열 배열)**
- `source(manual|auto)` 정보는 **DB에 저장하지 않음** — 저장 시점 이후에는 모든 값이 담당자 확정 책임

### 3.2 저장 시 검증
- 4개 배열(`equipment`/`maker`/`model`/`process`) 중 **최소 1개 배열에 값이 있어야** 저장 가능
- 4개 전부 빈 배열이면 저장 차단
- `symptom`/`root_cause`/`resolution` 텍스트 3종은 정식 저장 시 필수 (임시저장은 면제)

---

## 4. 입력 UX 규칙

### 4.1 칩 입력 컴포넌트 (4개 필드 공통)
- 입력창 + 엔터/추가 버튼 → 아래에 칩 누적
- 칩 호버 시 X 노출, 클릭 시 삭제
- 다중 구분자: `,`, ` `(공백), `/` — 한 번에 여러 칩 생성. `-`, `_`는 값 내부 문자이므로 구분자 아님
- 유효성 검증 실패 값은 미추가 + 아래 빨간 경고:
  `"설비X, 모델Y는 존재하지 않아 추가되지 않았습니다"`

### 4.2 검증 시점
- 칩 추가 시점(엔터/추가 버튼) **즉시** 외부 마스터 쿼리로 존재 검증
- 저장 버튼 시점에는 "4개 중 최소 1개 + 텍스트 3종 비어있지 않음"만 최종 확인

### 4.3 자동 추가 규칙

| 담당자 입력 | auto로 함께 추가 |
|---|---|
| 설비 | 공정 + 메이커 + 모델 |
| 모델 | 공정 + 메이커 |
| 메이커 / 공정 | 없음 (선택지 폭발) |

- 1:N 매칭이면 후보 **전부** 추가 (담당자가 불필요한 것을 지우는 방식)
- auto 칩 UI: **점선 테두리 + `auto` 배지**
- 입력창 아래 빨간 힌트: `"자동 추가된 항목이 있으니 필요 없는 건 X로 지우세요"`
- 수동 재입력이 이미 존재하는 값이면 `"이미 추가됨"` 인라인, auto 칩은 그대로 유지(source 메타 없으므로 승격 개념 없음)

### 4.4 cascade (세션 메모리 기반)
- 설비 삭제 → 이전에 auto로 붙은 메이커/모델/공정 **남김** (담당자가 개별 판단)
- 메이커 또는 모델 삭제 → 그 하위의 **auto source 설비**는 함께 삭제 (연결관계 테이블 조회 결과 기반)
- ⚠️ `source`를 DB에 저장하지 않으므로 cascade는 **UI 세션 메모리에서만** 추적. 페이지 재진입·리로드 후엔 auto 구분 정보가 소실되어 cascade 불가 — 담당자 수동 삭제만 유효.
- **임시저장 후 재진입 시**에도 동일하게 auto 구분 정보 없이 수동 칩 모양으로 복원 (사용자 합의: 필요해지면 나중에 수정)

### 4.5 외부 마스터 장애 fallback
- 마스터 쿼리 실패 → 경고 + 추가 허용 → `review_status='unverified'`로 리뷰 게이트에서 재확인
- 별도의 unverified 세부 플래그는 두지 않음

---

## 5. Result Review 플로우 (신규)

### 5.1 상태 머신

```
 (작성중) ──임시저장──▶ (draft 있음, review_status=null)
                             │
                             └──제출──▶ unverified ──┬──approve──▶ approved
                                                     │
                                                     └──reject───▶ rejected
                                                                     │
                                                                     └─수정/재제출─▶ unverified

 approved ──"삭제 신청"──▶ pending_deletion ─┬──approve──▶ (payload clear, 재작성 가능)
                                              │
                                              └──reject───▶ approved (원복)
```

### 5.2 상태별 "수정" 버튼 동작

| 현재 상태 | 수정 버튼 동작 |
|---|---|
| unverified | 기존 payload를 draft로 복사 → 편집 모달 열림 → 재제출 시 본 컬럼 덮어쓰기 + history 새 row |
| rejected | 동일 (draft 복사 → 편집 → 재제출) |
| approved | 수정 버튼 바로 동작 안 함. **"승인 결과 삭제 신청"** 먼저 → 리뷰(self 가능) → approve 시 본 컬럼 clear → 그 후 "결과 작성" 가능 |

### 5.3 임시저장 플로우
- 편집 모달에 **"임시저장"** 버튼 별도 존재
- 클릭 시 `structured_payload_draft`에 기록, 필수 필드 검증 면제, `vocs.status`·`review_status` 그대로
- 모달을 임시저장 없이 닫을 때 "임시저장하시겠습니까?" 프롬프트
- 임시저장은 **이력 없음** (최신 draft 하나만 유지)

### 5.4 이전 이력 버튼
- 편집 모달 내 "이전 이력" 버튼 → `voc_payload_history` 목록 표시
- 항목 선택 시: 현재 draft에 내용이 있으면 "임시저장 내용이 덮어써집니다. 계속?" 확인 후 해당 스냅샷을 draft에 로드
- 삭제된 스냅샷(`final_state='deleted'`)도 **복원 선택 가능** — 라벨로 "삭제됨" 표시

### 5.5 self-review 허용
- 폐쇄 메뉴(본인만 접근 가능한 시스템/메뉴) 케이스 수용
- `voc_payload_reviews.is_self_review = true`로 감사 추적만 남김 (별도 모니터링 대시보드는 두지 않음)

### 5.6 담당자 재할당 중 draft
- draft는 VOC에 종속 — 재할당 시 새 담당자가 기존 draft 이어받음. 별도 owner 컬럼 두지 않음.

---

## 6. 스키마 최종 변경 요약

```sql
-- tags.kind enum 축소
ALTER TYPE tag_kind RENAME TO tag_kind_old;
CREATE TYPE tag_kind AS ENUM ('general','menu');
ALTER TABLE tags ALTER COLUMN kind TYPE tag_kind USING kind::text::tag_kind;
DROP TYPE tag_kind_old;

-- vocs 확장
ALTER TABLE vocs
  ADD COLUMN structured_payload jsonb NULL,
  ADD COLUMN structured_payload_draft jsonb NULL,
  ADD COLUMN review_status text NULL
    CHECK (review_status IN ('unverified','approved','rejected','pending_deletion')),
  ADD COLUMN embed_stale boolean DEFAULT false;
-- embedding vector(1536)은 기존 스펙에 있음

-- 리뷰 이력 (제출 리뷰 + 삭제 신청 리뷰 통합)
CREATE TABLE voc_payload_reviews (
  id uuid PRIMARY KEY,
  voc_id uuid NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submission','deletion')),
  reviewer_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  comment text,
  is_self_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 제출 스냅샷 이력 (이전 이력 버튼 데이터 소스)
CREATE TABLE voc_payload_history (
  id uuid PRIMARY KEY,
  voc_id uuid NOT NULL REFERENCES vocs(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  submitted_by uuid NOT NULL REFERENCES users(id),
  submitted_at timestamptz DEFAULT now(),
  final_state text NOT NULL CHECK (final_state IN ('approved','rejected','deleted','active')),
  is_current boolean DEFAULT false  -- 현재 vocs.structured_payload와 동일 스냅샷 표시
);
CREATE INDEX ON voc_payload_history (voc_id, submitted_at DESC);
```

**불변 조건**:
- `vocs.structured_payload IS NOT NULL` ↔ 최근 제출본 존재
- `voc_payload_history WHERE is_current=true` row는 VOC당 **최대 1건** (approved 후 삭제되면 0건 가능)
- 새 제출 시: 기존 `is_current=true` row를 `false`로 내리고, 새 row `is_current=true`로 insert
- 삭제 승인 시: `vocs.structured_payload=NULL`, `vocs.review_status=NULL` (다시 미제출 상태로 복귀), 해당 history row `final_state='deleted'`, `is_current=false` → 담당자가 "결과 작성" 다시 가능
- 삭제 reject 시: `vocs.review_status='approved'`로 원복, payload 유지, 이력 row만 추가(`action='deletion'`, `decision='rejected'`)

---

## 7. 임베딩 정책 (Q4 일부 확정)

- 임베딩 대상 텍스트: `structured_payload` 의 `symptom + root_cause + resolution` 정규화 문자열
- 생성 시점: **`review_status`가 `approved`로 전환되는 순간에만 생성/갱신** — unverified/rejected 데이터가 벡터 스토어에 섞이면 품질 오염
- 갱신: approve 후 payload 재작성(삭제→재작성) 발생 시 `embed_stale=true` 마킹 → 다음 approve 시 재임베딩
- **MVP 단계에서는 여전히 임베딩 생성 미실행** — 컬럼·플래그·정책만 예약

---

## 8. 관리자 페이지 추가

`requirements.md` 관리자 페이지 목록에 **"Result Review"** 신설:
- `review_status IN ('unverified','pending_deletion')` VOC 목록
- 각 VOC에 코멘트 + approve/reject 액션
- 본인 self-review도 동일 UI에서 허용 (감사 플래그만 차이)

---

## 9. 이번 변경으로 무효화되는 기존 결정

| 폐기 | 대체 |
|---|---|
| `tags.kind enum('general','equipment','menu')` | `tags.kind enum('general','menu')` |
| `structured_payload.target text[]` (단일 배열) | `equipment`/`maker`/`model`/`process` 4필드 분리 |
| 엔티티 해석 결과를 `equipment` 태그로 저장 | 담당자가 `structured_payload`에 직접 입력 |
| "저장 시 일괄 검증" | "칩 추가 시점 개별 검증 + 저장 시 최소 조건만 확인" |

---

## 10. requirements.md 반영 계획

- **§4 데이터 스키마**
  - `tags.kind` enum 축소 명시
  - `vocs`에 `structured_payload_draft`, `review_status`, `embed_stale` 추가
  - `structured_payload` 스키마를 equipment/maker/model/process 분리 구조로 교체
  - `voc_payload_reviews`, `voc_payload_history` 테이블 추가
- **§8 VOC 처리 플로우**
  - 상태 전환 매트릭스에 "완료/드랍 시 `structured_payload` 제출 + `review_status='unverified'` 초기화" 규칙 추가
  - 수정/재제출/삭제 신청 플로우 기술
  - 임시저장 동작 기술
- **§11 관리자 페이지** (또는 해당 섹션)
  - "Result Review" 페이지 추가
- **§12 (신규) AI 워크플로우 적합성**
  - 태그 vs structured_payload 역할 경계
  - 임베딩 대상·생성 시점·갱신 정책
  - 엔티티 해석이 v2에서 도입될 때 `structured_payload`에 쓴다는 원칙

---

## 11. 남은 미결 항목 (이 리뷰 범위 밖)

- `status` 5단계 유지 vs 4단계 단순화 (기존 Q3)
- `comments.visibility enum('internal','public')` 채택 여부 (기존 Q7)
- `is_golden_case` 플래그 (기존 Q5)
- `source`/`chatbot_session_id`/`linked_code_refs` 예약 컬럼 (기존 Q8·Q9)
- 유사도 임계치 자리 예약 (기존 Q10)
- 외부 시스템(`related_programs/db_tables/jobs/sps`) 검증 쿼리 구현 명세

다음 세션에서 별도 토론.
