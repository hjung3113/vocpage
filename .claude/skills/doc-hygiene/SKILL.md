---
name: doc-hygiene
description: vocpage 프로젝트 문서 관리 정책 (Documentation Hygiene). 신규 doc 생성·기존 doc 수정·세션 시작·phase close·"문서 정리" 요청 시 정본 룰을 따른다. 정본은 `docs/specs/README.md`, 본 파일은 thin pointer.
---

# Skill: Documentation Hygiene (vocpage)

> **정본**: `docs/specs/README.md`. 본 SKILL.md는 진입 포인터일 뿐 — 룰/SoT/Cleanup 절차의 단일 출처는 정본이다.

## When to invoke

다음 중 하나가 발생하면 자동으로 따라야 한다 (사용자가 명시 호출하지 않아도):

- 새 `.md` 파일을 만들기 직전
- 기존 SoT 파일 (CLAUDE.md / requires / plans / reviews) 을 수정할 때
- 세션 시작 시 (`docs/specs/README.md §5 1번` — 전체 doc 목록 인지)
- phase close / Wave close 시점
- 사용자가 "문서 정리"·"정리하자"·"hygiene" 류 요청 시
- 머지된 PR 직후, 그 PR이 `reviews/` 또는 `plans/`를 변경했을 때

## Quick rules (정본 미리보기)

1. **신규 doc 금지** — 사용자 명시 요청 시에만. 그 외엔 SoT 갱신.
2. **CLAUDE.md = governance 정본**, AGENTS.md = 진입 포인터 (룰 위임).
3. **One responsibility per doc** — 시각/동작 spec 혼합 금지. `uidesign.md`에 동작 ✗, `requirements.md`에 시각 ✗. `uidesign.md`는 English.
4. **활성 vs archive** — 머지된 리뷰 → `reviews/done/`, 완료 plan → `plans/done/`. **archive는 정본 인용 금지** (참조용일 뿐).
5. **루트 doc 금지** — 모든 design/review/plan은 `docs/specs/` 하위.
6. **SoT 우선순위** — `docs/specs/README.md §3` 12행 표. CLAUDE → AGENTS → README → ADR → requires → uidesign → contracts → migrations → sub-CLAUDE → current-plan → backlog → changelog.

## Cleanup process (7단계, 정본 §5)

1. `find docs -name "*.md"` 전체 목록.
2. 중복·outdated 식별 (리뷰: PR 머지 후 / plan: phase close 후 / 임시 노트: canonical 흡수 후).
3. 유효 정보 → SoT 파일로 머지.
4. outdated → `done/`로 `git mv`.
5. 구현이 바뀌었으면 `claude-progress.txt` + `progress-archive.md` 갱신.
6. `next-session-tasks.md` + 진행 중 `phase-N.md`에 active task만.
7. 변경 사항 + 남은 불확실성 보고.

## Before creating a new doc — checklist (정본 §6)

- [ ] SoT 중에 이 책임 가진 파일 있나? → 그쪽 갱신
- [ ] 임시 산출물인가? → `next-session-tasks.md` 흡수 가능?
- [ ] 프로젝트 특이? 일반 룰? → 후자면 `CLAUDE.md`
- [ ] 리뷰/브레인스토밍이면 `reviews/<topic>.md` (결정 후 `reviews/done/`로 이동)
- [ ] 위 4개 모두 NO → 그때만 신규 + SoT 표에 한 줄 추가

## 정본으로 이동

세부 룰·표·운영 메모는 모두 `docs/specs/README.md` 참조.
