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

    // Wait for vocTypes to populate the select with a real UUID value
    // (vocTypesQ resolves asynchronously; empty voc_type_id fails zod Uuid validation)
    await expect(page.locator('#voc-type')).toHaveValue(/.+/, { timeout: 5_000 });

    // Submit
    await page.click('[data-pcomp="voc-create-modal"] button[type="submit"]');

    // 5. Modal closes after successful submit
    await expect(page.locator('[data-pcomp="voc-create-modal"]')).not.toBeVisible({
      timeout: 8_000,
    });

    // 6. New VOC title visible at the TOP of the list (sort=created_at desc).
    //    Asserting first-row position is stronger than just any-visible: it catches
    //    list-not-refetched bugs even when pagination caps total row count.
    //    (Don't assert toHaveCount(initialRowCount + 1) — list is paginated to 20.)
    await expect(rows.first()).toContainText('E2E happy path test VOC', { timeout: 8_000 });

    // 7. Click a VOC by stable fixture issue_code (VOC-0001 has 5 history entries).
    //    Avoids fragile sort-order assumptions.
    await rows.filter({ hasText: 'VOC-0001' }).first().click();
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
