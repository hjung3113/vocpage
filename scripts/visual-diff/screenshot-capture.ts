/**
 * screenshot-capture.ts — element capture helpers for the screenshot runner.
 *
 * Extracted from screenshot.ts (SRP: capture concerns only — no orchestration,
 * no markdown index generation).
 */

import * as path from 'path';
import * as url from 'url';
import type { Page } from 'playwright';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

/**
 * Capture a single element screenshot. Warns and skips if the element is not
 * found or not visible (resilient to overlay/portal sequencing issues).
 */
export async function captureElement(
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
export async function openPrototypeOverlays(page: Page): Promise<void> {
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
export async function captureReactCreateModal(page: Page, outDir: string): Promise<boolean> {
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
export async function captureReactNotifDropdown(page: Page, outDir: string): Promise<boolean> {
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
export async function captureReactReviewDrawer(page: Page, outDir: string): Promise<boolean> {
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
