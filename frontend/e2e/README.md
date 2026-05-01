# E2E Tests

Playwright end-to-end tests for the VOC app.

## Running

```bash
# From the frontend/ directory:
npm run test:e2e        # headless (Chromium)
npm run test:e2e:ui     # interactive UI mode
```

The webServer config in `playwright.config.ts` auto-starts `vite dev` with
`VITE_AUTH_MODE=mock` so MSW intercepts all API calls — no real backend needed.

## First-time setup

If Chromium is not yet installed:

```bash
npx playwright install chromium
```

## What is tested

`voc-happy-path.spec.ts` — functional regression guard covering the main flow:

1. Mock login (admin role)
2. VOC list loads with at least one row
3. Open "새 VOC 등록" modal
4. Fill title, wait for voc-type options, submit
5. Modal closes; new VOC title visible in list
6. Click a VOC row → review drawer opens
7. Switch to "변경이력" tab → history entries visible
