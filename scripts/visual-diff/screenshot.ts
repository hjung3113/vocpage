/**
 * screenshot.ts — orchestrates per-component PNG capture for prototype and React /voc.
 *
 * Invoked via `npm run visual-diff -- --screenshots`.
 * Reuses bootHarness() and per-element capture helpers in screenshot-capture.ts.
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
import { bootHarness } from './harness.js';
import { SELECTOR_MAP } from './selectors.js';
import {
  captureElement,
  captureReactCreateModal,
  captureReactNotifDropdown,
  captureReactReviewDrawer,
  openPrototypeOverlays,
} from './screenshot-capture.js';
import { generateMarkdownIndex } from './screenshot-index.js';

// Re-export so existing importers of screenshot.ts keep working.
export { generateMarkdownIndex } from './screenshot-index.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const SCREENSHOT_DIR = path.join(ROOT, 'docs/specs/reviews/wave1.5-followup-a/screenshots');

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
