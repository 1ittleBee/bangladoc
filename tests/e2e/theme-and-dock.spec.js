// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Theme & Accessibility End-to-End Suite', () => {
  test('toggles theme between light and dark mode and persists across pages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const themeBtn = page.locator('#themeToggleBtn');
    await expect(themeBtn).toBeVisible();

    // Toggle theme
    await themeBtn.click();
    const docTheme = await page.locator('html').getAttribute('data-theme');
    expect(docTheme).toMatch(/^(light|dark)$/);

    // Navigate to another page and verify theme persistence
    await page.goto('/money-loan.html', { waitUntil: 'domcontentloaded' });
    const persistedTheme = await page.locator('html').getAttribute('data-theme');
    expect(persistedTheme).toBe(docTheme);
  });

  test('clicking copy button shows universal toast notification', async ({ page, isMobile }) => {
    await page.goto('/rent-agreement.html', { waitUntil: 'domcontentloaded' });

    if (isMobile) {
      await page.locator('#tabPreviewBtn').click();
    }

    const copyBtn = page.locator('#copyBtn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    const toast = page.locator('#banglaDocToast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('কপি');
  });
});
