// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Homepage Discovery & Navigation Flow', () => {
  test('loads homepage with vector logo, search bar, and 7 document cards', async ({ page }) => {
    await page.goto('/');

    // Check page title and official vector logo
    await expect(page).toHaveTitle(/BanglaDoc/);
    const logoImg = page.locator('.logo-icon-svg');
    await expect(logoImg).toBeVisible();
    await expect(logoImg).toHaveAttribute('src', 'assets/icons/logo-mark.svg');

    // Check search bar
    const searchInput = page.locator('#catalogSearchInput');
    await expect(searchInput).toBeVisible();

    // Verify all 7 document cards are present
    const cards = page.locator('.catalog-card');
    await expect(cards).toHaveCount(7);
  });

  test('filters document list dynamically on search input', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('#catalogSearchInput');

    // Search for "ভাড়া" (rent)
    await searchInput.fill('ভাড়া');
    await expect(page.locator('.catalog-card:visible')).toHaveCount(2); // Residential and Commercial Rent

    // Search for "ছুটি" (leave)
    await searchInput.fill('ছুটি');
    const visibleCards = page.locator('.catalog-card:visible');
    await expect(visibleCards).toHaveCount(1);
    await expect(visibleCards.first()).toContainText('ছুটির আবেদন');

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('.catalog-card:visible')).toHaveCount(7);
  });

  test('clicking "অফিসে ছুটির আবেদন" navigates to leave-application.html (not police GD)', async ({ page }) => {
    await page.goto('/');
    const leaveCard = page.locator('.catalog-card', { hasText: 'অফিসে ছুটির আবেদন' });
    await leaveCard.click();

    await expect(page).toHaveURL(/leave-application\.html/);
    await expect(page.locator('#viewSubject')).toContainText('ছুটির জন্য আবেদন');
  });

  test('clicking "বাসা ও ফ্ল্যাট ভাড়ার চুক্তিপত্র" navigates to rent-agreement.html', async ({ page }) => {
    await page.goto('/');
    const rentCard = page.locator('.catalog-card', { hasText: 'বাসা ও ফ্ল্যাট ভাড়ার চুক্তিপত্র' });
    await rentCard.click();

    await expect(page).toHaveURL(/rent-agreement\.html/);
    await expect(page.locator('.doc-title')).toContainText('ভাড়ার চুক্তিপত্র');
  });
});
