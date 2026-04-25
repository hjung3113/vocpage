---
name: update-progress-docs
enabled: true
event: stop
pattern: .*
---

**세션 종료 전 진행 문서 업데이트 필수**

이번 세션에서 git commit이 있었다면 반드시 아래 두 파일을 업데이트하고 커밋한 뒤 종료할 것:

1. `docs/specs/plans/next-session-tasks.md`
   - 완료된 항목: `- [ ]` → `- [x]` 로 변경
   - 새로 생긴 미완료 항목 추가
   - "다음 세션 시작점" 섹션을 현재 상태로 갱신

2. `claude-progress.txt` (첫 30줄)
   - 현재 Phase 위치 업데이트
   - 이번 세션에서 완료한 작업 요약 추가

업데이트 후 `git add -p docs/specs/plans/next-session-tasks.md claude-progress.txt && git commit -m "docs: 세션 진행 문서 업데이트"` 로 커밋할 것.

이 절차를 건너뛰면 다음 세션에서 "이미 완료된 작업을 다시 리포트"하는 문제가 반복된다.
