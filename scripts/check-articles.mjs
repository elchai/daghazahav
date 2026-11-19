// Quality gate for daghazahav.com/articles/. Run before every ship: npm run check:articles
// Reads the built HTML (run scripts/build-articles.mjs first) and exits non-zero on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES } from './articles-data.mjs';
import { GUIDES, PILLAR } from './guides-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://daghazahav.com';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const fails = [];
const fail = (where, why) => fails.push(`${where}: ${why}`);

// Minimum words in <main> per page type. System articles are product pages, guides are the long form.
const MIN_WORDS = { pillar: 1800, guide: 1000, system: 600, index: 80 };
const BANNED = [
  [/[\u2013\u2014]/, 'em/en dash'],
  [/בקרוב/, 'בקרוב'],
  [/פיילוט/, 'פיילוט'],
  [/מהפכני/, 'מהפכני'],
  [/מהפכה/, 'מהפכה'],
  [/בעולם של היום/, '"בעולם של היום"'],
  [/לא סוד ש/, '"לא סוד ש"'],
  [/וואטסאפ/, 'spelling: וואצאפ, not וואטסאפ'],
];

const pages = fs.readdirSync(path.join(ROOT, 'articles'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, 'articles', d.name, 'index.html')))
  .map((d) => d.name);
const typeOf = (slug) => (slug === PILLAR ? 'pillar' : GUIDES.some((g) => g.slug === slug) ? 'guide' : 'system');
const htmlFiles = ['articles/index.html', ...pages.map((s) => `articles/${s}/index.html`)];

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const textOf = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '));
const countWords = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// Resolve a site path ("/articles/x/", "/a.png?v=2", "../y/") to a file in the repo.
function resolves(href, fromFile) {
  let p = href.split('#')[0].split('?')[0];
  if (p.startsWith(ORIGIN)) p = p.slice(ORIGIN.length) || '/';
  if (!p) return true; // same-page anchor
  const abs = p.startsWith('/') ? p : `/${path.posix.join(path.posix.dirname(fromFile), p)}`;
  const rel = decodeURIComponent(abs).replace(/^\/+/, '');
  const full = path.join(ROOT, rel);
  if (abs.endsWith('/')) return fs.existsSync(path.join(full, 'index.html'));
  return (fs.existsSync(full) && fs.statSync(full).isFile()) || fs.existsSync(path.join(full, 'index.html'));
}
const isInternal = (h) => h.startsWith('/') || h.startsWith(ORIGIN) || !/^[a-z][a-z0-9+.-]*:|^#|^\/\//i.test(h);

const titles = new Map();
const descs = new Map();
const wordReport = [];

for (const f of htmlFiles) {
  const html = read(f);
  const slug = f === 'articles/index.html' ? null : f.split('/')[1];
  const type = slug ? typeOf(slug) : 'index';

  for (const [re, why] of BANNED) if (re.test(html)) fail(f, `banned: ${why}`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(f, 'must have exactly one <h1>');
  if (type === 'pillar' || type === 'guide') if (/גדודון/.test(html)) fail(f, 'guides must not mention גדודון');

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) fail(f, 'missing <title>'); else if (titles.has(title)) fail(f, `duplicate <title> with ${titles.get(title)}`); else titles.set(title, f);
  if (!desc) fail(f, 'missing meta description'); else if (descs.has(desc)) fail(f, `duplicate meta description with ${descs.get(desc)}`); else descs.set(desc, f);

  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const expected = `${ORIGIN}/${slug ? `articles/${slug}/` : 'articles/'}`;
  if (canonical !== expected) fail(f, `canonical ${canonical} != ${expected}`);
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) if (!html.includes(`property="${prop}"`)) fail(f, `missing ${prop}`);

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) fail(f, 'no JSON-LD');
  const types = new Set();
  for (const b of blocks) {
    try {
      const data = JSON.parse(b);
      for (const node of data['@graph'] || [data]) [].concat(node['@type']).forEach((x) => types.add(x));
      if (type === 'pillar' || type === 'guide') {
        const art = (data['@graph'] || []).find((n) => n['@type'] === 'Article');
        if (!art) fail(f, 'guide without Article JSON-LD');
        else {
          if (art.author?.['@id'] !== 'https://elchai.co.il/#elchai') fail(f, 'Article author must be https://elchai.co.il/#elchai');
          if (art.publisher?.['@id'] !== `${ORIGIN}/#org`) fail(f, 'Article publisher must be the org');
          if (!art.datePublished || !art.dateModified) fail(f, 'Article dates missing');
        }
      }
    } catch (e) { fail(f, `JSON-LD does not parse: ${e.message}`); }
  }
  if (type === 'pillar' || type === 'guide') for (const need of ['Article', 'FAQPage', 'BreadcrumbList', 'Person', 'Organization']) if (!types.has(need)) fail(f, `JSON-LD missing ${need}`);

  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (isInternal(href) && !resolves(href, f)) fail(f, `broken internal link ${href}`);
  }

  // Count the copy itself: the answer box plus the article up to the CTA, without link cards to other pages.
  const main = (html.match(/<main>([\s\S]*?)<\/main>/) || [])[1] || '';
  const answer = (main.match(/<p class="(?:answer|lead)">([\s\S]*?)<\/p>/) || [])[1] || '';
  const body = type === 'index' ? main : ((main.match(/<article[^>]*>([\s\S]*?)(?:<section class="cta"|<\/article>)/) || [])[1] || '');
  const wc = countWords(textOf(`${answer} ${body.replace(/<a class="post[^"]*"[\s\S]*?<\/a>/g, ' ')}`));
  wordReport.push([f, type, wc]);
  if (wc < MIN_WORDS[type]) fail(f, `${wc} words, minimum for ${type} is ${MIN_WORDS[type]}`);
}

// Sitemap, llms.txt and the index must list every article page.
const sitemap = read('sitemap.xml');
const llms = read('llms.txt');
const indexHtml = read('articles/index.html');
for (const [label, src] of [['sitemap.xml', sitemap], ['llms.txt', llms]]) for (const [re, why] of BANNED) if (re.test(src)) fail(label, `banned: ${why}`);
for (const slug of pages) {
  const u = `${ORIGIN}/articles/${slug}/`;
  if (!sitemap.includes(`<loc>${u}</loc>`)) fail('sitemap.xml', `missing ${u}`);
  if (!llms.includes(`(${u})`)) fail('llms.txt', `missing ${u}`);
  if (!indexHtml.includes(`href="/articles/${slug}/"`)) fail('articles/index.html', `missing link to ${slug}`);
}
for (const m of sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?/g)) {
  if (m[1].startsWith(`${ORIGIN}/articles/`) && !/^\d{4}-\d{2}-\d{2}$/.test(m[2] || '')) fail('sitemap.xml', `bad lastmod for ${m[1]}`);
}
// Every article and guide in the data must be built.
for (const a of [...ARTICLES, ...GUIDES]) if (!pages.includes(a.slug)) fail('articles/', `${a.slug} is in the data but not built`);

// Any file under articles/ (CSS included) must be free of dashes.
(function walk(dir) {
  for (const d of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${d.name}`;
    if (d.isDirectory()) walk(p);
    else if (/\.(html|css|js|txt|xml|json)$/.test(d.name) && /[\u2013\u2014]/.test(read(p))) fail(p, 'em/en dash');
  }
})('articles');

// The cost guide promises factors only: no digits anywhere in its own copy.
const cost = GUIDES.find((g) => g.slug === 'custom-system-cost-factors');
if (cost) {
  const strings = [];
  (function collect(v, key) {
    if (typeof v === 'string') { if (key !== 'id') strings.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => collect(x));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) collect(x, k);
  })([cost.answer, cost.sections, cost.faq, cost.h1, cost.title, cost.description, cost.excerpt]);
  const copy = strings.join(' ').replace(/\]\([^)]*\)/g, ']'); // link targets are paths, not copy
  const digits = copy.match(/\S*\d\S*/g);
  if (digits) fail('guides-data.mjs', `cost guide must not contain numbers: ${digits.slice(0, 5).join(' ')}`);
}

for (const [f, type, wc] of wordReport) console.log(`${String(wc).padStart(5)}  ${type.padEnd(6)}  ${f}`);
if (fails.length) {
  console.error(`\ncheck-articles: ${fails.length} problem(s)\n${fails.map((x) => `  - ${x}`).join('\n')}`);
  process.exit(1);
}
console.log(`\ncheck-articles: OK (${htmlFiles.length} pages)`);
