import { test, expect } from '@playwright/test';

test.describe('VOC happy path', () => {
  test('login → list → create modal → submit → detail → history', async ({ page }) => {
    // 1. Login via mock login page
    await page.goto('/mock-login');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/voc/, { timeout: 10_000 });

    // 2. List loaded — at least one row visible
    const rows = page.locator('[data-testid="voc-table"] tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const initialRowCount = await rows.count();
    expect(initialRowCount).toBeGreaterThan(0);

    // 3. Open create modal
    await page.click('button:has-text("새 VOC 등록")');
    await expect(page.locator('[data-pcomp="voc-create-modal"]')).toBeVisible();

    // 4. Fill the form
    await page.fill('#voc-title', 'E2E happy path test VOC');

    // Wait for vocTypes to load — the select must have an option value before submitting
    // (vocTypesQ resolves asynchronously; empty voc_type_id fails zod Uuid validation)
    await expect(page.locator('#voc-type option').first()).toBeAttached({ timeout: 5_000 });

    // Submit
    await page.click('[data-pcomp="voc-create-modal"] button[type="submit"]');

    // 5. Modal closes after successful submit
    await expect(page.locator('[data-pcomp="voc-create-modal"]')).not.toBeVisible({
      timeout: 8_000,
    });

    // 6. New VOC title visible somewhere in the list (sort: created_at desc, so it's first)
    await expect(page.locator('text=E2E happy path test VOC').first()).toBeVisible({
      timeout: 8_000,
    });

    // 7. Click a VOC that has history entries — VOC_FIXTURES[0] is the second row after
    //    the newly created VOC (sort: created_at desc). The fixtures have 5 history entries
    //    for the first fixture. Use nth(1) to click it.
    await rows.nth(1).click();
    await expect(page.locator('[data-pcomp="voc-review-drawer"]')).toBeVisible({
      timeout: 8_000,
    });

    // 8. Switch to history tab inside the drawer
    await page.click('[role="tab"]:has-text("변경이력")');

    // History list should render at least one entry (fixtures have 5 entries for VOC_FIXTURES[0])
    const historyPanel = page.locator('[data-testid="drawer-history"]');
    await expect(historyPanel).toBeVisible();
    await expect(historyPanel.locator('li').first()).toBeVisible({ timeout: 5_000 });
  });
});
