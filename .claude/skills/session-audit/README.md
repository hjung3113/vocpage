# /session-audit — 사용 가이드 (한글)

세션 jsonl을 4명의 blind expert로 분석해 행동·비용·룰 위반 패턴을 누적 통계화하는 스킬. **관찰·기록 전용** — 상태 전이는 `/session-audit-act` 별도.

## 한 줄 요약

세션 끝나고 `/clear` → 새 세션에서 `/session-audit <prev_session_id>` → 패턴 누적.

## 언제 쓰나

- 작업 세션이 끝난 직후 (회고용)
- 매 세션 돌리는 게 가장 안전 (selection bias 방지). 일부만 돌려도 시스템은 안 깨짐
- 같은 세션을 다시 돌려도 OK (delta 방식으로 stats가 무결하게 갱신됨, `audit_revision++`)

## 사용법

```bash
# 현재 세션 분석
/session-audit

# 특정 세션 분석 (권장 — 깨끗한 컨텍스트에서)
/session-audit 9cf1cdcb-f893-4526-afc7-1e94a60a3fa0
```

이전 세션 ID 찾는 법:

```bash
ls -t ~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/*.jsonl | head -3
# mtime 기준 최신 3개. 파일명에서 .jsonl 떼면 sessionId
```

## 출력 예시

```
## Session 9cf1cdcb-... (audit_rev=1, work_type=fe_componentization, fe_prototype_parity)

### Findings (top 3 by impact)
| item_id | title              | found_by    | count | impact | conf(disp) |
| R1      | 동일 파일 재-Read  | rule, cost  | 5     | 2      | 0.80       |

### New candidates (1)
- "MSW handler 변경 후 fixture parity 검사 누락" (pattern, count=1, ordinal=2)

### Lifecycle candidates
| item | current   | proposed | trigger                              |
| R1   | candidate | promoted | 5 sessions, conf 0.80, 2 work_types  |

### System notices
- drift_unverified — golden samples 0개
- audit_density 0.20 (Hawthorne 보정 미적용)

다음: /session-audit-act promote R1 promoted
```

## 사용자가 신경 쓸 것

거의 없음. 매 세션 후 `/session-audit` 한 줄만 돌리면 끝. 5세션 누적 시점에 promotion 후보 표가 뜨면 그때 `/session-audit-act`로 결정.

상세 결정 포인트는 `.claude/audit/checklist.md` 참조.

## 안전장치

- **Blind 무결성**: expert·mapper 누구도 registry/checklist/sessions 못 읽음. 4 expert 자유 발견 → 별도 mapper expert가 매핑
- **Idempotency**: 같은 세션 재분석은 prior contribution을 stats에서 빼고 새 contribution 더함 (delta)
- **Append-only**: registry items 절대 삭제 안 함. status flag만 토글
- **Versioning**: `registry_version` mismatch 시 hard stop
- **Hawthorne 보정**: audit_density > 0.3이면 confidence를 자동 보정
- **Cost ROI**: detected_waste / audit_cost < 1.5 누적 5세션이면 audit 일시 중단 권고
- **Detection drift**: 골든 샘플로 expert 안정성 정기 검증 (v0는 골든 0개라 `drift_unverified` 마킹)

## 다른 파일들

- `.claude/audit/registry.json` — 항목 정의 (29개), 라이프사이클, promotion_rules
- `.claude/audit/checklist.md` — 사람용 reference (라이프사이클 다이어그램, fix_type 강도, 운영 규칙)
- `.claude/audit/stats.json` — 누적 통계 (gitignore, 로컬 전용)
- `.claude/audit/sessions/<id>.json` — 세션별 결과 (gitignore)
- `.claude/audit/golden/` — detection drift 골든 샘플
- `.claude/audit/migrations/` — 스키마 마이그레이션 명세

## 짝 스킬

`/session-audit-act` — 상태 전이·fix 적용 기록 전용. 자세히는 `../session-audit-act/README.md`.
