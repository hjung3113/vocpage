# Prototype Phase 7 — Wave 1 실행 계획

> 작성: 2026-04-30
> 출처: 사용자 요청 — "phase7 남은 작업중 병렬작업 가능한것 추려줘 → wave1 진행하자"
> 상위 plan: `.omc/plans/prototype-phase7.md` (gitignored 정본), `docs/specs/plans/next-session-tasks.md` Phase 7 표
> 운영 모드: `/oh-my-claudecode:autopilot` — 각 단계 설계→계획→구현→리뷰(5인×3관점)→수정 반복, 자가 리뷰 금지

---

## 목표 (Wave 1 완료 정의)

prototype에 다음 4건의 신규 데모와 2건의 매핑 산출물을 추가하여, 다음 wave의 의존성을 해소한다.

1. 신규 admin 페이지 3건 (P-7 태그 마스터 / P-8 휴지통 / P-10 External Masters) 진입점 + mock + 토스트 인터랙션
2. 알림 유형 데모 1건 (P-12)
3. 컴포넌트 인벤토리 매핑표 (P-5) + 갭 재스캔 (P-6) — Wave 1 종료 시점 baseline 스냅샷

수용 기준:

- Stage B 추가 항목 리뷰(`docs/specs/reviews/prototype-phase7-additions-review.md`) Goal #1·#2 충족
- 토큰 100% 준수 (hex/oklch literal 0건)
- 모든 신규 JS ≤300줄
- 5인 전문가 × 3관점 리뷰 평균 ≥90 PASS

---

## Wave 1 작업 목록

| ID   | 항목                         | 신규 파일                                           | 수정 파일                                                           | 브랜치                                  |
| ---- | ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| P-7  | D22 태그 마스터 관리 페이지  | `prototype/js/admin-tag-master.js`                  | `admin.css`(append) `prototype.html`(append) `sidebar.js`(menu add) | `feat/prototype-phase7-p7-tag-master`   |
| P-8  | D23 휴지통 페이지            | `prototype/js/admin-trash.js`                       | 동일 패턴                                                           | `feat/prototype-phase7-p8-trash`        |
| P-10 | External Masters 관리 페이지 | `prototype/js/admin-external-masters.js`            | 동일 패턴                                                           | `feat/prototype-phase7-p10-ext-masters` |
| P-12 | 알림 유형 + Urgent 뱃지      | -                                                   | `prototype/js/notif.js`(rewrite ≤300) `admin.css`(append)           | `feat/prototype-phase7-p12-notif-types` |
| P-5  | 컴포넌트 인벤토리 매핑표     | `docs/specs/reviews/prototype-inventory.md`         | -                                                                   | `docs/prototype-phase7-p5-inventory`    |
| P-6  | prototype vs spec 갭 재스캔  | `docs/specs/reviews/prototype-phase7-gap-rescan.md` | -                                                                   | `docs/prototype-phase7-p6-gap-rescan`   |

실행 순서: P-7 → P-8 → P-10 → P-12 → P-5 → P-6 (P-5/P-6 마지막 — wave1 결과 반영 baseline)

---

## 섹션 분리 + Append-only 컨벤션 (Wave 1 강제)

여러 task가 같은 단일 파일(`prototype.html`, `admin.css`)을 건드리는 충돌을 줄이기 위해 다음 규칙을 강제한다.

### 1. `prototype.html`

- 각 task는 자기 섹션을 **파일 말미** 직전(예: `</body>` 직전)에 append-only로 추가
- 섹션 시작/끝 마커 필수:
  ```html
  <!-- ============================================================ -->
  <!-- BEGIN P-7 Tag Master (feat/prototype-phase7-p7-tag-master)    -->
  <!-- ============================================================ -->
  <section id="page-tag-master" class="admin-page" hidden>...</section>
  <!-- END P-7 Tag Master -->
  ```
- 사이드바 메뉴 추가는 `<!-- ADMIN MENU APPEND POINT -->` 단일 앵커 직전 1줄만 삽입 (기존 항목 수정 금지)
- 기존 마크업 line shift 금지 — 추가만 허용

### 2. `prototype/css/admin.css`

- 파일 말미에 task별 섹션 append:
  ```css
  /* ============================================================ */
  /* BEGIN P-7 Tag Master                                          */
  /* ============================================================ */
  .tag-master-page { ... }
  /* END P-7 Tag Master                                            */
  ```
- 기존 셀렉터 수정 금지. 공통 토큰 부족 시 새 토큰 추가 금지(Phase 7 합의), 기존 토큰 조합으로 해결
- task별 prefix 강제: P-7=`tm-` / P-8=`tr-` / P-10=`em-` / P-12=`nf-` (드로어 등 전역 클래스와 충돌 방지)

### 3. JS

- 신규 모듈은 파일 신설 (수정 금지). `init.js`에서 진입 함수 호출 1줄만 추가
- 전역 네임스페이스: `window.AdminTagMaster` / `window.AdminTrash` / `window.AdminExternalMasters` / `window.NotifTypes`
- 각 모듈은 `escHtml`(helpers.js) 사용. 자체 escape 함수 정의 금지

### 4. 사이드바 (`sidebar.js`)

- `renderAdminMenu()` 내 메뉴 배열에 항목 추가만 허용. 기존 항목 reorder/rename 금지
- 메뉴 라벨/아이콘은 `uidesign.md §13` 명세 준수

### 5. 머지 충돌 회피

- 각 task는 자기 브랜치에서만 작업
- main rebase 금지 (PR --merge로만 통합)
- 같은 wave 내 다른 task 브랜치 참조 금지 (서로 독립)

---

## 단계별 워크플로 (각 task 공통)

각 task에 대해 다음을 순서대로 실행. 자가 리뷰 절대 금지.

### Step 1 — 설계 (architect agent)

산출: `docs/specs/reviews/prototype-phase7-<id>-design.md`

내용:

- 명세 출처 라인 번호
- mock 데이터 구조
- 인터랙션 시나리오 (기능별 1~2개)
- 사용할 기존 토큰 목록
- prototype.html 섹션 구조 + JS 모듈 API 시그니처

### Step 2 — 구현 계획 (planner agent)

산출: 위 design 문서 하단에 "구현 단계" 섹션 append

내용:

- 파일별 변경 라인 수 추정
- 의존성 (helpers/data/sidebar 어디 호출하는지)
- 위험 요소 + 회피책

### Step 3 — 구현 (executor agent)

- design + plan을 입력으로 단일 executor 호출
- 컨벤션 준수 (마커, prefix, append-only)
- 완료 시 변경 파일 목록 + 라인 카운트 보고

### Step 4 — 리뷰 (5인 × 3관점, 병렬 subagent)

전문가 5인 (각 task별로 task 성격에 맞춰 선정):

1. `code-reviewer` — 코드 품질
2. `critic` — 결함/논리/완성도
3. `verifier` — 수용 기준 검증
4. `security-reviewer` — XSS·escape·권한 가드
5. `oh-my-claudecode:designer` — 디자인 시스템 준수 (토큰, 간격, 정렬)

각 리뷰어는 3관점 체크리스트로 정성+정량(0~100) 평가. **자가 리뷰 절대 금지** — 반드시 별도 subagent 호출.

평균 점수 기준:

- ≥90 → PASS, 다음 task로
- 80~89 → 지정 fix 후 재리뷰 1회
- <80 → 재설계

### Step 5 — 수정 + 재리뷰

- 모든 reviewer의 HIGH/CRITICAL 지적 fix
- 동일 reviewer 5인 × 3관점 재리뷰 (동일 체크리스트)
- 평균 ≥90 PASS 시 다음 task

---

## 진행 추적

| Task | 설계 | 구현 | 리뷰 1차 | Fix         | 리뷰 2차                      | PASS        |
| ---- | ---- | ---- | -------- | ----------- | ----------------------------- | ----------- |
| P-7  | ✅   | ✅   | 75.7     | 14건        | 90.4                          | ✅ (PR #66) |
| P-8  | ✅   | ✅   | 88.8     | CR2+M5+분할 | (skip — 사용자 PR/merge 요청) | ✅ (PR #67) |
| P-10 | -    | -    | -        | -           | -                             | -           |
| P-12 | -    | -    | -        | -           | -                             | -           |
| P-5  | -    | -    | -        | -           | -                             | -           |
| P-6  | -    | -    | -        | -           | -                             | -           |

(autopilot 진행 중 갱신)

### Wave 1 진행 메모 (2026-04-30)

- P-7 / P-8 모두 사용자 직접 push + autopilot mode로 PR/merge 완료
- P-7 R2 잔여 MAJOR 2건 (.type-badge-admin 분리 + empty state §13.11 토큰)은 push 직전 추가 fix 적용
- P-8 R1에서 critic이 글로벌 modal 영구 파손 CRITICAL 2건 발견 → 전용 #trConfirmBg + addEventListener 격리로 해결
- P-7/P-8 머지 충돌(`.a-btn.primary` 중복) 발생 → P-7 정의 단일 보존, P-8 블록의 중복 제거
- 잔여 Wave 1 작업: P-10 / P-12 / P-5 / P-6 — 다음 세션에서 동일 프로토콜로 진행

---

## 종료 조건

- 4개 데모 task (P-7/P-8/P-10/P-12) 5인 리뷰 PASS + 사용자 직접 푸시 가능 상태
- P-5 매핑표 ≥90% 커버 측정값 보고
- P-6 갭 재스캔 결과 wave2 입력으로 정리

종료 후 `claude-progress.txt` + `next-session-tasks.md` 갱신, autopilot state 정리.
