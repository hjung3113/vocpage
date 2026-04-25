# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-25 (20차 — Phase 7-1~7-6 구현 완료, 7-7~7-11 대기)
> 목표: 프로토타입 확정 → 문서 정비 → 구현 준비

## ✅ Phase 7 진입 전 Preflight — 완료 (2026-04-24, PR #28)

| 순서 | 항목                                                                                                                 | 상태 |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| 1    | `backend/migrations/003_vocs.sql` — `parent_id` / `issue_code`(트리거) / `due_date` 추가 + `reporter_id`→`author_id` | ✅   |
| 2    | `vocs.status` enum `'접수됨'`→`'접수'` 3-way 통일 (spec 2곳 수정, migration/openapi 이미 `'접수'`)                   | ✅   |
| 3    | `author_id` vs `reporter_id` 통일 + openapi nullable:false                                                           | ✅   |
| 4    | openapi.yaml 누락 엔드포인트 14개 추가 + schema drift 6건 교정                                                       | ✅   |
| 5    | 세션 스토어 `connect-pg-simple` → requirements.md §14.1 반영                                                         | ✅   |

추가 완료: heatmap 컬럼명 통일, `voc_payload_history` unique partial index, codegen 재실행

## 다음 세션 시작점

> 리뷰 문서: `docs/specs/reviews/phase7-entry-review-2026-04-24.md`

### Phase 7 진입 전 스펙 픽스 — 완료 (2026-04-25)

| 항목                                                                                             | 상태 |
| ------------------------------------------------------------------------------------------------ | ---- |
| G-2 CORS B안 — `cors()` 미들웨어, `.env.example` + `backend/src/index.ts` + `docker-compose.yml` | ✅   |
| G-3 issue_code prefix 동적 변환 명시 — `feature-voc.md §8.1`                                     | ✅   |
| G-5 Cold Start A안 — `requirements.md §16.3` 테이블 + `external-masters.md §8` 신규 섹션         | ✅   |
| env: `LOG_LEVEL`, `SESSION_STORE_URL`, `VITE_AUTH_MODE` 추가                                     | ✅   |
| M-2 unverified 필드 저장 허용 명시 — `requirements.md §16.3`                                     | ✅   |
| M-3 React Query staleTime 일괄 확정 — `requirements.md §3`                                       | ✅   |
| M-4 SESSION_STORE_URL 변수명 확정 — `.env.example`                                               | ✅   |
| M-7 댓글 이미지 형식 명시 (PNG/JPG/GIF/WebP) — `feature-voc.md §8.12`                            | ✅   |
| M-8 Sub-task 태그 cascade 없음 명시 — `feature-voc.md §8.7`                                      | ✅   |
| M-9 복원 VOC 태그 재실행 명시 — `requirements.md §4 tag_rules`                                   | ✅   |
| M-10 대시보드 복합 필터 AND 조건 명시 — `dashboard.md §B`                                        | ✅   |

### 사용자 결정 필요 (Phase 7 착수 전)

| #   | 항목                                                                                   | 선택지                        |
| --- | -------------------------------------------------------------------------------------- | ----------------------------- |
| G-1 | **설비 마스터 MSSQL 스키마** — 담당자 자료 수집 후 `external-masters.md §3` 업데이트   | 외부 의존 (담당자)            |
| G-4 | **폐쇄 메뉴 제거** — 개념 불필요 판단, 스펙 전체에서 삭제 (`is_self_review` 컬럼 포함) | ✅ 삭제 완료                  |
| M-1 | **unverified_fields 검증 세부 규칙** — `trim().toLowerCase()` 정규화 후 완전 일치 확정 | ✅ `requirements.md §4` 반영  |
| M-5 | **태그 규칙 삭제 권한** — Manager/Admin 모두 가능 확정                                 | ✅ `feature-voc.md §8.3` 반영 |
| M-6 | **신규 태그 생성 주체** — Manager/Admin 모두 가능 확정                                 | ✅ `feature-voc.md §8.3` 반영 |

### 위 사용자 결정 완료 후 → Phase 7 실구현 시작

1. **Phase 7 실구현 시작** — 6-8 ✅ 완료. feat/6-8-state-management 브랜치 PR 머지 후 진입

## Phase 7 착수 전 코드 결함 수정 (2026-04-25 적대적 리뷰 확인)

리뷰 문서: `docs/specs/reviews/phase7-pre-impl-adversarial-review-2026-04-25.md`

| ID  | 결함                                                  | 상태                                   |
| --- | ----------------------------------------------------- | -------------------------------------- |
| F-1 | seed `reporter_id` → `author_id` 드리프트             | ✅ 수정 완료 (fix/pre-phase7-defects)  |
| F-5 | `voc_type_id` vs `type_id` 스키마/OpenAPI 불일치      | ✅ 수정 완료 (fix/pre-phase7-defects)  |
| F-2 | Vite `/api` 프록시 누락 — 로컬 dev에서 auth 불가      | ✅ 수정 완료 (fix/pre-phase7-defects)  |
| F-3 | AUTH_MODE 신뢰 경계 — `createAuthMiddleware()` 미사용 | ✅ 수정 완료 (fix/pre-phase7-defects)  |
| F-4 | MemoryStore — production 재시작 시 세션 소실          | ➡️ Phase 8-1로 defer 확정 (2026-04-25) |

## Reviews 폴더 구조

```
docs/specs/reviews/
├── phase0/   prototype-requirements-review.md
├── phase2/   requirements-expert-review-2026-04-23.md, REVIEW-notice-faq.md
├── phase4/   requirements-5expert-review-2026-04-23.md
└── phase6/   design-enforcement.md              ← Phase 6-2 디자인 일관성 강제 체계 브레인스토밍
             voc-ai-workflow-fit-review.md        ← Phase 6-1 v1 (2026-04-23, 일부 폐기됨)
             voc-ai-workflow-fit-review-v2.md     ← Phase 6-1 v2 (2026-04-24, Q1·Q2 재결정 — canonical)
             voc-ai-workflow-fit-review-v3.md     ← Phase 6-1 v3 (2026-04-24, Q3~Q10 + 갭#6 + 7A 확정)
             phase7-preflight-adversarial-review.md ← Phase 7 진입 전 적대적 리뷰 (2026-04-24)
             phase7-entry-review-2026-04-24.md     ← Phase 7 진입 전 종합 리뷰 (2026-04-24) ★현재
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

### 권고 실행 순서 (2026-04-24 재조정)

```
6-4 스캐폴딩 & 개발환경   ✅ 완료 (2026-04-24)
6-6 인증 Mock 전략        ✅ 완료 (2026-04-24) — AUTH_MODE=mock, BE 7/FE 8 테스트
6-7 DB 마이그레이션 & 시드 ← 다음 블로킹. 테이블 없이 통합 테스트 작성 불가
6-5 FE-BE API 계약        ← DB + Auth 확정 후 API shape 정의
6-3 BE 테스트 전략         ← API shape 알아야 케이스 목록 작성 가능
6-8 상태 관리 방식 확정    ← React Context로 이미 확정, 문서화만
6-9 Prototype → 컴포넌트  ← FE 전용, 언제든 가능
```

> 기존 번호(6-3~6-9)는 참조 안정성을 위해 유지. 위 순서대로 진행.

### 구현 전 결정 필요 사항 (미결)

> 이 항목들이 미결인 채로 구현에 진입하면 중간에 구조 변경이 강제됩니다.

#### 🔴 고위험 (반드시 6-4 시작 전 결정)

> Phase 6 세션 시작 시 `phase6/CLAUDE.md` 를 먼저 읽을 것 — 미결 항목 현황 및 brainstorming 재개 지침 포함.

| 항목                     | 결정                                                                                                                              | 상태               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **DB 마이그레이션 도구** | **node-pg-migrate**                                                                                                               | ✅ 2026-04-24 확정 |
| **Mock API 전략**        | **MSW (Mock Service Worker)**                                                                                                     | ✅ 2026-04-24 확정 |
| **FE-BE 타입 공유 방식** | **OpenAPI codegen (`openapi-typescript`)** — `openapi.yaml` 단일 소스 → `shared/types/api.ts` 자동 생성, Swagger UI BE dev 마운트 | ✅ 2026-04-24 확정 |
| **파일 업로드 미들웨어** | **multer + DiskStorage** — Docker named volume(`uploads_data`), `voc_attachments` 메타데이터만 저장, MVP 후 S3 교체 가능          | ✅ 2026-04-24 확정 |
| **MSSQL 연결 드라이버**  | **mssql npm 패키지** — 읽기 전용, BE 부팅 시 pool 1회 생성                                                                        | ✅ 2026-04-24 확정 |

#### 🟠 중위험 (나중에 바꾸면 리팩 발생)

| 항목                      | 비고                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| **세션 스토어**           | 개발: 메모리, 운영: ? — express-session store 결정 필요              |
| **CORS 정책**             | Dev 환경 FE:5173 ↔ BE:3000 — Vite proxy vs BE cors() 미들웨어        |
| **issue_code prefix**     | `ANALYSIS-2025-0001` 고정 prefix인지, systems 테이블 기반인지 불명확 |
| **React Query staleTime** | 대시보드 5분 확정, VOC 목록 등 나머지 페이지 기본값 미정             |

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
- [x] Stylelint (`stylelint-declaration-strict-value`) + ESLint `no-restricted-syntax` + husky → 6-4 구현 계획에 포함 완료 (2026-04-24)

### 6-3. 백엔드 테스트 작성 전략 ✅ 완료 (2026-04-24)

> ✅ 구현 완료: PR #feat/6-5-6-3 브랜치

- [x] 테스트 DB 전략: **pg-mem (인메모리 PostgreSQL)** + MSSQL `jest.mock` — 실 DB 연결 없이 테스트
  - pgvector DDL 자동 스트리핑 (`embedding vector(1536)`, `CREATE EXTENSION vector`)
  - `uuid_generate_v4()` → `gen_random_uuid()` 자동 치환
- [x] `backend/src/db.ts` — pg Pool 싱글턴 + `setPool()` 테스트 주입 인터페이스
- [x] `backend/src/__tests__/helpers/db.ts` — pg-mem 기반 마이그레이션 헬퍼
- [x] `backend/src/__tests__/helpers/app.ts` — 테스트용 Express app 팩토리
- [x] 테스트 케이스 31개 (6 suite) — 31/31 통과
  - `health.test.ts`: `GET /api/health` 기본 응답
  - `auth.test.ts`: mock-login (3 role, bad role, oidc-mode 404), /me, logout + 세션 무효화
  - `vocs.test.ts`: 미인증 401, 권한 위반 403/404 (TDD 스타일 — 라우트 구현 시 tighten)
  - `permission.test.ts`: 역할 매트릭스 (user→notes 404, user→admin API 403/404)

### 6-4. 스캐폴딩 & 개발환경 설정 ✅ 완료 (2026-04-24)

> ✅ 설계 확정 (2026-04-24): `docs/specs/plans/phase6-4-scaffolding-design.md`
> ✅ 구현 완료: PR #14 (`docs/phase6-4-scaffolding-design` → main, 미머지)

- [x] 설계 결정: npm workspaces(A) + 루트 단일 `.env`(A) + lint-staged+tsc husky(B)
- [x] **Task 1**: 루트 workspace 파일 (commit: dbf1c76 일부)
- [x] **Task 2**: Frontend scaffold (Vite+React+Tailwind v4+tokens.ts skeleton)
- [x] **Task 3**: Backend scaffold (Express+ts-node-dev+/health)
- [x] **Task 4**: npm install + workspace 연결 확인 + commit dbf1c76
- [x] **Task 5**: frontend ESLint + Stylelint (hex 금지) — `.cjs` 확장자 사용 (ESM type:module 때문)
- [x] **Task 6**: backend ESLint (commit b227f69)
- [x] **Task 7**: husky + lint-staged (commit 6e8f136) — pre-commit hex 차단 검증 완료
- [x] **Task 8**: Dockerfiles (FE + BE)
- [x] **Task 9**: docker-compose.yml + .env.example + .gitignore (commit c505df0)
- [x] **Task 10**: `docker compose up` 스모크 테스트 + PR #14

> ⚠️ **포트 충돌 해결 (로컬 환경)**: 스모크 테스트 중 로컬 서비스와 충돌로 포트 리맵핑됨
>
> - postgres: `5433:5432` (호스트 5433 → 컨테이너 5432)
> - backend: `3001:3000` (호스트 3001 → 컨테이너 3000)
> - `.env.example`의 `VITE_API_BASE_URL=http://localhost:3000`은 **Docker 외부(로컬 dev) 기준**이라 그대로 유지
> - Docker 내부 컨테이너 간 통신은 서비스명(`backend:3000`) 사용 — 영향 없음
> - PR 머지 후 팀 환경에 맞게 포트 조정 필요 시 docker-compose.yml 수정

#### PR #14 리뷰 후 defer된 기술부채

> PR #14 코드 리뷰(2026-04-24)에서 식별됐으나 Phase 6-4 스코프 밖으로 분류된 항목.

| 항목                                                                               | 처리 시점                               | 비고                                                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `frontend/src/styles/index.css` raw OKLCH 중복 — `@theme`과 `:root` 양쪽 정의      | **Phase 6-9** (Prototype→컴포넌트 단계) | `tokens.ts` 단일 소스화 시 정리                                             |
| `ts-node-dev` → `tsx watch` 교체 — Node 22에서 불안정 이슈 있음                    | **6-6 이전 또는 6-7**                   | `tsx` 설치 후 `package.json` dev 스크립트 교체만으로 완료                   |
| ESLint hex 정규식 강화 — `TemplateElement` 미커버 (template literal 안 hex 허용됨) | **6-9 또는 첫 FE 컴포넌트 작업 전**     | `.eslintrc.base.js` `no-restricted-syntax` 에 `TemplateElement` 셀렉터 추가 |
| 구조화 로깅 (pino) 도입 — 현재 `console.log` 기반                                  | **BE 라우트 추가 단계 (7.x~)**          | 첫 라우트 추가 전에 baseline 잡을 것                                        |
| Dockerfile production stage 추가 — 현재 dev stage만 존재                           | **배포 준비 단계**                      | 지금 `ts-node-dev`가 유일한 시작 경로                                       |

### 6-5. FE-BE API 계약 ✅ 완료 (2026-04-24)

> ✅ 구현 완료: feat/6-5-6-3-api-contract-and-tests 브랜치

- [x] **타입 방식 결정**: `openapi-typescript` codegen — `shared/openapi.yaml` 단일 소스 → `shared/types/api.ts` 자동 생성
- [x] `@vocpage/shared` workspace 생성 (`shared/package.json`)
- [x] `shared/openapi.yaml` — OpenAPI 3.1.0, 60+ 엔드포인트 전체 정의 (auth/vocs/comments/notes/attachments/tags/notifications/dashboard/admin)
- [x] `shared/types/api.ts` — 2746줄 자동 생성 (codegen 42ms)
- [x] 루트 `package.json` `"codegen"` 스크립트 추가 — `openapi-typescript shared/openapi.yaml -o shared/types/api.ts`
- [x] BE dev 서버 `/api/docs` — `swagger-ui-express` 마운트 (`NODE_ENV !== 'production'`만)

### 6-6. 인증 Mock 전략 ✅ 완료 (2026-04-24)

> 구현 계획: `docs/specs/plans/2026-04-24-phase6-6-auth-mock.md`
> 커밋 범위: `489af19`..`6e5979b` (8 commits, main 머지 완료)
> 테스트: BE 7/7 (Jest+Supertest), FE 8/8 (Vitest+@testing-library/react)

- [x] `AUTH_MODE=mock` 환경변수 기반 미들웨어 팩토리 (`createAuthMiddleware`)
- [x] `mockAuth` 세션 미들웨어 — `req.session.user` → `req.user` 주입, 미인증 시 401
- [x] `oidcAuth` throw stub — prod 진입 시 빠른 실패
- [x] `POST /api/auth/mock-login` / `POST /api/auth/logout` / `GET /api/auth/me` 엔드포인트
- [x] mock user fixtures 3개 (admin/manager/user, 고정 UUID)
- [x] FE `/mock-login` 페이지 — `VITE_AUTH_MODE=mock` 시에만 등록, prod bundle tree-shaken
- [x] FE auth API client (`mockLogin`, `logout`, `getMe`)

### 6-7. DB 마이그레이션 & 시드 전략

> 설계 확정: `docs/specs/plans/2026-04-24-phase6-7-db-migration-design.md`
> 구현 계획: `docs/specs/plans/2026-04-24-phase6-7-db-migration-impl.md`
> PR #24 (설계+계획) · PR #25 (구현) — 모두 main 머지 완료 (2026-04-24)

- [x] 마이그레이션 도구: **node-pg-migrate**
- [x] 실행 시점: **자동** (Docker entrypoint.sh — migrate → dev)
- [x] 파일 구조: **도메인별 6파일** (001_extensions ~ 006_settings)
- [x] 시드 전략: **별도 스크립트** (`npm run db:seed`, 최초 1회 수동)
- [x] 테스트 DB: 6-3에서 결정
- [x] **구현 완료** ✅ 2026-04-24 (PR #25) — node-pg-migrate 설치, 마이그레이션 파일 6개, entrypoint.sh, dev_seed.sql, 스모크 테스트 통과 (21테이블, 시드 데이터 확인, sequence_no 트리거 검증)

### 6-8. 상태 관리 방식 확정 ✅ 완료 (2026-04-24)

> 설계: `docs/specs/plans/phase6-8-state-management.md`
> 브랜치: `feat/6-8-state-management` (커밋 835a201)

- [x] 전역 상태 범위 목록화 + 5개 Context (Auth/VOCFilter/VOCDrawer/Notification/MasterCache)
- [x] 5개 커스텀 훅 (useAuth/useVOCFilter/useDrawer/useNotifications/useMasterCache)
- [x] AppProviders 조합 + main.tsx 마운트
- [x] 테스트 26/26 통과 (Vitest + React Testing Library)

### 6-9. Prototype → 실구현 동일 재현 플로우

- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## Phase 7 착수 전 문서 수정 필수 (2026-04-25 리뷰 결과)

> 리뷰 문서: `docs/specs/reviews/phase7-pre-start-review-2026-04-25.md`

| ID  | 항목                                                                                    | 상태 |
| --- | --------------------------------------------------------------------------------------- | ---- |
| R-1 | `dashboard.md` — `보류→드랍`, `접수됨→접수` 일괄 치환 (openapi/migration과 정합)        | -    |
| R-2 | `dashboard_settings` — `globaltabs_order` migration 추가 여부 결정 + dashboard.md 정합  | -    |
| R-3 | `requirements.md §14.1` 세션 스토어 — "Phase 8-1 구현 예정, 현재 MemoryStore" 주석 추가 | -    |
| R-4 | `ts-node-dev → tsx watch` 교체 (backend/package.json `dev` 스크립트)                    | -    |
| R-5 | `pino` baseline 설치 (Phase 7 첫 라우트 전)                                             | ✅   |
| R-6 | prototype 섹션별 인벤토리 + React 매핑 규칙 문서화 (구 6-9, 7-1 착수 전)                | ✅   |

---

## Phase 7: 개발 스켈레톤

> **목표**: 로컬 dev 환경에서 전체 기능 동작 확인. production 고려 없음.
> **선행 조건**: Phase 6 전 항목 완료 + Phase 7 착수 전 코드 결함 수정(F-1~F-3, F-5) 완료 + 위 R-1~R-6 완료

### 상시 규칙 ⚠️ 구현 중 항상 적용

- [ ] 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- [ ] 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- [ ] 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- [ ] 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

### 기능 단계

| 단계 | 내용                                                                        | 상태 |
| ---- | --------------------------------------------------------------------------- | ---- |
| 7-0  | prototype 섹션 인벤토리 + React 매핑 문서화 (R-6 완료 후 7-1 착수 가능)     | ✅   |
| 7-1  | VOC 핵심 플로우 — CRUD, 상태 전환 (접수→검토→처리→완료/드랍)                | ✅   |
| 7-2  | 댓글 + 첨부파일                                                             | ✅   |
| 7-2a | Internal Notes (`voc_internal_notes`) — 보안 필수 3건 포함 (User→404 등)    | ✅   |
| 7-3  | 태그 + 태그 규칙 자동화 (갭 #6)                                             | ✅   |
| 7-4  | 대시보드 (위젯 데이터 API + 프론트) — `dashboard-v3.html` primary reference | ✅   |
| 7-5  | 공지사항 / FAQ                                                              | ✅   |
| 7-6  | 관리자 페이지 (사용자·카테고리·태그규칙·설정)                               | ✅   |
| 7-7  | 알림                                                                        | ✅   |
| 7-8  | Result Review 플로우 (review_status, voc_payload_reviews)                   | ✅   |
| 7-9  | Sub-task                                                                    | ✅   |
| 7-10 | 외부 마스터 연동 (stub JSON 기반, 실 MSSQL 아님)                            | -    |
| 7-11 | Storybook or 체크리스트 비교 방법 결정 + 전 컴포넌트 티켓화                 | -    |

---

## Phase 8: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.
> **선행 조건**: Phase 7 전 항목 완료

| 단계 | 내용                                                            | 비고                          |
| ---- | --------------------------------------------------------------- | ----------------------------- |
| 8-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4                           |
| 8-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |                               |
| 8-3  | Production Dockerfile + 빌드 파이프라인                         | defer된 기술부채              |
| 8-4  | 구조화 로깅 (`pino`) — Phase 7 착수 전으로 앞당기기 권고        | defer된 기술부채 → R-5로 이동 |
| 8-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | G-1 외부 의존                 |
| 8-6  | 배포 + smoke test                                               |                               |
| 8-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  | 신규 (2026-04-25 리뷰)        |
| 8-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           | 신규 (2026-04-25 리뷰)        |

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
