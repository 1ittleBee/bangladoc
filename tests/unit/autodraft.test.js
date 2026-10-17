/**
 * Unit Tests for AutoDraft Engine (js/autodraft.js)
 * Tests draft storage, restoration, debounce save, and reset logic.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const autodraftScriptContent = fs.readFileSync(path.resolve(__dirname, '../../js/autodraft.js'), 'utf-8');

describe('AutoDraft Engine (js/autodraft.js)', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div class="form-panel">
            <div class="panel-header"><h2>চুক্তিপত্রের বিবরণ</h2></div>
            <form id="testAgreementForm">
              <input type="text" name="firstPartyName" id="firstPartyName" value="" />
              <input type="text" name="secondPartyName" id="secondPartyName" value="" />
              <input type="number" name="monthlyRent" id="monthlyRent" value="" />
            </form>
          </div>
          <div id="dockStatusLabel">খসড়া সংরক্ষিত</div>
          <span id="dockPulseDot"></span>
        </body>
      </html>`, {
      runScripts: 'dangerously',
      url: 'https://bangladoc.com/rent-agreement.html'
    });

    window = dom.window;
    document = window.document;

    // Execute autodraft.js inside window
    window.eval(autodraftScriptContent);
  });

  it('does nothing if the form ID is not found in DOM', () => {
    assert.doesNotThrow(() => {
      window.BanglaDoc.initAutoDraft('nonExistentForm', 'test_key');
    });
  });

  it('restores draft data from localStorage and triggers onRestoreCallback', () => {
    const draftPayload = {
      firstPartyName: 'মো: রফিকুল ইসলাম',
      secondPartyName: 'আব্দুল করিম',
      monthlyRent: '25000'
    };
    window.localStorage.setItem('bangladoc_test_draft', JSON.stringify(draftPayload));

    let callbackCalled = false;
    window.BanglaDoc.initAutoDraft('testAgreementForm', 'bangladoc_test_draft', () => {
      callbackCalled = true;
    });

    const form = document.getElementById('testAgreementForm');
    assert.equal(form.elements['firstPartyName'].value, 'মো: রফিকুল ইসলাম');
    assert.equal(form.elements['secondPartyName'].value, 'আব্দুল করিম');
    assert.equal(form.elements['monthlyRent'].value, '25000');
    assert.equal(callbackCalled, true, 'Restore callback should be executed');

    const banner = document.getElementById('draftAlertBanner');
    assert.ok(banner, 'Draft recovery banner should be inserted in DOM');
    assert.ok(banner.textContent.includes('রিকভার করা হয়েছে'));
  });

  it('saves form inputs into localStorage on input event after debounce timeout', async () => {
    window.BanglaDoc.initAutoDraft('testAgreementForm', 'bangladoc_debounce_draft');
    const form = document.getElementById('testAgreementForm');
    const nameInput = form.elements['firstPartyName'];

    nameInput.value = 'সুলতানা পারভীন';
    nameInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // Wait for the 350ms debounce
    await new Promise((resolve) => setTimeout(resolve, 450));

    const storedRaw = window.localStorage.getItem('bangladoc_debounce_draft');
    assert.ok(storedRaw, 'Draft should be saved to localStorage');
    const parsed = JSON.parse(storedRaw);
    assert.equal(parsed.firstPartyName, 'সুলতানা পারভীন');
  });

  it('constructs WhatsApp share URL correctly', () => {
    let openedUrl = '';
    window.open = (url) => {
      openedUrl = url;
    };

    window.BanglaDoc.shareViaWhatsApp('বাসা ভাড়ার চুক্তিপত্র');
    assert.ok(openedUrl.startsWith('https://api.whatsapp.com/send?text='), 'Must target WhatsApp API');
    assert.ok(openedUrl.includes(encodeURIComponent('বাসা ভাড়ার চুক্তিপত্র')), 'Must encode document title');
  });
});
