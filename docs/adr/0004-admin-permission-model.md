# 0004 — Admin 페이지 4 화면 권한 모델

## Status

Proposed (Wave 3 진입 전 사용자 결정 필요 — `docs/specs/plans/wave-3-admin.md §7 OQ-1 / OQ-2`)

## Context

Wave 3 은 관리자 페이지 4 화면(Tag Master / Trash / External Masters / Users) 의 vertical slice 를 다룬다. 현 spec 은 화면별 권한이 단편적으로 분산되어 있고, 일부 spec 사이에 불일치가 있다.

- **§2.3 (요구사항 4 종 룰)**: "시스템/메뉴/유형/태그규칙/사용자 role 관리: Admin 전용." Soft Delete 도 Admin 전용.
- **§15.3 (Tag Master)**: "Admin (병합/외부 잠금/규칙 일시중지). Manager 읽기 전용."
- **`feature-voc.md §9.4.6` (Tag Master 본문)**: "Admin/Manager (시스템/메뉴/유형 관리와 동일 정책)." — §15.3 과 충돌.
- **§15.4 (Trash)**: "Admin (복원/즉시 영구삭제). Manager 읽기 전용." (`feature-voc.md §9.4.7` 일치)
- **§16.3 (External Masters Refresh)**: "Refresh 권한 = Manager 이상." 화면 진입 권한은 미명시.
- **§15.2 (Users)**: "Admin 이 사용자 관리 화면에서 role 변경 / `is_active` 토글." (§2.3 일관)

`uidesign.md §14.3 (Role Pill)` + `§10.5.1` 가 사이드바 admin 그룹의 role guard precedent 를 정의. role 4 종은 `admin / manager / dev / user` (D18, 2026-04-26).

본 ADR 은 4 화면별 mutate / read 권한을 잠그고, Wave 3 의 모든 BE 라우트 가드 / FE sidebar 가드의 정본을 제공한다.

## Decision

**제안 (사용자 최종 결정 시점에 잠근다):**

| 화면 | Mutate 권한 | Read 권한 | Sidebar 항목 노출 |
| --- | --- | --- | --- |
| **Tag Master** | **Admin only** (OQ-1 Option A) — 추가/편집/삭제/병합 | Admin / Manager | Admin / Manager |
| **Trash** | Admin only — 복원 (영구삭제는 disabled) | Admin only (Manager 미노출) | Admin only |
| **External Masters** | Manager 이상 — refresh 트리거 | Manager 이상 (OQ-2 Option A) | Manager 이상 |
| **Users** | Admin only — role 변경 / is_active 토글 | Admin only | Admin only |

추가 룰:
1. **이중 방어 의무** — FE sidebar 그룹은 `role ∈ {admin, manager}` 에서만 렌더 (component tree level 가드, not `display: none`). BE 는 모든 admin 라우트에 `requireRole(['admin'])` 또는 `requireRole(['admin','manager'])` 미들웨어 적용. 단일 방어 금지.
2. **404 vs 403** — Trash 는 Manager 도 진입 자체 차단(404, "존재 자체 은닉" — `requirements.md §6.1` `voc_internal_notes` precedent). Tag Master / Users / External Masters 는 403 (사용자 인지 가능).
3. **Last-admin guard** — Users Phase E 에서 마지막 admin → user 강등 시 BE `CONFLICT 409` 응답 (`requirements.md §6.1`). FE 는 토스트 + 행동 차단.
4. **Audit 의무** — 모든 mutate 는 audit row 기록. Tag Master = `voc_history` 또는 신규 `tag_history` (OQ 별도), Trash 복원 = `voc_history` + `voc_restore_log` (마이그 015), Users = `user_role_log` (OQ-3 별도 결정).

## Considered Options

**Option A (채택 제안)**: 화면별 권한 차등 — Tag Master / Trash / Users = Admin only mutate, External Masters = Manager+ mutate.

- 장점: §2.3 룰 ("Admin 전용 mutate") 정합 + irreversible 액션 (merge, 영구삭제 placeholder, role 변경) 권한 좁힘으로 reversibility gate 정합 + Manager 는 일상 트리아지 (voc_tags 부착/해제, 외부 마스터 refresh) 권한 그대로 유지.
- 단점: §9.4.6 본문 + §15.3 사이의 spec 불일치를 §15.3 쪽으로 동기화하는 추가 PR 필요. Manager 가 일상 태그 정리 시 Admin 호출 의존.

**Option B**: §9.4.6 채택 — Tag Master 도 Admin/Manager 양쪽 mutate.

- 장점: Manager 가 트리아지 일상 운영자라 자연스러움. §9.4.6 본문 그대로 사용.
- 단점: Tag merge 가 데이터 손실급 (source 행 제거 = irreversible) 인데 Manager 까지 권한 부여하는 건 reversibility gate 위반. 실수 발생 시 복구 불가.

**Option C**: 모든 화면 Admin only.

- 장점: 단일 정책으로 단순.
- 단점: External Masters refresh 가 §16.3 명시적 "Manager 이상" 룰을 위반. Manager 의 트리아지 운영 차단.

## Consequences

- **Manager 의 일상 운영**: voc 도메인 (assignee, status 전환, 태그 부착/해제, 외부 마스터 refresh) 은 그대로. 마스터 데이터 mutate (Tag CRUD, role 변경, soft delete 복원) 만 Admin 의존.
- **`feature-voc.md §9.4.6` 동기화 필요**: "Admin/Manager" → "Admin (mutate) / Manager (read)" 로 갱신하는 spec PR 가 본 ADR Accepted 직후 선행.
- **BE 가드 단일 helper**: `requireRole(['admin'])` / `requireRole(['admin','manager'])` 미들웨어 2 종 도입. `assertCanManageVoc` (D21, voc 도메인 전용) 와는 별 함수.
- **사이드바 그룹 가드**: `uidesign.md §10.5.1` precedent 에 admin 4 화면 sidebar 매트릭스 추가 (User/Dev = 그룹 미노출, Manager = External Masters + Tag Master read 만, Admin = 4 종 전부).
- **회귀 테스트 의무**: 4 화면 × 4 role = 16 권한 매트릭스 + last-admin guard + Trash 404 vs 403 분리 = BE Jest+Supertest 회귀 18 건 이상.
- **Follow-up**: OIDC 실연동 시 role mapping 정책 + Result Review (§15.1) 화면 진입 시 동일 매트릭스 확장 — 본 ADR 이 baseline.

## Follow-ups

- [ ] OQ-1 사용자 결정 → ADR Status Accepted 전환 + `requirements.md §15.3` ↔ `feature-voc.md §9.4.6` 동기화 PR
- [ ] OQ-2 사용자 결정 → External Masters 화면 read 권한 spec 명시 (`external-masters.md` 갱신)
- [ ] `uidesign.md §10.5` 에 admin 4 화면 sidebar role 매트릭스 추가
- [ ] BE 가드 helper 단일화 (`requireRole`) — Wave 3 Phase A 에 동봉
