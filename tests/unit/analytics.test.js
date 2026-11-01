/**
 * Unit Tests for BanglaDoc Universal Analytics & Conversion Engine (js/analytics.js)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const analyticsScriptContent = fs.readFileSync(path.resolve(__dirname, '../../js/analytics.js'), 'utf-8');

describe('BanglaDoc Analytics & Conversion Engine (js/analytics.js)', () => {
  let dom;
  let window;
  let gtagCalls;

  beforeEach(() => {
    gtagCalls = [];
    dom = new JSDOM(`<!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <button id="printBtn" onclick="window.print()">Print</button>
        </body>
      </html>`, {
      runScripts: 'dangerously',
      url: 'https://bangladoc.com/pdf-editor.html'
    });

    window = dom.window;

    // Mock gtag function
    window.gtag = function (command, eventName, params) {
      gtagCalls.push({ command, eventName, params });
    };

    // Execute analytics script
    window.eval(analyticsScriptContent);
  });

  it('initializes BanglaDoc.Analytics on window namespace', () => {
    assert.ok(window.BanglaDoc, 'BanglaDoc namespace exists');
    assert.ok(window.BanglaDoc.Analytics, 'BanglaDoc.Analytics object exists');
    assert.equal(typeof window.BanglaDoc.Analytics.trackEvent, 'function');
  });

  it('tracks pdf_download event with custom parameters to gtag and eventLog', () => {
    const success = window.BanglaDoc.Analytics.trackPdfDownload('rent-agreement', 3, 'pdf');
    assert.equal(success, true);

    const history = window.BanglaDoc.Analytics.getEventHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].event_name, 'pdf_download');
    assert.equal(history[0].template_name, 'rent-agreement');
    assert.equal(history[0].page_count, 3);
    assert.equal(history[0].format, 'pdf');

    // Verify gtag was called
    assert.equal(gtagCalls.length, 1);
    assert.equal(gtagCalls[0].command, 'event');
    assert.equal(gtagCalls[0].eventName, 'pdf_download');
    assert.equal(gtagCalls[0].params.template_name, 'rent-agreement');
  });

  it('tracks pdf_upload event with file size in KB', () => {
    window.BanglaDoc.Analytics.trackPdfUpload(204800, 'contract.pdf');

    const history = window.BanglaDoc.Analytics.getEventHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].event_name, 'pdf_upload');
    assert.equal(history[0].file_size_kb, 200);
    assert.equal(history[0].file_name, 'contract.pdf');
  });

  it('tracks digital_signature_added with signature type', () => {
    window.BanglaDoc.Analytics.trackSignature('type');

    const history = window.BanglaDoc.Analytics.getEventHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].event_name, 'digital_signature_added');
    assert.equal(history[0].signature_type, 'type');
  });

  it('tracks share_whatsapp, export_word_doc, and draft_saved events', () => {
    window.BanglaDoc.Analytics.trackWhatsAppShare('money-loan');
    window.BanglaDoc.Analytics.trackWordExport('money-loan');
    window.BanglaDoc.Analytics.trackDraftSave('money-loan', 7);

    const history = window.BanglaDoc.Analytics.getEventHistory();
    assert.equal(history.length, 3);
    assert.equal(history[0].event_name, 'share_whatsapp');
    assert.equal(history[1].event_name, 'export_word_doc');
    assert.equal(history[2].event_name, 'draft_saved');
    assert.equal(history[2].field_count, 7);
  });

  it('auto-intercepts window.print() and fires document_print event', () => {
    window.print();

    const history = window.BanglaDoc.Analytics.getEventHistory();
    const printEvent = history.find(e => e.event_name === 'document_print');
    assert.ok(printEvent, 'document_print event was captured');
    assert.equal(printEvent.template_name, 'pdf-editor');
  });

  it('gracefully handles missing or failing window.gtag', () => {
    delete window.gtag;
    const success = window.BanglaDoc.Analytics.trackEvent('test_event', { key: 'value' });
    assert.equal(success, true);
    assert.equal(window.BanglaDoc.Analytics.getEventHistory().length, 1);
  });
});
