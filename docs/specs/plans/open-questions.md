# Open Questions

> Wave / Phase 진입 전 사용자 결정이 필요한 항목의 단일 누적 위치. 각 항목 결정 후 정본 spec 동기화 PR 선행.
> 본 파일은 plan-doc 트리(`docs/specs/plans/`) 내 위치 — `.omc/plans/open-questions.md` 가 아닌 정본 docs hygiene 룰 §3 SoT 정합.

---

## Wave 3 (Admin 4 화면) — 2026-05-09 closed

플랜 정본: [`wave-3-admin.md`](./wave-3-admin.md). 관련 ADR: `docs/adr/0004-admin-permission-model.md` (Accepted), `docs/adr/0005-trash-restore-policy.md` (Accepted). 5 건 모두 사용자 grill 2026-05-09 결정 → PR-α `docs/wave-3-oq-sync` 동기화.

- [x] **OQ-1: Tag Master mutate 권한** — **Resolved (Option D)**: `add`/`edit` = Manager+, `merge`/`외부잠금`/`영구삭제` = Admin only. ADR 0004 Accepted. Sync: `requirements.md §15.3` + `feature-voc.md §9.4.6` (PR-α).
- [x] **OQ-2: External Masters 화면 read 권한** — **Resolved (Option B)**: Manager+ + Dev read. Sync: `external-masters.md` §"Admin 페이지 read 권한" 단락 (PR-α).
- [x] **OQ-3: Users role/is_active 변경 audit log 위치** — **Resolved (Option A)**: `user_role_log` 별 테이블 신규. 컬럼 `id, user_id, changed_by(NOT NULL), old_role, new_role, old_active, new_active, reason, created_at` + idx `(user_id, created_at DESC)`. 마이그 017. Sync: `requirements.md §4` + `wave-3-admin.md §6.2` (PR-α).
- [x] **OQ-4: 마이그 번호 정합** — **Resolved**: 014 Tag Master / 015 Trash / 017 user_role_log (013/016 점유). Sync: `requirements.md §15.3 / §15.4` + `next-session-tasks.md §권한·스키마 인프라 PR 후보` + `wave-3-admin.md §2.1 / §5.1 / §6.2` (PR-α).
- [x] **OQ-5: 사이드바 `관리자` 그룹 항목 순서** — **Resolved (Option B)**: Result Review → Users → External Masters → Tag Master → Trash. Sync: `feature-voc.md §9.4` 머리글 + `uidesign.md Sidebar Spacing` 박스 (PR-α).

---

## 운영 룰

- 신규 OQ 발견 시 → 활성 wave 헤더 아래 항목 추가, 결정 후 체크박스 ✅ + 정본 spec 동기화 PR # 기록.
- Wave 종료 시 → 본 파일에서 해당 wave 헤더 + 항목 제거 (동기화 PR 머지로 spec 이 정본화되었으므로 누적 가치 없음). closed 표시는 다음 wave 머지 후 cleanup PR 에서 제거.
- ADR 결정 의존 항목은 ADR Status `Proposed → Accepted` 와 함께 닫는다.
