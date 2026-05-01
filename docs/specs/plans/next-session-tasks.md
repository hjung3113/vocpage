# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-05-01 (**Phase 8 Wave 1 종료** — PR #110/#111/#112/#113 머지)
> 현재 위치: **Phase 8 Wave 2 진입 대기** — closure report `phase-8-wave1-closure-report.md` + 회고 `phase-8-pattern.md` 사용자 검토 + follow-up A/C 마감 후 진입
> Wave 3 결과: PR #93 W3-A / #94 W3-B / #95 W3-C 모두 머지 + 갭 재스캔 결론 0 잔여
> R-4 (tsx watch) 이미 완료 — backend `dev` 스크립트 `tsx watch` (commit 809e267)

---

## Phase 7: Prototype 고도화 (현재 진행)

> **목표**: prototype.html을 모든 화면·상태·역할에 대해 1:1 재현 가능한 수준으로 끌어올린다.
> **선행 조건**: PR #54 머지 완료 (2026-04-27)

| ID   | 항목                                                                                                                                    | 상태                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| P-1  | 미구현 화면 추가 (C1 Result Review 관리자, C2 Internal Notes 드로어, C3 공지 팝업 2-panel)                                              | ✅ B-1 (Wave 1) + B-3 (Wave 2)           |
| P-2  | 역할별 뷰(admin/manager/user/dev) 변형 demo — `?mode=admin` + role-pill 토글                                                            | ✅ Wave 2 (B-5 + B-4a + B-9, PR #80/#86) |
| P-3  | uidesign.md §13 Admin·Notice·FAQ 컴포넌트 12건 prototype 반영                                                                           | 부분 ✅ (잔여 §13.4·5·11 → **W3-B**)     |
| P-4  | 상태/엣지케이스 패널 (빈 상태, 오류, 로딩, 권한 차단, 길이 초과)                                                                        | → **W3-B/C**                             |
| P-5  | 섹션별 컴포넌트 인벤토리 + spec(라인) ↔ prototype(셀렉터) 매핑표                                                                        | ✅ Wave 1 (74% coverage)                 |
| P-6  | prototype vs spec 갭 재스캔                                                                                                             | ✅ Wave 1 (29건 → Wave 2/3 입력)         |
| P-7  | D22 태그 마스터 관리 페이지                                                                                                             | ✅ Wave 1 (PR #66)                       |
| P-8  | D23 휴지통 페이지                                                                                                                       | ✅ Wave 1 (PR #67)                       |
| P-9  | 검토 상세 드로어 R3 verification                                                                                                        | ✅ (2026-04-28)                          |
| P-10 | External Masters 관리 페이지                                                                                                            | ✅ Wave 1 (PR #69)                       |
| P-11 | VOC 드로어 고급 6종                                                                                                                     | ✅ Wave 2 B-13 (PR #82)                  |
| P-12 | 알림 유형별 + Urgent 뱃지                                                                                                               | ✅ Wave 1 (PR #70)                       |
| P-13 | User 관리 가드 토스트                                                                                                                   | ✅ Wave 2 B-15 (PR #83)                  |
| P-14 | 첨부 업로드 에러 토스트                                                                                                                 | ✅ Wave 2 B-16 (PR #84)                  |
| P-15 | Dashboard 설정 패널                                                                                                                     | ✅ Wave 2 B-17 (PR #85)                  |
| P-16 | Wave 3 잔여 갭 마감 — C-02 / N-01 / N-02 / N-04 / N-06 / N-07 / C-10 / C-11 / C-14 / M-05 / N-05 + dashboard 빈 상태 + drawer 권한 차단 | ✅ Wave 3 W3-A/B/C (PR #93/#94/#95)      |

---

## Wave 3 종료 후 단독 PR

| ID  | 항목                                                                 | 상태                                 |
| --- | -------------------------------------------------------------------- | ------------------------------------ |
| R-4 | `ts-node-dev → tsx watch` 교체 (backend/package.json `dev` 스크립트) | ✅ (commit 809e267 — 이미 적용 완료) |

---

## Phase 7 close 결과 (2026-05-01)

| 종료 조건 (plan §7)                                          | 상태                              |
| ------------------------------------------------------------ | --------------------------------- |
| W3-A/B/C R2 PASS + PR 머지                                   | ✅ #93 / #94 / #95                |
| `prototype-phase7-wave3-rescan.md` 갭 0 잔여 (N-03 OOS 명시) | ✅ Critical 0 / Major 0 / Minor 0 |
| R-4 머지                                                     | ✅ (commit 809e267 — 사전 완료)   |
| feature-voc.md §9.5 정렬 칩 문구 수정 (N-06 동시 커밋)       | ✅ W3-A commit 6015ffc            |
| `claude-progress.txt` Phase 7 종료 표기                      | ✅ 2026-05-01                     |
| `next-session-tasks.md` Phase 7 ✅ + 다음 Phase 재계획 표기  | ✅ 본 문서                        |

---

## Phase 8: FE 실구현 (Contract-first per-screen, 6 Wave)

> **계획서 정본**: `docs/specs/plans/phase-8.md` (PR #99, 2026-05-01 머지)
> **방식**: A′ Contract-first per-screen — Wave 1만 vertical slice, Wave 2~5 분리 PR
> **스택**: shadcn/ui + TanStack Query/Table + RHF/Zod + MSW + Recharts (폐쇄망 self-host 가능 구성)
> **운영 전제 (2026-05-01 갱신)**: Wave 0~5는 **개방망 표준 npm registry**로 진행. 폐쇄망 빌드는 동일 lockfile + `phase-8.md` §7.2 우회 4경로(미러 / 오프라인 캐시 / Verdaccio / git tarball·`npm pack`)로 **사후 재현**. 사내 미러 점검은 Phase 8 종료 후 별도 phase. 단, 진행 중에도 runtime fetch·CDN URL·telemetry zero / self-host / `package-lock.json` commit 강제(폐쇄망 재현 가능성 보존).

| Wave | 범위                                                                                                                                                   | PR 수 | 상태                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------- |
| 0    | Foundation — shared/, shadcn 8종, TanStack Query, MSW, AppShell, RoleContext, BE Zod, ESLint(max-lines), CI 매트릭스, PR template, 폰트 self-host 점검 | 1     | ✅ PR #102                                                                              |
| 1    | **기준 화면** — VOC 리스트 + 검토 드로어 (vertical slice) + 회고 `phase-8-pattern.md` + RTL F-T4/F-T5 보강                                             | 4     | ✅ #110/#111/#112/#113 — closure report 사용자 검토 + follow-up A/C 마감 후 Wave 2 진입 |
| 2    | Dashboard + 위젯 8종 (계약 → FE → BE)                                                                                                                  | 3     | Wave 1 게이트 통과 후                                                                   |
| 3    | Admin 4 화면 (Tag Master / Trash / External Masters / Users) — 계약 1 + FE/BE 묶음 4                                                                   | 5     | 병렬 가능                                                                               |
| 4    | 공지/FAQ + Notice popup                                                                                                                                | 3     | 병렬 가능                                                                               |
| 5    | 알림 + 셸 마감 + 시각 회귀 12 화면 — N-03 BE polling 필수                                                                                              | 3     | close gate                                                                              |

**Phase 8 close 조건** (계획서 §2 Wave 5 close 참조):

- 빌드/테스트/lint clean (FE/BE) + fixture-seed parity check
- Playwright 9 시나리오 PASS
- 핵심 12 화면 시각 회귀 yes/no 통과 (사용자 결정자)
- NextGen leger 갱신 (N-03-ETag, 시각 회귀 자동화, shadcn 라이선스 inventory, contract semver)

**Wave 0 첫 commit**: 레지스트리 환경 기록 (`npm config get registry` + `npm ci` 캡처) + 폐쇄망 사후 재현 4경로(§7.2: 미러 / 오프라인 캐시 / Verdaccio / git tarball·`npm pack`) 우선순위 정리 → `docs/specs/plans/phase-8-mirror-check.md`. **개방망 진행 강제 규칙**: runtime fetch·CDN URL·telemetry 산출물 zero / 폰트·아이콘·MSW worker self-host / `package-lock.json` 항상 commit.

---

## 이연 갭 — 향후 phase 참조용

> 지금까지 Phase E/F/G/cross-review/Wave 1~3 진행 중 발견된 결정·결함·운영 차단 항목. **재계획 시 우선순위 후보**로 사용.

### Cross-review 결정 (Q1~Q5, ✅ 2026-04-27 확정)

| #   | 결정 항목                                                                            | 결정                                                                                                                  |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Q1  | dashboard.md `7d/30d/90d` ↔ req §4 `1m/3m/1y/all/custom` ↔ migration 011 충돌        | **마이그·req 정본 → dashboard.md 수정** (R-5 적용 완료)                                                               |
| Q2  | requirements.md §15 본문에 D22/D23 진입점 서브섹션 vs 포인터만 유지                  | **포인터 한 줄** — feature-voc.md §9.4.6/9.4.7 단일 출처 (R-7 적용)                                                   |
| Q3  | dashboard 위젯 수용 기준 23개 → §13.1.1 Given/When/Then 일괄 변환 vs 체크리스트 허용 | **일괄 변환** — 향후 R-8에서 처리                                                                                     |
| Q4  | §13.4 "VOC 1,000건" vs dashboard.md:661 "10만 건"                                    | **3,000건 통일** (2026-05-01 갱신) — 연 1,000건 × 3년 보관 가정. requirements.md §13.4 + dashboard.md §성능 동시 갱신 |
| Q5  | external-masters atomic swap: 전체 트랜잭션 vs source별 독립                         | **source별 독립** — 운영 인시던트 격리 우선, 8-M3 spec 반영                                                           |

### Phase F 후속 — 구현 phase 진입 시 이행 (BE/FE 코드)

| ID  | 항목                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------- |
| F1  | `backend/migrations/013_add_dev_role.sql` 실파일 생성 (draft 기반 — 012는 voc_origin_metadata가 선점, 013으로 시프트) |
| F2  | `backend/seeds/mock-users.sql`에 dev fixture 1건 추가                                                                 |
| F3  | BE `assertCanManageVoc(user, voc, action)` 헬퍼 단일화 + 모든 VOC 운영 라우트 적용                                    |
| F4  | FE/BE `Role` union 타입에 `'dev'` 추가, `mockUsers.ts` fixture 추가                                                   |
| F5  | `POST /api/auth/mock-login` body validator enum 확장                                                                  |
| F6  | FE role guard hook 분기 갱신 (`useRequireRole`, dashboard 가드, internal note 가드, role-pill)                        |
| F7  | Notice/FAQ 페이지에 `?mode=admin` 쿼리 토글 + admin-only 컴포넌트 dynamic import                                      |
| F8  | Admin 페이지에서 공지/FAQ 서브탭 제거 (코드/네비/라우트 정리)                                                         |
| F9  | uidesign.md §13 컴포넌트들을 React로 구현 (역할별: AdminTopbar, RolePill 4종, NoticeBadge 3종 등)                     |
| F10 | prototype.html `#fff` 2건 + 본문 `light-dark(oklch())` 사용처 토큰화 (또는 React 이관 시 자동 해소)                   |
| F11 | uidesign.md §5 Status Badge 토큰 그룹 정식화 (R-11에서 자동 해소됨, ✅)                                               |
| F12 | BE 회귀 테스트 5건 추가 (feature-voc.md §8.4-bis 명시)                                                                |

### 권한·스키마 인프라 우선 PR 후보

| ID    | 항목                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8-PR1 | **권한 인프라 PR** = migration 013 실파일(F1, 012는 voc_origin_metadata 선점) + dev role 4파일 동기화(F4·F6) + `assertCanManageVoc` 헬퍼 단일화(F3) |
| 8-PR2 | migration 014 = `tags.is_external`, `tags.merged_into_id` FK, `tag_rules.suspended_until` (D22 운영 차단 해소)                                      |
| 8-PR3 | migration 015 = `vocs.deleted_by`, `voc_restore_log` (D23 운영 차단 해소)                                                                           |

### 명세 보강 (M)

| ID   | 항목                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 8-M1 | `005_content.sql` `faq_categories.slug UNIQUE`/`is_archived` 명세 §10.4 보완 (스키마 선행 잔재)                    |
| 8-M2 | `notices.visible_from/to` → `timestamptz` + KST 자정 경계 명문화                                                   |
| 8-M3 | external-masters refresh 스케줄러/실패 처리 spec (Q5 결정 반영)                                                    |
| 8-M4 | FE 미정의 토큰 사용 정리 — `MockLoginPage.tsx:48,57` `--border` → `--border-standard`, `--danger` → `--status-red` |

### Phase C — 프로토타입 간극 해소 (이미 Wave 1~2에서 흡수)

> C1/C2/C3는 Phase 7 Wave 1/2에서 prototype에 반영 완료. C10/C11/C12는 Phase E에서 명세 완료 — 향후 React 구현 시 그대로 옮기면 됨.

### 이연 — 운영/배포 phase 후보 항목

- `connect-pg-simple` 세션 스토어 (`NODE_ENV=production`)
- OIDC 인증 실구현 (`oidcAuthMiddleware`)
- Production Dockerfile + 빌드 파이프라인
- 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후, G-1 외부 의존)
- 배포 + smoke test
- Playwright E2E 핵심 3플로우 (requirements §13.3)
- Jira 마이그레이션 스크립트 (오픈 전 필수)
- §13.4 성능 측정 환경/툴 정의
- §17 D3·D4·D5·D6 메모 → 명세 본문 흡수

### 미결 (외부 의존 / NextGen)

→ **`docs/specs/plans/nextgen-backlog.md`** 로 이전 (MVP/Phase 7 진행 문서와 분리).
G-1 / N-1 / N-2 / P-NG + 우선순위 4개 + 기능별 유보 사항 모두 해당 문서로 통합.

### 구현 진입 상시 규칙 (재계획 시점에도 유효)

- 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

---

## 완료된 Phase 요약

- **Phase E** ✅ (2026-04-26) — `migrations/011_pre_impl_alignment.sql` 통합. P1 4건 + P2 5건 + DB Major 1건 + GAP-1.
- **Phase F** ✅ (2026-04-26) — D18~D21 (Dev role / `?mode=admin` 진입점 / uidesign §13 신규 / `assertCanManageVoc`).
- **Phase G** ✅ (2026-04-27) — 설계 단계 잔여 17건 일괄 마무리.
- **2026-04-27 cross-review** ✅ — Q1~Q5 결정 + R-5/R-7/R-10/R-11/R-12 즉시 적용.
- **Wave 1** ✅ (2026-04-30) — P-7 / P-8 / P-10 / P-12 / P-5 / P-6.
- **Wave 2** ✅ (2026-05-01) — B-3 / B-4a / B-4b / B-5 / B-13 / B-15 / B-16 / B-17 / B-9.
