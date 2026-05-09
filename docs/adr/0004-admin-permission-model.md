# 0004 — Admin 페이지 4 화면 권한 모델

## Status

Accepted (2026-05-09 사용자 grill 결정 — OQ-1 / OQ-2 close).

## Context

Wave 3 은 관리자 페이지 4 화면(Tag Master / Trash / External Masters / Users) 의 vertical slice 를 다룬다. 현 spec 은 화면별 권한이 단편적으로 분산되어 있고, 일부 spec 사이에 불일치가 있다.

- **§2.3 (요구사항 4 종 룰)**: "시스템/메뉴/유형/태그규칙/사용자 role 관리: Admin 전용." Soft Delete 도 Admin 전용.
- **§15.3 (Tag Master)**: "Admin (병합/외부 잠금/규칙 일시중지). Manager 읽기 전용."
- **`feature-voc.md §9.4.6` (Tag Master 본문)**: "Admin/Manager (시스템/메뉴/유형 관리와 동일 정책)." — §15.3 과 충돌.
- **§15.4 (Trash)**: "Admin (복원/즉시 영구삭제). Manager 읽기 전용." (`feature-voc.md §9.4.7` 일치)
- **§16.3 (External Masters Refresh)**: "Refresh 권한 = Manager 이상." 화면 진입 권한은 미명시.
- **§15.2 (Users)**: "Admin 이 사용자 관리 화면에서 role 변경 / `is_active` 토글." (§2.3 일관)

`uidesign.md §14.3 (Role Pill)` + `Sidebar Navigation Items` 가 사이드바 admin 그룹의 role guard precedent 를 정의. role 4 종은 `admin / manager / dev / user` (D18, 2026-04-26).

본 ADR 은 4 화면별 mutate / read 권한을 잠그고, 모든 BE 라우트 가드 / FE sidebar 가드의 정본을 제공한다.

## Decision

**잠금 (사용자 grill 2026-05-09 확정):**

| 화면 | Mutate 권한 | Read 권한 | Sidebar 항목 노출 |
| --- | --- | --- | --- |
| **Tag Master** | **Manager+ add/edit** + **Admin only merge / 외부잠금 / 영구삭제** (OQ-1 Option D) | Admin / Manager / Dev | Admin / Manager / Dev |
| **Trash** | Admin only — 복원 (영구삭제는 disabled) | Admin only (Manager 미노출) | Admin only |
| **External Masters** | Manager+ — refresh 트리거 | **Manager+ + Dev** read (OQ-2 Option B) | Manager+ + Dev |
| **Users** | Admin only — role 변경 / is_active 토글 | Admin only | Admin only |

추가 룰:

1. **Tag Master 권한 분리 (Option D 핵심)** — `add`(POST) / `edit`(PATCH name) 는 Manager+ 허용 (일상 트리아지 운영). `merge` (POST `/:id/merge`) / `외부잠금` (`tags.is_external` 토글) / `영구삭제` (DELETE — 사용 VOC 수=0 + 규칙 참조 0 일 때만) 는 Admin only — irreversible 액션 보호 (`CLAUDE.md §Reversibility gate`).
2. **이중 방어 의무** — FE sidebar 그룹은 화면별 role guard 에서만 렌더 (component tree level 가드, not `display: none`). BE 는 모든 admin 라우트에 `requireRole([...])` 미들웨어 적용. 단일 방어 금지.
3. **404 vs 403** — Trash 는 Manager 도 진입 자체 차단(404, "존재 자체 은닉" — `requirements.md §6.1` `voc_internal_notes` precedent). Tag Master 의 Admin-only 액션 (`merge`/`외부잠금`/`영구삭제`) 은 403 (Manager 인지 가능). Users / External Masters role 차단은 403.
4. **Last-admin guard** — Users Phase E 에서 마지막 admin → user 강등 시 BE `CONFLICT 409` 응답 (`requirements.md §6.1`). FE 는 토스트 + 행동 차단.
5. **Audit 의무** — 모든 mutate 는 audit row 기록. Tag Master add/edit/merge/외부잠금/영구삭제 = `voc_history` 또는 `tag_history` (별도 결정 시 후속 ADR), Trash 복원 = `voc_history` + `voc_restore_log` (마이그 015), Users role/is_active 변경 = `user_role_log` (마이그 017, OQ-3 Option A).

## Considered Options

**Option A**: 화면별 권한 차등 — Tag Master 전체 Admin only mutate.

- 장점: §2.3 룰 ("Admin 전용 mutate") 정합 + irreversible 액션 권한 좁힘.
- 단점: Manager 가 일상 태그 정리도 Admin 호출 의존 → 운영 마찰 큼.

**Option B**: §9.4.6 채택 — Tag Master 도 Admin/Manager 양쪽 mutate (모든 액션).

- 장점: Manager 가 트리아지 일상 운영자라 자연스러움.
- 단점: Tag merge 가 데이터 손실급 (source 행 제거 = irreversible) 인데 Manager 까지 권한 부여하는 건 reversibility gate 위반.

**Option C**: 모든 화면 Admin only.

- 장점: 단일 정책으로 단순.
- 단점: External Masters refresh 가 §16.3 명시적 "Manager 이상" 룰을 위반. Manager 의 트리아지 운영 차단.

**Option D (채택)**: Tag Master 권한 분리 — `add`/`edit` = Manager+, `merge`/`외부잠금`/`영구삭제` = Admin only. Trash/Users = Admin only mutate. External Masters = Manager+ mutate.

- 장점: 일상 운영(Manager add/edit) 과 irreversible 액션(Admin merge/외부잠금/영구삭제) 의 reversibility gate 분리 + §9.4.6 "Admin/Manager" 본문 절반 흡수 + §15.3 의 "Admin 만 병합/외부잠금/규칙 일시중지" 절반 흡수 (양쪽 spec 정합 동시 달성).
- 단점: Tag Master 단일 화면 내 액션별 권한 매트릭스 추가 → BE 가드 미들웨어 2 종 + 회귀 테스트 케이스 분기 (add/edit 200 vs merge/lock/delete 403 for Manager).

## Consequences

- **Manager 의 일상 운영**: voc 도메인 (assignee, status 전환, 태그 부착/해제, 외부 마스터 refresh) 그대로 + Tag Master `add`/`edit` 신규 권한. 마스터 데이터 irreversible 액션 (Tag merge/외부잠금/영구삭제, role 변경, soft delete 복원) 만 Admin 의존.
- **Dev 의 read 운영**: External Masters 화면 read + Tag Master read 가능 (본인 담당 VOC 가 외부 마스터·태그 의존하므로 status 모니터링 욕구 spec 으로 인정). Mutate 는 모두 차단.
- **`feature-voc.md §9.4.6` 동기화**: "Admin/Manager (동일 정책)" → "Manager+ add/edit / Admin only merge/외부잠금/영구삭제" 로 갱신.
- **`requirements.md §15.3` 동기화**: "Admin (병합/외부 잠금/규칙 일시중지). Manager 읽기 전용" → "Manager+ add/edit. Admin only merge/외부잠금/영구삭제. Dev read" 로 갱신.
- **BE 가드 단일 helper**: `requireRole(['admin'])` / `requireRole(['admin','manager'])` / `requireRole(['admin','manager','dev'])` 미들웨어 3 종 도입. Tag Master 라우트는 액션별 미들웨어 분리 (POST/PATCH = manager+, merge/DELETE/외부잠금 = admin).
- **사이드바 그룹 가드**: `uidesign.md §10 Sidebar Spacing` precedent 에 admin 4 화면 sidebar 매트릭스 추가 (User = 그룹 미노출, Dev = External Masters + Tag Master read 만, Manager = External Masters + Tag Master + Result Review, Admin = 5 종 전부).
- **회귀 테스트 의무**: 4 화면 × 4 role × Tag Master 액션 분기 = 권한 매트릭스 BE Jest+Supertest 회귀 22 건 이상 (Tag Master add/edit/merge/lock/delete × Manager/Dev = 추가 분기).
- **Follow-up**: OIDC 실연동 시 role mapping 정책 + Result Review (§15.1) 화면 진입 시 동일 매트릭스 확장 — 본 ADR 이 baseline.

## Follow-ups

- [x] OQ-1 사용자 결정 (Option D) → ADR Status Accepted + `requirements.md §15.3` ↔ `feature-voc.md §9.4.6` 동기화 (PR-α docs/wave-3-oq-sync)
- [x] OQ-2 사용자 결정 (Option B, Manager+ + Dev read) → `external-masters.md` 갱신 (PR-α docs/wave-3-oq-sync)
- [x] `uidesign.md Sidebar Spacing` 에 admin 5 화면 sidebar role 매트릭스 추가 (PR-α docs/wave-3-oq-sync)
- [ ] BE 가드 helper 단일화 (`requireRole`) — Wave 3 Phase A 에 동봉
