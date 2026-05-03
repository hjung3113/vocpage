# Token Discipline — Verification Tracker

> **목적**: `docs/specs/plans/token-discipline-plan.md` 의 각 Tier patch가 적용된 후, **fresh 세션에서 실제 절감이 일어나는지** 측정·검증한 결과를 한 자리에 박제하기 위한 추적 문서. plan 문서가 "왜·무엇을·어떻게" 라면 본 문서는 "**진짜로 절감되었는가**" 의 ground truth.
>
> **운영 룰**:
>
> 1. 매 Tier patch 적용 직후, 본 문서에 신규 row를 추가한다 (체크리스트 + 측정 미완 상태).
> 2. 다른 fresh 세션에서 해당 Tier 검증 task를 실행하면, 그 세션이 본 문서의 측정 결과 칸을 직접 채운다 (verdict 포함).
> 3. plan 문서의 "추정 절감"과 본 문서의 "실측 절감"이 ±50% 밴드 밖으로 벌어지면 plan §10.4 sensitivity 표 + Tier ROI 등급을 재검토한다.
> 4. 본 문서는 **append-only**. 잘못 채운 row는 같은 row에 strikethrough + 정정 row 추가. row 자체 삭제 금지.
> 5. 측정 단위는 항상 `cost* = input + cache_creation + 0.1×cache_read` (plan §10.1).
>
> **연관 문서**:
>
> - Plan: `docs/specs/plans/token-discipline-plan.md`
> - 진행 추적: `claude-progress-token-discipline.md` (이 브랜치 전용, main 머지 시 삭제 예정)
> - Baseline: `~/.claude/opt-prompt/opt-prompt-log.jsonl` 4 row (PR #175 / #178 / #180 / #182)

---

## Baseline 보존 (paired raid 비교 기준)

| Session                                | LOC | cache_creation | cache_read | cost   | cost\* (+0.1×cache_read) |
| -------------------------------------- | --- | -------------- | ---------- | ------ | ------------------------ |
| PR #175 (F-1/2/3 bundle)               | 220 | 3.39M          | 54.34M     | 3.39M  | 8.82M                    |
| PR #178 (F-bundle minor)               | 56  | 1.16M          | 14.77M     | 1.16M  | 2.64M                    |
| PR #180 (C-10 NotifButton+NotifPanel)  | 324 | 2.40M          | n/a        | ~2.40M | n/a                      |
| **PR #182 (C-11 VocCreateModal+Atom)** | 350 | 2.73M          | 54.97M     | 2.73M  | 8.23M                    |

근거: `~/.claude/opt-prompt/opt-prompt-log.jsonl` 4 retro rows. C-11 row id = `opt-20260503T063921Z-c-11-voc-create-modal`.

---

## 검증 row 템플릿 (신규 Tier 추가 시 복사)

```markdown
### Tier <X.Y-Z> — <한 줄 제목>

| 항목                 | 값                                                                   |
| -------------------- | -------------------------------------------------------------------- |
| 적용 일자            | YYYY-MM-DD                                                           |
| 적용 commit          | <SHA> (`docs/token-discipline-plan` branch)                          |
| 백업 위치            | <백업 파일 절대경로 1줄당>                                           |
| Plan 추정 절감       | <plan §3 또는 §4.x 인용>                                             |
| 적용 후 정적 측정    | <SKILL.md 줄수, deferred surface 등 — 적용 직후 즉시 측정 가능한 값> |
| Fresh 세션 측정 결과 | (미완 — 다음 fresh 세션이 채울 것)                                   |
| Verdict              | (미완 → PASS / FAIL / NEEDS-REVIEW)                                  |
| Rollback 트리거      | <FAIL 시 어떤 명령어로 되돌릴지>                                     |
| 다음 액션            | (미완)                                                               |

**검증 체크리스트**:

- [ ] 항목 1
- [ ] 항목 2
- [ ] ...

**측정 결과 기록 (fresh 세션이 채움)**:

> _(빈 칸 — 측정 후 이 블록을 덮어써라)_
```

---

## 적용 이력

### Tier 1.3-A — Serena 이중 등록 정리 (`mcp__plugin_serena_serena__*` 제거)

| 항목                 | 값                                                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 적용 일자            | 2026-05-03                                                                                                                                                                                                                                                                                 |
| 적용 commit          | `7583240` (`docs/token-discipline-plan` branch)                                                                                                                                                                                                                                            |
| 백업 위치            | `vocpage/.claude/settings.local.json.bak.20260503` + `~/.claude/settings.json.bak.20260503`                                                                                                                                                                                                |
| Plan 추정 절감       | ~3K direct (등록 시점) + surface 29 deferred tools 제거 (plan §3 row 1.3-A)                                                                                                                                                                                                                |
| 적용 후 정적 측정    | 본 세션 system-reminder에서 `mcp__plugin_serena_serena__*` 29건 → "no longer available" 명시. `mcp__serena__*` 18건 잔존. `claude mcp list` → `serena: …` 1줄만 (plugin form 사라짐). PostToolUse hook은 `mcp__serena__.*` matcher로 정상 fire (`get_symbols_overview` 호출 시 echo 발화). |
| Fresh 세션 측정 결과 | _(미완 — 다음 fresh 세션이 채울 것)_                                                                                                                                                                                                                                                       |
| Verdict              | _(미완 → PASS / FAIL / NEEDS-REVIEW)_                                                                                                                                                                                                                                                      |
| Rollback 트리거      | `mv vocpage/.claude/settings.local.json.bak.20260503 vocpage/.claude/settings.local.json && mv ~/.claude/settings.json.bak.20260503 ~/.claude/settings.json && git revert 7583240`                                                                                                         |
| 다음 액션            | fresh 세션 1회로 surface line 절감 측정 + 직접 fire 빈도 비교                                                                                                                                                                                                                              |

**검증 체크리스트** (fresh 세션에서 통과 여부 표기):

- [x] 본 세션 적용 직후: deferred tools `mcp__plugin_serena_serena__*` 0건 + `mcp__serena__*` 18건
- [x] 본 세션 적용 직후: `claude mcp list | grep -i serena` → `serena` 1줄만
- [x] 본 세션 적용 직후: PostToolUse Serena echo hook 정상 fire (direct serena 호출 시)
- [ ] **fresh 세션**: SessionStart 시 deferred tools 목록 surface 라인 수 비교 (이전 plugin 29 + direct 18 = 47 → 이후 direct 18만, 약 29줄 절감)
- [ ] **fresh 세션**: serena MCP server 자체 connectivity 정상 (find_symbol 1회 dry-run)
- [ ] **fresh 세션**: plugin-only 11개 도구 (`search_for_pattern`, `find_file`, `list_dir`, `execute_shell_command`, `read_file`, `find_declaration`, `find_implementations`, `activate_project`, `create_text_file`, `get_current_config`, `get_diagnostics_for_file`) 부재가 실 워크플로우에 막힘 없는지 1회 dry-run

**측정 결과 기록 (fresh 세션이 채움)**:

> _(빈 칸 — 측정 후 이 블록을 덮어써라. 형식: `surface_lines_before / surface_lines_after / Δ`, `mcp_tool_dry_run_OK?`, `worker-around_needed?`)_

---

### Tier 1.4 옵션 E — opt-prompt SKILL을 2-skill split

| 항목                 | 값                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 적용 일자            | 2026-05-03                                                                                                                                                                                                                                                                                                                                                                |
| 적용 commit          | (이번 세션의 commit, 본 문서 + skill 파일 + plan 문서 일괄)                                                                                                                                                                                                                                                                                                               |
| 백업 위치            | `vocpage/.claude/skills/opt-prompt/SKILL.md.bak.20260503` (원본 452줄)                                                                                                                                                                                                                                                                                                    |
| Plan 추정 절감       | -25-35K dual-fire (B3 구조적 제거) + 매 turn ~4K eval 섹션 사전 로드 제거 (plan §3 row 1.4 + §4.4)                                                                                                                                                                                                                                                                        |
| 적용 후 정적 측정    | `.claude/skills/opt-prompt/SKILL.md` 452 → 306줄 (-32%, ~1900 token/invoke 추산 절감). 신규 `.claude/skills/opt-prompt-eval/SKILL.md` 181줄. append.sh 위치 변경 없음 (Q1-A). 본 세션 system-reminder skill 목록에 두 description 모두 정상 노출. cross-ref audit (settings/hooks/CLAUDE.md/hookify) 0건. smoke test (격리 로그) `decided` + `retro` 2 row append exit 0. |
| Fresh 세션 측정 결과 | _(미완 — 다음 fresh 세션이 채울 것)_                                                                                                                                                                                                                                                                                                                                      |
| Verdict              | _(미완 → PASS / FAIL / NEEDS-REVIEW)_                                                                                                                                                                                                                                                                                                                                     |
| Rollback 트리거      | `mv .claude/skills/opt-prompt/SKILL.md.bak.20260503 .claude/skills/opt-prompt/SKILL.md && rm -rf .claude/skills/opt-prompt-eval/ && git revert <split-commit>`                                                                                                                                                                                                            |
| 다음 액션            | fresh 세션 1회로 normalize invoke 토큰 측정 + retro invoke 토큰 측정 + B3 dual-fire 절감 직접 관측                                                                                                                                                                                                                                                                        |

**검증 체크리스트** (fresh 세션에서 통과 여부 표기):

- [x] 본 세션 적용 직후: 두 SKILL.md frontmatter valid (skill 목록에 두 description 정상 노출)
- [x] 본 세션 적용 직후: append.sh smoke test PASS (격리 로그 `decided` + `retro` 모두 exit 0)
- [x] 본 세션 적용 직후: cross-ref grep 0건 (settings/hooks/CLAUDE.md/hookify에 opt-prompt 참조 없음)
- [ ] **fresh 세션**: `/opt-prompt <짧은 prompt>` 1회 → SKILL.md 306줄만 system-reminder에 로드 (eval 섹션 미포함)
- [ ] **fresh 세션**: 위 normalize Step 2 출력 끝에 `// reminder: invoke /opt-prompt-eval <decision_id>` 1줄 자동 emit 확인
- [ ] **fresh 세션**: 동일 세션에서 `/opt-prompt-eval <위 decision_id>` 호출 → opt-prompt-eval 스킬 단독 로드 (181줄), 8 retro questions 순차 진행, `append.sh retro` 호출 성공
- [ ] **fresh 세션**: `/opt-prompt-eval --review` 호출 → 로그 join + 제안만 출력, normalize SKILL.md 자동 편집 0
- [ ] **fresh 세션**: legacy `/opt-prompt --eval` 호출 시 normalize 스킬이 anti-pattern 감지 → "redirect to /opt-prompt-eval" 응답
- [ ] **fresh 세션 + paired raid (선택)**: C-11급 task 1회 (decided phase) + close 후 retro 1회로 cache_creation 25-35K 절감 직접 관측. 기준값: 이전 단일 SKILL.md 시 retro 호출에서 25-35K cache_creation 추가 발화. 미달 시 description keyword 충돌 의심 → 두 스킬 description의 trigger 단어 분리 정확도 재검토.

**측정 결과 기록 (fresh 세션이 채움)**:

> _(빈 칸 — 측정 후 이 블록을 덮어써라. 형식 예시: `normalize_skill_md_load_tokens / eval_skill_md_load_tokens / B3_dual_fire_savings_K`)_

---

## 미적용 Tier (예정 row — 적용 시 본 섹션에서 위로 옮긴 후 채우기)

다음 Tier가 적용될 때 위 템플릿을 복사해 "적용 이력" 섹션 맨 위에 새 row로 추가:

- Tier 1.1-A — Hook env entry (`OMC_SKIP_DELEGATION_NOTICES=1`)
- Tier 1.1-B — Hook dispatcher dedup patch
- Tier 1.1-C — PostToolUse Serena echo 제거
- Tier 1.2-A — Sub-CLAUDE.md 통합 (69 → 8 keep + 61 삭제, no stub)
- Tier 1.2-B — Path-scoped 자동 주입
- Tier 1.3-B — SessionStart Serena schema pre-load
- Tier 2 — CLAUDE.md routing 룰 + project memory narrowing
- Tier 2.5 §6.1 — 병렬 bash batch 강제 (룰 텍스트)
- Tier 2.5 §6.2 — 첫 commit 전 ESLint dry-run
- Tier 2.5 §6.4 — tsc + vitest 통합 batch
- Tier 3 (hold) — Commit hygiene (R5 5분 실측 후 결정)

**Quick Wins (§6.x)는 룰 텍스트 변경뿐이라 정적 측정만으로는 절감 검증 불가** — 반드시 fresh 세션 paired raid 1+2로 cost\* median 비교.

---

## Verdict 정의

- **PASS**: fresh 세션 체크리스트 모두 통과 + 측정 결과가 plan 추정 ±50% 밴드 안.
- **FAIL**: 체크리스트 1건 이상 실패, 또는 측정 결과 절감이 음수 (regression).
- **NEEDS-REVIEW**: 체크리스트 통과했지만 측정 결과가 plan 추정 ±50% 밴드 밖 (절감 부족 또는 과다). plan §10.4 sensitivity + Tier ROI 등급 재검토 필요.

`FAIL` row는 즉시 rollback 트리거 실행 후 plan 본문을 정정. `NEEDS-REVIEW`는 raid 추가 round로 N 늘려 재측정.
