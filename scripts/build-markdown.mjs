// AI-readable twins of daghazahav.com (the teloring.com pattern):
//   every page in sitemap.xml  ->  same path + .md   (/ -> /index.md, /tochna/ -> /tochna.md)
//   /llms.txt                  ->  index: scripts/llms-intro.md, then a link to every .md with its meta description
//   /llms-full.txt             ->  every .md in one file
// It also adds <link rel="alternate" type="text/markdown"> to each page head.
// The Markdown is converted from the built HTML, so run this LAST: build-articles.mjs and
// prerender-systems.mjs call it on their own. After a hand edit to a page (index.html, tochna/,
// privacy.html) run: npm run build:md
// Edit the facts at the top of llms.txt in scripts/llms-intro.md, never in llms.txt itself.
// Usage: node scripts/build-markdown.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './md-twins.mjs';
import { SYSTEMS } from './sync-systems.mjs';
import { GUIDES } from './guides-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://daghazahav.com';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').split('\r\n').join('\n');

const SYS = new Set(SYSTEMS.map((s) => `/${s.slug}/`));
const GUIDE = new Set(['/articles/', ...GUIDES.map((g) => `/articles/${g.slug}/`)]);
const section = (p) => (SYS.has(p) ? 'systems' : GUIDE.has(p) ? 'guides' : p.startsWith('/articles/') ? 'articles' : p.startsWith('/answers/') ? 'answers' : 'main');
const SECTIONS = [
  ['main', 'עמודים ראשיים'],
  ['systems', 'המערכות של דג הזהב'],
  ['guides', 'מדריכים'],
  ['articles', 'מאמרים'],
  ['answers', 'שאלות ותשובות'],
];

export function buildMarkdown() {
  const sitemapUrls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const pages = [...sitemapUrls, `${ORIGIN}/accessibility.html`].map((url) => ({ url }));
  const intro = read('scripts/llms-intro.md').trim();
  const { pages: built, dash } = buildSite({
    root: ROOT,
    origin: ORIGIN,
    pages,
    // the home page hero mocks and tickers hold demo data only; nothing to read there
    skip: (n) => /\b(lp-modal|sm-overlay|ticker|marquee)\b/.test(n.attrs.class || ''),
    preamble: (p) => [
      `> **${p.title}**`,
      p.description ? `> ${p.description}` : null,
      '>',
      `> זוהי גרסת Markdown של העמוד ${p.url} עבור עוזרי AI וסוכנים. בציטוט יש להפנות לכתובת ${p.url}.`,
      `> לכל עמוד באתר יש גרסת Markdown בכתובת שלו עם הסיומת .md. אינדקס העמודים: ${ORIGIN}/llms.txt. כל האתר בקובץ אחד: ${ORIGIN}/llms-full.txt`,
    ].filter((l) => l !== null).join('\n'),
    llms: (all) => {
      const out = [intro, '', `הקובץ בנוי לפי התקן llms.txt (llmstxt.org). כל קישור למטה פותח את גרסת ה-Markdown של העמוד. בציטוט יש להפנות לכתובת העמוד עצמה, הכתובת שלפני הסיומת .md. כל האתר בקובץ אחד: ${ORIGIN}/llms-full.txt`];
      for (const [key, label] of SECTIONS) {
        const list = all.filter((p) => section(p.path) === key);
        if (!list.length) continue;
        out.push('', `## ${label}`, ...list.map((p) => `- [${p.title}](${p.mdUrl})${p.description ? `: ${p.description}` : ''}`));
      }
      return `${out.join('\n')}\n`;
    },
    fullHeader: (all) => [
      '# דג הזהב: כל האתר בקובץ אחד',
      '',
      `אתר: ${ORIGIN}/`,
      `אינדקס העמודים: ${ORIGIN}/llms.txt`,
      '',
      `> כל ${all.length} העמודים של daghazahav.com בגרסת Markdown, במסמך אחד עבור עוזרי AI וסוכנים. כל עמוד מתחיל בכתובת המקור שלו. בציטוט יש להפנות לכתובת העמוד ולא לקובץ הזה.`,
      '',
      intro.replace(/^# .*\n+/, ''),
    ].join('\n'),
  });
  return { built, dash };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { built, dash } = buildMarkdown();
  if (dash.length) console.warn(`note: dash characters come from the page text itself in ${dash.join(', ')}`);
  console.log(`md-twins: ${built.length} pages, llms.txt and llms-full.txt written`);
}
