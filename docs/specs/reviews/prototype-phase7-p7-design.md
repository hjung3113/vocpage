# Prototype Phase 7 — P-7 (D22 태그 마스터 관리) 설계 문서

> 작성일: 2026-04-30
> Stage: B-6 (P-7 D22 Tag Master)
> 출처 plan: `docs/specs/reviews/prototype-phase7-additions-review.md` (Stage B-6)
> 산출 대상: 프로토타입 단독 시연용 HTML/CSS/JS — React/BE 없음, 토스트 데모만.
> 컨벤션: append-only (기존 JS/CSS/HTML 라인 수정 금지, 새 파일/새 섹션 추가만)

---

## 1. 명세 출처

| 위치                                          | 라인      | 핵심 조항                                                                                                                                                                                                  |
| --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/specs/requires/feature-voc.md` §9.4.6   | L593–L614 | 태그 마스터 관리 — 권한(Admin/Manager), 컬럼(태그명/슬러그/kind/사용 VOC 수/작업), 추가/편집/삭제 정책, 병합(소스→타깃 재배선), 연관 갱신, API 5종, 회귀 테스트 4건                                        |
| `docs/specs/requires/requirements.md` §15.3   | L522–L528 | 진입점(관리자 사이드바 하단), 권한(Admin 병합/외부 잠금/규칙 일시중지, Manager 읽기 전용), 운영 갭 해소 컬럼 — `tags.is_external`, `tags.merged_into_id` FK, `tag_rules.suspended_until` (마이그 013 예정) |
| `docs/specs/requires/requirements.md` §17 D22 | L657      | "§9.4.6 태그 마스터 관리 신설 — Admin/Manager가 `tags` CRUD/병합. 사용 VOC 0건 + 규칙 참조 0건일 때만 삭제. `kind` 변경 차단. §8.8.1 '신규 태그는 관리 페이지에서만 생성' 진입점 충족"                     |

핵심 규칙 요약 (프로토타입 시연 대상):

1. 컬럼: 태그명 | 슬러그 | kind(`general`/`menu`) | 사용 VOC 수 | 외부(`is_external`) | 마지막 사용일 | merged_into | 작업
2. 삭제: 사용 VOC = 0 + 규칙 참조 = 0 일 때만 hard delete. 그 외엔 409 에러 토스트.
3. 병합: source → target 재배선. source는 `merged_into_id` 표시 후 일반 목록에서 숨김(또는 별도 보기).
4. `kind` 변경 차단(편집 모달에서 disabled). 슬러그도 자동 생성, 변경 시 레거시 보호.
5. 외부 마스터 출처(equipment/db/program) 태그는 `is_external=true`로 잠금 표시. 병합/삭제 차단.
6. `tag_rules.suspended_until` — 운영 일시 중지 토글 (`requirements.md §15.3` "규칙 일시중지" 항목, Admin 전용).

---

## 2. 시연 범위 (in scope)

| 기능                             | spec 출처             | 시연 방식                                         |
| -------------------------------- | --------------------- | ------------------------------------------------- |
| 태그 목록 (12건 mock)            | feature-voc.md §9.4.6 | 테이블 렌더                                       |
| 사용 VOC 수, 마지막 사용일 표기  | §9.4.6                | 컬럼 + 빈 카운트(0) 강조                          |
| 외부/수동 구분 (`is_external`)   | requirements.md §15.3 | 잠금 아이콘 + "외부" 뱃지                         |
| `merged_into` 표시               | §9.4.6 병합           | "→ TargetTag로 병합됨" pill, 행 dim               |
| 검색 (이름/슬러그)               | §9.4.6 GET ?q=        | 인풋 + 즉시 필터                                  |
| `is_external` / `kind` 필터      | §9.4.6 GET ?kind=     | 세그먼트 토글 (전체/general/menu/external)        |
| 태그 추가 모달                   | §9.4.6 POST           | 모달 → 토스트 (mock 추가 후 목록 prepend)         |
| 태그 편집 모달 (`kind` disabled) | §9.4.6 PATCH          | 모달 → 토스트, kind 필드 readonly                 |
| 태그 병합 모달                   | §9.4.6 POST /merge    | 모달(source 고정 + target select) → 확인 → 토스트 |
| 태그 삭제 (정책 분기)            | §9.4.6 DELETE         | 사용중/규칙참조 시 에러 토스트, 0건일 때 success  |
| 규칙 일시중지(suspend)           | requirements.md §15.3 | tag_rules 행에 데모 토글, 토스트                  |
| 사용 VOC 0건 케이스 강조         | §9.4.6 회귀 (1)       | 카운트 0 행에서 "삭제 가능" 힌트                  |

### Out of scope (스텁만, 토스트로 안내)

- 실 BE 호출, 트랜잭션 동시성 검증 (D22 회귀 4건 중 BE 한정 항목)
- Audit log 화면 (감사 로그 별도 화면 미설계)
- 페이지네이션 (12건 → 단일 페이지 데모)
- 슬러그 자동 생성 알고리즘 (BE 책임)
- 영구 페이지네이션 / URL 쿼리 파라미터 영속

---

## 3. mock 데이터 구조

`prototype/js/admin-tag-master-data.js` (분리 권장 — `result-review-data.js`와 동일 패턴, ≤80 lines).

```js
// 시연용 mock — 필드는 spec §4 tags + §15.3 운영 갭 컬럼에서 발췌
window.tagMasterData = [
  // 외부 — equipment 마스터 출처
  {
    id: 'tg01',
    name: 'PRESS-A12',
    slug: 'press-a12',
    kind: 'general',
    isExternal: true,
    externalSource: 'equipment',
    vocCount: 8,
    lastUsedAt: '2026-04-28',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  {
    id: 'tg02',
    name: 'CNC-3F-07',
    slug: 'cnc-3f-07',
    kind: 'general',
    isExternal: true,
    externalSource: 'equipment',
    vocCount: 3,
    lastUsedAt: '2026-04-26',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  // 외부 — db 마스터
  {
    id: 'tg03',
    name: 'mes_prod',
    slug: 'mes-prod',
    kind: 'general',
    isExternal: true,
    externalSource: 'db',
    vocCount: 12,
    lastUsedAt: '2026-04-29',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  // 외부 — program 마스터
  {
    id: 'tg04',
    name: 'YieldDash v2',
    slug: 'yield-dash-v2',
    kind: 'general',
    isExternal: true,
    externalSource: 'program',
    vocCount: 5,
    lastUsedAt: '2026-04-25',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  // 수동 — 일반 + 규칙 참조 있음 (삭제 차단 대상)
  {
    id: 'tg05',
    name: '데이터수집',
    slug: 'data-ingest',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 14,
    lastUsedAt: '2026-04-30',
    mergedIntoId: null,
    ruleRefCount: 1,
  },
  {
    id: 'tg06',
    name: '성능',
    slug: 'performance',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 9,
    lastUsedAt: '2026-04-29',
    mergedIntoId: null,
    ruleRefCount: 1,
  },
  // 수동 — 일반 + 사용 0건 + 규칙 0 (삭제 가능 대상)
  {
    id: 'tg07',
    name: '폐기예정',
    slug: 'deprecated',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 0,
    lastUsedAt: null,
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  {
    id: 'tg08',
    name: 'temp-test',
    slug: 'temp-test',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 0,
    lastUsedAt: null,
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  // 수동 — menu kind
  {
    id: 'tg09',
    name: '대시보드',
    slug: 'dashboard',
    kind: 'menu',
    isExternal: false,
    externalSource: null,
    vocCount: 6,
    lastUsedAt: '2026-04-28',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  {
    id: 'tg10',
    name: '리포트',
    slug: 'report',
    kind: 'menu',
    isExternal: false,
    externalSource: null,
    vocCount: 4,
    lastUsedAt: '2026-04-22',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
  // 병합됨 — source (merged into tg05)
  {
    id: 'tg11',
    name: 'data-수집',
    slug: 'data-suzip',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 0,
    lastUsedAt: '2026-04-15',
    mergedIntoId: 'tg05',
    ruleRefCount: 0,
  },
  // 수동 — 사용 중 + 규칙 참조 없음 (삭제 차단 — VOC 사용)
  {
    id: 'tg12',
    name: 'API',
    slug: 'api',
    kind: 'general',
    isExternal: false,
    externalSource: null,
    vocCount: 7,
    lastUsedAt: '2026-04-27',
    mergedIntoId: null,
    ruleRefCount: 0,
  },
];
```

12건 커버리지: 외부 3종(equipment/db/program) ×4 + 수동(규칙참조)×2 + 사용 0건 삭제가능×2 + menu kind×2 + 병합됨×1 + 수동 사용중×1 = 12.

---

## 4. 인터랙션 시나리오

| #   | 시나리오                    | 트리거                                                                           | 결과                                                                                                       |
| --- | --------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **검색 필터**               | 상단 인풋 입력(`q`)                                                              | 즉시 클라이언트 필터 (name/slug match), 카운트 뱃지 갱신                                                   |
| 2   | **kind/외부 세그먼트 필터** | 세그먼트 버튼(전체/general/menu/외부/병합됨) 클릭                                | `tagMasterData.filter` 후 재렌더                                                                           |
| 3   | **태그 추가**               | 우상단 "태그 추가" → 모달 → 이름·kind 선택 → 저장                                | `tagMasterData.unshift()` + `showTmToast('태그 추가됨 (mock)', 'ok')`                                      |
| 4   | **태그 편집**               | 행 "편집" → 모달 (이름만 수정, kind disabled, slug readonly)                     | 데이터 수정 + ok 토스트                                                                                    |
| 5   | **외부 태그 편집 차단**     | `isExternal=true` 행에서 편집/병합/삭제 클릭                                     | `showTmToast('외부 마스터 태그는 수정할 수 없습니다.', 'warn')`                                            |
| 6   | **병합 모달**               | 행 "병합" → 모달(source 고정 + target select, 외부/병합됨/자기 자신 제외) → 확인 | source.mergedIntoId = target.id, source.vocCount=0, target.vocCount += source.vocCount, ok 토스트          |
| 7   | **삭제 — 사용 VOC > 0**     | tg12(API) "삭제" → confirm                                                       | warn 토스트: "VOC에 부착된 태그는 삭제할 수 없습니다. 병합 또는 부착 해제 후 다시 시도하세요." (spec 인용) |
| 8   | **삭제 — 규칙 참조**        | tg05(데이터수집) "삭제" → confirm                                                | warn 토스트: "태그 규칙에서 사용 중입니다." (spec 인용)                                                    |
| 9   | **삭제 — 가능**             | tg07(폐기예정) "삭제" → confirm                                                  | 행 제거 + ok 토스트 "삭제 완료 (mock)"                                                                     |
| 10  | **kind 변경 차단**          | 편집 모달에서 kind select 클릭                                                   | disabled + 툴팁 "kind는 변경할 수 없습니다"                                                                |
| 11  | **규칙 일시중지**           | 별도 "tag_rules suspend" 데모 행(상단 콜아웃) 토글                               | warn 토스트 "tag_rules 일시중지 (mock, suspended_until=+24h)"                                              |
| 12  | **병합됨 행 시각화**        | tg11 행                                                                          | dim + "→ 데이터수집(tg05)로 병합됨" pill, 작업 컬럼은 "(병합됨)" 텍스트만                                  |

---

## 5. 사용 토큰 (재사용, 신규 토큰 0건)

`prototype/css/tokens.css`에 이미 정의된 항목만 사용. 신규 추가 금지.

| 용도                         | 토큰                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 페이지 배경 / 패널 / surface | `var(--bg-app)`, `var(--bg-panel)`, `var(--bg-surface)`, `var(--bg-elevated)`                                                        |
| 텍스트 계층                  | `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`, `var(--text-quaternary)`                                     |
| 브랜드/액센트                | `var(--brand)`, `var(--accent)`, `var(--accent-hover)`, `var(--brand-bg)`, `var(--brand-border)`, `var(--text-on-brand)`             |
| 상태                         | `var(--status-green)` (사용 중), `var(--status-amber)` (외부 잠금), `var(--status-red)` (삭제 차단), `var(--status-purple)` (병합됨) |
| 폰트                         | `var(--font-ui)`, `var(--font-mono)` (slug, id)                                                                                      |

기존 admin 클래스 재사용:

- 컨테이너/툴바: `.admin-topbar`, `.admin-title`, `.section-count-badge` (admin.css L796/L805/L1494)
- 테이블: `.admin-table`, `.a-btn`, `.a-btn.danger` (L874/L1258/L1273)
- 칩: `.tag-pill-sm`, `.kw-pill`, `.status-dot.on/.off` (L1177/L1168/L1201)
- 모달: 기존 `modal.js` `openModal()`/`closeModal()` + 기존 `#modalBg` (modal.js L76/L81/L85)
- 토스트: `window.showToast(msg, kind)` (dom-utils.js L11) — 단, `tm-toast-host`로 스코프 분리는 불필요 (전역 `showToast` 재사용)

---

## 6. prototype.html 섹션 구조 (append-only)

### 6.1 사이드바 메뉴 추가 위치

`prototype/prototype.html` L52 (`결과 검토` `nav-item` 다음 줄)에 **추가**. 기존 줄 수정 금지.

```html
<!-- 기존 L48~L52 그대로 유지 -->
<div class="nav-item" onclick="setNav(this)" data-page="tag-rules">
  <i data-lucide="tag"></i> 태그 규칙 관리
</div>
<div class="nav-item" onclick="setNav(this)" data-page="system-menu">
  <i data-lucide="folder-open"></i> 시스템/메뉴 관리
</div>
<div class="nav-item" onclick="setNav(this)" data-page="voc-type">
  <i data-lucide="layers"></i> 유형 관리
</div>
<div class="nav-item" onclick="setNav(this)" data-page="users">
  <i data-lucide="users"></i> 사용자 관리
</div>
<div class="nav-item" onclick="setNav(this)" data-page="result-review">
  <i data-lucide="check-square"></i> 결과 검토
  <span class="nav-badge accent" id="reviewBadge"></span>
</div>
<!-- ↓ BEGIN P-7 (Stage B-6 D22 태그 마스터) — 새로 추가 -->
<div class="nav-item" onclick="setNav(this)" data-page="tag-master">
  <i data-lucide="hash"></i> 태그 마스터
</div>
<!-- END P-7 -->
```

### 6.2 페이지 섹션 추가 위치

`prototype.html` L599 (`<div id="page-result-review" class="admin-page"></div>`) **다음 줄**에 추가. `</main>` 직전.

```html
<!-- ── BEGIN P-7 — 태그 마스터 관리 (Stage B-6 D22) ─── -->
<div id="page-tag-master" class="admin-page">
  <div class="admin-topbar">
    <span class="admin-title">태그 마스터</span>
    <span class="section-count-badge" id="tmCount">0건</span>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <input
        id="tmSearch"
        class="tm-search"
        placeholder="이름/슬러그 검색"
        oninput="syncTmFilter()"
      />
      <div class="tm-seg" role="tablist">
        <button class="tm-seg-btn active" data-filter="all" onclick="syncTmFilter('all')">
          전체
        </button>
        <button class="tm-seg-btn" data-filter="general" onclick="syncTmFilter('general')">
          general
        </button>
        <button class="tm-seg-btn" data-filter="menu" onclick="syncTmFilter('menu')">menu</button>
        <button class="tm-seg-btn" data-filter="external" onclick="syncTmFilter('external')">
          외부
        </button>
        <button class="tm-seg-btn" data-filter="merged" onclick="syncTmFilter('merged')">
          병합됨
        </button>
      </div>
      <button class="a-btn primary" onclick="openTmAddModal()">
        <i data-lucide="plus"></i> 태그 추가
      </button>
    </div>
  </div>
  <!-- 운영 갭 콜아웃: tag_rules 일시중지 데모 -->
  <div class="tm-callout" id="tmRuleCallout">
    <i data-lucide="alert-circle"></i>
    <span>tag_rules 운영 일시중지 (Admin) — </span>
    <button class="a-btn" onclick="suspendRule()">24시간 일시중지</button>
  </div>
  <table class="admin-table">
    <thead>
      <tr>
        <th>태그명</th>
        <th>슬러그</th>
        <th>kind</th>
        <th style="text-align:right">사용 VOC</th>
        <th>마지막 사용</th>
        <th>상태</th>
        <th style="text-align:right">작업</th>
      </tr>
    </thead>
    <tbody id="tmBody"></tbody>
  </table>
</div>
<!-- END P-7 -->
```

`tm-` 클래스 prefix는 P-7 전용 스타일 (admin.css 끝에 append하는 신규 섹션). `.admin-table`/`.a-btn` 등은 기존 재사용.

### 6.3 admin.css append 영역 (append-only)

`prototype/css/admin.css` 파일 **끝**에 `BEGIN P-7` ~ `END P-7` 마커로 감싼 섹션 추가. 기존 라인 수정 금지. 약 60~80 줄 예상:

- `.tm-search`, `.tm-seg`, `.tm-seg-btn`, `.tm-seg-btn.active`
- `.tm-callout` (배경 `var(--status-amber-bg)`, 테두리 `var(--status-amber-border)`)
- `.tm-row-merged` (opacity 0.55, dim)
- `.tm-ext-pill` (외부 마스터 잠금 뱃지, `var(--status-amber)`)
- `.tm-merged-pill` (`var(--status-purple)` 계열)
- 모달 폼 보조 클래스(`.tm-form-row`, `.tm-form-label`)는 기존 `#modalBg` 컨테이너 안에서만 적용

### 6.4 script tag 추가 위치

`prototype.html` L744~L745 (result-review-data.js / result-review.js) 패턴을 **모방**, L745와 L746 사이에 삽입:

```html
<script src="js/result-review.js"></script>
<!-- BEGIN P-7 -->
<script src="js/admin-tag-master-data.js"></script>
<script src="js/admin-tag-master.js"></script>
<!-- END P-7 -->
<script src="js/diff-helpers.js"></script>
```

---

## 7. JS 모듈 API

### 7.1 `prototype/js/admin-tag-master-data.js` (≤80 lines)

- §3 mock 데이터를 `window.tagMasterData` 로 노출.

### 7.2 `prototype/js/admin-tag-master.js` (≤200 lines)

```js
// ── State (모듈 스코프)
let tmFilter = 'all';
let tmQuery = '';
let tmEditingId = null;
let tmMergeSourceId = null;

// ── Public API (sidebar.js 의 setNav 분기에서 호출)
function renderTagMaster() {
  /* tbody rebuild + count badge */
}

// ── Internals
function tmFilteredRows() {
  /* applies tmFilter + tmQuery */
}
function renderTagRow(t) {
  /* one <tr>, with merged dim / external lock pill */
}

function syncTmFilter(filter) {
  if (filter !== undefined) tmFilter = filter;
  tmQuery = (document.getElementById('tmSearch')?.value || '').trim().toLowerCase();
  // toggle seg active class via dataset
  renderTagMaster();
}

// ── Add
function openTmAddModal() {
  /* modal.openModal + form */
}
function confirmTmAdd() {
  /* unshift, showTmToast ok, closeModal */
}

// ── Edit (kind disabled)
function openTmEditModal(id) {
  tmEditingId = id; /* fill form */
}
function confirmTmEdit() {
  /* mutate tagMasterData[i].name; toast */
}

// ── Merge
function openMergeModal(sourceId) {
  tmMergeSourceId = sourceId;
  // populate target select: kind 동일 + isExternal=false + mergedIntoId=null + id !== sourceId
}
function confirmMerge() {
  // src.mergedIntoId = targetId; target.vocCount += src.vocCount; src.vocCount = 0;
  // showTmToast 'A → B 병합 완료 (mock)' ok
}

// ── Delete (정책 분기)
function deleteTag(id) {
  const t = tagMasterData.find((x) => x.id === id);
  if (t.isExternal) return showTmToast('외부 마스터 태그는 삭제할 수 없습니다.', 'warn');
  if (t.vocCount > 0)
    return showTmToast(
      'VOC에 부착된 태그는 삭제할 수 없습니다. 병합 또는 부착 해제 후 다시 시도하세요.',
      'warn',
    );
  if (t.ruleRefCount > 0) return showTmToast('태그 규칙에서 사용 중입니다.', 'warn');
  tagMasterData = tagMasterData.filter((x) => x.id !== id);
  showTmToast('태그 삭제 (mock)', 'ok');
  renderTagMaster();
}

// ── 운영 갭 데모
function suspendRule() {
  showTmToast('tag_rules 일시중지 (mock, suspended_until=+24h)', 'warn');
}

// ── Toast 래퍼 (전역 showToast 재사용 + prefix)
function showTmToast(msg, kind) {
  if (typeof window.showToast === 'function') return window.showToast(msg, kind);
}

// ── Export
window.AdminTagMaster = {
  render: renderTagMaster,
  init: () => {
    /* one-time wiring if needed */
  },
};
```

### 7.3 sidebar.js 디스패치 추가

`sidebar.js` L128~L133 분기 블록(`setNav` 함수 안 `} else {` 절)에 한 줄만 append:

```js
if (page === 'tag-rules') renderTagRules();
if (page === 'system-menu') renderSystemMenu();
if (page === 'voc-type') renderVocTypes();
if (page === 'users') renderUsers();
if (page === 'result-review') renderResultReview();
if (page === 'tag-master') renderTagMaster(); // ← P-7 추가 (이 한 줄)
if (page === 'dashboard') dashboardInit();
```

> 주의: append-only 원칙상 sidebar.js 수정은 1줄 삽입만. 다른 라인 변경 금지.

---

## 8. 사이드바 메뉴 추가 위치 (요약)

| 파일                                    | 라인                            | 변경                                                                                                     |
| --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `prototype/prototype.html`              | L52와 L53 사이                  | `<div class="nav-item" data-page="tag-master">…태그 마스터</div>` 1줄 삽입                               |
| `prototype/prototype.html`              | L599와 L600 사이 (`</main>` 위) | `<div id="page-tag-master" class="admin-page">…</div>` 섹션 삽입                                         |
| `prototype/prototype.html`              | L745와 L746 사이                | `<script src="js/admin-tag-master-data.js"></script>` + `<script src="js/admin-tag-master.js"></script>` |
| `prototype/js/sidebar.js`               | L132와 L133 사이                | `if (page === 'tag-master') renderTagMaster();` 1줄                                                      |
| `prototype/css/admin.css`               | EOF                             | `BEGIN P-7` … `END P-7` 섹션 append                                                                      |
| `prototype/js/admin-tag-master-data.js` | 신규                            | §3 mock                                                                                                  |
| `prototype/js/admin-tag-master.js`      | 신규                            | §7.2 모듈                                                                                                |

---

## 9. 의존성

| 의존                                                                                                             | 출처                                 | 사용처                                 |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| `window.escHtml`                                                                                                 | `prototype/js/dom-utils.js` L4       | 모든 mock 값 보간 (XSS 안전 패턴 모방) |
| `window.showToast(msg, kind)`                                                                                    | `dom-utils.js` L11                   | `showTmToast` 내부 호출                |
| `openModal()` / `closeModal()`                                                                                   | `prototype/js/modal.js` L76/L81      | 추가/편집/병합/삭제확인 4종 모달       |
| `#modalBg` (기존 컨테이너)                                                                                       | `prototype.html` (modal 영역)        | 폼 본문을 innerHTML 주입               |
| `lucide.createIcons()`                                                                                           | CDN (head L8) + 각 admin 페이지 패턴 | 행/버튼 아이콘                         |
| `.admin-topbar`, `.admin-title`, `.section-count-badge`, `.admin-table`, `.a-btn`, `.tag-pill-sm`, `.status-dot` | `admin.css` (L796~L1273)             | 레이아웃·테이블·버튼                   |

스크립트 로드 순서: `dom-utils.js`(L736) → `modal.js`(L739) → `admin-tag-master-data.js`(신규) → `admin-tag-master.js`(신규). 둘 다 `result-review.js`(L745) 뒤에 위치 → 의존 충족.

---

## 10. 위험 요소

| #   | 위험                                                                                                                                                       | 영향                              | 완화                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `tm-` 클래스 prefix가 기존 `.tag-pill-sm` 등과 충돌                                                                                                        | 시각 회귀                         | 모든 신규 클래스 `tm-` 시작, 기존 admin 클래스는 **오로지 재사용**(override 금지)                                                                                                                                |
| R2  | `admin-tag-master.js` 200줄 초과                                                                                                                           | 컨벤션 위반                       | mock 데이터 별도 파일 분리(§7.1)로 본 모듈은 ~150줄 예상. 모달 HTML 템플릿을 backtick 1줄 식 단일 변수로 압축. 한도 초과 시 `admin-tag-master-modals.js` 추가 분할 (Stage B-1 result-review-detail.js 패턴 모방) |
| R3  | `setNav` 디스패치 한 줄 추가 = sidebar.js 수정 — 엄격한 append-only 위반 우려                                                                              | 컨벤션 분쟁                       | Stage B-1(result-review)도 동일 한 줄 추가가 이미 머지됨(L132 `if (page === 'result-review') renderResultReview();`). 동일 패턴이므로 허용으로 간주. 본 plan에 명시                                              |
| R4  | 모달 1개(`#modalBg`)를 추가/편집/병합/삭제확인 4종에서 공유                                                                                                | 상태 누수, race                   | 각 open 함수가 `innerHTML`로 폼 전체를 덮어쓰고 `data-mode` dataset으로 식별 → result-review-detail.js에서 검증된 패턴 재사용                                                                                    |
| R5  | 토큰 신규 추가 유혹 (purple, lock 색상)                                                                                                                    | 컨벤션 위반 ("새 토큰 추가 금지") | `--status-purple`/`--status-amber` 기존 토큰만 사용. 부족 시 별도 D-결정 → 본 단계에서는 신규 0건                                                                                                                |
| R6  | mock 데이터에 hex 리터럴 (예: `color: '#5e6ad2'`)                                                                                                          | uidesign hard rule 위반           | mock 객체에 색 필드 미포함. 색은 전부 CSS에서 토큰으로 처리                                                                                                                                                      |
| R7  | `lucide.createIcons()` 호출 누락 시 hash 아이콘 미표시                                                                                                     | UX 결함                           | renderTagMaster 끝에 `if (window.lucide) lucide.createIcons();` (result-review.js L32 패턴 모방)                                                                                                                 |
| R8  | 외부 태그(`isExternal=true`)에 편집/병합/삭제 모두 차단했는데 spec은 D22 §15.3에서 "Admin 외부 잠금"이라고만 표기 — Manager가 외부 잠금 해제 가능한지 모호 | 시연 정확도                       | 프로토타입은 단순화: 외부 = 모두 잠금. 토스트 메시지로 "Admin만 외부 잠금 해제 가능" 안내 → 권한 차이 시연은 Stage B-5(역할 토글)와 별도. 본 P-7에서는 미시연(out of scope) 명시                                 |
| R9  | 병합됨 행을 목록에 계속 보여줄지 숨길지 spec 모호                                                                                                          | UX 결정 필요                      | 기본은 `merged` 필터 클릭 시에만 표시 (전체 필터에서는 숨김). 이는 BE GET 쿼리에서 `merged_into_id IS NULL` 기본값과 일관. 본 plan에 명시                                                                        |
| R10 | append-only 원칙 — `prototype.html` L52와 L53 사이 줄 삽입은 "기존 줄 수정"인가 "추가"인가                                                                 | 정책 해석                         | Stage B-1·B-2가 동일하게 새 nav-item 줄을 삽입했으며 머지됨. "줄 삽입(=인접 줄 변경 없이 새 라인 추가)"는 append-only로 간주. 본 plan에 명확화                                                                   |

---

## 부록 A — 실행 단계 체크리스트 (executor용)

1. `prototype/js/admin-tag-master-data.js` 작성 (mock 12건, ≤80줄, hex 0건)
2. `prototype/js/admin-tag-master.js` 작성 (§7.2 API, ≤200줄, `window.AdminTagMaster` export)
3. `prototype/css/admin.css` EOF에 `BEGIN P-7` … `END P-7` 섹션 append (~70줄)
4. `prototype/prototype.html` L52~L53 사이 nav-item 1줄 삽입
5. `prototype/prototype.html` L599~L600 사이 `#page-tag-master` 섹션 삽입
6. `prototype/prototype.html` L745~L746 사이 script 2줄 삽입
7. `prototype/js/sidebar.js` L132~L133 사이 dispatch 1줄 삽입
8. 브라우저 열어 12 시나리오(§4) 수동 검증, lucide 아이콘 정상 렌더 확인
9. 신규 토큰/hex 0건 grep 검증: `grep -nE '#[0-9a-fA-F]{3,8}|oklch\(' prototype/css/admin.css prototype/js/admin-tag-master*.js` → P-7 영역 hit 0건
10. `graphify update .` 실행
