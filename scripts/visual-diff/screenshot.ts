/**
 * screenshot.ts — captures per-component PNGs for prototype and React /voc.
 *
 * Invoked via `npm run visual-diff -- --screenshots`.
 * Reuses bootHarness() + openPrototypeOverlays/openReactOverlays from index.ts.
 *
 * Output dir: docs/specs/reviews/wave1.5-followup-a/screenshots/
 *
 * For each SELECTOR_MAP entry:
 *   <id>-proto.png   — element screenshot from prototype page
 *   <id>-react.png   — element screenshot from React /voc page
 * Full-page (1280 wide):
 *   full-1280-proto.png / full-1280-react.png
 * Full-page (1440 wide, second viewport):
 *   full-1440-proto.png / full-1440-react.png
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import type { Page } from 'playwright';
import { bootHarness } from './harness.js';
import { SELECTOR_MAP } from './selectors.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const SCREENSHOT_DIR = path.join(ROOT, 'docs/specs/reviews/wave1.5-followup-a/screenshots');

/**
 * Capture a single element screenshot. Warns and skips if the element is not
 * found or not visible (resilient to overlay/portal sequencing issues).
 */
async function captureElement(
  page: Page,
  selector: string,
  outputPath: string,
  label: string,
): Promise<boolean> {
  try {
    const locator = page.locator(selector).first();
    // Check visibility within a short timeout — don't block the whole run
    await locator.waitFor({ state: 'visible', timeout: 5_000 });
    await locator.screenshot({ path: outputPath });
    console.error(`[screenshot] OK  ${label} → ${path.relative(ROOT, outputPath)}`);
    return true;
  } catch (e) {
    console.error(
      `[screenshot] WARN ${label}: element not found or hidden (${selector}). Skipping.`,
    );
    return false;
  }
}

/**
 * Open overlays on prototype side so overlay components are capturable.
 * Mirrors the logic in index.ts openPrototypeOverlays.
 */
async function openPrototypeOverlays(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).openModal === 'function',
      { timeout: 5_000 },
    );
  } catch {
    console.error('[screenshot] Warn: window.openModal not available');
  }

  // voc-create-modal
  try {
    await page.evaluate(() => {
      (window as unknown as Record<string, () => void>).openModal?.();
    });
    await page.waitForSelector('#modalBg', { state: 'visible', timeout: 5_000 });
  } catch (e) {
    console.error('[screenshot] Warn: failed to open proto modal:', e);
  }

  // voc-notif-dropdown
  try {
    const notifBtn = await page.$('#notifBtn');
    if (notifBtn) {
      await notifBtn.click();
      await page.waitForSelector('#notifPanel', { state: 'visible', timeout: 5_000 });
    }
  } catch (e) {
    console.error('[screenshot] Warn: failed to open proto notif panel:', e);
  }
}

/** Close any open Radix dialog/sheet by pressing Escape. */
async function closeReactOverlay(page: Page): Promise<void> {
  try {
    await page.keyboard.press('Escape');
    // Give the close animation time to finish
    await page.waitForTimeout(300);
  } catch {
    // Non-fatal
  }
}

/**
 * Open the React create-modal, capture it, then close it.
 * Returns true if the element was captured.
 */
async function captureReactCreateModal(page: Page, outDir: string): Promise<boolean> {
  const reactFile = path.join(outDir, 'voc-create-modal-react.png');
  try {
    const createBtn = await page.$('button:has-text("새 VOC 등록")');
    if (!createBtn) {
      console.error('[screenshot] Warn: "새 VOC 등록" button not found');
      return false;
    }
    await createBtn.click();
    await page.waitForSelector('[data-pcomp="voc-create-modal"]', {
      state: 'visible',
      timeout: 8_000,
    });
    await page.locator('[data-pcomp="voc-create-modal"]').first().screenshot({ path: reactFile });
    console.error(`[screenshot] OK  voc-create-modal/react → ${path.relative(ROOT, reactFile)}`);
    return true;
  } catch (e) {
    console.error('[screenshot] Warn: failed to capture react create modal:', (e as Error).message);
    return false;
  } finally {
    await closeReactOverlay(page);
  }
}

/**
 * Open the React notification dropdown, capture it, then close it.
 */
async function captureReactNotifDropdown(page: Page, outDir: string): Promise<boolean> {
  const reactFile = path.join(outDir, 'voc-notif-dropdown-react.png');
  try {
    const bellBtn = await page.$('[data-pcomp="notification-bell"]');
    if (!bellBtn) {
      console.error('[screenshot] Warn: notification-bell button not found');
      return false;
    }
    await bellBtn.click();
    await page.waitForSelector('[data-pcomp="voc-notif-dropdown"]', {
      state: 'visible',
      timeout: 5_000,
    });
    await page.locator('[data-pcomp="voc-notif-dropdown"]').first().screenshot({ path: reactFile });
    console.error(`[screenshot] OK  voc-notif-dropdown/react → ${path.relative(ROOT, reactFile)}`);
    return true;
  } catch (e) {
    console.error(
      '[screenshot] Warn: failed to capture react notif dropdown:',
      (e as Error).message,
    );
    return false;
  } finally {
    await closeReactOverlay(page);
  }
}

/**
 * Open the React review drawer (click first table row), capture it, then close it.
 */
async function captureReactReviewDrawer(page: Page, outDir: string): Promise<boolean> {
  const reactFile = path.join(outDir, 'voc-review-drawer-react.png');
  try {
    const firstRow = await page.$('thead[data-pcomp="data-table"] ~ tbody tr');
    if (!firstRow) {
      console.error('[screenshot] Warn: no table row found for review drawer');
      return false;
    }
    await firstRow.click();
    await page.waitForSelector('[data-pcomp="voc-review-drawer"]', {
      state: 'visible',
      timeout: 8_000,
    });
    await page.locator('[data-pcomp="voc-review-drawer"]').first().screenshot({ path: reactFile });
    console.error(`[screenshot] OK  voc-review-drawer/react → ${path.relative(ROOT, reactFile)}`);
    return true;
  } catch (e) {
    console.error(
      '[screenshot] Warn: failed to capture react review drawer:',
      (e as Error).message,
    );
    return false;
  } finally {
    await closeReactOverlay(page);
  }
}

export interface ScreenshotOptions {
  protoPort?: number;
  reactPort?: number;
  headed?: boolean;
  keepServer?: boolean;
  outDir?: string;
  /** If true, also write the markdown index after capturing */
  writeIndex?: boolean;
}

export interface ScreenshotResult {
  captured: string[];
  skipped: string[];
  total: number;
  indexPath?: string;
}

/**
 * generateMarkdownIndex — writes voc-visual-screenshots.md next to the screenshots dir.
 * Uses HTML <img width="600"> in a 2-cell table so side-by-side renders on GitHub.
 */
export function generateMarkdownIndex(
  outDir: string,
  captured: string[],
  runTimestamp: string,
): string {
  const reviewDir = path.dirname(outDir);
  const indexPath = path.join(reviewDir, 'voc-visual-screenshots.md');

  const capturedSet = new Set(captured.map((p) => path.basename(p)));

  function imgTag(filename: string): string {
    if (capturedSet.has(filename)) {
      return `<img src="screenshots/${filename}" width="600" alt="${filename}">`;
    }
    return `_not captured_`;
  }

  const lines: string[] = [
    '# VOC Visual Screenshots — Stage 3',
    '',
    '## How to read this',
    '',
    'Left = prototype, right = /voc React. Diffs that the visual-diff harness flags HIGH are unsurprising; ' +
      'what we want from this stage are *visible-but-uncaught* gaps — wrong icon stroke width, missing border radius, ' +
      'missing inset shadow, missing badge dot, etc.',
    '',
    '## Captured viewports',
    '',
    '| Viewport | Files |',
    '|----------|-------|',
    '| 1280 × 900 | per-component + full-page |',
    '| 1440 × 900 | full-page only |',
    '',
    `**Run timestamp:** ${runTimestamp}`,
    '',
    '---',
    '',
  ];

  // Per-component sections
  for (const entry of SELECTOR_MAP) {
    const { componentId } = entry;
    lines.push(`## ${componentId}`);
    lines.push('');
    lines.push('| Prototype | React |');
    lines.push('|-----------|-------|');
    lines.push(`| ${imgTag(`${componentId}-proto.png`)} | ${imgTag(`${componentId}-react.png`)} |`);
    lines.push('');
  }

  // Full-page sections
  lines.push('## Full page — 1280 × 900');
  lines.push('');
  lines.push('| Prototype | React |');
  lines.push('|-----------|-------|');
  lines.push(`| ${imgTag('full-1280-proto.png')} | ${imgTag('full-1280-react.png')} |`);
  lines.push('');

  lines.push('## Full page — 1440 × 900');
  lines.push('');
  lines.push('| Prototype | React |');
  lines.push('|-----------|-------|');
  lines.push(`| ${imgTag('full-1440-proto.png')} | ${imgTag('full-1440-react.png')} |`);
  lines.push('');

  const content = lines.join('\n');
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.error(`[screenshot] Index written: ${path.relative(ROOT, indexPath)}`);
  return indexPath;
}

export async function runScreenshots(opts: ScreenshotOptions = {}): Promise<ScreenshotResult> {
  const outDir = opts.outDir ?? SCREENSHOT_DIR;
  const writeIndex = opts.writeIndex ?? true;
  fs.mkdirSync(outDir, { recursive: true });

  console.error(`[screenshot] Output dir: ${outDir}`);

  const { protoPage, reactPage, teardown } = await bootHarness({
    protoPort: opts.protoPort,
    reactPort: opts.reactPort,
    headed: opts.headed,
    keepServer: opts.keepServer,
  });

  const captured: string[] = [];
  const skipped: string[] = [];

  // Components that need a dedicated open/close cycle on the React side
  const REACT_OVERLAY_IDS = new Set([
    'voc-create-modal',
    'voc-notif-dropdown',
    'voc-review-drawer',
  ]);

  try {
    // Open prototype overlays once (prototype keeps all open simultaneously fine)
    await openPrototypeOverlays(protoPage);

    // --- Per-component screenshots ---
    // Non-overlay components: capture from base page state (no modal open on React).
    // Overlay components: handled individually below with open/capture/close cycles.
    for (const entry of SELECTOR_MAP) {
      const { componentId, proto: protoSel, react: reactSel } = entry;

      const protoFile = path.join(outDir, `${componentId}-proto.png`);

      const protoOk = await captureElement(protoPage, protoSel, protoFile, `${componentId}/proto`);
      if (protoOk) captured.push(path.relative(ROOT, protoFile));
      else skipped.push(`${componentId}-proto`);

      // Overlay components: skip here — handled via dedicated open/close below
      if (REACT_OVERLAY_IDS.has(componentId)) continue;

      const reactFile = path.join(outDir, `${componentId}-react.png`);
      const reactOk = await captureElement(reactPage, reactSel, reactFile, `${componentId}/react`);
      if (reactOk) captured.push(path.relative(ROOT, reactFile));
      else skipped.push(`${componentId}-react`);
    }

    // --- React overlay components: individual open→capture→close cycles ---
    // Order: drawer first (needs table row, no modal open), then notif, then create-modal last.
    const drawerOk = await captureReactReviewDrawer(reactPage, outDir);
    if (drawerOk)
      captured.push(path.relative(ROOT, path.join(outDir, 'voc-review-drawer-react.png')));
    else skipped.push('voc-review-drawer-react');

    const notifOk = await captureReactNotifDropdown(reactPage, outDir);
    if (notifOk)
      captured.push(path.relative(ROOT, path.join(outDir, 'voc-notif-dropdown-react.png')));
    else skipped.push('voc-notif-dropdown-react');

    const modalOk = await captureReactCreateModal(reactPage, outDir);
    if (modalOk)
      captured.push(path.relative(ROOT, path.join(outDir, 'voc-create-modal-react.png')));
    else skipped.push('voc-create-modal-react');

    // --- Full-page screenshots at 1280 wide ---
    const vp1280 = { width: 1280, height: 900 };
    await protoPage.setViewportSize(vp1280);
    await reactPage.setViewportSize(vp1280);
    // Brief settle after resize
    await protoPage.waitForTimeout(300);
    await reactPage.waitForTimeout(300);

    const fp1280ProtoFile = path.join(outDir, 'full-1280-proto.png');
    const fp1280ReactFile = path.join(outDir, 'full-1280-react.png');
    await protoPage.screenshot({ path: fp1280ProtoFile, fullPage: true });
    await reactPage.screenshot({ path: fp1280ReactFile, fullPage: true });
    captured.push(path.relative(ROOT, fp1280ProtoFile));
    captured.push(path.relative(ROOT, fp1280ReactFile));
    console.error('[screenshot] OK  full-page 1280 (proto + react)');

    // --- Full-page screenshots at 1440 wide ---
    const vp1440 = { width: 1440, height: 900 };
    await protoPage.setViewportSize(vp1440);
    await reactPage.setViewportSize(vp1440);
    await protoPage.waitForTimeout(300);
    await reactPage.waitForTimeout(300);

    const fp1440ProtoFile = path.join(outDir, 'full-1440-proto.png');
    const fp1440ReactFile = path.join(outDir, 'full-1440-react.png');
    await protoPage.screenshot({ path: fp1440ProtoFile, fullPage: true });
    await reactPage.screenshot({ path: fp1440ReactFile, fullPage: true });
    captured.push(path.relative(ROOT, fp1440ProtoFile));
    captured.push(path.relative(ROOT, fp1440ReactFile));
    console.error('[screenshot] OK  full-page 1440 (proto + react)');

    console.error(`[screenshot] Done. Captured: ${captured.length}, Skipped: ${skipped.length}`);
  } finally {
    await teardown();
  }

  // Generate markdown index (Phase 3-B)
  let indexPath: string | undefined;
  if (writeIndex) {
    const runTimestamp = new Date().toISOString();
    indexPath = generateMarkdownIndex(outDir, captured, runTimestamp);
  }

  return { captured, skipped, total: captured.length, indexPath };
}
