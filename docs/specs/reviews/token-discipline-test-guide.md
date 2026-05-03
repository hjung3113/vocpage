# Token Discipline — Test Guide

> **목적**: PR #184 (batch 1, merge commit `6fc1cbe`)로 main에 적용된 토큰 절감 patch 5건을 **평가 에이전트가 일관 절차로 검증**할 수 있게 하는 단일 진입 SOP.
>
> **이 문서는 "어떻게 평가하는가"** — 실제 row 박제는 [`token-discipline-verification.md`](./token-discipline-verification.md), patch 설계 근거는 [`../plans/token-discipline-plan.md`](../plans/token-discipline-plan.md).
>
> **운영 룰**:
>
> 1. 본 문서는 SOP — append-only 가 아니다. 절차 자체가 바뀌면 in-place 갱신.
> 2. 측정 결과는 본 문서가 아닌 `token-discipline-verification.md` row에 기록.

---

## 1. 사용 시점 — 누가 본 문서를 보나

본 문서는 **두 가지 사용 패턴**이 있다.

| 사용 패턴                        | 누가                                                                                         | 시점                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| (A) **비교/평가 에이전트**       | 다른 작업 세션에서 사용자가 별도 spawn 한 sub-agent. 본 브랜치 문서 전부 가져와서 비교 수행. | 작업 세션 종료 후 평가 단계                                                            |
| (B) **Blind reviewer 사후 매핑** | 자기 세션 컨텍스트만 보고 평가를 마친 reviewer agent (본 가이드/plan/verification 미참조).   | reviewer가 자기 평가 종료 **후**에 본 가이드 열고 §3 체크리스트/§5 verdict 기준에 매핑 |

**Blind 정합성**: (B)의 reviewer는 평가 도중 본 문서/plan/verification 을 읽으면 안 된다 — 평가 종료 후에만 본 가이드로 매핑. (A)는 처음부터 가이드 + 문서 전체를 보고 평가.

**경계 명확화** (두 패턴 공통):

- **이미 적용된 항목** → plan 문서가 아니라 **verification.md row**를 본다. row의 "검증 체크리스트" + "다음 액션" 칸이 명확한 작업 지시.
- **아직 적용되지 않은 항목** → plan 문서 §3 / §4.x 본문을 읽되, **측정은 하지 않는다** (적용 전이므로 절감 정의 자체가 성립 안 함). plan 본문은 "이 patch가 무엇을 노리는가"의 컨텍스트로만 사용.

---

## 2. 측정 환경

### 2.1 Branch 분리

| 측정 대상     | git ref                       | 의미                                          |
| ------------- | ----------------------------- | --------------------------------------------- |
| **baseline**  | `668eaaa` (PR #184 직전 main) | 5 patch 미적용 main HEAD                      |
| **after**     | `6fc1cbe` (PR #184 merge)     | batch 1 (1.4 / 2.5 QW / 1.2-A) main 적용 후   |
| (외부 기록만) | `~/.claude/settings.json`     | 1.3-A + 1.1-A는 repo 외부 변경. backup 비교용 |

**1.3-A + 1.1-A 주의**: repo cherry-pick이 없으므로 git checkout으로는 baseline 복원 불가. 평가 에이전트 측정은 **현재 외부 settings 상태 = 적용됨** 이라고 전제하고 진행. 만약 baseline 비교가 필요하면 backup (`~/.claude/settings.json.bak.20260503` 등) 으로 복원 후 별도 raid round.

### 2.2 Cost\* 메트릭

```
cost* = input + cache_creation + 0.1 × cache_read
```

(plan §10.1) — `~/.claude/opt-prompt/opt-prompt-log.jsonl` 의 retro row 4건이 baseline (PR #175 / #178 / #180 / #182).

가중치 sensitivity: `0.05 / 0.10 / 0.15` 세 값으로 재계산. 세 값 모두 같은 Tier ROI 순위가 나오면 robust (plan §10.4).

---

## 3. Patch별 평가 절차

5 patch 각각의 **단일 책임 검증 항목 + 절감 측정 방법**. 평가 에이전트는 이 §3을 위에서 아래로 1회 통과.

### 3.1 Tier 1.3-A — Serena 이중 등록 정리

**적용 자료**: verification.md "Tier 1.3-A" row (commit `7583240`, 외부 settings).

**평가 에이전트 절차**:

1. `claude mcp list | grep -i serena` → `serena: …` **1줄만** 보여야 함. `plugin:serena:serena` 사라졌는지 확인.
2. SessionStart deferred-tool 목록에서 `mcp__plugin_serena_serena__*` 0건 확인 + `mcp__serena__*` 18건 잔존.
3. 임의 TS 파일에서 `find_symbol` 1회 dry-run — 도구 정상 응답.
4. plugin-only 11개 도구 (`search_for_pattern`, `find_file`, `list_dir`, `execute_shell_command`, `read_file`, `find_declaration`, `find_implementations`, `activate_project`, `create_text_file`, `get_current_config`, `get_diagnostics_for_file`) 부재가 실제 워크플로우에서 막힘 없는지 1 task 수행 중 자연 검증.

**측정 단위**: SessionStart system-reminder의 deferred-tool 목록 surface line 수 (이전 47줄 → 이후 18줄, 약 29줄 절감 추산).

**verdict 기준**: 위 4 체크 모두 통과 + surface 절감이 plan 추정 ±50% 안.

---

### 3.2 Tier 1.4 옵션 E — opt-prompt 2-skill split

**적용 자료**: verification.md "Tier 1.4 옵션 E" row. 본 브랜치 commit `a5c16a6` → main `13a4357` (PR #184 reconstruct).

**평가 에이전트 절차**:

1. SessionStart skill 목록에 **`opt-prompt`** + **`opt-prompt-eval`** 두 description 모두 노출되는지 확인. 두 description의 trigger 단어 분리 명확한지 시각 확인.
2. `/opt-prompt <짧은 prompt>` 1회 → `.claude/skills/opt-prompt/SKILL.md` 306줄만 system-reminder에 로드 (eval 섹션 미포함). Step 1 helper 호출 → Step 2 block emit → 마지막 줄 `// reminder: invoke /opt-prompt-eval <decision_id>` 자동 emit 확인.
3. 동일 세션에서 `/opt-prompt-eval <위 decision_id>` 호출 → 181줄 단독 로드, 8 retro questions 진행, `append.sh retro` 호출 성공.
4. `/opt-prompt-eval --review` → 로그 join + 제안만 출력, normalize SKILL.md 자동 편집 0.
5. legacy `/opt-prompt --eval` → normalize 스킬이 anti-pattern 감지 → "redirect to /opt-prompt-eval" 응답.

**측정 단위**: B3 dual-fire cache_creation 절감. C-11급 task 1회 (decided phase) + close 후 retro 1회로 cache_creation 25-35K 절감 직접 관측 (plan §3 row 1.4 추정).

**verdict 기준**: 5 체크 모두 통과 + B3 절감 25-35K ±50% 안 (= 12.5K~52.5K).

---

### 3.3 Tier 1.1-A — `OMC_SKIP_DELEGATION_NOTICES=1`

**적용 자료**: verification.md row 신설 필요 (없으면 평가 에이전트이 신설). 외부 settings (`~/.claude/settings.json`).

**평가 에이전트 절차**:

1. `node -e "console.log(JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8')).env.OMC_SKIP_DELEGATION_NOTICES)"` → `1` 출력.
2. 임의 직접 편집 (Write/Edit) 1회 수행 — system-reminder에 `[DELEGATION NOTICE]` 블록이 **나타나지 않아야 함**. (이전엔 `pre-tool-use.mjs:236, 354`에서 발화)
3. 다른 OMC reminder hook (예: serena echo)는 정상 fire — 다른 hook까지 죽이지 않았는지 한 번 확인.

**측정 단위**: 매 직접 편집 turn당 [DELEGATION NOTICE] 블록 ~200-400 token 부재.

**verdict 기준**: 3 체크 모두 통과.

---

### 3.4 Tier 2.5 Quick Wins — 룰 텍스트 3건

**적용 자료**: verification.md row 신설 필요. 본 브랜치 commit `3fedfa4` → main `596fafa` (root `CLAUDE.md` + `.claude/CLAUDE.md`).

**룰 텍스트 변경뿐이라 정적 측정만으로는 절감 검증 불가** — 행동 교정이 일어나는지 paired raid 필요.

**평가 에이전트 절차**:

1. 정적 확인 (3건):
   - root `CLAUDE.md` "Parallel tool calls" 룰에 "bash·Read chains 포함; sequential chain 식별 시 즉시 batch 전환" 문구 존재.
   - root `CLAUDE.md` "Working Style"에 "Pre-commit lint dry-run — `npm run lint -w frontend`" 신규 항목 존재.
   - `.claude/CLAUDE.md` "Token-Saving Protocol"에 "Test batch — FE/BE 워크스페이스별 단일 호출" 항목 존재.
2. 행동 교정 측정 (raid 1 round, 선택):
   - C-11 패턴 task 1회 (FE 컴포넌트 + 시그널 atom 조합). 측정값:
     - bash·Read parallel batch 률 (target: ≥80% — sequential chain 있으면 reviewer audit 발화).
     - 첫 commit 전 `npm run lint -w frontend` 1회 호출 여부 (target: 100%).
     - typecheck/test 호출 시 워크스페이스 단일 호출 여부 (target: split 0건).
3. raid 결과를 `~/.claude/opt-prompt/opt-prompt-log.jsonl` retro row의 `behavior_*` 필드 (없으면 신규)로 기록.

**측정 단위**: cost\* median (raid 1: pre-QW 4 baseline 평균 vs post-QW 1 raid). plan 추정: -5~15K cost\*/세션 (간접).

**verdict 기준**: 3 정적 체크 통과 + raid 1 round에서 behavior 3 항목 모두 룰 기준 만족. 절감은 가설로만 표시 (NEEDS-REVIEW 가능).

---

### 3.5 Tier 1.2-A — leaf CLAUDE.md 69 → 8 keep

**적용 자료**: verification.md row 신설 필요. 본 브랜치 4 commit (`f650b16` / `7332925` / `3296f9a` + progress) → main `b388eb0` / `c4f4ac3` / `5a092cc` (+ `4b549d5` README align).

**평가 에이전트 절차**:

1. 정적 확인:
   - `find . -name CLAUDE.md -not -path './node_modules/*' -not -path './graphify-out/*' | wc -l` → **8**.
   - 8 keep 모두 200줄 cap 준수: `wc -l CLAUDE.md .claude/CLAUDE.md frontend/CLAUDE.md backend/CLAUDE.md frontend/src/CLAUDE.md backend/src/CLAUDE.md docs/CLAUDE.md prototype/CLAUDE.md` → 어느 것도 200 초과 안 함.
   - hookify rule #7 (`.claude/hookify.warn-doc-cleanup-before-pr.local.md`) → "8-keep set" 3-line 룰로 축약됨.
   - `docs/specs/README.md` §3 row 1: 8-keep 명시 (이전 leaf 정책 잔존 없음).
2. 흡수 누락 검증 (sample): 임의 leaf 디렉토리 (예: `frontend/src/components/voc/`) 진입 시 ancestor (`frontend/src/CLAUDE.md`)에 해당 도메인 가이드가 흡수되어 있는지 확인. 누락 시 row에 기록.
3. 절감 측정:
   - SessionStart auto-load CLAUDE.md 총 line 수 비교: baseline (`668eaaa` checkout 후 평가 에이전트) vs after (`6fc1cbe`). 추정: 61개 leaf 평균 13줄 × 61 = ~793줄 제거, 8 ancestor 흡수로 +200줄 ≈ 순 -593줄.
   - cache_creation 측정: paired raid 1 round (C-11 패턴 task), pre vs post cost\*.

**측정 단위**: SessionStart cache_creation 절감 (plan 추정: -200~400K, 단일 최대 절감 patch).

**verdict 기준**: 정적 3 체크 통과 + 흡수 누락 0건 + cache_creation 절감 200~400K ±50% 안 (= 100K~600K).

---

## 4. 측정 task 표준화

§3.2 / §3.4 / §3.5의 raid에 쓸 task — **C-11 패턴 (FE 컴포넌트 + 시그널 atom 1쌍 조합)** 을 표준 측정 task로 사용. 이유: PR #182 baseline (cost\* 8.23M)이 가장 최근/완전.

**raid round 정의**:

- 같은 task 명세를 baseline / after 각 평가 에이전트에서 1회 수행.
- 명세 (예시): "VocFilterBar 의 status pill 클릭 시 active 상태 atom 갱신 + URL query sync 추가 (TDD)."
- 명세는 raid 시작 시 reviewer가 정한 1건을 verification.md row "측정 결과 기록"에 명시.
- pre/post 모두 `/opt-prompt` 로 normalize 후 retro 까지 완료. retro row의 cost\* 비교가 단일 데이터 포인트.

raid 1 round = 데이터 포인트 1쌍 (baseline 1 + after 1). plan §10.3 power 재계산 시 n=10/cell 권장. 1차 라운드는 n=1로 directional 판단만.

---

## 5. Verdict 기준 + verification.md 갱신

verification.md §"Verdict 정의" 와 동일:

- **PASS**: 체크리스트 모두 통과 + 측정 결과가 plan 추정 ±50% 밴드 안.
- **FAIL**: 체크리스트 1건 이상 실패, 또는 측정 결과 절감이 음수 (regression).
- **NEEDS-REVIEW**: 체크리스트 통과했지만 측정 결과가 ±50% 밴드 밖. plan §10.4 + Tier ROI 재검토.

**verification.md row 채우는 절차**:

1. row의 "Fresh 세션 측정 결과" 칸 — 빈 블록 ("> _(빈 칸 …)_") 자리에 측정값 직접 덮어쓰기. 형식은 row 별 hint 참조.
2. "Verdict" 칸 — `PASS` / `FAIL` / `NEEDS-REVIEW` 한 단어 + 한 줄 사유.
3. "검증 체크리스트" — `[x]` 마킹.
4. row 신설이 필요한 경우 (1.1-A / 2.5 QW / 1.2-A) verification.md §"검증 row 템플릿" 복사 후 §"적용 이력" 맨 위에 추가.
5. **append-only 룰**: 잘못 채운 row는 strikethrough + 정정 row 추가. 삭제 금지.
6. FAIL row → 즉시 plan §11 Rollback 표의 트리거 명령어 실행 후 plan 본문 정정 PR 별도 생성.

---

## 6. 결과 보고

평가 에이전트 1회 통과 후 user에게 보고할 단일 메시지 형식:

```
[token-discipline batch 1 verification — 평가 결과]

- 1.3-A: PASS / FAIL / NEEDS-REVIEW (한 줄 사유)
- 1.4 옵션 E: …
- 1.1-A: …
- 2.5 QW: …
- 1.2-A: …

cost* baseline (4 row median): X.XXM
cost* after (raid 1, n=1): X.XXM
delta: -X.XX% (plan 추정 -Y%, sensitivity 0.05/0.10/0.15에서 robust 여부)

다음 액션: <batch 2 진입 / NEEDS-REVIEW raid 추가 / FAIL rollback>
```

batch 2 진입 결정은 user 승인 필요. 평가 에이전트이 자체 결정 금지.

---

## 7. 미적용 항목 (plan 본문만 참조)

batch 1 5 patch 외 항목은 **본 문서 적용 대상 아님**. 적용 시 verification.md row 신설 + 본 문서 §3에 절차 sub-section 추가.

| Tier     | plan 위치 | 비고                                  |
| -------- | --------- | ------------------------------------- |
| 1.1-B    | §4.1      | hook dispatcher dedup, 부작용 위험    |
| 1.1-C    | §4.1      | PostToolUse Serena echo 제거          |
| 1.2-B    | §4.2      | path-scoped 자동 주입, 1.2-A 후속     |
| 1.3-B    | §4.3      | SessionStart Serena schema pre-load   |
| 2        | §5        | CLAUDE.md routing 룰 + project memory |
| 3 (hold) | §7        | Commit hygiene, R5 5분 실측 후 결정   |

미적용 항목은 plan 본문이 source of truth — 본 문서에서 절차 추측 금지.
