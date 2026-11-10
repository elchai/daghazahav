// Builds daghazahav.com/articles/ (index + one page per system) from scripts/articles-data.mjs,
// and refreshes the articles block in sitemap.xml and llms.txt (between "articles" markers).
// Usage: node scripts/build-articles.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES, PUBLISHED } from './articles-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://daghazahav.com';
const OUT = path.join(ROOT, 'articles');
const PHONE = '054-2012000';
const WA = 'https://wa.me/972542012000?text=';
const ORG_ID = `${ORIGIN}/#org`;
const MODIFIED = PUBLISHED;

// Hebrew function words must never end a line: bind them to the next word with a no-break space
// (same list as the product sites' nb.js).
const BIND = /(?<=^|\s)(ובלי|בלי|ללא|על|של|עם|את|אל|לפי|מול|בין|כל|לכל|או|גם|עד|ועד|לא|אם|כי|כמו|וגם|ולא)[ \t\n\r]+/g;
const bind = (s) => s.replace(BIND, '$1 ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (s) => esc(bind(s)).replace(/ /g, '&nbsp;');
const attr = (s) => esc(s);
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const url = (a) => `${ORIGIN}/articles/${a.slug}/`;
const bySlug = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const heDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ב${['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'][m - 1]} ${y}`; };

const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.97 1-3.62-.24-.37a9.8 9.8 0 0 1-1.5-5.22c0-5.42 4.42-9.84 9.85-9.84 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.96c0 5.43-4.42 9.84-9.86 9.84zm8.38-18.22A11.77 11.77 0 0 0 12.04 0C5.5 0 .17 5.33.16 11.88c0 2.1.55 4.14 1.6 5.94L.06 24l6.33-1.66a11.86 11.86 0 0 0 5.66 1.44h.01c6.55 0 11.88-5.33 11.89-11.88a11.8 11.8 0 0 0-3.52-8.4z"/></svg>';

const ORG = {
  '@type': ['Organization', 'ProfessionalService'], '@id': ORG_ID, name: 'דג הזהב', alternateName: 'DAGHAZAHAV', url: `${ORIGIN}/`,
  logo: { '@type': 'ImageObject', url: `${ORIGIN}/daghazahav-logo-new.png` }, telephone: '+972-54-201-2000',
  founder: { '@type': 'Person', name: 'אלחי פיין', url: 'https://elchai.co.il/about/' },
};

function head({ title, description, canonical, image, type, ld }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="דג הזהב">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/favicon.ico?v=7" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=7">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=7">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&family=Orbitron:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/articles/articles.css?v=3">
<script>document.documentElement.classList.add('js')</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4LJ0HYEW9L"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4LJ0HYEW9L');gtag('config','AW-1038551960');</script>
<script src="/lead-tracking.js" defer></script>
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': ld })}</script>
</head>`;
}

function nav(current) {
  const cur = (k) => (k === current ? ' aria-current="page"' : '');
  return `<header class="nav"><div class="nav-in">
<a href="/" class="nav-logo" aria-label="דג הזהב, לעמוד הבית"><img src="/daghazahav-logo-mark.png" alt="DAGHAZAHAV" width="1428" height="262"><span class="nav-slogan">פיתוח מערכות ניהול מתקדמות</span></a>
<nav aria-label="ראשי"><ul class="nav-links">
<li class="hide-sm"><a href="/#projects">המערכות</a></li>
<li><a href="/articles/"${cur('articles')}>מאמרים</a></li>
<li class="hide-sm"><a href="/answers/">שאלות ותשובות</a></li>
<li><a href="/#contact" class="nav-cta">צור קשר</a></li>
</ul></nav>
</div></header>`;
}

function foot(sys) {
  const msg = encodeURIComponent('שלום אלחי, הגעתי מהמאמרים באתר ואשמח לפרטים על מערכת לארגון שלי');
  return `<footer><div class="wrap foot-in">
<span class="foot-logo">DAGHAZAHAV</span>
<nav class="foot-links" aria-label="קישורים בתחתית">
<a href="/">עמוד הבית</a>
<a href="/articles/">מאמרים</a>
<a href="/answers/">שאלות ותשובות</a>
<a href="/accessibility.html">הצהרת נגישות</a>
<a href="tel:${PHONE}">${PHONE}</a>
</nav>
<span class="foot-copy">© 2026 DAGHAZAHAV. כל הזכויות שמורות.</span>
</div></footer>
<a class="fab-wa" href="${WA}${msg}" target="_blank" rel="noopener" aria-label="דברו איתנו בוואצאפ" onclick="window.trackWhatsApp&&trackWhatsApp('article_fab_${sys}')">${WA_ICON}</a>
<script>
(function(){document.querySelectorAll('img[data-sk]').forEach(function(i){var d=function(){i.classList.add('loaded');if(i.parentElement)i.parentElement.classList.add('loaded');};if(i.complete)d();else i.addEventListener('load',d);});
var els=document.querySelectorAll('.rv');if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in');});return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var el=e.target;setTimeout(function(){el.classList.add('in');},(+el.dataset.d||0)*80);io.unobserve(el);}});},{rootMargin:'0px 0px -40px 0px'});
els.forEach(function(e){io.observe(e);});})();
</script>
<script src="/a11y.js" defer></script>
</body>
</html>
`;
}

function card(a, level = 'h3', d = 0) {
  return `<a class="post rv" data-d="${d}" href="/articles/${a.slug}/">
<div class="post-img"><img data-sk src="${a.img}" alt="מסכי המערכת ${attr(a.name)} עם נתוני הדגמה" width="1230" height="1025" loading="lazy" decoding="async"></div>
<div class="post-body"><span class="post-kind">${t(a.kind)}</span><${level}>${t(a.name)}: ${t(a.tagline)}</${level}><p>${t(a.excerpt)}</p><span class="post-more">לקריאת המאמר <span class="arr" aria-hidden="true">←</span></span></div>
</a>`;
}

function article(a) {
  const canonical = url(a);
  const image = `${ORIGIN}${a.img}`;
  const isExternal = !a.product.startsWith(ORIGIN);
  const text = [a.answer, ...a.what, ...a.problem, ...a.features.flat(), ...a.benefits, ...a.scenario, ...a.setup, ...a.security, ...a.faq.flat()].join(' ');
  const minutes = Math.max(3, Math.round(words(text) / 180));
  const waText = encodeURIComponent(`שלום אלחי, קראתי את המאמר על ${a.name} ואשמח לפרטים`);
  const sections = [
    ['what', `מה זה ${a.name}`],
    ['who', 'למי זה מתאים'],
    ['problem', 'איזו בעיה זה פותר'],
    ['features', `היכולות של ${a.name}`],
    ['benefits', 'למה זה טוב'],
    ['scenario', 'איך זה עובד בפועל'],
    ['setup', 'איך מתחילים'],
    ['security', 'אבטחה ופרטיות'],
    ['faq', 'שאלות נפוצות'],
  ];
  const ld = [
    ORG,
    {
      '@type': 'Article', '@id': `${canonical}#article`, headline: a.h1, description: a.description, inLanguage: 'he-IL',
      image: [image], datePublished: PUBLISHED, dateModified: MODIFIED, mainEntityOfPage: canonical,
      author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, about: { '@id': `${canonical}#software` },
      articleSection: 'מאמרים', wordCount: words(text),
    },
    {
      '@type': 'SoftwareApplication', '@id': `${canonical}#software`, name: a.nameEn ? `${a.name} (${a.nameEn})` : a.name,
      description: a.answer, applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android, iOS',
      url: a.product, image, inLanguage: 'he', featureList: a.features.map((f) => f[0]),
      ...(isExternal ? { creator: { '@id': ORG_ID } } : { publisher: { '@id': ORG_ID } }),
    },
    {
      '@type': 'FAQPage', '@id': `${canonical}#faq`,
      mainEntity: a.faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })),
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'עמוד הבית', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'מאמרים', item: `${ORIGIN}/articles/` },
        { '@type': 'ListItem', position: 3, name: a.name, item: canonical },
      ],
    },
  ];

  const out = `${head({ title: a.title, description: a.description, canonical, image, type: 'article', ld })}
<body>
${nav('articles')}
<main>
<section class="wrap narrow" aria-labelledby="h1">
<nav class="crumbs" aria-label="פירורי לחם"><a href="/">עמוד הבית</a> / <a href="/articles/">מאמרים</a> / <span aria-current="page">${t(a.name)}</span></nav>
<span class="tag">${t(a.kind)}</span>
<h1 id="h1">${t(a.h1)}</h1>
<p class="meta">דג הזהב · <time datetime="${PUBLISHED}">${heDate(PUBLISHED)}</time> · ${minutes} דקות קריאה</p>
<p class="answer">${t(a.answer)}</p>
<figure class="frame"><div class="frame-bar" aria-hidden="true"><i></i><i></i><i></i></div><img data-sk src="${a.img}" alt="מסכי המערכת ${attr(a.name)} במחשב ובנייד, עם נתוני הדגמה" width="1230" height="1025" fetchpriority="high" decoding="async"><figcaption>${t(`${a.name}: ${a.tagline}. המסכים מוצגים עם נתוני הדגמה.`)}</figcaption></figure>
<nav class="toc" aria-label="תוכן המאמר"><p>במאמר</p><ol>${sections.map(([id, label]) => `<li><a href="#${id}">${t(label)}</a></li>`).join('')}</ol></nav>
</section>
<article class="wrap narrow">
<h2 id="what">${t(sections[0][1])}</h2>
${a.what.map((p) => `<p>${t(p)}</p>`).join('\n')}
<h2 id="who">${t(sections[1][1])}</h2>
<div class="grid">${a.audience.map(([h, d], i) => `<div class="card rv" data-d="${i}"><h3>${t(h)}</h3><p>${t(d)}</p></div>`).join('')}</div>
<h2 id="problem">${t(sections[2][1])}</h2>
${a.problem.map((p) => `<p>${t(p)}</p>`).join('\n')}
<h2 id="features">${t(sections[3][1])}</h2>
<p>${t(`אלה היכולות המרכזיות של ${a.name}, כפי שהן עובדות היום:`)}</p>
<div class="grid">${a.features.map(([h, d], i) => `<div class="card rv" data-d="${i % 3}"><div class="ico" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div><h3>${t(h)}</h3><p>${t(d)}</p></div>`).join('')}</div>
<h2 id="benefits">${t(sections[4][1])}</h2>
<ul class="list">${a.benefits.map((b) => `<li>${t(b)}</li>`).join('')}</ul>
<h2 id="scenario">${t(sections[5][1])}</h2>
<p><strong>${t(a.scenarioTitle)}</strong></p>
<ol class="steps">${a.scenario.map((s) => `<li>${t(s)}</li>`).join('')}</ol>
<h2 id="setup">${t(sections[6][1])}</h2>
<ol class="steps">${a.setup.map((s) => `<li>${t(s)}</li>`).join('')}</ol>
<p class="note">${t(a.setupNote)}</p>
<h2 id="security">${t(sections[7][1])}</h2>
<ul class="list">${a.security.map((s) => `<li>${t(s)}</li>`).join('')}</ul>
<h2 id="faq">${t(sections[8][1])}</h2>
${a.faq.map(([q, ans]) => `<details><summary>${t(q)}</summary><p>${t(ans)}</p></details>`).join('\n')}
<section class="cta" aria-labelledby="cta-h">
<h2 id="cta-h">${t(`רוצים לראות את ${a.name} אצלכם?`)}</h2>
<p>${t(isExternal ? `באתר ${a.name} אפשר לבדוק את המערכת. לשאלות ולמערכת בהתאמה אישית כתבו לנו בוואצאפ.` : `באתר המערכת יש הדגמה חיה של המסכים. כתבו לנו בוואצאפ ונתאם שיחת היכרות קצרה.`)}</p>
<div class="btns">
<a class="btn btn-p" href="${a.product}"${isExternal ? ' target="_blank" rel="noopener"' : ''}>${t(a.productLabel)} <span class="arr" aria-hidden="true">←</span></a>
<a class="btn btn-wa" href="${WA}${waText}" target="_blank" rel="noopener" onclick="window.trackWhatsApp&&trackWhatsApp('article_${a.sys}')">${WA_ICON}<span>שיחה בוואצאפ</span></a>
<a class="btn btn-s" href="tel:${PHONE}">${PHONE}</a>
</div>
</section>
<div class="about"><img src="/elchai-fine.png" alt="אלחי פיין" width="72" height="72" loading="lazy"><p>${t(`${a.name} היא אחת המערכות של `)}<b>דג הזהב</b>${t(', בית התוכנה של אלחי פיין, רס"ן (מיל\') וספק משרד הביטחון. דג הזהב מפתחת מערכות ניהול לעיריות, ליישובים, למוסכים, למפעלים, לאולמות אירועים ולמערכת הביטחון.')}<a href="/">לכל המערכות</a>${a.answers ? ` · <a href="${a.answers}">שאלות ותשובות על ${t(a.name)}</a>` : ''}</p></div>
<h2>מאמרים נוספים</h2>
<div class="posts related">${a.related.map((s, i) => card(bySlug[s], 'h3', i)).join('\n')}</div>
<p><a href="/articles/">לכל המאמרים</a></p>
</article>
</main>
${foot(a.sys)}`;
  return out;
}

function index() {
  const canonical = `${ORIGIN}/articles/`;
  const title = 'מאמרים על מערכות הניהול של דג הזהב | DAGHAZAHAV';
  const description = 'מדריך מעמיק לכל מערכת של דג הזהב: ישובון, גדודון, הפקון, מוסכון, קהילה בבניין, אירוחון, מפעלון, משמרון, מטווחון, דפוסון ו-CRAZY CRM. יכולות, קהל יעד ושאלות נפוצות.';
  const ld = [
    ORG,
    {
      '@type': 'CollectionPage', '@id': `${canonical}#page`, url: canonical, name: title, description, inLanguage: 'he-IL',
      publisher: { '@id': ORG_ID }, dateModified: MODIFIED,
      mainEntity: { '@type': 'ItemList', itemListElement: ARTICLES.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: url(a), name: a.h1 })) },
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'עמוד הבית', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'מאמרים', item: canonical },
      ],
    },
  ];
  return `${head({ title, description, canonical, image: `${ORIGIN}/og-daghazahav-1200.jpg`, type: 'website', ld })}
<body>
${nav('articles')}
<main>
<section class="wrap" aria-labelledby="h1">
<nav class="crumbs" aria-label="פירורי לחם"><a href="/">עמוד הבית</a> / <span aria-current="page">מאמרים</span></nav>
<span class="tag">מאמרים</span>
<h1 id="h1">${t('מאמרים: כל מערכות הניהול של דג הזהב')}</h1>
<p class="lead">${t('דג הזהב, בית התוכנה של אלחי פיין, מפתחת מערכות ניהול לעיריות, ליישובים, לעסקים ולמערכת הביטחון. כאן יש מאמר מעמיק על כל מערכת: מה היא עושה, למי היא מתאימה, אילו יכולות יש בה ואיך מתחילים לעבוד איתה.')}</p>
<div class="posts">
${ARTICLES.map((a, i) => card(a, 'h2', i % 3)).join('\n')}
</div>
<section class="cta" aria-labelledby="cta-h">
<h2 id="cta-h">${t('לא מצאתם מערכת שמתאימה בדיוק לארגון שלכם?')}</h2>
<p>${t('דג הזהב בונה גם מערכות בהתאמה אישית. כל פרויקט מתחיל בשיחת היכרות שבה מאפיינים יחד את מה שהארגון צריך.')}</p>
<div class="btns">
<a class="btn btn-wa" href="${WA}${encodeURIComponent('שלום אלחי, הגעתי מעמוד המאמרים ואשמח לפרטים על מערכת לארגון שלי')}" target="_blank" rel="noopener" onclick="window.trackWhatsApp&&trackWhatsApp('articles_index')">${WA_ICON}<span>שיחה בוואצאפ</span></a>
<a class="btn btn-s" href="/answers/">שאלות ותשובות</a>
</div>
</section>
</main>
${foot('index')}`;
}

function replaceBlock(file, start, end, block) {
  const p = path.join(ROOT, file);
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  let src = raw.split('\r\n').join('\n');
  const re = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  const full = `${start}\n${block}\n${end}\n`;
  return { p, crlf, src: re.test(src) ? src.replace(re, full) : null, full };
}

function writeText(p, text, crlf) { fs.writeFileSync(p, crlf ? text.split('\n').join('\r\n') : text); }

// sitemap.xml: articles block before </urlset>
function sitemap() {
  const block = [`  <url><loc>${ORIGIN}/articles/</loc><lastmod>${MODIFIED}</lastmod></url>`, ...ARTICLES.map((a) => `  <url><loc>${url(a)}</loc><lastmod>${MODIFIED}</lastmod></url>`)].join('\n');
  const r = replaceBlock('sitemap.xml', '  <!-- articles:start -->', '  <!-- articles:end -->', block);
  const src = r.src ?? fs.readFileSync(r.p, 'utf8').split('\r\n').join('\n').replace('</urlset>', `${r.full}</urlset>`);
  writeText(r.p, src, r.crlf);
}

// llms.txt: articles section right after the intro, before "## שאלות ותשובות"
function llms() {
  const block = ['## מאמרים', `- [מאמרים: כל מערכות הניהול של דג הזהב](${ORIGIN}/articles/): מאמר מעמיק על כל מערכת, עם יכולות, קהל יעד ושאלות נפוצות.`, ...ARTICLES.map((a) => `- [${a.h1}](${url(a)}): ${a.answer}`)].join('\n');
  const r = replaceBlock('llms.txt', '<!-- articles:start -->', '<!-- articles:end -->', block);
  let src = r.src;
  if (src === null) {
    src = fs.readFileSync(r.p, 'utf8').split('\r\n').join('\n');
    const at = src.indexOf('## שאלות ותשובות');
    src = at >= 0 ? `${src.slice(0, at)}${r.full}\n${src.slice(at)}` : `${src.trimEnd()}\n\n${r.full}`;
  }
  writeText(r.p, src, r.crlf);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), index());
for (const a of ARTICLES) {
  for (const s of a.related) if (!bySlug[s]) throw new Error(`${a.slug}: unknown related ${s}`);
  fs.mkdirSync(path.join(OUT, a.slug), { recursive: true });
  fs.writeFileSync(path.join(OUT, a.slug, 'index.html'), article(a));
}
sitemap();
llms();

// Guard: the copy rules that Elchai enforces on every page.
const bad = [];
for (const f of ['index.html', ...ARTICLES.map((a) => `${a.slug}/index.html`)]) {
  const h = fs.readFileSync(path.join(OUT, f), 'utf8');
  for (const [re, why] of [[/[\u2013\u2014]/, 'em/en dash'], [/בקרוב/, 'בקרוב'], [/פיילוט/, 'פיילוט'], [/וואטסאפ/, 'וואטסאפ spelling'], [/אשקלון/, 'client name']]) if (re.test(h)) bad.push(`${f}: ${why}`);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) bad.push(`${f}: h1 count`);
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`built ${ARTICLES.length} articles + index, sitemap and llms.txt updated`);
