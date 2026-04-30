# AGENTS.md

> **Codex / 다른 AI agent용 진입 문서.** 정본 governance는 [`CLAUDE.md`](./CLAUDE.md)이며 모든 룰(Phase 상태, document structure, git workflow, refactoring, working style 등)은 그쪽을 따른다.

## Quick Pointers

| 항목                        | 위치                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| 정본 governance             | [`CLAUDE.md`](./CLAUDE.md)                                                            |
| 현재 진행 (Phase·다음 작업) | [`claude-progress.txt`](./claude-progress.txt) (≤30줄)                                |
| 전체 Phase 계획             | [`docs/specs/plans/next-session-tasks.md`](./docs/specs/plans/next-session-tasks.md)  |
| NextGen 백로그              | [`docs/specs/plans/nextgen-backlog.md`](./docs/specs/plans/nextgen-backlog.md)        |
| 프로토타입                  | [`prototype/CLAUDE.md`](./prototype/CLAUDE.md)                                        |
| 디자인 시스템               | [`docs/specs/requires/uidesign.md`](./docs/specs/requires/uidesign.md) (English only) |
| 기능 요구사항               | [`docs/specs/requires/requirements.md`](./docs/specs/requires/requirements.md)        |

## 세션 시작 절차

1. `claude-progress.txt` (첫 30줄)
2. `docs/specs/plans/next-session-tasks.md`
3. 필요한 spec만 선택적으로
4. 룰은 `CLAUDE.md` 참조

## 핵심 룰 요약 (정본은 CLAUDE.md)

- 항상 feature branch (`docs/<topic>` / `feat/<topic>` / `fix/<topic>`), main 직접 푸시 금지
- PR 머지는 `gh pr merge <n> --merge --delete-branch` (squash·rebase 금지)
- CSS 색상은 토큰만 — hex/raw OKLCH 직접 사용 금지
- 작업 완료 선언은 사용자 명시적 승인 후
- 구현 코드 작성은 사용자 승인 후

세부 사항·예외·refactor 체크리스트는 `CLAUDE.md`에 있다.
