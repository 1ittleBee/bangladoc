const fs = require('fs');
const path = require('path');

console.log('Running BanglaDoc production build...');

// Cloudflare Pages scans the root directory for static assets when build output is '/' or '.'.
// Packages in node_modules (such as workerd binary at 129MB) exceed Cloudflare Workers' 25 MiB asset limit.
// We prune node_modules in Cloudflare Pages or when explicitly requested.
if (process.env.CF_PAGES || process.env.CLOUDFLARE_PAGES || process.argv.includes('--clean-modules')) {
  console.log('Detected Cloudflare Pages build environment (CF_PAGES). Pruning node_modules...');
  const nmPath = path.join(__dirname, '..', 'node_modules');
  if (fs.existsSync(nmPath)) {
    fs.rmSync(nmPath, { recursive: true, force: true });
    console.log('Successfully pruned node_modules before asset packaging.');
  }
}

console.log('BanglaDoc static site build complete.');
