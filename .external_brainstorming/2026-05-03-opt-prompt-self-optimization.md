# opt-prompt self-optimization brainstorm

**Date:** 2026-05-03
**Status:** brainstorm — not a plan, not a decision
**Source:** session conversation after PR #171 (helper-driven log) shipped

## User's 3-part proposal

1. **Parameter + iteration**: 프롬프트 최적화 과정의 결정들을 수치 파라미터화 → AI 모델 학습처럼 이터레이션 돌려 자동으로 수치 조정
2. **Per task-type/size**: 작업 종류·사이즈별로 최적화 과정을 분리 수행
3. **Eval metrics**: 평가요소 구체화 — 최적화된 프롬프트의 token 소모량, 고정 리뷰 방식의 점수, 소요 시간 등 (1번과 연동)

## Honest assessment

방향은 맞다. 실제 연구 분야(DSPy, OPRO, AutoPrompt)와 닿아 있는 기획. 다만 솔로 개발 속도에서는 "ML 학습"처럼 작동하긴 어렵다.

### #1 — 파라미터화 + 이터레이션 자동화

**Pro:**

- 산문 룰을 명시적 knob로 빼면 비교 가능: `LOC_THRESHOLDS = {trivial:20, small:100, medium:500}`, `TRIM_LIST`, `EXPAND_LIST`, `SUBAGENT_THRESHOLD`.
- JSON으로 분리하면 SKILL.md는 프로즈 + JSON 참조 구조로 정리됨.

**Con / 함정:**

- Sample efficiency. `/opt-prompt`는 주당 몇 번 실행. ML식 수천 샘플은 비현실.
- 자동 최적화 대신 **manual bisect** (2주마다 1개 knob 조정)이 현실적.

### #2 — 작업 종류/사이즈별 최적화

**Pro:** "refactor의 small과 bug-fix의 small은 다른 비용 분포" — 분리 분석으로 신호 회복.

**Con / 선결조건:**

- 스키마에 `task_type` 필드 없음. 현재 `scope_decided`(trivial/small/...)만 있음.
- `task_type: bug-fix | refactor | new-feature | migration | docs | test-only` 추가가 선결.
- 추가 안 하면 모든 small이 한 풀에 섞여 신호가 묻힘.

### #3 — 평가요소 구체화

**현재 있는 것:**

- `tokens_delta` (input/output/cache_read/cache_creation)
- `verdict` (correct/undersized/oversized/mis-routed/scope-creep)
- `missed_gates`, `unnecessary_gates`
- `loc_actual`, `rework_rounds`

**빠진 것:**

- Wall-clock duration: `decided.ts` ↔ `retro.ts` 차이로 자동 계산 가능 — helper 한 줄.
- Review score: 어렵다. Claude가 리뷰하면 self-bias, 외부 LLM은 비용.

**DIY 권장:** 5점 척도 사용자 평가 1개 필드(`user_score: 1-5`) + 자동 시간 + 기존 verdict로 시작. 외부 LLM 채점은 미루기.

## 큰 그림 우려

**High variance 문제.** 같은 파라미터로도 task content에 따라 token-delta가 10× 진동. 진짜 신호 보려면 **paired replay** — 같은 task를 변종 A/B로 두 번 돌려 비교하는 설계가 필요할 수도. 현재 스킴은 single-arm trial이라 노이즈가 결론을 가릴 가능성.

## Suggested execution order (overengineering 회피)

1. helper에 3 필드 추가 (5분):
   - `task_type` (controlled vocab)
   - `wall_clock_seconds` (auto)
   - `user_score: 1-5` (eval에서 입력)
2. SKILL.md에서 knob를 JSON으로 분리 (15분).
3. 30 샘플 쌓일 때까지 분석 보류.
4. 30 샘플 후 가장 분산 큰 knob 1개 골라 bisect, 2주 trial.
5. 결과 보고 다음 사이클 결정.

## TL;DR

**방향 OK, 자동화는 절제, 데이터부터 늘려라.** 1·2·3 셋 다 동시에 들어가면 noise만 쌓이고 신호는 못 본다.

## Next decisions to make (when ready to act)

- [ ] `task_type` controlled vocab 확정 (위 6개로 충분? 추가/축소?)
- [ ] `user_score` 입력 시점·UX (`--eval` Q9?)
- [ ] knob JSON 위치: `.claude/skills/opt-prompt/rubric.json` vs SKILL.md frontmatter?
- [ ] paired replay를 도입할지 여부 (시간·비용 2배)
- [ ] 분석 트리거: scheduled agent 주기 vs manual `/opt-prompt --eval --review`
