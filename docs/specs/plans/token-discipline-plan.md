# Token Discipline — Consolidated Plan (v3, post-C-11)

> **목적**: 무패치 baseline 세션이 소비하는 cache_creation 토큰을 줄인다.
> **상태**: v3는 plan v2 + review v2 + **PR #182(C-11) 5인 재리뷰** (informed×2 + blind×3)를 단일 문서로 통합. 별도 review 파일 폐기 — 모든 evidence는 본 plan §15-§18 appendix에 보존.
> **본 plan은 다음 세션에서 실행** — 본 세션은 결정 + 측정 baseline 잠금만.
> **근거 보존 원칙**: 모든 Tier 항목·driver·revision에 `근거:` 줄로 출처(reviewer ID·obs ID·세션 ID·정량 추정)를 남긴다. 다음 reviewer가 본 plan을 audit할 때 `[근거]`·`[근거-v3]` 표식을 우선 확인.
> **v2 → v3 변경 요약은 §13.5 audit 표 참조**.

---

## 0. 측정 baseline (4개 무패치 세션, v3 update)

| Session                                | LOC | Files | Commits | input  | output  | cache_read | cache_creation | **cost (input + cache_creation)** | **cost\* (+0.1×cache_read)** |
| -------------------------------------- | --- | ----- | ------- | ------ | ------- | ---------- | -------------- | --------------------------------- | ---------------------------- |
| PR #175 (F-1/2/3 bundle)               | 220 | mixed | 5       | 2,482  | 240,406 | 54.34M     | 3.39M          | **3.39M**                         | **8.82M**                    |
| PR #178 (F-bundle minor)               | 56  | 4     | 1       | 1,038  | 93,188  | 14.77M     | 1.16M          | **1.16M**                         | **2.64M**                    |
| PR #180 (C-10 NotifButton+NotifPanel)  | 324 | 9     | 1       | 1,536+ | 158,856 | n/a        | 2.40M          | **~2.40M** (delta absent)         | n/a                          |
| **PR #182 (C-11 VocCreateModal+Atom)** | 350 | 6     | 4       | 2,796  | 308,190 | 54.97M     | 2.73M          | **2.73M**                         | **8.23M**                    |

근거-v3: `~/.claude/opt-prompt/opt-prompt-log.jsonl` (4 retro rows). C-11 row id = `opt-20260503T063921Z-c-11-voc-create-modal`.

**관찰 (v2)**: 분포 1.16M~3.39M (2.9× spread). LOC·commit 수 모두 dominant driver 아님.

**관찰 (v3 추가)**:

- C-11 unpatched cost = **2.73M (-19% vs PR #175 baseline)** with **plan 미적용**. 단일 세션 -19% drop이 임계치 통과 가능 → "단일 비교 무의미" (§10.3) 보강 evidence.
- cache_read = 54.97M = cache_creation의 **20.1×** — review v2 §4 B1 결론 "9.4× = 정상"의 2배. cost 정의가 `input + cache_creation`만 캡처하면 실제 $ 비용의 ~33%만 측정함 (§13.5 R12).
- LOC 350(C-11) > LOC 220(PR #175)인데 cost는 ↓ → plan v2가 인식 못한 driver D7 (task shape) 존재 시사 (§1 신규 driver).

---

## 1. 진단 — 비용 드라이버 (v3 reweight)

근거: review v2 §1~§4 + PR #182 5인 재리뷰 (A1·A2 informed + B1·B2·B3 blind). v3에서 weight 조정된 항목은 `[v3-reweight]` 표시.

| Driver                                                                                  | 추정 cost (v2)               | **추정 cost (v3)**                               | 합의 강도                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **D1 — 세션 시작 페이로드** (CLAUDE.md stack + AGENTS.md + MEMORY.md + Serena ×2)       | ~8K direct                   | ~8K direct (변동 없음)                           | B3 단독                                                                                          |
| **D2 — Sub-CLAUDE.md per-Read 재주입** (path-dedup 부재; C-11 = 12개 + ~13.5% of 2.73M) | ~5.5K direct + 200-400K 간접 | **~6K direct + 300-400K 간접** ↑                 | Expert 2 + B1·B3 (PR#180) + **B1·B2·B3 (PR#182) 3/3 blind 합의 — 단일 최대 cost driver**         |
| **D3 — Hook reminder firehose** (Bash 1회당 4개 reminder 중복)                          | ~2K direct + 360-720K 간접   | **~2K direct + 50-150K 간접** ↓ `[v3-reweight]`  | 5/5 (PR#180) → A1 (PR#182) 강한 하향 — C-11 hook 카운트 7-8회로 가정 150회의 ~1/10               |
| **D4 — ToolSearch mid-session prefix invalidation** (Serena deferred load)              | ~3.5K direct + 1.2M 간접     | **~3K direct + 200-400K 간접** ↓ `[v3-reweight]` | A1 (PR#182) 반증 — C-11 fire 0회인데 cost 정상 → "단일 최대 driver" 라벨 강등                    |
| **D5 — Serena MCP 이중 등록** (`serena` + `plugin:serena:serena`)                       | ~1.5K ×2                     | ~1.5K ×2 (변동 없음)                             | B3 단독                                                                                          |
| **D6 — 전체 파일 Read 잔류** (Serena symbol-scoped read 대신 full-file)                 | ~150K cache_read 누적        | ~150K cache_read (변동 없음)                     | B1·B2 (PR#180) + **B1 (PR#182) ~800K 추정 강화**                                                 |
| **D7 — Task shape `[v3-신규]`** (FE-only vs mixed-layer, screenshot 횟수, subagent 수)  | (인식 안 됨)                 | **+200-400K weight**                             | A1 (PR#182) 단독 — PR#175(220 mixed)→3.39M, C-11(350 FE-only)→2.73M task shape 차이가 -660K 흡수 |

**v3 핵심 변화**:

- **D4 강등** (1.2M → 200-400K): C-11이 ToolSearch 0 fire인데 baseline 중간값 cost. Tier 1.3-B 우선순위 R10 필수 → 권고로 강등 권고 (§13.5 audit).
- **D3 하향** (360-720K → 50-150K): C-11 hook 카운트 7-8회 (가정 150회의 1/10). plan v2 §3 base rate가 PR#180 high-firehose 세션에 fit — 본 plan에서 base rate 다운 권고.
- **D2 강화** (300-400K 간접): blind 3/3 합의 — 단일 최대 cost driver로 격상. Tier 1.2 escalate (A2 only "high-value" patch).
- **D7 신설** (task shape): PR#175 vs C-11 비교가 직접 evidence. Paired-replay design (§10.3)도 task shape 매칭 필요.

---

## 2. Tier 구조 (v3 — A2 per-patch ROI 적용)

| Tier         | 영역                                                                 | 추정 절감 (v2) → v3 보정                                                   | ROI 등급 (A2)                    | 위험                                                    |
| ------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| **1.1-A**    | Hook env entry (`OMC_SKIP_DELEGATION_NOTICES=1`)                     | -2K (cheap)                                                                | `[marginal]`                     | 낮음                                                    |
| **1.1-B**    | OMC hook dispatcher dedup patch                                      | -50-150K (v3↓)                                                             | `[unfalsifiable on C-11]`        | 낮음                                                    |
| **1.1-C**    | PostToolUse Serena echo 제거                                         | ~0 (C-11 echo 0 fire)                                                      | `[noise]`                        | 낮음                                                    |
| **1.2-A**    | **Sub-CLAUDE.md 통합** (68개 → 6개 + 나머지 1줄 포인터) `[escalate]` | **-300-400K** + path-scope fix 시 추가                                     | **`[high-value, high-cost]`**    | 중간 (governance 변경)                                  |
| **1.2-B**    | Path-scoped 자동 주입 (CC platform fix 또는 OMC hook)                | -100-200K (1.2-A 후속)                                                     | `[high-value, blocked-on-trace]` | 중간 (선결: 발신자 trace)                               |
| **1.3-A**    | Serena 이중 등록 정리                                                | ~0 (C-11 Serena 0 호출)                                                    | `[noise on C-11]`                | 중간 (잘못된 namespace 끄면 깨짐)                       |
| **1.3-B**    | SessionStart Serena pre-load `[v3-강등]`                             | -200-400K (v3↓ from -1.2M)                                                 | **`[unfalsifiable, drop]`**      | 중간 — A1+A2 합의: PR#180 단일 세션 artifact, drop 후보 |
| **1.4**      | opt-prompt SKILL.md `references/` lazy-load                          | -2.5~5K direct (review v2 M3 보정) + dual-load 차단 시 +25-35K (B3 PR#182) | `[marginal but cheap]`           | 낮음                                                    |
| **2**        | CLAUDE.md tool-routing + project memory `name_path_pattern` trap     | 행동 교정 → D6 차단                                                        | `[behavior-fixable, retain]`     | 중간                                                    |
| **2.5**      | **Quick Wins (B1+B2+B3 합의)** `[v3-신규]`                           | **-400-690K** (병렬 batch + lint dry-run + PNG 1회 + SKILL re-load gating) | `[high-ROI, low-cost]`           | 낮음 — protocol-level, no platform change               |
| **3** (hold) | Tier 1.5 commit hygiene (single-commit + fixup)                      | ?? — review v2 C1 미검증 + N=4 baseline에서도 commit 수 무상관             | `[hold pending R5 5분 실측]`     | hold                                                    |

**v2 → v3 변경**: Tier 1.3-B drop 후보로 강등, Tier 1.2 escalate 1순위, Tier 2.5 (Quick Wins) 신설. 자세한 audit 표는 §13.5.

---

## 2.5 Tier 2.5 — Quick Wins (B1+B2+B3 합의, `[v3-신규]`)

3 blind 리뷰어가 독립적으로 도출한 protocol-level fix. Platform/governance 변경 없이 즉시 적용 가능. 각 fix는 단일 reviewer 출처도 함께 표기 (cross-validation).

### 2.5.1 [B2] 병렬 bash batch 강제 — **-160~320K**

근거: B2 perspective P2 — C-11 세션에서 sequential discovery chain 4회, 각 ~3 turn. 병렬 batch로 ~12 sequential → ~4 batched 가능.

**룰** (root `CLAUDE.md` "Core Rules" 섹션에 추가):

```
- **Parallel batches**: 데이터 의존성 없는 ≥2 bash/Read 호출은 단일 메시지에서 병렬 발사. Sequential chain 식별 → 즉시 batch 전환. 위반 시 reviewer가 추후 audit에서 지적.
```

### 2.5.2 [B2] 첫 commit 전 ESLint dry-run — **-30~50K**

근거: B2 perspective P3 — C-11 첫 commit ESLint 실패 (`_files` unused) → 수정 → 재commit. 1 logical commit이 2 husky run.

**룰** (root `CLAUDE.md` "Refactoring" 또는 "Working Style" 섹션에 추가):

```
- **Pre-commit lint dry-run**: 첫 `git commit` 전에 `npx eslint --max-warnings 0 <changed files>`를 단일 bash 호출로 검증. 실패 시 수정 후 commit — husky 실패-재commit cycle 방지.
```

### 2.5.3 [B3] opt-prompt SKILL.md re-injection gating — **-25~35K**

근거: B3 perspective P1 + B1 perspective P2 — `/opt-prompt` 1회 + `/opt-prompt --eval` 1회 = 동일 SKILL.md ~600 lines × 2 inject. 두 번째는 cache hit 가능하나 re-inject 자체가 suffix breakpoint 무효화.

**옵션** (구현 단순도 순):

- A. 사용자 룰: `--eval`은 SKILL.md 본문 없이 helper 호출만으로 충분. `/opt-prompt --eval`을 invoke하지 말고 직접 `append.sh retro` 호출 권장 — 이미 본 세션 retro에서 검증됨 (helper 직접 호출이 가능).
- B. SKILL.md frontmatter에 `eval-stub.md` 분리. eval invocation은 stub만 로드 (eval-only ~100 lines).
- C. CC platform: 같은 세션에서 동일 skill 재 invoke 시 SKILL.md 재 inject suppress 옵션 (CC 빌트인 옵션 미확인).

### 2.5.4 [B1] PNG 스크린샷 1회 로드 + 텍스트 description — **-200K**

근거: B1 perspective P3 — C-11에서 PNG 250KB × 3회 base64 LLM 입력 ≈ 250K (9.2% of 2.73M). 같은 모달 스크린샷이 a11y 수정 후, layout 수정 후 반복 로드.

**룰** (root `CLAUDE.md` "Working Style"):

```
- **Screenshot 재로드 금지**: 같은 PNG는 세션 1회 로드만 허용. 후속 turn에서는 텍스트 description으로 참조 ("위 스크린샷의 X 부분"). 시각 검증이 정말 필요하면 새 스크린샷 1장만 추가.
```

### 2.5.5 [B1] TSX symbol-level 작업은 Serena routing 강제 — **-? (D6 흡수)**

근거: B1 perspective P3 — C-11에서 `VocCreateModal.tsx 195`, `dialog.tsx 99`, `VocCreateModal.test.tsx 86` 전체 Read. Serena `find_symbol`로 20-40 line만 반환 가능.

**plan v2 §7.1 Tool routing 표가 이미 룰화** — Tier 2와 중복. Quick win 측면에서는 enforcement (reviewer audit hook 또는 hookify rule) 필요.

### 2.5.6 [B2] tsc + vitest 통합 batch — **-100~150K**

근거: B2 perspective P4 — C-11에서 tsc ×4 + vitest ×7 = 11 separate runs. `tsc --noEmit && vitest run --reporter=line | tail -20` 통합 시 ~5-6 run.

**룰** (`.claude/CLAUDE.md` 또는 frontend `CLAUDE.md`):

```
- **Test batch**: 검증 단계는 항상 `npm run typecheck && npm run test 2>&1 | tail -20` 단일 호출. 별도 tsc/vitest split 금지 (cycle 카운트 절반).
```

### Quick Wins 합산

3 blind 합의 fix 적용 시 추정 절감 = **-15~25%** (400-690K from 2.73M). plan v2 임계치 25%를 protocol-level만으로 달성 가능 시사 — Tier 1.x platform-level patch는 그 위에 가산.

---

## 3. Tier 1.1 — Hook Reminder Dedup

(plan v2 §3 그대로 보존, v3에서 D3 하향 외에는 변경 없음. Tier 1.1-B 추정 절감 -300-720K → -50-150K로 보정)

### 진단

PR #180 세션에서 Bash 1회 호출당 PreToolUse reminder가 ~4개씩 발사. 50+ 도구 호출 × 평균 3 reminder = 150회 중복 reminder 주입. 각 ~26-80 토큰. 직접 비용 ~2K, 간접 비용 (suffix breakpoint 무효화) ~50-150K (v3 reweight).

**v3 추가**: C-11 세션에서 hook 카운트 7-8회 직접 관측 (가정 150회의 1/10). Base rate가 task에 따라 큰 분산. 절감 추정의 lower bound로 50K 사용.

### 근거

- review1 M5 + review2 G1 (3 expert 만장일치) + PR #180 5인 (A1·A2·B1·B3 5/5)
- B3 직접 정량: ~36,000 raw / ~360-720K 간접 (PR#180)
- **A1 (PR#182)**: -50-150K로 하향 — task에 따라 base rate 1/10 변동

### 변경

(v2 §3과 동일 — A/B/C 패치)

### Rollback

(v2와 동일)

---

## 4. Tier 1.2 — Sub-CLAUDE.md 통합 + Path-scoped 주입

(plan v2 §4 그대로 보존, v3에서 escalate 결정 + B1·B2·B3 3/3 blind 합의 추가)

### 진단

본 repo CLAUDE.md 파일 수: **68개**. PR #180 세션 16개 발사. **C-11 세션 12개 발사** (B3 PR#182 정량). 발사 조건: 자동 주입 (Read 호출시 해당 디렉토리 + 모든 조상 디렉토리 CLAUDE.md). dedup 없음.

**v3 추가**: B1 PR#182 정량 — 12 files × 8 injection events × 3,840 tokens ≈ **~370K tokens (13.5% of 2.73M)**. Single largest cost driver in C-11 session. C-11에서 일부는 off-path: `frontend/src/components/CLAUDE.md`, `frontend/src/components/voc/CLAUDE.md`, `frontend/src/components/ui/CLAUDE.md` (AttachmentZone는 `shared/ui/`인데 무관한 components/ 하위가 inject됨).

### 근거

- review v2 §3 (반증 evidence) + review2 G2
- PR #180 5인: A1·A2·B1·B3 4/5 합의
- **PR #182 blind 3/3**: B1 (~370K, 13.5%), B3 (~80K cache_creation), B2 (간접 inject through commit/test cycles). 단일 최대 cost driver.
- **A2 (PR#182)**: 유일하게 "high-value" 등급 patch

### 변경

(v2 §4와 동일 — A/B 패치)

**v3 추가**: A1 권고 — sub-CLAUDE.md 1줄 포인터 패턴 적용 시 조상 디렉토리 hierarchy도 nearest-ancestor만 keep. CC platform이 path-scoped suppression 미지원이면 OMC hook patch (Tier 1.2-B)로 우회.

### Rollback

(v2와 동일)

---

## 5. Tier 1.3 — Serena 이중 등록 정리 + SessionStart Pre-load (`[v3-강등]`)

(plan v2 §5 보존, v3에서 1.3-B drop 후보로 강등)

### 진단 (v2 그대로)

**관찰 1 (D5)**: Serena MCP 두 namespace 중복 등록 — `serena` + `plugin:serena:serena`. ~1,500 토큰 × 2.

**관찰 2 (D4)**: ToolSearch mid-session schema 로드 시 prefix 무효화. PR#180 B3 추정 -1.2M.

### 근거 (v3 추가)

- **A1 (PR#182) 강한 반증**: C-11 세션에서 Serena 심볼 도구 호출 0회 (find_symbol/get_symbols_overview/find_referencing_symbols 모두 0 fire). 그럼에도 cost = 2.73M (baseline 중간값). D4의 "단일 최대 driver" 라벨은 PR#180 단일 세션 artifact.
- **A2 (PR#182)**: Tier 1.3-B = `[unfalsifiable on C-11, drop 권고]`. Claimed -1.2M의 saving이 Serena 호출 없는 세션엔 0.
- **A1 권고**: Tier 1.3-B를 R10 필수 → R10 권고로 강등. paired-replay (§10.3)에서 ToolSearch heavy task로 재검증 후 확정 결정.

### 변경 (v3 정정)

**A. 이중 등록 정리** (Tier 1.3-A): v2와 동일 (즉시 적용).

**B. SessionStart Serena schema pre-load** (Tier 1.3-B): **drop 후보**. 다음 measurement raid에서 ToolSearch heavy task (Serena 활용 ≥3회)로 patched/unpatched paired 재검증 후 결정.

### Rollback

(v2와 동일)

---

## 6. Tier 1.4 — opt-prompt SKILL.md Lazy-load 분리

(plan v2 §6 보존, v3에서 dual-load gating 추가)

### 진단 (v2 그대로 + v3 추가)

`.claude/skills/opt-prompt/SKILL.md` ~10K 토큰. `/opt-prompt` 1회 + `/opt-prompt --eval` 1회 = 세션당 ~20K 로드.

**v3 추가**: B3 (PR#182) 직접 관측 — `/opt-prompt --eval` 호출 시 SKILL.md 본문이 system-reminder로 **다시** 인라인 (중복 ~600 lines). cache hit 여부와 무관하게 suffix breakpoint 무효화 비용 발생. B1 추정 ~60-80K marginal cost on final turn.

### 근거 (v3 추가)

- **B3 (PR#182)**: dual-fire 직접 관측, ~25-35K cache_creation 절감 가능
- **B1 (PR#182)**: ~60-80K (final turn 누적 컨텍스트 영향 포함)
- **합의**: 2개 blind reviewer 독립 발견

### 변경 (v3 정정)

(v2 §6 references/ split 그대로) + **신규 옵션 D**: `/opt-prompt --eval`을 invoke하지 말고 helper 직접 호출 (`.claude/skills/opt-prompt/append.sh retro <id> @<file>`)로 우회. 본 세션 C-11 retro가 이 패턴으로 완료됨 — 검증된 우회.

### Rollback

(v2와 동일)

---

## 7. Tier 2 — CLAUDE.md Routing 룰 + Project Memory

(plan v2 §7 그대로 보존 — 변경 없음. B1 (PR#182) 강조: D6 차단이 단일 fix로 ~800K 절감 가능 (C-11에서 full-file Read가 후속 turn 컨텍스트를 늘림))

(v2 §7.1~§7.4 그대로 유지)

---

## 8. Tier 3 (Hold) — Commit Hygiene

(plan v2 §8 보존, v3에서 N=4 baseline으로 hold 강화)

### 보류 사유 (v3 강화)

review1 C1: **인과관계 미검증** — CC는 디스크 파일이 바뀐다고 자동 재주입하지 않음.

**N=4 baseline**: PR#178 (1 commit, 1.16M) / PR#180 (1 commit, 2.40M) / **C-11 (4 commit, 2.73M) / PR#175 (5 commit, 3.39M)**. **C-11 = 4 commit인데 PR#175 5 commit보다 비용 ↓**. commit 수와 비용 무상관 evidence 1점 추가. Tier 1.5 가설은 N=4에서 더 약화됨.

**A1 (PR#182) 확증**: C-11 6 commit인데 PR#175 5 commit보다 비용 ↓. plan v2 §0 결론 보강.

### 적용 조건 (v2와 동일)

(v2 §8 R5 5분 paired test 그대로)

---

## 9. 실행 순서 (v3 — Quick Wins 우선 추가)

```
0. 본 plan v3 머지
1. **Tier 2.5 Quick Wins 즉시 적용** (root CLAUDE.md 룰 5건 추가) — 다음 세션 첫 task부터 enforcement
2. Tier 1.1-A (env entry) — cheapest
3. Tier 1.3-A (Serena 이중 등록 정리) — grep 검증 후
4. Tier 2.1~2.3 (CLAUDE.md routing 룰 + project memory) — review2 R7 즉시 selective
5. Tier 1.2-A (sub-CLAUDE.md 통합) — escalate 1순위, 본 repo 작업
6. Tier 1.1-C (PostToolUse Serena echo 제거)
7. Tier 1.4 (opt-prompt SKILL.md 분리 OR 옵션 D 우회)
8. **측정 raid 1**: 동일 spec task 1회 → cost metric 기록 (`opt-prompt --eval` 우회)
9. Tier 3 5분 실측 → Tier 1.5 살림/폐기 결정
10. **측정 raid 2**: 동일 spec task 1회 → §10.3 paired comparison
11. Tier 1.1-B (hook dispatcher patch) + Tier 1.2-B (path-scoped) + Tier 1.3-B (Serena pre-load — paired test로 ToolSearch heavy task 검증 시만) — 선결 trace 후
```

---

## 10. 검증 프로토콜 (v3 — A2 통계 power 보강)

### 10.1 Pre-flight (1회)

3 reviewer 병렬, 200-400 words 상한:

| Agent                                  | 역할                                  | 입력                                |
| -------------------------------------- | ------------------------------------- | ----------------------------------- |
| `oh-my-claudecode:critic`              | adversarial — patch가 진짜 saving인지 | 본 plan + 현재 hook 상태            |
| `oh-my-claudecode:debugger`            | hook patch path 검증                  | `~/.claude/plugins/`, settings.json |
| `oh-my-claudecode:document-specialist` | 룰 변경 충돌                          | Tier 2 변경 + 영향받는 메모리·skill |

### 10.2 Post-flight (1회)

동일 3 agent. 입력 = "patched state diff vs plan". 충돌·누락·regression 발견시 즉시 rollback.

### 10.3 측정 (v3 — cost 정의 + 통계 power 정정)

**Cost metric (v3 정정)**:

```
cost = input + cache_creation + 0.1 × cache_read
```

근거-v3: A1 (PR#182) — C-11 cache_read 54.97M (20× cache_creation). Anthropic billing에서 cache_read도 ~10% 가격이므로 무시하면 D1·D2·D5처럼 "1회 invalidation + 50턴 read" 형태 driver를 ~80% 누락. plan v2 정의는 실제 $ 비용의 ~33%만 캡처.

**Paired replay 설계 (v3 — A2 power 보정)**:

- 동일 task spec 2건 선정 (small ~50-100 LOC + medium ~200-300 LOC)
- 각 spec patched / unpatched 각 **n≥10**회 = **40 sessions 총** (v2 12 sessions에서 격상)
- cost\* metric (위 v3 정의) median paired comparison

근거-v3: **A2 (PR#182)** — "Baseline N=3, σ/μ ≈ 0.45. 25% 효과를 α=0.05 power=0.8로 detect하려면 n≥10/cell 필요. plan v2의 n=3은 underpowered." plan v2 §10.3 (12 sessions) → **40 sessions로 격상**.

**임계치 (v3 정정)**:

- 본 plan v3 §0 baseline 분산: 1.16M~3.39M (2.9× spread). 단일 세션 절대 비교는 통계적으로 무의미.
- 새 임계치: **paired median 절감 ≥ 25%** on cost\* (v3 정의)
- N≥10/cell가 비현실이면 차선: 25% 임계 유지 + sequential testing (Bayesian / SPRT) — 별도 design 필요.

---

## 11. Rollback 표

(v2 §11 그대로 보존)

| Patch                                   | Rollback                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Tier 1.1-A env entry                    | settings.json entry 삭제                                                 |
| Tier 1.1-B hook dispatcher patch        | `git -C ~/.claude/plugins/.../<ver> checkout scripts/` 또는 `omc update` |
| Tier 1.1-C PostToolUse Serena echo 제거 | `~/.claude/settings.json{,.bak.$(date +%s)}` 백업본 복원                 |
| Tier 1.2-A sub-CLAUDE.md 통합           | `git revert` (git tracked)                                               |
| Tier 1.2-B platform path-scoped 주입    | hook 또는 settings 롤백                                                  |
| Tier 1.3-A Serena 이중 등록 정리        | settings.json mcpServers entry 복원                                      |
| Tier 1.3-B SessionStart pre-load        | hook 또는 settings 롤백                                                  |
| Tier 1.4 opt-prompt SKILL.md 분리       | `git revert`                                                             |
| Tier 2 룰 변경                          | `git revert` (모두 git tracked)                                          |
| **Tier 2.5 Quick Wins (CLAUDE.md 룰)**  | **`git revert` — 룰 텍스트 5건 (root CLAUDE.md)**                        |

**핵심 안전장치**: 모든 settings 변경 전 `cp ~/.claude/settings.json{,.bak.$(date +%s)}`.

---

## 12. 합격 기준 (v3 정정)

- [ ] 본 plan v3 머지
- [ ] §10.1 pre-flight 3 reviewer all PASS
- [ ] **§2.5 Quick Wins (5 룰) 적용**
- [ ] 각 Tier 적용 후 `npx tsc --noEmit` clean + `npx vitest run` green
- [ ] §10.2 post-flight 3 reviewer all PASS
- [ ] **§10.3 paired replay 40 sessions 누적 후 patched median - unpatched median ≥ 25% on cost\* (v3 metric)**
- [ ] 미달시 rollback 또는 추가 patch 라운드

---

## 13. v1 → v2 변경 요약 (audit 표 — v2 보존)

(v2 §13 그대로 — 본 plan v3에서는 §13.5에 v2→v3 추가)

| v1 항목                           | v2 처리                                  | 근거                           |
| --------------------------------- | ---------------------------------------- | ------------------------------ |
| Tier 1.1 H2 hook patch (단일)     | v2 Tier 1.1로 일반화                     | D3가 dominant 확정             |
| Tier 1.2 글로벌 Serena echo 제거  | v2 Tier 1.1-C로 흡수                     | 같은 hook 카테고리             |
| Tier 1.3 Serena 이중 등록 정리    | v2 Tier 1.3 (SessionStart pre-load 묶음) | D4·D5 합산 우선순위 격상       |
| Tier 1.4 opt-prompt SKILL.md 분리 | v2 Tier 1.4 유지, 절감 -2.5~5K로 보정    | review1 M3                     |
| Tier 1.5 commit hygiene           | v2 Tier 3 (hold)                         | review1 C1 + N=3 baseline 약화 |
| Tier 2 CLAUDE.md routing          | v2 Tier 2 유지                           | review2 R7 + B2 PR#180         |
| 신규 Tier 1.2 (sub-CLAUDE.md)     | 추가                                     | review2 G2 + B3 PR#180         |
| 신규 Tier 1.3-B (Serena pre-load) | 추가                                     | D4 단일 최대 driver 후보       |
| §6 검증 12 reviewer               | v2 §10 4 reviewer로 압축                 | review1 C3                     |
| §6.3 측정 N≥1 baseline            | v2 §10.3 paired replay 12 sessions       | review1 C2 + review2 R5        |
| §6.3 30% 임계                     | v2 §10.3 25% paired (분산 보정)          | N=3 baseline 분산 측정         |

---

## 13.5 v2 → v3 변경 요약 (audit 표 — `[v3-신규]`)

| v2 항목                              | v3 처리                                                             | 근거                                                              |
| ------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| §0 baseline N=3                      | **§0 baseline N=4** (C-11 추가)                                     | C-11 retro `opt-20260503T063921Z-c-11-voc-create-modal`           |
| Cost metric `input + cache_creation` | **Cost\* metric `input + cache_creation + 0.1 × cache_read`**       | A1 (PR#182) — C-11 cache_read 20× cache_creation, 실 $ 비용 누락  |
| §1 D3 -360-720K 간접                 | **§1 D3 -50-150K 간접 (`[v3-reweight]`)**                           | A1 — C-11 hook 카운트 가정 1/10                                   |
| §1 D4 -1.2M 간접                     | **§1 D4 -200-400K 간접 (`[v3-reweight]`)**                          | A1 — C-11 ToolSearch 0 fire 자연 실험                             |
| (D7 없음)                            | **§1 D7 task shape `[v3-신규]` +200-400K weight**                   | A1 — PR#175 vs C-11 비교가 직접 evidence                          |
| §5 Tier 1.3-B R10 필수               | **§5 Tier 1.3-B drop 후보 (`[v3-강등]`, paired test 필요)**         | A1 + A2 합의 — claim -1.2M가 PR#180 단일 세션 artifact            |
| §6 Tier 1.4 절감만                   | **§6 Tier 1.4 + 신규 옵션 D (helper 직접 호출 우회)**               | B3 (PR#182) — dual-fire 직접 관측, 본 세션 C-11 retro가 우회 검증 |
| (Quick Wins 없음)                    | **§2.5 Tier 2.5 Quick Wins 신설 (5 룰, -400-690K)**                 | B1+B2+B3 (PR#182) 합의                                            |
| §10.3 paired replay 12 sessions, n=3 | **§10.3 paired replay 40 sessions, n=10** + sequential test 차선    | A2 (PR#182) — n=3 underpowered, n≥10 필요                         |
| §11 Rollback 표 9개                  | **§11 +1 (Tier 2.5 Quick Wins git revert)**                         | Tier 2.5 신설                                                     |
| §12 합격 기준 12 sessions            | **§12 합격 기준 40 sessions on cost\* + Tier 2.5 적용**             | §10.3 + §2.5                                                      |
| (별도 review v2 파일)                | **단일 plan으로 통합** — review v2 §0~§9는 본 plan §15-§18 appendix | 사용자 요청 "하나의 plan문서만"                                   |

---

## 14. 다음 reviewer를 위한 audit 가이드 (v2 보존 + v3 추가)

본 plan을 다음 세션에서 검증할 때:

1. **§0 baseline 확인** — opt-prompt log 4개 session ID 직접 조회. C-11 row id = `opt-20260503T063921Z-c-11-voc-create-modal`.
2. **§1 driver 표 v3-reweight 항목** (D3, D4, D7) — 다음 세션 task가 ToolSearch heavy / hook firehose heavy / mixed-layer 인지 확인 후 weight 검증.
3. **§2 Tier ROI 등급** — A2 per-patch 평가의 ROI 등급이 다음 세션에서도 유지되는지.
4. **§2.5 Quick Wins** — 5 룰 적용 후 cost 변화 측정. 룰별 saving이 추정과 일치하는지.
5. **§8 Tier 3 hold 사유** — N=4 baseline의 commit-cost 무상관 패턴 재확인.
6. **§10.3 cost\* 정의 + paired replay 40 sessions** — 통계 power 재계산 (sequential testing 가능성 검토).
7. **§13.5 v2→v3 audit 표** — 모든 v2 항목이 v3에서 어떻게 처리됐는지 1:1 매핑.

---

# Appendix — Evidence Preservation (review v2 통합)

본 plan v3가 별도 review 파일을 폐기하므로, review v2의 evidence는 아래 §15~§18에 보존. 각 finding의 `근거:` 줄에 reviewer ID·세션 ID·정량 추정 유지.

---

## 15. 5인 재리뷰 평결 매트릭스 (PR #180 직후, review v2 §0.2)

| 검토자          | 모델   | 평결                     | 핵심 발견                                                                           |
| --------------- | ------ | ------------------------ | ----------------------------------------------------------------------------------- |
| **A1 defender** | opus   | ACCEPT-WITH-RESERVATIONS | 진단 방향 살아남음, R1+R2+R3+R7 머지 전 필수, Tier 1+2만으로 30% 불가 (현실 13-21%) |
| **A2 critic**   | opus   | REJECT                   | 무패치 2.40M이 plan 목표선 통과 = 가짜 신호. 30% 임계는 분산으로 설명됨             |
| **B1 cache**    | sonnet | 구조 분석                | 9.4× cache_read/creation 비율은 캐시 정상. 진짜 문제 = 컨텍스트 누적                |
| **B2 workflow** | sonnet | 구조 분석                | 모든 비효율이 `[default-behavior]`. 단일 최고 ROI = Serena pre-load                 |
| **B3 hook/ctx** | sonnet | REJECT (architectural)   | 3 주입 layer가 서로 모름. Serena 이중 등록 신규 발견                                |

## 15.5 5인 재리뷰 평결 매트릭스 (PR #182 직후, `[v3-신규]`)

| 검토자                       | 모델   | 평결                                    | 핵심 발견                                                                                          |
| ---------------------------- | ------ | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **A1 (informed driver)**     | opus   | VALID-BUT-NEEDS-REWEIGHTING             | D4 강등(-1.2M→-200-400K), D3 하향(-360-720K→-50-150K), D7 신설, cost\* metric 필요                 |
| **A2 (informed Tier ROI)**   | opus   | REJECT (acceptance) / MIXED (per-patch) | Tier 1.2-A escalate 1순위 / Tier 1.3-B drop 후보, 25% 임계는 n≥10 필요 (현재 n=3 underpowered)     |
| **B1 (blind I/O)**           | sonnet | 정량 분석                               | CLAUDE.md auto-inject 13.5%, PNG 9.2%, opt-prompt dual-fire 2.5-3% / Top-3 fix -25-35%             |
| **B2 (blind orchestration)** | sonnet | 정량 분석                               | Sequential bash 160-320K, scattered tsc/vitest 160-250K, commit retry 80-120K / Top-3 -15-25%      |
| **B3 (blind cache/context)** | sonnet | 정량 분석                               | CLAUDE.md hook cascade 60-80K cache_creation, opt-prompt dual 25-35K, write churn 10-15K / -15-25% |

---

## 16. Critical findings 통합 (review v2 §1 보존 + v3 추가)

### review v2 §1 (C1~C7, 보존)

- **C1**: Plan v1 Tier 1.5 commit hygiene 인과관계 미검증 → v2 Tier 3 hold (v3에서 N=4로 강화)
- **C2**: 측정 프로토콜 통계적 빈약 → v2 §10.3 paired (v3에서 n=10/cell로 격상)
- **C3**: 검증 비용이 절감 잡아먹음 → v2 §10 4-6 reviewer 압축
- **C4**: Plan v1 §0 진단표 직접 반증 (sub-CLAUDE.md per-Read 재주입) → v2 D2 + Tier 1.2 신설 (v3 blind 3/3 합의로 강화)
- **C5**: hook reminder dedup mitigation 부재 → v2 Tier 1.1 신설 (v3에서 D3 하향 reweight)
- **C6**: ToolSearch mid-session prefix invalidation → v2 Tier 1.3-B (v3에서 drop 후보로 강등)
- **C7**: Serena MCP 이중 등록 신규 발견 → v2 Tier 1.3-A

### v3 신규 critical findings

- **C8 (A1+A2 합의)**: cost 정의 `input + cache_creation`이 실 $ 비용의 ~33%만 캡처. cache_read 20× ratio 무시. → §10.3 cost\* metric 정정
- **C9 (A2)**: paired replay n=3/cell underpowered. 25% 효과 power=0.8 detect = n≥10/cell. → §10.3 40 sessions
- **C10 (3 blind 합의)**: Quick Wins protocol-level fix가 platform fix 없이 -15-25% 가능. → §2.5 신설

---

## 17. Major findings (review v2 §2 보존, v3 정정 추가)

(review v2 §2 M1~M5 그대로 보존 — 변경 없음)

**v3 추가**:

- **M6 (A1)**: D4 추정 -1.2M이 PR#180 단일 세션 artifact. C-11 fire 0회 자연 실험으로 반증. paired test 없이 R10 필수 등급 부여한 것은 over-claim.
- **M7 (B1)**: PNG 스크린샷 base64 LLM 입력이 9.2% 단일 cost 항목. plan v2가 인식 못함. → §2.5.4 룰 신설.

---

## 18. Plan v1 진단표 vs 실측 (review v2 §3 보존)

### 🔴 반증된 항목 (v2 그대로)

| Plan v1 §0 주장                                             | 실측 결과                                     | 증거                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| "Chained CLAUDE.md per-Read 주입 ❌ session-start 1회만"    | 틀림 — per-Read 재주입 직접 관찰              | Expert 2 perspective 2 (PR #178); B3 (PR #180) 16개 파일; **B1 (PR#182) 12개 + 13.5% cost**                      |
| "MCP tool schema는 ToolSearch시만 lazy-load, 평소 ~800 tok" | 불완전 — ToolSearch 자체가 prefix 무효화 비용 | Expert 1 perspective 1 (PR #178); B1·B3 (PR #180); A1 (PR#182) ToolSearch 0 fire에서도 cost 정상이라 D4 weight ↓ |
| "system-reminder 2~3× 중복 ✅ 자연 동작" (인정만)           | 맞음. 단 plan 어디에도 mitigation 없음        | 3 expert (PR #178) + 5인 (PR #180) 만장일치 + A1 (PR#182) base rate 1/10 hint                                    |

### 🟡 확인된 항목 (v2 그대로 + v3 추가)

| Plan v1 §0 주장                                                   | 검증                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| "Edit hook 풀 파일 echo ✅ CC 빌트인 + lint-staged prettier 합작" | PR #178/#180 모두 1 commit이라 직접 검증 불가. **C-11 = 4 commit인데 PR#175 5 commit보다 비용 ↓ → R5 5분 실측 권고 여전히 유효** |
| "Serena 오버헤드: name_path 5회 retry trap"                       | PR #178 + PR #180 두 세션에서 재현. 룰 즉시 머지 필요 (R7) — **C-11에서 Serena 0 호출이라 미재현**                               |
| "/opt-prompt SKILL.md ×2 로드 ✅ ~62% 절감"                       | Expert 1+2 SKILL.md 중복 로드 cost 확인. M3 cache-hit 가정 도전 미실측. **C-11 B3가 dual-fire 직접 관측 → §6 옵션 D 우회 검증**  |

---

## 19. R1~R11 통합 (review v2 §5 보존)

(review v2 §5 표 그대로 — 본 plan §13/§13.5 audit 표가 어느 R이 plan v3에 흡수됐는지 1:1 매핑)

**v3 추가 R**:

- **R12** (A1): Cost metric 재정의 `input + cache_creation + 0.1×cache_read` → §10.3 적용
- **R13** (A2): paired replay 12 sessions → 40 sessions, n=3/cell → n=10/cell → §10.3 적용
- **R14** (3 blind 합의): Quick Wins 5 룰 신설 (parallel batch / lint dry-run / opt-prompt re-load gating / PNG single-load / tsc+vitest batch) → §2.5 적용
- **R15** (A1): Tier 1.3-B 강등 (R10 필수 → 권고, paired test로 ToolSearch heavy task 재검증 후 결정) → §5 적용

---

## 20. 한 줄 요약 (v3)

> Plan v3는 v2 + 본 세션 C-11 5인 재리뷰를 단일 문서로 통합. 핵심 변화 4건: **(1) cost 정의에 `0.1×cache_read` 추가** (실 $ 비용 ~33%만 캡처하던 v2 보정), **(2) D4 (ToolSearch)·D3 (hook) 하향 reweight + D7 (task shape) 신설** (C-11이 ToolSearch 0 fire인데 cost 정상이라 D4 단일 최대 driver 라벨 강등), **(3) Quick Wins 5 룰 신설** (3 blind 합의 -15-25% 절감, platform 변경 없음), **(4) paired replay 12 → 40 sessions** (n=3은 25% 효과 detect 불가). Tier 1.2 (sub-CLAUDE.md) 단일 high-value patch로 escalate, Tier 1.3-B (Serena pre-load) drop 후보로 강등. 별도 review 파일 폐기 — 모든 evidence는 §15-§19 appendix에 보존.
