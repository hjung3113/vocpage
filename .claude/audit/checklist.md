# Session Audit Checklist v2

> **Blind 원칙**: expert agent는 이 파일·`registry.json`·`stats.json`·`sessions/*.json` 절대 읽지 않음. 자유 발견 → mapper expert가 사후 매핑.
> 본 문서는 사람이 라이프사이클·운영 규칙을 훑기 위한 reference. 정본은 `registry.json`.

## 운영 규칙 v2

- **신뢰도 산식**: read-time 계산. `confidence = sessions_occurred / sessions_total`. `displayed_confidence = raw_confidence * max(0, 1 - audit_density * 0.3)` (Hawthorne 보정)
- **stats 저장**: `(sum, sum_sq, count)` tuple만. mean·variance는 read-time 계산. 부동소수점 drift 방지
- **Idempotency**: 동일 sessionId 재분석 시 prior contribution을 빼고 새 contribution 더함 (delta)
- **Append-only**: registry items 절대 삭제 금지. status flag만 토글
- **Versioning**: `registry_version` mismatch 시 hard stop (마이그레이션 도구 없으면 warn-and-continue + suspend 권고)
- **Hawthorne**: `audit_density = audit된 세션 / 최근 30일 세션`. 0.3 초과 시 displayed_confidence에 산식 적용 + 경고

## 라이프사이클

```
candidate
  ├──→ promoted (5세션, conf≥0.4, ≥2 work_types)
  ├──→ scoped   (5세션, conf≥0.7, 1 work_type)
  ├──→ retired  (5세션, conf<0.1)              ← 부활 시 regressed로
  └──→ detection_review (precision<0.5, ≥3 verdict)

promoted/scoped
  ├──→ claude_md_queued ──→ claude_md_added ──→ under_remediation
  ├──→ hookify_queued   ──→ hookified       ──→ under_remediation
  ├──→ spec_queued      ──→ spec_added      ──→ under_remediation
  └──→ under_remediation (직접 관찰만, fix 없음)

under_remediation
  ├──→ remediated  (post_fix 5세션, post_fix_conf<0.1, work_type 매칭 ≥3)
  ├──→ regressed   (post_fix 중 occurred)
  └──→ remediation_inconclusive (post_fix 5세션, work_type 매칭 <3)

regressed
  ├──→ under_remediation       (같은 fix 유지, 재관찰)
  ├──→ {claude_md|hookify|spec}_queued (escalate, allowed_fix_types 안에서)
  └──→ accepted_residual       (allowed_fix_types 소진)

accepted_residual ─ TERMINAL (stats 가산 제외, 분기 1회 review 알림만)
retired ──→ regressed (re-detection 시, reactivation_count 별도 카운터)
```

**Escalation 트리거** (둘 중 하나):

- `regression_rate = regression_count / matching_work_type_post_fix_sessions ≥ 0.4`
- `reactivation_count ≥ 1` (retired였다 부활)

자동 적용 금지. 모든 전이는 `/session-audit-act` 통해 사용자 승인 후.

## fix_type 강도 서열 (강함 → 약함)

| fix_type    | 강함 이유                                 | 한계                          |
| ----------- | ----------------------------------------- | ----------------------------- |
| `hookify`   | 자동 차단·경고, runtime 강제              | hookify_feasible 항목만 가능  |
| `claude_md` | 매 세션 명시적 컨텍스트                   | 모델이 무시 가능              |
| `spec`      | `docs/specs/` 룰화, PR 리뷰 시점에도 잡힘 | 장기, 사람 검토 의존          |
| `manual`    | 추적용 placeholder                        | 강제력 없음, 사용자 행동 의존 |

각 항목의 `allowed_fix_types` 안에서만 escalate. 위가 없으면 `accepted_residual`.

## 카테고리 (정리됨)

- `rule_violation` — 코드 위반 (Read·Bash·Edit 패턴)
- `process_violation` — 프로세스 위반 (review·lint·git workflow·agent 위임·docs 동기화)
- `cost_anomaly` — 토큰 지표 이상 (cache·attachment·spike)
- `behavior_pattern` — 표현·습관 (사과·narration·추측·미요청 작업)

기존 v1의 R7/R10/C7가 process_violation으로 이동 (cost_anomaly는 토큰 지표 전용).

## 항목 (24개 → 28개로 확장)

상세는 `registry.json`. 추가된 4개:

- R11: Design token 위반 (hex/raw OKLCH)
- R12: TDD 위반 (테스트 없이 구현)
- R13: Git workflow 위반 (이미 hookify로 부분 baseline_hooked)
- R14: Graphify 미사용 (광범위 refactor)
- R15: Docs 동기화 누락 (wave-index/followup-bucket)

P4/P5 의미 중복 — mapper에서 P4로 통합 매핑하도록 표시.

## work_type 라벨 (자동 판정)

`pattern` expert가 jsonl touched_paths 기반 판정. multi-label 허용 (top-2까지).

- `fe_componentization` — `frontend/src/**` 신규 .tsx 多
- `fe_prototype_parity` — `prototype/**` Read + `frontend/src/**` Edit
- `fe_feature` — `frontend/src/**` Edit, prototype 무관
- `be_api` — `backend/src/routes/**`·`backend/src/services/**`
- `be_db` — `backend/migrations/**`·`shared/contracts/**`
- `docs_only` — 변경 100% `docs/**` 또는 `*.md`
- `refactor` — `git mv` 또는 import-only 다수
- `infra` — `.claude/**`·`scripts/**`·`package.json`·`vite.config.*`

매칭(remediation/escalation 정규화용): set intersection ≥ 1.

## False positive 추적

- session findings에 `user_verdict: tp|fp|unknown` (default unknown)
- `/session-audit-act mark_fp <session_id> <item_id>`
- 30일 미판정 unknown → tp 추정 (보수적, verdict_aging 룰)
- precision = TP / (TP + FP). <0.5 + ≥3 verdict → status=`detection_review`

## Cost ROI

- session.json에 `audit_cost_tokens` (4 expert + 메인 합산)
- `detected_waste_tokens` = 결정론 계산만 (expert 추정 금지) — 중복 tool call·redundant Read 등 raw 카운트
- ROI = `detected_waste_cumulative / audit_cost_cumulative`. <1.5 누적 5세션이면 출력 끝에 audit suspension 권고

## Detection drift 골든 샘플 (필수)

`.claude/audit/golden/` 에 박제 jsonl 5개 + `expected_findings.json`. 매 N=10 세션마다 회귀 실행 — recall<0.7 또는 false_positive_rate>0.3이면 audit suspend. 골든 샘플이 없으면 모든 metric은 `drift_unverified` 마킹.

## Deferred (v2 미구현, 운영 후 검토)

- `opt-prompt-eval` 통합 (별도 시스템, 직교)
- `claude-md-management` 핸드오프 (수동 우회 가능)
- `digest` 명령 (월간 일괄 결정)
- `fix_batch_id` (동시 다중 fix 분리)
- 마이그레이션 도구 (`/session-audit-migrate`)

## 누설 차단 (turns_summary)

다음 패턴은 expert에 전달 전 마스킹:

- 경로: `.claude/audit/**`, `.omc/**`, `.claude/scheduled_tasks.lock`
- 본문 토큰: `/hookify\.[a-z\-]+/`, `/audit_item_[0-9]+/`, `/\.omc\/[^\s]+/`
- expert 입력 토큰 상한 50KB, 초과 truncate
