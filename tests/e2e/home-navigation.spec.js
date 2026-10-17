// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Homepage Discovery & Navigation Flow', () => {
  test('loads homepage with vector logo, search bar, and 8 catalog cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check page title and official vector logo
    await expect(page).toHaveTitle(/BanglaDoc/);
    const logoImg = page.locator('.logo-icon-svg');
    await expect(logoImg).toBeVisible();
    await expect(logoImg).toHaveAttribute('src', 'assets/icons/logo-mark.svg');

    // Check search bar
    const searchInput = page.locator('#catalogSearchInput');
    await expect(searchInput).toBeVisible();

    // Verify all 8 catalog cards are present (7 generators + PDF Editor)
    const cards = page.locator('.catalog-card');
    await expect(cards).toHaveCount(8);
  });

  test('filters document list dynamically on search input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const searchInput = page.locator('#catalogSearchInput');

    // Search for "ভাড়া" (rent)
    await searchInput.fill('ভাড়া');
    await expect(page.locator('.catalog-card:visible')).toHaveCount(2); // Residential and Commercial Rent

    // Search for "ছুটি" (leave)
    await searchInput.fill('ছুটি');
    const visibleCards = page.locator('.catalog-card:visible');
    await expect(visibleCards).toHaveCount(1);
    await expect(visibleCards.first()).toContainText('ছুটির আবেদন');

    // Search for "pdf"
    await searchInput.fill('pdf');
    const pdfCard = page.locator('.catalog-card:visible');
    await expect(pdfCard).toHaveCount(1);
    await expect(pdfCard.first()).toContainText('অনলাইন PDF এডিটর ও সাইনার');

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('.catalog-card:visible')).toHaveCount(8);
  });

  test('clicking "অফিসে ছুটির আবেদন" navigates to leave-application.html (not police GD)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const leaveCard = page.locator('.catalog-card', { hasText: 'অফিসে ছুটির আবেদন' });
    await leaveCard.click();

    await expect(page).toHaveURL(/leave-application\.html/);
    await expect(page.locator('#viewSubject')).toContainText('ছুটির জন্য আবেদন');
  });

  test('clicking "বাসা ও ফ্ল্যাট ভাড়ার চুক্তিপত্র" navigates to rent-agreement.html', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const rentCard = page.locator('.catalog-card', { hasText: 'বাসা ও ফ্ল্যাট ভাড়ার চুক্তিপত্র' });
    await rentCard.click();

    await expect(page).toHaveURL(/rent-agreement\.html/);
    await expect(page.locator('.doc-title')).toContainText('ভাড়ার চুক্তিপত্র');
  });

  test('clicking "অনলাইন PDF এডিটর ও সাইনার" navigates to pdf-editor.html', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pdfCard = page.locator('.catalog-card', { hasText: 'অনলাইন PDF এডিটর ও সাইনার' });
    await pdfCard.click();

    await expect(page).toHaveURL(/pdf-editor\.html/);
    await expect(page).toHaveTitle(/PDF এডিটর/);
  });
});
