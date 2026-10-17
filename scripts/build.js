const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Building BanglaDoc static production distribution in dist/...');

// 1. Clean and prepare dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Production items to bundle
const itemsToCopy = [
  'about.html',
  'bayna-agreement.html',
  'commercial-rent.html',
  'disclaimer.html',
  'index.html',
  'leave-application.html',
  'money-loan.html',
  'pdf-editor.html',
  'police-gd.html',
  'privacy-policy.html',
  'rent-agreement.html',
  'terms.html',
  'vehicle-sale.html',
  'sitemap.xml',
  'robots.txt',
  'css',
  'js',
  'assets'
];

for (const item of itemsToCopy) {
  const src = path.join(rootDir, item);
  const dest = path.join(distDir, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// 3. Also prune root node_modules if in Cloudflare Pages/Workers environment
if (process.env.CF_PAGES || process.env.CLOUDFLARE_PAGES || process.argv.includes('--clean-modules')) {
  const nmPath = path.join(rootDir, 'node_modules');
  if (fs.existsSync(nmPath)) {
    console.log('Pruning root node_modules for Cloudflare build container...');
    fs.rmSync(nmPath, { recursive: true, force: true });
  }
}

console.log('✅ BanglaDoc dist/ built successfully.');
