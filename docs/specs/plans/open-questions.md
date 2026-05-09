# Open Questions

> Wave / Phase 진입 전 사용자 결정이 필요한 항목의 단일 누적 위치. 각 항목 결정 후 정본 spec 동기화 PR 선행.
> 본 파일은 plan-doc 트리(`docs/specs/plans/`) 내 위치 — `.omc/plans/open-questions.md` 가 아닌 정본 docs hygiene 룰 §3 SoT 정합.

---

## Wave 3 (Admin 4 화면) — 2026-05-09

플랜 정본: [`wave-3-admin.md`](./wave-3-admin.md). 관련 ADR: `docs/adr/0004-admin-permission-model.md` (Proposed), `docs/adr/0005-trash-restore-policy.md` (Proposed).

- [ ] **OQ-1: Tag Master mutate 권한 (Admin only vs Admin/Manager)** — `requirements.md:540` (Admin only) ↔ `feature-voc.md:657` (Admin/Manager) spec 충돌. 권장: Option A (Admin only mutate). 결정 후 한쪽 spec 동기화 PR 필수. — ADR 0004 Accepted 진입 차단.
- [ ] **OQ-2: External Masters 화면 read 권한 (Manager+ only vs Dev 보기 허용)** — `external-masters.md` 미명시. 권장: Option A (Manager+ 만). 결정 후 `external-masters.md` 한 줄 추가 — Wave 3 Phase D 진입 차단.
- [ ] **OQ-3: Users role/is_active 변경 audit log 위치 (`user_role_log` 신규 테이블 vs `voc_history` 확장)** — `requirements.md §15.2` 미명시. 권장: Option A (`user_role_log` 별 테이블). 결정 후 `requirements.md §4` 갱신 + Wave 3 §6.2 task 표 W3-1.5 추가 — ADR 0005 audit 정합 차단.
- [ ] **OQ-4: 마이그 번호 정합 (013/015 vs `next-session-tasks.md` 8-PR2/8-PR3 = 014/015)** — `next-session-tasks.md:71-73` ↔ `requirements.md:541, 549` 표기 충돌. 권장: spec(013/015) 우선. 결정 후 `next-session-tasks.md §권한·스키마 인프라 PR 후보` 동기화 — Wave 3 Phase A 진입 차단.
- [ ] **OQ-5: 사이드바 `관리자` 그룹 항목 순서** — spec 미명시 (Tag Master = 그룹 하단 / Trash = 최하단 만). 권장: Result Review → Users → Tag Master → External Masters → Trash. 결정 후 `feature-voc.md §9.4` 또는 `uidesign.md §10.5` 박스 추가 — Wave 3 Phase B 진입 차단.

---

## 운영 룰

- 신규 OQ 발견 시 → 활성 wave 헤더 아래 항목 추가, 결정 후 체크박스 ✅ + 정본 spec 동기화 PR # 기록.
- Wave 종료 시 → 본 파일에서 해당 wave 헤더 + 항목 제거 (동기화 PR 머지로 spec 이 정본화되었으므로 누적 가치 없음).
- ADR 결정 의존 항목은 ADR Status `Proposed → Accepted` 와 함께 닫는다.
