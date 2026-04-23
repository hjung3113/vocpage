# VOC 핵심 기능 명세

> **상위 문서**: `docs/specs/requires/requirements.md`

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

> **참고**: 위 테이블의 `보류`는 requirements.md §4에서 `드랍`으로 대체 결정됨. 5단계 유지 vs 4단계 단순화 결론 시 본 매트릭스도 함께 갱신 예정.

#### 8.2.1 review_status 서브 상태 머신

`vocs.status`가 완료 또는 드랍으로 전환되는 순간 `structured_payload` 정식 제출 + `review_status='unverified'` 초기화가 동시에 일어난다. 이후 `review_status`는 별도 서브 상태 머신으로 관리한다.

```
(null) ──완료/드랍 전환 + payload 제출──▶ unverified ──approve──▶ approved
                                                │
                                                └─reject──▶ rejected ──재제출──▶ unverified

approved ──"승인 결과 삭제 신청"──▶ pending_deletion ─┬─approve──▶ (payload NULL, review_status=null, 재작성 가능)
                                                      │
                                                      └─reject───▶ approved (원복)
```

- 전환 권한: Manager/Admin + (폐쇄 메뉴 케이스) 담당자 self-review. self-review 시 `voc_payload_reviews.is_self_review=true`로 감사 추적.
- 제출 스냅샷은 `voc_payload_history`에 `is_current=true`로 insert — 기존 `is_current` row는 false로 내림.
- 삭제 승인 시: 해당 스냅샷 `final_state='deleted'`, `is_current=false`, `vocs.structured_payload=NULL`, `vocs.review_status=NULL`.
- 삭제 reject 시: `vocs.review_status='approved'` 원복 + `action='deletion', decision='rejected'` 리뷰 row만 추가.
- 임베딩(`vocs.embedding`)은 `approved` 전환 시점에만 생성/갱신. 재작성 발생 시 `embed_stale=true` 마킹 후 다음 approve에서 재임베딩 + 플래그 해제. (MVP 단계에서는 정책만 예약, 실제 생성 미실행)

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
- 아카이브 처리 시 신규 VOC에서 선택 불가, 기존 데이터는 유지

#### 9.4.4 사용자 관리
- 테이블: 이름 | AD 계정 | 이메일 | 역할(User/Manager/Admin) | 활성 여부 | 작업
- 역할 변경: 인라인 드롭다운으로 즉시 변경
- 마지막 Admin 강등 불가 (경고 표시)
- 본인 계정 역할 변경 불가

#### 9.4.5 Result Review
- **목적**: 완료/드랍 시 제출된 `structured_payload`를 검증 게이트로 확정/반려. 확정본만 임베딩·유사도 검색 파이프라인에 투입.
- **대상 행**: `review_status IN ('unverified','pending_deletion')` VOC.
- **테이블 컬럼**: 이슈 ID | 제목 | 상태(vocs.status) | 리뷰 상태(`review_status`) | 액션 종류(`submission`/`deletion`) | 담당자 | 제출자 | 제출일 | 작업(approve/reject)
- **탭/필터**: "제출 검토(unverified)" / "삭제 신청(pending_deletion)" 기본 분리. 시스템/메뉴/담당자 공통 필터 지원.
- **액션 UI**:
  - 행 선택 → 우측 드로어에 payload diff(현재 `is_current` 스냅샷 vs 신규 제출) + 코멘트 입력창.
  - `approve` / `reject` 버튼. reject 시 코멘트 필수.
  - 결정은 `voc_payload_reviews`에 `action` + `decision` + `comment` + `is_self_review` 기록.
- **self-review**: 폐쇄 메뉴(담당자 본인만 접근 가능한 시스템/메뉴) 케이스 수용. 동일 UI에서 허용하되 `is_self_review=true` 플래그로 감사 추적만 남김. 별도 모니터링 대시보드 없음.
- **권한**: Manager/Admin + (self-review 허용 시) 해당 VOC 담당자 본인.
- **연관 갱신 규칙**:
  - 제출 approve → `vocs.structured_payload` 확정, 해당 history row `is_current=true`/`final_state='approved'` 유지, `vocs.embed_stale=true`면 임베딩 재생성(MVP는 미실행).
  - 제출 reject → `vocs.review_status='rejected'`, payload 본 컬럼은 유지(담당자 수정/재제출 가능), history row `final_state='rejected'`.
  - 삭제 approve → `vocs.structured_payload=NULL`, `vocs.review_status=NULL`, 해당 history row `final_state='deleted'`/`is_current=false`. 담당자는 이후 "결과 작성"을 다시 수행 가능.
  - 삭제 reject → `vocs.review_status='approved'` 원복, `action='deletion', decision='rejected'` 리뷰 row만 추가.

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
