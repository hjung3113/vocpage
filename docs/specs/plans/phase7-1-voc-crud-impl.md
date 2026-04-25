# Phase 7-1 구현 계획 — VOC CRUD + 상태 전환

> 작성일: 2026-04-25
> 브랜치: feat/phase7-voc-crud
> 선행: Phase 6 전 항목 완료, R-1~R-6 완료

---

## 스코프

VOC 핵심 플로우: 목록 조회, 생성, 상세 조회, 수정, 상태 전환, Soft Delete.
댓글·첨부파일·태그는 7-2·7-3으로 defer.

---

## 충돌 결정 기록 (요구사항 vs 프로토타입)

| 항목              | 요구사항                                   | 프로토타입/코드                     | 결정                                                                  |
| ----------------- | ------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------- |
| VocStatus 'draft' | 없음 (5단계: 접수/검토중/처리중/완료/드랍) | VOCFilterContext.tsx에 'draft' 포함 | **요구사항 기준** — 'draft' 제거. `vocs.status` CHECK 제약에 없는 값. |
| 필터 priority     | openapi에 priority 필터 파라미터 있음      | VOCFilterContext priority 필드 없음 | **openapi 기준** — priority 필터 추가                                 |

→ 상세: `docs/specs/reviews/phase7-1-conflicts-2026-04-25.md`

---

## 백엔드

### API 엔드포인트 (openapi.yaml 기준)

| Method | Path                 | 권한                                | 설명                |
| ------ | -------------------- | ----------------------------------- | ------------------- |
| GET    | /api/vocs            | Manager/Admin (전체), User (본인만) | 목록 (페이지네이션) |
| POST   | /api/vocs            | All                                 | 생성                |
| GET    | /api/vocs/:id        | 권한별                              | 상세                |
| PATCH  | /api/vocs/:id        | All (제한적)                        | 필드 수정           |
| PATCH  | /api/vocs/:id/status | Manager/Admin                       | 상태 전환           |
| DELETE | /api/vocs/:id        | Admin                               | Soft delete         |

### 파일

- `backend/src/routes/vocs.ts` — 라우터
- `backend/src/__tests__/vocs.test.ts` — Jest 테스트 (pg-mem)
- `backend/src/index.ts` — 라우터 등록

### 비즈니스 로직

1. **권한 분기**: User는 `author_id = req.user.id` 조건 자동 추가
2. **상태 전환 매트릭스** (`feature-voc.md §8.2`):
   - 접수 → 검토중/드랍 (Manager/Admin)
   - 검토중 → 처리중/드랍 (Manager/Admin)
   - 처리중 → 완료/드랍 (Manager/Admin)
   - 완료 → 처리중 (재오픈)
   - 드랍 → 검토중/처리중 (재오픈)
3. **생성 시**: priority='medium' 강제, due_date 자동 계산
4. **due_date 계산**: urgent=+7d, high=+14d, medium=+30d, low=+90d
5. **Soft delete**: `deleted_at` 타임스탬프 set, Admin only

### 테스트 케이스

- 미인증 → 401
- User: 본인 VOC 조회 가능, 타인 VOC 404
- Manager: 전체 VOC 조회
- 잘못된 상태 전환 → 400 INVALID_TRANSITION
- User 상태 변경 시도 → 403
- Admin soft delete, 비Admin → 403

---

## 프론트엔드

### 컴포넌트 트리

```
VocPage (src/pages/VocPage.tsx)
├── VocTopbar         (src/components/voc/VocTopbar.tsx)
│   ├── SearchInput
│   ├── NotificationButton
│   └── CreateVocButton → VocCreateModal
├── VocFilterBar      (src/components/voc/VocFilterBar.tsx)
│   ├── StatusPill[]  (접수/검토중/처리중/완료/드랍/전체)
│   └── AdvancedFilterPanel (toggle)
├── VocList           (src/components/voc/VocList.tsx)
│   ├── SortableHeader[]
│   ├── VocRow[]      (src/components/voc/VocRow.tsx)
│   │   ├── StatusDot
│   │   └── PriorityBadge
│   └── Pagination    (src/components/common/Pagination.tsx)
└── VocDrawer         (src/components/voc/VocDrawer.tsx)
    ├── DrawerHeader
    ├── DrawerMetaSection (상태/담당자/우선순위 인라인 편집)
    └── DrawerBody (Toast UI Viewer / Editor 토글)
```

공통 컴포넌트:

- `src/components/common/StatusDot.tsx`
- `src/components/common/PriorityBadge.tsx`
- `src/components/common/Pagination.tsx`

### API 클라이언트

`src/api/vocs.ts`:

- `listVocs(filters, page, limit)` → GET /api/vocs
- `createVoc(data)` → POST /api/vocs
- `getVoc(id)` → GET /api/vocs/:id
- `updateVoc(id, data)` → PATCH /api/vocs/:id
- `updateVocStatus(id, status)` → PATCH /api/vocs/:id/status
- `deleteVoc(id)` → DELETE /api/vocs/:id

### 수정 파일

- `src/contexts/VOCFilterContext.tsx` — 'draft' 제거, priority 필터 추가
- `src/router.tsx` — VocPage 등록 (path="/")

### 스타일 규칙

- CSS custom properties만 사용 (`var(--*)`)
- hex/oklch 직접 사용 금지
- Tailwind utility: 레이아웃/간격
- 8px 그리드 준수

---

## 구현 순서

1. BE: `routes/vocs.ts` + `index.ts` 등록
2. BE: `__tests__/vocs.test.ts` (TDD)
3. FE: `api/vocs.ts`
4. FE: 공통 컴포넌트 (StatusDot, PriorityBadge, Pagination)
5. FE: VocList + VocRow
6. FE: VocTopbar + VocFilterBar
7. FE: VocDrawer
8. FE: VocCreateModal
9. FE: VocPage + router 등록
10. BE/FE 테스트 실행 + 수정

---

## 완료 조건

- [ ] `npm test --workspace=backend | tail -20` — 신규 VOC 테스트 케이스 통과
- [ ] `npm test --workspace=frontend | tail -20` — 통과
- [ ] `npm run typecheck --workspace=backend` — 오류 없음
- [ ] `npm run typecheck --workspace=frontend` — 오류 없음
- [ ] VocPage 라우트 "/" 에서 VOC 목록 표시
- [ ] VocDrawer VOC 상세 표시
- [ ] VocCreateModal로 VOC 생성 가능
