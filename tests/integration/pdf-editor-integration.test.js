/**
 * Integration Test for BanglaDoc PDF Editor & Signer (pdf-editor.html)
 * Verifies DOM structure, toolbar buttons, signature modal tabs,
 * and UI state transitions between welcome screen and workspace.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '../../');
const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'pdf-editor.html'), 'utf-8');
const pdfEditorJs = fs.readFileSync(path.join(ROOT_DIR, 'js/pdf-editor.js'), 'utf-8');
const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'js/theme.js'), 'utf-8');
const converterJs = fs.readFileSync(path.join(ROOT_DIR, 'js/converter.js'), 'utf-8');

function setupPdfEditorDOM() {
  // Strip external script tags for controlled JSDOM injection
  let html = htmlContent.replace(/<script src="[^"]+"><\/script>/g, '');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://bangladoc.com/pdf-editor.html'
  });

  const { window } = dom;

  // Unconditional Mock for JSDOM canvas methods
  const mockCtx = {
    fillRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillText: () => {},
    strokeRect: () => {},
    save: () => {},
    restore: () => {},
    drawImage: () => {}
  };
  window.HTMLCanvasElement.prototype.getContext = function () {
    return mockCtx;
  };
  window.HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  };

  // Evaluate scripts in order
  window.eval(converterJs);
  window.eval(themeJs);
  window.eval(pdfEditorJs);

  // Dispatch DOMContentLoaded
  const event = window.document.createEvent('Event');
  event.initEvent('DOMContentLoaded', true, true);
  window.document.dispatchEvent(event);

  return { dom, window, document: window.document };
}

describe('PDF Editor Integration Test - Structure & Tooling', () => {
  it('renders all essential core layout containers and action buttons', () => {
    const { document } = setupPdfEditorDOM();

    // Welcome Screen & Actions
    assert.ok(document.getElementById('welcomeScreen'), 'Welcome screen must exist');
    assert.ok(document.getElementById('pdfDropZone'), 'Drop zone must exist');
    assert.ok(document.getElementById('pdfFileInput'), 'File input must exist');
    assert.ok(document.getElementById('btnTryDemo'), 'Try Demo button must exist');
    assert.ok(document.getElementById('btnBlankDoc'), 'Blank Document button must exist');

    // Studio Workspace Screen
    assert.ok(document.getElementById('workspaceScreen'), 'Workspace screen must exist');
    assert.ok(document.getElementById('pdfBaseCanvas'), 'Base PDF canvas must exist');
    assert.ok(document.getElementById('drawingCanvas'), 'Drawing canvas must exist');
    assert.ok(document.getElementById('annotationOverlay'), 'Annotation overlay layer must exist');
    assert.ok(document.getElementById('thumbnailList'), 'Thumbnails sidebar must exist');

    // Studio Top Actions
    assert.ok(document.getElementById('btnExportPdf'), 'Export PDF button must exist');
    assert.ok(document.getElementById('btnPrintPdf'), 'Print PDF button must exist');
    assert.ok(document.getElementById('btnRotatePage'), 'Rotate Page button must exist');
    assert.ok(document.getElementById('btnDeletePage'), 'Delete Page button must exist');
    assert.ok(document.getElementById('btnAddPage'), 'Add Page button must exist');
    assert.ok(document.getElementById('btnUndo'), 'Undo button must exist');
    assert.ok(document.getElementById('btnRedo'), 'Redo button must exist');
  });

  it('declares all 9 interactive editing tools in the ribbon', () => {
    const { document } = setupPdfEditorDOM();

    const expectedTools = ['select', 'text', 'signature', 'pen', 'highlighter', 'whiteout', 'stamp', 'date', 'image'];
    expectedTools.forEach(tool => {
      const btn = document.querySelector(`[data-tool="${tool}"]`);
      assert.ok(btn, `Tool button for "${tool}" must exist`);
    });
  });

  it('renders digital signature modal with 3 functional tabs', () => {
    const { document } = setupPdfEditorDOM();

    const modal = document.getElementById('signatureModal');
    assert.ok(modal, 'Signature modal must exist');

    const drawTab = document.querySelector('[data-sig-tab="paneDraw"]');
    const typeTab = document.querySelector('[data-sig-tab="paneType"]');
    const uploadTab = document.querySelector('[data-sig-tab="paneUpload"]');
    assert.ok(drawTab && typeTab && uploadTab, 'All three signature tabs must exist');

    const sigCanvas = document.getElementById('sigCanvas');
    const sigInput = document.getElementById('sigTypedInput');
    const applyBtn = document.getElementById('btnApplySignature');
    assert.ok(sigCanvas, 'Signature draw canvas must exist');
    assert.ok(sigInput, 'Signature typed input must exist');
    assert.ok(applyBtn, 'Apply signature button must exist');
  });

  it('transitions from welcome screen to workspace when clicking demo button', async () => {
    const { document, window } = setupPdfEditorDOM();

    const welcome = document.getElementById('welcomeScreen');
    const workspace = document.getElementById('workspaceScreen');
    const btnTryDemo = document.getElementById('btnTryDemo');

    assert.equal(workspace.style.display, '');

    // Click demo button
    btnTryDemo.click();

    // Allow promise resolution
    await new Promise(r => setTimeout(r, 20));

    assert.equal(welcome.style.display, 'none');
    assert.equal(workspace.style.display, 'flex');
    assert.equal(document.getElementById('docTitleLabel').innerText, 'নমুনা_চুক্তিপত্র_BanglaDoc.pdf');
  });
});
