# Prototype Phase 7 — P-8 D23 휴지통 설계 문서

> 작성: 2026-04-30
> 브랜치: `feat/prototype-phase7-p8-trash`
> 상위 plan: `docs/specs/plans/prototype-phase7-wave1.md` (브랜치 `docs/prototype-phase7-wave1-plan`)
> 패턴 레퍼런스: `feat/prototype-phase7-p7-tag-master` (방금 머지된 P-7 — `admin-tag-master.js` / `admin-tag-master-modals.js`)
> 운영 모드: `/oh-my-claudecode:autopilot` — 설계 → 계획 → 구현 → 5인×3관점 리뷰. 자가 리뷰 금지.

---

## 1. 명세 출처 (line ranges)

| 출처                                          | 라인    | 내용                                                                                                                         |
| --------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `docs/specs/requires/feature-voc.md` §9.4.7   | 616~635 | 휴지통 화면 단일 정본 — 진입/권한/테이블 컬럼/필터/복원/영구삭제(MVP 비활성)/첨부파일/API 계약/회귀 테스트 3건               |
| `docs/specs/requires/requirements.md` §15.4   | 530~537 | D23 진입점·권한·운영 갭 해소 (`vocs.deleted_by`, `voc_restore_log` Phase 8 마이그 014). **30일 보존 후 자동 영구 삭제** 명시 |
| `docs/specs/requires/requirements.md` §17 D23 | 658     | 다방면 리뷰 결정 — Admin 전용, 정식 화면 신설, 복원 시 `tag_rules` 재실행, 영구삭제는 D7에 따라 MVP 비활성 자리만            |
| `docs/specs/plans/prototype-phase7-wave1.md`  | P-8 행  | 신규 `prototype/js/admin-trash.js`, prefix `tr-`, 사이드바 메뉴 추가, append-only                                            |

**스펙상 충돌 1건 (R5에 명시):** §9.4.7 본문은 영구삭제 버튼을 "MVP 비활성"으로 못박으나, §15.4 요약은 "30일 보존 후 자동 영구 삭제"를 언급하고 사용자 시연 범위에는 단건/일괄 영구삭제가 포함됨. 프로토타입은 **시연 한정**이므로 §15.4 30일 정책을 채택하되, 실제 BE 연동 시 §9.4.7 우선 적용을 명세 사이드바 NOTE로 표기 (R5에서 다룸).

---

## 2. 시연 범위

P-8 prototype demo가 다뤄야 할 기능:

1. **삭제된 VOC 목록 테이블** — 컬럼: 체크박스 | 이슈 ID | 제목 | 상태(삭제 직전) | 시스템/메뉴 | 삭제자 | 원담당자 | 삭제일 | 잔여일 | 작업
2. **30일 자동 영구삭제 카운트다운** — `잔여일` 컬럼에 D-N 표시. 0~3일은 amber("곧 만료"), 음수는 red dim("이미 만료"). 만료 임박 행 highlight (배경 amber-bg).
3. **단건 복원** — `restoreVoc(id)` → 확인 토스트 → mock 행 제거 + 토스트 "복원되었습니다 (tag_rules 재실행 mock)"
4. **단건 영구삭제** — `purgeVoc(id)` → 확인 모달 (취소/영구삭제 버튼) → 행 제거 + 토스트
5. **일괄 선택** — 헤더 체크박스(전체) + 행 체크박스. 선택 행 수 배지 + 일괄 액션 바 (복원/영구삭제) 표시
6. **일괄 복원 / 일괄 영구삭제** — `restoreSelected()` / `purgeSelected()` → 확인 모달 → 일괄 처리 토스트
7. **검색/기간 필터** — 제목·이슈 ID 검색 (`tr-search` input), 삭제일 범위 select (`전체` / `오늘` / `최근 7일` / `최근 30일` / `30일 초과`), 시스템 select
8. **권한 없음 시연** — 우상단 페르소나 토글 mock — 만약 User 페르소나면 페이지 진입 시 토스트 "Admin 권한이 필요합니다." + 본문 흐림 (단순 inline mock; 실제 라우팅 가드는 BE)
9. **voc_restore_log audit 행 1건** — 페이지 하단 `<details>` 섹션 "최근 복원/영구삭제 이력" — 마지막 액션 1건만 mock 표시 (`actor`, `action`, `voc_id`, `at`).

**Out of scope (시연에서 빼는 것):** 첨부파일 다운로드, sub-task 부모 hard-delete 케이스, 페이지네이션 (10건만), URL 파라미터 동기화.

---

## 3. mock 데이터 구조

`prototype/js/admin-trash-data.js` (≤100줄). `window.trashedVocData = [...]`.

`deleted_at` 분포 (오늘 = 2026-04-30):

- 1건: `2026-04-30T09:12:00` (오늘) — 잔여 30일
- 2건: `2026-04-27` (3일 전) — 잔여 27일
- 2건: `2026-04-15` (15일 전) — 잔여 15일
- 1건: `2026-04-01` (29일 전) — 잔여 1일 (amber, "곧 만료")
- 1건: `2026-03-31` (30일 전) — 잔여 0일 (amber, "오늘 만료")
- 1건: `2026-03-25` (36일 전) — 잔여 -6일 (red dim, "이미 만료" — 자동 잡 지연 시연)
- 1건: `2026-04-20` 다른 시스템 (필터 시연용)
- 1건: attachments 포함 케이스 (`attachmentCount: 3`)

**총 10건.** 삭제자 mix: Admin 6건 / Manager 4건 (Manager는 자기 메뉴만 soft-delete 권한이라 가정).

```js
{
  id: 'voc-001',
  issueId: 'ISSUE-1247',
  title: '대시보드 로딩 지연',
  status: 'in_progress',         // 삭제 직전 status
  systemId: 'sys-mes',
  systemName: 'MES',
  menuName: '생산관리',
  deletedById: 'u-admin-1',
  deletedByName: '김관리',
  deletedByRole: 'admin',        // 'admin' | 'manager'
  originalAssignee: '이담당',     // 원담당자 표시용
  deletedAt: '2026-04-30T09:12:00',
  attachmentCount: 0,
}
```

추가 mock: `window.vocRestoreLog = [{ actor: '김관리', action: 'restore', vocId: 'ISSUE-1247', at: '2026-04-29T14:22:00' }]` — 1건.

---

## 4. 인터랙션 시나리오

| #   | 시나리오                 | 트리거                              | 기대 결과 (모두 토스트 mock)                                                                                                                                |
| --- | ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | 단건 복원                | 행 `[복원]` 버튼                    | 확인 모달 → "복원되었습니다 (tag_rules 재실행 mock)" `ok` 토스트 + 행 제거 + count 갱신 + restoreLog에 행 추가                                              |
| S2  | 단건 영구삭제            | 행 `[영구삭제]` 버튼                | 확인 모달 (위험 경고 빨강 텍스트 "되돌릴 수 없습니다") → "영구 삭제 (mock)" `warn` 토스트 + 행 제거                                                         |
| S3  | 일괄 복원 (3건)          | 체크 3건 → 액션바 `[선택 복원]`     | 확인 모달 "3건을 복원하시겠습니까?" → "3건 복원됨 (mock)" `ok` 토스트                                                                                       |
| S4  | 일괄 영구삭제 (2건)      | 체크 2건 → 액션바 `[선택 영구삭제]` | 확인 모달 + 빨강 경고 → "2건 영구삭제 (mock)" `warn` 토스트                                                                                                 |
| S5  | 권한 없음 (User attempt) | 페르소나 토글 → User → 페이지 진입  | 토스트 "Admin 권한이 필요합니다." `warn` + 본문 영역에 lock 아이콘 + 메시지 (테이블 미렌더). **distinct 메시지** ≠ 외부 잠금 ≠ VOC 부착 잠금                |
| S6  | 만료 임박 highlight      | 페이지 진입                         | 잔여 0~3일 행: 배경 `var(--status-amber-bg)`, 잔여일 cell amber 텍스트 + 시계 아이콘. 잔여 음수 행: 배경 `var(--status-red-bg)` opacity 0.5, 텍스트 red dim |
| S7  | 검색                     | 검색창에 "대시보드"                 | 매칭 행만 노출, count 배지 갱신, 빈 결과 시 §13.11 empty state (13.5px / `var(--text-secondary)`) "검색 결과가 없습니다."                                   |
| S8  | 기간 필터                | select "최근 7일"                   | `deletedAt >= today-7d` 행만                                                                                                                                |

**모든 액션은 `showToast()` (dom-utils.js)로 표시.** 모달은 `#modalBg` 재사용 (P-7 패턴 그대로).

---

## 5. 사용 토큰 (기존만, 신규 토큰 추가 금지)

§13 / §10 기존 토큰만 조합. **새 토큰 도입 금지** (Wave 1 합의).

| 용도                     | 토큰                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| 페이지 배경              | `var(--bg-app)`, `var(--bg-card)`                                                                |
| 텍스트                   | `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`, `var(--text-quaternary)` |
| 보더                     | `var(--border-standard)` (※ `--border` 단독은 미정의 — P-7 round-1에서 발견된 함정)              |
| 강조 (액션 버튼 primary) | `var(--brand)` (`.a-btn.primary` 글로벌)                                                         |
| 곧 만료 (amber)          | `var(--status-amber)`, `var(--status-amber-bg)`, `var(--status-amber-border)`                    |
| 이미 만료 (red dim)      | `var(--status-red)`, `var(--status-red-bg)` (opacity 0.5 처리)                                   |
| 복원 안내 / 정보 callout | `var(--status-blue)`, `var(--status-blue-bg)`, `var(--status-blue-border)`                       |
| 폰트                     | `var(--font-ui)` (Pretendard), `var(--font-mono)` (D2Coding — 이슈 ID/날짜)                      |
| 상태 dot                 | `.status-dot.on` 글로벌 클래스 (재사용)                                                          |

**Empty state (§13.11) 규격:** 아이콘 32×32 `--text-quaternary` + 헤드라인 13.5px `var(--text-secondary)` (P-7 round-1 R2 fix와 동일).

---

## 6. `prototype.html` 섹션 구조 (BEGIN P-8 / END P-8 markers)

`</body>` 직전에 append-only. 사이드바 메뉴 1줄 삽입은 §8 참조.

```html
<!-- ============================================================ -->
<!-- BEGIN P-8 Trash (feat/prototype-phase7-p8-trash)              -->
<!-- ============================================================ -->
<section id="page-trash" class="admin-page" hidden>
  <div class="admin-page-header">
    <h1 class="admin-page-title">휴지통</h1>
    <span class="admin-page-subtitle" id="trCount">0건</span>
  </div>

  <div class="tr-info-callout" role="note">
    <i data-lucide="info"></i>
    <span>삭제 후 30일이 지나면 자동으로 영구 삭제됩니다. 복원 시 태그 규칙이 재실행됩니다.</span>
  </div>

  <div class="tr-toolbar">
    <input
      id="trSearch"
      class="form-input tr-search"
      placeholder="제목 또는 이슈 ID 검색"
      oninput="syncTrFilter()"
    />
    <select id="trRange" class="form-select" onchange="syncTrFilter()">
      <option value="all">전체 기간</option>
      <option value="today">오늘</option>
      <option value="7d">최근 7일</option>
      <option value="30d">최근 30일</option>
      <option value="overdue">30일 초과 (만료 대상)</option>
    </select>
    <select id="trSystem" class="form-select" onchange="syncTrFilter()">
      <option value="all">전체 시스템</option>
      <!-- option은 SYSTEMS에서 동적 생성 -->
    </select>
  </div>

  <div id="trBulkBar" class="tr-bulk-bar" hidden>
    <span class="tr-bulk-count"><span id="trSelectedCount">0</span>건 선택</span>
    <button type="button" class="a-btn primary" onclick="restoreSelected()">선택 복원</button>
    <button type="button" class="a-btn danger" onclick="purgeSelected()">선택 영구삭제</button>
    <button type="button" class="a-btn" onclick="clearTrSelection()">선택 해제</button>
  </div>

  <div id="trDenied" class="tr-denied" hidden>
    <i data-lucide="lock"></i>
    <span>Admin 권한이 필요합니다.</span>
  </div>

  <table class="tr-table" id="trTable">
    <thead>
      <tr>
        <th class="tr-th-check">
          <input
            type="checkbox"
            id="trSelectAll"
            onchange="toggleSelectAll(this)"
            aria-label="전체 선택"
          />
        </th>
        <th>이슈 ID</th>
        <th>제목</th>
        <th>상태</th>
        <th>시스템/메뉴</th>
        <th>삭제자</th>
        <th>원담당자</th>
        <th>삭제일</th>
        <th>잔여일</th>
        <th class="tr-th-actions">작업</th>
      </tr>
    </thead>
    <tbody id="trBody"></tbody>
  </table>

  <details class="tr-audit">
    <summary>최근 복원/영구삭제 이력 (voc_restore_log)</summary>
    <div id="trAuditList"></div>
  </details>
</section>
<!-- END P-8 Trash -->
```

**모든 셀렉터 prefix `tr-`** (trash) — §13 글로벌 충돌 0건 검증 필요 (R3).

---

## 7. JS 모듈 API

### 파일 분할 (P-7 패턴 답습)

| 파일                                 | 줄 수 한도   | 역할                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prototype/js/admin-trash-data.js`   | ≤100         | mock 데이터 (10건 + restoreLog)                                                                                                                                                                                                              |
| `prototype/js/admin-trash.js`        | ≤200         | 메인 — render, filter, select, restore, purge, suspend, audit                                                                                                                                                                                |
| `prototype/js/admin-trash-modals.js` | (옵션, ≤120) | 확인 모달 4종 (단건 복원·영구삭제·일괄 복원·일괄 영구삭제) — 모달이 비교적 단순(확인만)하므로 **메인 통합 우선 검토**. 한 모달 빌더 + 콜백 인자 패턴이면 50줄 내 통합 가능 → 분할 안 함을 1차안으로 채택. 분할은 totalLOC > 200 시 fallback. |

**1차안: 단일 confirm 모달 빌더 1개 + admin-trash.js 통합 (≤220줄 예상). admin-trash-modals.js 미생성.**

### Public API

```js
window.AdminTrash = {
  render: renderTrash, // 메인 렌더 (필터 적용)
  init: function () {
    /* 1회 wiring 예약, 현재 비움 */
  },
};

// onclick 핸들러용 글로벌
window.syncTrFilter = syncTrFilter;
window.toggleSelectAll = toggleSelectAll;
window.toggleTrRow = toggleTrRow; // (id) — 행 체크박스 onchange
window.clearTrSelection = clearTrSelection;
window.restoreVoc = restoreVoc; // (id)
window.purgeVoc = purgeVoc; // (id)
window.restoreSelected = restoreSelected;
window.purgeSelected = purgeSelected;
window.openTrConfirm = openTrConfirm; // (title, body, kind, onConfirm) — 통합 모달
window.closeTrConfirm = closeTrConfirm;
```

### 상태

```js
let trQuery = '';
let trRange = 'all';
let trSystem = 'all';
let trSelectedIds = new Set();
let trIsAdmin = true; // 페르소나 mock; 페르소나 토글이 false면 trDenied 분기
```

### 모달 통합 빌더 (단일 함수)

```js
function openTrConfirm({ title, bodyHtml, confirmLabel, danger, onConfirm }) {
  // #modalBg 재사용. closeTrConfirm = bg.classList.remove('open').
  // bodyHtml은 escHtml로 사전 escape 된 문자열만 받음.
  // confirm 버튼: danger ? 'a-btn danger' : 'a-btn primary'
}
```

→ 4가지 시나리오 모두 이 빌더 호출. 모달 클래스는 **`.modal` / `.modal-header` / `.modal-body` / `.modal-footer` 글로벌 재사용** (P-7 round-1 fix와 동일 — `.modal-box` 같은 fabricated class 금지).

---

## 8. 사이드바 메뉴 추가 위치

`prototype/prototype.html` 라인 47~52 영역(관리자 섹션). "결과 검토" 아래, **"태그 마스터" 다음**에 한 줄 추가:

```html
<!-- 기존 라인 52 다음 (태그 마스터 P-7 → 휴지통 P-8) -->
<div class="nav-item" onclick="setNav(this)" data-page="trash">
  <i data-lucide="trash-2"></i> 휴지통
</div>
```

**P-7이 "태그 마스터" 항목을 같은 위치에 추가했음을 가정** — P-7 머지 후 라인 위치는 53~54로 이동 가능. 마커보다 **앵커 텍스트 "태그 마스터"** 다음 줄을 기준으로 삽입. 만약 P-7이 `<!-- ADMIN MENU APPEND POINT -->` 마커를 두었다면 그 직전.

`prototype/js/sidebar.js` `setNav()` dispatch에 1줄 추가:

```js
if (page === 'tag-master') renderTagMaster();
if (page === 'trash') AdminTrash.render(); // ← 신규
```

기존 `setNav()` 분기 reorder/rename 금지 (Wave 1 append-only 컨벤션).

---

## 9. 의존성

| 의존 대상                                                                 | 출처                                                                              | 사용처                               |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| `escHtml`                                                                 | `prototype/js/dom-utils.js` (helpers.js에서 dom-utils로 추출됨, commit 1cf5b2c)   | 모든 사용자 입력/이슈 ID/제목 escape |
| `showToast`                                                               | `prototype/js/dom-utils.js`                                                       | 모든 액션 결과 (`ok` / `warn`)       |
| `#modalBg` 컨테이너                                                       | `prototype/prototype.html` (전역 1개) + `prototype/js/modal.js` (open/close 패턴) | confirm 모달                         |
| `.modal`, `.modal-header`, `.modal-title`, `.modal-body`, `.modal-footer` | `prototype/css/components.css:500~692`                                            | 모달 마크업                          |
| `.form-input`, `.form-select`                                             | `prototype/css/components.css:546~587`                                            | 검색·필터 입력                       |
| `.a-btn`, `.a-btn.primary`, `.a-btn.danger`                               | `prototype/css/components.css` (P-7 round-1에서 정의 확정)                        | 모든 버튼                            |
| `.status-dot.on`                                                          | 전역 admin css                                                                    | 상태 도트                            |
| `SYSTEMS` 배열                                                            | `prototype/js/data.js`                                                            | 시스템 필터 옵션                     |

**금지 (P-7 R1 회고 반영):**

- `.modal-box` / `.modal-input` 같은 fabricated class 사용
- `var(--border)` (단독) — 항상 `var(--border-standard)`
- `.type-badge-admin` 재사용 (§13.4 색 swatch chip 전용 — P-7 R2에서 분리됨). P-8에서 역할 뱃지 필요 시 `.tr-role-badge` 로컬 정의.
- 자체 `escHtml` 재정의 — `dom-utils` 단일 출처.

---

## 10. Lessons applied (P-7 회고 사전 차단)

P-7 round-1 (commit `c157d44`) + R2 (commit `7389e02`)에서 발견된 13건 이슈 중 P-8에서 사전 차단:

| P-7 이슈                                          | P-8 사전 조치                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `.modal-box` / `.modal-input` 등 fabricated class | §6 마크업 + §9 의존성에 `.modal` 글로벌 재사용 명기. 새 modal class 정의 금지 룰                       |
| `.a-btn.primary` 미정의 (round-1)                 | P-7에서 정의 완료 — P-8은 그대로 사용                                                                  |
| `var(--border)` 단독 사용                         | §5 토큰표에 `var(--border-standard)` 만 등재. `--border` 금지 명기                                     |
| 동일 메시지 재사용 (lock/error)                   | §4 시나리오마다 distinct 메시지 ("Admin 권한이 필요합니다." ≠ "복원되었습니다" ≠ "되돌릴 수 없습니다") |
| empty state 폰트/색 (§13.11)                      | §5 끝에 13.5px / `var(--text-secondary)` 명기                                                          |
| `.type-badge-admin` 오용                          | §9 금지 명기, 필요 시 `tr-role-badge` 로컬 신설                                                        |
| `escHtml` 자체 정의                               | §9 단일 출처 dom-utils                                                                                 |
| 모달 close 패턴 불일치                            | §7 modal API에서 `bg.classList.remove('open')` 명기 (modal.js와 동일)                                  |
| 자가 리뷰                                         | 본 design은 architect 단독 작성, planner/critic은 별도 단계                                            |
| append-only 컨벤션 위반                           | §6/§8 BEGIN/END 마커 명시, sidebar dispatch는 1줄만                                                    |
| onclick 노출 누락                                 | §7 Public API에 9개 글로벌 모두 열거                                                                   |
| Lucide 재실행 누락                                | render 끝에서 `lucide.createIcons()` 필수 (M-2에서 명시)                                               |
| `kind` 변경 거부 같은 disable+tooltip 패턴        | P-8에서는 영구삭제 버튼 enabled (시연 한정) — §15.4 30일 정책 채택 사유 R5에 명시                      |

---

## 11. 위험 요소

| ID     | 위험                                                                                                                                                                                                    | 영향                                | 회피책                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | P-7과 동일 시점에 `prototype.html` `</body>` 직전 append → P-7이 먼저 머지됐으므로 P-8은 그 다음 줄. 사이드바 메뉴도 P-7이 "태그 마스터" 추가한 직후 위치를 가정. P-7 라인이 54인지 55인지 확인 후 삽입 | 머지 충돌 가능 (낮음 — append-only) | 구현 단계에서 `git diff main` 으로 P-7 추가 라인 위치 1회 확인 후 삽입                                                                                                                                                      |
| **R2** | 영구삭제 버튼이 §9.4.7 "MVP 비활성"과 모순                                                                                                                                                              | 스펙 일관성 깨짐                    | 페이지 상단 callout에 NOTE 1줄: "본 시연은 §15.4 30일 정책을 따릅니다. 실제 BE는 §9.4.7에 따라 MVP 비활성." (R5와 통합) — **단, callout 추가 여부는 critic 판단에 위임. 현재 1차안은 spec NOTE 미추가, 사유는 시연 가독성** |
| **R3** | `tr-` prefix CSS 셀렉터가 §13 글로벌과 충돌 (예: `.tr` 자체는 HTML 태그)                                                                                                                                | 스타일 누수                         | 모든 셀렉터는 `.tr-` (반드시 하이픈 포함) — `tr` 단독 클래스 금지. 구현 후 grep `\.tr[^-]` 로 검증                                                                                                                          |
| **R4** | `#modalBg` 가 P-7과 같은 컨테이너 — P-7 모달 열린 상태에서 P-8 페이지 진입 시 dataset.mode 충돌                                                                                                         | 모달 잔존                           | `closeTrConfirm()` 에서 `bg.dataset.mode = ''` 클리어. 페이지 진입(render) 시 modalBg가 open이면 close 1회                                                                                                                  |
| **R5** | §9.4.7 (영구삭제 비활성) vs §15.4 (30일 자동 영구삭제) 충돌 — 시연이 어느 쪽을 보여주냐                                                                                                                 | 스펙 충실성 vs 시연 가치            | **결정: §15.4 채택** (사용자 요청에 영구삭제 시연 명시). 본 design 문서 §1에 충돌 명기. 필요 시 명세 측에서 §9.4.7 본문 갱신 PR 별도 (P-8 범위 밖)                                                                          |

---

## 부록 A — 구현 단계 placeholder (planner 단계에서 채움)

> 본 섹션은 architect 단독 작성. planner agent가 후속으로 append.
