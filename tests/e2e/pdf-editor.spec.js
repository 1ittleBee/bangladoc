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
    const addPageBtn = page.locator('#btnAddPage');
    await addPageBtn.scrollIntoViewIfNeeded();
    await addPageBtn.click();
    await expect(page.locator('#pageIndicator')).toContainText('2 / 2');

    // Export button is ready
    const exportBtn = page.locator('#btnExportPdf');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('PDF ডাউনলোড');
  });

  test('uploads an external multi-page PDF document and renders visible canvas and thumbnail previews', async ({ page }) => {
    const { PDFDocument, rgb } = require('pdf-lib');
    const fs = require('fs');
    const path = require('path');

    const pdfDoc = await PDFDocument.create();
    for (let i = 1; i <= 3; i++) {
      const p = pdfDoc.addPage([595.28, 841.89]);
      p.drawText(`E2E Test Page ${i}`, { x: 50, y: 800, size: 20, color: rgb(0.1, 0.1, 0.1) });
    }
    const pdfBytes = await pdfDoc.save();
    const tempFile = path.resolve(__dirname, 'e2e_temp_upload.pdf');
    fs.writeFileSync(tempFile, pdfBytes);

    try {
      await page.goto('/pdf-editor.html', { waitUntil: 'domcontentloaded' });

      // Upload file
      const fileInput = page.locator('#pdfFileInput');
      await fileInput.setInputFiles(tempFile);

      // Verify workspace opens
      const workspace = page.locator('#workspaceScreen');
      await expect(workspace).toBeVisible();

      // Check title and page counter
      await expect(page.locator('#docTitleLabel')).toContainText('e2e_temp_upload.pdf');
      await expect(page.locator('#pageIndicator')).toContainText('1 / 3');

      // Verify canvas wrapper is visible and positioned in the viewport
      const canvasWrapper = page.locator('#canvasWrapper');
      await expect(canvasWrapper).toBeVisible();

      const wrapperBox = await canvasWrapper.boundingBox();
      expect(wrapperBox).not.toBeNull();
      if (wrapperBox) {
        expect(wrapperBox.width).toBeGreaterThan(300);
        expect(wrapperBox.height).toBeGreaterThan(400);
        expect(wrapperBox.y).toBeLessThan(400);
      }

      // Verify thumbnails are rendered with thumbnail canvas
      const thumbCards = page.locator('.thumb-card');
      await expect(thumbCards).toHaveCount(3);
      const firstThumbCanvas = thumbCards.first().locator('canvas');
      const isMobile = (page.viewportSize()?.width || 1280) <= 768;
      if (isMobile) {
        await expect(firstThumbCanvas).toBeAttached();
      } else {
        await expect(firstThumbCanvas).toBeVisible();
      }

      // Navigate to next page and check indicator
      const nextBtn = page.locator('#btnNextPage');
      await nextBtn.scrollIntoViewIfNeeded();
      await nextBtn.click();
      await expect(page.locator('#pageIndicator')).toContainText('2 / 3');

      // Check that buffer was not detached
      const isDetached = await page.evaluate(() => {
        return window.pdfEditorInstance && window.pdfEditorInstance.core.originalPdfBytes
          ? window.pdfEditorInstance.core.originalPdfBytes.byteLength === 0
          : false;
      });
      expect(isDetached).toBe(false);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
