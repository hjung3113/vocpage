# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-30 (Phase 7 Wave 1 종료 — P-5/P-6/P-7/P-8/P-10/P-12 ✅)
> 현재 위치: Phase 7 Wave 2 — B-5 ✅ (2026-04-30, R3 PASS) → 다음 = B-3 공지 로그인 팝업
> Wave 2 plan: `plans/prototype-phase7-wave2.md`

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
- D20 uidesign.md §13 신규(Admin·Notice·FAQ 컴포넌트 12건) + raw color 가드 + 신규 토큰 4종
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
| F9  | uidesign.md §13 컴포넌트들을 React로 구현 (역할별: AdminTopbar, RolePill 4종, NoticeBadge 3종 등)   | -    |
| F10 | prototype.html `#fff` 2건 + 본문 `light-dark(oklch())` 사용처 토큰화 (또는 React 이관 시 자동 해소) | -    |
| F11 | uidesign.md §5 Status Badge 토큰 그룹 정식화 (prototype L399~433 raw oklch 정리)                    | -    |
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

## 2026-04-27 cross-review 처리 결과 ✅ 완료

> 출처: cross-review (삭제됨, git 히스토리 참조). 4개 도메인 리뷰 결과 식별된 **결정 5건 + 즉시 적용 5건**. **2026-04-27 일괄 처리 완료**.

### 결정 (Open Questions) — ✅ 2026-04-27 확정

| #   | 결정 항목                                                                            | 결정                                                                      |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Q1  | dashboard.md `7d/30d/90d` ↔ req §4 `1m/3m/1y/all/custom` ↔ migration 011 충돌        | **마이그·req 정본 → dashboard.md 수정** (R-5 적용 완료)                   |
| Q2  | requirements.md §15 본문에 D22/D23 진입점 서브섹션 vs 포인터만 유지                  | **포인터 한 줄** — feature-voc.md §9.4.6/9.4.7 단일 출처 (R-7 적용)       |
| Q3  | dashboard 위젯 수용 기준 23개 → §13.1.1 Given/When/Then 일괄 변환 vs 체크리스트 허용 | **일괄 변환** — Phase 8 이후 R-8에서 처리                                 |
| Q4  | §13.4 "VOC 1,000건" vs dashboard.md:661 "10만 건"                                    | **10만 건 통일** — production-scale 기준, R-9 적용 시점 dashboard.md 정본 |
| Q5  | external-masters atomic swap: 전체 트랜잭션 vs source별 독립                         | **source별 독립** — 운영 인시던트 격리 우선, 8-M3 spec 반영               |

### 즉시 적용 (docs-only) — ✅ 2026-04-27 일괄 커밋 완료

| ID   | 항목                                                                                                                     | 상태 |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ---- |
| R-5  | dashboard.md `7d/30d/90d` → `1m/3m/1y/all/custom` (L13, L607, L688-689)                                                  | ✅   |
| R-7  | requirements.md §15.3 태그 마스터 + §15.4 휴지통 진입점 포인터 한 줄                                                     | ✅   |
| R-10 | prototype.html 사이드바 "공지사항/FAQ 관리" 메뉴 + `renderAdminNotices/Faq()` 제거 (D19 정합)                            | ✅   |
| R-11 | prototype.html L95/157 `#fff` 2건 → `var(--text-on-brand)` + L399~435 status badge raw oklch → token (5 status × 3 prop) | ✅   |
| R-12 | uidesign.md §5 "Empty / Error / Loading States" 패턴 + §13.11 admin page non-data states 정식화                          | ✅   |

> R-11 부수 산출: uidesign.md §10 + prototype :root 에 `--status-{received,reviewing,processing,done,drop}-{bg,fg,border}` 토큰 15종 신설 → F11 (Phase F follow-up) 자동 해소.

### 이연 — Phase 7 (prototype 고도화) 항목 추가

| ID  | 항목                                                                  |
| --- | --------------------------------------------------------------------- |
| P-9 | `?mode=admin` 토글 prototype 시연 추가 (D19/ADR #4 검증 — 현재 0 hit) |

### 이연 — Phase 8 (개발 스켈레톤) 신규/우선순위 항목

| ID    | 항목                                                                                                                | 묶음             |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 8-PR1 | **권한 인프라 PR** = migration 012 실파일(F1) + dev role 4파일 동기화(F4·F6) + `assertCanManageVoc` 헬퍼 단일화(F3) | 첫 PR — critical |
| 8-PR2 | migration 013 = `tags.is_external`, `tags.merged_into_id` FK, `tag_rules.suspended_until` (D22 운영 차단 해소)      | -                |
| 8-PR3 | migration 014 = `vocs.deleted_by`, `voc_restore_log` (D23 운영 차단 해소)                                           | -                |
| 8-M1  | `005_content.sql` `faq_categories.slug UNIQUE`/`is_archived` 명세 §10.4 보완 (스키마 선행 잔재)                     | -                |
| 8-M2  | `notices.visible_from/to` → `timestamptz` + KST 자정 경계 명문화                                                    | -                |
| 8-M3  | external-masters refresh 스케줄러/실패 처리 spec (Q5 결정 반영)                                                     | Q5               |
| 8-M4  | FE 미정의 토큰 사용 정리 — `MockLoginPage.tsx:48,57` `--border` → `--border-standard`, `--danger` → `--status-red`  | -                |

### 이연 — Phase 9 또는 NextGen

- §13.4 성능 측정 환경/툴 정의 → Phase 9 (배포 직전 벤치마크 환경 구성 시점)
- §17 D3·D4·D5·D6 메모 → 명세 본문 흡수 → Phase 8 각 기능 단계 진입 시점에 분산 처리
- N-1/N-2 (admin-ui-coverage GAP-3·4) → NextGen 유지

---

## Phase 8 착수 전 문서 수정 필수

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

> C10(퍼머링크), C11(사용자 초대), C12(서브태스크 인라인 펼침) 명세는 Phase E에서 완료 — `feature-voc.md §8.17`, `requirements.md §15.2`, `feature-voc.md §9.2.2` 참조. Phase 8에서는 명세대로 구현만 하면 됨.

---

## Phase 6-9. Prototype → 실구현 동일 재현 플로우

- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## Phase 7: Prototype 고도화

> **목표**: 코드 구현 진입 전 `prototype/prototype.html`을 모든 화면·상태·역할에 대해 1:1 재현 가능한 수준으로 끌어올려, Phase 8 구현 시 시각적 정답을 확정한다.
> **선행 조건**: PR #54 머지 완료 (2026-04-27)
> **산출물**: 갱신된 `prototype/prototype.html` + 컴포넌트 인벤토리 + 갭 리스트.

| ID   | 항목                                                                                                                  | 상태                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| P-1  | 미구현 화면 추가 (C1 Result Review 관리자, C2 Internal Notes 드로어, C3 공지 팝업 2-panel)                            | ✅ B-1 Result Review detail drawer 완료 (R3 fixes 적용) |
| P-2  | 역할별 뷰(admin/manager/user/dev) 변형 demo — `?mode=admin` + role-pill 토글                                          | ✅ Wave 2 B-5 (2026-04-30, R3 PASS, 99028af)            |
| P-3  | uidesign.md §13 Admin·Notice·FAQ 컴포넌트 12건 prototype 반영                                                         | -                                                       |
| P-4  | 상태/엣지케이스 패널 (빈 상태, 오류, 로딩, 권한 차단, 길이 초과)                                                      | -                                                       |
| P-5  | 섹션별 컴포넌트 인벤토리 + spec(라인) ↔ prototype(셀렉터) 매핑표 작성                                                 | ✅ Wave 1 (2026-04-30, 74% coverage 70/94)              |
| P-6  | prototype vs spec 갭 재스캔 → 신규 갭은 `docs/specs/reviews/`에 기록                                                  | ✅ Wave 1 (2026-04-30, 29건 잔여 → Wave 2 입력)         |
| P-7  | D22 태그 마스터 관리 페이지 prototype 추가 (`feature-voc.md §9.4.6`)                                                  | ✅ Wave 1 (2026-04-30, PR #66, R2 90.4)                 |
| P-8  | D23 휴지통 페이지 prototype 추가 (`feature-voc.md §9.4.7`)                                                            | ✅ Wave 1 (2026-04-30, PR #67, R1 88.8 + critic fix)    |
| P-9  | 검토 상세 드로어 Round 3 verification pending                                                                         | ✅ R3 fixes 완료 (2026-04-28)                           |
| P-10 | External Masters 관리 페이지 (Equipment/DB/Program 카드 + 새로고침 + 콜드스타트/스냅샷 뱃지)                          | ✅ Wave 1 (2026-04-30, PR #69, R1 82.3 + 5 spec fix)    |
| P-11 | VOC 드로어 고급 기능 보강 (상태 disabled, 미완 sub-task 경고, 퍼머링크, 전체화면, 댓글 편집/삭제, review_status 뱃지) | - (B-13)                                                |
| P-12 | 알림 유형별 데모 + Urgent VOC 빨강 느낌표 뱃지                                                                        | ✅ Wave 1 (2026-04-30, PR #70, R1 82.5 + XSS fix)       |
| P-13 | User 관리 가드 토스트 (마지막 Admin · self-role · is_active)                                                          | - (B-15)                                                |
| P-14 | 첨부 업로드 에러 토스트 데모 (413/415/400)                                                                            | - (B-16)                                                |
| P-15 | Dashboard 설정 패널 슬라이드인 (내 설정 / 기본값[Admin] 토글)                                                         | - (B-17)                                                |
| P-NG | **후속 작업 (NextGen)**: i18n 외부화, 풀 RBAC + DB RLS, payload_sha256 BE 구현, OpenAPI 스펙                          | -                                                       |

---

## Phase 8: 개발 스켈레톤

> **목표**: 로컬 dev 환경에서 전체 기능 동작 확인. production 고려 없음.
> **선행 조건**: Phase 7 (prototype 고도화) 완료 + R-1~R-4 완료 + 6-9 완료

### 상시 규칙 ⚠️ 구현 중 항상 적용

- [ ] 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- [ ] 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- [ ] 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- [ ] 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

### 기능 단계

| 단계 | 내용                                                                                   | 상태 |
| ---- | -------------------------------------------------------------------------------------- | ---- |
| 8-1  | VOC 핵심 플로우 — CRUD, 상태 전환 (접수→검토→처리→완료/드랍)                           | -    |
| 8-2  | 댓글 + 첨부파일                                                                        | -    |
| 8-2a | Internal Notes (`voc_internal_notes`) — 보안 필수 3건 포함 (User→404 등)               | -    |
| 8-3  | 태그 + 태그 규칙 자동화 (갭 #6)                                                        | -    |
| 8-4  | 대시보드 (위젯 데이터 API + 프론트) — `dashboard.md` + `prototype/prototype.html` 참조 | -    |
| 8-5  | 공지사항 / FAQ                                                                         | -    |
| 8-6  | 관리자 페이지 (사용자·카테고리·태그규칙·설정 + D22 태그 마스터 + D23 휴지통)           | -    |
| 8-7  | 알림                                                                                   | -    |
| 8-8  | Result Review 플로우 (review_status, voc_payload_reviews)                              | -    |
| 8-9  | Sub-task                                                                               | -    |
| 8-10 | 외부 마스터 연동 (stub JSON 기반, 실 MSSQL 아님)                                       | -    |
| 8-11 | Storybook or 체크리스트 비교 방법 결정 + 전 컴포넌트 티켓화                            | -    |

---

## Phase 9: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.
> **선행 조건**: Phase 8 전 항목 완료

| 단계 | 내용                                                            | 비고          |
| ---- | --------------------------------------------------------------- | ------------- |
| 9-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4 defer     |
| 9-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |               |
| 9-3  | Production Dockerfile + 빌드 파이프라인                         |               |
| 9-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | G-1 외부 의존 |
| 9-6  | 배포 + smoke test                                               |               |
| 9-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  |               |
| 9-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           |               |

---

## 미결 사항

| #   | 항목                                                        | 비고                                                                                                     |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| G-1 | 설비 마스터 MSSQL 스키마                                    | 담당자 자료 수집 후 external-masters.md §3 보완                                                          |
| N-1 | 외부 마스터 캐시 인스펙트 화면 (loaded_at·항목수·실패 사유) | NextGen. MVP는 스냅샷/콜드스타트 배지만 노출 (§16.3). 운영 중 디버그 필요성 발생 시 활성화               |
| N-2 | 자동 태그 "수동 제거 후 재부여 차단" 이력 reset UI          | NextGen. §8.8.1에 따라 수동 제거 시 voc_history에 기록되어 재부여 차단됨 — 정정 수단은 운영 실측 후 결정 |
