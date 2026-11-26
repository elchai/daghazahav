// Mirrors each product's LIVE marketing site into daghazahav.com/<slug>/ so Google Ads
// and shared links can point at the lead domain (daghazahav.com/yishuvon/ instead of
// yeshuvon.com). The product sites are built for the domain root ("/img/logo.png"),
// so every root path is rewritten to "/<slug>/...".
//
// It copies what is deployed, never a local build: other sessions rebuild those
// folders mid-work, and a local build can hold unreleased changes.
//
// Usage:  node scripts/sync-systems.mjs            (all)
//         node scripts/sync-systems.mjs hafakon    (one)
// Deploy the product site first, then re-run this, then scripts/prerender-systems.mjs
// (bakes the rendered text into index.html for AI crawlers that do not run JS), and push.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://daghazahav.com';

export const SYSTEMS = [
  { slug: 'yishuvon', live: 'https://yeshuvon.com/' },
  { slug: 'gadudon', live: 'https://gdudon.web.app/' },
  { slug: 'hafakon', live: 'https://hafakon.web.app/' },
  { slug: 'mosachun', live: 'https://mosachun.web.app/' },
  { slug: 'kehilot', live: 'https://kehilot.web.app/' },
  { slug: 'iruchon', live: 'https://iruchon.web.app/' },
  { slug: 'mifalon', live: 'https://mifalon.web.app/' },
  { slug: 'mishmeron', live: 'https://mishmeron.web.app/' },
  { slug: 'mitvachon', live: 'https://mitvachon.web.app/' },
  { slug: 'dfuson', live: 'https://dfuson.web.app/' },
  { slug: 'misadon', live: 'https://misadon.web.app/' },
  { slug: 'nahagon', live: 'https://nahagon.web.app/' },
  { slug: 'amooton', live: 'https://amooton.web.app/' },
  { slug: 'timchuron', live: 'https://timchuron.web.app/' },
  { slug: 'timlulon', live: 'https://timlulon.web.app/' },
  { slug: 'shraga', live: 'https://shraga.web.app/' },
  // app.html and smoov-sdk.js stay on smoovsign.com: the product itself, not mirrored.
  { slug: 'smoovsign', live: 'https://smoovsign.com/', external: ['app.html', 'smoov-sdk.js'] },
];

const TEXT = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml']);
const MARK = '<!-- daghazahav: synced by scripts/sync-systems.mjs -->';
const START = ['index.html', 'accessibility.html', 'privacy.html'];

function tracking(slug) {
  return `${MARK}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4LJ0HYEW9L"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4LJ0HYEW9L');gtag('config','AW-1038551960');</script>
<script src="/systems-tracking.js" data-system="${slug}"></script>
`;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FILE = String.raw`[A-Za-z0-9_\-./%]+\.(?:png|jpe?g|webp|gif|svg|ico|html|js|css|json|webmanifest|woff2?|ttf|mp4|webm|txt|xml)`;

// Site-local references inside a file, resolved to a path relative to the site root.
export function refs(text, fromPath, live) {
  const out = new Set();
  const re = new RegExp(String.raw`["'\`(=]\s*((?:\./|\.\./|/)?${FILE})(?=[?#"'\`)\s])`, 'g');
  // Relative URLs in a script resolve against the page, in a stylesheet against the sheet.
  const dir = fromPath.endsWith('.css') ? path.posix.dirname(fromPath) : '';
  for (const m of text.matchAll(re)) {
    const ref = m[1];
    if (ref.startsWith('//')) continue;
    const p = path.posix.normalize(path.posix.join('/', ref.startsWith('/') ? '' : dir, ref)).slice(1);
    if (p && !p.startsWith('..')) out.add(p);
  }
  // Absolute links to the product's own domain (og:image, canonical assets).
  if (live) for (const m of text.matchAll(new RegExp(escape(live) + `(${FILE})`, 'g'))) out.add(m[1]);
  return out;
}

export function rewrite(text, slug, entries, ext) {
  // "/img/x.png", '/assets/a.js', `/privacy.html`, url(/img/x.png), ="/accessibility.html"
  if (!entries.length) return text;
  const names = entries.map(escape).join('|');
  const re = new RegExp(`(["'\`(=])/(${names})(?=[/"'\`)?#\\s]|$)`, 'g');
  let out = text.replace(re, `$1/${slug}/$2`);
  if (ext === '.html') out = out.replace(/(href=["'])\/(["'])/g, `$1/${slug}/$2`); // link back to the site home
  return out;
}

// The answer page that names this product. Linking the product page to it (and it back to
// the product) is what lets Google and AI engines connect the question to the product.
export const ANSWERS = {
  mosachun: ['garage-management-system-whatsapp-quotes', 'מערכת ניהול למוסך עם הצעת מחיר בוואצאפ'],
  mifalon: ['management-system-small-medium-factory', 'מערכת ניהול למפעל קטן או בינוני'],
  yishuvon: ['settlement-moshav-management-system', 'מערכת לניהול ישוב או מושב'],
  kehilot: ['building-neighborhood-community-management-system', 'מערכת לניהול קהילה בבניין או בשכונה'],
  hafakon: ['event-production-management-system', 'מערכת לניהול חברת הפקת אירועים'],
  iruchon: ['hospitality-compound-management-system', 'מערכת לניהול מתחם אירוח וצימרים'],
  mishmeron: ['security-company-shift-management-system', 'מערכת לניהול חברת שמירה ומשמרות'],
  mitvachon: ['shooting-range-management-system', 'מערכת לניהול מטווח ירי, נשק ותחמושת'],
};
const AMARK = '<!-- daghazahav:answers -->';

export function answersLinks(html, slug) {
  const a = ANSWERS[slug];
  if (!a || html.includes(AMARK)) return html;
  const nav = `${AMARK}<nav aria-label="שאלות ותשובות" dir="rtl" style="max-width:72rem;margin:0 auto;padding:16px 20px 28px;text-align:center;font:14px/1.7 Heebo,system-ui,sans-serif;opacity:.85"><a href="${ORIGIN}/answers/${a[0]}/" style="color:inherit">${a[1]}: שאלות ותשובות</a> · <a href="${ORIGIN}/answers/" style="color:inherit">כל השאלות והתשובות של&nbsp;דג הזהב</a></nav>\n`;
  return html.replace('</body>', `${nav}</body>`);
}

export function rewriteIndex(html, slug, live, external = []) {
  let out = html.split(live).join(`${ORIGIN}/${slug}/`); // canonical / og:url
  for (const e of external) out = out.split(`${ORIGIN}/${slug}/${e}`).join(live + e); // pages that live only on the product domain
  if (!out.includes(MARK)) out = out.replace('</head>', `${tracking(slug)}</head>`);
  return answersLinks(out, slug);
}

async function get(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

export async function crawl(live, external = []) {
  const files = new Map();
  const queue = [...START];
  while (queue.length) {
    const p = queue.shift();
    if (files.has(p) || external.includes(p)) continue;
    const body = await get(new URL(p, live).href);
    if (!body) { if (p === 'index.html') throw new Error(`${live}: index.html not reachable`); files.set(p, null); continue; }
    // SPA hosts answer unknown paths with index.html: a non-HTML path that returns HTML is missing.
    const ext = path.extname(p).toLowerCase();
    if (ext !== '.html' && body.subarray(0, 200).toString().toLowerCase().includes('<!doctype html')) { files.set(p, null); continue; }
    files.set(p, body);
    if (TEXT.has(ext)) for (const r of refs(body.toString('utf8'), p, live)) if (!files.has(r)) queue.push(r);
  }
  for (const [p, b] of files) if (!b) files.delete(p);
  return files;
}

export async function sync(sys) {
  const files = await crawl(sys.live, sys.external);
  const entries = [...new Set([...files.keys()].map((p) => p.split('/')[0]))].filter((n) => n !== 'index.html');
  const dst = path.join(ROOT, sys.slug);
  fs.rmSync(dst, { recursive: true, force: true });
  const leftovers = [];
  for (const [p, body] of files) {
    const d = path.join(dst, p);
    fs.mkdirSync(path.dirname(d), { recursive: true });
    const ext = path.extname(p).toLowerCase();
    if (!TEXT.has(ext)) { fs.writeFileSync(d, body); continue; }
    let text = rewrite(body.toString('utf8'), sys.slug, entries, ext);
    // the app lives on its own domain: a relative /login would open daghazahav.com/login (404)
    text = text.replace(/(["'])\/login(["'/?#])/g, (m, q, end) => q + sys.live + 'login' + end);
    if (p === 'index.html') text = rewriteIndex(text, sys.slug, sys.live, sys.external);
    for (const e of entries) {
      const m = text.match(new RegExp(`["'\`(=]/${escape(e)}[/"'\`)?#]`));
      if (m) leftovers.push(`${p}: ${m[0]}`);
    }
    fs.writeFileSync(d, text);
  }
  return { slug: sys.slug, files: files.size, leftovers };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2);
  const list = only.length ? SYSTEMS.filter((s) => only.includes(s.slug)) : SYSTEMS;
  let bad = false;
  for (const sys of list) {
    const r = await sync(sys);
    console.log(`${r.slug}: ${r.files} files${r.leftovers.length ? `, ROOT PATHS LEFT: ${r.leftovers.join(' | ')}` : ''}`);
    if (r.leftovers.length) bad = true;
  }
  process.exit(bad ? 1 : 0);
}
