# Phase 7-8 Result Review 플로우 설계

> 작성: 2026-04-25 | 기준 스펙: `requirements.md §4`, `feature-voc.md §8.2, §8.2.1, §9.4.5`

---

## 1. 스코프

`structured_payload` 제출/검토/삭제 신청의 전체 서브 상태 머신을 구현한다.

**포함:**

- BE: payload 제출, draft 저장, 제출 이력 조회, 리뷰(approve/reject), 삭제 신청
- FE: VOC 상세 페이지의 payload 폼(제출·임시저장·이전 이력), 관리자 Result Review 탭

**제외 (NextGen/MVP 이후):**

- 임베딩 생성 (`embed_stale=true` 마킹만 수행, 실제 벡터 생성 미실행)
- 외부 마스터 캐시 자동완성 (§16.3 — Phase 7-10)

---

## 2. 상태 머신

```
(null)
  └─ 완료/드랍 전환 + payload 제출 → unverified
       ├─ approve(Manager/Admin) → approved
       └─ reject(Manager/Admin) → rejected
            └─ 재제출 → unverified

approved
  └─ 삭제 신청(Manager/Admin) → pending_deletion
       ├─ approve → (null) + payload clear + history.final_state='deleted'
       └─ reject → approved 원복
```

---

## 3. DB 테이블 (기존, 변경 없음)

```sql
-- vocs: structured_payload, structured_payload_draft, review_status,
--       embed_stale(boolean), resolution_quality, drop_reason 컬럼 이미 존재

-- voc_payload_reviews: (id, voc_id, action, reviewer_id, decision, comment, created_at)
-- voc_payload_history: (id, voc_id, payload, submitted_by, submitted_at, final_state, is_current)
```

---

## 4. API 설계

### 4-1. `POST /api/vocs/:id/payload` — Payload 제출 (완료/드랍 전환과 동시)

**권한:** Manager/Admin (assignee 포함)  
**사전 조건:** `voc.status IN ('완료', '드랍')` 또는 이 호출과 동시에 status 전환  
**Body:** `{ equipment, maker, model, process, symptom, root_cause, resolution, unverified_fields? }`

**동작:**

1. `voc_payload_history.is_current = false` (기존 current row)
2. `voc_payload_history` INSERT (is_current=true, final_state='active')
3. `vocs` UPDATE: `structured_payload=payload, review_status='unverified', embed_stale=(review_status이었던값='approved')`

**응답:** `VocPayloadHistory` 객체

### 4-2. `PATCH /api/vocs/:id/payload-draft` — 임시저장

**권한:** assignee 또는 Manager/Admin  
**Body:** `{ draft }` (partial payload, 필수 필드 검증 없음)  
**동작:** `vocs.structured_payload_draft = draft` (최신 1건만, 이력 없음)  
**응답:** `{ ok: true }`

### 4-3. `GET /api/vocs/:id/payload-history` — 제출 이력

**권한:** Manager/Admin  
**응답:** `VocPayloadHistory[]` (submitted_at DESC)

### 4-4. `POST /api/vocs/:id/payload-review` — Approve/Reject

**권한:** Manager/Admin (본인이 제출한 건은 자기 리뷰 불가 — 단, MVP에서는 구현 생략하고 주석만)  
**Body:** `{ decision: 'approved'|'rejected', comment? }`  
**사전 조건:** `review_status IN ('unverified', 'pending_deletion')`

BE가 `review_status`로 action 자동 판별:

- `review_status='unverified'` → `action='submission'`
- `review_status='pending_deletion'` → `action='deletion'`

**동작 (submission approve):**

1. `voc_payload_reviews` INSERT
2. `vocs.review_status = 'approved'`, `vocs.embed_stale = false` (MVP: 실제 임베딩 미생성)
3. `voc_payload_history.final_state = 'approved'` (is_current=true row)

**동작 (submission reject):**

1. `voc_payload_reviews` INSERT
2. `vocs.review_status = 'rejected'`
3. `voc_payload_history.final_state = 'rejected'`, `is_current=false`

**동작 (deletion approve):**

1. `voc_payload_reviews` INSERT
2. `vocs.structured_payload = NULL`, `vocs.review_status = NULL`
3. `voc_payload_history.final_state = 'deleted'`, `is_current = false`

**동작 (deletion reject):**

1. `voc_payload_reviews` INSERT
2. `vocs.review_status = 'approved'` (원복)

**응답:** `{ ok: true }`

### 4-5. `POST /api/vocs/:id/payload-delete-request` — 삭제 신청

**권한:** Manager/Admin  
**사전 조건:** `review_status = 'approved'`  
**동작:** `vocs.review_status = 'pending_deletion'`  
**응답:** `{ ok: true }`

### 4-6. 관리자 Result Review 목록

기존 `GET /api/admin/vocs` 재활용 또는 별도 필터:  
`GET /api/vocs?review_status=unverified,pending_deletion` — VOC 목록에 review_status 필터 추가.

---

## 5. OpenAPI 추가 필요

- `POST /api/vocs/:id/payload-draft` 신규 엔드포인트
- `POST /api/vocs/:id/payload-delete-request` 신규 엔드포인트
- `GET /api/vocs?review_status=...` 필터 파라미터 추가

---

## 6. 프론트엔드 설계

### 6-1. VOC 상세 Payload 섹션

**표시 조건:** `voc.status IN ('완료', '드랍')` 시 섹션 노출

**UI 요소:**

- 7개 필드 폼 (equipment, maker, model, process, symptom, root_cause, resolution)
- `unverified_fields` 배지 (경고 노란색 — `var(--status-amber-bg)`)
- **임시저장** 버튼 → `PATCH .../payload-draft`
- **제출** 버튼 → `POST .../payload`
- **이전 이력** 버튼 → 모달 + payload-history 목록, 선택 시 draft 덮어쓰기

**review_status 표시:**

- `unverified`: "검토 대기 중" 배지 (amber)
- `approved`: "승인됨" 배지 (green) + "삭제 신청" 버튼 (Manager/Admin만)
- `rejected`: "반려됨" 배지 (red) + 수정/재제출 가능
- `pending_deletion`: "삭제 검토 중" 배지 (purple)

### 6-2. 관리자 Result Review 탭 (AdminPage)

**위치:** `AdminPage.tsx` 내 새 탭 "결과 리뷰" 추가

**테이블 컬럼:** 이슈 ID | 제목 | VOC 상태 | 리뷰 상태 | 담당자 | 제출일 | 액션

**액션 UI:** approve/reject 버튼 + comment 입력

**필터:** `review_status IN ('unverified','pending_deletion')` (기본), 토글로 전체 조회 가능

---

## 7. 구현 순서 (TDD)

```
1. OpenAPI 업데이트 (payload-draft, payload-delete-request 엔드포인트 추가)
2. codegen 실행
3. BE 테스트 작성 (RED): payload 제출, draft, history, review, delete-request
4. BE 구현: routes/vocs.ts에 5개 핸들러 추가
5. 테스트 GREEN
6. FE api 클라이언트 (submitPayload, saveDraft, getHistory, reviewPayload, requestDeletion)
7. FE VOC 상세 PayloadSection 컴포넌트
8. FE AdminPage 결과 리뷰 탭
9. commit
```

---

## 8. 권한 매트릭스 (§8.3 기준)

| 액션           | User |     Manager     | Admin |
| -------------- | :--: | :-------------: | :---: |
| Payload 제출   |  ❌  | ✅ (assignee만) |  ✅   |
| Draft 저장     |  ❌  | ✅ (assignee만) |  ✅   |
| 이전 이력 조회 |  ❌  |       ✅        |  ✅   |
| Approve/Reject |  ❌  |       ✅        |  ✅   |
| 삭제 신청      |  ❌  |       ✅        |  ✅   |

---

## 9. 스펙 vs 프로토타입 불일치 사항

- prototype에 payload 폼 UI 있으나 7개 필드 배치 불명확
- **결정**: requirements §4 `structured_payload` 스키마 기준으로 구현
