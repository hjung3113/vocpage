# Token-Discipline Branch Progress

> **이 파일은 `docs/token-discipline-plan` 브랜치 전용 진행 추적 파일이다.**
> Main의 `claude-progress.txt`는 본 브랜치 작업과 무관하게 main 상태 유지.
> 본 브랜치는 토큰 절감 plan **blind test** 환경 — 다른 세션이 fresh 시작해 측정 정합성을 확보하기 위함.
> **머지 시점에 이 파일은 삭제** (root `CLAUDE.md`의 BRANCH-NOTE 블록도 함께 제거).

---

## 브랜치 목적

- PR #177 (`docs(plan): token-discipline Tier 1/1.5/2 implementation plan (next session)`) — OPEN
- 단일 plan 문서 finalize: `docs/specs/plans/token-discipline-plan.md` (v4, 560줄)
- **다음 세션은 본 plan §8 실행 순서 따라 patches 적용** — 본 브랜치에서 진행, main 영향 없음

---

## 현재 상태 (2026-05-03)

### 완료

- v3 consolidation (commit `89f26e4`) — review v2 단일 plan fold-in
- v4 pre-flight 정정 (commit `2002921`) — PR #177 3 reviewer (critic·debugger·document-specialist) BLOCK 7건 + NIT 6건 정정 + 5 part 재구조화

### Tier 1.4 검증 체크리스트 (다음 fresh 세션, normalize/eval 양쪽 sanity)

1. fresh 세션 deferred-skills 목록에 **`opt-prompt`** + **`opt-prompt-eval`** 둘 다 등장. 두 description이 서로 retro/normalize를 명확히 분리해야 함.
2. `/opt-prompt <짧은 prompt>` 실행 → SKILL.md 306줄만 로드 (이전 452 → -32%). Step 1 helper 호출 → Step 2 block emit → 마지막에 `// reminder: invoke /opt-prompt-eval <decision_id>` 한 줄 자동 emit 확인.
3. 동일 세션에서 `/opt-prompt-eval <위 decision_id>` 실행 → opt-prompt-eval 스킬 단독 로드 (181줄), 8 questions 진행, `append.sh retro` 호출, retro row append 성공.
4. `--review` 분기: `/opt-prompt-eval --review` → 로그 join + 제안만 출력, normalize SKILL.md 자동 편집 0.
5. legacy 호환: `/opt-prompt --eval` 호출 시 normalize 스킬이 anti-pattern으로 감지, "redirect to /opt-prompt-eval" 응답.
6. B3 dual-fire 측정 (선택): C-11 패턴 재현 task 1회 + retro 1회로 cache_creation 25-35K 절감 직접 관측. 미달 시 description keyword 충돌 의심 → 두 스킬 description의 trigger 단어 분리 정확도 재검토.

### v4 핵심 변화 (vs v3)

1. **D4 ToolSearch weight 강등 무효화** — C-11 0 fire는 도메인 밖 inadmissible. `[required on ToolSearch-heavy tasks]` 복원
2. **D7 task shape driver 폐기** — residual-as-driver = circular. §2 Unattributed variance로 이전
3. **Quick Wins 5룰 → 4룰** — §2.5.5 (TSX Serena routing)는 root CLAUDE.md L48-52 pure-duplicate + hookify 제안이 `feedback_serena_first.md` contradiction이라 drop
4. **PNG 절감 수치 폐기** — base64 byte vs image token 혼동 ~10× 오류. raid 측정에서 결정
5. **Tier 1.1-B / Tier 1.3-A rollback 경로 정정** — debugger path-error 발견 (`pre-tool-use.mjs` backup-and-restore + Serena 등록 사전 trace)
6. **Tier 1.2-A 재정의** — 68→6 (stub) → 69→8 keep + 61 삭제 (no stub) + Tier 2 결합 가설 (TS/TSX 도메인 inject ≈ 0)
7. **§10.4 cost\* 가중치 sensitivity 표 신설** + power 재계산 단계 (§10.3)

### 8 keep 디렉토리 (Tier 1.2-A 재정의)

- `root/CLAUDE.md`
- `.claude/CLAUDE.md`
- `frontend/CLAUDE.md`
- `backend/CLAUDE.md`
- `frontend/src/CLAUDE.md` (50-80줄 디렉토리 맵)
- `backend/src/CLAUDE.md` (50-80줄 디렉토리 맵)
- `docs/CLAUDE.md`
- `prototype/CLAUDE.md`

나머지 61개 leaf CLAUDE.md → ancestor 8개 본문에 흡수 후 삭제 (no stub).

---

## 검증 추적 문서

**[docs/specs/reviews/token-discipline-verification.md](docs/specs/reviews/token-discipline-verification.md)** — 각 Tier patch 적용 후 fresh 세션에서 절감 측정 결과를 박제. 적용 직후엔 정적 측정만 채워두고, 다른 세션이 fresh 환경에서 체크리스트 통과 + 측정 결과 칸을 직접 채움. PASS / FAIL / NEEDS-REVIEW verdict.

현재 row:

- Tier 1.3-A (Serena 이중 등록 정리) — 본 세션 정적 측정 PASS, fresh 세션 측정 미완
- Tier 1.4 옵션 E (opt-prompt 2-skill split) — 본 세션 정적 측정 PASS, fresh 세션 측정 미완

---

## 다음 세션 진입점 (blind test)

**중요**: 다음 세션은 **본 브랜치에서 새로 시작** — main `claude-progress.txt`는 보지 말고 본 파일과 plan §8을 따라.

### 1단계 — 본 plan v4 머지 결정

본 브랜치 PR #177은 **머지하지 않음** (blind test 환경 보존). 다음 세션이 본 브랜치 위에서 plan §8 실행.

### Tier 1.3-A 적용 결과 (2026-05-03 세션, 미검증)

이중 등록 실측 확인 후 plugin form 제거 + matcher 정리 완료. **변경 자체는 다음 fresh 세션에서 발효**됨.

| 파일                                     | 변경                                                                                     | 백업            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| `vocpage/.claude/settings.local.json:13` | `serena@claude-plugins-official: true → false`                                           | `.bak.20260503` |
| `~/.claude/settings.json:61`             | PostToolUse matcher `mcp__serena__.*\|mcp__plugin_serena_serena__.*` → `mcp__serena__.*` | `.bak.20260503` |

근거: direct serena (`~/.claude.json:2208`, `/Users/hyojung/.local/bin/serena`)는 `--context=claude-code`로 surface 18개(심볼 위주)만 노출, plugin form은 풀 surface 29개 노출. plugin에만 있는 11개(`search_for_pattern`, `find_file`, `list_dir`, `execute_shell_command`, `read_file`, `find_declaration`, `find_implementations`, `activate_project`, `create_text_file`, `get_current_config`, `get_diagnostics_for_file`)는 vocpage 룰상 native 도구로 대체 가능.

**다음 세션 검증 체크리스트** (Tier 1.4 시작 전 반드시 통과):

1. `claude mcp list | grep -i serena` → `serena: serena start-mcp-server …` 1줄만 보여야 함 (`plugin:serena:serena` 사라짐)
2. deferred tools list에서 `mcp__plugin_serena_serena__*` prefix 0건 + `mcp__serena__*` 18개 잔존
3. `vocpage/.claude/settings.json`의 `serena-hooks` 훅이 정상 fire하는지 (PreToolUse / SessionStart / Stop) — 세션 로그에 hook output 확인
4. 어느 항목 하나라도 실패하면 즉시 rollback: `mv .bak.20260503 원본` (두 파일)

### 적용 완료 (이번 세션, 2026-05-03)

| Tier       | 변경 요지                                                                                                                                                                              | 백업 / 적용 위치                                                                                               | 검증                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1.3-A      | Serena 이중 등록 정리 (`mcp__plugin_serena_serena__*` 제거)                                                                                                                            | `vocpage/.claude/settings.local.json.bak.20260503` + `~/.claude/settings.json.bak.20260503` (commit `7583240`) | 본 세션 정적 측정 PASS, fresh 세션 측정 미완                                    |
| 1.4 옵션 E | `opt-prompt` SKILL 2-skill split (normalize 306줄 + eval 181줄, append.sh `opt-prompt/`에 유지, `/opt-prompt-eval` 신규 트리거, normalize Step 2 끝에 reminder 1줄 자동 emit)          | `.claude/skills/opt-prompt/SKILL.md.bak.20260503` (원본 452줄, commit `a5c16a6`)                               | 본 세션 정적 측정 PASS (cross-ref 0건, smoke test exit 0), fresh 세션 측정 미완 |
| 1.1-A      | `~/.claude/settings.json` env에 `OMC_SKIP_DELEGATION_NOTICES=1` 추가 (pre-tool-use.mjs:236, 354 [DELEGATION NOTICE] system-reminder 억제 — vocpage 직접 편집 룰과 충돌하는 noise 제거) | `~/.claude/settings.json.bak.20260503-batch1` (gitignored 외부 — repo 변경 없음)                               | 본 세션 정적 측정 PASS (JSON validate OK), fresh 세션 noise 부재 측정 미완      |

검증 칸은 `docs/specs/reviews/token-discipline-verification.md`로 분리되어 있음. 다음 fresh 세션이 그 문서의 row를 직접 채움.

### 2단계 — 다음 세션 작업: 본 브랜치에 batch 1 적용

**전략 (2026-05-03 사용자 확정, 명확히)**:

1. **다음 세션은 본 브랜치 (`docs/token-discipline-plan`) 위에서 그대로 진행** — 신규 브랜치 만들지 말 것.
2. 본 브랜치에 batch 1 (1.2-A + 1.1-A + 2.5 Quick Wins, 3건) 3 commit 적용.
3. **그 이후 별도 브랜치를 main에서 분기 → 1.3-A + 1.4 + batch 1 = 총 5건을 한 묶음으로 main에 머지** (5 commit cherry-pick 또는 squash).
4. 검증 (verification 문서 row 채움)은 main 머지된 5건을 fresh 세션이 한 번에 처리.

**batch 1 — 부작용 거의 없는 + 거의 확실한 3개 (최종 확정)**:

| #   | Tier                                          | 변경                                                                                                                                                                                                                               | 백업/롤백               | 위험도                                                          | 추정 절감                        |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------- | -------------------------------- |
| 1   | **1.2-A** (사용자 명시 요청)                  | sub-CLAUDE.md 69 → 8 keep + 61 삭제 (no stub). leaf 본문 ancestor 8개에 흡수. **유지 8개**: root, `.claude`, `frontend`, `backend`, `frontend/src` (50-80줄 디렉토리 맵), `backend/src` (50-80줄 디렉토리 맵), `docs`, `prototype` | `git revert`            | 중간 (~2-3시간 흡수 작업, 흡수 누락 시 leaf 도메인 가이드 손실) | -200-400K (단일 최대 절감 patch) |
| 2   | **1.1-A**                                     | `~/.claude/settings.json` env에 `OMC_SKIP_DELEGATION_NOTICES=1` 1줄 추가                                                                                                                                                           | `.bak.<ts>` 백업 → `mv` | 최저 (1줄 편집, hook script 코드 변경 0)                        | -2K direct                       |
| 3   | **2.5 Quick Wins (룰 텍스트 4건 → 실질 3건)** | root `CLAUDE.md` parallel batch 강화 (§6.1) + lint dry-run 신규 (§6.2) + tsc+vitest batch 신규 (§6.4). `.claude/CLAUDE.md` Token-Saving Protocol에 §6.4 위치. **§6.3은 Tier 1.4 옵션 E 적용으로 자동 해소됨, skip**                | `git revert`            | 최저 (룰 텍스트만, 코드 영향 0)                                 | -200-400K (overlap caveat)       |

**선결 작업 (batch 1 실행 시 첫 단계)**:

- §6.2 lint 명령: `package.json scripts` 직접 확인 → `npm run lint` placeholder 실 명령어로 교체
- 1.2-A leaf 흡수: 61개 leaf CLAUDE.md 사전 검토 후 의미 있는 가이드라인만 ancestor 8개에 추가, stub 안 남김. 50-80줄 cap 위반 시 frontend/src·backend/src 본문 cap 80-100줄까지 양보 허용

**커밋 분리** (PR 1건 안에): 4개 별도 commit (1.2-A leaf 흡수 + 1.2-A 삭제 / 1.1-A / 2.5 Quick Wins) — 부분 revert 대비.

**제외한 후보 + 사유**:

- **1.1-B** (hook dispatcher dedup): hook script 직접 편집, 부작용 위험. batch 2 후보.
- **1.1-C** (PostToolUse Serena echo matcher 삭제): 안전도 높지만 Serena 관련 추가 변경은 batch 1.3-A 검증 후로 미룸 (사용자 결정 2026-05-03).
- **1.2-B** (path-scoped 자동 주입): 선결 trace 필요, 1.2-A 후속.
- **1.3-B** (SessionStart Serena schema pre-load): paired test 권장.
- **Tier 2** (CLAUDE.md routing 룰 강화): 행동 교정 측면 — Quick Wins와 효과 분리 위해 batch 2로.

**verification 문서 운영**: main에 5건 머지 후 fresh 세션 1회로 일괄 측정·verdict. 결과 보고 batch 2 (남은 항목 = 1.1-B / 1.1-C / 1.2-B / 1.3-B / Tier 2 / 1.5 등) 진행 여부 결정.

### 3단계 — 5건 main 머지 후

- main `claude-progress.txt`에 5건 적용 사실 1블록 추가 (이 브랜치 progress 파일과 별개)
- 본 브랜치는 plan + verification 추적용으로 계속 유지 (PR #177 OPEN)
- 다음 fresh 세션이 본 파일 + verification 문서 동시 업데이트

---

## Baseline 측정 보존 (paired raid 비교 기준)

| Session                                | LOC | cache_creation | cache_read | cost   | cost\* (+0.1×cache_read) |
| -------------------------------------- | --- | -------------- | ---------- | ------ | ------------------------ |
| PR #175 (F-1/2/3 bundle)               | 220 | 3.39M          | 54.34M     | 3.39M  | 8.82M                    |
| PR #178 (F-bundle minor)               | 56  | 1.16M          | 14.77M     | 1.16M  | 2.64M                    |
| PR #180 (C-10 NotifButton+NotifPanel)  | 324 | 2.40M          | n/a        | ~2.40M | n/a                      |
| **PR #182 (C-11 VocCreateModal+Atom)** | 350 | 2.73M          | 54.97M     | 2.73M  | 8.23M                    |

근거: `~/.claude/opt-prompt/opt-prompt-log.jsonl` 4 retro rows.

---

## 미해결 결정 (다음 세션 인계)

- **§6.2 lint 명령**: `package.json` scripts 확인 후 `npm run lint` placeholder를 실 명령어로 교체
- **§10.4 sensitivity 표**: raid 1 후 0.05 / 0.10 / 0.15 가중치로 4 세션 cost\* 재계산. Tier ROI 순위가 3 가중치 모두에서 동일하면 robust
- **§10.3 power 재계산**: cost\* 분산 σ/μ 산출 후 n=10/cell 검증. underpowered면 표본 추가
- ~~**Tier 1.4 SKILL.md split 분기**~~ — **결정 완료 (v4.1, 2026-05-03)**: 옵션 E (2-skill split: `opt-prompt` normalize + `opt-prompt-eval` retro)로 확정. 옵션 A(references/) 흡수, 옵션 D(helper 직접 호출)는 §6.3 fallback으로만 유지

---

## 머지 시 정리

본 브랜치 main 머지 시:

1. `claude-progress-token-discipline.md` 삭제 (이 파일)
2. root `CLAUDE.md` 의 `<!-- BRANCH-NOTE: token-discipline-plan -->` 블록 제거
3. `claude-progress.txt`에 token-discipline plan 적용 결과 + 다음 작업 (δ-batch C-12) 한 블록 추가
