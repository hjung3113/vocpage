# ROADMAP — vocpage (Wave 4 + Visual Identity)

Granularity: standard (7 phases — 5 active + 1 deferred sub-wave + 1 NextGen ops).
Coverage: 5/5 v1 requirements mapped (REQ-admin-pages-wave split across Phases 1/2/3/6; REQ-notice-faq shipped earlier).

## Phases

- [ ] **Phase 1: Tag Rules Consolidation** — Wave 4 Phase A: `/admin/tags` row-action으로 tag_rules CRUD 통합.
- [ ] **Phase 2: VOC Types Management** — Wave 4 Phase B: `/admin/voc-types` 신설 (CRUD + archive + 색상 swatch).
- [ ] **Phase 3: Systems & Menus Management** — Wave 4 Phase C: `/admin/systems` 신설 (cascade + "기타" auto-create + archive cascade).
- [ ] **Phase 4: Dashboard Custom Round-trip + Migration 023** — 운영 DB 마이그 023 적용 + Dashboard custom 통합 검증. **Gated by ADR-0007 (Proposed).**
- [ ] **Phase 5: Flowline Visual Identity Closure** — S7 활동 피드 + sub-pixel polish. **Gated by ADR-0008 (Proposed).**
- [ ] **Phase 6: Result-Review Sub-wave** — Wave 4 Phase D entry. **Deferred** until 4 entry conditions met.
- [ ] **Phase 7: Operational Deployment** — OIDC + 실 MSSQL + Production build + E2E. **Deferred / NextGen.**

## Phase Details

### Phase 1: Tag Rules Consolidation
**Goal**: Admin이 `/admin/tags` 한 페이지에서 태그별 자동 태깅 규칙을 직접 관리할 수 있다 (별 페이지 폐지).
**Depends on**: Nothing (current state ready — contracts already in `shared/openapi.yaml:1532–1817`).
**Requirements**: REQ-admin-pages-wave (Phase A).
**Success Criteria** (what must be TRUE):
  1. Admin은 `/admin/tags` 행에서 `규칙 N건` 뱃지를 보고 클릭하여 해당 태그의 규칙을 추가 / 수정 / 삭제 / 일시중지 / 재개할 수 있다.
  2. 신규 규칙을 추가하면 즉시 행 뱃지가 N+1로 갱신되고, 작성자 이름이 Dialog에 표시된다.
  3. `/admin/tag-rules` 별 페이지 라우트와 사이드바 entry는 코드베이스에서 완전히 제거된다 (`rg -n "/admin/tag-rules"` = 0, ADR 등 historical 제외).
  4. `/admin/tags` 상단 `전체 규칙 보기` 토글로 모든 태그의 규칙을 키워드 검색할 수 있다.
  5. Spec 동기화 (feature-voc.md §9.4.1, routing-conventions.md, shared/openapi.yaml의 TagRule 스키마)가 동일 PR로 동봉된다.
**Plans**: 8 plans
Plans:
- [ ] 01-01-PLAN.md — Wave 0 scaffolds: matcher audit + parity script generalize + RED tests for mig 024 & D-11 optimistic
- [ ] 01-02-PLAN.md — Mig 024 SQL (keywords[]+match_mode+created_by add, pattern drop) + tests GREEN + reconcile pattern readers (TDD)
- [ ] 01-03-PLAN.md — OpenAPI rewrite to nested paths + zod TagRule/TagRuleCreate/TagRulePatch/TagRuleListQuery/TagRuleListResponse + parity tests
- [ ] 01-04-PLAN.md — [BLOCKING] mig 024 push + 5 nested BE routes + permission matrix + IDOR/created_by-injection tests (TDD)
- [ ] 01-05-PLAN.md — 5 FE TanStack hooks (D-11 optimistic) + MSW handlers + optimistic.test GREEN (TDD)
- [ ] 01-06-PLAN.md — KeywordChipInput component + TagRulesManagerModal (Dialog + sub-table + permission gating)
- [ ] 01-07-PLAN.md — TagMasterTable 규칙 N건 column + TagRulesFlatTable + page view-mode tabs + URL state + page integration test
- [ ] 01-08-PLAN.md — Spec sync (feature-voc.md §9.4.1 + routing-conventions.md) + final SC-3 grep gate evidence
**UI hint**: yes

### Phase 2: VOC Types Management
**Goal**: Admin이 `/admin/voc-types`에서 VOC 유형을 생성·수정·아카이브하고, 신규 VOC 등록 모달의 select에서 비활성 유형이 자동 제외된다.
**Depends on**: Phase 1 (병렬 가능 — 슬롯 가용 시 A↔B 독립).
**Requirements**: REQ-admin-pages-wave (Phase B).
**Success Criteria** (what must be TRUE):
  1. Admin은 `/admin/voc-types`에서 새 유형을 생성하고 색상 swatch (uidesign.md 토큰 4–6색) 중 하나를 선택할 수 있다.
  2. 유형을 archive하면 신규 VOC 등록 모달의 voc-type select에서 즉시 사라지지만, 기존 VOC의 유형 표시는 유지된다.
  3. 사이드바에 `/admin/voc-types` entry가 admin 권한으로 노출된다.
  4. Spec 동기화 (feature-voc.md §9.4.3, routing-conventions.md)가 동일 PR로 동봉된다.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Systems & Menus Management
**Goal**: Admin이 `/admin/systems`에서 시스템과 그 하위 메뉴를 cascade 형태로 관리할 수 있고, 시스템 생성 시 "기타" 메뉴가 자동 생성된다.
**Depends on**: Phase 1 + Phase 2 (master 패턴 안정화 후 진입).
**Requirements**: REQ-admin-pages-wave (Phase C).
**Success Criteria** (what must be TRUE):
  1. Admin이 새 시스템을 추가하면 알림과 함께 해당 시스템의 "기타" (slug `etc`) 메뉴가 transactional하게 자동 생성된다 (DB row 2건 검증).
  2. 시스템을 archive하면 그 시스템의 모든 메뉴가 cascade로 archive되고, 신규 VOC 등록 cascade select에서 제외되며, 기존 VOC row는 영향받지 않는다.
  3. `/admin/external-masters` ↔ `/admin/masters` 명칭 drift가 routing-conventions.md에서 동시에 정리된다.
  4. 회귀 테스트 5건 ("기타" auto-create / archive cascade / VOC 수 cascade / 동시성 / unique 보장) + fixture-seed parity가 green이다.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Dashboard Custom Round-trip + Migration 023
**Goal**: 운영 DB에 mig 023이 적용되고, dashboard_settings의 `default_date_range='custom'` 값이 PR #312에서 통합 검증된 round-trip을 운영 환경에서 동일하게 통과한다.
**Depends on**: Phase 1–3 unrelated (병렬 가능). **Gated by: ADR-0007 (Proposed) — Accepted 전 phase 활성화 금지.**
**Requirements**: REQ-voc-dashboard.
**Success Criteria** (what must be TRUE):
  1. Migration 023이 운영 PostgreSQL에 적용되고, schema check (CHECK constraints, custom_start_date / custom_end_date 컬럼)가 통과한다.
  2. Manager가 `DashboardSettingsDialog`에서 custom 범위를 저장하면 운영 DB에 영속되고, 재로그인 후에도 동일 범위로 dashboard가 로드된다.
  3. Cron 집계가 ADR-0007에서 잠긴 timezone 해석에 따라 day boundary를 일관되게 계산한다.
  4. ADR-0007이 Accepted 상태로 전환되고 본 phase의 timezone 결정이 dashboard.md에 반영된다.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Flowline Visual Identity Closure
**Goal**: vocpage의 `/voc`와 admin 페이지가 `refSystem/Integrated Platform _ Standalone.html`과 동일 디자인 패밀리로 인식되며, S7 활동 피드와 sub-pixel polish가 마무리된다.
**Depends on**: Phase 1–3 (admin surfaces 안정화 후 시각 변경 안전). **Gated by: ADR-0008 (Proposed) — Accepted 및 묶음 도입 게이트 활성화 전 phase 시작 금지.**
**Requirements**: REQ-design-identity.
**Success Criteria** (what must be TRUE):
  1. uidesign.md §16의 5개 Flowline primitives (issue-id, status-glyph 등)가 spec 확정되고 `frontend/src/shared/ui/`에 도입된다.
  2. `VocActivityTimeline` (S7 활동 피드)이 Flowline 시그널과 정합화된 상태로 baseline 재촬영된다.
  3. 각 primitive 묶음마다 `impeccable:critique` 점수 ≥8/10 + 사용자 sign-off + recritique 통과 후 `implemented` 표기된다.
  4. `prototype/screenshots/` baseline 행과 `scripts/visual-diff.ts` INDEX가 신규 primitive에 대해 갱신된다.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Result-Review Sub-wave (Deferred)
**Goal**: `/admin/result-review` 페이지로 review_status 검증 게이트와 멱등 승인 워크플로우를 출시한다.
**Depends on**: Phase 1–3 머지. **Status: Deferred sub-wave — 4 entry conditions 모두 충족 시 별 wave plan으로 격상.**
**Requirements**: REQ-admin-pages-wave (Phase D).
**Entry Conditions** (모두 충족해야 sub-wave 시작):
  1. `structured_payload` 검증 게이트 정책 ADR (담당자 동시 승인 동시성 + 임베딩 파이프라인 트리거 조건).
  2. `Idempotency-Key` 헤더 정책 ADR (POST `/api/admin/result-review/:id/approve` 멱등성).
  3. `SELECT FOR UPDATE` row lock 전략 결정 (Postgres advisory lock vs row lock) + 회귀 테스트 부하 시나리오.
  4. `review_status` enum 확장 / 트리거 검토 (`unverified` → `approved` / `rejected` 전이 audit log).
**Success Criteria**: TBD — sub-wave plan 생성 시 정의.
**Plans**: Deferred until entry conditions met.
**UI hint**: yes

### Phase 7: Operational Deployment (Deferred / NextGen)
**Goal**: vocpage가 운영 환경에서 OIDC SSO + 실 MSSQL master 연결 + Production build + 전체 E2E 시나리오로 동작한다.
**Depends on**: Phase 1–5 closure. **Status: NextGen — milestone 외부.**
**Requirements**: REQ-voc-system (operational deploy slice).
**Success Criteria**: TBD — phase 활성화 시 정의.
**Plans**: Deferred / NextGen.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Tag Rules Consolidation | 0/? | Not started | - |
| 2. VOC Types Management | 0/? | Not started | - |
| 3. Systems & Menus Management | 0/? | Not started | - |
| 4. Dashboard Custom Round-trip + Mig 023 | 0/? | Gated (ADR-0007 Proposed) | - |
| 5. Flowline Visual Identity Closure | 0/? | Gated (ADR-0008 Proposed) | - |
| 6. Result-Review Sub-wave | 0/? | Deferred (4 entry conditions) | - |
| 7. Operational Deployment | 0/? | Deferred / NextGen | - |

## Coverage

- REQ-admin-pages-wave → Phases 1, 2, 3, 6 ✓
- REQ-voc-dashboard → Phase 4 ✓
- REQ-design-identity → Phase 5 ✓
- REQ-voc-system → Phase 7 (operational slice) + Phases 1–6 (constraint authority) ✓
- REQ-notice-faq → already shipped (out of milestone phase scope) ✓

No orphans. ADR-0007 / 0008 Proposed gates noted on Phases 4 / 5.
