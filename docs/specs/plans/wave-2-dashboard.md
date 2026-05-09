# Wave 2 — Dashboard Plan

> 목적: `requires/dashboard.md` 정본의 Manager/Admin/Dev 대시보드 vertical slice (KPI 8종 + 분포 4탭 + 매트릭스 + 히트맵 + 트렌드 + 처리속도 + **react-grid-layout 커스터마이즈**) 를 Wave 단위로 구현·검증한다.
> Follow-up bucket: `followup-bucket.md`. ID 규칙은 root `CLAUDE.md` 참조.
> 정본 product spec: `requires/dashboard.md` (특히 §위젯 상세 명세, §커스터마이징, §커스터마이즈 v2 — 레이아웃 엔진).

## 0. 진입 게이트

- **Hard-block**: 없음. Wave 5 Phase B PR-2 머지 후 즉시 진입 가능 (`claude-progress.txt` 2026-05-10 기준 활성 follow-up 클로즈 완료).
- **사용자 승인**: 본 plan 의 §3 결정·§7 OQ 게이트가 모두 사용자 승인된 후 Phase A 진입.
- **선행 spec sync**: `requires/dashboard.md §커스터마이즈 v2` (2026-05-10 추가) — 본 plan 과 같은 PR 에서 머지.

## 1. 배경

- Wave 0~1.7 / Wave 3 / Wave 4 / Wave 5 머지 완료. 활성 Open follow-up = 0 (P3 잔존만: FU-009/012/019/020).
- `dashboard.md` 정본은 D14(2026-04-26) 시점 작성 — 위젯 콘텐츠 8종은 이미 fully specified, 커스터마이즈 v1 (숨김/기본값) 만 명시 후 NextGen 으로 분리.
- 2026-05-10 사용자 결정: **드래그/리사이즈/잠금/반응형을 Wave 2 MVP 로 승격**. NextGen 분리 해제.
- `dashboard_settings` 테이블 (마이그 011) 은 이미 머지 — `widget_sizes JSONB` 컬럼 재사용. v2 형식(브레이크포인트 키) 으로 직렬화 변경만 contract level 에서 강제.

## 2. 범위

### 2.1 In-scope

| 영역                | 산출                                                                                                | 정본 §                                  |
| ------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **위젯 11종**       | KPI / 분포(4탭) / 우선순위×상태 매트릭스 / 히트맵 / 주간 트렌드 / 태그 바 / 현황 카드 / 담당자 표 / 장기 미처리 / 처리속도(SLA) / 에이징 | `dashboard.md §위젯 상세 명세` (1~11)   |
| **글로벌 컨트롤**   | GlobalTabs (전체/시스템/메뉴/담당자) + 날짜 범위 + 필터 컨텍스트 배너                               | `dashboard.md §글로벌 탭/필터 컨텍스트` |
| **레이아웃 엔진**   | react-grid-layout 도입 + 12-col 그리드 + lg/md/sm 브레이크포인트 + 편집 모드 토글                   | `dashboard.md §커스터마이즈 v2`         |
| **잠금 시스템**     | Admin `locked_widgets` JSONB + 개인 `widget_visibility[id].locked` 머지                             | `dashboard.md §커스터마이즈 v2 §잠금`   |
| **설정 패널**       | 헤더 "설정" 버튼 → 우측 슬라이드인 패널 (위젯 가시성 / 기본 날짜 / 히트맵 X축 / 잠금 / GlobalTabs)   | `dashboard.md §편집 가능 항목 (MVP)`    |
| **권한 / 라우팅**   | Manager/Admin/Dev 진입, User 403, sidebar group 노출 분기                                           | `dashboard.md §대상 사용자` + ADR 0004  |
| **BE 엔드포인트**   | 위젯별 GET 11종 + `GET /api/dashboard/settings` + **`PUT /api/dashboard/settings`** (PATCH 아님 — `dashboard.md §793` / `requirements.md §347`)  | `requirements.md §11.7` + `dashboard.md §API` |
| **시각 baseline**   | dashboard 5종 PNG (전체/시스템/메뉴/담당자필터/편집모드)                                            | `CLAUDE.md §benchmark`                  |

### 2.2 Out-of-scope (이 Wave 에서 다루지 않음)

- **위젯 콘텐츠 신규 추가** — `dashboard.md` 미명시 위젯은 별 wave.
- **위젯 export (CSV/PDF)** — NextGen.
- **모바일 (xs) 편집 UI** — RGL 자동 1-col stack 으로 read-only 만. 편집 진입 자체 차단.
- **키보드 드래그 reorder** — RGL 한계. NextGen.
- **위젯 간 드릴다운 cross-link** (이미 §위젯 상세 명세에 명시된 클릭 동선만 구현, 그 외 신규 동선 X).
- **실 MSSQL 연동** — 본 Wave 는 PostgreSQL 자체 데이터로 vertical slice. 실 운영 swap 은 별 트랙 (`external-masters.md` 동일 패턴).

### 2.3 Touch budget

- **변경 (대규모)**: `frontend/src/features/dashboard/**` (신규 대량), `frontend/src/pages/dashboard/**` (신규), `frontend/src/app/router.tsx` (라우트 추가), `backend/src/routes/dashboard/**` (신규), `backend/src/services/dashboard/**` (신규), `shared/contracts/dashboard.ts` (zod 신규), `shared/fixtures/dashboard-*.json` (신규), `frontend/package.json` (`react-grid-layout` ^1.4 추가), `requires/uidesign.md` (그리드 토큰 3종 추가 — Phase A 별 PR), `requires/dashboard.md` (본 PR 에 sync 동봉).
- **비변경**: Wave 3 admin 도메인, Wave 4 notice/faq, Wave 5 notifications, VOC 도메인 본문, 토큰 정의부 (그리드 토큰 외).
- **신규 의존성**: `react-grid-layout@^1.4` (MIT, 80kb gz), `@types/react-grid-layout` (dev).

## 3. 결정 (잠금 — 사용자 최종 승인 시점에 잠긴다)

| ID    | 항목                       | 결정                                                                                                                                                                                          | 근거                                                |
| ----- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| W2-D1 | 레이아웃 라이브러리        | **`react-grid-layout` ^1.4** (`Responsive` + `WidthProvider`). 거부: dnd-kit (그리드 수학 자체 구현 부담), gridstack (레거시).                                                                | dashboard.md §커스터마이즈 v2 §라이브러리           |
| W2-D2 | `widget_sizes` 직렬화      | **v2 (breakpoint-keyed)**. v1 (flat) 데이터 부재 → in-app 마이그 불필요. zod 가 v2 형식만 허용.                                                                                                | dashboard.md §widget_sizes v2 직렬화                |
| W2-D3 | 잠금 의미                  | **2-tier**: Admin `locked_widgets` (전체 강제 static) + 개인 `widget_visibility[id].locked` (자기 화면). 머지 = OR. 개인 unlock 으로 Admin lock 해제 불가. **선행 조건: 마이그 022 (`locked_widgets` JSONB 컬럼 신설) 머지 — codex 검증 결과 011/012 에 부재.**  | dashboard.md §잠금 머지 규칙 + codex 리뷰 (2026-05-10) |
| W2-D4 | 기본 레이아웃              | `frontend/src/features/dashboard/defaultLayouts.ts` (lg/md/sm 명시, xs auto-stack).                                                                                                           | dashboard.md §저장/복원                             |
| W2-D5 | Phase 분할 (codex 권고 반영) | A 마이그(021/022)/contract/RGL install → **D RGL 쉘 + defaultLayouts + lock 머지 (placeholder 위젯)** → **B,C 위젯 콘텐츠 병렬** → E 설정 패널 → F 종합검증. RGL CSS 검증을 위젯 콘텐츠보다 먼저. | codex 리뷰 §5 phase ordering                        |
| W2-D6 | PR 단위                    | Phase 당 1 PR (FE+BE+contract+fixture 동봉). spec sync PR 별도 (Phase A 시작 시 1 회).                                                                                                        | Wave 3 D4 precedent                                 |
| W2-D7 | TDD 의무 surface (codex 보강) | (a) zod (v2 형식 + bounds: `x>=0`, `y>=0`, `w>=1 && x+w<=12`, `h>=1`) — irreversible. (b) BE 권한 (Admin only `locked_widgets` mutate, User 진입 403). (c) 마이그 022 rollback 회귀. (d) **API verb parity** (PUT 만 200, PATCH 405). (e) **draft buffer cancel 회귀** (drag → cancel → DB 미반영 검증). | `CLAUDE.md §Engineering rules` + codex §4 |
| W2-D8 | 시각 검증                  | `benchmark/dashboard/*.png` 5종 신규 + `INDEX.md` row. Phase F 자손 SKIP 0.                                                                                                                   | `CLAUDE.md §Top-level directories`                  |
| W2-D9 | 자동화 / 리뷰              | Phase 진행 중 autopilot 허용. **wave plan + Phase PLAN 머지 전 `codex:rescue` 적대적 리뷰** — 산출물은 PR description 에 인라인 첨부 (별 파일 X). 머지·완료 선언은 사용자 검수 후에만. | Wave 3 D8 precedent + memory `feedback_review_delegation.md` |

## 4. 원칙

1. **Spec 정본 우선** — `dashboard.md` (특히 §위젯 상세 명세) 가 충돌하면 사용자에게 보고. 임의 동기화 금지. 본 PR 에 spec sync 동봉되는 부분은 §"커스터마이즈 v2" 만.
2. **Contract 우선** — Phase A 에서 `shared/contracts/dashboard.ts` zod 확정 + `openapi.yaml` 갱신 후 Phase B 진입. zod schema 와 fixture 가 단일 출처.
3. **권한 이중 방어** — FE role guard (sidebar group + route boundary) + BE 403. User 진입 시 403 → 홈 리다이렉트.
4. **위젯 모듈화** — 8 위젯 각각 `frontend/src/features/dashboard/widgets/<id>/` 디렉토리. 위젯 간 의존 금지 (필터 컨텍스트만 공유). 디스패치는 위젯 ID → 컴포넌트 맵.
5. **토큰 위반 0** — RGL CSS 의 `react-grid-item.dragging` / `resizing` / `static` 상태 색상은 모두 `uidesign.md` 토큰. raw hex/OKLCH 도입 금지. 그리드 gap/padding/handle 색은 신규 토큰 3종 (Phase A 별 PR).
6. **YAGNI** — 모바일 편집 UI / 키보드 reorder / 위젯 export 는 placeholder 도 만들지 않음. 코드 0줄.
7. **성능 게이트** — 페이지 최초 로드 LCP ≤ 3 초 (DB 3,000건 이하 가정, `dashboard.md §통과 게이트`). RGL `transformScale` 비활성, CSS 토큰 변환은 root 레벨에서 1 회.

## 5. 의존성 / 차단

### 5.1 진입 차단 (선행 필수)

- 없음. Wave 5 Phase B PR-2 머지 완료 (2026-05-10).

### 5.2 외부 차단 (해소 불가)

- 실 MSSQL 외부 마스터 — Phase B/C 의 시스템·메뉴 dim 셀렉터는 PostgreSQL 자체 `external_systems` / `external_menus` 캐시 사용. 실 운영 swap 은 별 트랙.
- OIDC 인증 — `AUTH_MODE=mock` 전제. role guard 만 검증. 실연동은 별 트랙.

### 5.3 후속 차단 (본 Wave 가 차단)

- **Wave 6+ 모바일 대시보드** — 본 Wave xs 브레이크포인트 read-only 결정이 패턴. 본 Wave 머지 전 모바일 편집 UI 결정 금지.
- **위젯 export (NextGen)** — 본 Wave 의 위젯 ID 체계 확정 후 export key 매핑 가능.

## 6. Phase 흐름 (codex 리뷰 §5 권고 반영 — D 를 B/C 앞으로)

```
Phase A: spec sync + contract + 마이그 + 라이브러리 (4 PR)
  ├─ PR-α docs/wave-2-spec-sync (dashboard.md §커스터마이즈 v2 + uidesign.md 그리드 토큰 3종 + 본 plan)
  ├─ PR-β migration/022-locked-widgets (locked_widgets JSONB DEFAULT '[]' 컬럼 신설 + rollback)
  ├─ PR-γ feat/wave-2-contract (shared/contracts/dashboard.ts zod v2 + bounds + openapi.yaml PUT + 위젯 11종 fixtures stub)
  ├─ PR-δ chore/wave-2-rgl-install (react-grid-layout ^1.4 + 타입 + smoke render test)
  └─ 사용자 승인 게이트 ──┐
                          ▼
Phase D: RGL 쉘 + 편집 모드 (1 PR — 위젯은 placeholder 11개)
  ├─ TDD: widget_sizes v2 zod bounds / lock 머지 규칙 / xs read-only / draft buffer cancel
  ├─ FE: Responsive + WidthProvider + 편집 토글 + grab/resize 핸들 + defaultLayouts.ts (11 위젯) + draft buffer
  ├─ visual-diff baseline 1 건 (편집 모드 grab cursor + 11 placeholder)
  └─ 사용자 검수 ──┐
                  ▼
[Phase B + Phase C 병렬 — 위젯 콘텐츠 독립]
Phase B: 위젯 1~3 (KPI + 분포 + 매트릭스) (1 PR)
  ├─ TDD: BE 권한 + 분포 dim 4종 zod
  ├─ FE: 3 위젯 — Phase D 의 placeholder 슬롯 채우기
  ├─ visual-diff baseline 1 건 (전체 탭)
  └─ 사용자 검수 ──┐
                  ▼ (or 병렬 머지)
Phase C: 위젯 4~11 (히트맵 + 트렌드 + 태그바 + 현황카드 + 담당자표 + 장기미처리 + 처리속도 + 에이징) (1 PR)
  ├─ TDD: 히트맵 X축 3종 zod / 시스템 행 클릭 → 탭 전환 / SLA % 산식 회귀 / 에이징 버킷 경계
  ├─ FE: 8 위젯 — Phase D placeholder 채우기
  ├─ visual-diff baseline 2 건 (시스템 탭 / 메뉴 탭)
  └─ 사용자 검수 ──┐
                  ▼
Phase E: 설정 패널 + 잠금 UI (1 PR)
  ├─ TDD: BE Admin only `locked_widgets` mutate / FE Admin 토글 / 개인 잠금 UI / "기본값으로 초기화" / cancel = draft 폐기
  ├─ FE: 우측 슬라이드인 패널 + 위젯 가시성 체크박스 + 기본 날짜·X축 셀렉터 + GlobalTabs 순서 (Admin)
  ├─ visual-diff baseline 1 건 (담당자 필터 컨텍스트 배너)
  └─ 사용자 검수 ──┐
                  ▼
Phase F: 종합 검증
  ├─ 5 시각 baseline 자손 SKIP 0
  ├─ 권한 매트릭스 BE 통합 테스트 그린 (User 403, Dev read 가능, Admin only mutate)
  ├─ FE/BE typecheck + lint + test 모두 그린
  ├─ 토큰 lint (raw hex/OKLCH 0 hits, 그리드 토큰 3종 lint:tokens 통과)
  ├─ 성능: dev 서버 LCP 측정 ≤ 3s
  ├─ fixture parity (`scripts/check-fixture-seed-parity.ts` — 11 위젯 dim/xAxis/menu/assignee 조합 커버)
  ├─ claude-progress.txt + next-session-tasks.md 갱신
  └─ 사용자 최종 승인 → Wave 2 완료
```

### 6.1 Phase 게이트 룰

- 직전 Phase 마지막 PR 머지 + 사용자 검수 통과 시 다음 Phase 진입.
- **Phase D 가 B/C 앞**: codex 권고 — RGL CSS·lock·draft buffer 검증을 위젯 콘텐츠 전에. 위젯 ID 와 defaultLayouts 는 Phase A 의 contract 에서 고정.
- Phase B / C 는 서로 독립 → 사용자 승인 시 병렬 슬롯 가능. Phase D 머지 전 진입 금지.

### 6.2 Task ID 부여

| ID    | Phase | 작업 (한 줄)                                                                                                            | trigger / 비고                                  |
| ----- | ----- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| W2-1  | A     | docs/wave-2-spec-sync (`dashboard.md §커스터마이즈 v2` + `uidesign.md` 그리드 토큰 3종 + 본 plan)                       | spec sync (irreversible — 사용자 승인 후 머지) |
| W2-2  | A     | migration/022-locked-widgets (`dashboard_settings.locked_widgets JSONB DEFAULT '[]'` + rollback)                        | codex §3 OQ-5 리얼리티 체크 (011/012 부재 확인) |
| W2-3  | A     | feat/wave-2-contract (`shared/contracts/dashboard.ts` zod v2 + bounds + `openapi.yaml` PUT + 11 위젯 fixtures stub)     | contract 정본 확정 + codex §1 verb mismatch     |
| W2-4  | A     | chore/wave-2-rgl-install (`react-grid-layout` ^1.4 + 타입 + smoke render test)                                          | 라이브러리 도입 별 PR                           |
| W2-5  | D     | RGL 쉘 + Responsive + 편집 모드 + defaultLayouts (11 위젯 placeholder) + lock 머지 + draft buffer (1 PR)                  | dashboard.md §커스터마이즈 v2                   |
| W2-6  | B     | 위젯 1~3 (KPI + 분포 + 매트릭스) FE+BE+fixture+권한 (1 PR)                                                                | dashboard.md §위젯 1~3                          |
| W2-7  | C     | 위젯 4~11 (히트맵 + 트렌드 + 태그바 + 현황카드 + 담당자표 + 장기미처리 + 처리속도 + 에이징) FE+BE+fixture (1 PR)         | dashboard.md §위젯 4~11                         |
| W2-8  | E     | 설정 패널 + Admin only `locked_widgets` mutate + 개인 잠금 + cancel→draft 폐기 (1 PR)                                    | dashboard.md §편집 진입점                       |
| W2-9  | F     | 종합 검증 + progress 갱신                                                                                                | gate close                                      |

> **R5 준수**: 묶음 PR 금지. W2-1/W2-2/W2-3 모두 별 PR.
> **R3 준수**: Phase A~F 는 grouping 메타데이터일 뿐 ID 에 부착 금지.

## 7. Open Questions — 결정 (2026-05-10 사용자 위임)

> 사용자가 "알아서 다 진행" 위임 (2026-05-10 세션). OQ-1~4 본 plan §3 와 정합하게 잠금. OQ-5 는 마이그 011/012 실 SQL 스캔 후 확정 (codex:rescue 리뷰 회신).

| OQ    | 항목                                                  | 결정                                                                                          | 근거                                                                       |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| OQ-1  | xs(<768) 편집 UI                                      | **A — read-only 만** (RGL 자동 1-col stack)                                                   | YAGNI · NextGen 로 분리 (`dashboard.md §접근성`)                           |
| OQ-2  | 편집 모드 vs 항상-드래그                              | **A — 헤더 "편집" 토글 진입 시에만 드래그**                                                   | 의도치 않은 드래그 방지 · 시각적 명료성 (`dashboard.md §편집 모드 토글`)   |
| OQ-3  | 자동 저장 vs 명시 저장 (codex §2 모순 지적)           | **B — draft buffer + 명시 "저장" 버튼**. drag/resize end → local draft 만 갱신. "저장" 클릭 → PUT. "취소" → draft 폐기 + 서버 hydrate 재로드. | codex 리뷰 §2 cancel 의미론 (auto-save + cancel 모순 회피) |
| OQ-4  | 위젯 추가/제거 동선                                   | **A — 설정 패널에서만** (편집 모드 빈 슬롯 카탈로그 X)                                        | 정본 §편집 가능 항목 표 정합                                               |
| OQ-5  | `dashboard_settings` 마이그 추가 (codex §3 검증)      | **B — 마이그 022 신설**. codex 가 011/012 SQL 스캔 → `locked_widgets` 부재 확인. 컬럼 명세: `locked_widgets JSONB NOT NULL DEFAULT '[]'`. | codex 리뷰 §3 (`011_pre_impl_alignment.sql:40-59`, `012_voc_origin_metadata.sql`) |
| OQ-6  | spec 자체 모순: `default_date_range` 기본값 (codex §1) | **사용자 결정 필요** — `dashboard.md:13` ("최근 1개월") vs `dashboard.md:693` 스키마 (`'3m'`) vs 마이그 011 (`'1m'`). 권장: `'1m'` 통일 (preamble + 011 정합). | codex 리뷰 §1 (spec 자체 충돌, 본 Wave plan 외 영역) |

---

## 8. 리뷰 흐름

- 본 plan 은 `codex:rescue` 에이전트 적대적 리뷰 통과 후 사용자 승인.
- 리뷰 산출물: `.claude/specs/wave-2-codex-review.md` (생성 시) — missing edge case / 모순 / 의존성 그래프 누락 사항.
- 리뷰 후 본 plan §3 결정·§7 OQ 가 추가/수정될 수 있음.
