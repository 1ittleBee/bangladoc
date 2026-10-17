/**
 * Integration Test: Word Document (.doc) Export Functionality
 * Verifies that the export routine produces valid HTML-for-Word with UTF-8 BOM,
 * MS Office word namespaces, and Bengali typography.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '../../');
const converterJs = fs.readFileSync(path.join(ROOT_DIR, 'js/converter.js'), 'utf-8');
const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'js/theme.js'), 'utf-8');

describe('Word Export Integration Test', () => {
  it('generates a valid .doc payload with UTF-8 BOM and Word XML namespaces', () => {
    let htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'rent-agreement.html'), 'utf-8');
    htmlContent = htmlContent.replace(/<script src="js\/(?:converter|theme|autodraft)\.js"><\/script>/g, '');

    const dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously',
      url: 'https://bangladoc.com/rent-agreement.html'
    });

    const { window } = dom;

    // Inject scripts
    window.eval(converterJs);
    window.eval(themeJs);

    let capturedBlobData = null;
    let capturedMimeType = null;
    let downloadTriggered = false;
    let downloadedFileName = '';

    // Mock Blob and URL
    window.Blob = class MockBlob {
      constructor(chunks, options) {
        this.chunks = chunks;
        this.type = options ? options.type : '';
        capturedBlobData = chunks;
        capturedMimeType = this.type;
      }
    };

    window.URL.createObjectURL = () => 'blob:mock-url';
    window.URL.revokeObjectURL = () => {};

    // Mock HTMLAnchorElement click
    const originalClick = window.HTMLAnchorElement.prototype.click;
    window.HTMLAnchorElement.prototype.click = function () {
      downloadTriggered = true;
      downloadedFileName = this.download;
    };

    // Invoke exportAsWordDoc
    assert.equal(typeof window.exportAsWordDoc, 'function', 'exportAsWordDoc should be defined');
    window.exportAsWordDoc();

    assert.equal(downloadTriggered, true, 'Download link click must be triggered');
    assert.ok(downloadedFileName.endsWith('.doc'), 'File name must end with .doc');
    assert.equal(capturedMimeType, 'application/msword', 'MIME type must be application/msword');

    // Verify BOM
    assert.equal(capturedBlobData[0], '\ufeff', 'First chunk must be UTF-8 BOM (\\ufeff)');

    // Verify Word HTML markup
    const payloadHtml = capturedBlobData[1];
    assert.ok(payloadHtml.includes("xmlns:w='urn:schemas-microsoft-com:office:word'"), 'Must include Word XML namespace');
    assert.ok(payloadHtml.includes('Kalpurush'), 'Must declare Bengali friendly font');
    assert.ok(payloadHtml.includes('চুক্তিপত্র') || payloadHtml.includes('দলিল'), 'Must contain Bengali contract content');

    // Restore
    window.HTMLAnchorElement.prototype.click = originalClick;
  });
});
