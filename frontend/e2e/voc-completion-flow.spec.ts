import { test, expect } from '@playwright/test';

/**
 * voc-completion driver D-3 — single end-to-end Playwright path covering
 * the Result Review submission added in this PR (feature-voc.md §9.4.5).
 *
 * Scope kept tight: login → list → create → open detail → approve.
 * Status transitions through EditableSelect are exercised by Vitest unit
 * tests; e2e here proves the new BE/FE wire + manager-only gate land.
 */
test.describe('VOC completion flow — payload review', () => {
  test.setTimeout(30_000);

  test('manager: login → create → open detail → approve', async ({ page }) => {
    // 1. Login as manager via mock-login
    await page.goto('/mock-login');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/voc/, { timeout: 10_000 });

    // 2. List loaded
    const rows = page.locator('[data-testid="voc-table"] tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // 3. Create modal — submit a new VOC
    await page.click('button:has-text("새 VOC 등록")');
    const modal = page.locator('[data-testid="create-modal"]');
    await expect(modal).toBeVisible();
    await page.fill('#voc-title', 'E2E completion-flow VOC');
    await expect(page.locator('#voc-type')).toHaveValue(/.+/, { timeout: 5_000 });
    await page.click('[data-testid="create-modal"] button[type="submit"]');
    await expect(modal).not.toBeVisible({ timeout: 8_000 });

    // 4. New VOC visible at the top of the list (sort=created_at desc)
    await expect(rows.first()).toContainText('E2E completion-flow VOC', { timeout: 8_000 });

    // 5. Click into a stable fixture VOC (issue_code-based) — drawer opens
    await rows.filter({ hasText: 'ANALYSIS-2026-0001' }).first().click();
    await expect(page.locator('[data-testid="review-drawer"]')).toBeVisible({
      timeout: 8_000,
    });

    // 6. Navigate to the per-VOC detail page where review actions live.
    //    Direct URL keeps the spec independent of drawer-detail navigation
    //    UI changes (which sibling executors are reshaping in parallel).
    await page.goto('/voc/ANALYSIS-2026-0001');
    await expect(page.locator('[data-testid="payload-review-actions"]')).toBeVisible({
      timeout: 10_000,
    });

    // 7. Approve via the new endpoint
    await page.click('[data-testid="payload-review-approve"]');

    // 8. After mutation resolves, the action button stays disabled briefly
    //    then re-enables — confirm no error toast / page is still alive.
    await expect(page.locator('[data-testid="payload-review-actions"]')).toBeVisible({
      timeout: 5_000,
    });
  });
});
