# Admin 미구현 페이지 Wave Plan (2026-05-10)

> **Status:** Draft (2026-05-10). Promoted from `admin-pages-backlog.md` §4.
> **Goal:** admin 영역 미구현 페이지 4 개를 단계적으로 출시. backlog §3 (`태그 규칙` 마스터 통합) 결정 반영.
> **Supersedes:** `admin-pages-backlog.md` §3·§4 (배경 / 부수 drift 는 backlog 문서 유지).
> **Wave ID:** `Wave 4 Admin Pages` (사용자 확정 시 ID 잠금).

## 0. 결정 잠금 (2026-05-10)

| 항목 | 결정 |
| --- | --- |
| `/admin/tag-rules` 별 페이지 | **폐지.** `/admin/tags` 에 row-action Dialog + `규칙 N건` 뱃지로 통합. |
| OQ-1 cross-tag 검색 UX | `/admin/tags` 상단 `전체 규칙 보기` 토글 + 키워드 검색 박스. |
| OQ-2 spec drift 동기화 | spec PR ≡ 코드 PR (동일 PR 내 atomic). |

## 1. 현 상태 요약 (2026-05-10 recon)

| 도메인 | OpenAPI | BE 라우트 | DB 테이블 | FE 페이지 |
| --- | --- | --- | --- | --- |
| `tag_rules` | 5 endpoints (`shared/openapi.yaml:1532–1817`) | suspend only (`backend/src/routes/admin-tags.ts:195`) | `tag_rules` (mig 014) | suspend modal + disabled placeholder (`features/admin/tag-master/ui/TagMasterRow.tsx:78`) |
| `systems` / `menus` | 4 endpoints (`shared/openapi.yaml:1319–1463`) | 미구현 | 존재 (mig 002) | 미구현 |
| `voc_types` | 4 endpoints (`shared/openapi.yaml:1463–1532`) | 미구현 | 존재 | 미구현 |
| `result_review` | 미정 (`structured_payload` 컬럼만 `shared/openapi.yaml:2634` 존재) | 미구현 | `vocs.review_status`, `structured_payload` 존재 | 미구현 |

**의미**: Phase A–C 는 contracts-first 가 이미 끝나 BE 핸들러 + FE UI 만 추가하면 됨. Phase D 는 contract 부터 시작.

## 2. 페이즈 구조

```
Wave 4
├─ Phase A — 태그 규칙 통합   (/admin/tags 확장)
├─ Phase B — 유형 관리         (/admin/voc-types 신설)
├─ Phase C — 시스템/메뉴 관리  (/admin/systems 신설)
└─ Phase D — 결과 검토 sub-wave (/admin/result-review NextGen)
```

순서 근거: 의존성 / 크기 오름차순. Phase A ↔ B 는 독립이므로 슬롯 가용 시 병렬 가능.

---

## Phase A — 태그 규칙 통합 (P2, smallest)

**Goal**: `/admin/tags` 행 단위에서 해당 태그의 `tag_rules` CRUD 가 가능하도록 master 페이지를 확장. 별 페이지 (`/admin/tag-rules`) 폐지.

**Scope (in)**:
- BE: `admin-tags.ts` 에 list / create / update / delete / suspend 핸들러 5종 (suspend 는 이미 존재 — 유지). OpenAPI 정합 (`shared/openapi.yaml:1532–1817` 기존 contract 재사용).
- BE: 마이그 024 — `ALTER TABLE tag_rules ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL` (OQ-5 결정 반영, NULL = pre-024 / system import). Create 핸들러가 `req.user.id` 주입. List 응답에 `created_by` + 조인된 `created_by_name` 포함 (UI 표시용).
- FE: `features/admin/tag-master/` 에 추가
  - `TagMasterRow` 의 `규칙 N건` 뱃지 + 행 액션 메뉴에 `규칙 관리`.
  - `TagRulesDialog` 신규 (tag-scoped CRUD, suspend 토글 흡수, 작성자 컬럼 표시).
  - `TagMasterTable` 상단 `전체 규칙 보기` 토글 + 키워드 검색 박스.
- Spec 동봉: `feature-voc.md §9.4.1` 재기술 (별 페이지 → master 통합 + `created_by` 표시), `routing-conventions.md` 의 `/admin/tag-rules` 행 제거, `shared/openapi.yaml` 의 `TagRule` 스키마에 `created_by` / `created_by_name` 추가.
- 테스트: BE Jest+Supertest (5 핸들러 happy + 권한 + suspend 재개 + `created_by` 자동 주입), 마이그 024 테스트 (NULL backfill / FK / ON DELETE SET NULL), FE Vitest (Dialog open/close, CRUD 흐름, 토글, 작성자 표시), MSW handler 추가, fixture-seed parity check (`scripts/check-fixture-seed-parity.ts` 확장 — 현재 vocs only).

**Scope (out)**:
- 키워드 정규화 / 중복 검사 로직 변경 (`tag_rules` 의 unique constraint 는 현 mig 014 그대로).
- 다중 태그 일괄 import — NextGen.
- `tag_rules.updated_by` / `last_modified_by` — OQ-5 결정에 따라 본 phase 제외, 편집 audit 필요 시 별 phase.

**Done when**:
- [ ] `/admin/tag-rules` 라우트 정의 / 메뉴 / 링크 모두 제거 (`rg -n "/admin/tag-rules"` 결과 0, ADR 등 historical 제외).
- [ ] `/admin/tags` 에서 신규 규칙 추가 → 저장 → 즉시 행 뱃지 N → N+1 갱신.
- [ ] 일시중지 후 행 액션 메뉴에서 재개 가능 (PR #262 placeholder 해제).
- [ ] 마이그 024 적용 후 신규 규칙의 `created_by` 가 현재 admin user id 로 자동 주입, Dialog 에 작성자 이름 표시.
- [ ] `feature-voc.md §9.4.1` + `routing-conventions.md` + `shared/openapi.yaml` (`TagRule` 스키마) spec 동기화 동일 PR 포함.
- [ ] BE 593+ Jest pass / FE 691+ Vitest pass (현 baseline 유지) / typecheck 양쪽 green.
- [ ] MSW + seed fixture parity check pass.

**Constraints**:
- 권한: ADR-0004 admin permission model 따름 — 기존 admin-router 미들웨어 재사용 (`backend/src/index.ts` admin scope).
- 글리프 / 다이얼로그 / 토글 컴포넌트: `uidesign.md` 토큰만 — Flowline 정합화 게이트 (ADR-0008) 적용.
- 시각 surface 변경: token 정의 변경 없음 → 시각 정합화 wave gate 발동 안 함.

**Risks**:
- `useSuspendTagRule` 단일 mutation 이 새 CRUD 캐시 키와 충돌 가능 → query-keys 통일 (`tag-master.query-keys.ts` 추가 후 invalidate 한 곳에서 관리).
- "전체 규칙 보기" 토글 켰을 때 N×M 펼침 — 기본 collapsed, 토글 시에만 fetch.

---

## Phase B — 유형 관리 (P2, small)

**Goal**: `/admin/voc-types` (가칭 라우트 — `routing-conventions.md` 신규 추가) 에서 `voc_types` CRUD + archive + 색상 swatch.

**Scope (in)**:
- BE: `admin-voc-types.ts` 신설 (CRUD 4 + archive). OpenAPI `shared/openapi.yaml:1463–1532` contract 재사용.
- FE: `features/admin/voc-type-master/` (slice 신규, `tag-master/` 패턴 미러). 색상 picker 는 `uidesign.md` 토큰 swatch 만.
- Spec 동봉: `feature-voc.md §9.4.3` 재기술 (가칭 → 확정), `routing-conventions.md` 라우트 행 추가, `external-masters.md` 와 충돌 검토.
- 테스트: BE 5 + FE 5 + MSW + parity.

**Scope (out)**:
- 색상 자유 입력 (HEX picker) — 토큰 swatch only 로 시작, 자유 입력 NextGen.
- `voc_types` 병합 (merge) — 별 phase, 사용처 발생 후 결정.

**Done when**:
- [ ] `/admin/voc-types` 라우트 + 사이드바 entry.
- [ ] CRUD + archive + 색상 swatch 4 색 선택 동작.
- [ ] 아카이브 시 신규 VOC 등록 모달의 voc-type select 에서 제외.
- [ ] Spec 동기화 동봉.
- [ ] 테스트 green / parity green.

**Constraints**:
- archive 시 기존 데이터 유지 (`voc_types.archived_at IS NOT NULL` soft archive) — `requirements.md` 와 정합.
- 색상 토큰: `uidesign.md` 의 categorical-color set 만 (4–6 색).

---

## Phase C — 시스템/메뉴 관리 (P2, medium)

**Goal**: `/admin/systems` 에서 `systems` + `menus` 2 단 master + cascade UX. "기타" 메뉴 자동 생성, archive cascade.

**Scope (in)**:
- BE: `admin-systems.ts` + `admin-menus.ts` 신설. OpenAPI `shared/openapi.yaml:1319–1463` 재사용. 시스템 추가 시 "기타" 메뉴 transactional auto-create.
- FE: `features/admin/system-master/` slice, master cascade (`/admin/masters` 의 read-only 패턴 참고).
- Spec 동봉: `feature-voc.md §9.4.2` 정합, `routing-conventions.md` `/admin/external-masters` ↔ `/admin/masters` 명칭 불일치 (backlog §2 부수 drift) 동시 정리.
- 테스트: cascade ("기타" 자동 생성 / archive cascade / VOC 수 cascade) 회귀 5 건 의무.

**Scope (out)**:
- 메뉴 단독 페이지 (`/admin/menus`) — `GET /api/masters/menus?system_id=` cascade 응답 재사용으로 흡수, 별 페이지 없음.

**Done when**:
- [ ] 시스템 추가 → "기타" 메뉴 자동 생성 알림 표시 → DB 에서 row 2건 (system + 기본 menu) 검증.
- [ ] 아카이브 시 신규 VOC 등록 cascade 에서 제외, 기존 VOC 행 그대로.
- [ ] `routing-conventions.md` 명칭 drift 동시 정리.
- [ ] 회귀 5 건 + parity.

**Constraints**:
- "기타" 메뉴 slug 규약: `etc` (`feature-voc.md §9.4.2` 명시 — 본 phase 에서 잠금).
- archive cascade: 시스템 archive → 그 시스템의 메뉴 전부 archive (transactional). VOC row 영향 없음.

**Risks**:
- 동시성: 시스템-시스템 동시 archive 가 cascade 중복 — `SELECT FOR UPDATE` on system row.
- "기타" 메뉴 unique 보장: `(system_id, slug)` 의 partial unique index 필요 시 마이그 추가.

---

## Phase D — 결과 검토 sub-wave (P3 / NextGen)

**Status**: **Sub-wave 격상 필수.** 본 wave plan 에서는 *진입 조건* 만 정의.

**진입 조건 (모두 충족 시 sub-wave 시작)**:
1. `structured_payload` 검증 게이트 정책 ADR (담당자 동시 승인 동시성 + 임베딩 파이프라인 트리거 조건).
2. `Idempotency-Key` 헤더 정책 ADR (POST /api/admin/result-review/:id/approve 멱등성).
3. `SELECT FOR UPDATE` row lock 전략 결정 (Postgres advisory lock vs row lock) + 회귀 테스트 부하 시나리오.
4. `review_status` enum 확장 / 트리거 검토 (`unverified` → `approved` / `rejected` 전이 audit log).

**진입 조건 미충족 시**: backlog NextGen 큐 유지. 본 wave 의 Phase A–C 머지 후 별 진입.

---

## 3. Cross-cutting

**Contracts-first 검증**:
- Phase A–C 모두 OpenAPI 가 선행. 각 Phase 시작 시 `npm run openapi:generate -w shared` 실행 → `shared/types/api.ts` drift 0 확인 → BE / FE 양쪽 동시 import.

**Fixture / seed parity 확장**:
- `scripts/check-fixture-seed-parity.ts` 가 현재 `vocs` 만 검증 (`.planning/codebase/CONCERNS.md` 가 flagged). Phase A 부터 `tag_rules` / `voc_types` / `systems` / `menus` 추가 — 매 phase 마다 parity 케이스 같이 추가.

**Spec drift 동시 정리** (OQ-2 결정):
- `routing-conventions.md` 라우트 행 제거 / 추가 / 명칭 통일.
- `feature-voc.md §9.4.1 / §9.4.2 / §9.4.3` 페이지 별 재기술.

**Visual surface gate**:
- 모든 phase 가 `uidesign.md` 토큰만 사용. 토큰 정의 변경 없음 → ADR-0008 시각 정합화 wave gate 발동 없음. 토큰 변경이 필요하면 별 PR 로 선행.

**Test gate** (per CLAUDE.md §3):
- 권한 / 동시성 / 마이그 = irreversible → TDD (test first, fail confirm, implement).
- 단순 UI / CRUD = smoke test + happy-path + 시각 baseline.

**Pre-merge checklist (per phase)**:
- [ ] `npm run lint -w frontend` once
- [ ] BE: `npm run typecheck -w backend && npm run test -w backend | tail -20`
- [ ] FE: `npm run typecheck -w frontend && npm run test -w frontend -- --run | tail -20`
- [ ] OpenAPI codegen drift 0
- [ ] fixture-seed parity green
- [ ] Spec 동기화 동일 PR 확인

---

## 4. PR 구조 권장

| Phase | PR 수 | 분할 기준 |
| --- | --- | --- |
| A 태그 규칙 | 1 | spec + BE 4 핸들러 + FE Dialog + 토글 atomic. |
| B 유형 | 1 | slice 단위. |
| C 시스템/메뉴 | 2 | (1) `systems` + "기타" auto-create + cascade  (2) `menus` cascade UX. |
| D 결과 검토 | sub-wave 별도 plan | — |

---

## 5. Open Questions (remaining)

- **OQ-3** (Phase C): "기타" 메뉴 slug `etc` 가 i18n 됐을 때 (영문 환경) 표기 — `(default)` 정책 통일?
- **OQ-4** (Phase B): 색상 토큰 set 의 정확한 4–6 개 swatch — `uidesign.md` 추가 항목 필요한지.
- ~~**OQ-5** (Phase A): `tag_rules.created_by` audit 컬럼~~ → **결정 (2026-05-10)**: `created_by` 만 Phase A 동봉 (마이그 024). `updated_by` / `last_modified_by` 는 본 phase 제외, 편집 audit 요구 시 별 phase.

각 OQ 는 해당 Phase 진입 직전 사용자 결정.

---

## 6. Cross-ref

- 백로그 / 배경: `admin-pages-backlog.md`
- 라우팅 정본: `routing-conventions.md`
- 도메인 spec: `feature-voc.md §9.4.1 ~ §9.4.7`
- 권한 / trash ADR: `0004` / `0005`
- Flowline 정합화 게이트: `0008`
- 진행 상태: `claude-progress.txt` 첫 30 줄
