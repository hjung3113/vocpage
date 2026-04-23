# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-24 (5차 — v2 리뷰 결정사항 requirements/feature 반영 완료, v3 리뷰 예약)
> 목표: 프로토타입 확정 → 문서 정비 → 구현 준비

## Reviews 폴더 구조

```
docs/specs/reviews/
├── phase0/   prototype-requirements-review.md
├── phase2/   requirements-expert-review-2026-04-23.md, REVIEW-notice-faq.md
├── phase4/   requirements-5expert-review-2026-04-23.md
└── phase6/   design-enforcement.md   ← Phase 6-2 디자인 일관성 강제 체계 브레인스토밍
             voc-ai-workflow-fit-review.md     ← Phase 6-1 v1 (2026-04-23, 일부 폐기됨)
             voc-ai-workflow-fit-review-v2.md  ← Phase 6-1 v2 (2026-04-24, Q1·Q2 재결정 — canonical)
```

---

## Phase 0: 대시보드 프로토타입 완성 및 컨펌 ✅ 완료 (2026-04-23)

- [x] `prototype/prototype.html` 대시보드 섹션 제작
- [x] 피드백 반복 → 디자인·인터랙션 수정
- [x] **컨펌 게이트** 통과

---

## Phase 1: 나머지 페이지 디자인 통일성 확보 및 컨펌 ✅ 완료 (2026-04-23)

> 통일성 점수: **82% → 100%** (Playwright 시각 검증)

### 1-1. 정보 페이지 디자인 리뷰 (2개)
- [x] 공지사항 페이지 (`notice`) — 레벨 배지 CSS vars 적용, notice-row/body 클래스 도입
- [x] FAQ 페이지 (`faq`) — 하이라이트 #5e6ad233→brand-bg, faq-filter-bar/cat-btn 클래스
- 체크: 색상 토큰, 타이포, 8px grid, 배지·탭 스타일 일관성

### 1-2. 관리자 페이지 디자인 리뷰 (6개)
- [x] 사용자 관리 (`admin/users`) — role-admin/manager oklch 리터럴 → CSS vars
- [x] 태그 규칙 관리 (`admin/tag-rules`) — type-keyword/regex oklch 리터럴 → CSS vars
- [x] 카테고리 관리 (`admin/categories`) — 기존 일관성 확인 (문제 없음)
- [x] 공지사항 관리 (`admin/notices`) — 레벨 배지 색상 추가, 폼 버튼 클래스 통일
- [x] FAQ 관리 (`admin/faq`) — 폼 버튼 클래스 통일
- [x] 시스템 설정 (`admin/settings`) — 기존 일관성 확인 (문제 없음)

### 1-3. 차이 항목 수정
- [x] 전 페이지 기준 차이 항목 목록화 (8개 이슈 식별)
- [x] `prototype/prototype.html` 직접 수정으로 통일
- 추가 CSS vars: `--status-amber-bg/border`, `--status-red-bg/border`, `--status-purple/bg/border`
- 추가 클래스: `.notice-badge`, `.notice-row`, `.notice-body`, `.faq-*`, `.btn-form-save/cancel`

- [x] **컨펌 게이트**: Playwright 검증 통과 (점수 100%), 사용자 컨펌 후 Phase 3 진행

---

## Phase 2: 요구사항 문서 통합 및 리뷰 ✅ 완료 (2026-04-23)

- [x] `requirements.md` 전체 리뷰 — 모순·누락·미정의 10건 수정
- [x] `dashboard-feature.md` 커스터마이징 섹션 MVP로 단순화
- [x] `docs/specs/plans/dashboard-v2-layout-editor.md` 신규 생성 (v2 기능 분리)

---

## Phase 3: 요구사항 문서 인덱스화 ✅ 완료 (2026-04-23)

- [x] `requirements.md` 상단에 문서 인덱스 테이블 추가
- [x] §8·§9 → `feature-voc.md` 분리 (VOC 핵심 기능 명세)
- [x] §10 → `feature-notice-faq.md` 분리 (공지·FAQ 기능 명세)
- [x] `dashboard-feature.md` → `requires/dashboard.md` + `plans/dashboard-impl.md` 분리
- [x] `requirements.md` §8~§11 요약 + 링크로 교체 (652줄 → 273줄)

---

## Phase 4: 설계 과정 문서 정리 ✅ 완료 (2026-04-23)

- [x] `docs/next-session-tasks.md` 삭제 (stale 복사본)
- [x] `docs/explanation/prototype-requirements-review.md` → `docs/specs/reviews/` 이동
- [x] `docs/specs/plans/dashboard-feature.md` 삭제 (분리 완료)
- [x] `docs/specs/requires/` 구조: requirements.md / design.md / feature-voc.md / feature-notice-faq.md / dashboard.md

---

## Phase 5: CLAUDE.md 분리 ✅ 완료 (2026-04-23)

- [x] `frontend/CLAUDE.md` — FE 스택, 컴포넌트 규칙, 상태 관리, 디자인 토큰
- [x] `backend/CLAUDE.md` — BE 스택, API 설계, 인증 미들웨어, DB 스키마
- [x] `prototype/CLAUDE.md` — 프로토타입 작업 규칙, 디자인 토큰 사용 기준
- [x] 루트 `CLAUDE.md` — 공통 규칙만 (129줄, 200줄 이내)

---

## Phase 6: 구현 전 준비

> **선행 조건**: Phase 1~5 완료 — 스펙·문서 완비 후 구현 진입

### 6-1. 피드백 반영 → 스펙 최종 확정
- [ ] 리뷰 결과를 `design.md`에 반영 (영어, 비주얼 스펙만)
- [ ] 기능 변경 시 `requirements.md`에 반영 (한국어, 기능 스펙만)
- [ ] `prototype/prototype.html` 최종 상태 = 확정 디자인 기준점으로 커밋
- [ ] **AI 워크플로우 적합성 리뷰 반영** (`reviews/phase6/voc-ai-workflow-fit-review.md`)
  - **세션 2026-04-23 진행분 (결정 완료 — requirements.md §4 반영 O)**:
    - [x] 🔴 갭 #1 (설비 마스터): 별도 테이블 불채택. `tags.kind enum('general','equipment','menu')` 3-카테고리로 대체. 외부 마스터 sync 없음.
    - [x] 🔴 갭 #2 (LLM 정규화 저장): `vocs.structured_payload jsonb` 단일 컬럼. 실시간 AI는 NextGen, MVP는 담당자가 완료/드랍 시 폼으로 입력.
    - [x] 🟠 갭 #3 (root_cause/resolution): `structured_payload` JSON 내부 키로 흡수 (`symptom`/`root_cause`/`resolution` 필수 텍스트).
    - [x] 보류→드랍 이름 변경 + `resolution_quality`/`drop_reason` enum 추가.
  - **세션 2026-04-24 진행분 (v2 리뷰 재결정 — 문서만 작성, requirements.md 반영 미수행)**:
    - [x] ✅ **Q1 재리뷰 완료**: `tags.kind` 2-카테고리(`general`/`menu`)로 축소. 설비 관련은 전부 `structured_payload`로 이동. 상세는 `reviews/phase6/voc-ai-workflow-fit-review-v2.md`.
    - [x] ✅ **Q2 재설계**: `structured_payload`에 `equipment`/`maker`/`model`/`process` 4필드 분리, 칩 입력 UX(실시간 검증 + auto 추가 + cascade), 4개 중 최소 1개 저장 조건.
    - [x] ✅ **리뷰 플로우 신설**: `review_status enum('unverified','approved','rejected','pending_deletion')` + `voc_payload_reviews`(리뷰 이력) + `voc_payload_history`(제출 스냅샷) 2개 테이블 추가.
    - [x] ✅ **임시저장**: `structured_payload_draft` 별도 컬럼 + "이전 이력" 버튼 로직 확정.
    - [x] ✅ **임베딩 정책**: approve 시점 생성 + `embed_stale` 플래그 (MVP는 여전히 미실행).
  - **세션 2026-04-24 후반 진행분 (v2 리뷰 결정 requirements/feature 반영 완료)**:
    - [x] ✅ v2 리뷰 결정사항 `requirements.md` §4 스키마 반영 (structured_payload 4분리 · draft/review_status/embed_stale · voc_payload_reviews · voc_payload_history · tags.kind 축소)
    - [x] ✅ `requirements.md` §8.16 Result Review 플로우 요약 + §15 관리자 페이지 + §16 AI 워크플로우 적합성 신규 섹션 추가
    - [x] ✅ `feature-voc.md` §8.2.1 `review_status` 서브 상태 머신 + §9.4.5 Result Review 관리자 페이지 상세 반영
    - [x] ✅ `embed_stale` 플래그 결정 완료 — approve 시점 임베딩 재생성 트리거 용도로 `vocs`에 포함
  - **세션 2026-04-24 말미 진행분 (v3 리뷰 토론 — Q3·Q5 확정, 용어 정리)**:
    - [x] ✅ 📌 v3 리뷰 문서 작성 (`reviews/phase6/voc-ai-workflow-fit-review-v3.md`)
    - [x] ✅ **Q3 확정**: `status` **5단계 유지**. 근거: `검토중`(문제 파악) vs `처리중`(실제 해결) 의미 구분 가치 있음. Jira 마이그레이션 유입은 전부 접수/검토중으로만 떨어져 enum 매핑 영향 無. review_status는 별개 축.
    - [x] ✅ **Q5 확정**: `is_golden_case` **도입 유보(C)**. 스키마 변경 없음. MVP에서 골든 라벨링 실제 사용 계획 없음. NextGen 진입 시 태그 방식(B) vs 컬럼(A) 재판단.
    - [x] ✅ **용어 통일**: "v2" 혼용 제거 → **NextGen** (차세대 설계) / **v2 리뷰** (회차 표기)로 분리. `requirements.md` 상단 용어 정의 섹션 추가.
  - **다음 세션(v3 리뷰 계속)에서 결정 필요**:
    - [ ] Q7: `comments.visibility enum('internal','public')` 채택 여부 (작성자 공개 vs 담당자 전용) ← **시작점**
    - [ ] Q8·Q9: 예약 컬럼 `source(manual|chatbot|import)`, `chatbot_session_id`, `linked_code_refs` 추가 여부 및 스키마 예약
    - [ ] Q10: 유사도 임계치 자리 예약 (`similarity_threshold` 설정 테이블 vs 환경변수 vs ENUM 상수)
    - [ ] 🟡 갭 #6 재정리: `tag_rules` vs NextGen 엔티티 해석(structured_payload 4필드 입력) 역할 경계 — 2-카테고리 태그로 축소된 상태 기준으로 재서술
    - [ ] `related_programs/db_tables/jobs/sps` 외부 시스템 검증 쿼리 구현 명세 (어떤 시스템에 어떤 API/쿼리로 물을지)
    - [ ] Phase 4 5-Expert 리뷰 미결 — AD 인증 방식 확정, §2.3 Sub-task 표현 통일, 대시보드 API endpoint 목록, 환경변수, 에러 응답 포맷, 파일명 저장 방식, KPI 목표값

### 6-2. 디자인 일관성 강제 체계
- [ ] `design.md`에서 CSS 변수 토큰 목록 추출 → 컴포넌트별 토큰 사용 규칙 문서화
- [ ] 구현 시 임의 하드코딩 색상/간격 금지 규칙을 CLAUDE.md에 추가
- [ ] (선택) ESLint 커스텀 룰 또는 Stylelint 설정으로 토큰 이탈 감지

### 6-3. 백엔드 테스트 작성 전략
- [ ] 테스트 범위 정의: 단위(서비스 레이어), 통합(API 엔드포인트), E2E(주요 플로우)
- [ ] 테스트 픽스처/시드 전략 결정 (PostgreSQL 테스트 DB vs 인메모리)
- [ ] 각 API 엔드포인트별 테스트 케이스 목록 작성 (requirements.md §API 참조)
- [ ] Jest + Supertest 설정 파일 + 샘플 테스트 1개 작성 (구현 전 틀만)

### 6-4. 스캐폴딩 & 개발환경 설정
- [ ] 프로젝트 초기 셋업 순서 확정 (Docker Compose → BE → FE 순서 권장)
- [ ] ESLint + Prettier 공통 설정 (FE/BE 각각, 공통 규칙 공유)
- [ ] `.env` 구조 설계 및 Docker Compose 환경변수 관리 방식 결정 (`.env.example` 작성)

### 6-5. FE-BE API 계약
- [ ] OpenAPI spec 또는 공유 타입 방식 결정 — 타입 불일치 방지 (예: `shared/types/` 패키지)
- [ ] BE 완성 전 FE 개발용 Mock API 전략 결정 (MSW vs json-server)
- [ ] 주요 API 엔드포인트 응답 형태 사전 정의 (requirements.md §API 기반)

### 6-6. 인증 Mock 전략 ⚠️ 블로킹 위험
- [ ] `validateADSession` 미들웨어 환경별 bypass 방식 결정 (`NODE_ENV=development` 시 mock user 주입)
- [ ] 개발용 mock 사용자 픽스처 정의 (role: admin / user 각 1개)
- [ ] 실 AD 없이 전체 플로우 개발 가능한 상태 확인

### 6-7. DB 마이그레이션 & 시드 전략
- [ ] 마이그레이션 방식 결정 (수동 SQL 파일 vs node-pg-migrate vs Flyway)
- [ ] 마이그레이션 파일 구조 및 명명 규칙 결정
- [ ] prototype.html 예시 데이터 기반 시드 fixture 작성 계획
- [ ] **pgvector 확장 초기 마이그레이션에 포함**: `CREATE EXTENSION IF NOT EXISTS vector;` + `vocs.embedding vector(1536) NULL` 컬럼 생성 (MVP 미사용, 향후 유사검색/RAG용 예약). Docker 이미지는 `pgvector/pgvector:pg16` 사용.

### 6-8. 상태 관리 방식 확정
- [ ] React Context vs Redux 결정 — requirements.md에서 열려있는 항목 확정
- [ ] 전역 상태 범위 정의: filter 상태, 선택된 VOC, drawer 열림 여부
- [ ] 결정 내용 requirements.md에 반영

### 6-9. Prototype → 실구현 동일 재현 플로우
- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## Phase 7: 실구현 (추후 진입)

> **선행 조건**: Phase 6 전 항목 완료 — 스펙·테스트 전략·스캐폴딩·인증 mock·DB 전략 확정 후에만 진입

### 7-1. 요구사항 ↔ 프로토타입 불일치 처리 규칙 ⚠️ 구현 중 상시
- [ ] 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- [ ] 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- [ ] 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- [ ] 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

---

## 전체 완료 조건

- [ ] prototype.html 대시보드 + 전 페이지 — 확정 디자인 기준으로 커밋
- [ ] `requirements.md` + `design.md` — 단일 출처로 완비, 인덱스 포함
- [ ] 설계 과정 잔여 문서 정리 완료
- [ ] CLAUDE.md frontend / backend / prototype / project 단위로 분리
- [ ] 구현 준비 문서 (테스트 전략 + 컴포넌트 매핑) 작성 완료
- [ ] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [ ] 상태 관리 방식 결정 → requirements.md 반영
- [ ] API 계약 방식 결정 + Mock API 전략 확정
