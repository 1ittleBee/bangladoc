// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Rent Agreement Generator Flow', () => {
  test('updates live preview when form inputs change', async ({ page }) => {
    await page.goto('/rent-agreement.html');

    // Landlord info
    const landlordInput = page.locator('#landlordName');
    await landlordInput.fill('জনাব মো: শফিকুল ইসলাম');
    await expect(page.locator('#viewLandlordName')).toHaveText('জনাব মো: শফিকুল ইসলাম');

    // Tenant info
    const tenantInput = page.locator('#tenantName');
    await tenantInput.fill('আনিসুল হক');
    await expect(page.locator('#viewTenantName')).toHaveText('আনিসুল হক');

    // Monthly Rent
    const rentInput = page.locator('#monthlyRent');
    await rentInput.fill('28000');
    await expect(page.locator('#viewRentNumber')).toHaveText('২৮০০০');
    await expect(page.locator('#rentWords')).toHaveText('আঠাশ হাজার টাকা মাত্র');
    await expect(page.locator('#viewRentWords')).toHaveText('আঠাশ হাজার টাকা মাত্র');
  });

  test('AutoDraft displays recovery banner when previous draft exists in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bangladoc_draft_rent', JSON.stringify({
        landlordName: 'ফারুক আহমেদ চৌধুরী'
      }));
    });

    await page.goto('/rent-agreement.html');

    // Restoration banner should be displayed
    const banner = page.locator('#draftAlertBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('পূর্ববর্তী অসম্পূর্ণ খসড়া');
    await expect(page.locator('#landlordName')).toHaveValue('ফারুক আহমেদ চৌধুরী');
  });

  test('Mobile Sticky Dock toggles between Form and Document Preview', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only relevant for mobile viewports');

    await page.goto('/rent-agreement.html');

    const dockToggleBtn = page.locator('#dockToggleBtn');
    const formPanel = page.locator('#formPanel');
    const previewPanel = page.locator('#previewPanel');

    await expect(dockToggleBtn).toBeVisible();

    // First toggle via sticky dock
    await dockToggleBtn.click({ force: true });
    const isPreview1 = await previewPanel.isVisible();
    const isForm1 = await formPanel.isVisible();
    // Exclusivity: exactly one panel must be active
    expect(isPreview1 !== isForm1).toBe(true);

    // Second toggle back via sticky dock
    await dockToggleBtn.click({ force: true });
    const isPreview2 = await previewPanel.isVisible();
    const isForm2 = await formPanel.isVisible();
    expect(isPreview2).toBe(!isPreview1);
    expect(isForm2).toBe(!isForm1);
  });

  test('triggers Word document download on export button click', async ({ page, isMobile }) => {
    await page.goto('/rent-agreement.html');

    if (isMobile) {
      // On mobile, explicitly activate the preview tab to expose the toolbar
      await page.locator('#tabPreviewBtn').click();
    }

    // Listen for download event
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.preview-toolbar button', { hasText: 'Word' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('বাসা_ভাড়ার_চুক্তিপত্র_BanglaDoc.doc');
  });
});
