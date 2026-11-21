// Bakes the rendered content of every mirrored product page (daghazahav.com/<slug>/)
// into its index.html, inside <div id="root">.
//
// Why: the product sites are React SPAs. Their index.html holds ~20 words and an empty
// root, so AI answer engines that do not run JavaScript (ChatGPT search, Perplexity,
// Claude) see an empty page. React's createRoot() replaces the root's children on load,
// so visitors get the same live app as before; crawlers get the full text.
//
// Run after scripts/sync-systems.mjs (sync rewrites index.html with an empty root):
//   node scripts/sync-systems.mjs [slug]  &&  node scripts/prerender-systems.mjs [slug]
// Needs Playwright (npx playwright install chromium) or PW_CHROME=<path to chrome.exe>.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEMS } from './sync-systems.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!--prerender:start-->';
const END = '<!--prerender:end-->';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// Keep text and structure; drop what would misbehave before React takes over.
function clean(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\sstyle="[^"]*(opacity:\s*0[;"]|transform:\s*translate)[^"]*"/gi, '');
}

const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;

export async function prerender(slugs) {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch {
    throw new Error('Playwright is not installed here: run "npm i -D playwright" (or install it globally) and retry');
  }
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  const out = [];
  try {
    for (const slug of slugs) {
      const file = path.join(ROOT, slug, 'index.html');
      if (!fs.existsSync(file)) { out.push({ slug, error: 'no index.html' }); continue; }
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.route(/googletagmanager|google-analytics|googleadservices|doubleclick|facebook|connect\.facebook/, (r) => r.abort());
      await page.goto(`${base}/${slug}/`, { waitUntil: 'networkidle' });
      for (let y = 0; y < 40000; y += 700) {
        const h = await page.evaluate((yy) => { window.scrollTo(0, yy); return document.body.scrollHeight; }, y);
        await page.waitForTimeout(90);
        if (y > h) break;
      }
      await page.waitForTimeout(600);
      const inner = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
      await page.close();
      const body = clean(inner);
      const n = words(body);
      if (n < 80) { out.push({ slug, error: `only ${n} words rendered, left untouched` }); continue; }
      let html = fs.readFileSync(file, 'utf8');
      const block = `${START}${body}${END}`;
      if (html.includes(START)) html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => block);
      else if (/<div id="root"><\/div>/.test(html)) html = html.replace('<div id="root"></div>', () => `<div id="root">${block}</div>`);
      else { out.push({ slug, error: 'no empty <div id="root"> to fill' }); continue; }
      fs.writeFileSync(file, html);
      out.push({ slug, words: n });
    }
  } finally {
    await browser.close();
    server.close();
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2);
  const slugs = (only.length ? SYSTEMS.filter((s) => only.includes(s.slug)) : SYSTEMS).map((s) => s.slug);
  const res = await prerender(slugs);
  let bad = false;
  for (const r of res) { console.log(r.error ? `${r.slug}: ${r.error}` : `${r.slug}: ${r.words} words baked in`); if (r.error) bad = true; }
  // the .md twins are converted from this HTML, so rebuild them now
  const { buildMarkdown } = await import('./build-markdown.mjs');
  console.log(`md-twins: ${buildMarkdown().built.length} .md twins + llms.txt rebuilt`);
  process.exit(bad ? 1 : 0);
}
