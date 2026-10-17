/**
 * BanglaDoc End-to-End System & Asset Integrity Test
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const GA4_ID = 'G-0XZVNWJWZQ';

const HTML_FILES = [
  'index.html',
  'rent-agreement.html',
  'commercial-rent.html',
  'police-gd.html',
  'money-loan.html',
  'leave-application.html',
  'vehicle-sale.html',
  'bayna-agreement.html',
  'about.html',
  'privacy-policy.html',
  'terms.html',
  'disclaimer.html'
];

let totalTests = 0;
let passedTests = 0;
let failures = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('====================================================');
console.log('   BanglaDoc Full End-to-End System Test Suite');
console.log('====================================================\n');

// 1. Asset & File Existence Check
console.log('[1] Core File & Asset Integrity:');
HTML_FILES.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(filePath), `HTML file exists: ${file}`);
});

['robots.txt', 'sitemap.xml', 'css/style.css', 'js/theme.js', 'js/converter.js', 'js/autodraft.js', 'assets/icons/favicon.svg', 'assets/icons/logo-mark.svg', 'assets/icons/logo-horizontal.svg'].forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(filePath), `Asset file exists: ${file}`);
});

// 2. SEO, Meta, Analytics & Schema.org Test
console.log('\n[2] SEO, Canonical & Google Analytics (GA4) Tagging:');
HTML_FILES.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
  assert(content.includes('charset="UTF-8"'), `${file} has charset UTF-8`);
  assert(content.includes('name="viewport"'), `${file} has mobile viewport`);
  assert(content.includes('name="robots"'), `${file} has robots directive`);
  assert(content.includes('name="googlebot"'), `${file} has googlebot directive`);
  assert(content.includes('rel="canonical"'), `${file} has canonical URL`);
  assert(content.includes(GA4_ID), `${file} has GA4 tracking tag (${GA4_ID})`);
  assert(content.includes('assets/icons/logo-mark.svg'), `${file} uses official vector logo-mark.svg`);

  // Check JSON-LD validity if present
  const jsonLdMatches = [...content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (jsonLdMatches.length > 0) {
    jsonLdMatches.forEach((m, idx) => {
      try {
        JSON.parse(m[1].trim());
        assert(true, `${file} JSON-LD block #${idx + 1} parses as valid JSON`);
      } catch (err) {
        assert(false, `${file} JSON-LD block #${idx + 1} syntax error: ${err.message}`);
      }
    });
  }
});

// 3. Broken Links & Reference Checker
console.log('\n[3] Internal Link & Resource Reference Resolution (Zero 404s):');
HTML_FILES.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');

  // Check all <a href="...">
  const hrefMatches = [...content.matchAll(/href="([^"#:]+)"/g)];
  hrefMatches.forEach(m => {
    const target = m[1];
    if (target.startsWith('http') || target.startsWith('mailto') || target.startsWith('tel') || target === '#') return;
    const resolved = path.join(ROOT_DIR, target);
    assert(fs.existsSync(resolved), `${file} -> link "${target}" resolves to valid file`);
  });

  // Check all <script src="...">
  const scriptMatches = [...content.matchAll(/src="([^":]+)"/g)];
  scriptMatches.forEach(m => {
    const target = m[1];
    if (target.startsWith('http') || target.startsWith('data:')) return;
    const resolved = path.join(ROOT_DIR, target);
    assert(fs.existsSync(resolved), `${file} -> script/img "${target}" resolves to valid file`);
  });
});

// 4. Generator Features & Script Binding Validation
console.log('\n[4] Generator Features (Mobile Dock, AutoDraft & Legal Guidance):');
['rent-agreement.html', 'commercial-rent.html', 'police-gd.html', 'money-loan.html', 'leave-application.html', 'vehicle-sale.html', 'bayna-agreement.html'].forEach(file => {
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
  assert(content.includes('mobile-action-dock'), `${file} has Mobile Action Dock`);
  assert(content.includes('legal-guidance-card'), `${file} has Legal Guidance Checklist Card`);
  assert(content.includes('autodraft.js'), `${file} includes autodraft.js`);
  assert(content.includes('BanglaDoc.initAutoDraft'), `${file} initializes AutoDraft persistence`);
  assert(content.includes('BanglaDoc.shareViaWhatsApp'), `${file} includes WhatsApp 1-tap share`);
  assert(content.includes('exportAsWordDoc'), `${file} includes MS Word .doc exporter`);
});

// 5. Sitemap.xml Alignment
console.log('\n[5] Sitemap.xml URLs:');
const sitemapContent = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
HTML_FILES.forEach(file => {
  if (file === 'index.html') {
    assert(sitemapContent.includes('<loc>https://bangladoc.com/</loc>'), `sitemap.xml includes homepage root`);
  } else {
    assert(sitemapContent.includes(`<loc>https://bangladoc.com/${file}</loc>`), `sitemap.xml includes ${file}`);
  }
});

// Results Summary
console.log('\n====================================================');
console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
if (failures.length > 0) {
  console.error(`\nFound ${failures.length} Failure(s):`);
  failures.forEach(f => console.error(` - ${f}`));
  process.exit(1);
} else {
  console.log('Status: 100% HEALTHY — ZERO BROKEN LINKS & ZERO ERRORS');
  console.log('====================================================\n');
  process.exit(0);
}
