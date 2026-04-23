# 🚀 VOC 시스템 구축 프로젝트 기획서 (Final)


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

### 8.1 VOC 식별자 (Issue Code)
- 형식: `{시스템슬러그}-{yyyy}-{순번4자리}` (예: `ANALYSIS-2025-0001`)
- 시스템 슬러그는 ASCII URL-safe 문자열로 저장 (예: `analysis`, `pipeline`). `issue_code`에는 슬러그 값을 대문자로 사용.
- 시스템별·연도별 독립 순번. 삭제된 VOC의 순번은 재사용하지 않음 (증가 전용).
- 시스템명 변경 후에도 기존 VOC의 `issue_code`는 불변.
- 동시 생성 경합은 DB sequence로 원자성 보장.
  - sequence 이름 규칙: `seq_{system_slug}_{yyyy}` (예: `seq_analysis_2025`).
  - 연도 전환: 매년 1월 1일 신규 sequence 자동 생성 (DB 트리거 또는 초기화 스크립트).
- 순번 상한 9999 초과 시 5자리로 자동 확장 (`0001` → `00001`).

### 8.2 상태 전환 매트릭스

| 현재 상태 | 가능한 다음 상태 | 권한 |
|:---|:---|:---|
| 접수됨 | 검토중 | Manager, Admin |
| 검토중 | 처리중, 보류 | Manager, Admin |
| 처리중 | 완료, 보류 | Manager, Admin |
| 완료 | 처리중 (재오픈) | Manager, Admin |
| 보류 | 검토중, 처리중 | Manager, Admin |

- 상태 변경 시 `voc_history`에 이력 기록 (변경 전·후 상태, 변경자, 타임스탬프).
- 상태 변경 시 VOC 작성자 및 담당자에게 인앱 알림 발송.
- 미완료 Sub-task가 있는 부모 VOC를 '완료'로 전환 시 경고 메시지 후 강제 진행 가능. Sub-task 상태는 변경되지 않으며 담당자가 개별 처리.

### 8.3 권한 모델

| 기능 | User | Manager | Admin |
|:---|:---:|:---:|:---:|
| VOC 작성 | ✅ | ✅ | ✅ |
| 본인 VOC 조회 | ✅ | ✅ | ✅ |
| 전체 VOC 조회 | ❌ | ✅ | ✅ |
| 상태 변경 | ❌ | ✅ | ✅ |
| 담당자 배정 | ❌ | ✅ | ✅ |
| Priority 설정 | ❌ | ✅ | ✅ |
| VOC Soft Delete | ❌ | ❌ | ✅ |
| 시스템/메뉴/유형/태그규칙 관리 | ❌ | ❌ | ✅ |
| 사용자 권한 관리 | ❌ | ❌ | ✅ |
| 태그 수동 편집 | ❌ | ✅ | ✅ |
| 공지사항 작성/관리 | ❌ | ✅ | ✅ |
| FAQ 작성/관리 | ❌ | ✅ | ✅ |
| 공지사항 복원 | ❌ | ❌ | ✅ |

- Admin과 Manager의 기능 권한은 동일. Admin은 Manager 관리(역할 부여/회수) 권한이 추가된 역할.
- Manager는 Admin과 동일하게 전체 VOC를 조회할 수 있으나, Soft Delete/시스템·메뉴·유형·태그규칙·사용자 권한 관리 기능만 제외.
- 최초 Admin 계정: 서버 초기화 시 환경변수 `INIT_ADMIN_EMAIL` 지정 계정을 admin role로 seed.
- 퇴직·부서이동 시 역할 회수 및 `is_active` 비활성화는 Admin이 수동 처리.
- 마지막 Admin 강등 불가 판정 기준: `is_active = true AND role = 'admin'` 인 계정 수 ≥ 2일 때만 강등 가능. 권한 변경 API에서 트랜잭션 내 사후 Admin 수 검증.
- 본인의 권한을 본인이 변경 불가.

### 8.4 Priority

- 4단계: `urgent` / `high` / `medium` (기본값) / `low`
- 생성 시 서버에서 `medium`으로 강제 설정 (클라이언트 값 무시).
- Manager/Admin만 변경 가능. 변경 이력은 `voc_history`에 기록.

#### 8.4.1 Due Date 자동 설정

| Priority | 기본 처리 기한 |
|---|---|
| urgent | 생성일 + 7일 |
| high | 생성일 + 14일 |
| medium | 생성일 + 30일 |
| low | 생성일 + 90일 |

- VOC 생성 시 Priority 기반으로 `due_date` 자동 계산 후 저장.
- Priority 변경 시 `due_date` 자동 재계산.
- Manager/Admin은 개별 VOC의 `due_date` 수동 수정 가능 (수동 수정 시에도 Priority 재변경이면 재계산).
- `due_date` 변경 이력은 `voc_history`에 기록.

### 8.5 파일 첨부

- 허용 형식: PNG, JPG, GIF, WebP (이미지만)
- 최대 크기: 10MB / 파일
- 최대 개수: 5개 / VOC (본문 기준. 댓글 이미지는 별도)
- 업로드 검증: MIME 스니핑 + 확장자 일치 검증. 실행 파일 헤더 차단. SVG 명시적 차단 (XSS 위험).
- 파일 서빙: `Content-Disposition: attachment` 강제 (인라인 렌더링 방지).
- GIF 크기 검증: 원본 파일 바이트 기준 (디코딩 전 raw bytes).
- **파일명 저장**: 업로드 시 UUID로 rename하여 저장 (path traversal 방어). 원본 파일명은 `attachments.filename` 컬럼에 별도 보존.
- 오류 응답: 용량 초과 → 413, 형식 불일치 → 415, 5개 초과 → 400.

### 8.6 인앱 알림

- **발생 조건:**
  - 내 VOC에 타인이 댓글 작성 (본인 댓글은 알림 미발생)
  - 내 VOC의 상태 변경
  - 나에게 담당자 배정
- **UI:** 벨 아이콘 + 미읽음 배지(최대 표시 99+). 클릭 시 알림 패널 열림 및 읽음 처리. **Urgent VOC 관련 알림(배정·상태변경)은 벨 아이콘 옆에 빨간 느낌표(🔴!) 배지 추가** — 일반 알림 배지와 시각 구분. 느낌표 배지는 해당 Urgent 알림을 읽으면 해제.
- **보관:** 최근 50건 표시. 51번째부터 오래된 순 삭제. 단, 30일 이후 알림은 읽음 처리 후 자동 삭제. 두 기준 중 먼저 도달한 쪽 적용.
- **중복 억제:** 동일 VOC에서 같은 유형의 알림은 5분 내 디바운스.

### 8.7 Sub-task

- 1레벨만 허용: `vocs` → Sub-task. Sub-task의 Sub-task 생성 불가 (DB 제약으로 강제).
- Sub-task ID: `{parent-issue-code}-{N}` (예: `ANALYSIS-2025-0001-1`)
  - N은 자연수(1, 2, 3…). 패딩 없음. 상한 없음 (999 초과 시 4자리 그대로 사용).
  - 삭제 후 번호 재사용 금지 (증가 전용, 부모 VOC 순번과 동일 원칙).
- Sub-task는 독립적인 상태·담당자·Priority·유형 보유.
- Sub-task의 시스템/메뉴는 부모 VOC에서 상속 (변경 불가).
- 부모 VOC Soft Delete 시 Sub-task도 cascade soft delete.

### 8.8 분류 체계 (시스템 / 메뉴 / 유형)

#### 시스템 (System)
- VOC가 속한 최상위 업무 영역. VOC 작성 시 필수 선택.
- Admin이 시스템 목록 추가/수정/아카이브 가능.
- 사용 중인 시스템 아카이브 시 신규 VOC에서 선택 불가, 기존 데이터 유지.
- 시스템명 변경 시 기존 `issue_code` 불변.

#### 메뉴 (Menu)
- 시스템 내 세부 기능/메뉴 영역. VOC 작성 시 **필수 선택** (NOT NULL).
- 선택된 시스템에 속한 메뉴 목록만 표시 (연계 드롭다운).
- 시스템 생성 시 "기타" 메뉴 자동 생성 (메뉴 없는 시스템 방지).
- Admin이 메뉴 목록 추가/수정/아카이브 가능.
- 사용 중인 메뉴 아카이브 시 기존 데이터 유지, 신규 VOC에서 선택 불가.
- 선택한 시스템에 활성 메뉴가 없으면 드롭다운 비활성화 + "이 시스템에 등록된 메뉴가 없습니다" 안내 문구 표시.
- Sub-task의 메뉴는 부모 VOC에서 상속 (변경 불가).

#### 유형 (Type)
- VOC의 성격 분류. 생성 시 작성자가 필수 선택.
- Admin이 유형 추가/수정/아카이브 가능 (`voc_types` 테이블). 속성: 이름, 슬러그, 색상(hex).
- 초기 기본값 4개:
  - 버그 (`#e5534b`)
  - 기능 요청 (`#5e6ad2`)
  - 개선 제안 (`#2da44e`)
  - 문의 (`#8a8f98`)
- 사용 중인 유형 아카이브 시 기존 데이터 유지, 신규 VOC에서 선택 불가.
- Sub-task의 유형은 부모와 독립적으로 선택 가능.

#### 태그 (Tag)
- 자동 태깅 전용 — 작성자(User)가 수동으로 태그 추가/삭제 불가.
- 키워드/정규식 규칙 기반으로 VOC 생성 시 자동 부여.
- Admin/Manager는 오탐 정정을 위해 개별 VOC의 태그를 수동으로 추가/삭제 가능 (이력은 `voc_history`에 기록).
- 유형과 역할 구분: 유형은 성격 분류(1개), 태그는 토픽 클러스터링(N개).

### 8.9 삭제 정책

- Soft Delete: `deleted_at = NOW()` 기록. 물리 삭제 없음.
- Admin만 삭제 가능. 삭제된 VOC는 일반 목록 API에서 제외.
- Admin은 `?includeDeleted=true` 파라미터로 삭제된 항목 조회/복원 가능.
- Soft Delete된 VOC의 첨부파일: Admin만 `?includeDeleted=true`로 접근 가능. 일반 User/Manager: 404 반환.

### 8.10 입력값 제한

- VOC 제목: 최대 200자
- VOC 본문: 최대 64KB (HTML)
- 댓글: 최대 16KB (HTML), Toast UI Editor 사용
- 댓글 이미지: 파일당 5MB 이하, 최대 5개/댓글
- 시스템명/메뉴명: 최소 2자·최대 20자 (공백 포함, 한글/영문/숫자/주요특수문자 허용). URL-safe slug(ASCII) 병행 저장.

### 8.11 VOC 목록 필터/검색/페이지네이션

- **필터 항목:** 상태(다중 선택), 시스템(단일), 메뉴(단일, 시스템 선택 시 활성화), 유형(다중 선택), 담당자(단일)
- **텍스트 검색:** 제목 + 본문 대상 SQL `ILIKE '%keyword%'`. MVP에서는 FTS 미사용.
- **필터·검색 스코프:** 해당 사용자가 조회 가능한 VOC 범위로 자동 제한 (User는 본인 VOC 내에서만 동작).
- **페이지네이션:** 오프셋 기반. 페이지당 항목 수는 §9.8 동적 계산 공식 적용. `GET /api/vocs?page=1&limit={N}&status=접수됨&priority=urgent,high&systemId=...&menuId=...&type=bug&assigneeId=...&q=keyword&sort=created_at&order=desc`
- **정렬:** 기본 `created_at DESC`. `?sort=issue_code|title|status|assignee|priority|created_at&order=asc|desc` 지원.
- **계층형 표시:** 부모 VOC가 필터 조건에 일치하면 해당 Sub-task를 들여쓰기 형태로 함께 표시. Sub-task 단독으로는 상위 목록에 미노출. 페이지네이션 단위: 부모 VOC 기준 (Sub-task는 건수 미계산).

### 8.12 파일 저장소

- 첨부 파일은 BE 컨테이너의 Docker volume(`/uploads/{voc_id}/`)에 저장.
- 댓글 이미지 저장 경로: `/uploads/comments/{comment_id}/`. `attachments` 행 별도 생성 없음 (Toast UI Editor 업로드 엔드포인트 별도 운영).
  - 댓글 이미지: 파일당 5MB, 최대 5개/댓글 (§8.10과 동일).
- 정적 파일 서빙: Express `static` 미들웨어 또는 별도 `/files/:id` 엔드포인트로 인증 후 제공.
- 운영 환경에서는 volume을 호스트 경로에 마운트하여 백업 대상 포함.

### 8.13 댓글 수정/삭제 정책

- **수정:** 본인이 작성한 댓글만 수정 가능. 수정 시 `updated_at` 갱신 및 UI에 "(수정됨)" 표시.
- **삭제:** 본인이 작성한 댓글 삭제 가능(Hard Delete). Admin은 모든 댓글 삭제 가능.
  - 댓글은 의도적 Hard Delete — 댓글은 감사 로그 대상이 아니며, VOC 본문·상태·담당자·Priority 변경만 `voc_history`로 추적.
- VOC 작성자 본인의 댓글에는 수정/삭제 버튼 노출, 타인 댓글에는 미노출.

### 8.14 인앱 알림 폴링

- FE에서 30초 주기로 `GET /api/notifications/unread-count` 호출하여 배지 업데이트.
- 알림 패널 열릴 때 `GET /api/notifications` 전체 목록 조회 및 일괄 읽음 처리.
- 탭이 비활성(hidden) 상태일 때는 폴링 일시 중단 (`document.visibilityState` 활용).
- **폴링 캐시 전략:** `GET /api/notifications/unread-count`는 서버에서 `ETag` 응답 헤더 반환. FE는 이후 요청에 `If-None-Match` 헤더 포함 → 변경 없으면 304 반환 (body 없음). 동시 접속자 N명 × 30초 폴링의 서버 부하를 ETag 304로 완화.
- **폴링 에러 처리:** 네트워크 오류/5xx → 최대 3회 재시도 (exponential backoff: 1s → 2s → 4s). 401 → 세션 만료 처리 (로그인 페이지 리다이렉트).

### 8.15 기존 분석 시스템 통합

- VOC 시스템은 **독립 React SPA**로 별도 빌드·배포 (예: `https://voc.internal`).
- 분석 시스템의 네비게이션 메뉴에서 VOC 시스템 URL로 **링크 이동** 방식으로 연결.
- 인증: AD SSO 세션을 공유하여 별도 로그인 없이 진입 가능하도록 구성.
- iframe 임베드는 현재 범위 밖 — 향후 필요 시 독립 SPA를 iframe으로 감싸는 방향으로 확장.

---

## 9. 프로토타입 리뷰 기반 추가 요구사항 (2026-04-21)

### 9.1 필터 고급 옵션
- **담당자 필터:** 담당자 단일 선택으로 VOC 목록 필터링 (기존 8.11에 명시된 내용 구체화)
- **우선순위 필터:** Urgent/High/Medium/Low 다중 선택 가능
- **태그 필터:** 등록된 태그 기준 다중 선택 필터

### 9.2 서브태스크 생성 진입점
- Sub-task 추가 UI는 **드로어 하단 인라인 폼 한 곳만** 유지. 헤더 아이콘 버튼(중복 진입점) 제거.
- 드로어 하단 폼: 제목 입력 + (선택) 유형 선택 → 저장/취소 버튼. 유형 미선택 시 부모 VOC 유형과 동일하게 기본 적용.
- 저장 시 `{parent-code}-{N}` 형식 코드 자동 부여, 목록에 즉시 반영.
- 부모 VOC가 이미 Sub-task인 경우 하단 폼 비활성화 (1레벨 제한, 안내 문구 표시).

### 9.3 첨부파일 UI 명세
- **등록 모달:** 본문 에디터 하단에 드래그앤드롭 영역 + 파일 선택 버튼 노출
- **드로어 상세:** "첨부파일" 섹션 추가, 파일명/크기/삭제 버튼 표시
- 허용 형식·크기 제한은 기존 8.5 그대로 적용 (PNG·JPG·GIF·WebP, 10MB/개, 5개/VOC)
- 파일 선택 즉시 목록에 표시, 등록 완료 전까지는 미리보기 상태

### 9.4 관리자 페이지 상세 명세

#### 9.4.1 태그 규칙 관리
- 테이블: 키워드 목록(쉼표 구분) | 생성 태그명 | 매칭 방식(키워드) | 작업(수정/삭제)
- "규칙 추가" 버튼 → 인라인 입력 폼
- 규칙 삭제 시 확인 다이얼로그 없이 즉시 삭제 (프로토타입 한정)

#### 9.4.2 시스템/메뉴 관리
- **시스템 테이블:** 시스템명 | 슬러그 | VOC 수 | 상태(활성/아카이브) | 작업
- **메뉴 테이블:** 시스템 선택 시 해당 시스템의 메뉴 목록 표시 — 메뉴명 | 슬러그 | VOC 수 | 상태 | 작업
- "시스템 추가" / "메뉴 추가" 버튼 → 인라인 폼
- 시스템 추가 시 "기타" 메뉴 자동 생성 (알림 표시)
- 아카이브 처리 시 신규 VOC 등록에서 선택 불가, 기존 데이터는 유지

#### 9.4.3 유형 관리
- **유형 테이블:** 유형명 | 슬러그 | 색상(스와치) | VOC 수 | 상태(활성/아카이브) | 작업
- "유형 추가" 버튼 → 인라인 폼 (이름 + color picker)
- 아카이브 처리 시 신규 VOC 등록에서 선택 불가, 기존 데이터는 유지

#### 9.4.4 사용자 관리
- 테이블: 이름 | AD 계정 | 이메일 | 역할(User/Manager/Admin) | 활성 여부 | 작업
- 역할 변경: 인라인 드롭다운으로 즉시 변경
- 마지막 Admin 강등 불가 (경고 표시)
- 본인 계정 역할 변경 불가

### 9.5 정렬 옵션 (컬럼 헤더 클릭 정렬)
- 별도 정렬 버튼/드롭다운 없이 **테이블 헤더 컬럼 클릭**으로 오름차순/내림차순 토글.
- 기본 정렬: 등록일 내림차순(최신순).
- 정렬 가능 컬럼: 이슈 ID, 제목, 상태, 담당자, 우선순위, 등록일.
- 현재 정렬 중인 컬럼에 방향 아이콘(▲/▼) 표시. 동일 컬럼 재클릭 시 방향 반전.
- URL 파라미터(`?sort=column&order=asc|desc`)로 정렬 상태 유지 (뒤로 가기·공유 시 복원).

### 9.6 검색 결과 하이라이팅
- 하이라이팅 대상: 제목(title) 전체 + 태그명(정확 일치). 본문은 목록 미노출이므로 하이라이팅 없음.
- 방식: 클라이언트 사이드 문자열 replace (React `<mark>` 래핑).
- 검색 조건과 상태 필터는 AND 조건으로 동작.

### 9.7 댓글 인라인 편집
- 본인 댓글의 수정 버튼 클릭 시 댓글 내용이 편집 가능한 textarea로 전환
- 저장/취소 버튼 표시, 저장 시 "(수정됨)" 마크 추가

### 9.8 페이지네이션 (게시판형 숫자 버튼)
- 목록 하단에 `< 1 2 3 ... >` 형태의 숫자 페이지 버튼 방식 사용. "더 보기" 버튼 방식 제거.
- 페이지당 항목 수: 화면 높이에 따라 동적 계산 (행 높이 48px 기준, 최소 10개 보장).
  - 계산식: `Math.max(10, Math.floor((viewportHeight - fixedHeaderHeight) / 48))`
- 전체 항목 수 및 현재 페이지 정보 (`총 N건, X-Y번째`) 목록 상단 또는 페이지네이션 영역에 표시.
- 페이지 번호는 URL 파라미터(`?page=N`)로 유지 (공유·새로고침 시 복원).

### 9.9 VOC 상세 전체 화면 전환
- 사이드 드로어(Side Drawer)에서 VOC 상세를 볼 때 헤더 액션 버튼(확장 아이콘)으로 전체 화면 전환 가능.
- **토글 방식:** 전체 화면 ↔ 사이드 패널 간 전환. 재클릭 시 원래 드로어 상태로 복귀.
- 전체 화면 모드: 목록 영역을 덮고, VOC 상세 내용이 전체 뷰포트를 차지. 헤더에 축소 아이콘으로 변경.
- 전환 시 드로어 내 스크롤 위치·편집 중인 내용 유지.
- 전체 화면 상태는 URL 파라미터(`?view=full`) 우선, sessionStorage 폴백으로 유지. 새로고침 시 복원 구현 필수.
- **전환 방식:** CSS transform/position 기반 전환 (DOM 유지) — Toast UI Editor 인스턴스 보존을 위해 React Portal 또는 hidden 레이어 방식 사용.

### 9.10 Out of scope (MVP에서 제외 유지)
- 벌크 액션 (다중 선택 → 일괄 상태 변경/담당자 배정)
- @멘션 댓글
- CSV/Excel 내보내기
- 중복 VOC 감지

---

## 10. 공지사항 & FAQ (2026-04-21 추가 요구사항)

### 10.1 개요

| 항목 | 공지사항 | FAQ |
|---|---|---|
| 작성/관리 권한 | Admin, Manager | Admin, Manager |
| 사용자 접근 | 읽기 전용 | 읽기 전용 |
| 구현 우선순위 | prototype.html 먼저 반영 | prototype.html 먼저 반영 |

### 10.2 사이드바 네비게이션 구조

패턴 A (하단 고정) 적용 — 현재 사이드바 구조를 유지하고, 구분선 아래 하단에 고정 추가:

```
[사이드바]
 ┌─ 상단 고정 ───────────────────┐
 │  전체 VOC / 내 VOC / 담당 VOC │
 │  대시보드                     │
 ├─ 스크롤 영역 (overflow-y:auto) ┤
 │  ── (구분선) ──               │
 │  시스템 트리 아코디언          │
 │  ── (구분선) ──               │
 │  공지사항 / FAQ               │
 │  ── (구분선) ──               │
 │  Admin (관리자만)             │
 ├───────────────────────────────┤
 │  하단 고정: 유저 프로필        │
 └───────────────────────────────┘
```

**스크롤 동작 규칙**
- 상단 "보기" 섹션(전체/내/담당 VOC, 대시보드)과 하단 유저 프로필은 항상 고정
- 시스템 트리·정보·관리자 영역은 하나의 스크롤 컨테이너로 묶음
- 아코디언 펼침은 항상 **아래 방향**으로만 확장; 컨테이너가 넘치면 세로 스크롤 활성화

#### 10.2.1 네비게이션 활성 상태 규칙

- **보기 탭 (전체/내/담당 VOC):** 클릭 시 해당 탭만 하이라이트. 시스템·메뉴 클릭 시 보기 탭 하이라이트 해제.
- **시스템 항목:** 클릭 시 해당 시스템 행을 accent 색상으로 하이라이트 (하위 메뉴 선택 시 시스템 하이라이트 해제).
- **메뉴 항목:** 클릭 시 해당 메뉴만 하이라이트.
- 보기 탭과 시스템·메뉴는 상호 배타적 — 동시에 활성 상태 불가.

#### 10.2.2 사이드바 카운트 배지

| 항목 | 배지 내용 | 표시 조건 |
|---|---|---|
| 전체 VOC | 전체 VOC 수 | Manager/Admin에게만 표시 (User 역할에게는 탭 및 배지 숨김) |
| 내 VOC | 현재 사용자가 등록한 VOC 수 | 1개 이상일 때 표시 |
| 담당 VOC | 현재 사용자가 담당자인 VOC 수 | 1개 이상일 때 표시 |
| 시스템 항목 | 해당 시스템 전체 VOC 수 | 항상 표시 |
| 공지사항 | `!` (빨간 배지) | 긴급(urgent) 공지가 오늘 노출 기간 내 존재할 때 |

### 10.3 공지사항 요구사항

#### 10.3.1 데이터 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| 제목 | text | 필수 |
| 내용 | richtext (Toast UI Editor) | 필수 |
| 중요도 | enum: 일반/중요/긴급 | 목록에서 시각적 강조 |
| 팝업 여부 | boolean | 로그인 시 팝업 표시 여부 |
| 노출 기간(차한) | date range (from~to) | 기간 외에는 자동 비노출 (삭제 아님) |
| 노출 여부 | boolean | Admin/Manager가 수동으로 보이기/숨기기 제어 |

#### 10.3.2 로그인 팝업 동작
- Admin/Manager가 `팝업 여부 = ON`으로 설정한 공지는 로그인 시 팝업 표시
- 팝업 하단에 **"오늘 하루 보지 않기"** 체크박스 제공
  - 체크 시 당일 재접속에서 해당 공지 팝업 미표시 (localStorage 기반)
- 팝업 공지 **1건**: 단일 다이얼로그 모달. "오늘 하루 보지 않기": 해당 공지 ID 기준 localStorage.
- 팝업 공지 **2건 이상**: **2-panel 모달**로 표시. "오늘 하루 보지 않기": 전체 목록 일괄 localStorage.
- 복수의 팝업 공지가 있을 경우 **2-panel 모달**로 표시:
  - **좌측 패널**: 팝업 대상 공지 목록 (중요도 내림차순, 제목 + 중요도 배지)
  - **우측 패널**: 선택된 공지 상세 내용 (기본 선택: 가장 높은 중요도 공지)
  - 모달 하단 **"오늘 하루 보지 않기"** 체크박스: 현재 팝업 목록 전체 일괄 적용 (localStorage 기반)

#### 10.3.3 공지사항 목록 (사용자 뷰)
- 노출 기간 내이고 노출 여부 = ON인 공지만 표시
- 중요도에 따른 배지(일반/중요/긴급) 시각 표시
- 제목 클릭 시 상세 내용 표시 (드로어 또는 인라인 펼침)

#### 10.3.4 Admin/Manager 관리 기능
- 공지 목록에서 **노출 여부 토글** (즉시 반영)
- **삭제**: Soft Delete (목록에서 제거, DB에는 유지). Admin은 관리 목록에서 복원 가능 (복원 권한: Admin 전용 — Manager가 삭제한 공지도 Admin만 복원 가능).
- 노출 기간 종료 시 자동 비노출 (삭제 아님, 관리 목록에는 계속 표시)

### 10.4 FAQ 요구사항

#### 10.4.1 데이터 필드

| 필드 | 타입 | 설명 |
|---|---|---|
| 질문(Q) | text | 필수 |
| 답변(A) | richtext (Toast UI Editor) | 필수, 이미지/표 등 리치텍스트 지원 |
| 카테고리 | faq_categories 테이블 FK | Admin이 카테고리 동적 관리 (추가/수정/아카이브) |
| 노출 여부 | boolean | Admin/Manager가 항목별 노출 제어 |

#### 10.4.2 FAQ 사용자 뷰
- 아코디언 목록: Q를 클릭하면 A가 펼쳐짐
- **키워드 검색**: 질문/답변 텍스트 전문 검색, 매칭 텍스트 하이라이팅
- 카테고리 필터 탭 (전체 / 카테고리별)
- 노출 여부 = ON인 항목만 표시

#### 10.4.3 Admin/Manager 관리 기능
- FAQ 항목별 **노출 여부 토글** (즉시 반영)
- **삭제**: Soft Delete (목록에서 제거, DB에는 유지). Admin은 관리 목록에서 복원 가능.
- Admin 페이지 내 FAQ 관리 탭 추가 (공지사항 관리와 동일 구조)

### 10.5 Admin 페이지 확장

기존 Admin 탭 구조에 아래 2개 탭 추가:

| 탭 | 기능 |
|---|---|
| 공지사항 관리 | 목록 / 등록 / 수정 / 삭제 / 노출 토글 |
| FAQ 관리 | 목록 / 등록 / 수정 / 삭제 / 노출 토글 / 카테고리 관리 |

### 10.6 prototype.html 반영 범위

1. 사이드바 하단에 공지사항/FAQ 메뉴 아이템 추가
2. 공지사항 페이지: 목록(중요도 배지 포함) + 상세 펼침
3. FAQ 페이지: 아코디언 + 검색 입력창
4. 로그인 팝업 시뮬레이션: 페이지 로드 시 팝업 모달 표시 + "오늘 하루 보지 않기" 체크박스
5. Admin 페이지: 공지사항/FAQ 관리 탭 추가 (등록 폼 + 목록 테이블)

---

## 11. 대시보드 (Dashboard)

### 11.1 개요

- **대상**: Manager / Admin 전용 (User 접근 불가 — FE role guard + BE 403 이중 방어)
- **목적**: VOC 운영 현황 요약 + 트렌드 분석 복합 대시보드
- **진입점**: 사이드바 '대시보드' 메뉴 (담당 VOC 아래, 시스템 트리 위)
- **SLA 목표**: 준수율 **70% 이상** (§12 성공 기준 SC-1). `처리속도` 위젯에서 시스템/메뉴별 slaRate가 70% 미만이면 경고 색상(amber) 표시.
- **상세 명세**: `docs/specs/plans/dashboard-feature.md` 참조

### 11.2 기능 범위

| 위젯 | 설명 |
|------|------|
| KPI 카드 8종 | 총 VOC / 미해결 / 이번주 신규·완료 / 평균 처리시간 / 해결율 / Urgent·High 미해결 / 14일+ 미처리 |
| 분포 탭 (도넛) | 상태 / 우선순위 / 유형 / 태그별 건수·비율 (4탭) |
| 우선순위×상태 매트릭스 | 4×5 히트맵, 셀 클릭 → VOC 리스트 필터 이동 |
| 드릴다운 히트맵 | 전체 → 시스템별 → 메뉴별 계층 탐색; X축: 진행현황 / 우선순위별 / 태그별 |
| 주간 트렌드 (3선) | 최근 12주 신규 / 진행중 / 완료 라인 차트 (날짜 필터 무관, 고정) |
| 태그별 분포 | Top 10 태그 가로 바 차트 |
| 처리속도 | SLA 준수율 테이블 (시스템명·평균 처리일·SLA 준수율%); 전체 탭 → 시스템별, 시스템 탭 → 메뉴별 전환. 절반 폭(2열 그리드 기준 1열) |
| 에이징 | 에이징 바 (≤7일 / 8~30일 / 31일+) 건수 분포; 전체 탭 → 시스템별, 시스템 탭 → 메뉴별 전환. 처리속도 카드와 좌우 나란히 배치 (절반 폭) |
| 담당자별 처리 현황 | X축: 진행현황 / 우선순위별 / 태그별; 담당자 필터 연동 행 하이라이트 |
| 장기 미처리 Top 10 | 14일+ 미처리 목록, 클릭 → VOC Drawer |

### 11.3 글로벌 필터 시스템

대시보드 전체 scope를 제어하는 2종류의 독립 필터.

#### A. 계층형 탭 필터 (전체 → 시스템 → 메뉴)

| 레벨 | 진입 방법 | 특징 |
|------|----------|------|
| 레벨 1 (전체) | GlobalTabs `[전체]` 선택 (기본) | 모든 시스템 집계; 헤더 메뉴 드롭다운 숨김 |
| 레벨 2 (시스템) | 특정 시스템 탭 클릭 | 해당 시스템 데이터; 헤더 메뉴 드롭다운 표시 |
| 레벨 3 (메뉴) | 헤더 메뉴 드롭다운에서 메뉴 선택 | 해당 메뉴 단일 scope; dim 셀렉터 `[전체]`만 표시 |

- GlobalTabs 탭 수 초과 시 우측 `더보기 ▾` 드롭다운으로 병합
- Admin 설정에서 탭 순서·표시·숨김 관리 (`dashboard_settings`)
- 상위 탭 전환 시 하위 선택 초기화 (예: 전체 탭 클릭 → activeMenu 리셋)

#### B. 담당자 필터 (직교 필터)

- 헤더 우측 `담당자: 전체 ▾`, 항상 표시
- 단일 선택(라디오) — `전체` 선택 시 필터 해제
- 계층형 탭 필터와 독립적으로 중첩 적용
- 선택 시 전체 위젯 데이터를 해당 담당자 scope로 필터링

#### C. Filter Context Banner

- 위치: GlobalTabs 아래, 대시보드 본문 위
- 표시 조건: 전체 탭 + 담당자 전체 = 기본값 → **숨김** / 그 외 → **표시**
- 내용 예시: `채널 A › 메뉴 1 (홈) › 담당자: 김지훈 기준`

### 11.4 커스텀 날짜 필터

- 기본값: 최근 30일; 옵션: 7일 / 30일 / 90일 / 커스텀
- KPI 날짜 의존성 3그룹:
  - **현재 상태**: 미해결 / Urgent·High 미해결 / 14일+ 미처리 — 날짜 무관, 항상 현재 스냅샷
  - **기간 연동**: 총 VOC / 평균 처리시간 / 해결율 — 선택 날짜 범위 적용
  - **이번주 고정**: 이번주 신규 / 이번주 완료 — 항상 현재 캘린더 주 (월~일)
- 주간 트렌드는 날짜 필터와 무관, 항상 최근 12주 고정

### 11.5 커스터마이징

설정 계층: **Admin 기본값** → **개인 설정** → **세션 임시** (상위가 하위 오버라이드)

#### 인대시보드 편집 모드

별도 관리자 설정 페이지 없이 대시보드 자체에서 직접 편집 (WYSIWYG).

**진입/종료**
- 대시보드 헤더 우측 "레이아웃 편집" 버튼 하나로 진입 (별도 "내 설정" 버튼 없음)
- 편집 모드 중 버튼 텍스트 → "완료"로 변경, 헤더 강조 표시
- 완료 / 취소 버튼으로 종료; 저장하지 않고 닫으면 세션 임시(`sessionStorage`)로만 유지

**편집 모드 UI**
- 각 위젯 상단에 컨트롤 바 노출: `⠿` 드래그 핸들 / 위젯명 / 눈 아이콘(숨기기) / 잠금 아이콘
- 위젯 외곽선 점선 표시 (편집 영역 시각화)
- 우측에서 설정 패널 슬라이드인:
  - **저장 대상 토글**: "내 설정" (기본) / "기본값 (Admin)" — Admin 권한자만 기본값 선택 가능
  - 기본 기간 / 히트맵 기본 X축 셀렉터
  - 설정 저장 / 취소 버튼

**편집 가능 항목**

| 항목 | 개인 | Admin(기본값) | 잠금 가능 |
|------|------|--------------|-----------|
| 위젯 순서 (2열 그리드 내 드래그앤드롭) | ✓ | ✓ | ✓ |
| 위젯 폭 (1열/2열 전환) | ✓ | ✓ | ✓ |
| 위젯 높이 (단계별) | ✓ | ✓ | ✓ |
| 위젯 숨기기/표시 | ✓ | ✓ | ✓ |
| 기본 날짜 범위 | ✓ | ✓ | ✓ |
| 히트맵 기본 X축 | ✓ | ✓ | — |
| GlobalTabs 순서·숨김 | — | ✓ | — |

- **항목별 🔒 잠금** (Admin만): 잠긴 항목은 개인 오버라이드 불가. Manager는 편집 모드에서 잠금 아이콘을 비활성(disabled) 상태로 표시 — 클릭 불가, 툴팁: "잠금 설정은 Admin만 가능".
- KPI 카드·현황 카드는 항상 상단 고정 (위치 잠금)

**저장 방식**
- **기본값 저장**: Admin 권한 필요, 전체 사용자의 초기 레이아웃으로 적용, DB 저장
- **내 설정 저장**: 로그인 사용자 개인 레이아웃, 서버 저장 (기기 무관 유지), 잠기지 않은 항목만
- **세션 임시**: `sessionStorage` — 저장 없이 닫으면 초기화

접근 권한: Manager/Admin 모두 전체 시스템 조회 가능 (시스템별 제한 없음)

### 11.6 추가 기술 스택

| 라이브러리 | 용도 |
|-----------|------|
| `@tanstack/react-query` | 위젯별 독립 쿼리, staleTime 5분 |
| `recharts` | LineChart (주간 트렌드) / BarChart (태그 분포) — lazy import |

### 11.7 대시보드 API 기본 구조

모든 대시보드 API는 `?systemId=&menuId=&assigneeId=&from=&to=` 공통 필터 파라미터를 지원.

| 엔드포인트 | 설명 | 주요 응답 필드 |
|---|---|---|
| `GET /api/dashboard/kpi` | KPI 카드 8종 | `total`, `unresolved`, `newThisWeek`, `closedThisWeek`, `avgResolutionDays`, `resolutionRate`, `urgentHighUnresolved`, `staleOver14Days` |
| `GET /api/dashboard/distribution` | 상태/우선순위/유형/태그 분포 | `?groupBy=status\|priority\|type\|tag` → `[{ label, count, ratio }]` |
| `GET /api/dashboard/heatmap` | 우선순위×상태 매트릭스 | `rows(priority)`, `cols(status)`, `cells[{ priority, status, count }]` |
| `GET /api/dashboard/drilldown` | 드릴다운 히트맵 | `?level=system\|menu&xAxis=status\|priority\|tag` → `[{ name, cells[] }]` |
| `GET /api/dashboard/trend` | 주간 트렌드 (최근 12주 고정) | `[{ week, new, inProgress, closed }]` |
| `GET /api/dashboard/tag-distribution` | Top 10 태그 분포 | `[{ tag, count }]` (내림차순 10개) |
| `GET /api/dashboard/processing-speed` | SLA 준수율 테이블 | `[{ name, avgDays, slaRate }]` |
| `GET /api/dashboard/aging` | 에이징 바 분포 | `[{ name, le7, d8to30, gt30 }]` |
| `GET /api/dashboard/assignee-stats` | 담당자별 처리 현황 | `[{ assignee, xAxis, cells[] }]` |
| `GET /api/dashboard/stale-top10` | 장기 미처리 Top 10 | `[{ vocId, issueCode, title, daysSinceCreated, assignee }]` |

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
