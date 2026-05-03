# Token Discipline — Consolidated Plan (v4, post-pre-flight)

> **목적**: 무패치 baseline 세션이 소비하는 cache_creation + cache_read 토큰을 줄인다.
> **상태**: v4는 v3 + PR #177 pre-flight (3 reviewer: critic·debugger·document-specialist) BLOCK 7건 + minor NIT 6건 정정. 본 plan은 다음 세션에서 실행 — 본 세션은 결정 + 측정 baseline 잠금만.
> **근거 보존 원칙**: 모든 driver·Tier·revision에 `근거:` 줄로 출처(reviewer ID·obs ID·세션 ID·정량 추정)를 남긴다.
> **v3 → v4 변경 요약은 §13 통합 audit 표 참조** (v1→v2→v3→v4 단일 표로 정리).

## 문서 구조

```
PART 1 — 진단 (state)        §0 baseline · §1 driver · §2 unattributed variance
PART 2 — 실행 계획 (action)  §3 Tier 개요 · §4 Tier 1 · §5 Tier 2 · §6 Tier 2.5 · §7 Tier 3 · §8 실행 순서
PART 3 — 검증 (verify)       §9 reviewer 프로토콜 · §10 측정 · §11 rollback · §12 합격 기준
PART 4 — Audit               §13 v1→v4 통합 audit · §14 reviewer audit guide
PART 5 — Appendix (evidence) §15~§20
```

---

# PART 1 — 진단

## §0 측정 baseline (4 무패치 세션)

| Session                                | LOC | Files | Commits | input  | output  | cache_read | cache_creation | **cost (input + cache_creation)** | **cost\* (+0.1×cache_read)** |
| -------------------------------------- | --- | ----- | ------- | ------ | ------- | ---------- | -------------- | --------------------------------- | ---------------------------- |
| PR #175 (F-1/2/3 bundle)               | 220 | mixed | 5       | 2,482  | 240,406 | 54.34M     | 3.39M          | **3.39M**                         | **8.82M**                    |
| PR #178 (F-bundle minor)               | 56  | 4     | 1       | 1,038  | 93,188  | 14.77M     | 1.16M          | **1.16M**                         | **2.64M**                    |
| PR #180 (C-10 NotifButton+NotifPanel)  | 324 | 9     | 1       | 1,536+ | 158,856 | n/a        | 2.40M          | **~2.40M** (delta absent)         | n/a                          |
| **PR #182 (C-11 VocCreateModal+Atom)** | 350 | 6     | 4       | 2,796  | 308,190 | 54.97M     | 2.73M          | **2.73M**                         | **8.23M**                    |

근거: `~/.claude/opt-prompt/opt-prompt-log.jsonl` (4 retro rows). C-11 row id = `opt-20260503T063921Z-c-11-voc-create-modal`.

**관찰**:

- 분포 1.16M~3.39M (2.9× spread). LOC·commit 수 dominant driver 아님.
- C-11 cache_read 54.97M = cache_creation의 **20.1×**. cost 정의가 `input + cache_creation`만 캡처하면 실제 $ 비용의 ~33%만 측정함 → cost\* 정의 도입 (§10 적용).
- LOC 350(C-11) > LOC 220(PR #175)인데 cost ↓ → 세션 task 차이가 흡수 (§2 unattributed variance 참조).
- **세션 간 절대량 비교 무의미** — 작업 내용이 모두 다르므로 절대 토큰 절감 임계치는 paired comparison 형태에서만 의미 (§10 적용).

---

## §1 비용 드라이버 표 (D1~D6)

근거: review v2 §1~§4 + PR #182 5인 재리뷰 (A1·A2 informed + B1·B2·B3 single-transcript review). v4에서 weight 정정된 항목은 `[v4-revised]` 표시.

| Driver                                                                            | weight 추정 (per fire / per session)                                                                     | 합의 강도                                                                                                 |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **D1 — 세션 시작 페이로드** (CLAUDE.md stack + AGENTS.md + MEMORY.md + Serena ×2) | ~8K direct                                                                                               | B3 단독                                                                                                   |
| **D2 — Sub-CLAUDE.md per-Read 재주입** (path-dedup 부재)                          | ~6K direct + ~370K 간접 (single-session estimate, ±50% band) `[v4-revised]`                              | Expert 2 + B1·B3 (PR#180) + B1·B2·B3 (PR#182, **단일 transcript reviewed by 3 reviewers — N=1, not N=3**) |
| **D3 — Hook reminder firehose** (Bash 1회당 1-4개 reminder; task별 분산)          | per-Bash ≈ 3 reminders × 26-80 tok × invalidation_multiplier; per-session 50K~720K (task-shape dep)      | 5/5 (PR#180) + A1 (PR#182) — base rate task 의존                                                          |
| **D4 — ToolSearch mid-session prefix invalidation** (per fire)                    | per-fire ≈ 200-500K cache invalidation; per-session 0 ~ -1.2M (ToolSearch fire 횟수 비례) `[v4-revised]` | Expert 1 (PR#178) + B1·B3 (PR#180); C-11 0 fire 자연실험 = D4 도메인 밖, weight 미감산                    |
| **D5 — Serena MCP 이중 등록** (`serena` + `plugin:serena:serena`)                 | ~1.5K ×2 (등록 시점)                                                                                     | B3 단독                                                                                                   |
| **D6 — 전체 파일 Read 잔류** (Serena symbol-scoped read 대신 full-file)           | ~150-800K cache_read 누적 (task별)                                                                       | B1·B2 (PR#180) + B1 (PR#182)                                                                              |

**v4 핵심 정정**:

- **D2 ±50% band**: B1 PR#182의 "12 files × 8 events × 3,840 tok ≈ 370K (13.5%)" 은 single-transcript reconstruction. uniform 사이즈 가정 + injection event 8회 추정이 모두 한 점. 신뢰 구간 명시.
- **D3 task-conditional**: 절대 절감 범위 표기 대신 per-Bash formula. C-11 7-8 fire / PR#180 가정 150 fire의 1/10 분산을 task-shape dependency로 표현.
- **D4 task-conditional**: PR#180에서 -1.2M 추정, C-11 0 fire. C-11은 D4 도메인 밖이므로 weight 강등 evidence 아님 ("ToolSearch-zero session inadmissible"). per-fire cost로 표기, ToolSearch heavy task에서만 saving 발생.
- **D7 (task shape) 폐기**: residual을 driver로 라벨한 것은 circular reasoning. §2로 이전.

근거-v4: critic pre-flight (PR #177) — D2/D3/D4 framing 정정, D7 driver 표에서 제거.

---

## §2 Unattributed variance

PR #175(220 LOC, mixed-layer) cost 3.39M vs C-11(350 LOC, FE-only) cost 2.73M. **LOC 더 큰 C-11이 cost 적게 나오는 역전 -660K**. v3는 이 차이를 driver D7 "task shape"로 흡수했으나 v4에서 폐기.

**가설** (분해 미완 — driver 미등재):

- (a) screenshot count 차이 — image token 비용 (C-11 단일 PNG 반복 로드, PR#175 미상)
- (b) subagent invocation 횟수 차이 — 별도 context 생성 비용
- (c) FE-vs-mixed inject pattern 차이 — sub-CLAUDE.md 자동 inject 트리 형태
- (d) ToolSearch fire 횟수 차이 — D4와 직접 연결

**원칙**: 분해 + 정량 측정 전까지 driver 등재 금지. §10 paired-replay 시 위 4 변수를 **independent variable로 사전 등록**해 분해.

근거-v4: critic — "residual을 driver로 라벨한 것은 circular reasoning. paired-replay 설계도 task shape 매칭이 아니라 변수 분해여야 함."

---

# PART 2 — 실행 계획

## §3 Tier 개요

| Tier         | 영역                                                                                    | 추정 절감                                                                     | ROI 등급                                                 | 위험                                |
| ------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| **1.1-A**    | Hook env entry (`OMC_SKIP_DELEGATION_NOTICES=1`)                                        | -2K direct                                                                    | `[marginal, cheap]`                                      | 낮음                                |
| **1.1-B**    | Hook dispatcher dedup patch (`pre-tool-use.mjs` 직접 편집)                              | -50-720K (task-shape dep, D3 follow)                                          | `[task-conditional, mid-cost]`                           | 낮음 (백업-and-restore 롤백)        |
| **1.1-C**    | PostToolUse Serena echo 제거                                                            | per-Serena-call ~수십 토큰 (Serena 호출 0인 task엔 noise)                     | `[task-conditional]`                                     | 낮음                                |
| **1.2-A**    | Sub-CLAUDE.md 통합 (69개 → 8개 keep + 61개 삭제, no stub) + Tier 2 결합                 | -200-400K (single-session ±50% band, Tier 2 결합 시 TS/TSX 도메인 inject ≈ 0) | **`[high-value, mid-cost, depends on Tier 2 + raid 1]`** | 중간 (leaf 본문 ancestor 흡수 필요) |
| **1.2-B**    | Path-scoped 자동 주입 (CC platform fix 또는 OMC hook)                                   | -100-200K (1.2-A 후속, 비-TS/TSX 도메인 잔존 inject 대상)                     | `[high-value, blocked-on-trace]`                         | 중간 (선결: 발신자 trace)           |
| **1.3-A**    | Serena 이중 등록 정리 — `mcp__serena__*` 유지, plugin namespace 제거                    | ~3K direct (등록 시점)                                                        | `[cheap, low-saving]`                                    | 중간 (실 등록 경로 trace 선결)      |
| **1.3-B**    | SessionStart Serena schema pre-load                                                     | per-fire 200-500K × ToolSearch fire 횟수 (ToolSearch heavy task에서만 active) | **`[required on ToolSearch-heavy tasks]`**               | 중간 (paired test 권장)             |
| **1.4**      | opt-prompt SKILL.md `references/` lazy-load (또는 옵션 D 우회)                          | -2.5~25K direct + dual-fire 25-35K cache_creation (B3 PR#182)                 | `[marginal, cheap]`                                      | 낮음                                |
| **2**        | CLAUDE.md tool-routing + project memory `name_path_pattern` trap                        | 행동 교정 → D6 차단                                                           | `[behavior-fixable, retain]`                             | 중간                                |
| **2.5**      | Quick Wins (4 룰: parallel batch / lint dry-run / opt-prompt gating / tsc+vitest batch) | -200-400K (overlap with D3 미해소, single-session estimates)                  | `[high-ROI, low-cost]`                                   | 낮음 — protocol-level               |
| **3** (hold) | Commit hygiene (single-commit + fixup)                                                  | ?? — N=4에서 commit 수와 cost 무상관                                          | `[hold pending R5 5분 실측]`                             | hold                                |

**v4 정정 요약** (vs v3):

- Tier 1.3-B `[drop 후보]` → `[required on ToolSearch-heavy tasks]` 복원 (D4 강등 무효화)
- Tier 2.5 5룰 → 4룰 (§2.5.5 TSX Serena routing은 root CLAUDE.md L48-52와 pure-duplicate라 drop)
- Tier 1.1-B rollback 경로 정정 (§11 참조)
- Tier 1.3-A 명시: `mcp__serena__*` 유지 / `mcp__plugin_serena_serena__*` 제거
- **Tier 1.2-A 재정의**: 68→6 (stub) → 69→8 keep + 61 delete (no stub). Tier 2 (Serena routing) 결합 효과 명시 — TS/TSX 도메인 inject ≈ 0 가설. raid 1로 가설 검증 후 1.2-A 진행 여부 결정 (§8 step 4.5 신설)

---

## §4 Tier 1 — Platform-level Patches

### §4.1 Tier 1.1 — Hook Reminder Dedup

**진단**: PR #180 세션에서 Bash 1회 호출당 PreToolUse reminder가 1-4개 fire (현재 hook 구성 기준 1-2개, PR#180 당시 max ~4). 50+ 도구 호출 × 평균 3 reminder = ~150회 중복 reminder 주입 (PR#180 가정). 각 ~26-80 토큰. 직접 비용 ~2K, 간접 비용 (suffix breakpoint 무효화) per-session 50-720K (task-shape dep).

**근거**: review1 M5 + review2 G1 (3 expert 만장일치) + PR #180 5인 (A1·A2·B1·B3 5/5) + A1 (PR#182, 7-8 fire 추정 → base rate 1/10 변동).

**v4 정정**: v3 "Bash 1회당 ~4개 발사" → "1-4개 (현재 hook 구성 1-2개, PR#180 max ~4)" — debugger pre-flight 실측 반영.

**변경**:

- **A. Hook env entry**: `~/.claude/settings.json` env 섹션에 `OMC_SKIP_DELEGATION_NOTICES=1` (또는 동등). reminder 일부 카테고리 끔.
- **B. Hook dispatcher dedup patch**: `~/.claude/hooks/pre-tool-use.mjs` 직접 편집 — 동일 reminder 카테고리 단일 호출당 1회만 fire하도록 dedup logic 추가.
- **C. PostToolUse Serena echo 제거**: `~/.claude/settings.json` PostToolUse `mcp__serena__.*|mcp__plugin_serena_serena__.*` matcher 항목 삭제 (Serena 호출 시마다 echo fire — Serena heavy task에서 noise 누적).

### §4.2 Tier 1.2 — Sub-CLAUDE.md 통합 + Path-scoped 주입

**진단**: 본 repo CLAUDE.md 파일 수: **69개** (실측). PR #180 세션 16개 발사. C-11 세션 12개 발사. 발사 조건: 자동 주입 (Read 호출시 해당 디렉토리 + 모든 조상 디렉토리 CLAUDE.md). dedup 없음.

**근거**: B1 PR#182 single-transcript estimate — 12 files × 8 injection events × 3,840 tokens ≈ ~370K tokens (13.5% of 2.73M, ±50% band). C-11에서 일부는 off-path: `frontend/src/components/CLAUDE.md` 등 (AttachmentZone는 `shared/ui/`인데 무관한 components/ 하위 inject).

review v2 §3 + PR #180 5인 (4/5) + PR #182 single-transcript reviewed by 3 reviewers (B1·B2·B3 동일 결론 — independent N=3 아님).

A2 (PR#182): 유일 "high-value" 등급 patch.

**v4 핵심 통찰** (사용자 + 본 세션 정황 가설):

- **Edit 도구는 사전 Read 후 추가 inject fire 안 함** — Edit 자체가 inject 트리거 아님. 비용 시점은 Read 호출 시점뿐.
- **Serena MCP 도구 (`find_symbol`, `get_symbols_overview` 등)는 inject 트리거 안 함** (정황 가설 — C-11 0 Serena 호출 + 12 inject events 데이터와 일치). MCP 프로토콜 경유라 CC Read 메커니즘 미경유.
- → TS/TSX 작업이 Tier 2 (Serena routing)로 완전 전환되면 **TS/TSX 도메인 inject 비용 ≈ 0**. 비-TS/TSX (md/config/JSON/script) Read만 inject 잔존.
- 이 가설은 §10 paired raid 1에서 직접 검증 (§8 step 4.5).

**변경**:

- **A. 69개 → 8개 keep + 61개 삭제 (no stub)**:
  - **유지 8개**: root, `.claude`, `frontend`, `backend`, `frontend/src` (50-80줄 디렉토리 맵), `backend/src` (50-80줄 디렉토리 맵), `docs`, `prototype`
  - **삭제 61개**: leaf CLAUDE.md 본문 사전 검토 후 의미 있는 가이드라인은 ancestor 8개에 흡수. stub 안 남김 (`→ ancestor.md` 1줄도 noise).
  - **Tier 2 결합 효과**: TS/TSX 도메인 작업은 Serena routing → inject 0회. 비-TS/TSX (md/config) Read만 ancestor chain inject (max 3 ancestors, e.g., root + docs + docs/specs).
  - **자동 inject 최악 케이스**: 현재 5+ ancestor → v4 적용 후 max 3 ancestor.
  - **leaf-knowledge 마이그레이션**: 작업 분량 ~2-3시간. 50-80줄 cap 위반 시 frontend/src·backend/src 본문 cap 80-100줄까지 양보.

- **B. Path-scoped 주입** (선결: 발신자 trace): CC platform이 path-scoped suppression 미지원이면 OMC hook patch로 우회. 비-TS/TSX 도메인 잔존 inject 대상. 1.2-A 후속.

### §4.3 Tier 1.3 — Serena 이중 등록 + SessionStart Pre-load

**진단**:

- **D5 (이중 등록)**: Serena MCP 두 namespace 등록 — `serena` + `plugin:serena:serena`. 본 세션 deferred tool 목록에서 직접 확인.
- **D4 (ToolSearch invalidation)**: ToolSearch mid-session schema 로드 시 prefix 무효화. PR#180 B3 추정 -1.2M (ToolSearch 1-2 fire 가정).

**근거 (v4 정정)**:

- C-11 (PR#182) 자연실험: ToolSearch 0 fire, Serena 심볼 도구 0 호출. → C-11은 D4 도메인 밖이며 D4 weight 강등 근거 아님. v3의 강등은 inadmissible evidence ("비 안 온 날 우산 무용함" 오류).
- A2 (PR#182): Tier 1.3-B = `[unfalsifiable on C-11]` — C-11 evidence는 D4에 적용 불가.
- v4 결정: Tier 1.3-B `[required on ToolSearch-heavy tasks]`. paired test (§10) — ToolSearch fire ≥3회 task로 paired 검증 후 적용.

**변경**:

- **A. 이중 등록 정리**: `mcp__serena__*` 유지, `mcp__plugin_serena_serena__*` (plugin namespace) 제거. 실행 전 Serena 실 등록 경로 사전 trace 필수 (§11 rollback 참조).
- **B. SessionStart Serena schema pre-load**: ToolSearch 의존 제거. ToolSearch heavy task에서 paired test 후 적용.

### §4.4 Tier 1.4 — opt-prompt SKILL.md Lazy-load

**진단**: `.claude/skills/opt-prompt/SKILL.md` (실측 452줄 ≈ ~10K 토큰). `/opt-prompt` 1회 + `/opt-prompt --eval` 1회 = 세션당 ~20K 로드. B3 (PR#182) 직접 관측: `/opt-prompt --eval` 호출 시 SKILL.md 본문이 system-reminder로 다시 인라인 (중복 ~600 lines). cache hit 여부와 무관하게 suffix breakpoint 무효화 비용 발생. ~25-35K cache_creation 절감 가능 (B3 추정).

**근거**: B3 dual-fire 직접 관측 + B1 ~60-80K final turn 누적 컨텍스트. C-11 retro가 helper 직접 호출(`append.sh retro`)로 완료 — opt-prompt-log.jsonl row 존재로 우회 검증.

**변경**:

- **A. references/ split**: SKILL.md frontmatter + 본문 분리. `references/` 서브디렉토리 신설 (현재 미존재 — split 작업 필요).
- **D. Helper 직접 호출 우회**: `/opt-prompt --eval` invoke 대신 `.claude/skills/opt-prompt/append.sh retro <id> @<file>` 직접 호출. 본 세션 C-11 retro에서 검증된 패턴.

---

## §5 Tier 2 — CLAUDE.md Routing 룰 + Project Memory

(plan v2 §7 그대로 유지) — root CLAUDE.md tool-routing 표 강화 + project memory `feedback_serena_first` / `project_serena_setup` narrowing. B1 PR#182 강조: D6 차단이 단일 fix로 ~800K 절감 가능 (C-11에서 full-file Read가 후속 turn 컨텍스트를 늘림).

**v4 추가**: 본 절은 hookify enforcement 제안 일체 포함 안 함 — `feedback_serena_first.md` ("훅 강제 금지") 메모리 룰과 충돌하므로. 룰 강화는 순수 가이드라인 형태.

---

## §6 Tier 2.5 — Quick Wins (4 룰)

PR#182 single-transcript reviewed by 3 reviewers (B1·B2·B3) 도출 protocol-level fix. Platform/governance 변경 없이 즉시 적용 가능. **이전 v3 5룰 중 §2.5.5 (TSX Serena routing)는 root CLAUDE.md L48-52 pure-duplicate라 drop**.

**aggregate 추정 절감**: -200-400K (-7-15%). overlap with D3 invalidation budget 미해소 — Quick Win 합산이 D3 saving과 겹칠 수 있음. 정확 절감은 §10 paired raid에서 측정.

### §6.1 [B2] 병렬 bash batch 강제 — 기존 룰 강화

**근거**: B2 — C-11 sequential discovery chain 4회 × ~3 turn. batched 시 12→4 turn.

**처리** (pure-duplicate 회피): root CLAUDE.md L53 기존 룰 `Parallel tool calls — independent tool calls go in one message` 에 한 구절 append:

```
Parallel tool calls — independent tool calls go in one message, not sequential
(bash·Read chains 포함; sequential chain 식별 시 즉시 batch 전환 — reviewer audit 대상)
```

신규 룰 추가가 아니라 기존 룰 강조. **D3 invalidation budget overlap 가능성** 명시 — batch 절감이 D3 saving과 겹칠 수 있음.

### §6.2 [B2] 첫 commit 전 ESLint dry-run

**근거**: B2 — C-11 첫 commit ESLint 실패(`_files` unused) → 수정 → 재commit. 1 logical commit이 2 husky run.

**룰** (root CLAUDE.md "Working Style" 추가):

```
- **Pre-commit lint dry-run**: 첫 `git commit` 전에 lint 명령을 단일 bash 호출로 검증.
  실패 시 수정 후 commit — husky 실패-재commit cycle 방지.
  (실 명령은 다음 세션에서 package.json scripts 확인 후 확정. placeholder: `npm run lint`)
```

### §6.3 [B3] opt-prompt SKILL.md re-injection gating

**근거**: B3 + B1 — `/opt-prompt --eval` SKILL.md 본문 재인라인 직접 관측. 본 세션 C-11 retro가 helper 직접 호출 패턴으로 검증.

**옵션 A (즉시 적용)**: 사용자 룰 — `/opt-prompt --eval` invoke 대신 `append.sh retro` 직접 호출.

**병행 권고**: `.claude/skills/opt-prompt/SKILL.md` frontmatter 또는 본문에 "--eval invocation 시 helper 직접 호출 패턴 사용" 명시 (CLAUDE.md 룰만으로는 enforcement 약함 — document-specialist 권고).

### §6.4 [B2] tsc + vitest 통합 batch — 기존 룰 강화

**근거**: B2 — C-11 tsc ×4 + vitest ×7 = 11 separate runs. 통합 시 ~5-6 run.

**처리** (pure-duplicate 회피): root CLAUDE.md L55 `Tail test output — pipe through | tail -20` 가 이미 tail 부분 cover. 신규 룰은 typecheck + test 단일 호출 부분만:

```
- **Test batch**: 검증 단계는 `npm run typecheck && npm run test` 단일 호출
  (출력은 기존 "Tail test output" 룰에 따라 `| tail -20`). 별도 tsc/vitest split 금지.
```

**위치**: `.claude/CLAUDE.md` Token-Saving Protocol 섹션 (FE/BE 모두 적용 + 토큰 절감 의도와 일치).

**D3 invalidation budget overlap** 가능성 명시.

---

## §7 Tier 3 (Hold) — Commit Hygiene

**보류 사유**: review1 C1 — CC는 디스크 파일이 바뀐다고 자동 재주입하지 않음. 인과관계 미검증.

**N=4 baseline**:

- PR#178 (1 commit, 1.16M)
- PR#180 (1 commit, 2.40M)
- C-11 (4 commit, 2.73M)
- PR#175 (5 commit, 3.39M)

**C-11 4 commit인데 PR#175 5 commit보다 cost ↓** → commit 수와 cost 무상관 evidence 1점 추가. Tier 1.5 가설은 N=4에서 더 약화됨.

**적용 조건**: R5 5분 paired test 직접 측정 후 결정.

---

## §8 실행 순서

```
0. 본 plan v4 머지
1. Tier 2.5 Quick Wins (4 룰) 즉시 적용 — 다음 세션 첫 task부터 enforcement
2. Tier 1.1-A (env entry) — cheapest
3. Tier 1.3-A (Serena 이중 등록 정리) — 사전 trace + plugin namespace 제거
4. Tier 2.1~2.3 (CLAUDE.md routing 룰 + project memory)
4.5. **Raid 1 - Tier 2 적용 후 가설 검증**: TS/TSX 도메인 inject 0 가설 직접 측정. Serena routing 강제 + 동일 spec task 1회 → CLAUDE.md inject 카운트 + 토큰량 기록. 비-TS/TSX 도메인 잔존 inject share 산출. → Tier 1.2-A 진행 여부 결정 (≥-100K 잔존 share면 진행, 미달이면 frontend/src·backend/src 본문 정리만 축소 적용)
5. Tier 1.2-A (69→8 keep + 61 삭제) — raid 1 결과 보고 진행
6. Tier 1.1-C (PostToolUse Serena echo 제거)
7. Tier 1.4 (옵션 D 우회 또는 SKILL.md split)
8. **측정 raid 1**: 동일 spec task 1회 → cost\* 기록 + independent variable 사전 등록
9. Tier 3 5분 실측 → Tier 1.5 살림/폐기 결정
10. **측정 raid 2**: 동일 spec task 1회 → §10 paired comparison
11. Tier 1.1-B + Tier 1.2-B + Tier 1.3-B (Serena pre-load — ToolSearch fire ≥3회 task로 paired test 검증 후 적용) — 선결 trace 후
```

---

# PART 3 — 검증

## §9 Reviewer 프로토콜

### §9.1 Pre-flight (1회)

3 reviewer 병렬, 길이 무제한 (정량 근거 의무):

| Agent                                  | 역할                                            | 입력                                                |
| -------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `oh-my-claudecode:critic`              | per-driver causal weight + cost\* 가중치 정당성 | 본 plan + opt-prompt-log.jsonl 4 retro rows         |
| `oh-my-claudecode:debugger`            | hook/settings/MCP 실 경로 vs plan claim         | `~/.claude/settings.json`, `~/.claude/hooks/`, etc. |
| `oh-my-claudecode:document-specialist` | 룰 변경 충돌 (CLAUDE.md, MEMORY.md)             | Tier 2/2.5 변경 + 영향받는 룰·memory                |

### §9.2 Post-flight (1회)

동일 3 agent. 입력 = "patched state diff vs plan". 충돌·누락·regression 발견시 즉시 rollback.

---

## §10 측정 프로토콜

### §10.1 Cost\* metric

```
cost* = input + cache_creation + 0.1 × cache_read
```

**근거**: A1 (PR#182) — C-11 cache_read 54.97M (20× cache_creation). Anthropic billing에서 cache_read도 ~10% 가격이므로 무시하면 D1·D2·D5처럼 "1회 invalidation + 50턴 read" 형태 driver를 ~80% 누락. v2 정의는 실제 $ 비용의 ~33%만 캡처.

**v4 추가 caveat**: cost\* 는 **$ proxy로 valid**. 단 driver weight ranking 정당성은 §10.4 sensitivity 표에서 별도 검증.

### §10.2 Paired replay 설계

- 동일 task spec 2건 선정 (small ~50-100 LOC + medium ~200-300 LOC)
- 각 spec patched / unpatched 각 **n≥10**회 = **40 sessions 총**
- cost\* metric median paired comparison
- **independent variable 사전 등록**: screenshot 횟수, subagent invocation 횟수, sub-CLAUDE.md inject 횟수, ToolSearch fire 횟수. 각 cell 측정 시 함께 기록

**근거**: A2 (PR#182) — "Baseline N=4, σ/μ ≈ 0.45 (cost metric 기준). 25% 효과 α=0.05 power=0.8 detect = n≥10/cell 필요."

### §10.3 Power 재계산 (cost\* 기반)

**v4 신규**: cost\* 도입으로 분산 ↑ 가능. paired raid 1 직후 즉시 σ/μ 산출 → n≥10 underpowered면 표본 추가.

`σ_cost*/μ_cost*` 추정치 미정 — raid 1 4 cell × 1 round 결과로 계산 후 §12 합격기준 재정의.

### §10.4 Cost\* 가중치 sensitivity 표

**v4 신규**: 0.1 가중치 단일 의존 회피. raid 1 결과를 다음 3 가중치로 재계산:

| weight | session 4개 cost\* | driver D1~D6 share | Tier ROI 순위 변동 여부 |
| ------ | ------------------ | ------------------ | ----------------------- |
| 0.05   | (raid 1 데이터)    | (계산)             | (검증)                  |
| 0.10   | (현행 정의)        | (계산)             | (기준선)                |
| 0.15   | (raid 1 데이터)    | (계산)             | (검증)                  |

**합격 조건**: Tier 1.2-A / Tier 1.3-B / Tier 2.5 ROI 순위가 3 가중치 모두에서 **동일** 유지. 가중치 따라 순위 뒤집히면 plan 결정의 robustness 결여 → patch 적용 보류 + 분산 분해 재설계.

### §10.5 임계치

- **Paired median 절감 ≥ 25% on cost\***
- 단일 세션 절대 비교 금지 (§0 분포 1.16M~3.39M, task 다름)
- N≥10/cell 비현실이면 sequential testing (Bayesian / SPRT) 대안 — 별도 design 필요

---

## §11 Rollback 표

| Patch                                          | Rollback                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tier 1.1-A env entry                           | `~/.claude/settings.json` env entry 삭제                                                                                                                                                                                                                 |
| **Tier 1.1-B hook dispatcher patch (v4 정정)** | 패치 전: `cp ~/.claude/hooks/pre-tool-use.mjs{,.bak.$(date +%s)}` 필수. 롤백: `cp ~/.claude/hooks/pre-tool-use.mjs.bak.<timestamp> ~/.claude/hooks/pre-tool-use.mjs`. (v3 `git -C ~/.claude/plugins/...` 경로는 path-error — 해당 위치에 git repo 없음.) |
| Tier 1.1-C PostToolUse Serena echo 제거        | `~/.claude/settings.json{,.bak.$(date +%s)}` 백업본 복원                                                                                                                                                                                                 |
| Tier 1.2-A sub-CLAUDE.md 통합                  | `git revert` (git tracked)                                                                                                                                                                                                                               |
| Tier 1.2-B platform path-scoped 주입           | hook 또는 settings 롤백                                                                                                                                                                                                                                  |
| **Tier 1.3-A Serena 이중 등록 정리 (v4 정정)** | 사전 trace로 실 등록 파일 확인: `cat ~/.claude/claude_desktop_config.json 2>/dev/null; ls ~/.claude/mcp*.json 2>/dev/null`. 편집 전 해당 파일 백업. 롤백 = 백업 복원. (v3 `settings.json mcpServers` 경로는 path-error — 해당 키 자체가 없음.)           |
| Tier 1.3-B SessionStart pre-load               | hook 또는 settings 롤백                                                                                                                                                                                                                                  |
| Tier 1.4 opt-prompt SKILL.md 분리              | `git revert`                                                                                                                                                                                                                                             |
| Tier 2 룰 변경                                 | `git revert`                                                                                                                                                                                                                                             |
| Tier 2.5 Quick Wins (CLAUDE.md 룰)             | `git revert` — 룰 텍스트 4건 (root CLAUDE.md 강화 + .claude/CLAUDE.md 추가)                                                                                                                                                                              |

**핵심 안전장치**: 모든 settings/hook 변경 전 백업 필수. backup-and-restore 패턴이 기본.

---

## §12 합격 기준

- [ ] 본 plan v4 머지
- [ ] §9.1 pre-flight 3 reviewer all PASS (BLOCK 1건이라도 v5 재작업)
- [ ] Tier 2.5 Quick Wins (4 룰) 적용 + §6.2 lint 명령 확정 + §6.3 SKILL.md guard 병행
- [ ] 각 Tier 적용 후 `npx tsc --noEmit` clean + `npx vitest run` green
- [ ] §9.2 post-flight 3 reviewer all PASS
- [ ] §10.2 paired replay raid 1 → §10.3 power 재계산 + §10.4 sensitivity 표 작성
- [ ] §10.4 sensitivity: Tier ROI 순위가 3 가중치(0.05/0.10/0.15) 모두에서 동일
- [ ] §10.2 paired replay raid 1+2 누적 후 patched median 절감 ≥ 25% on cost\*
- [ ] 미달시 rollback 또는 추가 patch 라운드

---

# PART 4 — Audit

## §13 v1 → v2 → v3 → v4 통합 audit 표

| 항목                                   | v1                             | v2                                            | v3                                            | v4 (`[v4]`)                                                                                                            |
| -------------------------------------- | ------------------------------ | --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| §0 baseline N                          | N=1                            | N=3                                           | N=4                                           | N=4 유지 (cost\* column 정정)                                                                                          |
| Cost metric                            | implicit                       | `input + cache_creation`                      | `+ 0.1×cache_read`                            | cost\* 유지 + §10.4 sensitivity 표 신설 + power 재계산 (§10.3)                                                         |
| §1 D2 (sub-CLAUDE.md)                  | 미인식                         | -200-400K 간접                                | -300-400K + "blind 3/3 합의 단일 최대 driver" | **±50% band, "single-transcript reviewed by 3" 표기 정정 (N=1, not N=3)**                                              |
| §1 D3 (hook firehose)                  | -360-720K 간접                 | -360-720K 간접                                | -50-150K 간접 (`[v3-reweight]`)               | **per-Bash formula로 표기, per-session 50-720K (task-shape dep). 절대 범위 표기 폐기**                                 |
| §1 D4 (ToolSearch invalidation)        | -1.2M 간접                     | -1.2M 간접                                    | -200-400K (`[v3-reweight]`, drop 후보)        | **per-fire 200-500K × fire 횟수. C-11 0 fire는 inadmissible evidence — v3 강등 무효화**                                |
| §1 D7 (task shape)                     | (없음)                         | (없음)                                        | +200-400K weight `[v3-신규]`                  | **driver 표에서 폐기 (residual = circular reasoning). §2 Unattributed variance로 이전**                                |
| §2 Tier 1.3-B (Serena pre-load)        | (없음)                         | R10 필수                                      | drop 후보 (`[v3-강등]`)                       | **`[required on ToolSearch-heavy tasks]` 복원**                                                                        |
| §6 Tier 2.5 Quick Wins                 | (없음)                         | (없음)                                        | 5 룰 신설 (`[v3-신규]`)                       | **4 룰 (§2.5.5 TSX Serena routing은 pure-duplicate라 drop). aggregate -200-400K (overlap caveat)**                     |
| §4.2 Tier 1.2-A 형태                   | (없음)                         | sub-CLAUDE.md 통합 추정                       | 68→6 keep + 62 stub (1줄 포인터)              | **69→8 keep + 61 삭제 (no stub). Tier 2 결합으로 TS/TSX 도메인 inject ≈ 0 가설. §8 step 4.5 raid 1 검증 후 진행 결정** |
| §6 Tier 2.5.4 PNG screenshot           | (없음)                         | (없음)                                        | -200K 절감 (base64 byte 기반)                 | **수치 폐기. image token 모델 기반 추정 (~5-30K)도 단일 점, raid 측정에서 결정**                                       |
| §10 paired replay                      | N≥1 baseline                   | 12 sessions, n=3                              | 40 sessions, n=10                             | n=10 유지 + cost\* power 재계산 단계 신설                                                                              |
| §10 cost\* sensitivity                 | (없음)                         | (없음)                                        | (없음)                                        | **§10.4 신설 — 0.05/0.10/0.15 가중치 ROI 순위 robustness 검증**                                                        |
| §11 Tier 1.1-B rollback                | (없음)                         | `git -C ~/.claude/plugins/.../<ver> checkout` | 동일                                          | **`pre-tool-use.mjs` backup-and-restore (path-error 정정)**                                                            |
| §11 Tier 1.3-A rollback                | (없음)                         | `settings.json mcpServers` 복원               | 동일                                          | **사전 trace + 실 등록 파일 백업 복원 (path-error 정정 — settings.json엔 mcpServers 키 없음)**                         |
| §10.2 paired-replay design             | (없음)                         | 12 sessions                                   | 40 sessions, "task shape 매칭" 요구           | **task shape 매칭 폐기. independent variable 사전 등록 (screenshot/subagent/inject/ToolSearch fire 수)**               |
| §3 (Tier 1.1) reminder fire 카운트     | (없음)                         | "Bash 1회당 ~4개 발사"                        | 동일                                          | **"1-4개 (현재 hook 구성 1-2개)" — 실측 정정**                                                                         |
| §4 (Tier 1.4) opt-prompt SKILL.md 경로 | `~/.claude/skills/opt-prompt/` | 동일                                          | 동일                                          | **`.claude/skills/opt-prompt/SKILL.md` (실측 452줄)**                                                                  |
| review v2 별도 파일                    | —                              | (별도)                                        | plan §15-§19로 통합 폐기                      | 동일 (appendix 보존)                                                                                                   |
| 문서 구조                              | flat                           | flat                                          | flat                                          | **5 part 분리 + Tier 번호와 절 번호 일치 (Tier 1.1 = §4.1)**                                                           |

---

## §14 Reviewer audit guide

본 plan을 다음 세션에서 검증할 때:

1. **§0 baseline 확인** — opt-prompt log 4개 session ID 직접 조회. C-11 row id = `opt-20260503T063921Z-c-11-voc-create-modal`.
2. **§1 driver 표 D1~D6** — 다음 세션 task shape (FE/mixed, screenshot 횟수, ToolSearch fire 횟수) 확인 후 weight 검증. `[v4-revised]` 항목 우선.
3. **§2 Unattributed variance** — paired raid 1 시 4 변수(screenshot/subagent/inject/ToolSearch fire) 실측 후 driver 등재 가능성 재평가.
4. **§3 Tier ROI 등급** — `[required on ToolSearch-heavy tasks]` (Tier 1.3-B) 적용 시 task가 실제 ToolSearch heavy 인지 사전 확인.
5. **§6 Quick Wins 4룰** — §6.1·§6.4는 기존 룰 강화로 noise 회피. §6.2 lint 명령은 다음 세션에서 package.json 확인 후 확정.
6. **§7 Tier 3 hold** — N=4 baseline의 commit-cost 무상관 패턴 재확인. R5 5분 paired test 권고 그대로.
7. **§10 cost\* sensitivity** — raid 1 후 §10.4 표 작성. 가중치 0.05/0.15에서 Tier ROI 순위 뒤집히면 즉시 raid 중단 + 분산 분해.
8. **§11 rollback** — Tier 1.1-B / Tier 1.3-A는 v3 path-error 정정본. v3 명령 그대로 실행 금지.
9. **§13 audit 표** — 모든 v3 항목이 v4에서 어떻게 처리됐는지 1:1 매핑 확인.

---

# PART 5 — Appendix (Evidence Preservation)

본 plan v4는 별도 review 파일 없이 모든 reviewer evidence를 §15~§19에 보존. v3 통합 결정 + v4 pre-flight (PR #177) 결과 추가.

---

## §15 5인 평결 매트릭스

### §15.1 PR #180 직후 (review v2 §0.2)

| 검토자          | 모델   | 평결                     | 핵심 발견                                                                           |
| --------------- | ------ | ------------------------ | ----------------------------------------------------------------------------------- |
| **A1 defender** | opus   | ACCEPT-WITH-RESERVATIONS | 진단 방향 살아남음, R1+R2+R3+R7 머지 전 필수, Tier 1+2만으로 30% 불가 (현실 13-21%) |
| **A2 critic**   | opus   | REJECT                   | 무패치 2.40M이 plan 목표선 통과 = 가짜 신호. 30% 임계는 분산으로 설명됨             |
| **B1 cache**    | sonnet | 구조 분석                | 9.4× cache_read/creation 비율은 캐시 정상. 진짜 문제 = 컨텍스트 누적                |
| **B2 workflow** | sonnet | 구조 분석                | 모든 비효율이 `[default-behavior]`. 단일 최고 ROI = Serena pre-load                 |
| **B3 hook/ctx** | sonnet | REJECT (architectural)   | 3 주입 layer가 서로 모름. Serena 이중 등록 신규 발견                                |

### §15.2 PR #182 직후

| 검토자                                   | 모델   | 평결                                    | 핵심 발견 (v4 표기 정정 — N=1 transcript)                                                          |
| ---------------------------------------- | ------ | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **A1 (informed driver)**                 | opus   | VALID-BUT-NEEDS-REWEIGHTING             | D4 강등(-1.2M→-200-400K, **v4에서 무효화**), D3 하향, D7 신설(**v4에서 폐기**), cost\* metric 필요 |
| **A2 (informed Tier ROI)**               | opus   | REJECT (acceptance) / MIXED (per-patch) | Tier 1.2-A escalate 1순위 / Tier 1.3-B drop 후보(**v4 복원**), 25% 임계는 n≥10 필요                |
| **B1 (single-transcript I/O, blind)**    | sonnet | 정량 분석                               | CLAUDE.md auto-inject 13.5% (±50%, single-session), PNG 9.2% (**v4 image-token 모델로 정정**)      |
| **B2 (single-transcript orchestration)** | sonnet | 정량 분석                               | Sequential bash 160-320K, scattered tsc/vitest 160-250K, commit retry 80-120K                      |
| **B3 (single-transcript cache/context)** | sonnet | 정량 분석                               | CLAUDE.md hook cascade 60-80K, opt-prompt dual 25-35K, write churn 10-15K                          |

**v4 framing 정정**: B1·B2·B3는 동일 C-11 transcript 1개를 본 3 reviewer. independent N=3가 아니라 **N=1 transcript reviewed by 3 reviewers**. 합의가 강해 보이나 evidence base는 단일 세션.

### §15.3 PR #177 pre-flight (v4 신규)

| 검토자                                  | 모델 | 평결  | 핵심 발견                                                                                          |
| --------------------------------------- | ---- | ----- | -------------------------------------------------------------------------------------------------- |
| **critic (per-driver)**                 | opus | BLOCK | D4 circular, D7 residual-as-driver, PNG 10× 오류, "blind 3/3" correlated evidence                  |
| **debugger (path verify)**              | opus | BLOCK | Tier 1.1-B rollback 경로 path-error, Tier 1.3-A `settings.json mcpServers` 키 없음                 |
| **document-specialist (rule conflict)** | opus | BLOCK | §2.5.5 pure-duplicate (root CLAUDE.md L48-52) + hookify 제안 `feedback_serena_first` contradiction |

전 7 BLOCK + 6 NIT → v4 정정 (§13 audit 표 참조).

---

## §16 Critical findings (C1~C13)

### review v2 (보존)

- **C1**: Plan v1 Tier 1.5 commit hygiene 인과관계 미검증 → Tier 3 hold (N=4로 강화)
- **C2**: 측정 프로토콜 통계적 빈약 → §10.2 paired (n=10/cell)
- **C3**: 검증 비용이 절감 잡아먹음 → §9 4-6 reviewer 압축
- **C4**: Plan v1 §0 진단표 직접 반증 (sub-CLAUDE.md per-Read 재주입) → D2 + Tier 1.2 (single-transcript reviewed by 3)
- **C5**: hook reminder dedup mitigation 부재 → Tier 1.1
- **C6**: ToolSearch mid-session prefix invalidation → Tier 1.3-B (v4 `[required]` 복원)
- **C7**: Serena MCP 이중 등록 신규 발견 → Tier 1.3-A

### v3 신규

- **C8 (A1+A2)**: cost 정의 `input + cache_creation`이 실 $ 비용의 ~33%만 캡처 → cost\* metric
- **C9 (A2)**: paired replay n=3/cell underpowered → n≥10/cell
- **C10 (3 single-transcript reviewers 합의)**: Quick Wins protocol-level fix가 platform fix 없이 -7-15% 가능 → §6 신설

### v4 신규 (PR #177 pre-flight)

- **C11 (critic)**: D4 강등 evidence가 inadmissible (ToolSearch-zero session = D4 도메인 밖) → v3 강등 무효화, v4 task-conditional 복원
- **C12 (critic)**: D7 task shape는 residual-as-driver = circular → driver 표 폐기, §2 Unattributed variance로 이전. paired-replay 설계도 task-shape 매칭에서 independent variable 분해로 변경
- **C13 (document-specialist)**: §2.5.5 TSX Serena routing은 root CLAUDE.md L48-52 pure-duplicate + hookify 제안이 `feedback_serena_first.md` ("훅 강제 금지") 메모리와 contradiction → drop

---

## §17 Major findings (M1~M9)

(review v2 M1~M5 보존)

### v3 신규

- **M6 (A1)**: D4 추정 -1.2M이 PR#180 단일 세션 artifact (v4: 단일 세션이 도메인-내 measurement → weight 유지, task-conditional 표기)
- **M7 (B1)**: PNG 스크린샷 cost (v4: base64 byte vs image token 혼동 발견 → 수치 폐기)

### v4 신규

- **M8 (critic)**: §2.5 Quick Wins aggregate가 D3 invalidation budget과 overlap. -400-690K 합산은 double-counting 위험 → v4에서 -200-400K + overlap caveat
- **M9 (critic)**: cost\* 0.1 가중치 단일 의존. 0.05/0.15 sensitivity 검증 없음 → §10.4 sensitivity 표 신설

---

## §18 Plan v1 진단표 vs 실측

### 🔴 반증된 항목

| Plan v1 §0 주장                                             | 실측 결과                                     | 증거                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Chained CLAUDE.md per-Read 주입 ❌ session-start 1회만"    | 틀림 — per-Read 재주입 직접 관찰              | Expert 2 (PR #178); B3 (PR #180) 16개; B1 (PR#182, single-transcript) 12개 + 13.5%                    |
| "MCP tool schema는 ToolSearch시만 lazy-load, 평소 ~800 tok" | 불완전 — ToolSearch 자체가 prefix 무효화 비용 | Expert 1 (PR #178); B1·B3 (PR #180); A1 (PR#182) ToolSearch 0 fire는 D4 도메인 밖 (v4: weight 미감산) |
| "system-reminder 2~3× 중복 ✅ 자연 동작"                    | 맞음. mitigation 부재 → Tier 1.1 신설         | 3 expert (PR #178) + 5인 (PR #180) + A1 (PR#182) 1-4 fire (task별)                                    |

### 🟡 확인된 항목

| Plan v1 §0 주장                                                   | 검증                                                                                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "Edit hook 풀 파일 echo ✅ CC 빌트인 + lint-staged prettier 합작" | PR #178/#180 1 commit이라 직접 검증 불가. C-11 4 commit인데 PR#175 5 commit보다 cost ↓ → R5 5분 실측 권고                   |
| "Serena 오버헤드: name_path 5회 retry trap"                       | PR #178 + PR #180 재현. Tier 2 룰 즉시 머지 (R7) — C-11에서 Serena 0 호출이라 미재현                                        |
| "/opt-prompt SKILL.md ×2 로드 ✅ ~62% 절감"                       | Expert 1+2 SKILL.md 중복 로드 cost 확인. M3 cache-hit 가정 도전 미실측. C-11 B3 dual-fire 직접 관측 → §4.4 옵션 D 우회 검증 |

---

## §19 R1~R15 통합

(review v2 §5 보존 — v1→v2 R1~R11)

**v3 추가 R**:

- **R12** (A1): Cost metric 재정의 `input + cache_creation + 0.1×cache_read` → §10.1
- **R13** (A2): paired replay n=3 → n=10/cell → §10.2
- **R14** (3 single-transcript reviewers): Quick Wins 4 룰 → §6 (v4: 5룰→4룰)
- **R15** (A1): Tier 1.3-B 강등 후보 (v4 무효화: `[required on ToolSearch-heavy tasks]` 복원)

**v4 추가 R**:

- **R16** (critic): D7 driver 표 폐기, §2 Unattributed variance로 이전. paired-replay independent variable 분해 (§10.2)
- **R17** (critic): cost\* 가중치 sensitivity 표 (§10.4) — 0.05/0.10/0.15 ROI 순위 robustness
- **R18** (critic): D2 ±50% band, "single-transcript reviewed by 3 reviewers" framing 일괄 정정
- **R19** (debugger): Tier 1.1-B rollback `pre-tool-use.mjs` backup-and-restore 패턴 (§11)
- **R20** (debugger): Tier 1.3-A 사전 trace + 실 등록 파일 확인 후 편집 (§11)
- **R21** (document-specialist): §2.5.5 drop, root CLAUDE.md L48-52 기존 룰 의존. hookify 제안 일체 폐기
- **R22** (document-specialist): §6.1 / §6.4는 신규 룰 추가 대신 기존 룰 강화로 처리 (pure-duplicate 회피)

---

## §20 한 줄 요약 (v4)

> Plan v4는 v3 + PR #177 pre-flight 3 reviewer (critic·debugger·document-specialist) BLOCK 7건 + NIT 6건 정정. 핵심 변화 6건: **(1) D4 ToolSearch weight 강등 무효화** (C-11 0 fire는 도메인 밖, inadmissible), **(2) D7 task shape driver 폐기** (residual-as-driver = circular, §2 Unattributed variance로 이전), **(3) §2.5 Quick Wins 5→4룰** (§2.5.5 pure-duplicate + hookify 메모리 contradiction), **(4) PNG 절감 수치 폐기** (image token 모델 ~10× 오류), **(5) Tier 1.1-B / Tier 1.3-A rollback 경로 정정** (debugger path-error 발견), **(6) cost\* 가중치 sensitivity 표 신설** + power 재계산. 문서 구조도 5 part 재정비 (Tier 번호와 절 번호 일치, audit 표 v1→v4 단일 통합). 별도 review 파일 없이 §15-§19에 evidence 보존.
