# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-05-04
> 현재 위치: **Phase 8 Wave 1.6 진행 중** (Phase C δ-batch C-13 PR 작성 — VocReviewSections rename + 탭 폐기)
> 진행 포인터: `claude-progress.txt` 첫 30줄 → 본 문서 → 활성 plan

---

## 활성 작업

| Wave    | 정본 plan                                                                                      | 상태                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.6** | [`wave-1-6-voc-parity.md`](./wave-1-6-voc-parity.md) + [룰북](./wave-1-6-phase-c-precedent.md) | 🟡 Phase C — α/β/γ/**δ C-12** 완료 / **C-13 PR 진행 중 / ε ζ η 미착수 (총 10 PR 잔여 — 2026-05-04 η batch C-20~C-23 신규 등록)** / Phase D는 C 전체 머지 후 |
| **1.7** | [`wave-1-7-voc-create-modal.md`](./wave-1-7-voc-create-modal.md)                               | ✅ Phase A spec/contract 머지 (PR #185) / ⏳ Phase B(BE) → C(FE) → D(visual) — Wave 1.6 종료 후 진입                                                        |

### Hard-blocks

- **Wave 2 (Dashboard)** + **Follow-up C-2 (seed UUID v4)** : Wave 1.6 종료 전까지 진입 금지.
- **Wave 1.7 Phase B 이후**: Wave 1.6 종료 후.

### 진행 순서

Wave 1.6 잔여 (C-13 → ε C-14∥C-15∥C-16 → ζ C-17 → C-18∥C-19 → η C-20∥C-21∥C-22∥C-23 → Phase D) → Wave 1.7 B/C/D → Follow-up C-2 → Wave 2.

---

## Phase 8 — 6 Wave 전체 계획

> **계획서 정본**: [`phase-8.md`](./phase-8.md). 운영 전제·폐쇄망 사후 재현·Wave 0 첫 commit 정책 모두 그쪽.

| Wave | 범위                                                                                                          | 상태                               |
| ---- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 0    | Foundation — shared/, shadcn 8종, TanStack Query, MSW, AppShell, RoleContext, BE Zod, ESLint, CI, PR template | ✅ PR #102                         |
| 1    | 기준 화면 — VOC 리스트 + 검토 드로어 vertical slice + 회고 + RTL 보강                                         | ✅ #110/#111/#112/#113 + 수락 #114 |
| 1.5  | Wave 1 보강 — `/voc` 시각 동등화 + Playwright e2e                                                             | ✅ PR #125 머지 (2026-05-02)       |
| 1.6  | `/voc` prototype 일치화 — Phase A 분해 / B 토큰 / C 컴포넌트 rebuild 19개 / D 종합 검증                       | 🟡 진행 중 (위 표 참조)            |
| 1.7  | VOC 등록 모달 정합화 — A spec → B BE master → C FE rebuild → D visual diff                                    | 🟡 Phase A 머지, B~D 대기          |
| 2    | Dashboard + 위젯 8종 (계약 → FE → BE)                                                                         | Wave 1.6/1.7 종료 후               |
| 3    | Admin 4 화면 (Tag Master / Trash / External Masters / Users)                                                  | 병렬 가능                          |
| 4    | 공지/FAQ + Notice popup                                                                                       | 병렬 가능                          |
| 5    | 알림 + 셸 마감 + 시각 회귀 12 화면 (N-03 BE polling)                                                          | close gate                         |

**Phase 8 close 조건**: 빌드/테스트/lint clean / fixture-seed parity / Playwright 9 시나리오 PASS / 12 화면 시각 회귀 통과 / NextGen 갱신.

---

## 이연 항목 (재계획 시 우선순위 후보)

> Phase E/F/G/cross-review/Wave 1~3 진행 중 발견된 미결 항목. 코드·결정·운영 차단 모두 포함.

### Cross-review 결정 (Q1~Q5, ✅ 2026-04-27)

| #   | 결정                                                               |
| --- | ------------------------------------------------------------------ |
| Q1  | dashboard.md 기간 enum → 마이그·req 정본, dashboard.md 수정 (R-5)  |
| Q2  | requirements.md §15 D22/D23 → 포인터 한 줄 (R-7)                   |
| Q3  | dashboard 위젯 수용 기준 → §13.1.1 Given/When/Then 일괄 변환 (R-8) |
| Q4  | VOC 데이터 규모 → **3,000건** 통일 (연 1,000건 × 3년)              |
| Q5  | external-masters atomic swap → **source별 독립** (8-M3 spec 반영)  |

### Phase F 후속 — 구현 phase 진입 시 BE/FE 코드 (F1~F12)

migration 013 dev role / `assertCanManageVoc` 헬퍼 / FE/BE Role union `'dev'` / mock-login enum 확장 / role guard 갱신 / Notice/FAQ `?mode=admin` / Admin 페이지 서브탭 제거 / uidesign §14 React 구현 / `#fff` 토큰화 / BE 회귀 5건. 상세 spec: `feature-voc.md §8.4-bis`.

### 권한·스키마 인프라 PR 후보

- **8-PR1** = migration 013 실파일(F1) + dev role 4파일 동기화(F4·F6) + `assertCanManageVoc` 단일화(F3)
- **8-PR2** = migration 014 (`tags.is_external` / `tags.merged_into_id` FK / `tag_rules.suspended_until`) — D22 운영 차단
- **8-PR3** = migration 015 (`vocs.deleted_by` / `voc_restore_log`) — D23 운영 차단

### 명세 보강 (M)

- **8-M1** `005_content.sql` `faq_categories.slug UNIQUE`/`is_archived` §10.4 보완
- **8-M2** `notices.visible_from/to` → `timestamptz` + KST 자정 명문화
- **8-M3** external-masters refresh 스케줄러/실패 처리 spec (Q5 반영)
- **8-M4** FE 미정의 토큰 정리 — `MockLoginPage.tsx:48,57` `--border` → `--border-standard`, `--danger` → `--status-red`

### 운영/배포 phase 후보

- `connect-pg-simple` 세션 스토어 (`NODE_ENV=production`)
- OIDC 인증 실구현 (`oidcAuthMiddleware`)
- Production Dockerfile + 빌드 파이프라인
- 실 MSSQL 연동 (G-1 외부 의존)
- 배포 + smoke test
- Playwright E2E 핵심 3플로우
- Jira 마이그레이션 스크립트
- §13.4 성능 측정 환경/툴 정의
- §17 D3·D4·D5·D6 메모 → 명세 본문 흡수

### 외부 의존 / NextGen

→ [`nextgen-backlog.md`](./nextgen-backlog.md) (G-1 / N-1 / N-2 / P-NG + 우선순위 4개 + 기능별 유보).

---

## 구현 진입 상시 룰

- 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치 발견 시 임의 결정 금지** — 사용자에게 먼저 질문.
- 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 라인/섹션 명시)
- 사용자 답변 확정 후 정답 쪽을 정본으로 두고 나머지 동기화 커밋. 동기화 없이 구현 진행 금지.
