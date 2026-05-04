# /session-audit-act — 사용 가이드 (한글)

`/session-audit`가 발견한 패턴에 대해 **상태 전이, fix 적용 기록, verdict 표시**를 수행하는 스킬. 관찰과 분리해 idempotency·blind 무결성 보장.

## 한 줄 요약

`/session-audit-act` (인자 0) → 할 일 표 출력 / `<item_id>` (인자 1) → 가능한 액션 확인 / `<item_id> <action> [args]` (인자 2+) → 실제 전이.

## 언제 쓰나

- `/session-audit` 결과에 promotion 후보·remediation 후보·regression 경고가 떴을 때
- fix를 직접 적용한 후 (CLAUDE.md 룰 추가, hookify rule 작성, spec 변경 등)
- finding이 false positive였다고 표시할 때

## 사용법

### 1. 인자 0개 — backlog 확인

```
/session-audit-act
```

→ 결정 대기 중인 항목 표 출력. 어느 항목에 어떤 액션이 권장되는지 한눈에.

### 2. 인자 1개 — 가능한 액션 확인

```
/session-audit-act R3
```

→ R3의 현재 status에서 가능한 모든 action·필요 reference 형식 표 출력. 실행 안 함.

### 3. 인자 2+개 — 실제 전이

```
/session-audit-act promote R1 promoted
/session-audit-act queue_fix R1 hookify
/session-audit-act mark_applied R1 hookify:.claude/hookify.block-r1.local.md
/session-audit-act confirm_remediation R1
```

## 액션 카탈로그

| action                          | 의미                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `promote <id> <target>`         | candidate → promoted/scoped/retired/detection_review                            |
| `queue_fix <id> <fix_type>`     | promoted → `<fix_type>_queued` (hookify/claude_md/spec/manual)                  |
| `mark_applied <id> <reference>` | `*_queued` → `*_added` → under_remediation. fix_history 기록                    |
| `confirm_remediation <id>`      | under_remediation → remediated (post_fix 5세션·conf<0.1·work_type 매칭 ≥3 필요) |
| `mark_regressed <id>`           | under_remediation/remediated → regressed                                        |
| `mark_reactivated <id>`         | retired → regressed (reactivation_count 별도)                                   |
| `escalate <id> <new_fix_type>`  | regressed → 더 강한 fix_type queue                                              |
| `accept_residual <id>`          | regressed → accepted_residual (이후 stats suppression)                          |
| `mark_fp <session_id> <id>`     | session finding의 verdict → fp                                                  |
| `mark_tp <session_id> <id>`     | session finding의 verdict → tp                                                  |
| `seed_golden <jsonl_path>`      | detection drift 골든 샘플 추가                                                  |

## 일반 워크플로

### Step 1: promotion 후보가 떴을 때 (5세션 누적 후)

```
/session-audit-act promote R1 promoted
```

### Step 2: 어떤 fix_type으로 막을지 결정

```
/session-audit-act R1   # 가능한 fix_type 확인
/session-audit-act queue_fix R1 hookify
```

### Step 3: 실제 fix 작성 (수동, 본 스킬은 자동 작성 안 함)

- hookify rule이면: `.claude/hookify.block-r1.local.md` 직접 작성
- claude_md이면: `CLAUDE.md`에 룰 한 줄 추가하고 commit
- spec이면: `docs/specs/` 어딘가에 룰화

### Step 4: fix 적용 기록

```
/session-audit-act mark_applied R1 hookify:.claude/hookify.block-r1.local.md
# 또는
/session-audit-act mark_applied R1 commit:abc1234
# 또는
/session-audit-act mark_applied R1 file:CLAUDE.md
```

→ 자동으로 under_remediation 전이. post_fix 측정 시작.

### Step 5: 5세션 후 효과 확인

```
/session-audit-act confirm_remediation R1
```

→ 게이트 통과면 remediated. 미통과면 부족한 조건 보고.

### Step 6: regression 발생 시

```
/session-audit-act escalate R1 hookify   # 더 강한 fix_type으로
# 또는
/session-audit-act accept_residual R1    # 포기 (allowed_fix_types 소진)
```

## fix_type 강도 서열

| 강함 | fix_type    | 예시                                              |
| ---- | ----------- | ------------------------------------------------- |
| 1    | `hookify`   | `.claude/hookify.block-*.local.md` — runtime 차단 |
| 2    | `claude_md` | `CLAUDE.md`에 룰 추가 — 매 세션 컨텍스트          |
| 3    | `spec`      | `docs/specs/` — PR 리뷰 시점에도 잡힘             |
| 4    | `manual`    | 추적용 placeholder — 강제력 없음                  |

각 항목마다 `allowed_fix_types`가 다름. R1(파일 재-Read)은 4종 다 가능, P1(사과 루프)은 hookify 빼고 3종만 가능.

## 사용자가 직접 안 하는 것

- 룰 작성 — 본 스킬은 **자동 작성 안 함**. 사용자가 직접 hookify rule / CLAUDE.md edit / spec 변경. (자동 작성은 fix 품질 검증을 건너뛰어 위험)
- registry items 삭제 — append-only. 모든 상태 변화는 status flag로
- stats.json 직접 수정 — `/session-audit`가 delta 방식으로만 갱신

## False positive 표시 (선택)

finding이 잘못된 탐지였다 싶으면:

```
/session-audit-act mark_fp 9cf1cdcb-... R1
```

→ precision 통계 갱신. precision < 0.5 누적 시 해당 항목은 자동 `detection_review` 상태로 격리.

30일 동안 안 누르면 자동 tp 추정 — 즉 **방치해도 안전**, 정확도만 약간 떨어짐.

## Detection drift 골든 샘플 추가 (선택)

5~10세션 누적 후 "전형적 작업 세션 jsonl 5개"를 골라:

```
/session-audit-act seed_golden ~/.claude/projects/.../<id>.jsonl
```

- `.claude/audit/golden/expected_findings.json` 직접 작성 (어떤 finding이 기대되는지).

안 해도 동작은 함. 다만 모든 metric이 `drift_unverified` 마킹되어 신뢰도 검증 불가.

## 짝 스킬

`/session-audit` — jsonl 분석·stats 갱신. 자세히는 `../session-audit/README.md`.
