/**
 * Download Google Fonts for Self-Hosting in BanglaDoc
 * Eliminates external font requests, speeds up load times, and fixes Search Console errors.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FONTS_DIR = path.resolve(__dirname, '../assets/fonts');
const FONTS_CSS_PATH = path.resolve(__dirname, '../css/fonts.css');

if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700;800&family=Hind+Siliguri:wght@400;600;700&family=Plus+Jakarta+Sans:wght@500;700&display=swap';

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching Google Fonts stylesheet...');
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const cssBuffer = await fetchUrl(GOOGLE_FONTS_URL, { 'User-Agent': userAgent });
  const cssText = cssBuffer.toString('utf-8');

  // Match all @font-face blocks with src: url(...)
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  let match;
  const urls = new Set();
  while ((match = urlRegex.exec(cssText)) !== null) {
    urls.add(match[1]);
  }

  console.log(`Found ${urls.size} woff2 font files to download.`);
  let localCss = cssText;

  let index = 1;
  for (const fontUrl of urls) {
    // Generate clean filename
    const urlObj = new URL(fontUrl);
    const basename = path.basename(urlObj.pathname);
    const localFileName = `font-${index}-${basename}`;
    const localFilePath = path.join(FONTS_DIR, localFileName);

    console.log(`[${index}/${urls.size}] Downloading ${basename}...`);
    const fontBuffer = await fetchUrl(fontUrl);
    fs.writeFileSync(localFilePath, fontBuffer);

    // Replace in CSS: use relative path ../assets/fonts/...
    localCss = localCss.split(fontUrl).join(`../assets/fonts/${localFileName}`);
    index++;
  }

  fs.writeFileSync(FONTS_CSS_PATH, localCss, 'utf-8');
  console.log(`✅ Fonts downloaded to assets/fonts/ and css/fonts.css created successfully!`);
}

run().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
