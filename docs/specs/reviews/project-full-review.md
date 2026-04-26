# VOC 프로젝트 전체 다방면 리뷰 — 잔여 항목

**원본 리뷰일**: 2026-04-26  
**최종 업데이트**: 2026-04-26 (Phase A/B/D 완료 반영)  
**대상 브랜치**: main (f0f3235) → 결정/수정 브랜치: fix/pre-impl-schema-infra

---

## 완료 항목 요약

| 구분                      | 완료 항목                              |
| ------------------------- | -------------------------------------- |
| Phase D (의사결정 8건)    | 전부 완료 → `requirements.md §17` 기록 |
| Phase A (스키마 확정 6건) | 전부 완료 → 마이그레이션 008~010 추가  |
| Phase B (FE/BE 기반 7건)  | 전부 완료 → 코드 수정 완료             |

완료된 전체 결정 내역 → `docs/specs/requires/requirements.md §17`

---

## 잔여 Critical (6건)

### 설계

- **[Result Review 관리자 페이지 완전 누락]**  
  `feature-voc.md §9.4.5`에 테이블 컬럼 전체 명세 존재. 사이드바 관리자 섹션에 진입점 없음(`prototype.html:1163-1171`).  
  → Phase C-1: 별도 admin-page 및 사이드바 진입점 추가

- **[Internal Notes 섹션 누락]**  
  `feature-voc.md §8.16`: "드로어 우측 패널에 공개 댓글과 별도, warning/accent 배경, User에게 DOM 비렌더링".  
  드로어 본문(`prototype.html:2746-2855`)에 해당 섹션 없음.  
  → Phase C-2: Internal Notes 섹션 드로어 추가

- **[공지사항 팝업 2-panel 미구현]**  
  `feature-notice-faq.md §10.3.2`: 팝업 2건 이상 시 "좌패널(목록) + 우패널(상세)" 2-panel 모달 명세.  
  `prototype.html:3549-3588`은 단건/복수 구분 없이 단일 세로 나열.  
  → Phase C-3: 2-panel 레이아웃 구현

### FE

- **[라우터에 MVP 핵심 화면 전무]**  
  `router.tsx`에 `/`(플레이스홀더)와 `/mock-login` 두 개뿐. VOC 목록, 드로어, 대시보드, 공지/FAQ, 관리자 페이지 전부 미정의.  
  → Phase 7 P0 구현 시 처리

### BE

- **[VOC 핵심 CRUD API 전무]**  
  `routes/`에 `auth.ts` 단 하나. GET/POST/PATCH/DELETE `/api/vocs` 없음.  
  → Phase 7 P0 구현 시 처리

- **[oidcAuthMiddleware 항상 throw]**  
  `oidcAuth.ts:4-6`: `throw new Error('OIDC auth not implemented')`.  
  `AUTH_MODE=oidc` 배포 불가.  
  → Phase 7 또는 스테이징 전 처리

---

## 잔여 Major

### 설계 Major (8건) — Phase C

| ID  | 항목                                               | 위치                            |
| --- | -------------------------------------------------- | ------------------------------- |
| C4  | 공지 "오늘 하루 보지 않기" 일괄 체크박스로 수정    | `prototype.html:3579-3583`      |
| C5  | 상태 전환 매트릭스 드롭다운 비허용 옵션 disabled   | `prototype.html:2750-2757`      |
| C6  | Due Date 필드 드로어 추가                          | `prototype.html:2746-2855`      |
| C7  | 태그 수동 편집 UI 추가                             | `feature-voc.md §8.8`           |
| C8  | `prototype.html:1651` Linear indigo `#5e6ad2` 제거 | `prototype.html:1651`           |
| C9  | "최대 2단계" → "최대 1레벨" 문구 수정              | `prototype.html:2477`           |
| —   | 우선순위 필드 권한 미분리                          | `prototype.html:1775-1777`      |
| —   | 담당 VOC 탭 배지 권한 분기 누락                    | `feature-notice-faq.md §10.2.2` |

### DB Major (2건)

- **[vocs.parent_id FK ON DELETE 동작 미정의]** soft delete 정책상 `ON DELETE SET NULL` 권장
- **[tag_rules 패턴 타입 미분화]** keyword/regex 구분 컬럼(`match_type`) 없음 — MVP 범위 확정 후 결정

### FE Major (6건)

- `priority` 필터 없음 — `VOCFilters`에 미정의 (`feature-voc.md §9.1`)
- `sort/order/page` 상태 없음 — URL 파라미터 유지 요구사항 (`feature-voc.md §9.5`)
- `NotificationContext type/relatedVocId/isUrgent` 필드 누락
- `MasterCacheContext` cold-start 상태 구분 불가 (`isSnapshotMode`만으로 불충분)
- `VOCDrawerContext` 전체화면 상태 없음 (`isFullScreen`, `toggleFullScreen`, URL sync)
- `getMe()` 401/500 미분리 — 세션 만료 vs 서버 오류 동일하게 `null` 반환

### BE Major (5건)

- 세션 스토어 MemoryStore 고정 — `connect-pg-simple` 필요 (§14.1 명시)
- 입력 유효성 검증 레이어 없음 (제목 200자, 본문 64KB 등)
- `/auth/me` 응답 래핑 불일치 — mock-login `{ user }`, me `req.user` 직접
- Rate limiting 없음 — master refresh 쿨다운 5분 요구
- 외부 마스터 캐시 없음 — 부팅 시 3종 마스터 로드

---

## 잔여 Minor (선택적)

### 설계

- `prototype.html:3543` — `background:#e5484d` raw hex, `var(--status-red)` 필요
- FAQ 카테고리 관리 탭 누락 (`feature-notice-faq.md §10.5`)
- 사이드바 전체 `overflow-y:auto` — 스펙은 보기 섹션 고정·시스템 트리만 스크롤

### DB

- `voc_types.color` hex 형식 CHECK 제약 없음
- `faqs.category_id` NULL 허용 (NOT NULL 추가 필요)
- `tag_rules.updated_at` 누락
- 순번 상한 5자리 자동 확장 미구현 (`LPAD 4자리` 고정)

### FE

- `tokens.ts`와 `index.css @theme` 수동 동기화 구조 — Phase 7에서 빌드 스크립트로 자동화 고려
- `AppProviders` Provider 중첩 순서 의존관계 비가시적 (주석 없음)

### BE

- `createAuthMiddleware()` 이중 호출 (`index.ts:14`, `routes/auth.ts:8`)
- `pinoHttp`에 `requestId/userId` 자동 미포함

---

## 미구현 화면/API 목록 (Phase 7 대상)

### FE 미구현 화면 (19개)

| 기능                                         | 우선순위 |
| -------------------------------------------- | -------- |
| VOC 목록 페이지 (테이블 + 필터바 + 사이드바) | P0       |
| VOC 사이드 드로어                            | P0       |
| VOC 등록 모달 (Toast UI Editor)              | P0       |
| 사이드바 (시스템 트리 아코디언)              | P0       |
| Role Guard (User/Manager/Admin 분기 렌더)    | P0       |
| 대시보드 페이지                              | P1       |
| 공지사항 페이지                              | P1       |
| FAQ 페이지                                   | P1       |
| 관리자 — 시스템/메뉴/유형 관리               | P1       |
| 관리자 — 사용자 권한 관리                    | P1       |
| 관리자 — 태그 규칙 관리                      | P1       |
| 관리자 — Result Review                       | P1       |
| 알림 벨 + 패널                               | P1       |
| Sub-task 아코디언 행                         | P1       |
| Internal Notes 섹션                          | P1       |
| structured_payload 결과 입력 폼 (별도 모달)  | P1       |
| 페이지네이션                                 | P1       |
| 전체화면 전환                                | P2       |
| 검색 결과 하이라이팅                         | P2       |

### BE 미구현 API (38개)

**P0**

- `GET /api/vocs`, `POST /api/vocs`, `GET /api/vocs/:id`, `PATCH /api/vocs/:id`, `PATCH /api/vocs/:id/status`, `DELETE /api/vocs/:id`

**P1**
댓글 CRUD, Internal Notes CRUD, 첨부파일 업로드, 알림 조회/unread-count, 대시보드 7개 위젯 API, 관리자 CRUD (시스템/메뉴/유형/사용자/태그규칙)

**P2**
변경 이력, 대시보드 고급 분석, 마스터 refresh, 공지/FAQ CRUD

---

## Phase C — 프로토타입 간극 해소 (설계 검증 필요)

| ID  | 항목                                                   |
| --- | ------------------------------------------------------ |
| C1  | Result Review 관리자 페이지 + 사이드바 진입점 추가     |
| C2  | Internal Notes 섹션 드로어 추가                        |
| C3  | 공지 팝업 2-panel 레이아웃 구현                        |
| C4  | 공지 "오늘 하루 보지 않기" 일괄 체크박스로 수정        |
| C5  | 상태 전환 매트릭스 드롭다운 비허용 옵션 disabled       |
| C6  | Due Date 필드 드로어 추가                              |
| C7  | 태그 수동 편집 UI 추가                                 |
| C8  | `prototype.html:1651` Linear indigo 제거               |
| C9  | `prototype.html:2477` "최대 2단계" → "최대 1레벨" 수정 |
