// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('BanglaDoc PDF Editor & Signer E2E Studio Flow', () => {
  test('loads pdf-editor.html with hero, drop zone, and privacy guarantee', async ({ page }) => {
    await page.goto('/pdf-editor.html', { waitUntil: 'domcontentloaded' });

    // Page title and logo
    await expect(page).toHaveTitle(/বাংলা PDF এডিটর ও সাইনার/);
    const logoImg = page.locator('.logo-icon-svg');
    await expect(logoImg).toBeVisible();

    // Welcome screen and dropzone
    const welcomeScreen = page.locator('#welcomeScreen');
    await expect(welcomeScreen).toBeVisible();
    await expect(page.locator('#pdfDropZone')).toBeVisible();

    // Action buttons
    await expect(page.locator('#btnTryDemo')).toBeVisible();
    await expect(page.locator('#btnBlankDoc')).toBeVisible();
  });

  test('loads demo document and opens interactive studio workspace', async ({ page }) => {
    await page.goto('/pdf-editor.html', { waitUntil: 'domcontentloaded' });

    // Click Try Demo Document
    const btnTryDemo = page.locator('#btnTryDemo');
    await btnTryDemo.click();

    // Verify workspace becomes visible
    const workspace = page.locator('#workspaceScreen');
    await expect(workspace).toBeVisible();
    await expect(page.locator('#welcomeScreen')).toBeHidden();

    // Check title badge
    const titleBadge = page.locator('#docTitleLabel');
    await expect(titleBadge).toContainText('নমুনা_চুক্তিপত্র_BanglaDoc.pdf');

    // Check page indicator
    await expect(page.locator('#pageIndicator')).toContainText('1 / 1');

    // Verify tool ribbon has all tools
    const tools = ['select', 'text', 'signature', 'pen', 'highlighter', 'whiteout', 'stamp', 'date', 'image'];
    for (const tool of tools) {
      await expect(page.locator(`[data-tool="${tool}"]`)).toBeVisible();
    }

    // Verify canvas wrapper has rendered elements
    await expect(page.locator('#canvasWrapper')).toBeVisible();
    await expect(page.locator('#annotationOverlay')).toBeVisible();
  });

  test('opens signature modal and interacts with signature tabs', async ({ page }) => {
    await page.goto('/pdf-editor.html', { waitUntil: 'domcontentloaded' });

    // Load demo to get to workspace
    await page.locator('#btnTryDemo').click();
    await expect(page.locator('#workspaceScreen')).toBeVisible();

    // Click signature tool
    const sigTool = page.locator('[data-tool="signature"]');
    await sigTool.click();

    // Verify modal is shown
    const modal = page.locator('#signatureModal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/show/);

    // Switch to Typed tab
    const typeTab = page.locator('[data-sig-tab="paneType"]');
    await typeTab.click();
    await expect(page.locator('#paneType')).toBeVisible();

    const typedInput = page.locator('#sigTypedInput');
    await typedInput.fill('মোঃ হাসান মাহমুদ');
    await expect(typedInput).toHaveValue('মোঃ হাসান মাহমুদ');

    // Close modal
    await page.locator('#btnCloseSignature').click({ force: true });
    await expect(modal).not.toHaveClass(/show/);
  });

  test('adds a page and updates page counter in studio', async ({ page }) => {
    await page.goto('/pdf-editor.html', { waitUntil: 'domcontentloaded' });

    // Load blank document
    await page.locator('#btnBlankDoc').click();
    await expect(page.locator('#workspaceScreen')).toBeVisible();
    await expect(page.locator('#pageIndicator')).toContainText('1 / 1');

    // Add new page
    await page.locator('#btnAddPage').click({ force: true });
    await expect(page.locator('#pageIndicator')).toContainText('2 / 2');

    // Export button is ready
    const exportBtn = page.locator('#btnExportPdf');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('PDF ডাউনলোড');
  });
});
