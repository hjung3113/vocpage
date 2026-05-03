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

| Tier       | 변경 요지                                                                                                                                                                                                                                                                                                                                                                         | 백업 / 적용 위치                                                                                                                                 | 검증                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.3-A      | Serena 이중 등록 정리 (`mcp__plugin_serena_serena__*` 제거)                                                                                                                                                                                                                                                                                                                       | `vocpage/.claude/settings.local.json.bak.20260503` + `~/.claude/settings.json.bak.20260503` (commit `7583240`)                                   | 본 세션 정적 측정 PASS, fresh 세션 측정 미완                                                                                                                                                                       |
| 1.4 옵션 E | `opt-prompt` SKILL 2-skill split (normalize 306줄 + eval 181줄, append.sh `opt-prompt/`에 유지, `/opt-prompt-eval` 신규 트리거, normalize Step 2 끝에 reminder 1줄 자동 emit)                                                                                                                                                                                                     | `.claude/skills/opt-prompt/SKILL.md.bak.20260503` (원본 452줄, commit `a5c16a6`)                                                                 | 본 세션 정적 측정 PASS (cross-ref 0건, smoke test exit 0), fresh 세션 측정 미완                                                                                                                                    |
| 1.1-A      | `~/.claude/settings.json` env에 `OMC_SKIP_DELEGATION_NOTICES=1` 추가 (pre-tool-use.mjs:236, 354 [DELEGATION NOTICE] system-reminder 억제 — vocpage 직접 편집 룰과 충돌하는 noise 제거)                                                                                                                                                                                            | `~/.claude/settings.json.bak.20260503-batch1` (gitignored 외부 — repo 변경 없음)                                                                 | 본 세션 정적 측정 PASS (JSON validate OK), fresh 세션 noise 부재 측정 미완                                                                                                                                         |
| 2.5 QW     | 룰 텍스트 3건 in-place 강화: §6.1 root CLAUDE.md "Parallel tool calls"에 bash·Read chain 강조 append / §6.2 "Working Style"에 Pre-commit lint dry-run 신규 (`npm run lint -w frontend`) / §6.4 `.claude/CLAUDE.md` Token-Saving Protocol에 Test batch 신규 (FE/BE 워크스페이스별 단일 호출, parallel bash 권장, tsc/vitest split 금지). §6.3은 Tier 1.4 옵션 E로 자동 해소 → skip | `git revert` (root `CLAUDE.md` + `.claude/CLAUDE.md`)                                                                                            | 본 세션 정적 측정 PASS (line cap 200 준수: root 121, .claude 23), fresh 세션 행동 교정 측정 미완                                                                                                                   |
| 1.2-A      | leaf CLAUDE.md 69→8 keep + 61 삭제 (no stub). leaf "Role / When to look where" pointer를 8 keep ancestor에 sub-tree map 섹션으로 흡수. hookify rule #7 5 sub-bullet 의사결정 트리 → 8-keep set 3-line 룰로 축약. 4 commit 분리 (absorption / deletion / hookify / progress) 부분 revert 대비.                                                                                     | `git revert` (4 commit 모두 git tracked; graphify-out/CLAUDE.md는 .gitignore — repo 변경 없음) commit `f650b16` `7332925` `3296f9a` (+ progress) | 본 세션 정적 측정 PASS (8 keep 모두 200줄 cap 준수: root 131, backend 76, backend/src 20, frontend 73, frontend/src 60, docs 17, prototype 56, .claude 18; total 451; typecheck FE/BE clean), fresh 세션 측정 미완 |

검증 칸은 `docs/specs/reviews/token-discipline-verification.md`로 분리되어 있음. 다음 fresh 세션이 그 문서의 row를 직접 채움.

### 다음 세션 진입점 (2026-05-04+)

**우선 작업: 검증 가이드 문서 신규 작성** — fresh 세션이 PR #184 (main merged) 적용 전후 비교 측정을 일관 절차로 수행할 수 있게 하는 단일 진입 문서. 위치 후보: `docs/specs/reviews/token-discipline-test-guide.md` (verification.md와 별도 — verification.md는 row 박제용, test-guide는 measurement 절차 SOP).

문서 골격 후보:

- 측정 환경 정의 (fresh 세션 = 새 Claude Code 인스턴스, vocpage 디렉토리 진입, baseline 5K 이내 컨텍스트)
- baseline (PR #184 직전 main commit `668eaaa`) vs after (`6fc1cbe`) 측정 protocol
- 5건 patch별 절감 계산 절차 (cache_creation / cache_read / cost\* 0.05·0.10·0.15 가중치 sensitivity)
- 측정 task 표준화 (예: PR#175/178/180/182 reproduction task 3-5종 + retro JSONL 비교)
- verdict 기준 (PASS / FAIL / NEEDS-REVIEW) + verification.md row 채우는 방법

**그 후 batch 2 진입 결정** — verification 측정 결과 보고 1.1-B / 1.1-C / 1.2-B / 1.3-B / Tier 2 / 1.5 중 ROI 높은 순으로.

### 2단계 (완료) — 본 브랜치 1.2-A 적용 (batch 1 잔여)

**현황 (2026-05-03 본 세션 결과)**:

- ✅ Tier 1.1-A 적용 (commit `817c9be`) — `OMC_SKIP_DELEGATION_NOTICES=1`
- ✅ Tier 2.5 Quick Wins (3 룰) 적용 (commit `3fedfa4`) — root CLAUDE.md §6.1·§6.2 + .claude/CLAUDE.md §6.4
- ✅ Tier 1.2-A 적용 (4 commit, 본 세션) — leaf CLAUDE.md 69→8 keep + 61 삭제:
  - step 1 (`f650b16`): leaf 본문 ancestor 8개에 흡수 (sub-tree map 섹션 추가, 8 keep 모두 200줄 cap 준수, total 451줄)
  - step 2 (`7332925`): 60 leaf `git rm` (graphify-out/CLAUDE.md는 .gitignore 적용 → 로컬 rm만, 실효 삭제 61)
  - step 3 (`3296f9a`): hookify rule #7 → 8-keep set 3-line 룰 (의사결정 트리 5 sub-bullet 폐기)
  - step 4 (본 commit): progress 문서 갱신

**전략**:

1. ✅ 본 브랜치 위에서 1.2-A 직접 적용 완료 (4 commit).
2. ✅ main 분기 + 5건 한 묶음 머지 완료 — **PR #184 merged 2026-05-03 (merge commit `6fc1cbe`)**. 분기 브랜치 `feat/token-discipline-batch1` 6 commit (1.4 / 2.5 QW / 1.2-A step 1·2·3 / docs/specs/README.md align). PR 본문은 generic 표현 (Tier·token-discipline 명칭 회피, blind test 보존). 1.3-A + 1.1-A는 외부 settings 변경이라 repo cherry-pick 없음 — PR 본문/changelog 메타로만.
3. ⏳ 검증 (verification 문서 row 채움)은 main 머지된 5건 효과를 fresh 세션이 처리. 검증 가이드 문서는 다음 세션에서 신규 작성 (아래 §"다음 세션 진입점" 참조).

**1.2-A 작업 (적용 완료)**:

| 항목      | 내용                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 변경      | sub-CLAUDE.md 69 → 8 keep + 61 삭제 (no stub). leaf 본문 ancestor 8개에 흡수.                                                                                                                       |
| 8 keep    | root, `.claude`, `frontend`, `backend`, `frontend/src` (50-80줄 디렉토리 맵), `backend/src` (50-80줄 디렉토리 맵), `docs`, `prototype`. 50-80줄 cap 위반 시 frontend/src·backend/src는 80-100 양보. |
| 작업 시간 | ~2-3시간 (leaf 본문 분류 + 흡수 + 삭제 + hookify 패치)                                                                                                                                              |
| 위험도    | 중간 — 흡수 누락 시 leaf 도메인 가이드 손실                                                                                                                                                         |
| 롤백      | `git revert` (4 commit 모두 git tracked)                                                                                                                                                            |
| 추정 절감 | -200-400K (단일 최대 절감 patch)                                                                                                                                                                    |

**커밋 분리** (4 commit, 부분 revert 대비):

1. leaf 본문 ancestor 흡수 (8 keep CLAUDE.md 갱신)
2. 61 leaf CLAUDE.md 삭제
3. **hookify 패치** — `vocpage/.claude/hookify.warn-doc-cleanup-before-pr.local.md` L18-23 (현재 step 7 "Refresh CLAUDE.md ..." 5 sub-bullet) 통째 교체:

   ```
   7. **CLAUDE.md 8-keep set** — only `root`, `.claude`, `frontend`, `backend`, `frontend/src`, `backend/src`, `docs`, `prototype`. Update one of these only if its `## Role` / `## When to look where` changed in this PR.
      - No new leaf CLAUDE.md outside the 8-keep set — fold any directory guidance into the nearest ancestor.
      - No stub on delete — `→ ancestor.md` one-liners are auto-loaded noise.
   ```

   사유: 기존 L18-23은 PR마다 leaf 추가/삭제 판단을 요구 — 1.2-A baseline 후 의사결정 트리가 "8 keep 중 변경됐나?" 하나로 축약되어 기존 5 sub-bullet 자체가 obsolete.

4. progress 문서 (본 파일) 업데이트 + verification 문서 row 추가

**사용자 추가 확인 사항** (다음 세션 진입 직후 사용자에게 먼저 질의):

- 1.2-A 적용 전 추가로 확인하고 싶은 부분이 있다고 함 (2026-05-03 본 세션 종료 시점). 진입 직후 사용자에게 먼저 묻고 시작.

**제외한 후보 + 사유** (참고용 보존):

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
