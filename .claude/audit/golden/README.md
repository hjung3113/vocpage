# Detection Drift Golden Samples

매 N=10 세션마다 회귀 실행해 expert detection의 안정성을 검증한다. 없으면 모든 metric에 `drift_unverified` 마킹.

## 구성

- `samples/<n>.jsonl` — 박제된 세션 jsonl (5개)
- `expected_findings.json` — 각 sample에 대해 기대되는 finding ID·count

## expected_findings.json 형식

```json
{
  "samples": {
    "1": {
      "expected_items": ["R1", "R3", "C2"],
      "expected_min_count": { "R1": 2, "R3": 1 },
      "should_not_find": ["R5"]
    }
  },
  "drift_thresholds": {
    "min_recall": 0.7,
    "max_false_positive_rate": 0.3
  }
}
```

## 검증 흐름

`/session-audit` 실행 시 `sessions_total % 10 == 0` 이면:

1. 4 expert를 각 sample에 동일 contract로 dispatch
2. 매핑 결과를 expected와 비교
3. recall = found ∩ expected / |expected|
4. fpr = (found - expected) / found
5. 임계 미달 시 audit suspension 권고 + 사용자에 drift 보고

## v2 출시 시점

골든 샘플 0개로 시작. 첫 5세션 누적 후 사용자가 의미 있는 jsonl 5개를 골라 박제 (수동 작업, `/session-audit-act seed_golden`로 추가). 그 전까지 모든 metric은 `drift_unverified` 마킹.
