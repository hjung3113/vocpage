# VOC 시스템 요구사항 (Final)

## 문서 인덱스

| 문서 | 내용 |
|------|------|
| `requirements.md` (이 파일) | 개요·요구사항 정의·기술스택·DB 스키마·핵심 로직·확장성·성공 기준·테스트 전략·운영 설정 |
| `feature-voc.md` | VOC 핵심 기능 명세 — 상태 전환·권한·Priority·첨부·알림·Sub-task·분류 체계·목록 필터·페이지네이션 등 |
| `feature-notice-faq.md` | 공지사항 & FAQ 기능 명세 — 사이드바 구조·팝업 동작·Admin 관리 |
| `dashboard.md` | 대시보드 요구사항 명세 — 위젯 상세·글로벌 필터·API·상태 관리·수용 기준 |
| `design.md` | 디자인 시스템 — 색상 토큰·타이포그래피·컴포넌트·레이아웃 규칙 |

---

## 1. 프로젝트 개요
본 프로젝트는 분석 시스템 내부에 통합되는 **VOC(Voice of Customer) 서브 시스템**을 구축하는 것을 목표로 합니다. **Linear**의 간결한 UX와 **Jira**의 강력한 관리 기능을 결합하여, 사용자의 피드백을 효율적으로 수집하고 관리자가 체계적으로 대응할 수 있는 환경을 제공합니다.

---

## 2. 요구사항 정의 (Requirement Definition)

### 2.1 비즈니스 및 인프라 요구사항
- **시스템 통합:** 기존 분석 시스템의 왼쪽 네비게이션 구조를 유지하며 서브 페이지 형태로 작동.
- **인증 자동화:** 사내 AD(Active Directory) 연동을 통한 SSO(Single Sign-On) 구현. 연동 방식: **OIDC(OpenID Connect) / OAuth2** — 사내 Identity Provider(IdP)를 Authorization Server로 사용. 개발 환경: 실 AD 직접 연결 (mock 없음). 세션: httpOnly + SameSite=Strict 쿠키, 세션 만료 시 로그인 페이지 리다이렉트.
- **데이터 무결성:** PostgreSQL을 활용한 정규화된 DB 설계 및 확장성 확보.
- **품질 관리:** **TDD(Test-Driven Development)** 기반 개발을 통해 서비스 안정성 극대화.
- **인프라:** Docker 기반의 컨테이너화로 개발 및 운영 환경 일원화.

### 2.2 사용자(제보자) 요구사항
- **작성 편의:** **Toast UI Editor**를 활용한 리치 텍스트 편집(이미지 드래그 앤 드롭, 표, 파일 첨부).
- **분류 선택:** VOC 작성 시 시스템 → 메뉴 → 유형 순으로 드롭다운 선택. (자동 설정 없음)
- **진행 확인:** 본인 작성 VOC의 실시간 상태 확인 및 댓글 소통.

### 2.3 관리자 요구사항
- **업무 배정:** VOC별 담당자(Assignee) 지정 및 추적.
- **계층형 관리:** 하나의 이슈 아래 여러 하위 작업(Sub-task)을 생성하여 관리 (최대 1레벨: root → sub 단일 계층).
- **자동 분류:** 키워드를 활용한 **자동 태깅(Auto-tagging)** 기능 (규칙 기반, MVP).
- **상태 전환:** VOC 상태 변경 권한은 Manager/Admin으로 제한.
- **우선순위 설정:** Priority(Urgent/High/Medium/Low)는 Manager/Admin만 설정 가능.
- **삭제:** Soft Delete는 Admin 전용. User는 삭제 불가.
- **시스템/메뉴/유형/태그규칙/권한 관리:** Admin 전용.

---

## 3. 기술 스택 (Tech Stack)

| 구분 | 기술 스택 | 비고 |
| :--- | :--- | :--- |
| **Frontend** | Vite, React, TypeScript | Design md 스타일 적용 |
| **Backend** | Node.js 20 LTS (Express), TypeScript | OIDC 인증 미들웨어 |
| **Database** | PostgreSQL 16 | Self-join 및 M:N 관계 설계 |
| **Infra** | Docker, Docker Compose | 환경 일치 및 배포 편의성 |
| **Editor** | Toast UI Editor | 오픈소스 리치 텍스트 에디터 |
| **Testing** | Vitest (FE), Jest/Supertest (BE) | TDD 개발 수행 |
| **Data Fetching** | @tanstack/react-query | 대시보드 위젯별 독립 쿼리, staleTime 5분 |
| **Charts** | recharts | 대시보드 LineChart / BarChart (lazy import) |

---

## 4. 데이터베이스 설계 (Data Schema)

- **`users`**: 사내 유저 정보. 컬럼: `id(uuid)`, `ad_username`, `display_name`, `email`, `role(enum: user/manager/admin)`, `is_active`, `created_at`.
- **`systems`**: 시스템 목록. 컬럼: `id`, `name`, `slug(ASCII URL-safe, 전역 UNIQUE)`, `is_archived`. Admin이 관리 (추가/수정/아카이브).
- **`menus`**: 메뉴 목록. 컬럼: `id`, `system_id(FK→systems)`, `name`, `slug`, `is_archived`. Admin이 관리. 시스템 생성 시 "기타" 메뉴 자동 생성. `slug` 제약: `(system_id, slug)` 복합 UNIQUE.
- **`voc_types`**: VOC 유형 목록. 컬럼: `id`, `name`, `slug(전역 UNIQUE)`, `color(hex, e.g. #e5534b)`, `sort_order`, `is_archived`. Admin이 관리. 초기값: 버그/기능 요청/개선 제안/문의.
- **`vocs`**: VOC 메인 데이터. 컬럼: `id(uuid)`, `issue_code(unique, e.g. ANALYSIS-2025-0001)`, `sequence_no(시스템·연도 단위 유니크)`, `title`, `body(HTML)`, `status(enum: 접수됨/검토중/처리중/완료/보류)`, `priority(enum: urgent/high/medium/low, default medium)`, `type_id(FK→voc_types, NOT NULL)`, `system_id(FK→systems, NOT NULL)`, `menu_id(FK→menus, NOT NULL)`, `assignee_id`, `author_id`, `parent_id(self-join, 최대 1단계)`, `due_date(date, nullable — Priority 변경 시 자동 계산)`, `deleted_at`, `created_at`, `updated_at`.
- **`voc_history`**: 감사 로그. 상태·담당자·Priority 변경 이력 보존.
- **`tags` & `voc_tags`**: 태그 정보 및 VOC와의 다대다 매핑.
- **`tag_rules`**: 자동 태깅을 위한 키워드/규칙 저장소. <!-- v2 AI 태깅 전환 시 `confidence_threshold(float)`, `model_version` 컬럼 추가 예정 -->
- **`attachments`**: 컬럼: `id`, `voc_id`, `uploader_id`, `filename`, `mime_type`, `size_bytes`, `storage_path`, `created_at`. VOC당 최대 5개. 파일은 Docker volume(`/uploads`)에 로컬 저장.
- **`comments`**: 평면 구조(스레드 미지원). 컬럼: `id`, `voc_id`, `author_id`, `body(HTML)`, `created_at`, `updated_at`.
- **`notifications`**: 컬럼: `id`, `user_id`, `type(enum: comment/status_change/assigned)`, `voc_id`, `read_at`, `created_at`.
- **`dashboard_settings`**: 컬럼: `id(uuid)`, `user_id(FK→users, NULL=Admin 기본값)`, `widget_order(jsonb)`, `widget_visibility(jsonb)`, `widget_sizes(jsonb)`, `default_date_range(enum: 7d/30d/90d/custom)`, `heatmap_default_x_axis(enum: status/priority/tag)`, `locked_fields(jsonb)`, `updated_at`. `user_id IS NULL` 행이 Admin 기본값, 로그인 사용자별 개인 설정은 `user_id` 지정.
  - JSONB 컬럼 예시 구조:
    ```json
    { "widget_visibility": { "kpi": true, "heatmap": true, "trend": false },
      "widget_order": ["kpi", "distribution", "heatmap", "trend"],
      "widget_sizes": { "kpi": "full", "trend": "half" },
      "locked_fields": { "kpi_position": true, "widget_visibility.trend": true } }
    ```
- **`notices`**: 공지사항. 컬럼: `id(uuid)`, `title`, `body(HTML)`, `level(enum: normal/important/urgent)`, `is_popup(boolean)`, `is_visible(boolean)`, `visible_from(date)`, `visible_to(date)`, `author_id(FK→users)`, `deleted_at`, `created_at`, `updated_at`.
- **`faq_categories`**: FAQ 카테고리 동적 관리. 컬럼: `id`, `name`, `slug(UNIQUE)`, `sort_order`, `is_archived`.
- **`faqs`**: FAQ 항목. 컬럼: `id(uuid)`, `question`, `answer(HTML)`, `category_id(FK→faq_categories)`, `is_visible(boolean)`, `sort_order`, `author_id(FK→users)`, `deleted_at`, `created_at`, `updated_at`.

---

## 5. UI/UX 디자인 가이드 (Samsung Blue Style)

1. **메인 리스트:** 정갈한 테이블 UI. 이슈 ID, 제목, 상태, 담당자, 유형(색상 뱃지), 태그를 한 줄에 표시. 아코디언 형태로 하위 작업 노출.
2. **사이드바:** 시스템 목록이 아코디언 트리로 표시. 시스템 클릭 시 하위 메뉴 펼침. 메뉴 클릭 시 해당 메뉴 VOC 목록 필터링.
3. **사이드 드로어(Side Drawer):** 리스트 항목 클릭 시 우측에서 상세 화면 슬라이드. (분석 시스템의 맥락 유지)
4. **등록 모달:** 시스템 → 메뉴 → 유형 순 연계 드롭다운. 시스템 선택 시 해당 시스템의 메뉴만 표시.

---

## 6. 핵심 로직 및 함수 정의

### 6.1 Backend (Express)
- `validateADSession`: OIDC 인증 미들웨어. 사내 IdP로부터 발급된 ID 토큰 검증 (JWT 서명 + iss/aud/exp 클레임 확인). 세션: httpOnly + SameSite=Strict + Secure 쿠키. 만료 시 401 반환 → FE에서 로그인 페이지 리다이렉트. CSRF 방어: SameSite=Strict 쿠키로 충분 (별도 CSRF 토큰 불필요).
- `createVOC`: 본문 분석 후 자동 태그(Level 1, 2) 적용 및 저장.
- `getVOCList`: 계층형 구조(Parent-Child)를 고려한 데이터 조회. 부모 VOC가 필터 조건 일치 시 Sub-task 함께 표시. Sub-task 단독으로는 상위 목록 미노출. 페이지네이션 단위: 부모 VOC 기준.
- `updateVOCStatus`: 이슈 상태 변경 및 관리자 배정 로직.
- **에러 응답 표준 포맷**: 모든 API 오류는 `{ "code": "ERROR_CODE", "message": "사람이 읽을 수 있는 설명", "details": {} }` JSON으로 응답.
- **헬스체크**: `GET /api/health` → `{ "status": "ok", "db": "ok" }` (DB 연결 포함 확인). 인증 불필요.
- **공통 쿼리 파라미터**: 대시보드 API는 `?systemId=&menuId=&assigneeId=&from=&to=` 공통 필터 지원 (§11.7 참조).

### 6.2 Frontend (React)
- `useVOCFilter`: 메뉴/상태/태그별 복합 필터링 훅.
- `useDrawer`: 상세 보기 드로어 제어 및 상태 동기화.
- **상태 관리:** React Context (MVP — 규모 충분). Redux는 확장성 필요 시 v2에서 검토.

---

## 7. 향후 확장성

- **이메일 알림 (v2):** 사내 이메일 시스템 연동 (사내 시스템 접근 후 구현). 우선순위 1순위. — MVP에서 인앱 알림(30초 폴링)만으로는 Urgent VOC 누락 우려가 있어 v2 1순위로 지정.
- **AI 자동 분류 (v2):** LLM API를 통한 고도화된 자동 태깅. 우선순위 2순위. (`tag_rules`에 `confidence_threshold float`, `model_version text` 컬럼 추가 예정)
- **FTS 검색 (v2):** PostgreSQL Full-Text Search 도입. 우선순위 3순위.
- **SLA 에스컬레이션 (v2):** Due Date 초과 시 자동 알림/에스컬레이션. 우선순위 4순위.
- **데이터 분석:** VOC 데이터를 기반으로 한 분석 시스템 메뉴별 장애/개선 통계 리포트 생성.
- **Jira 데이터 마이그레이션:** 기존 Jira 이슈를 VOC 시스템으로 1회성 이전. **타이밍: 오픈 전 일괄 이전** (Jira CSV export → 변환 스크립트 → DB import). 오픈 이후 신규 VOC는 수동 등록. 구현 전 Jira 필드 매핑 확인 필요.
- **Out of scope (MVP):** 이메일/슬랙 알림, SLA 에스컬레이션, 전문 검색(FTS), 2단계 이상 Sub-task 계층, AI 태깅, 벌크 상태 변경.

---

## 8. 상세 기능 명세

> 상세: `docs/specs/requires/feature-voc.md`

핵심 기능 범위: VOC 식별자(Issue Code) / 상태 전환 / 권한 모델 / Priority & Due Date / 파일 첨부 / 인앱 알림 / Sub-task / 분류 체계(시스템·메뉴·유형·태그) / 삭제 정책 / 입력 제한 / 목록 필터·검색·페이지네이션 / 파일 저장소 / 댓글 정책 / 알림 폴링 / 기존 시스템 통합

---

## 9. 프로토타입 리뷰 기반 추가 요구사항 (2026-04-21)

> 상세: `docs/specs/requires/feature-voc.md` §9

핵심 내용: 필터 고급 옵션 / 서브태스크 진입점 / 첨부파일 UI / 관리자 페이지 상세 / 정렬 옵션 / 검색 하이라이팅 / 댓글 인라인 편집 / 페이지네이션 / VOC 전체화면 전환 / MVP 제외 항목

---

## 10. 공지사항 & FAQ (2026-04-21 추가 요구사항)

> 상세: `docs/specs/requires/feature-notice-faq.md`

핵심 내용: 사이드바 네비게이션 구조 / 공지사항(데이터 필드·팝업 동작·관리 기능) / FAQ(아코디언·카테고리 필터·관리 기능) / Admin 탭 확장

---

## 11. 대시보드 (Dashboard)

- **대상**: Manager / Admin 전용 (User 접근 불가 — FE role guard + BE 403 이중 방어)
- **목적**: VOC 운영 현황 요약 + 트렌드 분석 복합 대시보드
- **진입점**: 사이드바 '대시보드' 메뉴 (담당 VOC 아래, 시스템 트리 위)
- **SLA 목표**: 준수율 **70% 이상** (§12 성공 기준 SC-1)
- **위젯**: KPI 8종 / 분포 탭(4종) / 우선순위×상태 매트릭스 / 드릴다운 히트맵 / 주간 트렌드(3선) / 태그별 분포 / 현황 카드 / 담당자별 처리 현황 / 장기 미처리 Top 10 / 처리속도 / 에이징
- **상세 요구사항**: `docs/specs/requires/dashboard.md`
- **구현 계획**: `docs/specs/plans/dashboard-impl.md`

---

## 12. 성공 기준 (Success Criteria)

시스템 오픈 후 3~6개월 기준으로 아래 3가지 지표를 모두 달성하면 성공으로 판단한다.

| # | 지표 | 목표 | 측정 방법 |
|---|---|---|---|
| SC-1 | SLA 준수율 | **70% 이상** 유지 | 대시보드 `처리속도` 위젯 — Due Date 내 완료 건수 / 전체 완료 건수 |
| SC-2 | Jira 완전 전환 | Jira에서 신규 VOC **0건** | Jira 보드 모니터링 (수동 확인) |
| SC-3 | Due Date 내 처리 | Priority별 Due Date 내 처리율 SLA 기준 동일 | `GET /api/dashboard/processing-speed` slaRate 컬럼 |

- SLA 계산 기준: Due Date = Priority 변경 시점 기준 자동 계산값 (§8.4.1)
- 측정 주기: 월 1회 대시보드 스냅샷 캡처 → 운영팀 리뷰

---

## 13. 테스트 전략 (Test Strategy)

### 13.1 테스트 레이어 구분

| 레이어 | 도구 | 대상 | 커버리지 목표 |
|---|---|---|---|
| Unit | Vitest (FE) / Jest (BE) | 비즈니스 로직, 유틸 함수, React Hook | BE 70% / FE 60% |
| Integration | Jest + Supertest | API 엔드포인트 (실 DB 연결) | 핵심 CRUD + 권한 시나리오 100% |
| E2E | Playwright | 주요 사용자 플로우 | 핵심 플로우 (아래 목록) |

### 13.1.1 인수 조건(AC) 작성 형식

모든 통합 테스트는 아래 형식으로 작성한다:

```
Given [초기 상태/전제]
When  [액션/요청]
Then  [기대 결과/응답]
```

예시 (상태 전환):
```
Given Manager가 로그인된 상태, VOC가 '접수됨' 상태
When  PATCH /api/vocs/:id/status { status: '처리중' } 요청
Then  400 반환, body: { code: 'INVALID_TRANSITION', message: '접수됨 → 처리중 전환 불가' }
```

예시 (권한):
```
Given User 역할로 로그인된 상태
When  PATCH /api/vocs/:id/status { status: '검토중' } 요청
Then  403 반환, body: { code: 'FORBIDDEN' }
```

### 13.2 통합 테스트 필수 대상

- 권한 매트릭스(§8.3) 전체 행: User/Manager/Admin 역할별 API 접근 허용/거부
- 상태 전환 매트릭스(§8.2): 불허 전환 시 400/403 반환
- 파일 업로드 경계값: 10MB 초과(413), SVG(415), 6번째 파일(400)
- issue_code 원자성: 동시 VOC 생성 시 중복 없음
- Soft Delete: 삭제된 VOC의 일반 API 미노출, Admin `?includeDeleted=true` 조회

### 13.3 E2E 핵심 플로우

1. User — VOC 작성 → 상태 확인 → 댓글 작성
2. Manager — VOC 배정 → 상태 전환 → 대시보드 KPI 확인
3. Admin — 시스템 추가 → 메뉴 추가 → VOC 삭제/복원

### 13.4 성능 기준

- 목록 조회 API (`GET /api/vocs`): p95 < 500ms (VOC 1,000건 기준)
- 대시보드 집계 API: p95 < 1,000ms (staleTime 5분으로 실부하 완화)
- 파일 업로드: 10MB 파일 업로드 < 5s

---

## 14. 운영 설정 (Operations)

### 14.1 환경변수 목록

| 변수 | 예시 | 설명 |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@db:5432/vocpage` | PostgreSQL 연결 문자열 |
| `OIDC_ISSUER` | `https://auth.internal` | 사내 IdP issuer URL |
| `OIDC_CLIENT_ID` | `vocpage-app` | OIDC 클라이언트 ID |
| `OIDC_CLIENT_SECRET` | `...` | OIDC 클라이언트 시크릿 |
| `SESSION_SECRET` | `...` | 세션 쿠키 서명 키 (32자+ 랜덤) |
| `INIT_ADMIN_EMAIL` | `admin@company.com` | 초기 Admin seed 계정 |
| `UPLOAD_DIR` | `/uploads` | 파일 업로드 루트 경로 |
| `PORT` | `3000` | BE 서버 포트 |
| `NODE_ENV` | `production` | 환경 구분 |

### 14.2 Docker 구성 개요

```
services:
  frontend:   node:20-alpine, Vite build → nginx 서빙, port 80
  backend:    node:20-alpine, Express, port 3000
              volume: /uploads (파일 저장소)
  db:         postgres:16-alpine, port 5432
              volume: /var/lib/postgresql/data (데이터 영속성)

networks: 내부 bridge (frontend ↔ backend ↔ db)
```

- 운영 환경: `UPLOAD_DIR` volume을 호스트 경로에 마운트하여 백업 대상 포함
- 환경 분리: `.env.production` / `.env.development` 파일로 환경변수 관리

### 14.3 헬스체크 & 로깅

- **헬스체크**: `GET /api/health` (인증 불필요) → `{ "status": "ok", "db": "ok", "uptime": 123 }`
- **로그 포맷**: JSON 구조화 로그 (`{ timestamp, level, message, requestId, userId }`)
- **로그 레벨**: `error` (운영), `info` (개발), `debug` (로컬)
- **로그 보존**: 컨테이너 stdout → 호스트 로그 드라이버 위임 (별도 로그 수집 시스템은 MVP 외)

### 14.4 백업 & 롤백

**DB 백업**
- `pg_dump` 일 1회 (새벽 3시) cron → 호스트 `/backup/db/` 경로에 `.sql.gz` 보관
- 보존 기간: 30일

**파일 백업**
- Docker volume `/uploads` → 호스트 마운트 경로를 OS 레벨 백업 도구로 포함

**롤백 전략**
- Docker 이미지에 Git SHA 태그 부여 (`vocpage-backend:abc1234`). 장애 시 이전 태그 이미지로 `docker compose up` 재기동.
- DB 마이그레이션 실패 시: `pg_restore`로 직전 백업 복원. 마이그레이션은 항상 rollback 스크립트 쌍으로 작성.
- 배포 전 체크리스트: 헬스체크 `GET /api/health` 응답 확인 → 정상이면 이전 컨테이너 중단.
