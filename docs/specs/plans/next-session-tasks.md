# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-24 (10차 — v3 리뷰 전 결정(Q3/Q5/Q7/Q8/Q9/Q10/갭#6/§7A) requirements.md 본문 일괄 반영 완료)
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
  - **세션 2026-04-24 추가 진행분 (v3 리뷰 — Q7·Q8·Q9 확정)**:
    - [x] ✅ **Q7 확정 (B안)**: 별도 `voc_internal_notes` 테이블 + UI 섹션 분리. 권한 경계가 테이블 접근 자체라 컬럼 필터 누락 사고 내성 강함. Manager/Admin만 접근, User는 404. Timeline은 Manager/Admin만 배지 구분하여 섞어 표시. (v3 §3.4)
    - [x] ✅ **Q8·Q9 확정**: `source`만 MVP 도입 (`text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','import'))`). PG enum 타입 대신 `text+CHECK` 선택 (값 추가/제거 유연성). `chatbot_session_id`·`linked_code_refs`는 NextGen 계획 시점에 재결정(YAGNI). 마이그레이션 `created_at`은 Jira 원본 보존. `source='import'`에 "Jira Imported" 배지. 리스트 필터 UI는 MVP 미포함. (v3 §4)
  - **세션 2026-04-24 추가 진행분 (v3 리뷰 — Q10 확정)**:
    - [x] ✅ **Q10 확정**: MVP 스코프 제외. **환경변수(A)로 시작**, NextGen 도입 시점에 `system_settings` 테이블(B) 승격 재논의. 근거: 빈 KV 테이블 선생성은 YAGNI 위반, 범용 KV는 jsonb 쓰레기통화 위험, threshold는 초기 튜닝 빈도 낮음(임베딩 모델 교체 이벤트엔 어차피 재배포 동반), C는 갭 #6의 `tag_rules` 역할 한정과 충돌. requirements.md 스키마 변경 없음. (v3 §5.3)
  - **세션 2026-04-24 추가 진행분 (갭 #6 확정)**:
    - [x] ✅ **갭 #6 확정**: MVP에 자동 태깅 엔진 실제 동작(대시보드 현황 입력원). `tag_rules`는 `kind='general'` 자동 부착 전용, 엔티티 단어는 `structured_payload` 위임. `voc_tags.source text CHECK ('manual','rule')` 컬럼 추가로 수동/자동 태깅 구분(재실행 시 manual 보존). 실행 시점: 접수 + 제목/본문 편집 시. 충돌 시 전부 부착. requirements.md §4·§16.1 반영. (v3 §6.3)
  - **세션 2026-04-24 말미 진행분 (v3 §7 외부 검증 — 7A 추상 계약 확정)**:
    - [x] ✅ **모델 전환**: "저장 시 외부 API 호출"에서 **"편집 세션 중 BE 메모리 기반 검증"**으로 구조 변경. 저장 시점 외부 호출 0. 자유 텍스트 태깅이 아니라 **트리아지 단계(Manager)에서 드롭다운 선택** 전제.
    - [x] ✅ **캐시 범위**: 프로세스 전역. BE 부팅 시 마스터 3종(설비·DB·프로그램) 1회 로드. 규모 작아 통째 적재 가능.
    - [x] ✅ **Refresh 정책**: TTL 없음, 수동 트리거. 권한 **Manager 이상**, 관리자 페이지 + 편집 화면 🔄 아이콘 양쪽 배치. **쿨다운 5분** (동일 사용자 기준 원천 시스템 보호).
    - [x] ✅ **부팅 시 로드 실패**: **C (디스크 스냅샷 fallback)** + **Manager/Admin UI에 "스냅샷 모드" 배지** 필수. 마스터 변동 빈도 낮아 stale 리스크 현저히 낮음. (나머지 보조 조건(메타 로그/한도/비동기 쓰기)은 채택 안 함 — 운영 필요 시 추가)
    - [x] ✅ **수동 Refresh 실패**: **A (atomic swap)** — 3종 전부 성공해야 교체, 실패 시 기존 메모리 유지. 부분 교체 금지(일관성 시점 틀어짐).
    - [x] ✅ **저장 시 BE 재검증**: **A (필수)**. FE body 플래그 신뢰 금지. BE 메모리가 단일 진실 원천. override 여부는 BE가 재판정 → `unverified_fields` 재계산.
    - [x] ✅ **입력 모드**: **B (자유 입력 허용 + unverified 플래그)**. 마스터 등록 지연보다 VOC 처리 흐름 보호 우선. 자동완성 UX로 정상 케이스 대부분 커버.
    - [x] ✅ **`review_status` 단위**: **C (row 플래그 + payload 상세)**. `vocs.review_status`는 row 단위 단일값(Manager 큐 필터용). 어느 필드가 문제인지는 `structured_payload.unverified_fields text[]`로 병기. 리뷰 화면에서 문제 필드 배지 표시 가능. 컬럼 승격은 운영 중 필요성 실측 후.
    - [x] ✅ **리뷰 외 용도 처리**: 대시보드 "필드별 unverified 분포" 위젯은 MVP에 미포함. 문제 발생 시 재고.
  - **세션 2026-04-24 종반 진행분 (문서 청소 + 6건 본문 일괄 반영 완료)**:
    - [x] ✅ **v3 리뷰 청소**: §1.4(Q3 5단계 유지 최종), §2.4(Q5 도입 유보 확정, 컬럼 예약도 철회), §7 본문 전면 교체(A+C 하이브리드 → 편집 세션 BE 메모리 10건), §9 체크리스트 전부 `[x]` 갱신.
    - [x] ✅ **requirements.md 본문 반영 (6건 batch)**:
      - §4 `vocs.source` 컬럼 추가 + 운영 규칙(text+CHECK, 지표 분리, SLA 제외, created_at 보존, "Jira Imported" 배지, 리스트 필터 UI 비포함)
      - §4 `vocs.status` 불릿: "다음 세션 확정" 문구 제거, "5단계 유지 확정" 주석
      - §4 `structured_payload.unverified_fields text[]` 필드 추가 + BE 재검증 규칙
      - §4 `voc_internal_notes` 테이블 신규 (스키마·권한·API 4개·UI·Timeline·회귀 테스트)
      - §12 SLA 분모에서 `source='import'` 제외 명시
      - §16.3 외부 마스터 연동 정책 전면 개편 (7A 10건 + API 계약 + 장애 fallback), §16.4 대시보드 영향, §16.5 v3 리뷰 확정 이력 표, §16.6 다음 세션 잔여
  - **다음 세션 시작점** (우선순위 순):
    - [x] **feature-voc.md 정합성 확인**: §8.2 상태 전환 매트릭스가 requirements.md §4와 일치하는지 재검증, Q7 Internal Notes UI/Timeline 규칙을 §9.4 관리자 페이지 상세에 교차 반영 필요 여부 점검. ✅ 2026-04-24
    - [x] **7B 필드별 마스터 매핑**: `docs/specs/requires/external-masters.md` 작성 완료 (커밋 b5836e9). 설비 마스터 MSSQL 스키마는 TBD로 문서 내 명시 — 담당자 자료 수집 후 §3 보완 예정. ✅ 2026-04-24
    - [x] **Phase 4 5-Expert 리뷰 잔여 7건** (v3 §8.1~8.7): AD 인증(`AUTH_MODE=mock|oidc`), Sub-task 용어 통일, 대시보드 API endpoint 표, 환경변수 `AUTH_MODE`/`LOG_LEVEL` 추가, 표준 에러 코드 목록(`INVALID_TRANSITION`/`FORBIDDEN`/`NOT_FOUND`/`VALIDATION_FAILED`/`EXTERNAL_MASTER_UNAVAILABLE` 등), 파일명 규칙(`{voc_id}/{uuid}-{원본파일명}`), KPI 목표값(MVP는 SC-1·SC-2·SC-3만 유지). ✅ 2026-04-24

### 6-2. 디자인 일관성 강제 체계
- [x] `design.md` §10 누락 토큰 추가 — `--status-*` 12개 + `--status-dot-*` 5개 (2026-04-24)
- [x] `design.md` §12 신규 — Token Architecture (tokens.ts 단일 소스, Tailwind/CSS vars 혼용 규칙, 사용 시나리오 매핑, 강제 체계) (2026-04-24)
- [x] `frontend/CLAUDE.md` 룰 보강 — Tailwind vs CSS vars 사용 규칙, hard rules (2026-04-24)
- [x] `tokens.ts` 단일 소스 → Tailwind config + CSS vars 자동 전파 **채택** (Tailwind CSS v4 혼용 결정, 2026-04-24)
- [ ] Stylelint (`stylelint-declaration-strict-value`) + ESLint `no-restricted-syntax` + husky → 6-4 스캐폴딩에서 같이 처리

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
