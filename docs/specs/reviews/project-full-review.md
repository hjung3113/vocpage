# VOC 프로젝트 전체 다방면 리뷰 — 잔여 항목

**원본 리뷰일**: 2026-04-26
**최종 업데이트**: 2026-04-27 (Phase G 17건 완료 반영)
**대상 브랜치**: fix/pre-impl-schema-infra

---

## 완료 항목 요약

| 구분                          | 완료 항목                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Phase D (의사결정 8건)        | 전부 완료 → `requirements.md §17` (D1~D8)                                       |
| Phase A (스키마 확정 6건)     | 전부 완료 → 마이그레이션 008~010                                                |
| Phase B (FE/BE 기반 7건)      | 전부 완료                                                                       |
| 스키마 정합성 보강 (D9~D17)   | P1/P2/DB Major 처리 → `migrations/011`, `seeds/mock-users.sql`, 요구문서 동기화 |
| Major 명세 보완 (C10/C11/C12) | feature-voc.md §8.17(퍼머링크), §9.2.2(인라인 펼침), requirements §15.2(초대)   |

완료된 전체 결정 내역 → `docs/specs/requires/requirements.md §17`
스키마 정합성 잔여 → `./schema-requirements-gap.md`

---

## 잔여 Critical (6건 — Phase 7 P0 구현 작업)

### 설계

- **Result Review 관리자 페이지 완전 누락** — 사이드바 진입점 + 페이지 신규 (Phase C-1)
- **Internal Notes 섹션 드로어 누락** — 드로어 우측 패널 추가 (Phase C-2)
- **공지사항 팝업 2-panel 미구현** — 좌패널(목록) + 우패널(상세) 모달 (Phase C-3)

### FE

- **라우터에 MVP 핵심 화면 전무** — VOC 목록/드로어/대시보드/공지·FAQ/관리자

### BE

- **VOC 핵심 CRUD API 전무** — `GET/POST/PATCH/DELETE /api/vocs` 등
- **`oidcAuthMiddleware` 항상 throw** — `AUTH_MODE=oidc` 배포 불가 (스테이징 전 처리)

---

## 잔여 Major

### 설계 Major

전부 완료 (C4~C9 + 권한 분기 2건 — Phase G에서 처리)

### FE Major (6건)

- `priority` 필터 없음 — `VOCFilters`에 미정의 (`feature-voc.md §9.1`)
- `sort/order/page` 상태 없음 — URL 파라미터 유지 (`feature-voc.md §9.5`)
- `NotificationContext type/relatedVocId/isUrgent` 필드 누락
- `MasterCacheContext` cold-start 상태 구분 불가
- `VOCDrawerContext` 전체화면 상태 없음 (`isFullScreen`, `toggleFullScreen`, URL sync)
- `getMe()` 401/500 미분리

### BE Major (5건)

- 세션 스토어 MemoryStore 고정 — `connect-pg-simple` 필요 (§14.1)
- 입력 유효성 검증 레이어 없음 (DB CHECK는 011에서 추가됨, 앱 레벨 검증 별도)
- `/auth/me` 응답 래핑 불일치
- Rate limiting 없음 — master refresh 쿨다운 5분 요구
- 외부 마스터 캐시 없음 — 부팅 시 3종 마스터 로드

---

## 잔여 Minor (선택적)

### 설계

전부 완료 (raw hex 제거, FAQ 카테고리 관리, 사이드바 overflow, 자동 태그 추천, 태그 규칙 모달, 분포 위젯 세그먼트 — Phase G에서 처리)

### DB

- `faqs.category_id` NULL 허용 (NOT NULL 추가 필요)
- `tag_rules.updated_at` 누락
- 순번 상한 5자리 자동 확장 미구현 (`LPAD 4자리` 고정)

### FE

- `tokens.ts`와 `index.css @theme` 수동 동기화 — 빌드 스크립트로 자동화 고려
- `AppProviders` Provider 중첩 순서 의존관계 비가시적

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
| Sub-task 아코디언 행 (인라인 펼침)           | P1       |
| Internal Notes 섹션                          | P1       |
| structured_payload 결과 입력 폼 (별도 모달)  | P1       |
| 페이지네이션                                 | P1       |
| 전체화면 전환                                | P2       |
| 검색 결과 하이라이팅                         | P2       |

### BE 미구현 API (38개)

**P0** — `GET /api/vocs`, `POST /api/vocs`, `GET /api/vocs/:id`, `PATCH /api/vocs/:id`, `PATCH /api/vocs/:id/status`, `DELETE /api/vocs/:id`

**P1** — 댓글 CRUD, Internal Notes CRUD, 첨부파일 업로드, 알림 조회/unread-count, 대시보드 7개 위젯 API, 관리자 CRUD (시스템/메뉴/유형/사용자/태그규칙)

**P2** — 변경 이력, 대시보드 고급 분석, 마스터 refresh, 공지/FAQ CRUD

---

## Phase C — 프로토타입 간극 해소 (잔여)

| ID  | 항목                                               |
| --- | -------------------------------------------------- |
| C1  | Result Review 관리자 페이지 + 사이드바 진입점 추가 |
| C2  | Internal Notes 섹션 드로어 추가                    |
| C3  | 공지 팝업 2-panel 레이아웃 구현                    |

> C4~C9 + 권한 분기 2건 Phase G에서 완료.
