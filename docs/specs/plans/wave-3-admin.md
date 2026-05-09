# Wave 3 — Admin 4 화면 Plan

> 목적: 관리자 페이지 4 화면 (Tag Master / Trash / External Masters / Users) 의 vertical slice 를 spec 정본에 맞춰 구현·검증한다.
> 인덱스 규칙: `docs/specs/README.md §7`. Wave 계보: `wave-index.md`. Follow-up bucket: `followup-bucket.md`.
> 정본 product spec: `requires/requirements.md §15` + `requires/feature-voc.md §9.4.6 / §9.4.7` + `requires/external-masters.md` + `requires/uidesign.md §14.3 (Role Pill) / §10.5 (Sidebar admin group)`.

## 0. 진입 게이트

- **Hard-block**: Wave 2 (Dashboard) 머지 완료 후에만 진입. 현재 `next-session-tasks.md` §"활성 작업"은 Wave 2 hard-block 명시.
- **사용자 승인**: 본 plan 의 §3 결정·§5 ADR 결정·§6 Phase 게이트가 모두 사용자 승인된 후 Phase A 진입.
- **ADR 결정 의존**: [`docs/adr/0004-admin-permission-model.md`](../../adr/0004-admin-permission-model.md) (Accepted 2026-05-09) + [`docs/adr/0005-trash-restore-policy.md`](../../adr/0005-trash-restore-policy.md) (Accepted 2026-05-09). Phase B/C 진입 unblock.

## 1. 배경

- Wave 0~1.7 은 `/voc` 단일 화면 + 셸 정합화에 집중. 관리자 페이지는 **사이드바 그룹만 자리 확보** 상태.
- §15.1 Result Review 는 별개 트랙(`feature-voc.md §9.4 관리자 페이지`) 으로 다뤄지며 본 Wave 범위 외. 본 Wave 는 §15.2~§15.4 + 외부 마스터 운영 화면(§16.3) 4 종에 집중.
- 운영 차단 해소 항목으로 spec 이 예약한 마이그레이션 3 종(`tags.is_external` / `tag_rules.suspended_until` / `vocs.deleted_by` / `voc_restore_log` / `user_role_log`) 은 본 Wave 진입 전 / 진입 시 별도 PR 로 선행한다. `tags.merged_into_id` 는 Resolution α (2026-05-09) 로 보류 — 병합은 source-row hard-delete 정책 그대로 (`feature-voc.md §9.4.6` · ADR 0004).

## 2. 범위

### 2.1 In-scope (4 화면 vertical slice)

| 화면                 | 진입 동선                              | 권한 (spec 인용)                                                                                      | FE 라우트        | BE 라우트 (신규)                                                                        | 마이그                                                                                        |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Tag Master**       | 사이드바 `관리자` 그룹 → "태그 마스터" | Manager+ add/edit · Admin only merge/외부잠금/영구삭제 (ADR 0004 Option D) · Read = Admin/Manager/Dev | `/admin/tags`    | `GET /api/admin/tags` · `POST` · `PATCH /:id` · `DELETE /:id` · `POST /:id/merge`       | 014 (`tags.is_external` / `tag_rules.suspended_until`) — `merged_into_id` 보류 (Resolution α) |
| **Trash**            | 사이드바 `관리자` 그룹 → "휴지통"      | Admin only (`§15.4` + `feature-voc.md §9.4.7`)                                                        | `/admin/trash`   | `GET /api/admin/vocs/trash` · `PATCH /api/vocs/:id/restore`                             | 015 (`vocs.deleted_by` / `voc_restore_log`)                                                   |
| **External Masters** | 사이드바 `관리자` 그룹 → "외부 마스터" | Manager+ refresh · Read = Manager+ + Dev (ADR 0004 OQ-2 Option B)                                     | `/admin/masters` | `POST /api/admin/masters/refresh` (기존 §16.3) + `GET /api/admin/masters/status` (신규) | 없음 (메모리 캐시 + JSON 파일)                                                                |
| **Users**            | 사이드바 `관리자` 그룹 → "사용자"      | Admin only (§15.2 D14, §2.3). Audit = `user_role_log` (마이그 017, OQ-3 Option A)                     | `/admin/users`   | `GET /api/admin/users` · `PATCH /api/admin/users/:id` (role, is_active)                 | 017 (`user_role_log` 별 테이블) — 012 (`users.role` enum) 별 트랙 선행                        |

### 2.2 Out-of-scope (이 Wave 에서 다루지 않음)

- Result Review (§15.1) — 별 트랙. 본 Wave 진입 시 사이드바 메뉴에서 placeholder 만 노출, 라우트는 next wave.
- 사용자 초대 버튼 (§15.2 끝) — MVP 비활성화 명시. 자리만 확보.
- 영구삭제 (§9.4.7 끝) — D7 무기한 보존 정책상 disabled, NextGen 활성화 자리만 확보.
- 공지/FAQ 관리 (Wave 4) — `?mode=admin` 인라인 진입 (D19). 본 Wave 와 메뉴 그룹은 같으나 화면은 별 Wave.
- 알림 / 셸 마감 / 시각 회귀 12 화면 (Wave 5) — close gate.

### 2.3 Touch budget (변경 / 비변경)

- **변경**: `frontend/src/features/admin/**` (신규), `frontend/src/pages/admin/**` (신규), `frontend/src/app/router.tsx` (라우트 추가), `backend/src/routes/admin/**` (신규), `backend/src/services/admin/**` (신규), `shared/contracts/admin/**` (신규), `shared/fixtures/admin-*.json` (신규), `backend/migrations/014_*.sql` / `015_*.sql` / `017_*.sql` (신규), `docs/specs/requires/feature-voc.md §9.4.6 / §9.4.7` (필요 시 spec sync), `docs/specs/requires/external-masters.md` (운영 화면 필드 보강).
- **비변경**: `frontend/src/features/voc/**` 본문, VOC 도메인 라우트, 대시보드 코드, 토큰 정의부 (Phase B addendum 외). uidesign.md §14.3 Role Pill 토큰 그대로 재사용 (이미 §10 에 등록).

## 3. 결정 (잠금 — 사용자 최종 승인 시점에 잠긴다)

| ID    | 항목             | 결정 (제안)                                                                                                                                                                                                           | 근거                                                          |
| ----- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| W3-D1 | 권한 모델        | ADR 0004 Accepted — Option D: Tag Master `add`/`edit` = Manager+ / `merge`/`외부잠금`/`영구삭제` = Admin only · Trash = Admin only · External Masters refresh = Manager+ / read = Manager+ + Dev · Users = Admin only | `requirements.md §2.3` + `§15.x` + `§16.3` + ADR 0004         |
| W3-D2 | Trash 복구 정책  | ADR 0005 Accepted — 무기한 보존 (D7) + Admin only 복원 + 영구삭제 disabled (NextGen) + `voc_restore_log` audit                                                                                                        | `§15.4` + `feature-voc.md §9.4.7` + ADR 0005                  |
| W3-D3 | Phase 분할       | Phase A = 마이그·contract spec / Phase B = Tag Master / Phase C = Trash / Phase D = External Masters / Phase E = Users / Phase F = 종합 검증                                                                          | 본 plan §6                                                    |
| W3-D4 | PR 단위          | 화면당 1 PR (FE+BE+contract+fixture 동봉). 마이그 PR 은 별도 (Phase A). 영구삭제 placeholder 만 자리 확보.                                                                                                            | D9 precedent (Wave 1.6)                                       |
| W3-D5 | TDD 의무 surface | 권한 매트릭스 (BE Jest+Supertest) + 마이그 (rollback) + Tag merge 트랜잭션 + Trash restore 의 `tag_rules` 재실행                                                                                                      | `CLAUDE.md §Engineering rules` "TDD for irreversible surface" |
| W3-D6 | role guard 진입  | sidebar group 자체를 화면별 허용 role 에서만 렌더 (Admin/Manager/Dev 매트릭스, `uidesign.md §10.5.1` precedent — 본 wave 신설). 라우트 진입 시 BE 403 이중 방어.                                                      | `requirements.md §6.1` 표준 에러 + `uidesign.md §14.3` 노트   |
| W3-D7 | 시각 검증        | 4 화면 visual-diff baseline 신규 추가 (`benchmark/admin/*.png` + `INDEX.md` row). 자손 SKIP 0.                                                                                                                        | `CLAUDE.md §Top-level directories` benchmark 룰               |
| W3-D8 | 자동화 정책      | Phase 진행 중 autopilot/ralph 사용 허용. 머지·완료 선언은 사용자 검수 후에만.                                                                                                                                         | Wave 1.6 D10 precedent                                        |

## 4. 원칙

1. **Spec 정본 우선** — `requirements.md §15` + `feature-voc.md §9.4.6/9.4.7` 가 충돌하면 사용자에게 보고 (§7 OQ). 임의 동기화 금지.
2. **마이그는 별 PR** — Phase A 에서 마이그 014 / 015 / 017 spec 확정 + 별 PR 머지 후 Phase B 시작.
3. **권한 이중 방어** — FE role guard (sidebar group + route boundary) + BE 403 (admin route guard middleware). 단일 방어 금지.
4. **Audit 우선** — Trash 복원 / Tag merge / User role 변경은 모두 `voc_history` 또는 `voc_restore_log` 또는 신규 `user_role_log` (OQ-3) 에 기록. side-effect 없는 mutate 금지.
5. **토큰 위반 0** — Role Pill 4 종은 `uidesign.md §14.3` 토큰 그대로. raw hex/OKLCH 도입 금지. 미정의 토큰 발견 시 별 PR 로 spec 갱신 후 진입 (Wave 1.6 Phase B addendum precedent).
6. **YAGNI** — 사용자 초대, 영구삭제, Result Review 는 placeholder 만 자리 확보. 코드·핸들러 작성 금지.

## 5. 의존성 / 차단 항목

### 5.1 진입 차단 (선행 필수)

- **Wave 2 (Dashboard) 머지** — `next-session-tasks.md` 명시. Phase 8 기조상 dashboard 가 widget contract 도입 → admin 화면이 같은 contract 패턴을 재사용.
- **마이그 012 (`users.role` enum 4 종)** — 별 트랙. `migration-012-draft.md` 정본. 본 Wave Phase E (Users) 진입 전 머지 필수.
- **마이그 014 (`tags.is_external` / `tag_rules.suspended_until`)** — 본 Wave Phase A 1 PR (W3-1, OQ-4 결정 2026-05-09). `merged_into_id` 자기참조 FK 는 Resolution α (2026-05-09) 로 보류; 병합은 source-row hard-delete 정책 (`feature-voc.md §9.4.6` · ADR 0004) 그대로.
- **마이그 015 (`vocs.deleted_by` / `voc_restore_log`)** — 본 Wave Phase A 1 PR (W3-2).
- **마이그 017 (`user_role_log` 별 테이블)** — 본 Wave Phase A 1 PR (W3-9, OQ-3 Option A). 016 은 별 트랙 점유.

### 5.2 외부 차단 (해소 불가 항목)

- 설비 마스터 MSSQL 스키마 TBD (`external-masters.md §3`) — Phase D 의 External Masters 화면은 stub 데이터로 vertical slice 가능. 실제 운영 swap 은 NextGen.
- OIDC 인증 (`oidcAuthMiddleware`) 미구현 — 본 Wave 는 `AUTH_MODE=mock` 전제로 role guard 만 검증. OIDC 실연동은 별 트랙.

### 5.3 후속 차단 (본 Wave 가 차단하는 것)

- Wave 4 (공지/FAQ + Notice popup) — 사이드바 그룹 + role guard 패턴 본 Wave 가 정의 → Wave 4 가 재사용. 본 Wave 머지 전 Wave 4 의 sidebar 구조 결정 금지.
- Wave 5 시각 회귀 12 화면 — 본 Wave 4 화면이 baseline 4 개 추가 → 12 화면 합산 산식 갱신.

## 6. Phase 흐름

```
Phase A: 마이그 + contract spec (코드 0줄 + SQL 3 PR + contract 1 PR · full parallel)
  ├─ 014_tag_master_ops.sql (tags.is_external / tag_rules.suspended_until — `merged_into_id` 보류, Resolution α)
  ├─ 015_trash_audit.sql (vocs.deleted_by / voc_restore_log)
  ├─ 017_user_role_log.sql (user_role_log 별 테이블 — OQ-3 Option A)
  ├─ shared/contracts/admin/{tag,trash,master,user}.ts (zod) + openapi.yaml
  └─ 사용자 승인 게이트 ──┐
                          ▼
Phase B: Tag Master 화면 (1 PR)
  ├─ TDD: BE 권한 매트릭스 + merge 트랜잭션 회귀 4 건 (§9.4.6)
  ├─ FE: 표 + 추가/편집/병합 모달
  ├─ visual-diff baseline 1 건 + INDEX.md row
  └─ 사용자 검수 ──┐
                  ▼
Phase C: Trash 화면 (1 PR)
  ├─ TDD: 회귀 3 건 (Manager 403 / 복원 후 일반 목록 노출 / 복원 시 tag_rules 재실행)
  ├─ FE: 표 + 복원 다이얼로그 + 영구삭제 disabled placeholder
  ├─ visual-diff baseline 1 건
  └─ 사용자 검수 ──┐
                  ▼
Phase D: External Masters 화면 (1 PR)
  ├─ TDD: refresh 쿨다운 5 분 + atomic swap 실패 시 kept_loaded_at 보존
  ├─ FE: 마스터 3 종 status 표 + refresh 버튼 + 스냅샷/콜드스타트 배지 (§16.3)
  ├─ visual-diff baseline 1 건
  └─ 사용자 검수 ──┐
                  ▼
Phase E: Users 화면 (1 PR)
  ├─ TDD: role 변경 권한 (Admin only) + last-admin 강등 차단 (CONFLICT 409, §6.1) + role 변경 audit
  ├─ FE: 표 + role pill (§14.3) + role 변경 inline + is_active 토글 + "사용자 초대" 버튼 disabled
  ├─ visual-diff baseline 1 건
  └─ 사용자 검수 ──┐
                  ▼
Phase F: 종합 검증
  ├─ 4 화면 visual-diff (자손 포함) SKIP 0
  ├─ 권한 매트릭스 BE 통합 테스트 그린 (§13.x 권한 시나리오 100%)
  ├─ FE/BE typecheck + lint + test 모두 그린
  ├─ 토큰 lint (raw hex/OKLCH 0 hits)
  ├─ claude-progress.txt + next-session-tasks.md + wave-index.md 갱신
  └─ 사용자 최종 승인 → Wave 3 완료
```

### 6.1 Phase 게이트 룰

- 직전 Phase 마지막 PR 머지 + 사용자 검수 통과 시 다음 Phase 진입.
- Phase 내부에서 발견된 sub-task 는 본 Wave 의 다음 정수 task ID (R2) 로 흡수. 닫힌 wave 가 아니므로 `FU-NNN` bucket 진입 X.
- Phase B/C/D/E 는 서로 독립이므로 사용자 승인 시 병렬 슬롯 가능. ~~단 Phase A 머지 전 진입 금지 (마이그·contract 의존).~~ → **2026-05-09 Phase A 머지 완료**, Phase B+C 병렬 진입 가능.

### 6.2 Task ID 부여 (R1·R2·R3)

| ID   | Phase | 작업 (한 줄)                                                                                                                                                                             | trigger / 비고                   |
| ---- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| W3-1 | A     | ✅ 마이그 014 (`tags.is_external` / `tag_rules.suspended_until`) + rollback — PR #251 `7a46d6a` (2026-05-09). `merged_into_id` 는 Resolution α 로 보류 → FU-012.                         | spec §15.3 / §9.4.6 (OQ-4)       |
| W3-2 | A     | ✅ 마이그 015 (`trash audit` 컬럼 1 + 테이블 1) + rollback + codex P2 FK deletion 테스트 — PR #253 `f9ed85f` (2026-05-09).                                                               | spec §15.4 / §9.4.7              |
| W3-3 | A     | ✅ shared/contracts/admin/{tag,trash,master,user}.ts (zod) + openapi.yaml 갱신 — PR #252 `7907b1e` (2026-05-09) + PR #254 `93ed028` (codex P1 hotfix: AdminUserPatch anyOf + Trash 404). | spec §6.1                        |
| W3-4 | B     | Tag Master FE+BE+fixture+E2E (1 PR)                                                                                                                                                      | spec §9.4.6 (Option D 액션 분기) |
| W3-5 | C     | Trash FE+BE+fixture+E2E (1 PR)                                                                                                                                                           | spec §9.4.7                      |
| W3-6 | D     | External Masters FE+BE+fixture+E2E (1 PR)                                                                                                                                                | spec §16.3 (Manager+ + Dev read) |
| W3-7 | E     | Users FE+BE+fixture+E2E (1 PR — `user_role_log` 의존)                                                                                                                                    | spec §15.2                       |
| W3-8 | F     | 종합 검증 + progress 갱신 (1 PR)                                                                                                                                                         | gate close                       |
| W3-9 | A     | ✅ 마이그 017 (`user_role_log` 별 테이블) + rollback — PR #250 `55548a6` (2026-05-09). FU-010 (CHECK constraint) deferral.                                                               | OQ-3 Option A                    |

> **R5 준수**: 묶음 PR 금지. W3-1 / W3-2 / W3-3 모두 별 PR. W3-4~W3-7 도 화면당 별 PR.
> **R3 준수**: Phase A/B/C/D/E/F 는 grouping 메타데이터일 뿐 ID 에 부착 금지.

## 7. Open Questions — closed (2026-05-09 grill)

> 5 건 모두 사용자 결정 + spec 동기화 (PR-α `docs/wave-3-oq-sync`) 완료. 본 절은 결정 요약만 남기고 옵션 분석 본문은 [`open-questions.md`](./open-questions.md) 와 ADR 0004 / 0005 에 흡수.

| OQ                              | 결정                                                                         | spec sync                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| OQ-1 Tag Master mutate          | **Option D** — Manager+ add/edit · Admin only merge/외부잠금/영구삭제        | `requirements.md §15.3` + `feature-voc.md §9.4.6` + ADR 0004                           |
| OQ-2 External Masters read      | **Option B** — Manager+ + Dev                                                | `external-masters.md`                                                                  |
| OQ-3 Users role/is_active audit | **Option A** — `user_role_log` 별 테이블 (마이그 017)                        | `requirements.md §4` + 본 plan §6.2 W3-9                                               |
| OQ-4 마이그 번호                | 014 Tag Master / 015 Trash / 017 user_role_log (013/016 점유)                | `requirements.md §15.3 / §15.4` + `next-session-tasks.md` + 본 plan §2.1 / §5.1 / §6.2 |
| OQ-5 사이드바 순서              | **Option B** — Result Review → Users → External Masters → Tag Master → Trash | `feature-voc.md §9.4` + `uidesign.md Sidebar Spacing`                                  |

<details>
<summary>(아카이브) 결정 전 옵션 분석</summary>

### OQ-1 — Tag Master 권한: Admin only vs Admin/Manager

- **불일치 위치**:
  - `requirements.md:540` — "Admin (병합/외부 잠금/규칙 일시중지). Manager 읽기 전용."
  - `feature-voc.md:657` — "Admin/Manager (시스템/메뉴/유형 관리와 동일 정책)."
- **Option A (Admin only mutate)**: §15.3 채택. Manager 는 `GET /api/admin/tags` 만 200, `POST/PATCH/DELETE/merge` 는 403. 운영상 Tag 병합·외부 잠금이 데이터 손실급(merge irreversible) 이라 Admin 권한 좁히는 게 안전.
- **Option B (Admin/Manager 양쪽 mutate)**: §9.4.6 채택. Manager 가 트리아지 운영자라 일상 태그 정리도 Manager 권한이 자연. §2.3 "시스템/메뉴/유형/태그규칙 관리: Admin 전용" 과 "tag CRUD" 의 경계가 불분명.
- **권장**: **Option A**. Tag 병합·삭제는 reversibility gate 상 irreversible (merge 시 source 행 제거) → 권한 좁힘이 `CLAUDE.md §Reversibility gate` 정합. Manager 일상 정리는 `voc_tags` 부착/해제 (이미 Manager 권한) 로 충분.
- **결정 후**: ADR 0004 Status `Proposed → Accepted` + `requirements.md §15.3` / `feature-voc.md §9.4.6` 중 한쪽 동기화 PR.

### OQ-2 — External Masters 화면 읽기 권한 (Manager 만? 또는 Admin/Manager 양쪽 + Dev 보기 전용?)

- **spec 미명시**: §16.3 "Refresh 권한 = Manager 이상" 만 있고 화면 진입 자체 권한은 없음.
- **Option A (Manager+ 만 진입)**: refresh 권한과 일치. User/Dev 는 사이드바 항목 자체 미노출.
- **Option B (Admin/Manager mutate, Dev 읽기 전용)**: Dev 는 본인 담당 VOC 가 외부 마스터 의존하므로 status 모니터링 욕구 있음. 단 §15 admin 페이지 기조는 "관리자/매니저 영역" 이라 Dev 노출은 spec 결정 필요.
- **권장**: **Option A**. §15 일관성 + Dev 가 status 필요하면 편집 화면 🔄 아이콘 (§16.3 두 번째 진입점) 이 이미 존재.
- **결정 후**: `external-masters.md` 에 "관리자 페이지 진입 권한: Manager+" 한 줄 추가.

### OQ-3 — Users role 변경 / is_active 토글 audit log: 신규 `user_role_log` 테이블 vs 기존 `voc_history` 외 별도 솔루션

- **spec 미명시**: §15.2 는 "Admin 이 role 변경" 만 명시. audit row 위치 미정.
- **Option A (`user_role_log` 신규 테이블)**: 컬럼 `id / user_id / changed_by / before_role / after_role / before_is_active / after_is_active / created_at`. PIPA 7 년 보존 원칙 (§15.1.1 precedent) 적용.
- **Option B (`voc_history` 확장)**: 기존 audit 트리거에 `target_type='user'` 컬럼 추가. 운영 부담 줄지만 voc 도메인에 user 이벤트 끼이는 의미 충돌.
- **권장**: **Option A**. user mutation 은 voc 와 직교 도메인 → 별 테이블이 의미 단위 명확. 마이그 016 별 PR 후속 또는 본 Wave Phase A 에 포함 결정 필요.
- **결정 후**: `requirements.md §4` 에 `user_role_log` 테이블 행 추가 + 본 Wave §6.2 task 표에 W3-1.5 추가.

### OQ-4 — 마이그 번호 정합성

- **불일치 위치**:
  - `next-session-tasks.md:71-73` — "8-PR2 = migration **014** (`tags.is_external` / `tag_rules.suspended_until`)" + "8-PR3 = migration **015** (`vocs.deleted_by` / `voc_restore_log`)"
  - `requirements.md:541` — "Phase 8 마이그 **013** 예정" (Tag Master 운영 갭)
  - `requirements.md:549` — "Phase 8 마이그 **014** 예정" (Trash 운영 갭)
- 본 plan 은 spec 정본 (§15.3 = 013, §15.4 = 015) 을 따랐으나, `next-session-tasks.md` 는 014/015 로 표기. 마이그 번호는 append-only 라 충돌 시 spec 또는 plan doc 한쪽 동기화 필수.
- **권장**: spec(`requirements.md`) 우선. `next-session-tasks.md` 의 8-PR2/8-PR3 라벨을 013/015 로 갱신.
- **결정 후**: `next-session-tasks.md §권한·스키마 인프라 PR 후보` 동기화 PR. (현재 상태 그대로 두면 본 Wave 진입 시 마이그 번호 충돌 — 014 는 `notices.visible_from/to timestamptz` 로 8-M2 가 선점.)

### OQ-5 — 사이드바 `관리자` 그룹 항목 순서

- spec 단편 정보:
  - `requirements.md §15.3` — "사이드바 `관리자` 그룹 **하단**" (Tag Master)
  - `requirements.md §15.4` — "사이드바 `관리자` 그룹 **최하단**" (Trash)
- 4 화면 + Result Review placeholder 5 종 순서 미정.
- **권장**: **Result Review → Users → Tag Master → External Masters → Trash** (운영 빈도 + Trash = 마지막 = 데이터 폐기성 정합). 단 spec 명시가 없으므로 사용자 결정 필요.
- **결정 후**: `feature-voc.md §9.4` 또는 `uidesign.md §10.5` 에 sidebar admin 그룹 순서 박스 추가.

> 위 OQ 5 건은 [`docs/specs/plans/open-questions.md`](./open-questions.md) (본 Wave 한정) 에 동기화. (.omc/plans/open-questions.md 가 아닌 docs/specs/plans/ 트리 내 파일 — 정본 위치는 docs hygiene 룰 §3 SoT).

</details>

## 8. 위험과 대응

| 위험                                               | 신호                                                                                                   | 대응                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| OQ 결정 미동기화 상태로 Phase B 진입               | Phase A 머지 시 `requirements.md §15.3` ↔ `feature-voc.md §9.4.6` 동기화 누락 또는 ADR Accepted 불일치 | Phase A 게이트에서 OQ-1~5 sync evidence 확인. 한 건이라도 불일치하면 Phase B 진입 차단   |
| 마이그 014 / 015 / 017 rollback 누락               | rollback SQL 미작성 또는 검증 없이 머지                                                                | TDD `down.sql` 작성 + 적용 후 컬럼 검증 통합 테스트 그린 후 머지                         |
| Tag merge 트랜잭션 실패 시 부분 적용               | `voc_tags` 재배선 중 `tag_rules.tag_id` 갱신 실패                                                      | 단일 트랜잭션 + savepoint 없는 atomic rollback. 회귀 테스트 4 건 (§9.4.6)                |
| Trash 복원 시 `tag_rules` 재실행이 idempotent 깨짐 | 재실행 후 `voc_tags` 중복 row                                                                          | `INSERT ... ON CONFLICT DO NOTHING` + 회귀 테스트 (§9.4.7 회귀 3 건)                     |
| Last-admin 강등으로 시스템 잠금                    | Users Phase E 에서 마지막 admin → user 강등 시 모든 admin 액션 불가                                    | BE 단일 helper `assertLastAdminGuard` 도입 + CONFLICT 409 응답 (§6.1 정합) + 회귀 테스트 |
| External Masters refresh 동시 요청 race            | Manager 둘이 동시 refresh → atomic swap 깨짐                                                           | DB advisory lock 또는 in-memory mutex (§16.3 atomic swap 정의 보강)                      |
| 사이드바 admin 그룹 시각 회귀 미커버               | 4 화면 baseline 만 있고 sidebar 자체 baseline 없음                                                     | Phase F 종합 검증 시 sidebar admin 그룹 시각 케이스 추가 (12 → 13 화면)                  |

## 9. 작업량 추정

| Phase | 추정     | 비고                                                          |
| ----- | -------- | ------------------------------------------------------------- |
| A     | 1 세션   | 마이그 3 PR + contract 1 PR. zod 스키마는 spec 가독성에 의존. |
| B     | 1.5 세션 | Tag Master + merge 트랜잭션 + visual-diff                     |
| C     | 1 세션   | Trash + 복원 회귀 3 건                                        |
| D     | 1 세션   | External Masters + 스냅샷/콜드스타트 배지                     |
| E     | 1.5 세션 | Users + last-admin guard + role pill 4 종 시각 검증           |
| F     | 0.5 세션 | 종합 검증 + progress 갱신                                     |
| 합    | 6.5 세션 | OQ 답변 시간 별도. 마이그 012 머지 별 트랙 가정.              |

## 10. Definition of Done

- 4 화면 모두 spec (§9.4.6 / §9.4.7 / §16.3 / §15.2) 의 회귀 테스트 항목 그린.
- 권한 매트릭스 BE 통합 테스트 그린 (§13.x 권한 시나리오 100%, `requirements.md §13`).
- FE typecheck + lint + test 그린, BE typecheck + test 그린 (per `.claude/CLAUDE.md` test batch).
- visual-diff 4 화면 baseline 추가 (`benchmark/admin/01-tag-master.png` ~ `04-users.png` + `INDEX.md` row 4 건). 자손 포함 SKIP 0.
- 토큰 lint 통과 (raw hex/OKLCH 0 hits, `var(--*)` 만 사용).
- `shared/openapi.yaml` 갱신 + `shared/contracts/admin/**` zod schema 단일 정본.
- `wave-index.md` Wave 3 row Status `대기 → ✅ PR #N` + `claude-progress.txt` 첫 30 줄 동기화 + `next-session-tasks.md` 활성 작업 표 갱신.
- ADR 0004 / 0005 Status `Proposed → Accepted` + Decision 본문 사용자 결정 반영.
- 사용자 최종 승인 → Wave 3 close.

## 11. 참조

- 정본 governance: `CLAUDE.md` (root) + `.claude/CLAUDE.md` + `docs/CLAUDE.md`
- Doc 정책: `docs/specs/README.md`
- 정본 product spec: `docs/specs/requires/requirements.md §15`, `feature-voc.md §9.4.6 / §9.4.7`, `external-masters.md`, `uidesign.md §14.3 / §10.5`
- ID 규칙: `docs/specs/README.md §7` (R1~R7) + `wave-index.md` + `followup-bucket.md`
- 직전 Wave precedent: `wave-1-6-voc-parity.md` (Phase 게이트 / batch / D9 PR 단위), `wave-1-7-voc-create-modal.md` (모달 spec 패턴)
- ADR: `docs/adr/0004-admin-permission-model.md`, `docs/adr/0005-trash-restore-policy.md`
- 본 Wave Open Questions: `docs/specs/plans/open-questions.md`
