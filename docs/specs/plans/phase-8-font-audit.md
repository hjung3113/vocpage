# Phase 8 Font Audit — Wave 0 Item 0-13

Audited: 2026-05-01
Auditor: executor agent (oh-my-claudecode)

---

## §1 Inventory

Files examined:

| File                            | Contains font refs?                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/index.html`           | No `<link>` or `<style>` font tags                                                                                                                |
| `frontend/src/styles/index.css` | `--font-ui` and `--font-mono` CSS custom properties referencing `'Pretendard Variable'` and `'D2Coding'` by name — no `@font-face`, no CDN import |
| `frontend/public/fonts/`        | Did not exist before this audit                                                                                                                   |
| `prototype/` (reference only)   | CDN refs exist in `node_modules/` only (not production code; enforcement not required)                                                            |

**Grep result for CDN violations** (`googleapis|gstatic|jsdelivr|unpkg|cdn.|@import url(http`):

```
frontend/src/styles/index.css  — 0 hits
frontend/index.html            — 0 hits
```

Status before this audit: **CLEAN on CDN violations** / **MISSING self-host infrastructure**.

---

## §2 Violations

No CDN import violations were found. However, `frontend/src/styles/index.css` referenced fonts by
name without any `@font-face` declaration and without font binaries in `frontend/public/fonts/`.
This means fonts were silently falling back to system fonts — not a CDN violation but a
self-host gap.

**Remediation applied in this audit:**

1. Created `frontend/public/fonts/` directory with `.gitkeep` and `README.md`.
2. Added `@font-face` declarations to `frontend/src/styles/index.css` (lines 5–22) pointing to
   `/fonts/Pretendard-Variable.woff2` and `/fonts/D2Coding.woff2`.

No line-level CDN replacements were needed.

---

## §3 Action Items Remaining

The following font binary files **must be committed** to `frontend/public/fonts/` by the team
before the Wave 0 PR can be merged:

| File                                              | Source                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/public/fonts/Pretendard-Variable.woff2` | https://github.com/orioncactus/pretendard/releases — extract from `Pretendard-1.x.x.zip` → `public/variable/woff2complete/Pretendard-Variable.woff2` |
| `frontend/public/fonts/D2Coding.woff2`            | https://github.com/naver/d2codingfont/releases — convert `D2Coding-Ver1.3.2-20180524.ttf` → woff2 via `npx ttf2woff2` or fonttools                   |

Licenses: both SIL OFL 1.1 (see `frontend/public/fonts/README.md`).

A reminder comment is embedded in `frontend/src/styles/index.css`:

```
/* TODO: verify woff2 binaries committed to frontend/public/fonts/ before Wave 0 PR merge */
```

---

## §4 Self-Host Verification Command

Run after committing font binaries:

```bash
# 1. No CDN references in source
grep -rn "googleapis\|gstatic\|jsdelivr\|fonts.com\|cdn\." \
  frontend/src/ frontend/index.html 2>/dev/null
# Expected: 0 hits

# 2. Font files present
ls -lh frontend/public/fonts/*.woff2
# Expected: Pretendard-Variable.woff2  D2Coding.woff2

# 3. TypeScript still clean
npm run -w frontend typecheck
# Expected: 0 errors

# 4. (Manual) Open http://localhost:5173, DevTools → Network → filter by "font"
#    Confirm: /fonts/Pretendard-Variable.woff2 and /fonts/D2Coding.woff2 load with status 200
#    Confirm: no requests to fonts.googleapis.com or any external font CDN
```
