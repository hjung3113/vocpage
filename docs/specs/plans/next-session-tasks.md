# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-05-10 (Wave 5 Phase B PR-2 코드 완료 — PR / 머지 대기)
> 현재 위치: **Wave 5 Phase B PR-2 코드 완료 (`feat/wave-5-phase-b-fe`) · 사용자 검토 / push / PR 단계**
> 진행 포인터: `claude-progress.txt` 첫 30줄 → 본 문서 → 활성 plan
> **2026-05-09 정책**: 구현 정본 = `requirements.md` + `uidesign.md` 만. prototype 참조 종료.

---

## 활성 작업

| Wave          | 정본 plan                                                                                                                                                                | 상태                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FSD**       | [`archive/plans/fsd-migration.md`](./archive/plans/fsd-migration.md) · `.omc/plans/fsd-migration-plan.md`                                                                | ✅ Step 0~7 전부 완료 (PR #207~#220, 2026-05-05) — **완료·아카이브**                                                                                                                                                                                                                                                                   |
| **/voc 완성** | [`archive/plans/voc-completion-driver.md`](./archive/plans/voc-completion-driver.md)                                                                                     | ✅ PR #242 머지 — Wave 1.6 잔여 + 1.7 B/C/D 단일 PR 흡수 완료                                                                                                                                                                                                                                                                          |
| **1.6**       | [`../archive/plans/wave-1-6-voc-parity.md`](../archive/plans/wave-1-6-voc-parity.md) (history)                                                                           | ✅ 잔여 η/ζ/D 모두 `/voc 완성` 단일 PR (#242) 로 흡수.                                                                                                                                                                                                                                                                                 |
| **1.7**       | [`../archive/plans/wave-1-7-voc-create-modal.md`](../archive/plans/wave-1-7-voc-create-modal.md) (history)                                                               | ✅ Phase A 머지(PR #185) + B/C/D `/voc 완성` 단일 PR (#242) 로 흡수.                                                                                                                                                                                                                                                                   |
| **4**         | `feature-notice-faq.md` §10                                                                                                                                              | ✅ PR #245 머지 — 공지/FAQ + Notice popup. Adversarial review (1 P0, 5 P1, 4 P2) → P0 fix 동봉 머지.                                                                                                                                                                                                                                   |
| **3**         | [`wave-3-admin.md`](./wave-3-admin.md) + ADR [`0004`](../../adr/0004-admin-permission-model.md) (Accepted) / [`0005`](../../adr/0005-trash-restore-policy.md) (Accepted) | ✅ **Wave 3 완료 (2026-05-09)** — Phase A: PR #250/#251/#252/#254/#253 · Phase B: PR #262 · Phase C: PR #263 · Phase D: PR #269 · Phase E: PR #270 · Phase F (W3-8): PR #271 머지. BE 269 / FE 561 / lint 0 / 토큰 lint 0. 권한 매트릭스 §8.3 분산 커버 100% 그린. 통합 테스트 단일 파일 = FU-018. |
| **5**         | [`wave-5-notifications.md`](./wave-5-notifications.md)                                                                                                                  | 🟡 **Phase A 머지 완료 (PR #276, 2026-05-09)** + **Phase B PR-2 코드 완료 (`feat/wave-5-phase-b-fe`, 2026-05-10)** — `<NavItemCountBadge>` + Sidebar wire + notifications hooks (list 30s polling, W5-D7 재해석) + `/notifications` page + comments BE wiring + VocComment Toast/HTML/SafeHtml + FU-006 close + FU-008 close + FU-009 사용자 ad-hoc 보류. PR 생성 / 머지 대기. P2 BE batch (FU-007/010/015/018) 은 별 PR. |

### Hard-blocks

- 없음 (`/voc 완성` PR #242, Wave 4 PR #245 모두 머지 완료).

### 진행 순서

~~FSD Migration~~ → ~~`/voc 완성` PR #242~~ → ~~Wave 4 PR #245~~ → ~~Wave 3 Phase A (4 PR + hotfix)~~ → ~~Wave 3 Phase B+C (PR #262/#263)~~ → ~~Phase D+E 병렬 (PR #269/#270)~~ → ~~Phase F 종합 검증 (PR #271)~~ → ~~FU P1 batch close (PR #273)~~ → ~~Wave 5 plan 작성~~ → ~~Wave 5 Phase A (notifications + comments BE, PR #276)~~ → **Wave 5 Phase B PR-2 코드 완료 — PR / 머지 대기** → P2 BE batch (FU-007/010/015/018) → Wave 2 (Dashboard) → 운영/배포 phase.

---

## 닫힌 Wave

Wave 0/1/1.5/1.6/1.7/4 머지 완료. Wave 3 Phase A 머지 완료. 상세는 `git log --merges` 와 PR description 참조.

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
- **8-PR2** (= W3-1) = ✅ migration 014 (`tags.is_external` / `tag_rules.suspended_until`) — PR #251 `7a46d6a` 머지 (2026-05-09). `merged_into_id` 는 Resolution α 로 보류 → FU-012 trigger.
- **8-PR3** (= W3-2) = ✅ migration 015 (`vocs.deleted_by` / `voc_restore_log`) — PR #253 `f9ed85f` 머지 (2026-05-09).
- **8-PR4** (= W3-9) = ✅ migration 017 (`user_role_log` 별 테이블) — PR #250 `55548a6` 머지 (2026-05-09). FU-010 (CHECK constraint) deferral.

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

G-1 (외부 의존 — 실 MSSQL) / N-1·N-2 (NextGen 알림·AI) / P-NG (Playwright NextGen flow). 우선순위·기능별 유보는 본 문서 「이연 항목」 안에 누적.

---

## 구현 진입 상시 룰

- **2026-05-09~**: 구현 정본은 `requirements.md` (+ `feature-*.md`, `dashboard.md`) + `uidesign.md` 만. `prototype/` 비교·픽셀 측정·DOM 인용 금지.
- spec 내부 불일치(예: `requirements.md §X` vs `feature-voc.md §Y`) 발견 시 임의 결정 금지 — 사용자에게 라인/섹션 명시하여 질문.
- 사용자 답변 확정 후 정답 쪽을 정본으로 두고 나머지 동기화 커밋. 동기화 없이 구현 진행 금지.
