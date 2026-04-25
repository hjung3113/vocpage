# Phase 7-3 구현 계획 — 태그 + 태그 규칙 자동화

> 작성일: 2026-04-25
> 브랜치: feat/phase7-voc-crud

---

## 스코프

| 영역       | 내용                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| 백엔드     | 태그 목록 조회, VOC별 태그 수동 추가/삭제, 태그 규칙 CRUD, 자동 태깅 서비스 |
| 프론트엔드 | VOC 행/드로어 태그 칩, 태그 필터                                            |

---

## 요구사항 핵심

- User: 태그 조회만 가능, 수동 추가/삭제 불가
- Manager/Admin: 개별 VOC 태그 수동 추가/삭제 가능 + 태그 규칙 관리
- 자동 태깅: VOC 생성 시 + title/body PATCH 시 tag_rules 규칙 재실행
- Sub-task cascade 없음 (각 VOC 독립)
- 규칙 source='rule', 수동 source='manual' — voc_tags.source 구분

---

## 백엔드

### 엔드포인트

**태그 마스터**

- `GET /api/tags` — 전체 태그 목록 (auth 필요)

**VOC 태그**

- `GET /api/vocs/:id/tags` — VOC 태그 목록 (auth)
- `POST /api/vocs/:id/tags` — 태그 수동 추가 (Manager/Admin)
- `DELETE /api/vocs/:id/tags/:tagId` — 태그 제거 (Manager/Admin)

**태그 규칙**

- `GET /api/tag-rules` — 규칙 목록 (Manager/Admin)
- `POST /api/tag-rules` — 규칙 생성 (Manager/Admin)
- `PATCH /api/tag-rules/:id` — 규칙 수정 (Manager/Admin)
- `DELETE /api/tag-rules/:id` — 규칙 삭제 (Manager/Admin)

### 자동 태깅 서비스 (`backend/src/services/autoTag.ts`)

```
applyTagRules(vocId, title, body, pool):
  1. tag_rules WHERE is_active=true ORDER BY sort_order ASC 조회
  2. 각 규칙: new RegExp(pattern, 'i').test(title + ' ' + body)
  3. 매칭된 tag_id → voc_tags UPSERT (source='rule')
  4. 미매칭이지만 기존 source='rule' 태그 → DELETE
  5. source='manual' 태그는 건드리지 않음
```

### 신규 파일

- `backend/src/routes/tags.ts`
- `backend/src/services/autoTag.ts`
- `backend/src/__tests__/tags.test.ts`
- `backend/src/index.ts` — tagsRouter 추가

### vocs.ts 수정

- `POST /api/vocs` 생성 후 → `applyTagRules(newVoc.id, title, body, pool)` 호출
- `PATCH /api/vocs/:id` — title 또는 body 변경 시 → `applyTagRules(id, newTitle, newBody, pool)` 호출

---

## 프론트엔드

### API 클라이언트 (`frontend/src/api/tags.ts`)

```typescript
listTags(): Promise<Tag[]>
listVocTags(vocId: string): Promise<VocTag[]>
addVocTag(vocId: string, tagId: string): Promise<VocTag>
removeVocTag(vocId: string, tagId: string): Promise<void>
listTagRules(): Promise<TagRule[]>
createTagRule(payload): Promise<TagRule>
updateTagRule(id: string, payload): Promise<TagRule>
deleteTagRule(id: string): Promise<void>
```

### 컴포넌트 수정

- `VocRow.tsx` — 태그 칩 추가 (오른쪽 끝)
- `VocDrawer.tsx` — 본문 탭 하단 태그 섹션 (Manager/Admin: 추가/삭제 가능)
- `VocFilterBar.tsx` — 태그 필터 드롭다운 추가
- `VOCFilterContext.tsx` — `tagId: string | null` 필드 추가
- `frontend/src/api/vocs.ts` — listVocs에 tag_id 파라미터 반영
