# Prototype Phase 7 — Wave 3 Plan

> 작성일: 2026-05-01 / 갱신: 2026-05-01 (갭 재검토 + 구현계획 상세화)
> 목적: Wave 2 종료 후 잔여 갭을 닫고 prototype을 "이후 React 구현 시 재해석 없이 1:1 옮길 수 있는 정답집" 수준으로 마감
> 브랜치: `docs/prototype-phase7-wave3-plan` (본 문서) → 이후 sub-wave별 feature 브랜치
> 선행: Wave 2 모든 PR 머지 완료 (2026-05-01) · B-9 통합 검증 PASS

---

## 1. 목표 — "B-" 기준

prototype.html + spec만 보고 React로 옮길 때 **재해석/재결정 없이** 작업 가능한 수준.

**포함**:

- Critical 4건 + Major 1건 — 100% 시연
- Minor 중 FE mock 가능 항목 4건 — 시연 (charcount/highlight/자동 태그/가로 스크롤)
- 페이지별 비데이터 상태 + drawer 권한 차단 행동 — 시연
- **(2026-05-01 추가)** N-06 정렬 트리거 UI + N-07 첨부 정상 케이스 UI — 시연

**제외 (의도적)**:

- N-03 알림 폴링 — BE/timer 의존, mock 가치 낮음. spec 한 줄로 충분
- 4역할 × 모든 상태 풀 매트릭스 — B-5 + B-9 통합 검증으로 충분, 조합 폭발 회피
- §13 외 신규 토큰 — 기존 토큰만 사용
- Mock 로그인 화면 prototype 시연 — `frontend/src/pages/MockLoginPage.tsx`로 이미 React 구현, prototype에 재현 불필요

---

## 2. 잔여 갭 매핑 (Wave 2 후 기준 + 2026-05-01 재검토)

| ID   | 분류     | 영역                        | spec                  | sub-wave |
| ---- | -------- | --------------------------- | --------------------- | -------- |
| C-02 | Critical | Due Date 자동 설정 + 필드   | feature-voc §8.4.1/2  | W3-A     |
| N-01 | Minor    | 자동 태그 추천              | feature-voc §8.8.2    | W3-A     |
| N-02 | Minor    | 입력 한도 charcount         | feature-voc §8.10     | W3-A     |
| N-04 | Minor    | 검색 결과 highlight         | feature-voc §9.6      | W3-A     |
| N-06 | Minor    | 컬럼 정렬 트리거 UI ⚠️ 신규 | feature-voc §9.5      | W3-A     |
| N-07 | Minor    | 첨부 정상 케이스 UI ⚠️ 신규 | feature-voc §8.5      | W3-A     |
| C-10 | Critical | Type Badge                  | uidesign §14.4        | W3-B     |
| C-11 | Critical | Status Dot                  | uidesign §14.5        | W3-B     |
| C-14 | Critical | Admin 비데이터 상태         | uidesign §14.11       | W3-B/C   |
| M-05 | Major    | 외부마스터 필드-매핑        | external-masters §2   | W3-B     |
| N-05 | Minor    | W7 가로 스크롤              | dashboard W7          | W3-C     |
| —    | 보강     | Dashboard 위젯 빈 상태      | dashboard W2~W11      | W3-C     |
| —    | 보강     | Drawer 권한 차단 행동       | feature-voc §8.3·§8.4 | W3-C     |

### 2.1 신규 갭 발견 근거 (2026-05-01)

- **N-06 컬럼 정렬 트리거 UI**: `prototype/js/voc-list.js`에 `sortKey` 비교 함수는 존재하나(L24-33), 사용자가 정렬을 트리거할 UI가 없음. spec §9.5는 "테이블 헤더 컬럼 클릭"을 명시하지만 voc-list가 카드형(.voc-group)이라 헤더가 없음 → **결정 필요 항목**으로 사용자 확인 후 진행.
  - 옵션 A: voc-list 위에 정렬 드롭다운(Date▼/ID/Title/Status/Priority/Assignee) + ▲▼ 토글 칩 추가 → spec §9.5 문구 수정 ("정렬 칩 클릭")
  - 옵션 B: voc-list를 테이블형으로 재설계 → 큰 회귀 위험. 비추.
  - **권장**: 옵션 A. spec 수정 + prototype 정렬 칩 추가.
- **N-07 첨부 정상 케이스 UI**: `prototype/js/drawer-core.js`에 `<input type="file" multiple>` 1줄만 있음(L75). spec §8.5의 5개 한도 / 이미지 only / 미리보기 / 제거 버튼 / drag&drop 영역은 미시연. attachment-errors는 에러 토스트만. → 정상 업로드 흐름 + 미리보기 그리드 + 5/5 카운트 뱃지 + drag&drop 영역 추가.

---

## 3. Sub-Wave 구성

### W3-A. VOC 본체 (drawer + modal + voc-list)

**브랜치**: `feat/prototype-w3a-voc-core`
**작업 순서**: N-02 → C-02 → N-01 → N-04 → N-06 → N-07 (의존성 약한 순)

#### W3-A 항목별 구현계획

| 항목                 | 작업                                                                                                                                                                                                     | 파일                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| C-02 Due Date        | Priority 4종 → 자동 due_date 계산 (P0=1d, P1=3d, P2=7d, P3=30d). 필드 UI: drawer + 등록 modal에 datepicker. manager+ override 가능, user readonly                                                        | `js/drawer.js`, `js/modal.js`, `prototype.html` (datepicker markup), `css/drawer.css`         |
| N-01 자동 태그 추천  | 등록 modal에서 제목/본문 키워드 → 태그 칩 추천 영역 (mock dictionary). "추가" 클릭 시 선택 태그에 합류                                                                                                   | `js/modal.js`                                                                                 |
| N-02 charcount       | 제목 (max 100) / 본문 (max 5000) / 댓글 (max 1000) — input 옆 `123/100` 표시, 90% 도달 시 amber, 초과 red+disabled                                                                                       | `js/modal.js`, `js/drawer-core.js`, `css/modal.css`                                           |
| N-04 검색 highlight  | `voc-list.js` 검색어 매칭 → `<mark>` 래핑, `.search-highlight` 클래스 (background var(--brand-soft))                                                                                                     | `js/voc-list.js`, `css/list.css`                                                              |
| N-06 정렬 트리거 ⚠️  | voc-list 헤더 우측에 정렬 칩 (Date/ID/Title/Status/Priority/Assignee × ▲▼). 클릭 시 sortKey/sortDir 갱신 + URL `?sort=col&order=asc/desc` 동기화. spec §9.5 문구 "테이블 헤더" → "정렬 칩"으로 동시 수정 | `js/voc-list.js`, `prototype.html`, `css/list.css`, `docs/specs/requires/feature-voc.md` §9.5 |
| N-07 첨부 정상 UI ⚠️ | drawer 첨부 섹션: drag&drop 영역 + 5/5 카운트 뱃지 + 미리보기 그리드(thumbnail+filename+×). 등록 modal에도 동일 컴포넌트. mock 5장 시연                                                                  | `js/drawer-core.js`, `js/modal.js`, `css/drawer.css`, `prototype.html`                        |

#### 구현 세부

1. **N-02 charcount** (의존성 0, 가장 먼저):
   - 헬퍼 `js/dom-utils.js`에 `attachCharCount(input, max)` 추가
   - 임계: < 90% 기본, ≥ 90% amber(`--status-amber-fg`), > max red(`--status-red-fg`) + 저장 버튼 `disabled`
   - 적용 위치: 등록 modal title/body, drawer comment input, internal-notes 입력
2. **C-02 Due Date** (의존성 0, modal/drawer 둘 다 닿음):
   - mock 헬퍼 `calcDueDate(priority, baseDate=today)`
   - drawer datepicker: `<input type="date">` + manager+ readonly 토글 (data-role-allow="manager,admin,dev")
   - Priority change 이벤트 → due_date 자동 갱신. manager+ override 시 dirty flag 표시
3. **N-01 자동 태그 추천** (modal 내부):
   - `KEYWORD_MAP = {'키보드':'Hardware','속도':'Performance', ...}` (5~10개 mock)
   - title+body input change → debounce 300ms → 매칭된 태그 칩 그룹 렌더 (회색 outline). 클릭 시 선택 태그 그룹으로 이동
4. **N-04 검색 highlight** (voc-list):
   - `escapeHtml(text).replace(new RegExp(escapeRegex(query),'gi'), m => '<mark class="search-highlight">'+m+'</mark>')`
   - 적용: 제목 + 태그명 (spec §9.6 명시)
5. **N-06 정렬 트리거**:
   - voc-list `<div class="list-toolbar">` 내부에 `<div class="sort-chips">` 추가
   - 칩 6개 + 활성 칩에 ▲/▼ 아이콘. 동일 칩 재클릭 시 dir 반전
   - URL sync: `history.replaceState(null,'','?sort='+key+'&order='+dir)`
   - spec §9.5 동시 수정: "테이블 헤더 컬럼 클릭" → "정렬 칩 클릭" + 카드형 목록 명시
6. **N-07 첨부 정상 UI**:
   - drawer/modal 공통 컴포넌트 markup:
     ```html
     <div class="att-zone" data-voc-id="...">
       <input type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp" hidden />
       <div class="att-drop">이미지 드래그 또는 <button>선택</button> · 5MB까지 · 5/5</div>
       <div class="att-grid">
         <div class="att-item">
           <img src=".." /><span>filename.png</span><button class="att-remove">×</button>
         </div>
       </div>
     </div>
     ```
   - dragenter/dragover/drop 이벤트, attachment-errors와 통합
   - 5/5 카운트 도달 시 drop 영역 disabled

#### W3-A 수용 기준

- Priority 변경 → due_date 자동 갱신 시연 (manager 역할)
- 등록 modal에 "키보드" 입력 → "Hardware" 태그 추천 칩 표시
- 본문 4501자 입력 시 amber → 5001자 시도 시 red + 저장 disabled
- 검색 "VOC" → 목록 row의 일치 부분 마크 강조
- 정렬 칩 클릭 → 정렬 변경 + URL `?sort=date&order=desc` 동기화
- drawer 첨부에 이미지 드래그 → 미리보기 그리드 추가, 5/5 시 drop 영역 회색 처리

---

### W3-B. Admin 공통 컴포넌트

**브랜치**: `feat/prototype-w3b-admin-components`
**작업 순서**: C-11 → C-10 → C-14 → M-05 (재사용 컴포넌트가 다른 페이지에 깔리는 순)

| 항목                       | 작업                                                                                                                                                                | 파일                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| C-10 Type Badge            | `.type-badge-admin` — voc-type 페이지 type 셀에 색상 도트+라벨. 4 variant (system/menu/issue-kind/external)                                                         | `css/components/badges.css`, `js/admin-master.js`                 |
| C-11 Status Dot            | `.status-dot` — admin-table is_active/is_archived 컬럼에 8px 도트 (green/gray/red). users·tag-master·voc-type·trash 페이지 적용                                     | `css/components/badges.css`, 다수 admin-\*.js                     |
| C-14 Admin Non-data States | empty/loading/error 3 variant. `.admin-empty` (아이콘+CTA), `.admin-loading` (스켈레톤 row 5), `.admin-error` (재시도 버튼). admin 8 페이지에 토글 가능한 데모 버튼 | `css/components/admin-states.css`, 신규 `js/admin-states-demo.js` |
| M-05 외부마스터 필드-매핑  | external-masters 페이지 상단에 "필드 매핑" 섹션 추가 — VOC 어떤 필드가 어느 마스터를 사용하는지 표 (예: equipment_id → 설비 마스터). 읽기 전용                      | `js/admin-external-masters.js`, `prototype.html`                  |

#### 구현 세부

1. **C-11 Status Dot** (가장 단순, 다른 항목이 의존):
   - `.status-dot` 8px 원형 + 4 variant: `--status-green-fg`(active), `--text-quaternary`(inactive), `--status-red-fg`(archived), `--status-amber-fg`(pending)
   - 적용 admin 페이지: users(is_active) / tag-master(is_archived) / voc-type(active) / trash(deleted)
2. **C-10 Type Badge**:
   - 4 variant 토큰 매핑: system→`--brand-soft` / menu→`--status-blue-bg` / issue-kind→`--status-purple-bg` / external→`--status-amber-bg`
   - voc-type admin row의 type 셀에 도트+라벨
3. **C-14 Non-data States**:
   - `.admin-empty` SVG 아이콘 + 안내 문구 + CTA 버튼
   - `.admin-loading` 스켈레톤 row 5개 (animation: shimmer)
   - `.admin-error` 빨강 배지 + "재시도" 버튼
   - 각 admin 페이지 상단 우측에 데모 토글 셀렉트 (정상 / 빈 / 로딩 / 오류)
4. **M-05 외부마스터 필드-매핑**:
   - external-masters 페이지 상단 섹션:
     | VOC 필드 | 외부 마스터 | source key | 갱신 주기 |
     | equipment_id | 설비 마스터 | EQUIP | 1h |
     | program_code | 프로그램 마스터 | PROG | 1h |
     | db_code | DB 마스터 | DB | 1h |
   - 읽기 전용. 디버그성 정보로 §16.3 cold-start 배지와 병기

#### W3-B 수용 기준

- voc-type 페이지에 4종 type-badge 표시
- users 페이지 비활성 사용자 행에 회색 status-dot
- admin 페이지마다 "비어있음/로딩/오류" 데모 토글 동작
- external-masters 상단에 필드 매핑 표 노출

---

### W3-C. Dashboard 잔여 + 갭 재스캔

**브랜치**: `feat/prototype-w3c-dashboard-and-rescan`
**작업 순서**: drawer 권한 차단 → W2~W11 빈 상태 → N-05 가로 스크롤 → 재스캔

| 항목                  | 작업                                                                                                                       | 파일                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| N-05 W7 가로 스크롤   | 현황 카드 컨테이너 `overflow-x: auto` + 스크롤 인디케이터. 5+ 시스템 시 시연                                               | `js/dashboard-render.js`, `css/dashboard.css`              |
| W2~W11 빈 상태        | 각 widget에 데모 토글 (정상/빈/오류). 빈 상태는 `.widget-empty` 공통 컴포넌트, dashboard 카드 톤 유지                      | `js/dashboard-render.js`, `css/dashboard.css`              |
| Drawer 권한 차단      | User 역할일 때 drawer 댓글 input/첨부 버튼 fail-closed + "권한이 없습니다" 인라인 안내 (토스트 아님). admin/manager는 정상 | `js/drawer-core.js`, `css/drawer.css`                      |
| Wave 3 종료 갭 재스캔 | grep 기반 spec 섹션 ↔ prototype 매핑 재실행. 결과 0 잔여 확인                                                              | 신규 `docs/specs/reviews/prototype-phase7-wave3-rescan.md` |

#### 구현 세부

1. **Drawer 권한 차단** (W3-C 첫 번째, B-5 role-state와 직접 연결):
   - `role-state.js`의 currentRole === 'user' 시 drawer-core 댓글 input `disabled` + 첨부 zone 회색
   - 인라인 안내: `<div class="d-readonly-notice">조회만 가능합니다 (권한 없음)</div>` (토스트 X)
   - manager/admin/dev: 정상 동작
2. **W2~W11 빈 상태**:
   - `.widget-empty` 컴포넌트: 옅은 회색 일러스트 + "데이터 없음" 문구
   - dashboard 우측 상단 데모 토글 셀렉트: 정상 / 빈 / 오류 (전체 위젯 일괄 적용)
3. **N-05 W7 가로 스크롤**:
   - W7 카드 컨테이너 `overflow-x:auto` + `scroll-snap-type:x proximity`
   - 우측 fade gradient (8px) + 좌우 화살표 버튼 (5+ 카드 시 노출)
   - mock 데이터: 7개 시스템 카드
4. **갭 재스캔**:
   - `docs/specs/reviews/prototype-phase7-wave3-rescan.md` 신규
   - 4 도메인(VOC / Dashboard / Admin / Notice-FAQ) × spec 섹션 ↔ prototype 셀렉터 매핑
   - 결론: "Critical 0 / Major 0 / Minor 0 (N-03 OOS 명시)"

#### W3-C 수용 기준

- W7 카드 컨테이너 좌우 스크롤 동작
- 11개 widget마다 "빈 상태" 토글 시연
- User로 전환 → drawer 댓글창 disabled + 안내 텍스트
- 재스캔 문서에 "Critical 0 / Major 0 / Minor 0 (N-03 OOS 명시)" 결론

---

## 4. R-4 — Wave 3 종료 후 단독 PR

**브랜치**: `chore/r-4-tsx-watch`

- `backend/package.json` `dev` 스크립트: `ts-node-dev` → `tsx watch`
- 의존성: `ts-node-dev` 제거, `tsx` 추가
- 검증: `npm install` → `npm run dev` smoke (Express 부팅 + watch 동작 확인)
- PR 별도 — prototype 작업과 컨텍스트 분리

---

## 5. 리뷰 프로토콜

각 sub-wave PR마다:

1. **R1 commit** — 작업 완료
2. **5인 자가-금지 리뷰** (architect / code / security / verifier / critic) × 3관점 (spec 정합 / 구현 품질 / 회귀)
3. **R2 fix commit** — P0 일괄 fix
4. **R2 verifier APPROVE** 후 PR open

**합격선**: R2 평균 ≥85, P0 0건, hex/oklch literal 0건, 기존 토큰 외 신규 토큰 추가 0건.

**신규 갭(N-06/N-07) 추가 체크포인트**:

- N-06: spec §9.5 동시 수정 커밋 포함 (prototype + spec 동기화). spec drift 발생 시 R2 reject
- N-07: attachment-errors와의 통합 동작 회귀 검증 (5/5 도달 후 6번째 시도 → 400 에러 토스트)

---

## 6. 일정 (목표)

| 단계     | 예상 회차                               |
| -------- | --------------------------------------- |
| W3-A     | 1 회차 (N-06/N-07 추가로 1.5 회차 가능) |
| W3-B     | 1 회차                                  |
| W3-C     | 1 회차 (재스캔 포함)                    |
| R-4      | 0.5 회차                                |
| **합계** | **3.5~4 회차**                          |

---

## 7. 종료 조건 (Phase 7 close)

- [ ] W3-A/B/C 모두 R2 PASS + PR 머지
- [ ] `prototype-phase7-wave3-rescan.md` 갭 0 잔여 확인 (N-03 OOS 명시)
- [ ] R-4 머지
- [ ] feature-voc.md §9.5 정렬 칩 문구 수정 반영 (N-06 동시 커밋)
- [ ] `claude-progress.txt` Phase 7 종료 표기
- [ ] `next-session-tasks.md` Phase 7 표 모든 항목 ✅, 다음 Phase 재계획 표기

이 6개 조건 충족 시 **Phase 7 close**. 이후 phase는 종료 시점에 재계획.
