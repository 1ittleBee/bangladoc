/**
 * Unit Tests for Theme & Toast Engine (js/theme.js)
 * Simulates DOM environment using JSDOM
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const themeScriptContent = fs.readFileSync(path.resolve(__dirname, '../../js/theme.js'), 'utf-8');

describe('Theme Engine (js/theme.js)', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <button id="themeToggleBtn"></button>
        </body>
      </html>`, {
      runScripts: 'dangerously',
      url: 'https://bangladoc.com/'
    });

    window = dom.window;
    document = window.document;

    // Execute theme.js inside the JSDOM window
    window.eval(themeScriptContent);
  });

  it('sets initial data-theme attribute on documentElement', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    assert.ok(theme === 'light' || theme === 'dark', 'Should initialize default theme');
  });

  it('toggles theme from light to dark and saves to localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.toggleTheme();

    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(window.localStorage.getItem('bangladoc-theme'), 'dark');

    const btn = document.getElementById('themeToggleBtn');
    assert.equal(btn.innerHTML, '☀️');
    assert.ok(btn.getAttribute('aria-label').includes('লাইট'));
  });

  it('toggles theme from dark to light and saves to localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    window.toggleTheme();

    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(window.localStorage.getItem('bangladoc-theme'), 'light');

    const btn = document.getElementById('themeToggleBtn');
    assert.equal(btn.innerHTML, '🌙');
    assert.ok(btn.getAttribute('aria-label').includes('ডার্ক'));
  });

  it('shows universal toast notification and injects element', () => {
    window.showToast('সংরক্ষণ সম্পন্ন');
    const toast = document.getElementById('banglaDocToast');
    assert.ok(toast, 'Toast element must exist in DOM');
    assert.ok(toast.classList.contains('show'), 'Toast should have show class');
    assert.ok(toast.innerHTML.includes('সংরক্ষণ সম্পন্ন'), 'Toast text should match');
  });

  it('copies text using copyTextToClipboard and triggers toast', () => {
    window.copyTextToClipboard('পরীক্ষামূলক টেক্সট', 'কপি সফল');
    const toast = document.getElementById('banglaDocToast');
    assert.ok(toast, 'Toast element must be displayed on copy');
    assert.ok(toast.innerHTML.includes('কপি সফল'), 'Toast text should include success message');
  });
});
