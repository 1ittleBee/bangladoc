/**
 * Unit Tests for BanglaDoc PDF Editor Engine (js/pdf-editor.js)
 * Tests core state, annotation lifecycle, stamp presets, page rotation/deletion,
 * undo/redo stack, and PDF export integrity.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { PdfEditorCore, STAMP_PRESETS } = require('../../js/pdf-editor.js');

describe('PdfEditorCore - Initialization & Blank Document', () => {
  let editor;

  beforeEach(() => {
    editor = new PdfEditorCore({ fileName: 'test.pdf' });
  });

  it('initializes with default tool and empty pages', () => {
    assert.equal(editor.fileName, 'test.pdf');
    assert.equal(editor.currentTool, 'select');
    assert.equal(editor.currentPageIndex, 0);
    assert.equal(editor.pages.length, 0);
  });

  it('loads a blank A4 document and creates page state', async () => {
    await editor.loadBlankDocument(1);
    assert.equal(editor.getPageCount(), 1);
    const page = editor.getCurrentPage();
    assert.ok(page, 'Current page must exist');
    assert.equal(page.pageIndex, 0);
    assert.equal(page.rotation, 0);
    assert.equal(page.annotations.length, 0);
    assert.equal(page.drawings.length, 0);
    assert.ok(editor.originalPdfBytes instanceof Uint8Array);
  });

  it('loads demo document with pre-configured Bangla agreement title and stamp', async () => {
    await editor.loadDemoDocument();
    assert.equal(editor.getPageCount(), 1);
    const page = editor.getCurrentPage();
    assert.ok(page.annotations.length >= 2, 'Demo page must contain demo annotations');
    assert.equal(page.annotations[0].type, 'text');
    assert.equal(page.annotations[1].type, 'stamp');
  });
});

describe('PdfEditorCore - Tool & Annotation Management', () => {
  let editor;

  beforeEach(async () => {
    editor = new PdfEditorCore({ fileName: 'doc.pdf' });
    await editor.loadBlankDocument(1);
  });

  it('sets active tool and updates tool options', () => {
    editor.setTool('text', { textSize: 24, textColor: '#0d6e63' });
    assert.equal(editor.currentTool, 'text');
    assert.equal(editor.toolOptions.textSize, 24);
    assert.equal(editor.toolOptions.textColor, '#0d6e63');
  });

  it('adds, updates, and deletes text annotation', () => {
    const ann = editor.addAnnotation({
      type: 'text',
      x: 100,
      y: 150,
      text: 'দ্বিতীয় পক্ষ ভাড়াটিয়া',
      fontSize: 18,
      color: '#0f172a'
    });

    assert.ok(ann.id, 'Annotation must be assigned a unique ID');
    assert.equal(editor.getCurrentPage().annotations.length, 1);
    assert.equal(editor.selectedAnnotationId, ann.id);

    // Update annotation
    const updated = editor.updateAnnotation(ann.id, { text: 'প্রথম পক্ষ বাড়িওয়ালা' });
    assert.equal(updated, true);
    assert.equal(editor.getCurrentPage().annotations[0].text, 'প্রথম পক্ষ বাড়িওয়ালা');

    // Delete annotation
    const deleted = editor.deleteAnnotation(ann.id);
    assert.equal(deleted, true);
    assert.equal(editor.getCurrentPage().annotations.length, 0);
    assert.equal(editor.selectedAnnotationId, null);
  });

  it('adds official Bangladeshi stamp preset correctly', () => {
    const preset = STAMP_PRESETS.APPROVED;
    assert.ok(preset, 'APPROVED preset must exist');

    const stamp = editor.addAnnotation({
      type: 'stamp',
      stampId: preset.id,
      stampTitle: preset.title,
      stampSub: preset.sub,
      color: preset.color,
      x: 200,
      y: 300,
      width: 150,
      height: 60
    });

    assert.equal(stamp.stampTitle, 'অনুমোদিত');
    assert.equal(stamp.color, '#059669');
    assert.equal(editor.getCurrentPage().annotations.length, 1);
  });

  it('adds whiteout redaction box and drawing strokes', () => {
    const whiteout = editor.addAnnotation({
      type: 'whiteout',
      x: 50,
      y: 80,
      width: 200,
      height: 25,
      color: '#ffffff'
    });
    assert.equal(whiteout.type, 'whiteout');

    const stroke = editor.addDrawingStroke({
      tool: 'pen',
      color: '#0d6e63',
      width: 4,
      points: [{ x: 10, y: 10 }, { x: 20, y: 25 }, { x: 30, y: 40 }]
    });

    assert.equal(editor.getCurrentPage().drawings.length, 1);
    assert.equal(stroke.tool, 'pen');
  });
});

describe('PdfEditorCore - Undo / Redo Mechanism', () => {
  let editor;

  beforeEach(async () => {
    editor = new PdfEditorCore();
    await editor.loadBlankDocument(1);
  });

  it('undoes and redoes annotation additions smoothly', () => {
    assert.equal(editor.getCurrentPage().annotations.length, 0);

    // Action 1
    const ann1 = editor.addAnnotation({ type: 'text', text: 'অঙ্গীকারনামা' });
    assert.equal(editor.getCurrentPage().annotations.length, 1);

    // Action 2
    const ann2 = editor.addAnnotation({ type: 'text', text: 'তারিখ: ১৭ অক্টোবর' });
    assert.equal(editor.getCurrentPage().annotations.length, 2);

    // Undo Action 2
    const undo1 = editor.undo();
    assert.equal(undo1, true);
    assert.equal(editor.getCurrentPage().annotations.length, 1);
    assert.equal(editor.getCurrentPage().annotations[0].text, 'অঙ্গীকারনামা');

    // Undo Action 1
    const undo2 = editor.undo();
    assert.equal(undo2, true);
    assert.equal(editor.getCurrentPage().annotations.length, 0);

    // Redo Action 1
    const redo1 = editor.redo();
    assert.equal(redo1, true);
    assert.equal(editor.getCurrentPage().annotations.length, 1);
    assert.equal(editor.getCurrentPage().annotations[0].text, 'অঙ্গীকারনামা');

    // Redo Action 2
    const redo2 = editor.redo();
    assert.equal(redo2, true);
    assert.equal(editor.getCurrentPage().annotations.length, 2);
  });
});

describe('PdfEditorCore - Page Operations', () => {
  let editor;

  beforeEach(async () => {
    editor = new PdfEditorCore();
    await editor.loadBlankDocument(1);
  });

  it('rotates current page 90 degrees sequentially', () => {
    assert.equal(editor.getCurrentPage().rotation, 0);
    assert.equal(editor.rotateCurrentPage(90), 90);
    assert.equal(editor.rotateCurrentPage(90), 180);
    assert.equal(editor.rotateCurrentPage(90), 270);
    assert.equal(editor.rotateCurrentPage(90), 0);
  });

  it('adds new blank page and navigates between pages', () => {
    assert.equal(editor.getPageCount(), 1);
    editor.addPage();
    assert.equal(editor.getPageCount(), 2);
    assert.equal(editor.currentPageIndex, 1);

    assert.equal(editor.goToPage(0), true);
    assert.equal(editor.currentPageIndex, 0);
    assert.equal(editor.goToPage(99), false); // Out of bounds
  });

  it('deletes page correctly but refuses to delete the only page', () => {
    assert.equal(editor.getPageCount(), 1);
    assert.equal(editor.deleteCurrentPage(), false); // Cannot delete sole page

    editor.addPage();
    assert.equal(editor.getPageCount(), 2);
    assert.equal(editor.deleteCurrentPage(), true);
    assert.equal(editor.getPageCount(), 1);
  });
});

describe('PdfEditorCore - Signatures & Export', () => {
  it('generates typed signature with styled calligraphy', () => {
    const sig = PdfEditorCore.generateTypedSignature('মোঃ রফিকুল ইসলাম', 'bangla-calligraphy', '#0d6e63');
    assert.ok(typeof sig === 'string' && sig.length > 20);
  });

  it('exports modified PDF returning valid PDF byte stream', async () => {
    const editor = new PdfEditorCore({ fileName: 'test-agreement.pdf' });
    await editor.loadBlankDocument(1);
    editor.addAnnotation({ type: 'text', text: 'স্বাক্ষরিত' });

    const result = await editor.exportPdf();
    assert.ok(result.bytes instanceof Uint8Array);
    assert.ok(result.bytes.length > 100);
    assert.equal(result.fileName, 'test-agreement-edited.pdf');

    // Verify PDF header magic bytes %PDF-
    const header = String.fromCharCode(...result.bytes.slice(0, 5));
    assert.equal(header, '%PDF-');
  });
});
