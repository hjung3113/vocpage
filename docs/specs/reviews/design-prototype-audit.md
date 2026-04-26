# Design ↔ Prototype 전수 Audit (2026-04-26)

> 2026-04-27 update: Phase G에서 prototype 간극 처리분 일괄 반영

> **목적**: `prototype/prototype.html`(4090 lines)과 `docs/specs/requires/design.md`(742 lines + §11) 사이의 누락·불일치를 색출하고, 향후 React 구현 시 `tokens.ts` → CSS 변수 경유의 단일 출처를 보장한다.
>
> **트리거**: `/plan` 인터뷰 4문항 (Q4="전수 audit + 신규 컴포넌트 토큰화") + Architect/Critic 합의 (`design-admin-role-overhaul.md`).
>
> **방법**: `grep -nE 'oklch\(|#[0-9a-fA-F]{3,8}\b'`로 색상 표현을 색출 → `var(--token)` 미경유 표현을 분류.

---

## 1. 정량 지표

| 지표                                           | 값                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| prototype 색상 표현 매치 (oklch + hex)         | **123건**                                                         |
| 그 중 `var(--…)` 경유가 아닌 표현              | **108건**                                                         |
| design.md `:root` 외 본문에 출현하는 raw color | 다수 (§3 색상 팔레트는 정의 표라 합법, §5 컴포넌트 본문에도 일부) |
| design.md에 누락된 컴포넌트 spec               | **12건** (Admin·Notice·FAQ 영역)                                  |

> ⚠️ "108건" 중 다수는 `:root` 토큰 **정의** 라인(§prototype.html L13~50)이며 합법. 본 audit는 `:root` 블록 외부의 raw color를 위반으로 본다.

---

## 2. 컴포넌트 갭 — design.md 신규 §13에 편입 필요

| 컴포넌트 클래스 (prototype)                                   | 위치 (line)                | design.md 현황                     | 처리                                                         |
| ------------------------------------------------------------- | -------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `.admin-topbar`, `.admin-title`, `.admin-body`                | 943~949                    | §5 `### Admin Table & Form`에 일부 | **§13.1 Admin Topbar / Card / Body**로 분리 정식화           |
| `.admin-card`, `.admin-table`, `.admin-add-form`              | 958~1057                   | §5에 부분 언급                     | **§13.2**로 이관·확장                                        |
| `.admin-btn` (등록 버튼)                                      | 950~951                    | 없음                               | **§13.2.1** 신규                                             |
| `.role-pill` 4종 (admin/manager/**dev**/user)                 | 1036~1039                  | §5 없음 (dev 자체 부재)            | **§13.3** 신규 — `role-dev` 추가                             |
| `.type-badge-admin`                                           | 1029                       | 없음                               | **§13.4** 신규                                               |
| `.status-dot` (on/off)                                        | 1032~1034                  | 없음                               | **§13.5** 신규                                               |
| `.notice-badge` 3종 (urgent/important/normal)                 | 1059~1062                  | 없음                               | **§13.6.1** 신규                                             |
| `.notice-row`, `.notice-body`                                 | 1063~1065                  | 없음                               | **§13.6.2** 신규                                             |
| `.faq-item`, `.faq-filter-bar`, `.faq-search`, `.faq-cat-btn` | 1066~1071+                 | 없음                               | **§13.7** 신규                                               |
| **'관리' 진입 버튼 (Page Header Action Slot)**                | 신규 패턴                  | §5 Page Header 미언급              | **§13.8** 신규 — `?mode=admin` 토글 contract                 |
| Login Notice Popup ("오늘 하루 보지 않기")                    | feature-notice-faq §10.3.2 | 없음                               | **§13.9** (모달 패턴 §5 Modal 절 재사용 + 옵트아웃 체크박스) |
| Sidebar Count Badge — 공지/FAQ 카운트                         | feature-notice-faq §10.2.2 | §7.4 sidebar에 부분                | **§13.10** (배지 위치/색 토큰 명시)                          |

## 3. 색상 토큰 갭 — design.md §10 보강 필요

### 3.1 신규 토큰 후보 (또는 기존 매핑)

| 신규 토큰 (제안)                        | 매핑                                                                         | 비고                                               |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| `--role-admin-bg` / `-fg` / `-border`   | 기존 `--brand-bg` / `--accent` / `--brand-border` 재사용                     | prototype L1037 그대로                             |
| `--role-manager-bg` / `-fg` / `-border` | 기존 `--status-amber-bg` / `--status-amber` / `--status-amber-border` 재사용 | prototype L1038                                    |
| `--role-user-bg` / `-fg` / `-border`    | 기존 `--bg-elevated` / `--text-tertiary` / `--border-subtle` 재사용          | prototype L1039                                    |
| **`--role-dev-bg` / `-fg` / `-border`** | **신규** — 권장: `--status-blue` 계열 (cyan 톤)                              | prototype에 미정의 → §13.3에서 토큰 정의 동시 추가 |
| `--notice-urgent-*` (3)                 | 기존 `--status-red-*` 재사용                                                 | prototype L1060 그대로                             |
| `--notice-important-*` (3)              | 기존 `--status-amber-*` 재사용                                               | prototype L1061                                    |
| `--notice-normal-*` (3)                 | `--text-tertiary` / `--border-subtle` / `transparent`                        | prototype L1062                                    |

> **결정**: 의미별 alias 토큰 (`--role-dev-*` 등)은 **추가하지 않음**. 컴포넌트 spec에서 기존 status/brand 토큰을 직접 매핑 표기. **유일 신규 토큰**은 `--role-dev-fg|bg|border` 3종 (Dev role의 시각 정체성을 위해, status-blue/cyan 톤). 토큰 sprawl 억제 (Critic Major #3 대응).

### 3.2 위반 패턴 — `:root` 블록 외 raw color

| 파일             | 라인    | 표현                                                                             | 처리 권고                                                                                                |
| ---------------- | ------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --- | ------ | ------------------------------ |
| `prototype.html` | 95      | `color: #fff` (logo svg)                                                         | `var(--text-on-brand)` 신규 또는 `oklch(100% 0 0)` 토큰화                                                |
| `prototype.html` | 157     | `color: #fff` (count badge)                                                      | 동일                                                                                                     |
| `prototype.html` | 345     | `.voc-row:hover { background: light-dark(oklch(...)) }`                          | `--row-hover-bg` 신규 또는 `--bg-elevated` 매핑 검토 (§13 audit 후 결정)                                 |
| `prototype.html` | 348     | `light-dark(oklch(...))`                                                         | 동일                                                                                                     |
| `prototype.html` | 399~433 | 상태 배지 (`s-접수`/`s-검토중`/`s-처리중`/`s-완료`) inline `light-dark(oklch())` | design.md §5 Status Badge에 5종 토큰 그룹 (`--status-{name}-{bg                                          | fg  | border | dot}`) 신규 → prototype 리팩터 |
| `design.md`      | 151     | `color: #ffffff;` 본문                                                           | §3 'Don't use pure `#000000`/`#ffffff`' 자체 위반 → `oklch(100% 0 0)` 또는 `var(--text-on-brand)`로 정정 |
| `design.md`      | 239~242 | 표 본문에 raw oklch (정의 표)                                                    | 합법 (color reference 표)                                                                                |
| `design.md`      | 262~263 | Priority Badge 색상 표                                                           | 합법 (정의)                                                                                              |
| `design.md`      | 303     | sidebar count badge 'color: #fff' 본문                                           | 위 §13.10에서 토큰화                                                                                     |

> **결정**: `--text-on-brand` 신규 토큰을 §10에 추가 (`light-dark(oklch(100% 0 0), oklch(100% 0 0))` — 의미 = "브랜드/색상 배경 위 텍스트"). 모든 `#fff` 본문 사용처를 이것으로 치환 권고.

## 4. design.md 자체 룰 위반

| §        | 항목                                                             | 위반                                         |
| -------- | ---------------------------------------------------------------- | -------------------------------------------- |
| §8 Don't | "Use pure `#000000` / `#ffffff` — always use blue-tinted values" | §5 본문 L151의 `color: #ffffff;` (자기 위반) |
| §8 Don't | inline `oklch(...)` 금지 항목 **부재**                           | prototype 본문 39건 미가드                   |
| §8 Don't | inline hex `#xxxxxx` 금지 항목 **부재**                          | 별도 명시 없음 → 추가 필요                   |

→ **§8 Don't에 다음 항목 추가** (English):

> - Never write raw color literals (`#xxxxxx`, `oklch(...)`, `light-dark(oklch(...))`) **outside the `:root` token block** — always reference `var(--token)` names. Inline color literals in component CSS or `style=` attributes are forbidden.

## 5. ADR — Decision Record (consensus 적용 결과)

### Decision

1. design.md에 **§13 'Admin · Notice · FAQ Components'** 신규 — Admin·공지·FAQ·관리 진입 버튼·로그인 팝업·사이드바 카운트 배지 12건 spec 정식화. 영문 작성.
2. **신규 토큰**은 `--role-dev-{bg|fg|border}` + `--text-on-brand` 4종으로 한정. 그 외 영역은 기존 status/brand 토큰 재사용 매핑만.
3. **§8 Don't**에 raw color literal 금지 항목 신설 (hex + oklch + light-dark 모두 포함).
4. 공지/FAQ 관리 진입은 **각 페이지 우측 상단 '관리' 버튼**에서 `?mode=admin` 쿼리 파라미터로 토글 (deep-link/뒤로가기 보존). Admin 탭의 공지/FAQ 서브탭은 폐기.
5. **Dev role 정당성 driver**: (a) Dashboard 접근 — User=❌ vs Dev=✅. ownership으로 표현 불가. (b) 초대/승급 flow의 의미 단위. (c) 사용자 가시 role-pill의 정체성 표시. → 4번째 enum value 채택 정당화.
6. Migration 산출물은 `docs/specs/plans/migration-012-draft.md` (DDL/롤백 spec) — 실제 `backend/migrations/012_*.sql`은 구현 phase 승인 후 생성.

### Drivers

- 시각적 일관성과 토큰 단일 출처 강제 (CLAUDE.md 디자인 룰).
- 권한 모델 단순성 vs 표현력 — Dashboard 접근만으로도 4번째 enum 정당화.
- 인라인 toggle의 deep-link 손실 회피.
- "no implementation without spec" 룰 — 구현 phase 승인 전엔 backend/migrations/ 신규 파일 금지.

### Alternatives Considered

| 대안                                                              | 채택 여부  | 사유                                                                                                                     |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| **No Dev role; assignee-ownership predicate against `user` role** | 기각       | Dashboard 접근(`User❌→Dev✅`)을 ownership만으로 표현 불가. 또한 role-pill로 "내부 엔지니어" 시각 표시가 UX 명세상 필요. |
| Dev role + 모든 VOC에 Manager 권한                                | 기각       | 사용자가 명시 거부 ("본인 담당 VOC 한정"). 보안 폭증.                                                                    |
| Notice/FAQ 관리 — 별도 라우트 (`/notice/admin`)                   | 기각(보류) | 페이지 컨텍스트 단절. 단, `?mode=admin` 쿼리로 deep-link는 보존. NextGen에서 별도 라우트 재검토 가능.                    |
| Notice/FAQ 관리 — Admin 탭 서브탭 유지                            | 기각       | 사용자 명시 결정 — 진입 동선 단축이 핵심.                                                                                |
| 의미별 alias 토큰 대량 신설 (`--notice-urgent-*` 등)              | 기각       | 토큰 sprawl. 기존 `--status-*` 재사용으로 의미 매핑만 문서화.                                                            |

### Consequences

- ✅ 권한 매트릭스에 `🟡 own` 마커 도입 → BE 단일 helper `assertCanManageVoc(user, voc, action)` 강제. (feature-voc.md §8.4-bis 신규)
- ✅ design.md §13 추가로 React 컴포넌트 작성 시 spec-first 보장.
- ⚠️ 권한 매트릭스 차원 확장 (User/Dev/Manager/Admin × always/own/never) → BE 테스트 케이스 ~1.3배 증가 예상.
- ⚠️ `?mode=admin` 토글로 admin-only DOM이 user 번들에 포함될 가능성 → FE 구현 시 코드 분할 또는 `lazy()` 적용 필수.

### Follow-ups

1. 구현 phase 진입 시 `backend/migrations/012_add_dev_role.sql` 실파일 생성 (현 draft 기반).
2. `frontend/src/auth/mockUsers.ts`에 `mockDev` fixture 추가 + role union type 확장.
3. BE `assertCanManageVoc` helper 단일화 PR — 모든 VOC 라우트 적용.
4. Notice/FAQ 페이지 React 컴포넌트 작성 시 `?mode=admin` 라우트 가드 + role guard hook.
5. design.md §5 Status Badge 토큰화 별도 ticket — prototype L399~433 위반 정리.

---

## 6. 후속 티켓 (next-session-tasks.md에 등록)

- [ ] T1: design.md §13 작성 (영문 700~1000 lines 추가)
- [ ] T2: design.md §10에 `--role-dev-{bg|fg|border}` + `--text-on-brand` 토큰 추가
- [ ] T3: design.md §8 Don't에 raw color literal 금지 항목 추가
- [ ] T4: design.md §5 Status Badge 토큰 그룹 정식화 (prototype L399~433 정리 ticket 별도)
- [ ] T5: prototype.html `#fff` 2건 + `light-dark(oklch())` 본문 사용처를 토큰화 (구현 phase에서 React 옮기면서 자동 해소 가능 — 본 audit 결과는 가드 조건으로만 활용)

---

_Generated by `/oh-my-claudecode:plan` consensus mode (Architect + Critic 검토 후 적용)._
