---
name: warn-doc-cleanup-before-pr
enabled: true
event: bash
pattern: gh\s+pr\s+(create|merge)
---

📋 **PR 생성/머지 전 문서 정리 체크리스트** (정본: `docs/specs/README.md §5` 7단계)

이 PR로 phase/wave/PR이 닫히면 **머지 전에** 다음 정리를 1회 수행하라:

1. `claude-progress.txt` 첫 30줄 갱신 — 본 PR 결과를 "다음 세션 시작점" 절에 반영. 이미 완료되어 더 참조 불필요한 phase 항목 제거 (claude-progress.txt는 활성 컨텍스트만)
2. `docs/specs/plans/next-session-tasks.md` 갱신 — 본 PR로 종결된 항목 ✅ 표기, 다음 진입점 명시
3. `docs/specs/reviews/` 의 본 PR 관련 리뷰 문서가 더 이상 참조 불필요하면 `docs/specs/reviews/done/` 으로 `git mv` (archive는 정본 인용 금지)
4. `docs/specs/plans/` 의 종료된 plan 파일이 있다면 `docs/specs/plans/done/` 으로 `git mv`
5. 머지된 phase의 본문 내용이 다른 active doc에서 인용 중이면 인용을 직접 fact로 풀거나 link만 유지 (archive 인용 금지)
6. `phase-*.md` Changelog 한 줄 추가 — 본 PR 머지 결과 (한 줄, 날짜 + ID + 요약)
7. typecheck/lint clean 재확인 — doc 정리로 인한 코드 영향 없는지

**예외**: docs/<topic> 단독 PR이거나 trivial 1-line fix면 위 절차 생략 가능. 사용자 결정.

**위 7단계는 본 PR `gh pr create` 또는 `gh pr merge` 직전 1회만 트리거됨.** 이미 수행했으면 무시하고 진행.
