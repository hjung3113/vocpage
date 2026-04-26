# VOC 시스템 요구사항 (Final)

## 문서 인덱스

| 문서                        | 내용                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `requirements.md` (이 파일) | 개요·요구사항 정의·기술스택·DB 스키마·핵심 로직·확장성·성공 기준·테스트 전략·운영 설정              |
| `feature-voc.md`            | VOC 핵심 기능 명세 — 상태 전환·권한·Priority·첨부·알림·Sub-task·분류 체계·목록 필터·페이지네이션 등 |
| `feature-notice-faq.md`     | 공지사항 & FAQ 기능 명세 — 사이드바 구조·팝업 동작·Admin 관리                                       |
| `dashboard.md`              | 대시보드 요구사항 명세 — 위젯 상세·글로벌 필터·API·상태 관리·수용 기준                              |
| `design.md`                 | 디자인 시스템 — 색상 토큰·타이포그래피·컴포넌트·레이아웃 규칙                                       |

### 용어

- **MVP**: 현재 구축 중인 초기 시스템.
- **NextGen**: MVP 오픈 이후의 차세대 기능(RAG/임베딩 검색, 이메일 연동, AI 엔티티 해석, FTS, SLA 에스컬레이션 등). 이전 문서에서 "v2"로 표기되던 것.
- 리뷰 문서의 `v1`/`v2`/`v3`는 **리뷰 회차**이며 NextGen과 무관.

---

## 1. 프로젝트 개요

본 프로젝트는 분석 시스템 내부에 통합되는 **VOC(Voice of Customer) 서브 시스템**을 구축하는 것을 목표로 합니다. **Linear**의 간결한 UX와 **Jira**의 강력한 관리 기능을 결합하여, 사용자의 피드백을 효율적으로 수집하고 관리자가 체계적으로 대응할 수 있는 환경을 제공합니다.

---

## 2. 요구사항 정의 (Requirement Definition)

### 2.1 비즈니스 및 인프라 요구사항

- **시스템 통합:** 기존 분석 시스템의 왼쪽 네비게이션 구조를 유지하며 서브 페이지 형태로 작동.
- **인증 자동화:** 사내 AD(Active Directory) 연동을 통한 SSO(Single Sign-On) 구현. 연동 방식: **OIDC(OpenID Connect) / OAuth2** — 사내 Identity Provider(IdP)를 Authorization Server로 사용. 개발 환경: `AUTH_MODE=mock`으로 목 유저 주입(§14.1), 스테이징·운영은 `AUTH_MODE=oidc`로 실 AD 연결. 세션: httpOnly + SameSite=Strict 쿠키, 세션 만료 시 로그인 페이지 리다이렉트.
- **데이터 무결성:** PostgreSQL을 활용한 정규화된 DB 설계 및 확장성 확보.
- **품질 관리:** **TDD(Test-Driven Development)** 기반 개발을 통해 서비스 안정성 극대화.
- **인프라:** Docker 기반의 컨테이너화로 개발 및 운영 환경 일원화.

### 2.2 사용자(제보자) 요구사항

- **작성 편의:** **Toast UI Editor**를 활용한 리치 텍스트 편집(이미지 드래그 앤 드롭, 표, 파일 첨부).
- **분류 선택:** VOC 작성 시 시스템 → 메뉴 → 유형 순으로 드롭다운 선택. (자동 설정 없음)
- **진행 확인:** 본인 작성 VOC의 실시간 상태 확인 및 댓글 소통.

### 2.3 관리자 요구사항

- **업무 배정:** VOC별 담당자(Assignee) 지정 및 추적.
- **계층형 관리:** 하나의 이슈 아래 여러 Sub-task를 생성하여 관리 (최대 1레벨: root → Sub-task 단일 계층). 본 문서 전체에서 "Sub-task" 단일 용어로 통일 — 한국어 문장에서도 "하위 작업"/"child" 등 대체 표현 금지 (v3 §8.2).
- **자동 분류:** 키워드를 활용한 **자동 태깅(Auto-tagging)** 기능 (규칙 기반, MVP).
- **상태 전환:** VOC 상태 변경 권한은 Manager/Admin, 그리고 본인이 assignee로 지정된 VOC에 한해 Dev에게 허용.
- **우선순위 설정:** Priority(Urgent/High/Medium/Low)는 Manager/Admin, 그리고 본인 담당 VOC에 한해 Dev가 설정 가능.
- **삭제:** Soft Delete는 Admin 전용. User/Dev는 삭제 불가.
- **시스템/메뉴/유형/태그규칙/사용자 role 관리:** Admin 전용.
- **역할 4종(D18, 2026-04-26 확정):** `user` / `dev` / `manager` / `admin`. Admin과 Manager는 사용자 role 변경·시스템/메뉴/유형/태그규칙 관리·Soft Delete를 제외하면 동일 권한. Dev = User 권한 + (assignee = self일 때만) 상태 전환·Priority/Due Date·Internal Note R·W·Sub-task + Dashboard 보기. Dashboard 접근은 Manager/Admin/**Dev**.

---

## 3. 기술 스택 (Tech Stack)

| 구분              | 기술 스택                                | 비고                                                                                                |
| :---------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Frontend**      | Vite, React, TypeScript, Tailwind CSS v4 | `tokens.ts` → Tailwind config + CSS vars 단일 소스                                                  |
| **Backend**       | Node.js 20 LTS (Express), TypeScript     | OIDC 인증 미들웨어                                                                                  |
| **Database**      | PostgreSQL 16                            | Self-join 및 M:N 관계 설계                                                                          |
| **Infra**         | Docker, Docker Compose                   | 환경 일치 및 배포 편의성                                                                            |
| **Editor**        | Toast UI Editor                          | 오픈소스 리치 텍스트 에디터                                                                         |
| **Testing**       | Vitest (FE), Jest/Supertest (BE)         | TDD 개발 수행                                                                                       |
| **Data Fetching** | @tanstack/react-query                    | staleTime 페이지별 확정: 대시보드·관리자 5분, VOC 목록 30초, VOC 상세·댓글 0(항상 fresh), 알림 30초 |
| **Charts**        | recharts                                 | 대시보드 LineChart / BarChart (lazy import)                                                         |

---

## 4. 데이터베이스 설계 (Data Schema)

- **`users`**: 사내 유저 정보. 컬럼: `id(uuid)`, `ad_username`, `display_name`, `email`, `role(enum: user/dev/manager/admin)`, `is_active`, `created_at`. **`dev` 추가 (D18, 2026-04-26)** — DDL/롤백 spec은 `docs/specs/plans/migration-012-draft.md`. 실파일 `migrations/012_*.sql`은 구현 phase 승인 후 생성.
- **`systems`**: 시스템 목록. 컬럼: `id`, `name`, `slug(ASCII URL-safe, 전역 UNIQUE)`, `is_archived`. Admin이 관리 (추가/수정/아카이브).
- **`menus`**: 메뉴 목록. 컬럼: `id`, `system_id(FK→systems)`, `name`, `slug`, `is_archived`. Admin이 관리. 시스템 생성 시 "기타" 메뉴 자동 생성. `slug` 제약: `(system_id, slug)` 복합 UNIQUE.
- **`voc_types`**: VOC 유형 목록. 컬럼: `id`, `name`, `slug(전역 UNIQUE)`, `color(hex, e.g. #e5534b)`, `sort_order`, `is_archived`. Admin이 관리. 초기값: 버그/기능 요청/개선 제안/문의.
- **`vocs`**: VOC 메인 데이터. 컬럼: `id(uuid)`, `issue_code(text NOT NULL UNIQUE, e.g. ANALYSIS-2025-0001)`, `sequence_no(시스템·연도 단위 유니크)`, `title(NOT NULL, CHECK char_length<=200)`, `body(HTML, NOT NULL, CHECK octet_length<=65536)`, `status(enum: 접수/검토중/처리중/완료/드랍)`, `priority(enum: urgent/high/medium/low, default medium)`, `voc_type_id(FK→voc_types, NOT NULL)`, `system_id(FK→systems, NOT NULL)`, `menu_id(FK→menus, NOT NULL)`, `assignee_id`, `author_id`, `parent_id(self-join, 최대 1단계, ON DELETE SET NULL)`, `due_date(date, nullable — Priority 변경 시 자동 계산)`, `source(text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','import')))`, `embedding(vector(1536), nullable)`, `structured_payload(jsonb, nullable — 완료/드랍 시 필수, 최근 승인/제출본)`, `structured_payload_draft(jsonb, nullable — 임시저장 슬롯, 최신 1건만 유지)`, `review_status(text, nullable, CHECK IN ('unverified','approved','rejected','pending_deletion'))`, `embed_stale(boolean, default false — 재작성 후 approve 대기 플래그)`, `resolution_quality(enum: 근본해결/임시조치, nullable — status=완료 시 필수)`, `drop_reason(enum: 중복/정책거부/재현불가/범위외/기타, nullable — status=드랍 시 필수)`, `status_changed_at(timestamptz NOT NULL DEFAULT now() — status 변경 시 트리거가 자동 갱신, 대시보드 주간 트렌드/완료 KPI 기준)`, `deleted_at`, `created_at`, `updated_at`.
  - `status`: **5단계 유지 확정** (v3 §1.4, 2026-04-24). 기존 `보류`를 `드랍`으로 대체. 4단계 축소 옵션은 폐기 — 분석 업무 특성상 `검토중`(조사) vs `처리중`(착수)의 의미 구분 유지 가치 있음. 상태 전환 매트릭스는 §8.2.
  - `source`: VOC 생성 출처 구분. `manual` = 웹 UI 폼 입력(User/Manager), `import` = Jira 이관 스크립트(MVP 오픈 전 1회성).
    - **PG enum 대신 text+CHECK** 선택 — 향후 값 추가/제거 유연성(`chatbot` 등 NextGen 가능성).
    - **운영 규칙**:
      - 지표 분리: "신규 VOC" 집계는 `source != 'import'` 필수. 마이그레이션 건을 신규 유입으로 집계 금지.
      - SLA 제외: `source='import'` VOC는 SLA 타이머·에스컬레이션 제외 (이미 과거 처리 완료). §12 SC-1 분모에서 제외.
      - 마이그레이션 `created_at`: **Jira 원본 생성일 보존** (이관 실행 시각으로 덮지 않음).
      - UI 배지: 리스트·상세에서 `source='import'`에 **"Jira Imported"** 배지 노출 (데이터 품질 힌트).
      - 리스트 필터 UI: MVP는 미포함 (선택지 `import` 단일이라 무의미). NextGen에서 값 추가 시 드롭다운 도입.
      - API 응답: `GET /api/vocs/:id` 및 목록 응답에 `source` 기본 포함.
  - `structured_payload` 스키마 (완료·드랍 시 정식 제출용, UI는 폼 기반):

    ```json
    {
      "equipment": ["설비A", "설비B"],     // text[]
      "maker":     ["메이커X"],             // text[]
      "model":     ["모델-123"],            // text[]
      "process":   ["공정1"],               // text[]
      "symptom":    "현상 (필수 텍스트)",
      "root_cause": "원인 (필수 텍스트)",
      "resolution": "조치내역 (필수 텍스트)",
      "related_menus":     [...],
      "related_programs":  [...],
      "related_db_tables": [...],
      "related_jobs":      [...],
      "related_sps":       [...],
      "unverified_fields": [...]            // text[] — 저장 시 BE 재검증으로 마스터에 없다고 판정된 필드명
    }
    ```

    - `source(manual|auto)` 메타는 DB 저장 안 함 — 저장 이후엔 전부 담당자 확정 책임.
    - 정식 저장 검증: `equipment`/`maker`/`model`/`process` 중 **최소 1개 배열에 값** + `symptom`/`root_cause`/`resolution` 텍스트 3종 비어있지 않음. 전부 빈 배열이면 저장 차단.
    - 임시저장(`structured_payload_draft`)은 필수 필드 검증 면제, 최신 1건만 유지 (이력 없음).
    - `unverified_fields`: **BE가 저장 시점에 자체 메모리(§16.3 외부 마스터 캐시)로 재검증**하여 계산 (FE body 플래그 신뢰 금지). 비교 방식: `value.trim().toLowerCase()` 정규화 후 완전 일치(exact match) — 앞뒤 공백 제거 + 대소문자 무시, 부분 매칭 없음. 하나라도 차면 `vocs.review_status='unverified'` 동반 세팅. 리뷰 화면에서 해당 필드에 경고 배지 표시.

  - **외부 참조 검증 정책**: 편집 세션 동안 FE는 BE 메모리 캐시(§16.3)에서 자동완성·존재 검증. 저장 시 BE가 단일 진실 원천으로 재검증 → 실패 필드는 `unverified_fields`에 기록 + `review_status='unverified'`. 저장 시점 외부 API 호출은 **0건**.
  - `review_status` 라이프사이클: 정식 제출 시 `unverified` → Result Review에서 `approved`/`rejected` → approve 후 "삭제 신청" 시 `pending_deletion` → 승인 시 payload clear + `review_status=NULL` 복귀. 상세 상태머신은 feature-voc.md §8.2 보강본 참조.
  - `embedding` 컬럼은 pgvector 확장 기반. **MVP 단계에서는 쓰기/읽기 모두 미사용(전량 NULL 유지)**. 생성 시점은 `review_status`가 `approved`로 전환되는 순간에만(§16 참조). 차원수 1536은 OpenAI `text-embedding-3-small` 기준 가결정 — 모델 확정 시 재검토. HNSW 인덱스(`vector_cosine_ops`)는 기능 도입 시 별도 마이그레이션으로 추가.

- **`voc_history`**: 감사 로그. 상태·담당자·Priority 변경 이력 보존.
- **`voc_payload_reviews`** (제출/삭제 리뷰 통합 로그):
  - 컬럼: `id(uuid)`, `voc_id(FK→vocs, ON DELETE CASCADE)`, `action text CHECK IN ('submission','deletion')`, `reviewer_id(FK→users)`, `decision text CHECK IN ('approved','rejected')`, `comment text`, `created_at timestamptz default now()`.
- **`voc_payload_history`** (제출 스냅샷 이력, "이전 이력" 버튼 소스):
  - 컬럼: `id(uuid)`, `voc_id(FK→vocs, ON DELETE CASCADE)`, `payload jsonb NOT NULL`, `submitted_by(FK→users)`, `submitted_at timestamptz default now()`, `final_state text CHECK IN ('approved','rejected','deleted','active')`, `is_current boolean default false`.
  - 인덱스: `(voc_id, submitted_at DESC)`.
  - 불변 조건: VOC당 `is_current=true` row는 최대 1건(삭제 승인 후 0건 가능). 새 제출 시 기존 is_current를 false로 내리고 새 row insert. 삭제 승인 시 해당 row `final_state='deleted'`, `is_current=false`, `vocs.structured_payload=NULL`, `vocs.review_status=NULL`. 삭제 reject 시 `vocs.review_status='approved'` 원복 + `action='deletion', decision='rejected'` row만 추가.
- **`tags` & `voc_tags`**: 태그 정보 및 VOC와의 다대다 매핑. `tags.kind enum('general','menu')` — 기존 `equipment` 카테고리 폐기(설비/공정/메이커/모델은 전부 `structured_payload`로 이동).
  - `general`: 자유 태그 (담당자 분류용 라벨)
  - `menu`: 주메뉴(`vocs.menu_id`) 외 **영향받는 다른 메뉴**를 태깅
  - `voc_tags` 컬럼: `voc_id`, `tag_id`, `source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','rule'))`, `created_at`. `source`는 수동 태깅(`manual`)과 `tag_rules` 엔진 자동 부착(`rule`)을 구분. `vocs.source`(Q8, manual/import)와는 별개 축.
  - 초기 마이그레이션 (과거 초안의 `equipment` enum 값이 남아있는 환경 한정): `ALTER TYPE tag_kind RENAME TO tag_kind_old; CREATE TYPE tag_kind AS ENUM ('general','menu'); ALTER TABLE tags ALTER COLUMN kind TYPE tag_kind USING kind::text::tag_kind; DROP TYPE tag_kind_old;` (기존 `equipment` row는 사전 정리 필요).
- **`tag_rules`**: 자동 태깅을 위한 키워드 저장소. **`kind='general'` 태그 자동 부착 전용** — 엔티티성 단어(설비/모델/메이커/공정)는 `structured_payload` 파이프라인으로 위임. `menu` 태그는 규칙 대상 아님(메뉴 FK 기반). 컬럼: `id(uuid)`, `tag_id(FK→tags)`, `pattern text NOT NULL`, `created_by(FK→users)`, `created_at`. **MVP는 키워드(부분 문자열, 대소문자 무시) 매칭 단일 모드**, 정규식·confidence·model_version은 NextGen 도입 시 컬럼 확장. <!-- NextGen AI 태깅 전환 시 `pattern_type CHECK IN ('keyword','regex')`, `confidence_threshold(float)`, `model_version` 컬럼 추가 예정 -->
  - **실행 시점**: VOC 접수 + 제목/본문 편집 저장 시. status 변경만으로는 재실행 안 함.
  - **규칙 충돌**: 같은 본문에 복수 규칙 매칭 시 전부 부착(태그는 다대다, 우선순위·배타 없음).
  - **멱등성**: 재실행은 해당 VOC의 `voc_tags.source='rule'` 행만 삭제 후 재부착. `source='manual'` 행은 보존(담당자 수동 태깅은 엔진이 건드리지 않음).
  - **복원 시 재실행**: Soft Delete VOC 복원(`deleted_at=NULL`) 시 `tag_rules` 엔진 재실행 대상. 삭제 기간 중 규칙 변경이 반영됨. `source='manual'` 태그 보존.
- **`attachments`**: 컬럼: `id`, `voc_id`, `uploader_id`, `filename`, `mime_type`, `size_bytes`, `storage_path`, `created_at`. VOC당 최대 5개. 파일은 Docker volume(`/uploads`)에 로컬 저장.
- **`comments`**: 평면 구조(스레드 미지원). 컬럼: `id`, `voc_id`, `author_id`, `body(HTML)`, `created_at`, `updated_at`. **공개 댓글 전용** — 내부 메모는 `voc_internal_notes` 별도 테이블로 분리.
- **`voc_internal_notes`** (Q7 확정, v3 §3.4): 담당자 전용 내부 메모(트리아지·보류 사유·재현 로그 등). 공개 댓글과 **테이블 자체를 분리**하여 쿼리 누락으로 인한 유출 사고 내성을 구조적으로 확보.
  - 컬럼: `id(bigserial)`, `voc_id(FK→vocs, ON DELETE CASCADE)`, `author_id(FK→users)`, `body text NOT NULL`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, `deleted_at timestamptz NULL`.
  - 인덱스: `idx_voc_internal_notes_voc ON voc_internal_notes(voc_id) WHERE deleted_at IS NULL`.
  - **권한**: Manager/Admin 전용 접근. User는 엔드포인트 도달 자체 차단(404 반환 — 존재 자체 은닉).
  - **API 계약**:
    - `GET /api/vocs/:id/notes` — Manager/Admin. User → 404.
    - `POST /api/vocs/:id/notes` — Manager/Admin.
    - `PATCH /api/vocs/:id/notes/:noteId` — 작성자 또는 Admin.
    - `DELETE /api/vocs/:id/notes/:noteId` — soft-delete. 작성자 또는 Admin.
    - `GET /api/vocs/:id/comments`는 **공개 댓글만** 반환 (기존 유지, 내부 메모 절대 혼입 금지).
  - **UI**: VOC 상세 우측 패널에 **"Internal Notes"** 섹션을 공개 댓글과 별도 배치. warning/accent 계열 배경으로 시각 구분. User 로그인 시 DOM 자체에 비렌더링.
  - **Timeline 통합**: Manager/Admin 한정으로 공개 댓글 + internal note + status change를 시간순 혼합 표시하되 배지/배경으로 구분. User role은 internal note 이벤트를 Timeline API 응답에서 수신 불가.
  - **회귀 테스트 필수**: (1) User가 `/notes` 호출 시 404, (2) 공개 댓글 응답에 internal note 절대 미포함, (3) Timeline API에서 User는 internal note 이벤트 수신 불가.
- **`notifications`**: 컬럼: `id`, `user_id`, `type(enum: comment/status_change/assigned)`, `voc_id`, `read_at`, `created_at`.
- **`dashboard_settings`**: 컬럼: `id(uuid)`, `user_id(FK→users, NULL=Admin 기본값)`, `widget_order(jsonb)`, `widget_visibility(jsonb)`, `widget_sizes(jsonb)`, `locked_fields(jsonb)`, `default_date_range(enum: 1m/3m/1y/all/custom, default '1m')`, `heatmap_default_x_axis(enum: status/priority/tag)`, `globaltabs_order(jsonb, Admin 기본값 행에만 유효)`, `updated_at`. `user_id IS NULL` 행이 Admin 기본값, 로그인 사용자별 개인 설정은 `user_id` 지정.
  - JSONB 컬럼 예시 구조:
    ```json
    {
      "widget_visibility": { "kpi": true, "heatmap": true, "trend": false },
      "widget_order": ["kpi", "distribution", "heatmap", "trend"],
      "widget_sizes": { "kpi": "full", "trend": "half" },
      "locked_fields": { "kpi_position": true, "widget_visibility.trend": true }
    }
    ```
- **`notices`**: 공지사항. 컬럼: `id(uuid)`, `title`, `body(HTML)`, `level(enum: normal/important/urgent)`, `is_popup(boolean)`, `is_visible(boolean)`, `visible_from(date)`, `visible_to(date)`, `author_id(FK→users)`, `deleted_at`, `created_at`, `updated_at`.
- **`faq_categories`**: FAQ 카테고리 동적 관리. 컬럼: `id`, `name`, `slug(UNIQUE)`, `sort_order`, `is_archived`.
- **`faqs`**: FAQ 항목. 컬럼: `id(uuid)`, `question`, `answer(HTML)`, `category_id(FK→faq_categories)`, `is_visible(boolean)`, `sort_order`, `author_id(FK→users)`, `deleted_at`, `created_at`, `updated_at`.

---

## 5. UI/UX 디자인 가이드 (Samsung Blue Style)

1. **메인 리스트:** 정갈한 테이블 UI. 이슈 ID, 제목, 상태, 담당자, 유형(색상 뱃지), 태그를 한 줄에 표시. 아코디언 형태로 Sub-task 노출.
2. **사이드바:** 시스템 목록이 아코디언 트리로 표시. 시스템 클릭 시 하위 메뉴 펼침. 메뉴 클릭 시 해당 메뉴 VOC 목록 필터링.
3. **사이드 드로어(Side Drawer):** 리스트 항목 클릭 시 우측에서 상세 화면 슬라이드. (분석 시스템의 맥락 유지)
4. **등록 모달:** 시스템 → 메뉴 → 유형 순 연계 드롭다운. 시스템 선택 시 해당 시스템의 메뉴만 표시.

---

## 6. 핵심 로직 및 함수 정의

### 6.1 Backend (Express)

- `createAuthMiddleware()`: `AUTH_MODE` 환경변수에 따라 `mockAuthMiddleware`(`mock`) 또는 `oidcAuthMiddleware`(`oidc`)를 반환하는 팩토리. 잘못된 값이면 앱 기동 시 즉시 throw.
- `mockAuthMiddleware`: 세션에서 user를 읽어 `req.user`에 주입. 세션 없으면 401 반환.
- `oidcAuthMiddleware`: 사내 IdP로부터 발급된 ID 토큰 검증 (JWT 서명 + iss/aud/exp 클레임 확인). 세션: httpOnly + SameSite=Strict + Secure 쿠키. 만료 시 401 반환 → FE에서 로그인 페이지 리다이렉트. CSRF 방어: SameSite=Strict 쿠키로 충분 (별도 CSRF 토큰 불필요). _(현재 stub — OIDC 실 연결은 Phase 6-7)_

**인증 API 엔드포인트** (`/api/auth`):

- `POST /api/auth/mock-login`: `AUTH_MODE=mock`에서만 활성. body `{ role: 'admin'|'manager'|'user' }` → 세션 저장 + `{ user: AuthUser }` 반환. `AUTH_MODE=oidc`에서 404.
- `POST /api/auth/logout`: 세션 파기 → `{ ok: true }` 반환.
- `GET /api/auth/me`: 현재 세션 유저(`AuthUser`) 반환. 세션 없으면 401.

**`AuthUser` 타입**: `{ id: uuid, email: string, name: string, role: 'admin'|'manager'|'user' }`. users 테이블의 `display_name` → `name`으로 축약 매핑. Mock 유저 fixture는 §14.5 참조.

- `createVOC`: 본문 분석 후 자동 태그(Level 1, 2) 적용 및 저장.
- `getVOCList`: 계층형 구조(Parent-Child)를 고려한 데이터 조회. 부모 VOC가 필터 조건 일치 시 Sub-task 함께 표시. Sub-task 단독으로는 상위 목록 미노출. 페이지네이션 단위: 부모 VOC 기준.
- `updateVOCStatus`: 이슈 상태 변경 및 관리자 배정 로직.
- **에러 응답 표준 포맷**: 모든 API 오류는 `{ "code": "ERROR_CODE", "message": "사람이 읽을 수 있는 설명", "details": {} }` JSON으로 응답.
- **표준 에러 코드 목록** (v3 §8.5):

  | 코드                          | HTTP | 용도                                                                                  |
  | ----------------------------- | ---- | ------------------------------------------------------------------------------------- |
  | `VALIDATION_FAILED`           | 400  | 요청 body/쿼리 유효성 실패. `details`에 필드별 에러 매핑.                             |
  | `INVALID_TRANSITION`          | 400  | 상태 전환 매트릭스 위반 (feature-voc.md §8.2).                                        |
  | `UNAUTHENTICATED`             | 401  | 세션 없음/만료. FE는 로그인 페이지 리다이렉트.                                        |
  | `FORBIDDEN`                   | 403  | 권한 매트릭스(§8.3) 위반.                                                             |
  | `NOT_FOUND`                   | 404  | 리소스 없음 또는 권한 없는 리소스 은닉(예: internal notes를 User가 요청).             |
  | `CONFLICT`                    | 409  | 동시성 충돌·유일성 위반(예: `issue_code` 중복, 마지막 Admin 강등 시도).               |
  | `PAYLOAD_TOO_LARGE`           | 413  | 파일 업로드 10MB 초과(§8.5).                                                          |
  | `UNSUPPORTED_MEDIA_TYPE`      | 415  | 허용 외 MIME(SVG·실행 파일 등).                                                       |
  | `EXTERNAL_MASTER_UNAVAILABLE` | 503  | 외부 마스터 refresh 실패 시(§16.3) BE 메모리 교체 거부. 응답에 `kept_loaded_at` 포함. |
  | `RATE_LIMITED`                | 429  | 마스터 refresh 쿨다운 5분 위반 등(§16.3).                                             |
  | `INTERNAL_ERROR`              | 500  | 위 범주 외 서버 에러.                                                                 |

- **헬스체크**: `GET /api/health` → `{ "status": "ok", "db": "ok" }` (DB 연결 포함 확인). 인증 불필요.
- **공통 쿼리 파라미터**: 대시보드 API는 `?systemId=&menuId=&assigneeId=&from=&to=` 공통 필터 지원 (§11.7 참조).

### 6.2 Frontend (React)

- `/mock-login` 라우트: `VITE_AUTH_MODE=mock`일 때만 조건부 등록 (lazy import). `VITE_AUTH_MODE=oidc`에서는 라우트 자체가 없어 접근 시 404.
- `mockLogin(role)` / `logout()` / `getMe()`: FE 인증 API 클라이언트. 각각 `POST /api/auth/mock-login`, `POST /api/auth/logout`, `GET /api/auth/me` 호출.
- `useVOCFilter`: 메뉴/상태/태그별 복합 필터링 훅.
- `useDrawer`: 상세 보기 드로어 제어 및 상태 동기화.
- **상태 관리:** React Context (MVP — 규모 충분). Redux는 확장성 필요 시 NextGen에서 검토.

---

## 7. 향후 확장성

- **이메일 알림 (NextGen):** 사내 이메일 시스템 연동 (사내 시스템 접근 후 구현). 우선순위 1순위. — MVP에서 인앱 알림(30초 폴링)만으로는 Urgent VOC 누락 우려가 있어 NextGen 1순위로 지정.
- **AI 자동 분류 (NextGen):** LLM API를 통한 고도화된 자동 태깅. 우선순위 2순위. (`tag_rules`에 `confidence_threshold float`, `model_version text` 컬럼 추가 예정)
- **FTS 검색 (NextGen):** PostgreSQL Full-Text Search 도입. 우선순위 3순위.
- **SLA 에스컬레이션 (NextGen):** Due Date 초과 시 자동 알림/에스컬레이션. 우선순위 4순위.
- **데이터 분석:** VOC 데이터를 기반으로 한 분석 시스템 메뉴별 장애/개선 통계 리포트 생성.
- **Jira 데이터 마이그레이션:** 기존 Jira 이슈를 VOC 시스템으로 1회성 이전. **타이밍: 오픈 전 일괄 이전** (Jira CSV export → 변환 스크립트 → DB import). 오픈 이후 신규 VOC는 수동 등록. 구현 전 Jira 필드 매핑 확인 필요.
- **Out of scope (MVP):** 이메일/슬랙 알림, SLA 에스컬레이션, 전문 검색(FTS), 2단계 이상 Sub-task 계층, AI 태깅, 벌크 상태 변경.

---

## 8. 상세 기능 명세

> 상세: `docs/specs/requires/feature-voc.md`

핵심 기능 범위: VOC 식별자(Issue Code) / 상태 전환 / 권한 모델 / Priority & Due Date / 파일 첨부 / 인앱 알림 / Sub-task / 분류 체계(시스템·메뉴·유형·태그) / 삭제 정책 / 입력 제한 / 목록 필터·검색·페이지네이션 / 파일 저장소 / 댓글 정책 / 알림 폴링 / 기존 시스템 통합

### 8.16 Result Review 플로우

- **상태 머신**: `작성중 ──임시저장──▶ draft 보유(review_status=null) ──제출──▶ unverified ──approve──▶ approved`. reject 시 `rejected` → 수정/재제출로 `unverified` 복귀. approved 이후 수정은 "승인 결과 삭제 신청" → `pending_deletion` → approve 시 payload clear로 재작성 가능, reject 시 approved 원복.
- **완료/드랍 전환 규칙**: `status`가 완료/드랍으로 바뀔 때 `structured_payload` 정식 제출 + `review_status='unverified'` 초기화가 동시에 일어난다. 제출 스냅샷은 `voc_payload_history`에 `is_current=true`로 insert.
- **수정 버튼 동작**:
  - `unverified`/`rejected`: 기존 payload를 draft로 복사 → 편집 모달 → 재제출 시 본 컬럼 덮어쓰기 + history 새 row.
  - `approved`: 수정 버튼 직접 동작 안 함. "승인 결과 삭제 신청" → 리뷰(self 가능) → approve 시 본 컬럼 clear → 이후 "결과 작성" 가능.
- **임시저장**: 편집 모달 내 별도 버튼. `structured_payload_draft`만 기록, 필수 필드 검증 면제, `vocs.status`/`review_status` 변동 없음. 모달 무저장 닫힘 시 프롬프트. 최신 draft 1건만 유지(이력 없음). 담당자 재할당 시 draft는 VOC에 종속되어 새 담당자가 그대로 이어받음.
- **이전 이력 버튼**: 모달 내에서 `voc_payload_history` 목록 표시, 선택 시 draft 덮어쓰기 확인 후 로드. `final_state='deleted'` 스냅샷도 복원 선택 가능("삭제됨" 라벨).
- **칩 입력 cascade**: 설비 입력 시 공정+메이커+모델 auto 추가, 모델 입력 시 공정+메이커 auto 추가, 메이커/공정 단독 입력 시 auto 없음. auto 칩 UI는 점선 테두리+`auto` 배지. cascade는 세션 메모리에서만 추적 — 페이지 리로드·임시저장 후 재진입 시 auto 구분 소실(수동 칩으로 복원).

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

### 11.7 대시보드 API 엔드포인트 (v3 §8.3)

공통 쿼리 파라미터: `systemId`, `menuId`, `assigneeId`, `startDate`, `endDate` (엔드포인트별 적용 여부는 dashboard.md §API 표 참조).

| 엔드포인트                                                             | 위젯                                    | 비고             |
| ---------------------------------------------------------------------- | --------------------------------------- | ---------------- |
| `GET /api/dashboard/summary`                                           | KPI 8종 + 전주 대비                     | 기간 연동        |
| `GET /api/dashboard/distribution?type=status\|priority\|voc_type\|tag` | 분포 탭 4종                             | 기간 연동        |
| `GET /api/dashboard/priority-status-matrix`                            | 우선순위×상태 매트릭스                  | 기간 연동        |
| `GET /api/dashboard/heatmap?xAxis=status\|priority\|tag`               | 드릴다운 히트맵                         | 기간 연동        |
| `GET /api/dashboard/weekly-trend?weeks=12`                             | 주간 트렌드 3선(신규/진행중/완료)       | 12주 고정        |
| `GET /api/dashboard/tag-distribution?limit=10`                         | 태그별 분포 Top 10                      | 기간 연동        |
| `GET /api/dashboard/system-overview`                                   | 현황 카드(시스템/메뉴)                  | 기간 연동        |
| `GET /api/dashboard/assignee-stats?xAxis=status\|priority\|tag`        | 담당자별 처리 현황                      | 기간 연동        |
| `GET /api/dashboard/processing-speed`                                  | 처리속도(SLA 준수율 표, SC-1/SC-3 소스) | 기간 연동        |
| `GET /api/dashboard/aging`                                             | 에이징 바 분포(≤7일/8~30일/31일+)       | 현재 미완료 기준 |
| `GET /api/dashboard/aging-vocs?limit=10`                               | 장기 미처리 Top 10                      | 무관             |
| `GET /api/dashboard/settings` · `PUT /api/dashboard/settings`          | 대시보드 설정 조회/저장                 | Admin 전용 저장  |
| `GET /api/dashboard/menus?systemId=` · `GET /api/dashboard/assignees`  | 드롭다운용 보조                         | —                |

- `source='import'` VOC는 SC-1/SC-3 계산 분모에서 제외 (§12, §4 `source` 운영 규칙).
- 응답·에러 포맷은 §6.1 표준을 따름. 외부 마스터 장애 시 히트맵/분포 집계는 `EXTERNAL_MASTER_UNAVAILABLE` 없이 기존 DB 기준 그대로 동작(마스터 의존 없음).

---

## 12. 성공 기준 (Success Criteria)

시스템 오픈 후 3~6개월 기준으로 아래 3가지 지표를 모두 달성하면 성공으로 판단한다.

| #    | 지표             | 목표                                        | 측정 방법                                                         |
| ---- | ---------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| SC-1 | SLA 준수율       | **70% 이상** 유지                           | 대시보드 `처리속도` 위젯 — Due Date 내 완료 건수 / 전체 완료 건수 |
| SC-2 | Jira 완전 전환   | Jira에서 신규 VOC **0건**                   | Jira 보드 모니터링 (수동 확인)                                    |
| SC-3 | Due Date 내 처리 | Priority별 Due Date 내 처리율 SLA 기준 동일 | `GET /api/dashboard/processing-speed` slaRate 컬럼                |

- SLA 계산 기준: Due Date = Priority 변경 시점 기준 자동 계산값 (§8.4.1)
- **SLA 분모 제외**: `vocs.source='import'` VOC는 SLA 타이머·에스컬레이션·SC-1/SC-3 분모에서 모두 제외 (이미 Jira에서 처리 완료된 과거 건).
- 측정 주기: 월 1회 대시보드 스냅샷 캡처 → 운영팀 리뷰

---

## 13. 테스트 전략 (Test Strategy)

### 13.1 테스트 레이어 구분

| 레이어      | 도구                    | 대상                                 | 커버리지 목표                  |
| ----------- | ----------------------- | ------------------------------------ | ------------------------------ |
| Unit        | Vitest (FE) / Jest (BE) | 비즈니스 로직, 유틸 함수, React Hook | BE 70% / FE 60%                |
| Integration | Jest + Supertest        | API 엔드포인트 (실 DB 연결)          | 핵심 CRUD + 권한 시나리오 100% |
| E2E         | Playwright              | 주요 사용자 플로우                   | 핵심 플로우 (아래 목록)        |

### 13.1.1 인수 조건(AC) 작성 형식

모든 통합 테스트는 아래 형식으로 작성한다:

```
Given [초기 상태/전제]
When  [액션/요청]
Then  [기대 결과/응답]
```

예시 (상태 전환):

```
Given Manager가 로그인된 상태, VOC가 '접수' 상태
When  PATCH /api/vocs/:id/status { status: '처리중' } 요청
Then  400 반환, body: { code: 'INVALID_TRANSITION', message: '접수 → 처리중 전환 불가' }
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

| 변수                 | 예시                                     | 설명                                                                                      |
| -------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | `postgresql://user:pass@db:5432/vocpage` | PostgreSQL 연결 문자열                                                                    |
| `OIDC_ISSUER`        | `https://auth.internal`                  | 사내 IdP issuer URL                                                                       |
| `OIDC_CLIENT_ID`     | `vocpage-app`                            | OIDC 클라이언트 ID                                                                        |
| `OIDC_CLIENT_SECRET` | `...`                                    | OIDC 클라이언트 시크릿                                                                    |
| `SESSION_SECRET`     | `...`                                    | 세션 쿠키 서명 키 (32자+ 랜덤)                                                            |
| `INIT_ADMIN_EMAIL`   | `admin@company.com`                      | 초기 Admin seed 계정                                                                      |
| `UPLOAD_DIR`         | `/uploads`                               | 파일 업로드 루트 경로                                                                     |
| `PORT`               | `3000`                                   | BE 서버 포트                                                                              |
| `NODE_ENV`           | `production`                             | 환경 구분                                                                                 |
| `AUTH_MODE`          | `mock` \| `oidc`                         | 인증 모드. 로컬·개발은 `mock`(목 유저 주입), 스테이징·운영은 `oidc`(실 AD 연결). v3 §8.1. |
| `VITE_AUTH_MODE`     | `mock` \| `oidc`                         | FE 인증 모드. `mock`이면 `/mock-login` 라우트 활성화. BE `AUTH_MODE`와 값이 동일해야 함.  |
| `LOG_LEVEL`          | `info`                                   | 로그 레벨 (`error`/`info`/`debug`). 운영=`error`, 개발=`info`, 로컬=`debug`. v3 §8.4.     |

**세션 스토어**: `connect-pg-simple` 채택. 기존 PostgreSQL(`DATABASE_URL`)을 재사용하므로 별도 인프라 불필요. 개발(`MemoryStore`)과 운영(`connect-pg-simple`) 전환은 `NODE_ENV`로 자동 분기. 세션 테이블은 `connect-pg-simple` 내장 DDL로 자동 생성. **⚠ Phase 8-1 구현 예정 — 현재 MemoryStore 사용 중.**

> **NOTE (현재 구현)**: `MemoryStore` (개발용). Phase 8-1에서 `connect-pg-simple` 기반 PostgreSQL 세션 스토어로 교체 예정.

### 14.2 Docker 구성 개요

```
services:
  frontend:   node:20-alpine, Vite dev server, host 5173 → container 5173 (운영: Vite build → nginx 서빙)
  backend:    node:20-alpine, Express, host 3001 → container 3000
              volume: /uploads (파일 저장소)
  db:         postgres:16-alpine, host 5433 → container 5432
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

### 14.5 Mock User Fixtures

`AUTH_MODE=mock` 시 사용하는 고정 테스트 유저. **DB seed 필수** — `vocs.author_id` 등 NOT NULL FK 위반 방지를 위해 동일 UUID의 `users` row가 사전에 존재해야 한다.

| role    | id (UUID)                              | email               | name         |
| ------- | -------------------------------------- | ------------------- | ------------ |
| admin   | `00000000-0000-0000-0000-000000000001` | admin@company.com   | Mock Admin   |
| manager | `00000000-0000-0000-0000-000000000002` | manager@company.com | Mock Manager |
| user    | `00000000-0000-0000-0000-000000000003` | user@company.com    | Mock User    |
| dev     | `00000000-0000-0000-0000-000000000004` | dev@company.com     | Mock Dev     |

- **Seed 파일**: `backend/seeds/mock-users.sql` — 위 4건 INSERT (재실행 안전, ON CONFLICT DO NOTHING). dev row는 `migrations/012` 적용 후 추가 (구현 phase).
- **실행 시점**: 마이그레이션 직후. `npm run db:seed:mock` (mock 환경) 또는 `npm run db:seed`(개발용 풀 시드, mock-users 포함).
- **운영 환경**: `AUTH_MODE=oidc`이면 mock-users.sql 실행 금지. 대신 §15.2 사용자 초대 플로우 사용.
- **세션 매핑**: `frontend/src/auth/mockUsers.ts` 및 `backend/src/auth/mockUsers.ts` fixture가 위 UUID와 일치해야 한다.

---

## 15. 관리자 페이지

### 15.1 Result Review

> 상세 UI는 feature-voc.md §9.4 관리자 페이지 목록에 "Result Review" 항목으로 추가 예정.

- **대상 행**: `review_status IN ('unverified','pending_deletion')` VOC.
- **액션**: 각 VOC에 코멘트 + approve/reject. 결정 이력은 `voc_payload_reviews`에 `action='submission'|'deletion'` 구분으로 기록.
- **권한**: Manager/Admin.
- **연관 갱신**: approve 시 `vocs.structured_payload` 확정 / `voc_payload_history.is_current=true` 스냅샷 유지 / 임베딩 정책(§16) 트리거.

### 15.2 사용자 초대 플로우

**전제**: 사내 AD/SSO 환경(§2.1). 별도 이메일 초대·토큰 발송 시스템 없음 (MVP 범위).

- **자동 생성 (기본)**: AD/OIDC 로그인 성공 시 `users` 테이블에 row 자동 생성.
  - 초기값: `role='user'`, `is_active=true`, `display_name`/`email`/`ad_username`은 IdP 클레임에서 매핑.
  - 동일 `ad_username` 재로그인 시 row 재사용 (UPSERT 멱등).
- **권한 승급**: Admin이 사용자 관리 화면(`feature-voc.md §9.4 관리자 페이지`)에서 `role` 변경 (`user` → `dev` / `manager` / `admin`). Dev 승급 = "내부 엔지니어" 표시 + 본인 담당 VOC 운영 권한 + Dashboard 접근.
- **사전 초대 미지원**: 로그인 전 사용자 row 사전 생성·이메일 초대 토큰 발송은 MVP 범위 외. 사내 AD에 신규 직원이 등재되면 첫 로그인 시 자동 합류.
- **비활성화**: Admin이 `is_active=false`로 토글하여 로그인·세션을 차단 (사용자 row는 보존, VOC 이력 무결성 유지).
- **사용자 관리 화면**: 우상단 "사용자 초대" 버튼은 **MVP에서 비활성화 또는 숨김** — 자동 생성 정책상 진입점 불필요. 벤치마크 스크린샷(`20-admin-users.png`)의 버튼은 NextGen에서 사전 초대 도입 시 활성화 예정.

---

## 16. AI 워크플로우 적합성 (NextGen 대비)

### 16.1 태그 vs structured_payload 역할 경계

| 영역                 | 역할                                  | 대상                                                                       |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `tags`               | 관리·조회용 분류 (사용자 필터/그룹핑) | `general`, `menu` 두 카테고리만                                            |
| `structured_payload` | 담당자 정형 입력 + AI 파이프라인 입력 | equipment/maker/model/process + symptom/root*cause/resolution + related*\* |

- 엔티티 해석 결과를 `equipment` 태그로 누적하던 v1 초안은 **폐기**. 설비/공정/메이커/모델은 전부 `structured_payload`로 이동.
- NextGen AI 엔티티 해석이 도입될 때도 결과 쓰기 대상은 `structured_payload` 4개 배열 필드(담당자 확인/수정 후 확정).
- 자동 태깅 규칙(`tag_rules`) 역할 한정·실행 규칙은 §4 `tag_rules` 불릿 참조. 요약: `kind='general'` 전용, 엔티티 탐지 금지.

### 16.2 임베딩 정책

- **대상 텍스트**: `structured_payload`의 `symptom + root_cause + resolution` 정규화 문자열.
- **생성 시점**: `review_status`가 `approved`로 전환되는 순간에만 생성/갱신. unverified/rejected 데이터가 벡터 스토어에 섞이면 품질 오염.
- **갱신**: approve 후 payload 재작성(삭제→재작성) 발생 시 `vocs.embed_stale=true` 마킹 → 다음 approve 시 재임베딩 + 플래그 해제.
- **MVP 범위**: 컬럼·플래그·정책만 예약, 실제 임베딩 생성/검색은 미실행.

### 16.3 외부 마스터 연동 정책 (v3 §7.3, 2026-04-24 확정)

**모델**: 편집 세션 중 BE 메모리 기반 검증. 저장 시점 외부 API 호출은 **0건**. 입력은 트리아지 단계(Manager)에서 **드롭다운 선택** 전제(자유 텍스트 아님).

**마스터 3종**: 설비 마스터 · DB 마스터 · 프로그램 마스터. (필드별 원천 시스템 매핑은 "외부 마스터 연동 명세" 별도 문서 — 7B)

**합의 10건**:

| 항목                     | 결정                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 캐시 범위                | 프로세스 전역. BE 부팅 시 3종 통째 1회 로드 (규모 작아 전량 적재 가능).                                                                                                                                                                           |
| TTL                      | 없음. 수동 트리거만.                                                                                                                                                                                                                              |
| Refresh 권한             | Manager 이상.                                                                                                                                                                                                                                     |
| Refresh 진입점           | 관리자 페이지 전역 refresh + 편집 화면 🔄 아이콘.                                                                                                                                                                                                 |
| Refresh 쿨다운           | **동일 사용자 기준 5분** (원천 시스템 보호).                                                                                                                                                                                                      |
| 부팅 시 로드 실패        | **디스크 스냅샷 fallback**. Manager/Admin UI에 **"스냅샷 모드" 배지** 필수. (메타 로그·한도·비동기 쓰기 보조 조건은 미채택, 운영 필요 시 추가)                                                                                                    |
| Cold Start (스냅샷 없음) | 스냅샷 파일도 없는 최초 배포 시 — **전 필드 unverified 모드로 계속 기동** (기동 실패 없음). 모든 외부 마스터 필드를 unverified로 판정. Manager/Admin UI에 **"콜드 스타트 모드" 배지** 노출.                                                       |
| 수동 Refresh 실패        | **atomic swap** — 3종 전부 성공해야 교체. 실패 시 기존 메모리 유지. 부분 교체 금지.                                                                                                                                                               |
| 저장 시 BE 재검증        | **필수**. FE body 플래그 신뢰 금지. BE 메모리가 단일 진실 원천. override도 BE 재판정.                                                                                                                                                             |
| 입력 모드                | **자유 입력 허용 + unverified 플래그**. 마스터 등록 지연보다 VOC 처리 흐름 보호 우선. 자동완성 UX로 정상 케이스 대부분 커버. **unverified 필드가 있어도 VOC 저장은 허용** — 저장 후 리뷰 게이트(`review_status='unverified'`)에서 Manager가 검토. |
| review_status 단위       | `vocs.review_status` row 단일값(Manager 큐 필터) + `structured_payload.unverified_fields text[]`로 필드 병기. 별도 컬럼 승격은 운영 실측 후.                                                                                                      |

**API 계약**:

- `POST /api/admin/masters/refresh` — 전역(관리자 페이지). Manager 이상, 동일 사용자 쿨다운 5분. 응답 `{ swapped: true, loaded_at: <timestamp>, sources: { equipment, db } }`. 프로그램 마스터는 JSON 파일 고정 로드로 refresh 대상 제외. 2종 중 하나라도 실패 시 `{ swapped: false, error: <detail>, kept_loaded_at: <prev> }`.
- `POST /api/vocs/:id/masters/refresh` — 편집 화면 🔄. 위와 동일 규칙.
- 사용자 편집/저장 경로(`POST /api/vocs`, `PATCH /api/vocs/:id`)에서는 **외부 API 호출 없음**. BE 메모리 캐시만 사용.

**장애 fallback**: 마스터 시스템 전체 장애 → 스냅샷 모드 배지 노출 + 자유 입력 허용 + 전 필드 `unverified`. 리뷰 게이트에서 재확인.

### 16.4 대시보드 영향

- "필드별 unverified 분포" 위젯은 **MVP 미포함** (v3 §7.3 항목 #9). 운영 중 문제 발생 시 재고.

### 16.5 v3 리뷰 확정 이력 (2026-04-24)

이전 "미결 항목" 목록은 전부 확정됨. 기록용:

| 항목                                       | 결정                                                     | 반영 위치                                        |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| Q3 `status` 5단계 vs 4단계                 | **5단계 유지**                                           | §4 vocs, §8.2 매트릭스 유지                      |
| Q5 `is_golden_case`                        | **도입 유보 (컬럼 예약도 철회)**                         | 스키마 변경 없음                                 |
| Q7 `comments.visibility`                   | **`voc_internal_notes` 별도 테이블 + API 4개 + UI 분리** | §4 신규 테이블, §6.1 API, UI 규칙                |
| Q8 `vocs.source`                           | **MVP 도입** (`text+CHECK`, manual/import)               | §4 vocs 컬럼 + 운영 규칙, §12 SLA 제외           |
| Q9 `chatbot_session_id`/`linked_code_refs` | **도입 유보** (NextGen 재결정)                           | 스키마 변경 없음                                 |
| Q10 유사도 임계치                          | **MVP 제외** (환경변수 시작, NextGen에서 B 승격 재논의)  | 스키마 변경 없음                                 |
| 갭 #6 `tag_rules` 역할                     | **한정**: `general` 전용, 엔티티는 `structured_payload`  | §4 tag_rules·voc_tags, §16.1                     |
| 외부 검증 §7 (7A)                          | **편집 세션 BE 메모리 모델 + 10건 합의**                 | §4 `structured_payload.unverified_fields`, §16.3 |

### 16.6 외부 마스터 연동 명세

→ **`docs/specs/requires/external-masters.md`** 참조 (2026-04-24 작성).

필드-마스터 매핑 확정, DB 마스터 MSSQL 쿼리 확정, 프로그램 마스터 JSON 파일 방식 확정.
**설비 마스터 MSSQL 스키마만 TBD** — 담당자 자료 수집 후 `external-masters.md §3` 보완 + 로더 함수 교체.

Phase 4 5-Expert 잔여 7건은 모두 반영 완료 (2026-04-24):

| 항목                                       | 반영 위치                  |
| ------------------------------------------ | -------------------------- |
| AD 인증 `AUTH_MODE=mock\|oidc`             | §14.1 환경변수 표          |
| Sub-task 용어 통일                         | §2.3 + feature-voc.md §8.2 |
| 대시보드 API endpoint 표                   | §11.7                      |
| 환경변수 `AUTH_MODE`/`LOG_LEVEL`           | §14.1                      |
| 표준 에러 코드 목록                        | §6.1                       |
| 파일명 규칙 `{voc_id}/{uuid}-{원본파일명}` | feature-voc.md §8.5        |
| KPI 목표값(MVP는 SC-1·SC-2·SC-3만)         | §12 (기존 반영 완료)       |

## 17. 다방면 리뷰 결정 이력 (2026-04-26)

Phase 7 착수 전 종합 리뷰(project-full-review.md) 기반 의사결정 목록.

| 항목                                    | 결정                                                                                                                                                                                                                                                               | 반영 위치                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| D1 용어 통일 `type_id` vs `voc_type_id` | **`voc_type_id` 유지** — DB 변경 최소화                                                                                                                                                                                                                            | §4 vocs (이미 반영), 이 문서 §4 수정 완료                                                                  |
| D2 `notifications.voc_id` NULL 정책     | **NOT NULL 유지** — 모든 알림은 VOC 연결 필수                                                                                                                                                                                                                      | §4 notifications (현행 유지)                                                                               |
| D3 `structured_payload` 입력 폼 UX      | **별도 모달** — "결과 입력" 버튼 → 독립 모달 팝업                                                                                                                                                                                                                  | feature-voc.md §8.4 (Phase 7 구현 시 명세 추가)                                                            |
| D4 Sub-task API 응답 필드명             | **`subTasks[]`** — 1레벨 고정 의미 명확화                                                                                                                                                                                                                          | §6.1 GET /api/vocs 응답 스키마 (Phase 7 구현 시 반영)                                                      |
| D5 대시보드 시스템 탭                   | **동적** — `systems` 테이블 기반 렌더링                                                                                                                                                                                                                            | §11 대시보드 (Phase 7 구현 시 반영)                                                                        |
| D6 공지 상세 표시 방식                  | **드로어** — 기존 드로어 패턴과 일관성                                                                                                                                                                                                                             | feature-notice-faq.md (Phase 7 구현 시 반영)                                                               |
| D7 데이터 보존 기간                     | **무기한** — VOC soft delete 및 voc_history 모두                                                                                                                                                                                                                   | §14.3 운영 정책 (별도 정책 없음 = 물리 삭제 없음)                                                          |
| D8 알림 디바운스 구현 위치              | **앱 레이어 + DB 조회 기반** — 5분 dedup은 INSERT 직전 `notifications`를 (user_id, type, voc_id, created_at) 인덱스로 조회. 재시작·멀티 인스턴스 안전.                                                                                                             | §6.1 notification 서비스 (Phase 7 구현 시 반영), `migrations/011` notifications 인덱스                     |
| A3 Sub-task 채번 인프라 방식            | **`voc_subtask_counters` 별도 테이블** — 동시성 안전                                                                                                                                                                                                               | `migrations/009_subtask_infra.sql`                                                                         |
| A4 Sub-task 1레벨 DB 강제 방식          | **BEFORE INSERT/UPDATE 트리거**                                                                                                                                                                                                                                    | `migrations/009_subtask_infra.sql`                                                                         |
| D9 대시보드 KPI/주간 트렌드 기준 컬럼   | **`vocs.status_changed_at` 컬럼 추가 + 트리거 자동 갱신** — voc_history 풀스캔 회피                                                                                                                                                                                | §4 vocs, `migrations/011`, dashboard.md §5                                                                 |
| D10 dashboard 프리셋                    | **`1m / 3m / 1y / all / custom`** — FE 변경분과 스키마/요구문서 3중 동기화. 기존 데이터는 `7d→1m`, `30d→1m`, `90d→3m` 매핑                                                                                                                                         | §4 dashboard_settings, dashboard.md, `migrations/011`                                                      |
| D11 Mock User FK 운영 정책              | **DB seed 의무화** — `seeds/mock-users.sql`을 마이그레이션 직후 실행 (mock 환경)                                                                                                                                                                                   | §14.5, `backend/seeds/mock-users.sql`                                                                      |
| D12 `tag_rules` 매칭 모드               | **MVP 키워드 only** — 정규식·confidence는 NextGen에서 컬럼 확장 시 도입                                                                                                                                                                                            | §4 tag_rules, feature-voc.md §9.4.1                                                                        |
| D13 `vocs.parent_id` FK 삭제 동작       | **ON DELETE SET NULL** — 부모 hard delete 시 서브태스크 보존 (소프트 삭제 정책과 일관)                                                                                                                                                                             | §4 vocs, `migrations/011`                                                                                  |
| D14 사용자 초대 플로우                  | **AD/SSO 자동 생성** — 첫 로그인 시 `users` row 자동 생성, Admin이 사후 권한 승급. MVP는 사전 초대 미지원                                                                                                                                                          | §15.2                                                                                                      |
| D15 드로어 퍼머링크 복사 권한           | **전체 로그인 사용자** — 드로어가 열린 상태에서 누구나 클립보드 복사 가능, URL 자체는 접근 시점 권한 체크에 의존                                                                                                                                                   | feature-voc.md §8.x (퍼머링크 버튼)                                                                        |
| D16 VOC 목록 서브태스크 인라인 펼침     | **기본 접힘** — 부모 행 좌측 ▶ 토글 클릭 시만 자식 행 인라인 표시, 펼침 상태 영속화 안 함                                                                                                                                                                          | feature-voc.md §9.2                                                                                        |
| D17 입력 길이 제약 DB CHECK             | **DB CHECK 강제** — title 200자, body 64KB, comment/internal_note 16KB. 앱 레벨 검증과 이중 방어                                                                                                                                                                   | §4 vocs/comments, `migrations/011`                                                                         |
| D18 Dev role 추가                       | **`users.role` enum 4종 (`user/dev/manager/admin`)** — Dev = User + (assignee=self일 때만) Manager 운영 권한 + Dashboard 보기. Driver: Dashboard 접근은 ownership만으로 표현 불가 + 초대/승급 의미 단위 + role-pill 시각 정체성                                    | §2.3, §4 users, §14.5, §15.2, feature-voc.md §8.3, dashboard.md, `docs/specs/plans/migration-012-draft.md` |
| D19 공지/FAQ 관리 진입점                | **각 페이지 우측 상단 '관리' 버튼 + `?mode=admin` URL 쿼리** — Admin 탭의 공지/FAQ 서브탭 폐기. Admin/Manager에게만 버튼 노출. URL 쿼리로 deep-link/뒤로가기 보존                                                                                                  | feature-notice-faq.md §10.5(신), §10.3.4, §10.4.3, §10.6, design.md §13.8                                  |
| D20 design.md ↔ prototype 갭            | **§13 'Admin · Notice · FAQ Components' 신규 + §8 Don't에 raw color literal 금지 + §10에 `--role-dev-*` / `--text-on-brand` 신규 토큰 4종**                                                                                                                        | design.md §8/§10/§13, `docs/specs/reviews/design-prototype-audit.md`                                       |
| D21 Dev 권한 helper 단일화              | **BE 단일 helper `assertCanManageVoc(user, voc, action)`** — 모든 VOC 운영 라우트가 경유. ownership = `voc.assignee_id === user.id` strict 비교 (primary assignee만, sub-task assignee/co-assignee 미포함). 재배정 시 즉시 권한 박탈, unassigned VOC는 Dev 항상 ❌ | feature-voc.md §8.4-bis (신규)                                                                             |
