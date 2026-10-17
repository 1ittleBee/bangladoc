/**
 * BANGLADOC - Client-Side PDF Editor & Signer Engine
 * 100% Privacy-First in-browser PDF annotation, digital signing,
 * redaction (whiteout), text stamping, and page manipulation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['pdf-lib'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let pdfLib;
    try {
      pdfLib = require('pdf-lib');
    } catch (e) {
      pdfLib = null;
    }
    module.exports = factory(pdfLib);
  } else {
    root.BanglaDocPdfEditor = factory(root.PDFLib);
  }
}(typeof self !== 'undefined' ? self : this, function (PDFLib) {
  'use strict';

  // Fallback to global PDFLib if not passed directly
  const getPDFLib = () => {
    if (PDFLib) return PDFLib;
    if (typeof window !== 'undefined' && window.PDFLib) return window.PDFLib;
    if (typeof globalThis !== 'undefined' && globalThis.PDFLib) return globalThis.PDFLib;
    return null;
  };

  /**
   * Official Bangladeshi Legal & Administrative Stamp Presets
   */
  const STAMP_PRESETS = {
    APPROVED: {
      id: 'APPROVED',
      title: 'অনুমোদিত',
      sub: 'OFFICIALLY APPROVED',
      color: '#059669',
      borderColor: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.08)'
    },
    VERIFIED: {
      id: 'VERIFIED',
      title: 'যাচাইকৃত',
      sub: 'DOCUMENTS VERIFIED',
      color: '#0d6e63',
      borderColor: '#0d6e63',
      bgColor: 'rgba(13, 110, 99, 0.08)'
    },
    PAID: {
      id: 'PAID',
      title: 'পরিশোধিত',
      sub: 'PAYMENT RECEIVED',
      color: '#2563eb',
      borderColor: '#2563eb',
      bgColor: 'rgba(37, 99, 235, 0.08)'
    },
    REJECTED: {
      id: 'REJECTED',
      title: 'বাতিল',
      sub: 'APPLICATION REJECTED',
      color: '#dc2626',
      borderColor: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.08)'
    },
    URGENT: {
      id: 'URGENT',
      title: 'জরুরি',
      sub: 'URGENT / PRIORITY',
      color: '#d97706',
      borderColor: '#d97706',
      bgColor: 'rgba(217, 119, 6, 0.08)'
    },
    CONFIDENTIAL: {
      id: 'CONFIDENTIAL',
      title: 'গোপনীয়',
      sub: 'STRICTLY CONFIDENTIAL',
      color: '#7c3aed',
      borderColor: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.08)'
    }
  };

  /**
   * Core State & Data Management Class for PDF Editing
   */
  class PdfEditorCore {
    constructor(options = {}) {
      this.fileName = options.fileName || 'document.pdf';
      this.originalPdfBytes = options.originalPdfBytes || null;
      this.currentPageIndex = 0;
      this.pages = []; // Array of { pageIndex, rotation, annotations, drawings, width, height }
      this.currentTool = 'select'; // 'select' | 'text' | 'draw' | 'highlight' | 'whiteout' | 'stamp' | 'signature' | 'date' | 'image'
      this.toolOptions = {
        textSize: 16,
        textColor: '#0f172a',
        textBold: false,
        textFont: 'Anek Bangla, Hind Siliguri, sans-serif',
        penColor: '#0f172a',
        penWidth: 3,
        highlighterColor: 'rgba(254, 240, 138, 0.45)',
        highlighterWidth: 20,
        whiteoutColor: '#ffffff',
        selectedStamp: 'APPROVED',
        signatureColor: '#0f172a',
        signatureFont: 'cursive'
      };
      this.undoStack = [];
      this.redoStack = [];
      this.selectedAnnotationId = null;
    }

    /**
     * Initializes blank A4 page(s)
     */
    async loadBlankDocument(pageCount = 1, width = 595.28, height = 841.89, fileName = null) {
      if (fileName) {
        this.fileName = fileName;
      } else if (!this.fileName || this.fileName === 'document.pdf') {
        this.fileName = 'bangladoc_blank.pdf';
      }
      const lib = getPDFLib();
      if (!lib) {
        // Fallback for mock/test environments
        this.originalPdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]); // %PDF-1.7
        this.pages = [];
        for (let i = 0; i < pageCount; i++) {
          this.pages.push({
            pageIndex: i,
            rotation: 0,
            width,
            height,
            annotations: [],
            drawings: []
          });
        }
        this.currentPageIndex = 0;
        return;
      }

      const doc = await lib.PDFDocument.create();
      for (let i = 0; i < pageCount; i++) {
        doc.addPage([width, height]);
      }
      this.originalPdfBytes = await doc.save();
      this.pages = [];
      for (let i = 0; i < pageCount; i++) {
        this.pages.push({
          pageIndex: i,
          rotation: 0,
          width,
          height,
          annotations: [],
          drawings: []
        });
      }
      this.currentPageIndex = 0;
      this.clearHistory();
    }

    /**
     * Generates a sample Bangla Agreement PDF for immediate 1-click testing
     */
    async loadDemoDocument() {
      const lib = getPDFLib();
      const width = 595.28;
      const height = 841.89;

      if (!lib) {
        await this.loadBlankDocument(1, width, height);
        this.fileName = 'নমুনা_চুক্তিপত্র_BanglaDoc.pdf';
        return;
      }

      const doc = await lib.PDFDocument.create();
      const page = doc.addPage([width, height]);

      // Draw demo watermark & standard text
      const font = await doc.embedFont(lib.StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(lib.StandardFonts.HelveticaBold);

      page.drawText('BanglaDoc - Sample Agreement Preview', {
        x: 50,
        y: height - 50,
        size: 14,
        font: fontBold,
        color: lib.rgb(0.05, 0.43, 0.38)
      });

      page.drawText('Digital PDF Editor & Signer Test Sheet', {
        x: 50,
        y: height - 70,
        size: 10,
        font: font,
        color: lib.rgb(0.3, 0.35, 0.4)
      });

      // Border & sample clauses layout
      page.drawRectangle({
        x: 45,
        y: 60,
        width: width - 90,
        height: height - 150,
        borderColor: lib.rgb(0.85, 0.9, 0.88),
        borderWidth: 1.5
      });

      this.originalPdfBytes = await doc.save();
      this.fileName = 'নমুনা_চুক্তিপত্র_BanglaDoc.pdf';
      this.pages = [{
        pageIndex: 0,
        rotation: 0,
        width,
        height,
        annotations: [
          {
            id: 'demo-text-1',
            type: 'text',
            x: 70,
            y: 120,
            width: 450,
            height: 36,
            text: 'বাড়ি ও ফ্ল্যাট ভাড়ার নমুনা অঙ্গীকারনামা (BanglaDoc)',
            fontSize: 20,
            color: '#0d6e63',
            bold: true,
            font: 'Anek Bangla, sans-serif'
          },
          {
            id: 'demo-stamp-1',
            type: 'stamp',
            x: 380,
            y: 180,
            width: 140,
            height: 60,
            stampId: 'APPROVED',
            stampTitle: 'অনুমোদিত',
            stampSub: 'OFFICIALLY APPROVED',
            color: '#059669',
            borderColor: '#059669',
            bgColor: 'rgba(5, 150, 105, 0.08)'
          }
        ],
        drawings: []
      }];
      this.currentPageIndex = 0;
      this.clearHistory();
    }

    /**
     * Loads PDF bytes into state
     */
    async loadPdfBytes(bytes, fileName = 'document.pdf') {
      const arrayBuffer = (bytes instanceof ArrayBuffer)
        ? bytes
        : (bytes && bytes.buffer instanceof ArrayBuffer ? bytes.buffer : null);

      this.originalPdfBytes = arrayBuffer
        ? new Uint8Array(arrayBuffer.slice(0))
        : new Uint8Array(bytes);
      this.fileName = fileName;
      this.pages = [];

      const lib = getPDFLib();
      if (lib) {
        try {
          // Pass isolated clone to PDFDocument.load
          const loadBuffer = new Uint8Array(this.originalPdfBytes.buffer.slice(
            this.originalPdfBytes.byteOffset,
            this.originalPdfBytes.byteOffset + this.originalPdfBytes.byteLength
          ));
          const doc = await lib.PDFDocument.load(loadBuffer, { ignoreEncryption: true });
          const count = doc.getPageCount();
          for (let i = 0; i < count; i++) {
            const page = doc.getPage(i);
            let width = 595.28;
            let height = 841.89;
            try {
              const size = page.getSize();
              if (size && Number.isFinite(size.width) && size.width > 0) width = size.width;
              if (size && Number.isFinite(size.height) && size.height > 0) height = size.height;
            } catch (_) {}

            let rotation = 0;
            try {
              const rot = page.getRotation();
              if (rot && Number.isFinite(rot.angle)) rotation = rot.angle;
            } catch (_) {}

            this.pages.push({
              pageIndex: i,
              rotation,
              width,
              height,
              annotations: [],
              drawings: []
            });
          }
        } catch (e) {
          console.warn('PDFLib loading fallback:', e);
        }
      }

      if (this.pages.length === 0) {
        this.pages.push({
          pageIndex: 0,
          rotation: 0,
          width: 595.28,
          height: 841.89,
          annotations: [],
          drawings: []
        });
      }

      this.currentPageIndex = 0;
      this.clearHistory();
    }

    /**
     * Gets total pages count
     */
    getPageCount() {
      return this.pages.length;
    }

    /**
     * Gets current active page descriptor
     */
    getCurrentPage() {
      if (this.pages.length === 0) return null;
      if (this.currentPageIndex < 0) this.currentPageIndex = 0;
      if (this.currentPageIndex >= this.pages.length) this.currentPageIndex = this.pages.length - 1;
      return this.pages[this.currentPageIndex];
    }

    /**
     * Switches to page index
     */
    goToPage(index) {
      if (index >= 0 && index < this.pages.length) {
        this.currentPageIndex = index;
        this.selectedAnnotationId = null;
        return true;
      }
      return false;
    }

    /**
     * Sets current active tool
     */
    setTool(toolName, options = {}) {
      this.currentTool = toolName;
      if (options && typeof options === 'object') {
        Object.assign(this.toolOptions, options);
      }
      if (toolName !== 'select') {
        this.selectedAnnotationId = null;
      }
      return this.currentTool;
    }

    /**
     * Adds an annotation to current page
     */
    addAnnotation(annotation) {
      const page = this.getCurrentPage();
      if (!page) return null;

      this.recordHistorySnapshot();

      const id = annotation.id || 'ann_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const newAnn = {
        id,
        x: annotation.x || 50,
        y: annotation.y || 50,
        width: annotation.width || 120,
        height: annotation.height || 40,
        type: annotation.type || 'text',
        ...annotation
      };

      page.annotations.push(newAnn);
      this.selectedAnnotationId = id;
      return newAnn;
    }

    /**
     * Updates an annotation
     */
    updateAnnotation(id, updates) {
      const page = this.getCurrentPage();
      if (!page) return false;

      const ann = page.annotations.find(a => a.id === id);
      if (ann) {
        this.recordHistorySnapshot();
        Object.assign(ann, updates);
        return true;
      }
      return false;
    }

    /**
     * Deletes an annotation by ID
     */
    deleteAnnotation(id) {
      const page = this.getCurrentPage();
      if (!page) return false;

      const idx = page.annotations.findIndex(a => a.id === id);
      if (idx !== -1) {
        this.recordHistorySnapshot();
        page.annotations.splice(idx, 1);
        if (this.selectedAnnotationId === id) {
          this.selectedAnnotationId = null;
        }
        return true;
      }
      return false;
    }

    /**
     * Records a freehand stroke on current page
     */
    addDrawingStroke(stroke) {
      const page = this.getCurrentPage();
      if (!page) return null;

      this.recordHistorySnapshot();
      page.drawings.push(stroke);
      return stroke;
    }

    /**
     * Rotates current page 90 degrees clockwise
     */
    rotateCurrentPage(angle = 90) {
      const page = this.getCurrentPage();
      if (!page) return 0;

      this.recordHistorySnapshot();
      page.rotation = (page.rotation + angle) % 360;
      if (page.rotation < 0) page.rotation += 360;
      return page.rotation;
    }

    /**
     * Deletes current page (cannot delete if only 1 page remains)
     */
    deleteCurrentPage() {
      if (this.pages.length <= 1) {
        return false;
      }

      this.recordHistorySnapshot();
      this.pages.splice(this.currentPageIndex, 1);
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = this.pages.length - 1;
      }
      this.selectedAnnotationId = null;
      return true;
    }

    /**
     * Adds a blank A4 page after current page
     */
    addPage(width = 595.28, height = 841.89) {
      this.recordHistorySnapshot();
      const newPage = {
        pageIndex: this.pages.length,
        rotation: 0,
        width,
        height,
        annotations: [],
        drawings: []
      };
      this.pages.splice(this.currentPageIndex + 1, 0, newPage);
      this.currentPageIndex++;
      this.selectedAnnotationId = null;
      return newPage;
    }

    /**
     * History & Undo / Redo Mechanism
     */
    recordHistorySnapshot() {
      // Serialize current pages state
      const snapshot = JSON.stringify({
        pages: this.pages,
        currentPageIndex: this.currentPageIndex
      });

      this.undoStack.push(snapshot);
      if (this.undoStack.length > 30) {
        this.undoStack.shift();
      }
      this.redoStack = []; // Clear redo on new action
    }

    undo() {
      if (this.undoStack.length === 0) return false;

      const currentSnapshot = JSON.stringify({
        pages: this.pages,
        currentPageIndex: this.currentPageIndex
      });
      this.redoStack.push(currentSnapshot);

      const previous = JSON.parse(this.undoStack.pop());
      this.pages = previous.pages;
      this.currentPageIndex = previous.currentPageIndex;
      this.selectedAnnotationId = null;
      return true;
    }

    redo() {
      if (this.redoStack.length === 0) return false;

      const currentSnapshot = JSON.stringify({
        pages: this.pages,
        currentPageIndex: this.currentPageIndex
      });
      this.undoStack.push(currentSnapshot);

      const next = JSON.parse(this.redoStack.pop());
      this.pages = next.pages;
      this.currentPageIndex = next.currentPageIndex;
      this.selectedAnnotationId = null;
      return true;
    }

    clearHistory() {
      this.undoStack = [];
      this.redoStack = [];
    }

    /**
     * Stamp metadata presets
     */
    static getStampPresets() {
      return STAMP_PRESETS;
    }

    /**
     * Generates a typed signature data URL or SVG
     */
    static generateTypedSignature(name, fontStyle = 'cursive', color = '#0f172a') {
      if (!name) name = 'স্বাক্ষর';
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (!canvas) {
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70"><text x="10" y="45" font-family="${fontStyle}" font-size="28" fill="${color}">${name}</text></svg>`;
      }

      canvas.width = 300;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      let font = '32px cursive';
      if (fontStyle === 'bangla-calligraphy') {
        font = '32px "Anek Bangla", "Hind Siliguri", cursive';
      } else if (fontStyle === 'serif') {
        font = 'italic 30px "Times New Roman", serif';
      } else if (fontStyle === 'modern') {
        font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      }

      ctx.font = font;
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 20, 45);

      // Add a stylish handwritten underline flourish
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(15, 65);
      ctx.bezierCurveTo(80, 68, 160, 60, canvas.width - 30, 68);
      ctx.stroke();

      return canvas.toDataURL('image/png');
    }

    /**
     * Export modified PDF document
     * Renders overlays and applies rotations/deletions via pdf-lib
     */
    async exportPdf(options = {}) {
      const lib = getPDFLib();
      if (!lib) {
        // Fallback for non-browser/test mocking
        return {
          bytes: this.originalPdfBytes || new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]),
          fileName: this.fileName.replace(/\.pdf$/i, '') + '-edited.pdf'
        };
      }

      let pdfDoc;
      if (this.originalPdfBytes) {
        pdfDoc = await lib.PDFDocument.load(this.originalPdfBytes, { ignoreEncryption: true });
      } else {
        pdfDoc = await lib.PDFDocument.create();
        for (let i = 0; i < this.pages.length; i++) {
          pdfDoc.addPage([this.pages[i].width || 595.28, this.pages[i].height || 841.89]);
        }
      }

      // Sync pages: remove deleted pages if count changed
      while (pdfDoc.getPageCount() > this.pages.length) {
        pdfDoc.removePage(pdfDoc.getPageCount() - 1);
      }
      while (pdfDoc.getPageCount() < this.pages.length) {
        pdfDoc.addPage([595.28, 841.89]);
      }

      // Apply rotations and overlay composite images
      for (let i = 0; i < this.pages.length; i++) {
        const pageState = this.pages[i];
        const pdfPage = pdfDoc.getPage(i);

        if (pageState.rotation !== undefined) {
          pdfPage.setRotation(lib.degrees(pageState.rotation));
        }

        // Render page annotations & drawings onto offscreen canvas if available
        if (options.renderPageOverlay && typeof options.renderPageOverlay === 'function') {
          const overlayPngData = await options.renderPageOverlay(i, pageState);
          if (overlayPngData) {
            const pngImage = await pdfDoc.embedPng(overlayPngData);
            pdfPage.drawImage(pngImage, {
              x: 0,
              y: 0,
              width: pdfPage.getWidth(),
              height: pdfPage.getHeight()
            });
          }
        }
      }

      const bytes = await pdfDoc.save();
      const exportName = (this.fileName || 'bangladoc').replace(/\.pdf$/i, '') + '-edited.pdf';
      return {
        bytes,
        fileName: exportName
      };
    }
  }

  /**
   * Browser DOM UI Controller for Interactive PDF Editing
   */
  class PdfEditorUI {
    constructor(appElementId = 'pdfEditorApp') {
      this.app = document.getElementById(appElementId);
      if (!this.app) return;

      this.core = new PdfEditorCore();
      this.pdfJsDoc = null;
      this.zoom = 1.0;
      this.isDrawing = false;
      this.activePoints = [];
      this.activeElement = null;
      this.dragState = null;
      this.currentScale = 1.0;

      this.initDOMElements();
      this.bindEvents();
    }

    initDOMElements() {
      // Screens
      this.welcomeScreen = document.getElementById('welcomeScreen');
      this.workspaceScreen = document.getElementById('workspaceScreen');

      // Dropzone & File Pickers
      this.dropZone = document.getElementById('pdfDropZone');
      this.fileInput = document.getElementById('pdfFileInput');
      this.btnTryDemo = document.getElementById('btnTryDemo');
      this.btnBlankDoc = document.getElementById('btnBlankDoc');
      this.btnNewDoc = document.getElementById('btnNewDoc');

      // Canvas & Viewport
      this.viewport = document.getElementById('pdfViewport');
      this.canvasWrapper = document.getElementById('canvasWrapper');
      this.baseCanvas = document.getElementById('pdfBaseCanvas');
      this.drawingCanvas = document.getElementById('drawingCanvas');
      this.annotationOverlay = document.getElementById('annotationOverlay');
      this.thumbnailList = document.getElementById('thumbnailList');

      // Top Toolbar controls
      this.docTitleLabel = document.getElementById('docTitleLabel');
      this.pageIndicator = document.getElementById('pageIndicator');
      this.btnPrevPage = document.getElementById('btnPrevPage');
      this.btnNextPage = document.getElementById('btnNextPage');
      this.btnZoomIn = document.getElementById('btnZoomIn');
      this.btnZoomOut = document.getElementById('btnZoomOut');
      this.btnZoomFit = document.getElementById('btnZoomFit');
      this.zoomDisplay = document.getElementById('zoomDisplay');
      this.btnRotatePage = document.getElementById('btnRotatePage');
      this.btnDeletePage = document.getElementById('btnDeletePage');
      this.btnAddPage = document.getElementById('btnAddPage');
      this.btnUndo = document.getElementById('btnUndo');
      this.btnRedo = document.getElementById('btnRedo');
      this.btnExportPdf = document.getElementById('btnExportPdf');
      this.btnPrintPdf = document.getElementById('btnPrintPdf');

      // Tool Buttons
      this.toolButtons = document.querySelectorAll('[data-tool]');
      this.contextualBar = document.getElementById('contextualBar');

      // Contextual Tool Option Inputs
      this.textSizeSelect = document.getElementById('optTextSize');
      this.textColorInput = document.getElementById('optTextColor');
      this.textBoldBtn = document.getElementById('optTextBold');
      this.textFontSelect = document.getElementById('optTextFont');
      this.penWidthSelect = document.getElementById('optPenWidth');
      this.penColorInput = document.getElementById('optPenColor');
      this.highlighterColorSelect = document.getElementById('optHighlighterColor');
      this.whiteoutColorSelect = document.getElementById('optWhiteoutColor');
      this.stampPresetSelect = document.getElementById('optStampPreset');

      // Signature Modal Elements
      this.signatureModal = document.getElementById('signatureModal');
      this.sigCanvas = document.getElementById('sigCanvas');
      this.sigTypedInput = document.getElementById('sigTypedInput');
      this.sigFileInput = document.getElementById('sigFileInput');
      this.btnApplySignature = document.getElementById('btnApplySignature');
      this.btnCloseSignature = document.getElementById('btnCloseSignature');
      this.btnClearSig = document.getElementById('btnClearSig');
      this.sigTabs = document.querySelectorAll('[data-sig-tab]');
      this.sigTabPanes = document.querySelectorAll('.sig-pane');
      this.currentSigTab = 'draw';
      this.isSigDrawing = false;

      // Mobile Dock
      this.dockToolBtn = document.getElementById('dockToolBtn');
      this.dockExportBtn = document.getElementById('dockExportBtn');
    }

    bindEvents() {
      // 1. File Upload & Demo Handlers
      if (this.dropZone && this.fileInput) {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          this.dropZone.classList.add('drag-active');
        });
        this.dropZone.addEventListener('dragleave', () => {
          this.dropZone.classList.remove('drag-active');
        });
        this.dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          this.dropZone.classList.remove('drag-active');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            this.handleFile(e.dataTransfer.files[0]);
          }
        });
        this.fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            this.handleFile(e.target.files[0]);
          }
        });
      }

      if (this.btnTryDemo) {
        this.btnTryDemo.addEventListener('click', async () => {
          this.showLoading('নমুনা দলিল প্রস্তুত হচ্ছে...');
          await this.core.loadDemoDocument();
          await this.initializePdfJsFromBytes();
          this.hideLoading();
          this.showWorkspace();
        });
      }

      if (this.btnBlankDoc) {
        this.btnBlankDoc.addEventListener('click', async () => {
          this.showLoading('ফাঁকা A4 পেজ প্রস্তুত হচ্ছে...');
          await this.core.loadBlankDocument(1);
          await this.initializePdfJsFromBytes();
          this.hideLoading();
          this.showWorkspace();
        });
      }

      if (this.btnNewDoc) {
        this.btnNewDoc.addEventListener('click', () => {
          if (confirm('আপনি কি নতুন ডকুমেন্ট শুরু করতে চান? বর্তমান এডিট মুছে যাবে।')) {
            if (typeof document !== 'undefined') {
              document.body.classList.remove('pdf-studio-mode');
            }
            this.welcomeScreen.style.display = 'block';
            this.workspaceScreen.style.display = 'none';
            if (this.fileInput) this.fileInput.value = '';
          }
        });
      }

      // 2. Tool Switching
      this.toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tool = btn.getAttribute('data-tool');
          this.selectTool(tool);
        });
      });

      // Contextual Option Handlers
      if (this.textSizeSelect) {
        this.textSizeSelect.addEventListener('change', (e) => {
          this.core.toolOptions.textSize = parseInt(e.target.value, 10);
          if (this.activeElement && this.activeElement.dataset.type === 'text') {
            const id = this.activeElement.dataset.id;
            this.core.updateAnnotation(id, { fontSize: this.core.toolOptions.textSize });
            this.activeElement.querySelector('.ann-content').style.fontSize = this.core.toolOptions.textSize + 'px';
          }
        });
      }

      if (this.textColorInput) {
        this.textColorInput.addEventListener('input', (e) => {
          this.core.toolOptions.textColor = e.target.value;
          if (this.activeElement && this.activeElement.dataset.type === 'text') {
            const id = this.activeElement.dataset.id;
            this.core.updateAnnotation(id, { color: this.core.toolOptions.textColor });
            this.activeElement.querySelector('.ann-content').style.color = this.core.toolOptions.textColor;
          }
        });
      }

      if (this.textBoldBtn) {
        this.textBoldBtn.addEventListener('click', () => {
          this.core.toolOptions.textBold = !this.core.toolOptions.textBold;
          this.textBoldBtn.classList.toggle('active', this.core.toolOptions.textBold);
          if (this.activeElement && this.activeElement.dataset.type === 'text') {
            const id = this.activeElement.dataset.id;
            this.core.updateAnnotation(id, { bold: this.core.toolOptions.textBold });
            this.activeElement.querySelector('.ann-content').style.fontWeight = this.core.toolOptions.textBold ? 'bold' : 'normal';
          }
        });
      }

      if (this.penWidthSelect) {
        this.penWidthSelect.addEventListener('change', (e) => {
          this.core.toolOptions.penWidth = parseInt(e.target.value, 10);
        });
      }

      if (this.penColorInput) {
        this.penColorInput.addEventListener('input', (e) => {
          this.core.toolOptions.penColor = e.target.value;
        });
      }

      if (this.highlighterColorSelect) {
        this.highlighterColorSelect.addEventListener('change', (e) => {
          this.core.toolOptions.highlighterColor = e.target.value;
        });
      }

      if (this.whiteoutColorSelect) {
        this.whiteoutColorSelect.addEventListener('change', (e) => {
          this.core.toolOptions.whiteoutColor = e.target.value;
        });
      }

      if (this.stampPresetSelect) {
        this.stampPresetSelect.addEventListener('change', (e) => {
          this.core.toolOptions.selectedStamp = e.target.value;
        });
      }

      // 3. Page Navigation & Actions
      if (this.btnPrevPage) {
        this.btnPrevPage.addEventListener('click', () => {
          if (this.core.currentPageIndex > 0) {
            this.core.goToPage(this.core.currentPageIndex - 1);
            this.renderCurrentPage();
            this.updateActiveThumbnail();
            if (this.pdfViewport) this.pdfViewport.scrollTop = 0;
          }
        });
      }

      if (this.btnNextPage) {
        this.btnNextPage.addEventListener('click', () => {
          if (this.core.currentPageIndex < this.core.getPageCount() - 1) {
            this.core.goToPage(this.core.currentPageIndex + 1);
            this.renderCurrentPage();
            this.updateActiveThumbnail();
            if (this.pdfViewport) this.pdfViewport.scrollTop = 0;
          }
        });
      }

      if (this.btnRotatePage) {
        this.btnRotatePage.addEventListener('click', () => {
          this.core.rotateCurrentPage(90);
          this.renderCurrentPage();
          this.renderThumbnails();
          if (window.showToast) window.showToast('পেজ ৯০° ঘোরানো হয়েছে');
        });
      }

      if (this.btnDeletePage) {
        this.btnDeletePage.addEventListener('click', () => {
          if (this.core.getPageCount() <= 1) {
            alert('ডকুমেন্টের একমাত্র পেজটি মোছা সম্ভব নয়।');
            return;
          }
          if (confirm('আপনি কি বর্তমান পেজটি মুছে ফেলতে চান?')) {
            this.core.deleteCurrentPage();
            this.renderCurrentPage();
            this.renderThumbnails();
            if (window.showToast) window.showToast('পেজ মুছে ফেলা হয়েছে');
          }
        });
      }

      if (this.btnAddPage) {
        this.btnAddPage.addEventListener('click', () => {
          this.core.addPage();
          this.renderCurrentPage();
          this.renderThumbnails();
          if (window.showToast) window.showToast('নতুন ফাঁকা পেজ যোগ করা হয়েছে');
        });
      }

      // Zoom Controls
      if (this.btnZoomIn) {
        this.btnZoomIn.addEventListener('click', () => {
          this.zoom = Math.min(2.5, this.zoom + 0.2);
          this.updateZoomDisplay();
          this.renderCurrentPage();
        });
      }

      if (this.btnZoomOut) {
        this.btnZoomOut.addEventListener('click', () => {
          this.zoom = Math.max(0.4, this.zoom - 0.2);
          this.updateZoomDisplay();
          this.renderCurrentPage();
        });
      }

      if (this.btnZoomFit) {
        this.btnZoomFit.addEventListener('click', () => {
          this.zoom = 1.0;
          this.updateZoomDisplay();
          this.renderCurrentPage();
        });
      }

      // Undo / Redo
      if (this.btnUndo) {
        this.btnUndo.addEventListener('click', () => {
          if (this.core.undo()) {
            this.renderCurrentPage();
            this.renderThumbnails();
          }
        });
      }

      if (this.btnRedo) {
        this.btnRedo.addEventListener('click', () => {
          if (this.core.redo()) {
            this.renderCurrentPage();
            this.renderThumbnails();
          }
        });
      }

      // Export & Print
      if (this.btnExportPdf) {
        this.btnExportPdf.addEventListener('click', () => this.exportAndDownload());
      }
      if (this.dockExportBtn) {
        this.dockExportBtn.addEventListener('click', () => this.exportAndDownload());
      }
      if (this.btnPrintPdf) {
        this.btnPrintPdf.addEventListener('click', () => this.printDocument());
      }

      // 4. Drawing on Canvas (Pen & Highlighter)
      if (this.drawingCanvas) {
        this.drawingCanvas.addEventListener('pointerdown', (e) => this.onDrawingStart(e));
        this.drawingCanvas.addEventListener('pointermove', (e) => this.onDrawingMove(e));
        this.drawingCanvas.addEventListener('pointerup', (e) => this.onDrawingEnd(e));
        this.drawingCanvas.addEventListener('pointercancel', (e) => this.onDrawingEnd(e));
      }

      // 5. Annotation Layer Clicks (Adding Text, Stamp, Whiteout, Date)
      if (this.annotationOverlay) {
        this.annotationOverlay.addEventListener('click', (e) => this.onOverlayClick(e));
      }

      // 6. Signature Modal Events
      this.bindSignatureModalEvents();

      // 7. Global Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            if (this.core.redo()) this.renderCurrentPage();
          } else {
            if (this.core.undo()) this.renderCurrentPage();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          if (this.core.redo()) this.renderCurrentPage();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.activeElement) {
          const isContentEditable = e.target.getAttribute('contenteditable') === 'true' || e.target.tagName === 'INPUT';
          if (!isContentEditable) {
            e.preventDefault();
            const id = this.activeElement.dataset.id;
            this.core.deleteAnnotation(id);
            this.activeElement.remove();
            this.activeElement = null;
          }
        }
      });
    }

    bindSignatureModalEvents() {
      if (!this.signatureModal) return;

      this.sigTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.sigTabs.forEach(t => t.classList.remove('active'));
          this.sigTabPanes.forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const targetPane = document.getElementById(tab.getAttribute('data-sig-tab'));
          if (targetPane) targetPane.classList.add('active');
          this.currentSigTab = tab.getAttribute('data-sig-mode');
        });
      });

      // Signature Pad Drawing
      if (this.sigCanvas) {
        const ctx = this.sigCanvas.getContext('2d');
        const getSigPos = (e) => {
          const rect = this.sigCanvas.getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
        };

        if (ctx) {
          this.sigCanvas.addEventListener('pointerdown', (e) => {
            this.isSigDrawing = true;
            this.sigCanvas.setPointerCapture(e.pointerId);
            const pos = getSigPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          });

          this.sigCanvas.addEventListener('pointermove', (e) => {
            if (!this.isSigDrawing) return;
            const pos = getSigPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
          });
        }

        const stopSigDraw = () => {
          this.isSigDrawing = false;
        };
        this.sigCanvas.addEventListener('pointerup', stopSigDraw);
        this.sigCanvas.addEventListener('pointercancel', stopSigDraw);

        if (this.btnClearSig) {
          this.btnClearSig.addEventListener('click', () => {
            if (ctx) ctx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
          });
        }
      }

      if (this.btnCloseSignature) {
        this.btnCloseSignature.addEventListener('click', () => {
          this.signatureModal.classList.remove('show');
          this.selectTool('select');
        });
      }

      if (this.btnApplySignature) {
        this.btnApplySignature.addEventListener('click', () => {
          this.applySignatureToPage();
        });
      }
    }

    applySignatureToPage() {
      let dataUrl = null;

      if (this.currentSigTab === 'draw' && this.sigCanvas) {
        dataUrl = this.sigCanvas.toDataURL('image/png');
      } else if (this.currentSigTab === 'type' && this.sigTypedInput) {
        const name = this.sigTypedInput.value.trim() || 'স্বাক্ষর';
        const style = document.getElementById('sigTypeStyle') ? document.getElementById('sigTypeStyle').value : 'bangla-calligraphy';
        dataUrl = PdfEditorCore.generateTypedSignature(name, style, '#0f172a');
      } else if (this.currentSigTab === 'upload' && this.sigFileInput && this.sigFileInput.files[0]) {
        const file = this.sigFileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          this.insertSignatureAnnotation(e.target.result);
        };
        reader.readAsDataURL(file);
        this.signatureModal.classList.remove('show');
        this.selectTool('select');
        return;
      }

      if (dataUrl) {
        this.insertSignatureAnnotation(dataUrl);
      }

      this.signatureModal.classList.remove('show');
      this.selectTool('select');
    }

    insertSignatureAnnotation(dataUrl) {
      const page = this.core.getCurrentPage();
      if (!page) return;

      const ann = this.core.addAnnotation({
        type: 'signature',
        x: (page.width || 595) / 2 - 80,
        y: (page.height || 842) - 200,
        width: 160,
        height: 70,
        dataUrl
      });

      this.renderCurrentPage();
      if (window.showToast) window.showToast('ডিজিটাল স্বাক্ষর সংযুক্ত হয়েছে');
    }

    async handleFile(file) {
      if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        alert('অনুগ্রহ করে একটি সঠিক PDF ফাইল নির্বাচন করুন।');
        return;
      }

      this.showLoading('PDF লোড ও প্রক্রিয়াকরণ হচ্ছে...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          await this.core.loadPdfBytes(arrayBuffer, file.name);
          await this.initializePdfJsFromBytes();
          this.hideLoading();
          this.showWorkspace();
          if (window.showToast) window.showToast(`"${file.name}" সফলভাবে লোড হয়েছে!`);
        } catch (err) {
          this.hideLoading();
          console.error(err);
          alert('PDF ফাইলটি লোড করতে সমস্যা হয়েছে: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    async initializePdfJsFromBytes() {
      if (typeof window !== 'undefined' && window.pdfjsLib && this.core.originalPdfBytes) {
        try {
          // Clone buffer so PDF.js Web Worker postMessage cannot detach core.originalPdfBytes
          const cloneBytes = new Uint8Array(this.core.originalPdfBytes.buffer.slice(
            this.core.originalPdfBytes.byteOffset,
            this.core.originalPdfBytes.byteOffset + this.core.originalPdfBytes.byteLength
          ));
          this.pdfJsDoc = await window.pdfjsLib.getDocument({
            data: cloneBytes
          }).promise;
        } catch (e) {
          console.warn('PDF.js loading fallback:', e);
          this.pdfJsDoc = null;
        }
      }
    }

    showWorkspace() {
      if (typeof document !== 'undefined') {
        document.body.classList.add('pdf-studio-mode');
      }
      if (this.welcomeScreen) this.welcomeScreen.style.display = 'none';
      if (this.workspaceScreen) this.workspaceScreen.style.display = 'flex';
      if (this.docTitleLabel) this.docTitleLabel.innerText = this.core.fileName;
      this.zoom = 1.0;
      this.updateZoomDisplay();
      this.selectTool('select');
      this.renderCurrentPage();
      this.renderThumbnails();
      if (this.pdfViewport) {
        this.pdfViewport.scrollTop = 0;
      }
    }

    updateActiveThumbnail() {
      if (!this.thumbnailList) return;
      const cards = this.thumbnailList.querySelectorAll('.thumb-card');
      cards.forEach((c, idx) => {
        c.classList.toggle('active', idx === this.core.currentPageIndex);
      });
      const activeCard = this.thumbnailList.querySelector('.thumb-card.active');
      if (activeCard && typeof activeCard.scrollIntoView === 'function') {
        activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    updateZoomDisplay() {
      if (this.zoomDisplay) {
        this.zoomDisplay.innerText = Math.round(this.zoom * 100) + '%';
      }
    }

    selectTool(tool) {
      this.core.setTool(tool);
      this.toolButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
      });

      // Contextual Tool Options display
      if (this.contextualBar) {
        const textOpts = document.getElementById('optGroupText');
        const penOpts = document.getElementById('optGroupPen');
        const highlighterOpts = document.getElementById('optGroupHighlighter');
        const whiteoutOpts = document.getElementById('optGroupWhiteout');
        const stampOpts = document.getElementById('optGroupStamp');

        if (textOpts) textOpts.style.display = tool === 'text' ? 'flex' : 'none';
        if (penOpts) penOpts.style.display = tool === 'pen' ? 'flex' : 'none';
        if (highlighterOpts) highlighterOpts.style.display = tool === 'highlighter' ? 'flex' : 'none';
        if (whiteoutOpts) whiteoutOpts.style.display = tool === 'whiteout' ? 'flex' : 'none';
        if (stampOpts) stampOpts.style.display = tool === 'stamp' ? 'flex' : 'none';
      }

      // Drawing canvas pointer-events handling
      if (this.drawingCanvas) {
        if (tool === 'pen' || tool === 'highlighter') {
          this.drawingCanvas.style.pointerEvents = 'auto';
          this.drawingCanvas.style.cursor = 'crosshair';
        } else {
          this.drawingCanvas.style.pointerEvents = 'none';
          this.drawingCanvas.style.cursor = 'default';
        }
      }

      // Special Immediate Actions for Signature, Date, and Image tools
      if (tool === 'signature') {
        if (this.signatureModal) {
          this.signatureModal.classList.add('show');
        }
      } else if (tool === 'date') {
        const today = new Date();
        const bnDate = (typeof window !== 'undefined' && window.BanglaConverter && window.BanglaConverter.formatBanglaDate)
          ? window.BanglaConverter.formatBanglaDate(today)
          : today.toLocaleDateString('bn-BD');
        
        const page = this.core.getCurrentPage();
        if (page) {
          this.core.addAnnotation({
            type: 'text',
            text: `তারিখ: ${bnDate}`,
            x: (page.width || 595) - 220,
            y: 80,
            width: 180,
            height: 36,
            fontSize: 16,
            bold: true,
            color: '#0d6e63'
          });
          this.renderCurrentPage();
          if (window.showToast) window.showToast('আজকের বাংলা তারিখ যুক্ত করা হয়েছে');
        }
        this.selectTool('select');
      } else if (tool === 'image') {
        const fileInp = document.createElement('input');
        fileInp.type = 'file';
        fileInp.accept = 'image/*';
        fileInp.onchange = (e) => {
          if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const page = this.core.getCurrentPage();
              if (page) {
                this.core.addAnnotation({
                  type: 'image',
                  dataUrl: ev.target.result,
                  x: 100,
                  y: 100,
                  width: 140,
                  height: 140
                });
                this.renderCurrentPage();
                if (window.showToast) window.showToast('ছবি যুক্ত করা হয়েছে');
              }
            };
            reader.readAsDataURL(e.target.files[0]);
          }
        };
        fileInp.click();
        this.selectTool('select');
      }
    }

    async renderCurrentPage() {
      const pageState = this.core.getCurrentPage();
      if (!pageState) return;

      if (this.pageIndicator) {
        this.pageIndicator.innerText = `${this.core.currentPageIndex + 1} / ${this.core.getPageCount()}`;
      }

      // Cancel any ongoing PDF.js render operation
      if (this.currentRenderTask) {
        try {
          this.currentRenderTask.cancel();
        } catch (_) {}
        this.currentRenderTask = null;
      }

      // Compute display dimensions based on zoom & standard A4
      const pageWidth = (pageState && Number.isFinite(pageState.width) && pageState.width > 0) ? pageState.width : 595.28;
      const pageHeight = (pageState && Number.isFinite(pageState.height) && pageState.height > 0) ? pageState.height : 841.89;
      const rotation = pageState.rotation || 0;
      const isLandscape = (rotation === 90 || rotation === 270);
      const zoom = (Number.isFinite(this.zoom) && this.zoom > 0) ? this.zoom : 1.0;
      const displayWidth = Math.max(200, Math.round((isLandscape ? pageHeight : pageWidth) * zoom));
      const displayHeight = Math.max(200, Math.round((isLandscape ? pageWidth : pageHeight) * zoom));

      if (this.canvasWrapper) {
        this.canvasWrapper.style.width = displayWidth + 'px';
        this.canvasWrapper.style.height = displayHeight + 'px';
        this.canvasWrapper.style.margin = '0 auto';
      }

      // 1. Render Base PDF Page Canvas
      if (this.baseCanvas) {
        const dpr = window.devicePixelRatio || 1;
        this.baseCanvas.width = displayWidth * dpr;
        this.baseCanvas.height = displayHeight * dpr;
        this.baseCanvas.style.width = displayWidth + 'px';
        this.baseCanvas.style.height = displayHeight + 'px';

        const ctx = this.baseCanvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);

          if (this.pdfJsDoc && pageState.pageIndex < this.pdfJsDoc.numPages) {
            try {
              const page = await this.pdfJsDoc.getPage(pageState.pageIndex + 1);
              const viewport = page.getViewport({
                scale: zoom * dpr,
                rotation
              });
              this.currentRenderTask = page.render({
                canvasContext: ctx,
                viewport
              });
              await this.currentRenderTask.promise;
              this.currentRenderTask = null;
            } catch (err) {
              if (err && err.name !== 'RenderingCancelledException') {
                console.warn('PDF.js render error:', err);
              }
            }
          }
          ctx.restore();
        }
      }

      // 2. Setup Drawing Canvas
      if (this.drawingCanvas) {
        this.drawingCanvas.width = displayWidth;
        this.drawingCanvas.height = displayHeight;
        this.drawingCanvas.style.width = displayWidth + 'px';
        this.drawingCanvas.style.height = displayHeight + 'px';
        this.redrawStrokes();
      }

      // 3. Render Annotations Overlay
      if (this.annotationOverlay) {
        this.annotationOverlay.style.width = displayWidth + 'px';
        this.annotationOverlay.style.height = displayHeight + 'px';
        this.annotationOverlay.innerHTML = '';

        pageState.annotations.forEach(ann => {
          this.renderAnnotationElement(ann, displayWidth, displayHeight);
        });
      }
    }

    renderAnnotationElement(ann, containerWidth, containerHeight) {
      const el = document.createElement('div');
      el.className = 'pdf-annotation-box';
      el.dataset.id = ann.id;
      el.dataset.type = ann.type;

      // Scale coordinates from original point scale to current display scale
      const scale = this.zoom;
      el.style.left = (ann.x * scale) + 'px';
      el.style.top = (ann.y * scale) + 'px';
      el.style.width = (ann.width * scale) + 'px';
      el.style.height = (ann.height * scale) + 'px';

      // Inner Content based on type
      let contentEl;
      if (ann.type === 'text') {
        contentEl = document.createElement('div');
        contentEl.className = 'ann-content ann-text';
        contentEl.contentEditable = 'true';
        contentEl.innerText = ann.text || 'এখানে টেক্সট লিখুন...';
        contentEl.style.fontSize = ((ann.fontSize || 16) * scale) + 'px';
        contentEl.style.color = ann.color || '#0f172a';
        contentEl.style.fontWeight = ann.bold ? 'bold' : 'normal';
        contentEl.style.fontFamily = ann.font || 'Anek Bangla, Hind Siliguri, sans-serif';

        contentEl.addEventListener('input', () => {
          ann.text = contentEl.innerText;
        });
      } else if (ann.type === 'stamp') {
        contentEl = document.createElement('div');
        contentEl.className = 'ann-content ann-stamp';
        contentEl.style.borderColor = ann.borderColor || '#059669';
        contentEl.style.color = ann.color || '#059669';
        contentEl.style.backgroundColor = ann.bgColor || 'rgba(5, 150, 105, 0.08)';

        const title = document.createElement('div');
        title.className = 'stamp-title';
        title.innerText = ann.stampTitle || 'অনুমোদিত';
        title.style.fontSize = Math.round(18 * scale) + 'px';

        const sub = document.createElement('div');
        sub.className = 'stamp-sub';
        sub.innerText = ann.stampSub || 'APPROVED';
        sub.style.fontSize = Math.round(9 * scale) + 'px';

        contentEl.appendChild(title);
        contentEl.appendChild(sub);
      } else if (ann.type === 'whiteout') {
        contentEl = document.createElement('div');
        contentEl.className = 'ann-content ann-whiteout';
        contentEl.style.backgroundColor = ann.color || '#ffffff';
      } else if (ann.type === 'signature' || ann.type === 'image') {
        contentEl = document.createElement('img');
        contentEl.className = 'ann-content ann-image';
        contentEl.src = ann.dataUrl;
        contentEl.draggable = false;
      }

      el.appendChild(contentEl);

      // Controls: Delete Button and Resize Handle
      const delBtn = document.createElement('button');
      delBtn.className = 'ann-del-btn';
      delBtn.innerHTML = '✕';
      delBtn.title = 'মুছুন';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.core.deleteAnnotation(ann.id);
        el.remove();
        if (this.activeElement === el) this.activeElement = null;
      });
      el.appendChild(delBtn);

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'ann-resize-handle';
      el.appendChild(resizeHandle);

      // Drag and selection event handlers
      this.attachDraggableBehavior(el, ann, scale);

      this.annotationOverlay.appendChild(el);
    }

    attachDraggableBehavior(el, ann, scale) {
      let isDragging = false;
      let isResizing = false;
      let startX, startY, origX, origY, origW, origH;

      const onPointerDown = (e) => {
        if (this.core.currentTool !== 'select') return;
        e.stopPropagation();

        // Select this element
        if (this.activeElement) this.activeElement.classList.remove('selected');
        this.activeElement = el;
        el.classList.add('selected');
        this.core.selectedAnnotationId = ann.id;

        startX = e.clientX;
        startY = e.clientY;
        origX = ann.x * scale;
        origY = ann.y * scale;
        origW = ann.width * scale;
        origH = ann.height * scale;

        if (e.target.classList.contains('ann-resize-handle')) {
          isResizing = true;
        } else if (!e.target.classList.contains('ann-del-btn') && e.target.getAttribute('contenteditable') !== 'true') {
          isDragging = true;
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      };

      const onPointerMove = (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (isDragging) {
          const newX = origX + dx;
          const newY = origY + dy;
          el.style.left = newX + 'px';
          el.style.top = newY + 'px';
          ann.x = Math.round(newX / scale);
          ann.y = Math.round(newY / scale);
        } else if (isResizing) {
          const newW = Math.max(30, origW + dx);
          const newH = Math.max(20, origH + dy);
          el.style.width = newW + 'px';
          el.style.height = newH + 'px';
          ann.width = Math.round(newW / scale);
          ann.height = Math.round(newH / scale);
        }
      };

      const onPointerUp = () => {
        if (isDragging || isResizing) {
          this.core.recordHistorySnapshot();
        }
        isDragging = false;
        isResizing = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      el.addEventListener('pointerdown', onPointerDown);
    }

    onOverlayClick(e) {
      if (e.target.closest('.pdf-annotation-box')) return;

      const tool = this.core.currentTool;
      if (tool === 'select') {
        if (this.activeElement) {
          this.activeElement.classList.remove('selected');
          this.activeElement = null;
        }
        return;
      }

      const rect = this.annotationOverlay.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / this.zoom;
      const clickY = (e.clientY - rect.top) / this.zoom;

      if (tool === 'text') {
        this.core.addAnnotation({
          type: 'text',
          x: clickX,
          y: clickY,
          width: 200,
          height: 40,
          text: 'এখানে টেক্সট লিখুন...',
          fontSize: this.core.toolOptions.textSize,
          color: this.core.toolOptions.textColor,
          bold: this.core.toolOptions.textBold
        });
        this.renderCurrentPage();
        this.selectTool('select');
      } else if (tool === 'stamp') {
        const presetKey = this.core.toolOptions.selectedStamp || 'APPROVED';
        const preset = STAMP_PRESETS[presetKey] || STAMP_PRESETS.APPROVED;
        this.core.addAnnotation({
          type: 'stamp',
          stampId: preset.id,
          stampTitle: preset.title,
          stampSub: preset.sub,
          color: preset.color,
          borderColor: preset.borderColor,
          bgColor: preset.bgColor,
          x: clickX - 70,
          y: clickY - 30,
          width: 140,
          height: 60
        });
        this.renderCurrentPage();
        this.selectTool('select');
      } else if (tool === 'whiteout') {
        this.core.addAnnotation({
          type: 'whiteout',
          x: clickX - 60,
          y: clickY - 15,
          width: 120,
          height: 30,
          color: this.core.toolOptions.whiteoutColor
        });
        this.renderCurrentPage();
        this.selectTool('select');
      }
    }

    onDrawingStart(e) {
      if (this.core.currentTool !== 'pen' && this.core.currentTool !== 'highlighter') return;
      this.isDrawing = true;
      this.drawingCanvas.setPointerCapture(e.pointerId);

      const rect = this.drawingCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.zoom;
      const y = (e.clientY - rect.top) / this.zoom;
      this.activePoints = [{ x, y }];

      const ctx = this.drawingCanvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x * this.zoom, y * this.zoom);

        if (this.core.currentTool === 'highlighter') {
          ctx.strokeStyle = this.core.toolOptions.highlighterColor || 'rgba(254, 240, 138, 0.45)';
          ctx.lineWidth = (this.core.toolOptions.highlighterWidth || 20) * this.zoom;
          ctx.lineCap = 'square';
        } else {
          ctx.strokeStyle = this.core.toolOptions.penColor || '#0f172a';
          ctx.lineWidth = (this.core.toolOptions.penWidth || 3) * this.zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }

    onDrawingMove(e) {
      if (!this.isDrawing) return;
      const rect = this.drawingCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.zoom;
      const y = (e.clientY - rect.top) / this.zoom;
      this.activePoints.push({ x, y });

      const ctx = this.drawingCanvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x * this.zoom, y * this.zoom);
        ctx.stroke();
      }
    }

    onDrawingEnd() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.activePoints.length > 1) {
        this.core.addDrawingStroke({
          tool: this.core.currentTool,
          color: this.core.currentTool === 'highlighter' ? this.core.toolOptions.highlighterColor : this.core.toolOptions.penColor,
          width: this.core.currentTool === 'highlighter' ? this.core.toolOptions.highlighterWidth : this.core.toolOptions.penWidth,
          points: this.activePoints
        });
      }
      this.activePoints = [];
    }

    redrawStrokes() {
      const page = this.core.getCurrentPage();
      if (!page || !this.drawingCanvas) return;

      const ctx = this.drawingCanvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

      page.drawings.forEach(stroke => {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * this.zoom, stroke.points[0].y * this.zoom);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * this.zoom, stroke.points[i].y * this.zoom);
        }

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = (stroke.width || 3) * this.zoom;
        if (stroke.tool === 'highlighter') {
          ctx.lineCap = 'square';
        } else {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
        ctx.stroke();
      });
    }

    renderThumbnails() {
      if (!this.thumbnailList) return;
      this.thumbnailList.innerHTML = '';

      this.core.pages.forEach((page, idx) => {
        const item = document.createElement('div');
        item.className = 'thumb-card' + (idx === this.core.currentPageIndex ? ' active' : '');
        item.setAttribute('data-page-index', idx);
        item.innerHTML = `
          <div class="thumb-num">${idx + 1}</div>
          <div class="thumb-preview"></div>
          <button type="button" class="thumb-del-btn" title="পেজ মুছুন">✕</button>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('thumb-del-btn')) {
            e.stopPropagation();
            if (this.core.getPageCount() <= 1) {
              alert('ডকুমেন্টের একমাত্র পেজটি মোছা সম্ভব নয়।');
              return;
            }
            this.core.currentPageIndex = idx;
            this.core.deleteCurrentPage();
            this.renderCurrentPage();
            this.renderThumbnails();
            return;
          }
          this.core.goToPage(idx);
          this.renderCurrentPage();
          this.updateActiveThumbnail();
          if (this.pdfViewport) this.pdfViewport.scrollTop = 0;
        });

        this.thumbnailList.appendChild(item);

        const previewContainer = item.querySelector('.thumb-preview');
        this.renderThumbnailCanvas(idx, previewContainer);
      });
    }

    async renderThumbnailCanvas(pageIdx, container) {
      if (!container) return;
      const canvas = document.createElement('canvas');
      canvas.className = 'thumb-canvas';
      container.appendChild(canvas);

      if (this.pdfJsDoc && pageIdx < this.pdfJsDoc.numPages) {
        try {
          const page = await this.pdfJsDoc.getPage(pageIdx + 1);
          const baseViewport = page.getViewport({ scale: 1.0 });
          const targetWidth = 120;
          const scale = targetWidth / (baseViewport.width || 595.28);
          const viewport = page.getViewport({ scale });

          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: ctx,
              viewport
            }).promise;
          }
          return;
        } catch (err) {
          // Fall through to fallback
        }
      }

      // Fallback preview
      canvas.width = 120;
      canvas.height = 170;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 120, 170);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(2, 2, 116, 166);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px "Anek Bangla", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`পৃষ্ঠা ${pageIdx + 1}`, 60, 88);
      }
    }

    async exportAndDownload() {
      this.showLoading('এডিটেড PDF প্রস্তুত হচ্ছে...');
      try {
        const result = await this.core.exportPdf({
          renderPageOverlay: (pageIdx, pageState) => this.renderPageOverlayForExport(pageIdx, pageState)
        });

        const blob = new Blob([result.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.hideLoading();
        if (window.showToast) {
          window.showToast('এডিটেড PDF সফলভাবে ডাউনলোড হয়েছে!');
        }
      } catch (err) {
        this.hideLoading();
        console.error(err);
        alert('PDF এক্সপোর্ট করতে সমস্যা হয়েছে: ' + err.message);
      }
    }

    async printDocument() {
      this.showLoading('প্রিন্ট প্রস্তুত হচ্ছে...');
      try {
        const result = await this.core.exportPdf({
          renderPageOverlay: (pageIdx, pageState) => this.renderPageOverlayForExport(pageIdx, pageState)
        });

        const blob = new Blob([result.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.right = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            this.hideLoading();
          }, 300);
        };
      } catch (err) {
        this.hideLoading();
        console.error(err);
        alert('প্রিন্ট করতে সমস্যা হয়েছে: ' + err.message);
      }
    }

    async renderPageOverlayForExport(pageIdx, pageState) {
      if (pageState.annotations.length === 0 && pageState.drawings.length === 0) {
        return null;
      }

      // Create high-resolution 2x offscreen canvas
      const scale = 2;
      const width = Math.round((pageState.width || 595.28) * scale);
      const height = Math.round((pageState.height || 841.89) * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // 1. Paint Drawings
      pageState.drawings.forEach(stroke => {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width || 3;
        ctx.lineCap = stroke.tool === 'highlighter' ? 'square' : 'round';
        ctx.lineJoin = stroke.tool === 'highlighter' ? 'miter' : 'round';
        ctx.stroke();
      });

      // 2. Paint Annotations
      for (const ann of pageState.annotations) {
        if (ann.type === 'whiteout') {
          ctx.fillStyle = ann.color || '#ffffff';
          ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
        } else if (ann.type === 'text') {
          ctx.fillStyle = ann.color || '#0f172a';
          ctx.font = `${ann.bold ? 'bold ' : ''}${ann.fontSize || 16}px 'Anek Bangla', 'Hind Siliguri', sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(ann.text || '', ann.x, ann.y);
        } else if (ann.type === 'stamp') {
          ctx.save();
          ctx.strokeStyle = ann.borderColor || '#059669';
          ctx.lineWidth = 2;
          ctx.fillStyle = ann.bgColor || 'rgba(5, 150, 105, 0.08)';
          ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
          ctx.fillRect(ann.x, ann.y, ann.width, ann.height);

          ctx.fillStyle = ann.color || '#059669';
          ctx.font = 'bold 18px "Anek Bangla", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ann.stampTitle || 'অনুমোদিত', ann.x + ann.width / 2, ann.y + 24);

          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(ann.stampSub || 'APPROVED', ann.x + ann.width / 2, ann.y + 44);
          ctx.restore();
        } else if (ann.type === 'signature' || ann.type === 'image') {
          if (ann.dataUrl) {
            await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, ann.x, ann.y, ann.width, ann.height);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = ann.dataUrl;
            });
          }
        }
      }

      return canvas.toDataURL('image/png');
    }

    showLoading(msg = 'প্রসেসিং হচ্ছে...') {
      let loader = document.getElementById('globalLoader');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        document.body.appendChild(loader);
      }
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">${msg}</div>
      `;
      loader.style.display = 'flex';
    }

    hideLoading() {
      const loader = document.getElementById('globalLoader');
      if (loader) loader.style.display = 'none';
    }
  }

  // Auto-initialize when running in browser
  if (typeof window !== 'undefined') {
    window.BanglaDocPdfEditor = {
      PdfEditorCore,
      PdfEditorUI,
      STAMP_PRESETS
    };
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('pdfEditorApp')) {
        window.pdfEditorInstance = new PdfEditorUI('pdfEditorApp');
      }
    });
  }

  return {
    PdfEditorCore,
    PdfEditorUI,
    STAMP_PRESETS
  };
}));

