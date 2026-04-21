# vocpage — 다음 세션 태스크 계획

> 작성일: 2026-04-22  
> 목표: 디자인 리뷰 → 요구사항 확정 → 구현 준비

---

## Phase 1: 디자인 리뷰 & 통일화

### 1-1. 정보 페이지 디자인 리뷰 (2개)
- [ ] 공지사항 페이지 (`notice`) — VOC 페이지 디자인 토큰/컴포넌트와 비교 리뷰
- [ ] FAQ 페이지 (`faq`) — 동일 기준 리뷰
- 체크 항목: 색상 토큰, 타이포, 간격(8px grid), 배지 스타일, 탭 스타일 일관성

### 1-2. 관리자 페이지 디자인 리뷰 (6개)
- [ ] 사용자 관리 (`admin/users`)
- [ ] 태그 규칙 관리 (`admin/tag-rules`)
- [ ] 카테고리 관리 (`admin/categories`)
- [ ] 공지사항 관리 (`admin/notices`)
- [ ] FAQ 관리 (`admin/faq`)
- [ ] 시스템 설정 (`admin/settings`)
- 체크 항목: 관리자 topbar/sidebar 일관성, 테이블 row height, 폼 컴포넌트 스펙

### 1-3. VOC 페이지 기준 디자인 통일
- [ ] 정보 2 + 관리자 6 페이지에서 VOC 페이지와 차이나는 항목 목록화
- [ ] prototype.html 내 토큰/컴포넌트 직접 수정으로 통일
- 기준: `design.md §10 CSS Reference` 토큰

---

## Phase 2: 피드백 반영 → 디자인·요구사항 확정

- [ ] 리뷰 결과를 `design.md`에 반영 (영어, 비주얼 스펙만)
- [ ] 기능 변경이 생기면 `requirements.md`에 반영 (한국어, 기능 스펙만)
- [ ] prototype.html 최종 상태 = 확정 디자인 기준점으로 커밋

---

## Phase 3: 구현 전 준비

### 3-1. 디자인 일관성 강제 체계
- [ ] `design.md`에서 CSS 변수 토큰 목록 추출 → 컴포넌트별 토큰 사용 규칙 문서화
- [ ] 구현 시 임의 하드코딩 색상/간격 금지 규칙을 CLAUDE.md에 추가
- [ ] (선택) ESLint 커스텀 룰 또는 Stylelint 설정으로 토큰 이탈 감지

### 3-2. 백엔드 테스트 작성 전략
- [ ] 테스트 범위 정의: 단위(서비스 레이어), 통합(API 엔드포인트), E2E(주요 플로우)
- [ ] 테스트 픽스처/시드 전략 결정 (PostgreSQL 테스트 DB vs 인메모리)
- [ ] 각 API 엔드포인트별 테스트 케이스 목록 작성 (requirements.md §API 참조)
- [ ] Jest + Supertest 설정 파일 + 샘플 테스트 1개 작성 (구현 전 틀만)

### 3-3. 스캐폴딩 & 개발환경 설정
- [ ] 프로젝트 초기 셋업 순서 확정 (Docker Compose 기반 → BE → FE 순서 권장)
- [ ] ESLint + Prettier 공통 설정 (FE/BE 각각, 공통 규칙 공유)
- [ ] `.env` 구조 설계 및 Docker Compose 환경변수 관리 방식 결정 (`.env.example` 작성)

### 3-4. FE-BE API 계약
- [ ] OpenAPI spec 또는 공유 타입 방식 결정 — 타입 불일치 방지 (예: `shared/types/` 패키지)
- [ ] BE 완성 전 FE 개발용 Mock API 전략 결정 (MSW vs json-server)
- [ ] 주요 API 엔드포인트 응답 형태 사전 정의 (requirements.md §API 기반)

### 3-5. 인증 Mock 전략 ⚠️ 블로킹 위험
- [ ] `validateADSession` 미들웨어 환경별 bypass 방식 결정 (`NODE_ENV=development` 시 mock user 주입)
- [ ] 개발용 mock 사용자 픽스처 정의 (role: admin / user 각 1개)
- [ ] 실 AD 없이 전체 플로우 개발 가능한 상태 확인

### 3-6. DB 마이그레이션 & 시드 전략
- [ ] 마이그레이션 방식 결정 (수동 SQL 파일 vs node-pg-migrate vs Flyway)
- [ ] 마이그레이션 파일 구조 및 명명 규칙 결정
- [ ] prototype.html 예시 데이터 기반 시드 fixture 작성 계획

### 3-7. 상태 관리 방식 확정
- [ ] React Context vs Redux 결정 — requirements.md에서 열려있는 항목 확정
- [ ] 전역 상태 범위 정의: filter 상태, 선택된 VOC, drawer 열림 여부
- [ ] 결정 내용 requirements.md에 반영

### 3-8. Prototype → 실구현 동일 재현 플로우
- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## 완료 조건

- [ ] prototype.html이 확정 디자인 기준으로 커밋됨
- [ ] design.md + requirements.md 최종 리뷰 반영 완료
- [ ] 구현 준비 문서 (테스트 전략 + 컴포넌트 매핑) 작성 완료
- [ ] CLAUDE.md 디자인 토큰 규칙 추가
- [ ] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [ ] 상태 관리 방식 결정 → requirements.md 반영
- [ ] API 계약 방식 결정 + Mock API 전략 확정
