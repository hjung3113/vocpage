# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-27 (Phase G — 설계 잔여 17건 마무리)
> 현재 위치: Phase 7 (코드 구현)

---

## Phase E ✅ 완료 (2026-04-26)

`migrations/011_pre_impl_alignment.sql` 단일 파일로 통합 처리.

- P1 4건(D9~D12) + P2 5건(GAP-7~11) + DB Major 1건(D13) + GAP-1 모두 반영
- Mock User seed 신규 (`seeds/mock-users.sql`, `npm run db:seed:mock`)
- Major 명세 보완 D14~D17 → requirements.md §15.2, feature-voc.md §8.17·§9.2.2, requirements §17 D9~D17
- 잔여 → `docs/specs/reviews/schema-requirements-gap.md` (P3 4건, Phase 8 운영 시점 재검토)

---

## Phase F ✅ 완료 (2026-04-26)

`/plan` consensus(Architect+Critic) 결과를 사용자 위임 하에 자체 적용. D18~D21.

- D18 Dev role 추가 (`users.role` enum 4종, ownership 기반 권한)
- D19 공지/FAQ 관리 진입점 = 페이지 우측 상단 버튼 + `?mode=admin` URL 쿼리
- D20 design.md §13 신규(Admin·Notice·FAQ 컴포넌트 12건) + raw color 가드 + 신규 토큰 4종
- D21 `assertCanManageVoc` 헬퍼 단일화 (feature-voc.md §8.4-bis 신규)
- 산출물: `docs/specs/reviews/design-prototype-audit.md`, `docs/specs/plans/migration-012-draft.md`, `.omc/plans/design-admin-role-overhaul.md`

### Phase F 후속 — 구현 phase 진입 시 이행 (BE/FE 코드 수정)

| ID  | 항목                                                                                                | 상태 |
| --- | --------------------------------------------------------------------------------------------------- | ---- |
| F1  | `backend/migrations/012_add_dev_role.sql` 실파일 생성 (draft 기반)                                  | -    |
| F2  | `backend/seeds/mock-users.sql`에 dev fixture 1건 추가                                               | -    |
| F3  | BE `assertCanManageVoc(user, voc, action)` 헬퍼 단일화 + 모든 VOC 운영 라우트 적용                  | -    |
| F4  | FE/BE `Role` union 타입에 `'dev'` 추가, `mockUsers.ts` fixture 추가                                 | -    |
| F5  | `POST /api/auth/mock-login` body validator enum 확장                                                | -    |
| F6  | FE role guard hook 분기 갱신 (`useRequireRole`, dashboard 가드, internal note 가드, role-pill)      | -    |
| F7  | Notice/FAQ 페이지에 `?mode=admin` 쿼리 토글 + admin-only 컴포넌트 dynamic import                    | -    |
| F8  | Admin 페이지에서 공지/FAQ 서브탭 제거 (코드/네비/라우트 정리)                                       | -    |
| F9  | design.md §13 컴포넌트들을 React로 구현 (역할별: AdminTopbar, RolePill 4종, NoticeBadge 3종 등)     | -    |
| F10 | prototype.html `#fff` 2건 + 본문 `light-dark(oklch())` 사용처 토큰화 (또는 React 이관 시 자동 해소) | -    |
| F11 | design.md §5 Status Badge 토큰 그룹 정식화 (prototype L399~433 raw oklch 정리)                      | -    |
| F12 | BE 회귀 테스트 5건 추가 (feature-voc.md §8.4-bis 명시)                                              | -    |

---

## Phase G ✅ 완료 (2026-04-27)

설계 단계 잔여 17건 일괄 마무리. 4개 에이전트 병렬(파일 도메인별 분리). 코드 변경 없는 명세/HTML 텍스트 작업만.

| 영역          | 처리                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| R-1~R-3       | dashboard 용어/세션 스토어 NOTE/globaltabs_order 결정                                                     |
| C4~C9         | prototype + spec 동기화 (일괄 체크박스, 상태 disabled, Due Date, 태그 수동 편집, indigo 제거, 1레벨 문구) |
| 권한 분기 2건 | feature-voc Priority/태그 권한 + feature-notice-faq 담당 VOC 배지                                         |
| Minor 6건     | raw hex 제거, 자동 태그 추천, 태그 규칙 모달, FAQ 카테고리 관리, 사이드바 overflow, 분포 위젯 세그먼트    |

산출물: 5개 spec/HTML 수정 (+759/-207). 잔여는 모두 코드 구현(Critical 6건, FE/BE Major 11건, F1~F12, R-4, C1~C3)으로 Phase 7/8 이관.

---

## Phase 7 착수 전 문서 수정 필수

| ID  | 항목                                                                 | 상태 |
| --- | -------------------------------------------------------------------- | ---- |
| R-4 | `ts-node-dev → tsx watch` 교체 (backend/package.json `dev` 스크립트) | -    |

---

## Phase C — 프로토타입 간극 해소 (설계 명세 보완)

> 구현 전 문서 확정 필수. 각 항목은 spec 수정 → prototype 수정 → 커밋 순서.

| ID  | 항목                                               | 상태 |
| --- | -------------------------------------------------- | ---- |
| C1  | Result Review 관리자 페이지 + 사이드바 진입점 추가 | -    |
| C2  | Internal Notes 섹션 드로어 추가                    | -    |
| C3  | 공지 팝업 2-panel 레이아웃 구현                    | -    |

> C10(퍼머링크), C11(사용자 초대), C12(서브태스크 인라인 펼침) 명세는 Phase E에서 완료 — `feature-voc.md §8.17`, `requirements.md §15.2`, `feature-voc.md §9.2.2` 참조. Phase 7에서는 명세대로 구현만 하면 됨.

---

## Phase 6-9. Prototype → 실구현 동일 재현 플로우

- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## Phase 7: 개발 스켈레톤

> **목표**: 로컬 dev 환경에서 전체 기능 동작 확인. production 고려 없음.
> **선행 조건**: R-1~R-4 완료 + 6-9 완료

### 상시 규칙 ⚠️ 구현 중 항상 적용

- [ ] 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- [ ] 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- [ ] 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- [ ] 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

### 기능 단계

| 단계 | 내용                                                                                   | 상태 |
| ---- | -------------------------------------------------------------------------------------- | ---- |
| 7-1  | VOC 핵심 플로우 — CRUD, 상태 전환 (접수→검토→처리→완료/드랍)                           | -    |
| 7-2  | 댓글 + 첨부파일                                                                        | -    |
| 7-2a | Internal Notes (`voc_internal_notes`) — 보안 필수 3건 포함 (User→404 등)               | -    |
| 7-3  | 태그 + 태그 규칙 자동화 (갭 #6)                                                        | -    |
| 7-4  | 대시보드 (위젯 데이터 API + 프론트) — `dashboard.md` + `prototype/prototype.html` 참조 | -    |
| 7-5  | 공지사항 / FAQ                                                                         | -    |
| 7-6  | 관리자 페이지 (사용자·카테고리·태그규칙·설정)                                          | -    |
| 7-7  | 알림                                                                                   | -    |
| 7-8  | Result Review 플로우 (review_status, voc_payload_reviews)                              | -    |
| 7-9  | Sub-task                                                                               | -    |
| 7-10 | 외부 마스터 연동 (stub JSON 기반, 실 MSSQL 아님)                                       | -    |
| 7-11 | Storybook or 체크리스트 비교 방법 결정 + 전 컴포넌트 티켓화                            | -    |

---

## Phase 8: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.
> **선행 조건**: Phase 7 전 항목 완료

| 단계 | 내용                                                            | 비고          |
| ---- | --------------------------------------------------------------- | ------------- |
| 8-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4 defer     |
| 8-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |               |
| 8-3  | Production Dockerfile + 빌드 파이프라인                         |               |
| 8-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | G-1 외부 의존 |
| 8-6  | 배포 + smoke test                                               |               |
| 8-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  |               |
| 8-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           |               |

---

## 미결 사항

| #   | 항목                     | 비고                                            |
| --- | ------------------------ | ----------------------------------------------- |
| G-1 | 설비 마스터 MSSQL 스키마 | 담당자 자료 수집 후 external-masters.md §3 보완 |
