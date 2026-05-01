# 다음 세션 Autopilot 시작 프롬프트

> 작성: 2026-05-01 (이전 세션이 Phase 8 Wave 1 진입 직전 — shadcn 4종 mini-PR까지 완료한 시점)
> 사용법: 다음 세션 시작 직후 사용자가 아래 프롬프트를 그대로 붙여넣어 실행.

---

## 권장 프롬프트 (사용자가 그대로 붙여넣기)

```
/oh-my-claudecode:autopilot Phase 8 Wave 1 — VOC 리스트 + 검토 드로어 vertical slice 구현 진입.

## 사전 조건 (이미 완료됨)
- PR #102 머지: Wave 0 Foundation
- PR #103 머지: 8-PR1 권한 인프라 (assertCanManageVoc 헬퍼 + dev role)
- PR #106 머지: CLAUDE.md 90% certainty gate 룰
- PR #107 머지: docs/specs/plans/phase-8-wave1-plan.md (설계 메모, Q1~Q5 결정 로그 §0)
- PR #108 머지 (직전 세션): shadcn 4종 카피본 (textarea/tooltip/alert/popover)

## 본 세션 Goal
docs/specs/plans/phase-8-wave1-plan.md §8 (10 commit 순서)대로 Wave 1 단일 PR 완성.
LOC ≤1500 (테스트 포함), 검증 §9 게이트 100% 통과 후 PR 올리고 /codex:adversarial-review 라운드 2회 이상 APPROVE 받고 머지.

## 워크플로우 룰 (CLAUDE.md 정본 준수)
- 단계: 설계(완료, plan 문서 사용) → 구현(/gated-team-dev) → 리뷰(전문가 3~5인, 임의 self-review 금지)
- 모든 단계는 goal 선언 → goal 도달까지 반복
- 컨텍스트 관리: 서브에이전트 적극 활용 (architect/code-reviewer/security-reviewer/test-engineer/designer)
- 90% certainty gate: 결정 시 90% 미만 확신이면 임의 진행 금지, 사용자에게 양쪽 옵션·근거 명시 후 질문 (CLAUDE.md Working Style 룰)
- 200 LOC 위반 위험 파일은 useVocPageController 같은 오케스트레이션 hook으로 분산 (plan §2 분리 근거 표 참조)
- TDD: 매 commit 테스트 먼저 — plan §6 매트릭스가 commit 순서를 결정
- git workflow: feature branch (feat/phase-8-wave1-...) only, main 직접 push 금지, gh pr merge --merge --delete-branch
- 토큰 하드룰: hex/raw OKLCH 금지, var(--*)만

## 시작 액션
1. claude-progress.txt 30 lines + docs/specs/plans/phase-8-wave1-plan.md 전체 읽기
2. plan §0 결정 로그 + §8 commit 순서 + §9 검증 게이트 확정
3. feat/phase-8-wave1 branch 생성
4. C1 commit (계약 영역) → C2 (BE RED) → C3 (BE GREEN) → ... → C10 (Playwright + 회고 메모) 순서로 TDD 진행
5. 각 commit마다 검증 (typecheck/lint/test) 통과 확인 후 다음 commit
6. 모든 commit 완료 시 PR 생성 → /codex:adversarial-review → 수정 → APPROVE → gh pr merge
7. 머지 후 별도 commit으로 docs/specs/plans/phase-8-pattern.md 작성 (Wave 1 회고 — Wave 2 진입 게이트)
8. claude-progress.txt 갱신 + Wave 1 완료 표기

## 종료 조건
- PR 머지 완료
- phase-8-pattern.md 머지 완료 (Wave 2 진입 게이트)
- claude-progress.txt 갱신
- /oh-my-claudecode:cancel 으로 autopilot state 정리
```

---

## 왜 이 프롬프트가 잘 동작하는가 (이전 세션 학습)

이전 세션(2026-05-01)에서 autopilot이 잘 동작한 핵심 요인:

1. **Goal 선언 명시** — 첫 응답에서 "Goal/Scope/Done-when/Constraints" 프레임으로 작업 범위 고정.
2. **복잡도 평가 후 단계 결정** — Wave 1이 1500 LOC 다영역 작업이라 단순 ralph 모드 거부, 설계+계획+승인 게이트 우선.
3. **Q&A 명시화** — architect가 미해결 모호점 5건을 §12에 모아두고 사용자 결정 받은 뒤 진행 (90% gate 룰).
4. **서브에이전트 위임 패턴** — architect (Opus) 위임으로 main context 보호, 산출은 파일에 쓰고 chat에는 300단어 요약만.
5. **PR 관리 자동화** — gh pr create + gh pr merge --merge --delete-branch (CLAUDE.md 정본 따름).
6. **Stop hook 대응** — autopilot stop hook이 종료 막아도 사용자 게이트 질문은 정당. 사용자 답변 후 즉시 다음 단계로.
7. **상태 보존** — branch + commit + 문서로 세션 간 상태 이관 (autopilot state 파일 의존 X).

## 사용자가 알아야 할 점

- 본 prompt는 **다음 세션 시작 시** 사용자가 직접 붙여넣어야 함 (autopilot은 session-bound).
- Wave 1은 **최소 1~2 세션**이 더 필요할 가능성 큼 (구현 + adversarial-review + 수정 + 머지).
- adversarial-review에서 needs-attention 발생 시 라운드 반복 — 직전 세션 PR #103도 round 3에서 APPROVE.
- phase-8-pattern.md는 본 PR 머지 **이후** 회고로 작성 — 본 PR에는 포함 X.
