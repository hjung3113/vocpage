/**
 * overlays.ts — open prototype/React overlays (modal, dropdown, drawer) before
 * style extraction so overlay components are measurable.
 *
 * Extracted from index.ts (SRP: overlay-opening side effects only).
 */

import type { Page } from 'playwright';

export async function openPrototypeOverlays(page: Page): Promise<void> {
  // Wait for globals to be attached
  try {
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).openModal === 'function',
      { timeout: 5_000 },
    );
  } catch {
    console.error('[harness] Warning: window.openModal not available within 5s');
  }

  // Open voc-create-modal
  try {
    await page.evaluate(() => {
      (window as unknown as Record<string, () => void>).openModal?.();
    });
    await page.waitForSelector('#modalBg', { state: 'visible', timeout: 5_000 });
    console.error('[harness] Proto overlay: #modalBg visible');
  } catch (e) {
    console.error('[harness] Warning: failed to open proto modal:', e);
  }

  // Open voc-notif-dropdown
  try {
    const notifBtn = await page.$('#notifBtn');
    if (notifBtn) {
      await notifBtn.click();
      await page.waitForSelector('#notifPanel', { state: 'visible', timeout: 5_000 });
      console.error('[harness] Proto overlay: #notifPanel visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open proto notif panel:', e);
  }
}

export async function openReactOverlays(page: Page): Promise<void> {
  // Open voc-create-modal
  try {
    const createBtn = await page.$('button:has-text("새 VOC 등록")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForSelector('[data-pcomp="voc-create-modal"]', {
        state: 'visible',
        timeout: 8_000,
      });
      console.error('[harness] React overlay: voc-create-modal visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react create modal:', e);
  }

  // Open voc-notif-dropdown
  try {
    const bellBtn = await page.$('[data-pcomp="notification-bell"]');
    if (bellBtn) {
      await bellBtn.click();
      await page.waitForSelector('[data-pcomp="voc-notif-dropdown"]', {
        state: 'visible',
        timeout: 5_000,
      });
      console.error('[harness] React overlay: voc-notif-dropdown visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react notif dropdown:', e);
  }

  // Open voc-review-drawer by clicking first table row
  try {
    const firstRow = await page.$('thead[data-pcomp="data-table"] ~ tbody tr');
    if (firstRow) {
      await firstRow.click();
      await page.waitForSelector('[data-pcomp="voc-review-drawer"]', {
        state: 'visible',
        timeout: 8_000,
      });
      console.error('[harness] React overlay: voc-review-drawer visible');
    }
  } catch (e) {
    console.error('[harness] Warning: failed to open react review drawer:', e);
  }
}

export async function detectSortKeyMismatch(
  protoPage: Page,
  reactPage: Page,
): Promise<string | undefined> {
  try {
    const protoSort = await protoPage.evaluate(() => {
      const active = document.querySelector('.sort-active, .sort-chip.active, [aria-sort]');
      return active?.textContent?.trim() ?? 'unknown';
    });

    const reactSort = await reactPage.evaluate(() => {
      const active = document.querySelector(
        '[data-active="true"], [aria-sort="descending"], [aria-sort="ascending"]',
      );
      return active?.textContent?.trim() ?? 'unknown';
    });

    if (protoSort !== reactSort) {
      return `Default sort key differs: prototype=\`${protoSort}\`, react=\`${reactSort}\``;
    }
  } catch {
    // Non-critical — don't fail the harness
  }
  return undefined;
}
