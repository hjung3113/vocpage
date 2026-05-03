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

### 2단계 — plan §8 실행 순서 (v4.1: 1.3-A + 1.4 옵션 E 우선)

```
1. Tier 1.3-A — Serena 이중 등록 정리 (우선)  ✅ 적용 완료 (2026-05-03), 검증 미완
   - 검증: 위 체크리스트 4항 통과 후 다음 단계로

2. Tier 1.4 옵션 E — opt-prompt SKILL을 2 skill로 split (우선)
   - .claude/skills/opt-prompt/ → normalize 모드만 (1–277 + 407–452 잔류)
   - .claude/skills/opt-prompt-eval/ 신설 → eval/review/anti-patterns + append.sh 이동
   - cross-ref grep: append.sh / --eval / opt-prompt-log.jsonl 호출 root CLAUDE.md, .claude/CLAUDE.md, 다른 skills, hooks
   - dummy retro 1회로 검증 (C-11 패턴 재현, JSONL row append 정상)

3. Tier 2.5 Quick Wins (4 룰)
   - §6.1 parallel batch / §6.2 pre-commit lint dry-run / §6.3 (Tier 1.4 옵션 E의 fallback) / §6.4 tsc+vitest batch
   - §6.2 lint 명령은 package.json scripts 확인 후 확정

4. Tier 1.1-A — `OMC_SKIP_DELEGATION_NOTICES=1` env entry

5. Tier 2 — root CLAUDE.md tool-routing 강화 + project memory narrowing

5.5. **Raid 1 — Tier 2 적용 후 가설 검증**
   - TS/TSX 도메인 inject ≈ 0 가설 직접 측정
   - → Tier 1.2-A 진행 여부 결정 (≥-100K 잔존 share면 진행)

6. Tier 1.2-A — 69→8 keep + 61 삭제

7. Tier 1.1-C — PostToolUse Serena echo 제거

8. 측정 raid 1 — cost* + independent variable 사전 등록

9. Tier 3 5분 실측 → Tier 1.5 살림/폐기 결정

10. 측정 raid 2 — paired comparison (§10)

11. Tier 1.1-B + Tier 1.2-B + Tier 1.3-B (ToolSearch fire ≥3회 task로 paired test 후)
```

### 3단계 — Post-flight + 머지

§9.2 post-flight 3 reviewer all PASS 후 본 브랜치 main 머지.

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
