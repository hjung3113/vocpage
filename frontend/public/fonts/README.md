# frontend/public/fonts

Self-hosted font binaries required by the VOC design system.
All CDN font loading is prohibited (Phase 8 closed-network policy).

## Required files

| File                        | Usage                            | Source                                                                                                                                                  |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Pretendard-Variable.woff2` | UI primary font (`--font-ui`)    | https://github.com/orioncactus/pretendard/releases — download `Pretendard-1.x.x.zip`, extract `public/variable/woff2complete/Pretendard-Variable.woff2` |
| `D2Coding.woff2`            | Code / issue IDs (`--font-mono`) | https://github.com/naver/d2codingfont/releases — convert `D2Coding-Ver1.3.2-20180524.ttf` to woff2 via `npx ttf2woff2` or fonttools                     |

## Licenses

- **Pretendard Variable** — SIL Open Font License 1.1
  https://github.com/orioncactus/pretendard/blob/main/LICENSE
- **D2Coding** — SIL Open Font License 1.1
  https://github.com/naver/d2codingfont/blob/master/LICENSE

## Verification

After committing binaries, confirm the app loads fonts without network requests:

```bash
# Dev server must serve fonts from /fonts/ — no external requests
grep -rn "googleapis\|gstatic\|jsdelivr\|fonts.com\|cdn\." \
  frontend/src/ frontend/index.html 2>/dev/null
# Expected: 0 hits
```
