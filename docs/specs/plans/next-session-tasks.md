# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-23  
> 목표: 프로토타입 확정 → 문서 정비 → 구현 준비

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

## Phase 3: 요구사항 문서 인덱스화

> **선행 조건**: Phase 2 완료 (내용이 완성돼야 목차가 의미있음)

- [ ] `requirements.md` 상단에 섹션 인덱스(앵커 링크) 추가
- [ ] 각 섹션에 "읽어야 할 상황" 한 줄 메모 추가 (세션 시작 시 필요한 부분만 선택적으로 읽도록)
- [ ] `claude-progress.txt` 및 세션 가이드에 "어떤 작업에 어느 섹션을 읽을 것" 매핑 추가

---

## Phase 4: 설계 과정 문서 정리

> **선행 조건**: Phase 3 완료 (인덱스 완성 후 어떤 파일이 중복인지 판단 가능)

- [ ] 보존 대상 확정: `docs/specs/requires/requirements.md`, `docs/specs/requires/design.md`
- [ ] 정리 대상 식별: `docs/specs/plans/dashboard-feature.md`, `docs/specs/reviews/` 내 파일들 등
- [ ] 정리 대상 파일 아카이브 또는 삭제 (requirements.md에 이미 통합됐으면 삭제)
- [ ] `docs/specs/plans/`, `docs/specs/reviews/` 디렉토리 내 잔여 파일 정리

---

## Phase 5: CLAUDE.md 분리

> **선행 조건**: Phase 4 완료 (참조할 파일 경로·구조가 확정된 후 split 가능)

- [ ] 현재 `CLAUDE.md` 내용을 4개 단위로 분리:
  - `frontend/CLAUDE.md` — FE 스택, 컴포넌트 규칙, 상태 관리, 테스트
  - `backend/CLAUDE.md` — BE 스택, API 설계, 인증 미들웨어, DB 마이그레이션
  - `prototype/CLAUDE.md` — 프로토타입 작업 규칙, 디자인 토큰 사용 기준
  - `CLAUDE.md` (프로젝트 루트) — 공통 규칙, 문서 구조, 세션 가이드, 아키텍처 개요만
- [ ] 루트 `CLAUDE.md` 200줄 이내로 유지
- [ ] `.claude/CLAUDE.md` 업데이트 (분리된 파일 경로 반영)

---

## Phase 6: 구현 전 준비

> **선행 조건**: Phase 1~5 완료 — 스펙·문서 완비 후 구현 진입

### 6-1. 피드백 반영 → 스펙 최종 확정
- [ ] 리뷰 결과를 `design.md`에 반영 (영어, 비주얼 스펙만)
- [ ] 기능 변경 시 `requirements.md`에 반영 (한국어, 기능 스펙만)
- [ ] `prototype/prototype.html` 최종 상태 = 확정 디자인 기준점으로 커밋

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

## 전체 완료 조건

- [ ] prototype.html 대시보드 + 전 페이지 — 확정 디자인 기준으로 커밋
- [ ] `requirements.md` + `design.md` — 단일 출처로 완비, 인덱스 포함
- [ ] 설계 과정 잔여 문서 정리 완료
- [ ] CLAUDE.md frontend / backend / prototype / project 단위로 분리
- [ ] 구현 준비 문서 (테스트 전략 + 컴포넌트 매핑) 작성 완료
- [ ] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [ ] 상태 관리 방식 결정 → requirements.md 반영
- [ ] API 계약 방식 결정 + Mock API 전략 확정
