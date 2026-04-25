# Phase 7-2 + 7-2a 구현 계획 — 댓글·첨부파일·Internal Notes

> 작성일: 2026-04-25
> 브랜치: feat/phase7-voc-crud

---

## 스코프

| 단계 | 내용                                            |
| ---- | ----------------------------------------------- |
| 7-2  | 댓글 CRUD + 첨부파일 업로드/목록/삭제           |
| 7-2a | Internal Notes (Manager/Admin 전용, User → 404) |

---

## 백엔드

### 엔드포인트

**댓글**

- GET /api/vocs/:id/comments
- POST /api/vocs/:id/comments
- PATCH /api/vocs/:id/comments/:commentId (본인만)
- DELETE /api/vocs/:id/comments/:commentId (본인 or Admin)

**Internal Notes** (Manager/Admin만, User → 404)

- GET /api/vocs/:id/notes
- POST /api/vocs/:id/notes
- PATCH /api/vocs/:id/notes/:noteId (본인만)
- DELETE /api/vocs/:id/notes/:noteId (soft delete, 본인 or Admin)

**첨부파일**

- GET /api/vocs/:id/attachments
- POST /api/vocs/:id/attachments (multer, max 10MB)
- DELETE /api/vocs/:id/attachments/:attachmentId

### 첨부파일 업로드 규칙 (§8.5)

- 허용: PNG/JPG/GIF/WebP (MIME + 확장자 이중 검증)
- 차단: SVG, 실행 파일 헤더
- 최대 크기: 10MB
- 최대 개수: 5개/VOC
- storage_path: `{voc_id}/{uuid}-{원본파일명}`
- 저장 위치: `uploads/` 디렉토리 (Docker volume uploads_data와 연결)
- 다운로드: Content-Disposition: attachment 강제

### 신규 파일

- `backend/src/routes/comments.ts`
- `backend/src/routes/notes.ts`
- `backend/src/routes/attachments.ts`
- `backend/src/__tests__/comments.test.ts`
- `backend/src/__tests__/notes.test.ts`
- `backend/src/__tests__/attachments.test.ts`
- `backend/src/index.ts` — 3개 라우터 추가

---

## 프론트엔드

### VocDrawer 탭 구조 추가

- 본문 탭 | 댓글 탭 | 첨부파일 탭
- (Internal Notes는 Manager/Admin만 보이는 별도 섹션)

### 신규 컴포넌트

- `frontend/src/components/voc/CommentList.tsx` — 댓글 목록 + 입력
- `frontend/src/components/voc/CommentItem.tsx` — 단일 댓글 (편집/삭제)
- `frontend/src/components/voc/AttachmentList.tsx` — 첨부파일 목록
- `frontend/src/components/voc/AttachmentItem.tsx` — 단일 첨부파일 (다운로드/삭제)
- `frontend/src/components/voc/InternalNotesSection.tsx` — Internal Notes (Manager/Admin only)

### API 클라이언트 추가

- `frontend/src/api/comments.ts`
- `frontend/src/api/attachments.ts`

### VocDrawer 수정

- 탭 추가: 본문 | 댓글 | 첨부파일
- Internal Notes 섹션 (role 확인 후 조건부 렌더링)
