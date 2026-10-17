/**
 * BanglaDoc Search Engine & Indexing Helper
 * Checks sitemap URLs and submits updates to IndexNow (Bing/Yandex)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE_HOST = 'bangladoc.com';
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');

function getSitemapUrls() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('sitemap.xml not found!');
    return [];
  }
  const content = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = [...content.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)];
  return matches.map(m => m[1]);
}

function submitToIndexNow(urls, apiKey = 'sample-key') {
  const payload = JSON.stringify({
    host: SITE_HOST,
    key: apiKey,
    keyLocation: `https://${SITE_HOST}/${apiKey}.txt`,
    urlList: urls
  });

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log(`Submitting ${urls.length} URLs to IndexNow...`);
  const req = https.request(options, (res) => {
    console.log(`IndexNow Response Status: ${res.statusCode} (${res.statusMessage})`);
    res.on('data', (d) => process.stdout.write(d));
  });

  req.on('error', (e) => {
    console.error('IndexNow Request Error:', e.message);
  });

  req.write(payload);
  req.end();
}

const urls = getSitemapUrls();
console.log(`Found ${urls.length} URLs in sitemap.xml:`);
urls.forEach(u => console.log(` - ${u}`));

if (process.argv.includes('--submit')) {
  submitToIndexNow(urls);
} else {
  console.log('\nRun with `node scripts/notify-indexing.js --submit` to send to IndexNow API.');
}
