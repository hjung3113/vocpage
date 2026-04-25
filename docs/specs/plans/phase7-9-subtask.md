# Phase 7-9 Sub-task 설계

> 작성: 2026-04-25 | 기준 스펙: `feature-voc.md §8.7, §8.8`, `requirements.md §4`

---

## 1. 스펙 요약

| 항목        | 내용                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| 깊이 제한   | 1레벨만 허용 (vocs → Sub-task). Sub-task의 Sub-task 생성 불가                                        |
| Sub-task ID | `{parent-issue-code}-{N}` (예: `ANALYSIS-2025-0001-1`). N은 자연수, 증가 전용, 삭제 후 재사용 금지   |
| 상속        | 시스템/메뉴는 부모 VOC 상속 (변경 불가). 상태·담당자·Priority·유형은 독립                            |
| Soft Delete | 부모 Soft Delete 시 Sub-task cascade soft delete                                                     |
| 목록 표시   | 부모 VOC가 필터 조건에 일치하면 Sub-task 들여쓰기 표시. Sub-task 단독 미노출. 페이지네이션 부모 기준 |
| 자동 태깅   | cascade 없음 — Sub-task 자체 title/body 변경 시에만 독립 재계산                                      |
| 경고        | 부모 VOC 완료 전환 시 미완료 Sub-task 있으면 경고 후 강제 진행 가능                                  |
| UI 진입점   | 드로어 하단 인라인 폼 한 곳만 (헤더 중복 버튼 없음)                                                  |

---

## 2. DB 설계

### 2-1. 1레벨 제한 강제

현재 `parent_id uuid REFERENCES vocs(id)` 만 있고 CHECK 없음.  
DB CHECK에 서브쿼리 불가 → **BE 코드에서 강제**:

- Sub-task 생성 시 부모 VOC의 `parent_id IS NOT NULL`이면 400 반환.
- (선택) BEFORE INSERT 트리거로 DB에서도 검증 가능 — MVP에서는 BE 검증으로 충분.

### 2-2. Sub-task issue_code 생성

현재 트리거 (`trg_voc_sequence_no`): `sequence_no IS NULL` 일 때 `{시스템 slug}-{year}-{seq}` 형식 채번.  
Sub-task는 다른 포맷(`{parent_issue_code}-{N}`)이므로 트리거 우회 필요.

**방식:** BE에서 issue_code와 sequence_no를 미리 채번하여 INSERT 시 포함 → 트리거 미발동(`WHEN (NEW.sequence_no IS NULL)`).

```sql
-- N 채번 쿼리 (Sub-task 생성 전 실행)
SELECT COUNT(*) + 1 AS next_n
FROM vocs
WHERE parent_id = $parent_id
  -- soft-delete된 Sub-task도 포함 (삭제 후 번호 재사용 금지)
```

issue_code = `{parent.issue_code}-{next_n}`  
sequence_no = Sub-task에는 의미 없으나 NULL 허용 여부 확인 → 현재 `sequence_no int` (NOT NULL 없음) → NULL 가능.

### 2-3. 부모 Soft Delete cascade

`DELETE /api/vocs/:id` (soft delete) 핸들러에서 Sub-task도 함께 처리:

```sql
UPDATE vocs SET deleted_at = now() WHERE parent_id = $id AND deleted_at IS NULL
```

---

## 3. API 설계

### 3-1. `POST /api/vocs/:id/subtasks` — Sub-task 생성

**권한:** 인증된 모든 역할 (VOC 생성 권한 = 전체)  
**Body:** `{ title, body?, priority?, voc_type_id, assignee_id? }`  
**상속:** system_id, menu_id = 부모 VOC에서 자동 복사  
**응답:** 생성된 VOC 객체 (issue_code 포함)

**동작:**

1. 부모 VOC 조회 (없거나 soft-deleted → 404)
2. `parent.parent_id IS NOT NULL` → 400 (1레벨 제한)
3. `next_n` 채번 (위 쿼리)
4. issue_code = `{parent.issue_code}-{next_n}` 설정
5. INSERT (system_id/menu_id 부모에서 상속, parent_id 설정)
6. 자동 태깅 실행 (applyTagRules — Sub-task 독립 규칙)
7. 응답

### 3-2. `GET /api/vocs/:id/subtasks` — Sub-task 목록

**권한:** 인증된 모든 역할  
**응답:** `VocListItem[]` (부모 ID = :id인 Sub-task 목록, deleted_at IS NULL)

### 3-3. 기존 PATCH/DELETE 엔드포인트 수정

- `DELETE /api/vocs/:id`: Sub-task cascade soft delete 추가
- `PATCH /api/vocs/:id` (status 변경): system_id/menu_id 변경 시 Sub-task인 경우 400

---

## 4. OpenAPI 추가

- `POST /vocs/{id}/subtasks`
- `GET /vocs/{id}/subtasks`
- VOC schema에 `subtasks?: VocListItem[]` 또는 별도 응답 필드

---

## 5. 프론트엔드 설계

### 5-1. Sub-task 생성 폼 (VocDrawer 하단)

**조건:** `voc.parent_id IS NOT NULL` → 폼 비활성화 + "1레벨 Sub-task만 지원합니다" 안내

```tsx
// VocDrawer 하단에 추가
<SubtaskInlineForm vocId={voc.id} disabled={!!voc.parent_id} onCreated={refreshVoc} />
```

폼 필드: 제목(필수), Priority, 유형 선택, 담당자  
Submit: `POST /api/vocs/:id/subtasks`

### 5-2. Sub-task 목록 표시 (VocDrawer)

생성된 Sub-task는 드로어 내 섹션으로 표시:

```
Sub-task (2)
  ├─ ANALYSIS-2025-0001-1  [처리중]  홍길동
  └─ ANALYSIS-2025-0001-2  [접수]    김철수
```

각 Sub-task 행 클릭 → 해당 Sub-task 드로어 오픈

### 5-3. VOC 목록 계층 표시 (VocPage)

GET /api/vocs 응답에 `subtasks` 포함 또는 별도 fetch:

- 부모 VOC 행 아래 Sub-task를 들여쓰기로 표시
- Sub-task는 독립 목록 행으로 미노출

**MVP 단순화:** 별도 들여쓰기 없이 드로어에서 Sub-task 섹션으로만 표시. 목록 계층 표시는 복잡도가 높아 TODO 처리.

### 5-4. 부모 완료 전환 경고 (VocDrawer)

부모 VOC status → '완료' 전환 시:

- Sub-task 중 `status NOT IN ('완료','드랍')` 존재하면 경고 모달
- "미완료 Sub-task가 N건 있습니다. 계속 진행하시겠습니까?"
- 확인 시 강제 전환, 취소 시 중단

---

## 6. 권한 매트릭스

| 액션               |   User    | Manager | Admin |
| ------------------ | :-------: | :-----: | :---: |
| Sub-task 생성      |    ✅     |   ✅    |  ✅   |
| Sub-task 조회      |    ✅     |   ✅    |  ✅   |
| Sub-task 상태 변경 |    ✅     |   ✅    |  ✅   |
| Sub-task 삭제      | ✅ (본인) |   ✅    |  ✅   |

---

## 7. 구현 순서 (TDD)

```
1. OpenAPI 업데이트 (subtasks 엔드포인트) + codegen
2. BE 테스트 작성 (RED)
3. BE: POST/GET /subtasks + DELETE cascade + 경고 체크 API
4. 테스트 GREEN
5. FE api 클라이언트
6. FE SubtaskInlineForm + SubtaskList (VocDrawer)
7. FE 부모 완료 전환 경고 모달
8. commit
```

---

## 8. 스펙 vs 구현 단순화 사항

- **목록 계층 표시**: MVP에서 드로어 내 섹션으로만 표시 (목록 들여쓰기 TODO)
- **1레벨 DB 트리거**: BE 코드로만 강제 (트리거 불필요)
- **Sub-task 번호 채번 race**: 단순 `COUNT(*)+1` 사용 (동시 생성 edge case — 실 운영 시 FOR UPDATE 필요, MVP OK)
