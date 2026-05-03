# VOC 핵심 기능 명세

> **상위 문서**: `docs/specs/requires/requirements.md`

---

## 8. 상세 기능 명세

### 8.1 VOC 식별자 (Issue Code)

- 형식: `{시스템슬러그}-{yyyy}-{순번4자리}` (예: `ANALYSIS-2025-0001`)
- 시스템 슬러그는 ASCII URL-safe 문자열로 저장 (예: `analysis`, `pipeline`). `issue_code`에는 슬러그 값을 대문자로 사용. **prefix는 고정값이 아닌 시스템별 동적 변환** — `analysis` → `ANALYSIS-`, `pipeline` → `PIPELINE-` 등 시스템 slug에 따라 결정됨.
- 시스템별·연도별 독립 순번. 삭제된 VOC의 순번은 재사용하지 않음 (증가 전용).
- 시스템명 변경 후에도 기존 VOC의 `issue_code`는 불변.
- 동시 생성 경합은 DB sequence로 원자성 보장.
  - sequence 이름 규칙: `seq_{system_slug}_{yyyy}` (예: `seq_analysis_2025`).
  - 연도 전환: 매년 1월 1일 신규 sequence 자동 생성 (DB 트리거 또는 초기화 스크립트).
- 순번 상한 9999 초과 시 5자리로 자동 확장 (`0001` → `00001`).

### 8.2 상태 전환 매트릭스

#### 허용/비허용 전환표

| 출발 상태 \ 도착 상태 | 접수 |   검토중    |   처리중    | 완료 | 드랍 |
| :-------------------- | :--: | :---------: | :---------: | :--: | :--: |
| 접수                  |  —   |     ✅      |     ❌      |  ❌  |  ✅  |
| 검토중                |  ❌  |      —      |     ✅      |  ❌  |  ✅  |
| 처리중                |  ❌  |     ❌      |      —      |  ✅  |  ✅  |
| 완료                  |  ❌  |     ❌      | ✅ (재오픈) |  —   |  ❌  |
| 드랍                  |  ❌  | ✅ (재오픈) | ✅ (재오픈) |  ❌  |  —   |

- ✅ = 허용, ❌ = 비허용, — = 자기 자신 (전환 없음)

#### UI 행동 규칙

- 드로어/목록의 상태 변경 드롭다운에서 **비허용 전환(❌ 셀)에 해당하는 상태 옵션은 `disabled` 속성으로 렌더링**하고 시각적으로 흐리게 표시. 선택 불가.
- 비허용 상태에 hover 시 툴팁 "이 상태로는 직접 전환할 수 없습니다" 표시.
- 드롭다운은 항상 5개 옵션을 모두 표시하되, 비허용 항목만 `disabled`. (옵션을 숨기지 않음 — 전체 흐름 파악을 위해)

#### 전환 권한

| 현재 상태 | 가능한 다음 상태        | 권한                              |
| :-------- | :---------------------- | :-------------------------------- |
| 접수      | 검토중, 드랍            | Manager, Admin (Dev: 본인 담당만) |
| 검토중    | 처리중, 드랍            | Manager, Admin (Dev: 본인 담당만) |
| 처리중    | 완료, 드랍              | Manager, Admin (Dev: 본인 담당만) |
| 완료      | 처리중 (재오픈)         | Manager, Admin (Dev: 본인 담당만) |
| 드랍      | 검토중, 처리중 (재오픈) | Manager, Admin (Dev: 본인 담당만) |

- 상태 5단계: `접수/검토중/처리중/완료/드랍` (v3 §1.4 확정, 2026-04-24 — 5단계 유지, 4단계 축소 폐기).
- 상태 변경 시 `voc_history`에 이력 기록 (변경 전·후 상태, 변경자, 타임스탬프).
- 상태 변경 시 VOC 작성자 및 담당자에게 인앱 알림 발송.
- 미완료 Sub-task가 있는 부모 VOC를 '완료'로 전환 시 경고 메시지 후 강제 진행 가능. Sub-task 상태는 변경되지 않으며 담당자가 개별 처리.
- `완료`/`드랍` 전환 시점에 `structured_payload` 정식 제출 + `review_status='unverified'` 초기화가 동시에 발생 (§8.2.1).

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

- 전환 권한: Manager/Admin, Dev(본인 담당 VOC 한정 — §8.4-bis 헬퍼 경유).
- 제출 스냅샷은 `voc_payload_history`에 `is_current=true`로 insert — 기존 `is_current` row는 false로 내림.
- 삭제 승인 시: 해당 스냅샷 `final_state='deleted'`, `is_current=false`, `vocs.structured_payload=NULL`, `vocs.review_status=NULL`.
- 삭제 reject 시: `vocs.review_status='approved'` 원복 + `action='deletion', decision='rejected'` 리뷰 row만 추가.
- 임베딩(`vocs.embedding`)은 `approved` 전환 시점에만 생성/갱신. 재작성 발생 시 `embed_stale=true` 마킹 후 다음 approve에서 재임베딩 + 플래그 해제. (MVP 단계에서는 정책만 예약, 실제 생성 미실행)

### 8.3 권한 모델

> **Dev role 추가 (D18, 2026-04-26 확정).** `🟡 own` = `voc.assignee_id === req.user.id`인 경우에만 허용. unassigned(`assignee_id IS NULL`)이거나 다른 사용자에게 재배정된 VOC에는 적용되지 않음. 모든 권한 분기는 BE 단일 helper `assertCanManageVoc(user, voc, action)`(§8.4-bis)을 경유한다.

| 기능                                  | User |  Dev   | Manager | Admin |
| :------------------------------------ | :--: | :----: | :-----: | :---: |
| VOC 작성                              |  ✅  |   ✅   |   ✅    |  ✅   |
| 본인 VOC 조회                         |  ✅  |   ✅   |   ✅    |  ✅   |
| 전체 VOC 조회                         |  ❌  |   ✅   |   ✅    |  ✅   |
| 상태 변경                             |  ❌  | 🟡 own |   ✅    |  ✅   |
| 상태 변경 — unassigned VOC            |  ❌  |   ❌   |   ✅    |  ✅   |
| 상태 변경 — 재배정 직후 (이전 담당자) |  ❌  |   ❌   |   ✅    |  ✅   |
| 담당자 배정/해제                      |  ❌  |   ❌   |   ✅    |  ✅   |
| Priority / Due Date 설정              |  ❌  | 🟡 own |   ✅    |  ✅   |
| Sub-task 생성/닫기                    |  ❌  | 🟡 own |   ✅    |  ✅   |
| Internal Note R·W                     |  ❌  | 🟡 own |   ✅    |  ✅   |
| Timeline의 internal note 이벤트 수신  |  ❌  | 🟡 own |   ✅    |  ✅   |
| Dashboard 접근                        |  ❌  |   ✅   |   ✅    |  ✅   |
| VOC Soft Delete / 복원                |  ❌  |   ❌   |   ❌    |  ✅   |
| 시스템/메뉴/유형 관리                 |  ❌  |   ❌   |   ❌    |  ✅   |
| 태그 규칙 관리(생성/수정/삭제)        |  ❌  |   ❌   |   ✅    |  ✅   |
| 신규 태그 생성                        |  ❌  |   ❌   |   ✅    |  ✅   |
| 태그 수동 편집                        |  ❌  | 🟡 own |   ✅    |  ✅   |
| 사용자 role 관리 (승급/강등)          |  ❌  |   ❌   |   ❌    |  ✅   |
| 공지사항 작성/관리                    |  ❌  |   ❌   |   ✅    |  ✅   |
| FAQ 작성/관리                         |  ❌  |   ❌   |   ✅    |  ✅   |
| 공지사항 복원                         |  ❌  |   ❌   |   ❌    |  ✅   |

- Admin과 Manager의 기능 권한은 사실상 동일. Admin 전용 차별 기능: ① 사용자 role 변경(`user`/`dev`/`manager`/`admin`), ② 시스템/메뉴/유형 관리, ③ Soft Delete/복원.
- **Dev**는 기본적으로 User 권한이며, 본인이 `assignee_id`로 지정된 VOC에 한해 위 `🟡 own` 행 권한이 부여된다. Dashboard는 Dev에게 항상 허용.
- **Dev에게 Dashboard 권한을 부여하는 driver**: Dashboard 접근 여부는 ownership 술어로 표현 불가 → 4번째 enum 값 정당화. 또한 role-pill UI에서 "내부 엔지니어" 시각 정체성 부여.
- 최초 Admin 계정: 서버 초기화 시 환경변수 `INIT_ADMIN_EMAIL` 지정 계정을 admin role로 seed.
- 퇴직·부서이동 시 역할 회수 및 `is_active` 비활성화는 Admin이 수동 처리.
- 마지막 Admin 강등 불가 판정 기준: `is_active = true AND role = 'admin'` 인 계정 수 ≥ 2일 때만 강등 가능. 권한 변경 API에서 트랜잭션 내 사후 Admin 수 검증. **Admin이 본인을 `dev`로 강등하는 경우도 동일 가드 적용**.
- 본인의 권한을 본인이 변경 불가.

### 8.4-bis `assertCanManageVoc` Helper (D21 확정, 2026-04-26)

> 권한 매트릭스의 `🟡 own` 분기를 모든 VOC 운영 라우트가 단일 helper로 경유하도록 강제. 분산된 분기 코드의 누락에 의한 권한 우회를 구조적으로 차단한다.

#### 시그니처

```ts
type VocAction =
  | 'changeStatus'
  | 'setPriority'
  | 'setDueDate'
  | 'editTags'
  | 'createSubtask'
  | 'closeSubtask'
  | 'readInternalNote'
  | 'writeInternalNote';

function assertCanManageVoc(
  user: { id: string; role: 'user' | 'dev' | 'manager' | 'admin' },
  voc: { id: string; assignee_id: string | null; deleted_at: Date | null },
  action: VocAction,
): void; // throw FORBIDDEN(403) on deny, return on allow
```

#### 동작 규칙

1. **Admin / Manager**: 항상 허용 (단, Soft-deleted VOC는 별도 helper로 가드).
2. **Dev**: `voc.assignee_id === user.id`일 때만 위 action 모두 허용. 그 외는 `FORBIDDEN`.
3. **Dev — unassigned VOC**: `voc.assignee_id === null` → `FORBIDDEN` (담당자 미정 VOC는 Manager/Admin만 운영).
4. **Dev — 재배정**: `assignee_id`가 다른 사용자로 변경된 시점부터 즉시 `FORBIDDEN`. 진행 중인 sub-task/internal note write 트랜잭션은 commit 시점에 다시 helper로 재검증한다.
5. **User**: 모든 action에 대해 `FORBIDDEN`.

#### Ownership 정의

- **`assignee_id` (primary assignee)** 만 검사. Sub-task의 assignee, co-assignee 등 다른 형태의 "관여"는 ownership으로 간주하지 않음.
- VOC 모델 전반에 단일 컬럼 정책 — 향후 co-assignee/sub-task assignee 도입 시 본 helper의 ownership 정의를 명시적으로 확장 (호환성 깨는 변경으로 분류).

#### 회귀 테스트 필수 5건

1. Dev가 본인 담당 VOC의 상태를 `접수 → 검토중`으로 변경 → 200.
2. Dev가 타인 담당 VOC의 상태 변경 시도 → 403 `FORBIDDEN`.
3. Dev가 unassigned VOC의 Priority 변경 시도 → 403 `FORBIDDEN`.
4. Dev가 본인 담당 VOC에 internal note 작성 → 200.
5. Dev가 담당이던 VOC가 Manager에 의해 재배정된 직후 동일 VOC에 internal note 작성 시도 → 403 `FORBIDDEN`.

### 8.4 Priority

- 4단계: `urgent` / `high` / `medium` (기본값) / `low`
- 생성 시 서버에서 `medium`으로 강제 설정 (클라이언트 값 무시).
- Manager/Admin, 그리고 본인 담당 VOC에 한해 Dev가 변경 가능 (§8.4-bis 헬퍼 경유). 변경 이력은 `voc_history`에 기록.

#### 8.4.0 Priority 필드 권한 매트릭스

| 역할    | 읽기 | 쓰기 조건                                        |
| :------ | :--: | :----------------------------------------------- |
| User    |  ✅  | ❌ (읽기 전용)                                   |
| Dev     |  ✅  | ✅ 본인 담당(`assignee_id === user.id`)인 경우만 |
| Manager |  ✅  | ✅ 항상                                          |
| Admin   |  ✅  | ✅ 항상                                          |

- 모든 쓰기 분기는 `assertCanManageVoc(user, voc, 'setPriority')` 경유 (§8.4-bis).

#### 8.4.1 Due Date 자동 설정

| Priority | 기본 처리 기한 |
| -------- | -------------- |
| urgent   | 생성일 + 7일   |
| high     | 생성일 + 14일  |
| medium   | 생성일 + 30일  |
| low      | 생성일 + 90일  |

- VOC 생성 시 Priority 기반으로 `due_date` 자동 계산 후 저장.
- Priority 변경 시 `due_date` 자동 재계산.
- Manager/Admin은 개별 VOC의 `due_date` 수동 수정 가능 (수동 수정 시에도 Priority 재변경이면 재계산).
- `due_date` 변경 이력은 `voc_history`에 기록.

#### 8.4.2 Due Date 필드 UI 및 권한 명세

**데이터 모델**: `vocs.due_date DATE` (이미 존재).

**권한 매트릭스**

| 역할    | 읽기 | 쓰기 조건                                        |
| :------ | :--: | :----------------------------------------------- |
| User    |  ✅  | ❌ (읽기 전용)                                   |
| Dev     |  ✅  | ✅ 본인 담당(`assignee_id === user.id`)인 경우만 |
| Manager |  ✅  | ✅ 항상                                          |
| Admin   |  ✅  | ✅ 항상                                          |

- 모든 쓰기 분기는 `assertCanManageVoc(user, voc, 'setDueDate')` 경유 (§8.4-bis).

**드로어 UI**

- 위치: VOC 드로어 메타 정보 영역 (Priority 필드 바로 아래).
- 입력 컨트롤: `<input type="date">`. 브라우저 네이티브 날짜 선택기 사용.
- 읽기 전용 상태(User 또는 타인 담당 Dev): 날짜를 텍스트로만 표시, 입력 필드 미노출.
- 쓰기 권한자는 날짜 선택기가 활성화되며, 값 변경 즉시 `PATCH /api/vocs/:id` 호출 (자동저장).
- **과거 날짜 허용**: 이미 처리된 건의 실제 완료일 등 회고적 입력을 위해 과거 날짜 제한 없음.
- 날짜 미설정 시 "기한 없음" 표시.
- `due_date`가 오늘 기준 경과(D-day 초과) 시 날짜 텍스트를 강조색(`var(--status-danger)`)으로 표시.

### 8.5 파일 첨부

- 허용 형식: PNG, JPG, GIF, WebP (이미지만)
- 최대 크기: 10MB / 파일
- 최대 개수: 5개 / VOC (본문 기준. 댓글 이미지는 별도)
- **합산 cap (Wave 1.7, 2026-05-03)**: VOC 등록 모달에서는 본문 inline 이미지 + 첨부 zone 이미지 **유니크 합집합 기준 5개 / 합산 10MB**로 cap 적용 (§9.11.2 dedup 룰: name+size+lastModified). 드로어 편집(`PATCH /api/vocs/:id` + `POST /api/attachments`)에서도 동일 합산 룰 적용. 댓글 첨부는 별도 cap (§8.13).
- 업로드 검증: MIME 스니핑 + 확장자 일치 검증. 실행 파일 헤더 차단. SVG 명시적 차단 (XSS 위험).
- 파일 서빙: `Content-Disposition: attachment` 강제 (인라인 렌더링 방지).
- GIF 크기 검증: 원본 파일 바이트 기준 (디코딩 전 raw bytes).
- **파일명 저장** (v3 §8.6 확정): `storage_path = {voc_id}/{uuid}-{원본파일명}` 형식. UUID prefix로 충돌·path traversal 방어, 원본 파일명은 Content-Disposition·`attachments.filename` 컬럼용으로 보존. 다운로드 시 `Content-Disposition: attachment; filename="{원본파일명}"`로 재조립.
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
- **자동 태깅 cascade 없음**: 부모 VOC 편집 시 Sub-task에 `tag_rules` 재실행하지 않음. 각 VOC는 자신의 `title`/`body` 변경 시에만 독립적으로 태그 재계산됨.

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

- 키워드 규칙 기반으로 VOC 생성 시 자동 부여 (MVP 키워드 단일 모드 — D12, 정규식·confidence는 NextGen에서 컬럼 확장 시 도입).
- Admin/Manager, 그리고 본인 담당 Dev는 오탐 정정을 위해 개별 VOC의 태그를 수동으로 추가/삭제 가능. 이력은 `voc_history`에 기록. User는 읽기 전용.
- 유형과 역할 구분: 유형은 성격 분류(1개), 태그는 토픽 클러스터링(N개).

#### 8.8.1 드로어 태그 수동 편집 UI (C7)

**태그 chip 표시**

- VOC 드로어 메타 영역에 현재 태그를 chip 형태로 나열.
- **자동 태그**(tag_rules 매칭으로 부여): 옅은 회색 배경(`var(--bg-subtle)`), 텍스트 `var(--text-secondary)`.
- **수동 태그**(사람이 직접 추가): 기본 chip 스타일(`var(--bg-tag)`, 텍스트 `var(--text-primary)`).
- 두 종류는 `voc_tags.source` 컬럼(`'auto' | 'manual'`)으로 구분.

**태그 추가**

- 쓰기 권한자(Admin/Manager/본인 담당 Dev)에게는 chip 목록 끝에 "＋ 태그 추가" 버튼 표시.
- 클릭 시 인라인 `<input type="text">` 활성화. 마스터 태그 목록(`tags` 테이블)에서 자동완성 드롭다운 표시 (입력한 문자열 prefix 매칭).
- 이미 부여된 태그는 자동완성 목록에서 제외.
- Enter 또는 드롭다운 항목 선택 시 태그 추가 (`PATCH /api/vocs/:id/tags`). `source='manual'` 로 기록.
- 마스터 태그 목록에 없는 문자열 입력 시 "등록된 태그가 없습니다" 안내. 새 태그 즉석 생성 불가 — 신규 태그 생성은 Admin/Manager 전용 관리 페이지에서만 가능.

**태그 제거**

- 쓰기 권한자에게는 각 chip에 ✕ 버튼 표시. 클릭 시 즉시 제거 (`DELETE /api/vocs/:id/tags/:tagId`).
- 읽기 전용 상태(User, 타인 담당 Dev)에서는 ✕ 미노출.
- 자동 태그도 수동으로 제거 가능 (오탐 정정 목적). 제거 후 동일 tag_rule이 재실행되어도 재부여하지 않음 — 수동 제거 이력을 `voc_history`에 기록하고 재실행 시 제외 처리.

**권한 분기**

- 모든 태그 편집 요청은 BE에서 `assertCanManageVoc(user, voc, 'editTags')` 경유 (§8.4-bis).

#### 8.8.2 VOC 등록 모달 자동 태그 추천 UI (Minor)

- VOC 등록 모달에서 본문(`body`) 필드 변경 후 **500ms debounce** 후 `tag_rules` 전체를 클라이언트에서 매칭 (또는 `POST /api/tags/suggest` API 호출).
- 매칭된 규칙이 있으면 입력창 하단에 "추천 태그: **X**, **Y**" chip 목록 표시.
- chip 클릭 시 해당 태그가 "추가 예정 태그" 영역으로 이동. 모달 제출 시 `source='auto'` 로 일괄 저장.
- 추천 태그가 없으면 해당 UI 영역 미표시 (공간 낭비 없음).
- 모달 내 추천은 미리보기 용도이며, VOC 생성 API 서버 사이드에서도 동일 tag_rules 재실행 — 클라이언트 추천과 서버 결과 불일치 시 서버 결과 우선.

#### 8.8.3 태그 규칙 관리 편집 방식 (Minor)

- Admin 태그 규칙 관리 페이지에서 규칙 생성/수정은 **모달 방식** 사용.
- 근거: 시스템·메뉴·유형 등 다른 Admin CRUD 항목과 일관성 유지. 인라인 편집은 긴 정규식 입력 시 레이아웃 깨짐 위험.
- 모달 필드: 규칙 이름, 키워드(쉼표 구분), 대상 태그(드롭다운), 활성화 토글.
- 규칙 목록 테이블에서 "편집" 버튼 클릭 → 모달 열림. "삭제" 버튼 클릭 → 인라인 확인 후 즉시 삭제.

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
- **페이지네이션:** 오프셋 기반. 페이지당 항목 수는 §9.8 동적 계산 공식 적용. `GET /api/vocs?page=1&limit={N}&status=접수&priority=urgent,high&systemId=...&menuId=...&type=bug&assigneeId=...&q=keyword&sort=created_at&order=desc`
- **정렬:** 기본 `created_at DESC`. `?sort=issue_code|title|status|assignee|priority|created_at&order=asc|desc` 지원.
- **계층형 표시:** 부모 VOC가 필터 조건에 일치하면 해당 Sub-task를 들여쓰기 형태로 함께 표시. Sub-task 단독으로는 상위 목록에 미노출. 페이지네이션 단위: 부모 VOC 기준 (Sub-task는 건수 미계산).

### 8.12 파일 저장소

- 첨부 파일은 BE 컨테이너의 Docker volume(`/uploads/{voc_id}/`)에 저장.
- 댓글 이미지 저장 경로: `/uploads/comments/{comment_id}/`. `attachments` 행 별도 생성 없음 (Toast UI Editor 업로드 엔드포인트 별도 운영).
  - 댓글 이미지: 파일당 5MB, 최대 5개/댓글. 허용 형식: PNG, JPG, GIF, WebP (VOC 본문 첨부와 동일).
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

### 8.16 Internal Notes (내부 메모)

(Q7 확정, v3 §3.4 — requirements.md §4 `voc_internal_notes` 참조)

담당자 전용 내부 메모. 트리아지·보류 사유·재현 로그 등 외부 공개가 불필요한 내용을 기록한다. 공개 댓글(`comments`)과 **테이블 자체를 분리**하여 쿼리 누락에 의한 유출 사고를 구조적으로 차단한다.

#### 권한

- Manager/Admin은 항상 읽기·쓰기. **Dev는 본인이 `assignee_id`로 지정된 VOC에 한해 읽기·쓰기**(D18). User는 엔드포인트 도달 자체 차단 (404 반환 — 존재 자체 은닉). 본인 담당이 아닌 VOC를 조회하는 Dev에게도 동일하게 404 반환.
- User 로그인 시 Internal Notes 섹션을 **DOM에 렌더링하지 않음** (조건부 렌더 아님 — DOM 생성 자체 차단). Dev는 본인 담당 VOC가 아닐 경우 동일하게 DOM 미렌더링.

#### API

| 메서드   | 경로                          | 권한                     | 비고                                                        |
| -------- | ----------------------------- | ------------------------ | ----------------------------------------------------------- |
| `GET`    | `/api/vocs/:id/notes`         | Manager, Admin, Dev(own) | User → 404. Dev는 `assignee_id≠self`일 때도 404 (존재 은닉) |
| `POST`   | `/api/vocs/:id/notes`         | Manager, Admin, Dev(own) | Dev는 본인 담당 VOC에서만                                   |
| `PATCH`  | `/api/vocs/:id/notes/:noteId` | 작성자, Admin            | 작성자가 Dev일 경우 본인 담당 유지 시에만                   |
| `DELETE` | `/api/vocs/:id/notes/:noteId` | 작성자, Admin            | Soft Delete. 작성자가 Dev일 경우 본인 담당 유지 시에만      |

- `GET /api/vocs/:id/comments` (공개 댓글)는 internal note를 **절대 혼입하지 않음**.

#### UI

- VOC 상세 우측 패널에 **"Internal Notes"** 섹션을 공개 댓글과 **별도 배치**.
- warning/accent 계열 배경으로 시각 구분 — 공개 댓글과 외관상 명확히 다르게.
- 수정/삭제 정책: 작성자 본인 수정·삭제 가능, Admin 전체 삭제 가능. Soft Delete. `updated_at` 갱신 및 UI "(수정됨)" 표시.

#### Timeline 통합

- Manager/Admin/**Dev(본인 담당 VOC 한정)** Timeline 뷰에서 **공개 댓글 + internal note + status change**를 `created_at` 기준 시간순 혼합 표시.
- 각 이벤트 타입은 배지/배경으로 구분하여 한눈에 식별 가능하게.
- User role 및 본인 담당이 아닌 VOC를 보는 Dev에게는 Timeline API 응답에서 internal note 이벤트를 **포함하지 않음** (필터링, 404 아님).

#### 회귀 테스트 필수 3건

1. User가 `GET /api/vocs/:id/notes` 호출 시 **404** 반환.
2. `GET /api/vocs/:id/comments` 응답에 internal note **절대 미포함**.
3. Timeline API에서 User role은 internal note 이벤트 **수신 불가**.
4. Dev가 본인 담당이 **아닌** VOC의 `GET /api/vocs/:id/notes` 호출 시 **404** 반환 (존재 은닉 일관).
5. Dev가 담당이던 VOC가 재배정된 직후 Timeline API 호출 시 internal note 이벤트 **수신 불가**.

### 8.17 드로어 퍼머링크 복사

(D15 확정, 2026-04-26)

드로어 상단 우측 액션 버튼 영역에 링크(🔗) 아이콘을 배치, 클릭 시 현재 VOC의 퍼머링크를 클립보드에 복사한다.

- **URL 형식**: `${origin}/vocs/${issue_code}` — sequence_no가 아닌 issue_code 사용 (사람이 읽을 수 있는 식별자).
- **권한**: 드로어가 열린 모든 로그인 사용자. 별도 권한 분기 없음 (URL 자체는 접근 시점에 라우터/API 권한 체크에 의존).
- **동작**: `navigator.clipboard.writeText(url)` 성공 시 토스트 "링크가 복사되었습니다" 노출 (2초). 실패 시 토스트 "복사 실패 — 직접 선택해 복사해 주세요" + 동일 URL 텍스트 prompt.
- **위치**: 드로어 헤더 우측 버튼 그룹 — 풀스크린(↗) · **링크(🔗)** · 삭제(🗑, 권한자만) · 닫기(✕) 순.
- **접근성**: `aria-label="링크 복사"`, 키보드 포커스 가능.

---

## 9. 프로토타입 리뷰 기반 추가 요구사항 (2026-04-21)

### 9.1 필터 고급 옵션

- **담당자 필터:** 담당자 단일 선택으로 VOC 목록 필터링 (기존 8.11에 명시된 내용 구체화)
- **우선순위 필터:** Urgent/High/Medium/Low 다중 선택 가능
- **태그 필터:** 등록된 태그 기준 다중 선택 필터

### 9.2 서브태스크 생성 진입점 + 목록 인라인 펼침

#### 9.2.1 생성 진입점

- Sub-task 추가 UI는 **드로어 하단 인라인 폼 한 곳만** 유지. 헤더 아이콘 버튼(중복 진입점) 제거.
- 드로어 하단 폼: 제목 입력 + (선택) 유형 선택 → 저장/취소 버튼. 유형 미선택 시 부모 VOC 유형과 동일하게 기본 적용.
- 저장 시 `{parent-code}-{N}` 형식 코드 자동 부여, 목록에 즉시 반영.

#### 9.2.2 목록 인라인 펼침 (D16 확정, 2026-04-26)

VOC 목록 테이블에서 부모 VOC 행에 자식 서브태스크를 인라인으로 표시하는 방식.

- **토글 표시 조건**: 부모 VOC가 `subTasks.length > 0`인 경우만 행 좌측 첫 컬럼에 ▶/▼ 토글 아이콘 노출. 서브태스크가 없으면 토글 영역은 빈칸 (정렬 유지용 동일 너비 placeholder).
- **기본 상태**: **접힘**. URL/LocalStorage에 펼침 상태 영속화하지 않음 — 페이지 이동·새로고침 시 모든 부모 행은 다시 접힘 상태로 시작.
- **클릭 동작**: ▶ 클릭 시 ▼로 전환되며 부모 행 직하단에 자식 서브태스크 행이 인라인으로 추가 렌더 (페이지네이션 단위는 부모 기준 — §8.11과 일관).
- **자식 행 컬럼 구성**: 부모 행과 동일한 컬럼(상태/우선순위/제목/담당자/유형 등) 그대로. 단 좌측 첫 컬럼은 토글 자리 비움, 두 번째 컬럼(issue_code)에 좌측 패딩 24px 들여쓰기로 시각적 계층 표현.
- **자식 행 상호작용**: 행 클릭 시 자식 VOC 드로어 열기 — 부모 드로어와 독립. 자식은 더 이상 펼침 토글 없음 (1레벨 강제, §8.7).
- **API 응답 의존**: `GET /api/vocs` 목록 응답의 부모 VOC 객체에 `subTasks: VocListItem[]` 필드 포함 (D4 확정 필드명). 자식 VOC는 별도 row로 다시 등장하지 않음.
- **빈 상태**: 토글 클릭 후 자식 0건이면(예: 동시 삭제) 부모 행 직하단에 "서브태스크 없음" 안내 행 1줄 표시 후 자동 접힘 처리.
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
- **Admin 페이지 master 조회 (Wave 1.7)**: 메뉴 단독 CRUD는 `GET /api/masters/menus?system_id=<uuid>&includeArchived=true` 호출. 기본값(`includeArchived=false`)은 활성 메뉴만 — 등록 모달 cascade와 동일 응답. Admin 테이블은 `includeArchived=true`로 아카이브 행 포함 표시 (상태 컬럼으로 구분).

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
  - 결정은 `voc_payload_reviews`에 `action` + `decision` + `comment` 기록.
- **권한**: Manager/Admin.
- **연관 갱신 규칙**:
  - 제출 approve → `vocs.structured_payload` 확정, 해당 history row `is_current=true`/`final_state='approved'` 유지, `vocs.embed_stale=true`면 임베딩 재생성(MVP는 미실행).
  - 제출 reject → `vocs.review_status='rejected'`, payload 본 컬럼은 유지(담당자 수정/재제출 가능), history row `final_state='rejected'`.
  - 삭제 approve → `vocs.structured_payload=NULL`, `vocs.review_status=NULL`, 해당 history row `final_state='deleted'`/`is_current=false`. 담당자는 이후 "결과 작성"을 다시 수행 가능.
  - 삭제 reject → `vocs.review_status='approved'` 원복, `action='deletion', decision='rejected'` 리뷰 row만 추가.

##### 9.4.5.1 검토 상세 드로어 (Detail Drawer)

**진입 및 닫기**

- 검토 큐 카드 클릭 시 오른쪽에서 오버레이 드로어가 열린다.
- 닫기: 오버레이 배경 클릭 / Esc 키 / 드로어 내 X 버튼.
- 포커스 트랩: 드로어가 열린 동안 Tab / Shift+Tab 은 드로어 내 포커스 가능 요소 사이만 순환한다.
- 드로어 열릴 때 첫 번째 포커스 가능 요소(X 버튼)로 포커스 이동; 닫힐 때 트리거 카드로 포커스 복귀.
- 인라인 승인/반려 버튼 클릭은 드로어를 열지 않는다(이벤트 전파 차단).

**드로어 7개 섹션 (위→아래 순)**

1. **메타 헤더**: 이슈 ID (D2Coding 폰트) / 제목 / Status pill (`vocs.status`) / 리뷰 상태 pill (`vocs.review_status`) / 액션 종류 (제출/삭제, `voc_payload_reviews.action`) / 담당자 (`vocs.assignee`) / 작성자 (`vocs.author`) / 제출일 (`voc_payload_reviews.created_at`).
2. **시스템·메뉴 컨텍스트**: 시스템명 (`systems.name`) + 메뉴 경로 breadcrumb (`menus` 계층 조인) / 출처 SP (`vocs.source_sp` — 식별자 가상 컬럼) / 관련 테이블 chip 목록 (`vocs.related_tables[]` JSONB array of strings).
3. **Payload Diff**: 2컬럼 레이아웃 — 왼쪽: `is_current=true` 스냅샷 (`voc_payload_history`), 오른쪽: 신규 제출 (`vocs.structured_payload`). 키 단위 diff: `added`(초록), `removed`(빨강), `changed`(주황), `same`(투명).
4. **첨부/링크**: `voc_payload_reviews.attachments` 목록 (파일명 + 크기).
5. **히스토리 타임라인**: `voc_payload_history` 전체 행. `is_current=true` 행에 브랜드 색 좌측 보더 강조; `final_state` pill(`approved`/`rejected`/`deleted`) 표시.
6. **댓글/사유 입력**: textarea. 반려(`reject`) 선택 시 필수; 빈 값이면 제출 불가 + 인라인 에러 표시.
7. **액션 영역**: 승인 / 반려 버튼. Manager/Admin 외 비활성화 + 잠금 안내문. 승인은 코멘트 선택, 반려는 코멘트 필수.

**권한**: Manager / Admin 만 액션 가능 (§9.4.5 재확인). Viewer 는 모든 섹션 읽기 전용.
FE 가드: window.currentUser.role ∈ {manager, admin}일 때만 승인/반려 버튼 활성화. 그 외 disabled + 안내 문구 노출.

**BE 가드**: FE gate 외 추가로 backend는 `requireRole(['manager','admin'])` middleware (req §8.4-bis assertCanManageVoc 헬퍼와 동일 정책)를 모든 review 엔드포인트에 적용. DB 레벨에서는 RLS 또는 CHECK 제약으로 reviewer_role ∈ {manager, admin} 보장 (선택).

**기밀 분류**: `source_sp`, `related_tables`는 DB 내부 식별자라 viewer/contributor에게 노출 금지. Admin only로 detail drawer에서 표시. Manager는 마스킹 노출(예: '관련 테이블 N개').

**큐 정렬**: 검토 큐 기본 정렬 = `status_changed_at DESC`. 동률 시 `created_at DESC`. partial index `(review_status, status_changed_at)` WHERE review_status IN ('unverified','pending_deletion') 권장.

**JSONB 쓰기 순서**: approve 트랜잭션 내 (a) voc_payload_history INSERT first (final_state='approved', payload=새 submission), (b) vocs.structured_payload 갱신, (c) voc_payload_reviews INSERT (payload_sha256 = SHA256(payload)). 단일 트랜잭션 보장.

**텔레메트리**: FE는 승인/반려 시 window.dispatchEvent(new CustomEvent('voc:review:decided', {detail:{id, decision, comment, ts}})) 발행. 모니터링 모듈은 이 이벤트를 구독.

**데이터 흐름**: 승인/반려 시 `voc_payload_reviews` row 생성 (action, decision, comment, reviewer_id, ts). comment는 반려 시 필수, 승인 시 optional.

**삭제 신청 처리**: 삭제 신청은 newPayload 없음. currentPayload 단일 컬럼 + 삭제 사유 표시.

**데이터 모델 매핑**

| 섹션         | 노출 컬럼                                          | 출처 테이블                   |
| ------------ | -------------------------------------------------- | ----------------------------- |
| 메타 헤더    | `id`, `title`, `status`, `review_status`           | `vocs`                        |
| 메타 헤더    | `action`, `created_at`, `comment`                  | `voc_payload_reviews`         |
| 시스템·메뉴  | `system_id` → `systems.name`                       | `vocs` + `systems(masters)`   |
| 시스템·메뉴  | `menu_id` → `menus.name` (계층 breadcrumb)         | `vocs` + `menus(masters)`     |
| 시스템·메뉴  | `source_sp` (가상 식별자)                          | `vocs`                        |
| 시스템·메뉴  | `related_tables[]` (JSONB)                         | `vocs`                        |
| Payload Diff | `payload` (is_current 스냅샷)                      | `voc_payload_history`         |
| Payload Diff | `structured_payload` (신규)                        | `vocs`                        |
| 첨부         | `attachments[]`                                    | `voc_payload_reviews`         |
| 히스토리     | `is_current`, `final_state`, `created_at`, `actor` | `voc_payload_history`         |
| 댓글/사유    | `comment` (입력값)                                 | `voc_payload_reviews` (write) |

> 히스토리 `actor` → `users.name` via `submitted_by` FK. `history.action` → event_type enum (TBD column; FE는 `history.event_type` 가정).

**SP / Table 가시성**

- 메뉴 매핑: `vocs.system_id` → `systems`(masters), `vocs.menu_id` → `menus`(masters).
- 출처 SP: `vocs.source_sp` — 명세상 식별자(가상 컬럼명). 실제 구현 시 BE에서 JOIN 또는 denormalized 컬럼으로 제공.
- 관련 테이블: `vocs.related_tables[]` — JSONB array of strings, chip 단위 표시.

**토큰 규약**: `var(--*)` 전용. hex / oklch 리터럴 금지 (uidesign.md §10 준거).

##### 9.4.5.2 API Surface (BE 미구현, 명세 우선)

| Method | Path                                                                            | Body                                                                        | 200 응답                                                                                     | 주요 에러                                                                 |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| GET    | /api/admin/voc/reviews?tab=submission\|deletion&assignee=&system=&menu=&cursor= | —                                                                           | { items: [...], nextCursor }                                                                 | 403 ROLE_FORBIDDEN                                                        |
| GET    | /api/admin/voc/reviews/:id                                                      | —                                                                           | drawer payload (currentPayload, newPayload, history, attachments, source_sp, related_tables) | 404 REVIEW_NOT_FOUND                                                      |
| POST   | /api/admin/voc/reviews/:id/decide                                               | { action, decision, comment?, expectedReviewStatus, expectedPayloadSha256 } | { reviewId, vocReviewStatus }                                                                | 403, 404, 409 REVIEW_STALE / REVIEW_ALREADY_DECIDED, 422 COMMENT_REQUIRED |

에러 envelope (auth.ts 패턴 재사용): `{ code, message, details: { field?, expected?, actual? } }`. 코드: ROLE_FORBIDDEN, REVIEW_NOT_FOUND, REVIEW_ALREADY_DECIDED, REVIEW_STALE, COMMENT_REQUIRED, INVALID_DECISION.

동시성: 두 매니저 동시 승인 → /decide 트랜잭션 안에서 `SELECT … FROM vocs WHERE id=$1 FOR UPDATE` + expectedReviewStatus/expectedPayloadSha256 검증. 불일치 시 409 REVIEW_STALE 반환. 클라이언트는 Idempotency-Key 헤더 (24h dedupe) 권장.

---

#### 9.4.6 태그 마스터 관리 (D22 확정, 2026-04-27)

- **목적**: `tags` 테이블의 마스터 레코드(`name`, `kind`, `slug`)를 UI로 관리. §8.8.1이 "신규 태그 생성은 Admin/Manager 전용 관리 페이지에서만 가능"으로 규정한 진입점을 충족.
- **권한**: Admin/Manager (시스템/메뉴/유형 관리와 동일 정책).
- **테이블 컬럼**: 태그명 | 슬러그 | 종류(`general`/`menu`) | 사용 VOC 수(`voc_tags` 카운트) | 작업(편집/삭제 또는 병합).
- **추가**: "태그 추가" 버튼 → 모달(이름·kind·자동 생성 슬러그). 동일 `name+kind` 중복 방지(전역 UNIQUE).
- **편집**: 행 우측 편집 버튼 → 모달. `kind` 변경은 차단(태그 의미 보존). `name` 변경 시 슬러그 자동 갱신 옵션은 미제공(레거시 슬러그 보호).
- **삭제 정책**:
  - 사용 VOC 수 = 0인 태그만 hard delete 허용.
  - 사용 중 태그 삭제 요청 시 에러 토스트(`"VOC에 부착된 태그는 삭제할 수 없습니다. 병합 또는 부착 해제 후 다시 시도하세요."`).
  - 별도의 soft delete 컬럼은 추가하지 않음(태그는 부착 해제로 정리).
- **병합(Minor, MVP 범위 내)**: "병합" 액션 — 두 태그를 선택하여 source 태그의 `voc_tags` 행을 target으로 재배선 후 source 삭제. `tag_rules.tag_id`도 함께 재배선. 트랜잭션 내 처리.
- **연관 갱신**:
  - `kind='menu'` 태그는 §8.8 메뉴 태그 규약과 일관: `vocs.menu_id`와 별도. 마스터 페이지에서 menu 태그를 임의로 만드는 것은 허용하나, 실 운영은 메뉴 추가 자동 생성 흐름과 충돌하지 않도록 운영 가이드에 기재.
  - `tag_rules`가 참조 중인 태그 삭제 시 차단(사용 VOC 수 = 0이라도 규칙 참조 시 차단). 에러 메시지: `"태그 규칙에서 사용 중입니다."`.
- **API 계약**:
  - `GET /api/admin/tags?kind=&q=&page=` — 페이지네이션, kind/검색 필터.
  - `POST /api/admin/tags` — body `{ name, kind }`. 슬러그 BE 자동 생성.
  - `PATCH /api/admin/tags/:id` — `name`만 수정 허용.
  - `DELETE /api/admin/tags/:id` — 사용 VOC 수 = 0 + 규칙 참조 0 일 때만 200, 아니면 409.
  - `POST /api/admin/tags/:id/merge` — body `{ targetId }`. 트랜잭션 처리.
- **회귀 테스트 필수 4건**: (1) 사용 중 태그 삭제 시 409, (2) 규칙 참조 태그 삭제 시 409, (3) 병합 후 source `voc_tags` 0건 + target에 누적, (4) `kind` 변경 요청 거부.

#### 9.4.7 휴지통 (Soft-deleted VOC 복원, D23 확정, 2026-04-27)

- **목적**: §8.9 Soft Delete된 VOC를 UI로 조회·복원·영구삭제 진입점 제공. 기존 `?includeDeleted=true` 쿼리 파라미터만으로는 정식 진입 동선이 없음.
- **권한**: Admin 전용 (Soft Delete 권한과 동일 — Manager 비대상).
- **진입**: 관리자 페이지 좌측 메뉴 "휴지통" 항목. 또는 VOC 목록 우상단 "삭제됨 보기" 토글(`?includeDeleted=true`로 동일 라우트 재사용 가능, MVP는 별도 페이지 채택).
- **테이블 컬럼**: 이슈 ID | 제목 | 상태(삭제 직전 status) | 시스템/메뉴 | 삭제자(`voc_history` 최근 row) | 삭제일(`deleted_at`) | 작업(복원 / 영구삭제).
- **필터**: 시스템 / 메뉴 / 삭제일 범위 / 검색(제목·이슈 ID).
- **복원 액션**:
  - 행 단위 "복원" 버튼 → 확인 다이얼로그 → `PATCH /api/vocs/:id/restore`.
  - 동작: `vocs.deleted_at=NULL`로 갱신, `voc_history`에 `restore` 이벤트 기록, §4 `tag_rules` 멱등 재실행(§4 `tag_rules` 불릿 "복원 시 재실행" 정책 준수).
  - 복원 후 status는 삭제 직전 값 그대로(상태 머신 재진입 없음).
  - Sub-task: 부모가 hard delete된 경우 `parent_id=NULL`(D13 ON DELETE SET NULL)로 보존된 상태 — 복원 시 그대로 root VOC로 복원.
- **영구삭제 액션** (MVP 범위 외 표시만):
  - D7(데이터 보존 무기한)에 따라 MVP는 영구삭제 버튼 **비활성화**(disabled + tooltip "MVP는 영구삭제 미지원"). 컬럼/UI는 NextGen 활성화 대비로 자리만 확보.
- **첨부파일**: §8.9 정책 그대로 — Admin은 `?includeDeleted=true`로 다운로드 가능. 휴지통 화면 상세에서도 동일 접근 보장.
- **API 계약**:
  - `GET /api/admin/vocs/trash?...` — Soft-deleted VOC 목록(필터 + 페이지네이션).
  - `PATCH /api/vocs/:id/restore` — 복원. 복원 후 응답에 갱신된 VOC + 재부착 태그 포함.
- **회귀 테스트 필수 3건**: (1) Manager가 `/trash` 호출 시 403, (2) 복원 후 일반 목록 API에서 노출, (3) 복원 시 `tag_rules` 재실행으로 `voc_tags.source='rule'` 행 재부착.

### 9.5 정렬 옵션 (정렬 칩 클릭 정렬)

> **N-06 결정 (2026-05-01):** voc-list는 테이블이 아닌 카드형(.voc-group) 목록이므로 테이블 헤더가 없음.
> 대신 list-toolbar 내 **정렬 칩(sort chips)** 6개로 정렬 트리거. spec "테이블 헤더 클릭" 문구 수정.

- **정렬 칩 클릭**으로 오름차순/내림차순 토글 (Date / ID / Title / Status / Priority / Assignee).
- 기본 정렬: 등록일 내림차순(최신순).
- 정렬 가능 항목: 이슈 ID, 제목, 상태, 담당자, 우선순위, 등록일.
- 활성 칩에 방향 아이콘(▲/▼) 표시. 동일 칩 재클릭 시 방향 반전.
- URL 파라미터(`?sort=column&order=asc|desc`)로 정렬 상태 유지 (뒤로 가기·공유 시 복원).
- prototype 시연: 칩 클릭 → 즉시 sort 반영 + URL 동기화 (`history.replaceState`).

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

### 9.11 VOC 등록 모달 상세 (Wave 1.7, 2026-05-03)

prototype `prototype.html#modalBg` 시각 사양을 React 모달(`features/voc/components/VocCreateModal.tsx`)에 반영. §8 데이터 모델·권한 룰을 UI에서 깨지 않도록 정합성 명시.

#### 9.11.1 필드 구성 (위→아래)

1. **제목** (필수, `*` 표시)
   - placeholder: `"문제를 간결하게 설명해 주세요 (최대 200자)"`
   - `maxLength=200` (§8.10 일치)
   - 우하단 글자수 카운터 `현재/200`. 200 도달 시 강조색 `var(--status-danger)`.
2. **드롭다운 2×2 그리드**
   - row1: **시스템** `*` · **메뉴** `*`
     - 시스템 미선택 시 메뉴 select `disabled`, placeholder `"시스템 먼저 선택..."`
     - 시스템 변경 시 메뉴 옵션 재로드 + 선택값 reset
     - 활성 메뉴 0건 시 메뉴 select `disabled` + 안내 `"이 시스템에 등록된 메뉴가 없습니다"` (§8.8:261)
   - row2: **유형** `*` · **우선순위**
     - 우선순위는 **항상 `disabled`**, value 고정 `medium`
     - 라벨: `우선순위 (자동: Medium · 생성 후 조정)`
     - 근거: §8.4 — "생성 시 서버에서 medium으로 강제 설정 (클라이언트 값 무시)". 권한자(Manager/Admin/담당 Dev)는 생성 후 드로어에서 변경.
3. **본문** (필수, `*` 표시) — Toast UI Editor
   - **빈 본문일 때 초기값으로 마크다운 skeleton 자동 삽입** (placeholder 아닌 실제 값):

     ```md
     ## 문제 상황

     ## 재현 방법

     1.

     ## 발생 환경

     - 시스템:
     - 브라우저:

     ## 기대 동작
     ```

   - skeleton의 H2 헤더 구조는 추후 자동 정규화/structured_payload 추출 파이프라인의 파싱 기준이 됨 (NextGen 연계).
   - 사용자가 skeleton 위에 작성을 시작하면 그대로 유지 — 빈 헤더만 남으면 BE가 무시(저장 시 본문 전체 64KB 제한, §8.10).

4. **자동 태그 추천 row**
   - 본문 아래, 첨부 위에 표시.
   - 본문/제목 입력 후 500ms debounce → `tag_rules` 매칭 (§8.8 자동 태깅 정책 기준, prototype `autotagRow` 동작).
5. **첨부파일 zone** (선택)
   - 라벨 보조 텍스트 `(선택 · 이미지만 · 최대 5개)`
   - 드래그앤드롭 + 선택 버튼
   - 5개·10MB **본문 이미지 + 첨부 합산** cap (§8.5:217 "본문 기준" 명시 재인용).
   - 우측 카운트 배지 `0/5`.

#### 9.11.2 본문 ↔ 첨부 단방향 동기화

- **본문 → 첨부 (자동 추가)**: 사용자가 Toast Editor에 이미지를 삽입 (드래그·붙여넣기·이미지 버튼)하면 동일 File이 첨부 zone에도 추가된다.
- **본문 → 첨부 (자동 제거)**: 사용자가 본문에서 이미지 마크다운/노드를 삭제하면 첨부 zone에서도 동일 항목 제거.
- **첨부 → 본문**: 자동 삽입 **하지 않음**. 첨부 zone에서 직접 추가한 이미지는 본문 흐름과 무관 (캡처/별첨용).
- **dedup**: 동일 File(name+size+lastModified hash) 중복 방지 — 본문에 이미 있는 이미지를 첨부에 별도로 올려도 1개로만 카운트.
- **합산 cap 검증**: 본문 + 첨부의 유니크 이미지 합계가 `5개 / 10MB`를 초과하면 새 추가를 거부 (토스트 안내).

#### 9.11.3 Due Date 처리

- **생성 모달에 Due Date 필드 미노출**.
- BE는 priority=`medium` 강제 룰에 따라 항상 `due_date = created_at + 30일`로 자동 계산 후 저장 (§8.4.1 표 그대로).
- 권한자는 생성 후 드로어에서 priority 변경 시 자동 재계산되며, 수동 수정도 §8.4.2 룰로 가능.

#### 9.11.4 푸터

- 좌측: `(info icon) 등록 후 이슈 ID가 자동 부여됩니다` — `var(--text-quaternary)`, 12px.
- 우측: `취소` (ghost) / `[send icon] VOC 등록` (primary).

#### 9.11.5 라벨 표기 토큰

- 필수 마커 `*`: `var(--status-danger)` (또는 신규 `--form-required` 토큰 추가 시 그쪽). 별도 레이블 토큰 추가는 본 wave 범위 외 — 기존 토큰 재사용.
- 라벨 보조 텍스트 (예: `(선택 · 이미지만 · 최대 5개)`): `text-xs` + `var(--text-quaternary)`.

#### 9.11.6 master 데이터 의존

- `GET /api/masters/systems` 응답에 `menus: MenuListItem[]` nested 포함 — 모달은 단일 호출로 cascade 데이터 확보.
- Admin 페이지의 메뉴 단독 CRUD에는 `GET /api/masters/menus?system_id=` 별도 endpoint 사용 (§9.4.2).
- 스키마: `shared/contracts/master/io.ts` (Wave 1.7에서 신규 추가).
