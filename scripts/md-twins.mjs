// md-twins: AI-readable Markdown twins for a static site (the teloring.com pattern).
// Every public page /x/ gets /x.md (the home page gets /index.md), plus /llms.txt (an index)
// and /llms-full.txt (every .md concatenated). The Markdown is converted from the real page HTML
// at build time, so it cannot drift from what visitors see. Dependency-free on purpose.
// Shared verbatim between daghazahav (scripts/md-twins.mjs) and elchai.co.il (md-twins.mjs).
import fs from 'node:fs';
import path from 'node:path';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'template', 'svg']);
// Dropped with everything inside: chrome, media, interactive widgets, forms.
const DROP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'canvas', 'iframe', 'form', 'button', 'select',
  'textarea', 'input', 'label', 'nav', 'footer', 'dialog', 'video', 'audio', 'picture', 'img', 'object', 'embed', 'map', 'head']);
const BLOCK = new Set(['p', 'div', 'section', 'article', 'main', 'header', 'aside', 'figure', 'figcaption', 'address',
  'details', 'fieldset', 'center', 'hgroup', 'dl', 'body', 'html']);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '', zwnj: '', zwj: '', lrm: '', rlm: '', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c', hellip: '...', middot: '\u00b7', bull: '\u2022', copy: '\u00a9', reg: '\u00ae', times: '\u00d7', larr: '\u2190', rarr: '\u2192', check: '\u2713', shekel: '\u20aa' };
export const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') {
    const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : m;
  }
  return e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m;
});

function attrsOf(src) {
  const out = {};
  for (const m of src.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

// Lenient HTML to tree. Good enough for generated and hand-written marketing pages.
export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
  let last = 0;
  let m;
  const top = () => stack[stack.length - 1];
  while ((m = re.exec(html))) {
    if (m.index > last) top().children.push(html.slice(last, m.index));
    last = re.lastIndex;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const node = { tag, attrs: attrsOf(m[3] || ''), children: [] };
      // implicit closes that matter for list and paragraph structure
      if (tag === 'li' || tag === 'p' || tag === 'dt' || tag === 'dd' || tag === 'tr' || tag === 'td' || tag === 'th') {
        const t = top().tag;
        if (t === tag || (tag === 'li' && t === 'p') || ((tag === 'td' || tag === 'th') && (t === 'td' || t === 'th'))) stack.pop();
      }
      top().children.push(node);
      if (RAW.has(tag)) {
        const close = html.toLowerCase().indexOf(`</${tag}`, last);
        const end = close < 0 ? html.length : close;
        node.children.push(html.slice(last, end));
        const gt = html.indexOf('>', end);
        last = re.lastIndex = gt < 0 ? html.length : gt + 1;
      } else if (!VOID.has(tag) && !m[4]) stack.push(node);
    }
  }
  if (last < html.length) top().children.push(html.slice(last));
  return root;
}

export function find(node, pred) {
  if (typeof node === 'string') return null;
  if (pred(node)) return node;
  for (const c of node.children) { const r = find(c, pred); if (r) return r; }
  return null;
}
const hasTag = (node, tag) => !!find(node, (n) => n.tag === tag);
export const textOf = (node) => (typeof node === 'string' ? decode(node) : node.children.map(textOf).join(''));

function dropped(n, opts) {
  if (DROP.has(n.tag)) return true;
  const a = n.attrs;
  if ('hidden' in a || a['aria-hidden'] === 'true') return true;
  if (/^(navigation|dialog|alertdialog|banner|contentinfo|search)$/.test(a.role || '')) return true;
  if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(a.style || '')) return true;
  // the site header (logo + menu); an <header> inside an article keeps its h1
  if (n.tag === 'header' && hasTag(n, 'nav')) return true;
  if (opts.skip && opts.skip(n)) return true;
  return false;
}

const oneLine = (s) => s.replace(/\u0000/g, ' ').replace(/\s*\n+\s*/g, ' ').replace(/[ \t]+/g, ' ').trim();

// Tree to Markdown. Blocks are separated by \u0000 markers, collapsed at the end.
function md(node, ctx) {
  if (typeof node === 'string') return decode(node).replace(/[\s\u00a0]+/g, ' ');
  if (dropped(node, ctx.opts)) return '';
  const kids = (c = ctx) => node.children.map((k) => md(k, c)).join('');
  const B = '\u0000';
  const t = node.tag;
  // animated counters ship "0" in the HTML and the real number in data-target
  const target = node.attrs['data-target'];
  if (target && /^[\d.,]+$/.test(target) && /^\s*0?\s*$/.test(textOf(node))) return `${node.attrs['data-prefix'] || ''}${target}${node.attrs['data-suffix'] || ''}`;
  if (/^h[1-6]$/.test(t)) {
    const s = oneLine(kids()).replace(/^#+\s*/, '');
    if (!s) return '';
    return ctx.inList ? ` **${s}** ` : `${B}${'#'.repeat(Number(t[1]))} ${s}${B}`;
  }
  switch (t) {
    case 'br': return '\n';
    case 'hr': return `${B}---${B}`;
    case 'a': {
      const inner = oneLine(kids());
      const href = (node.attrs.href || '').trim();
      if (!inner) return '';
      if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return ` ${inner} `;
      let abs;
      try { abs = new URL(href, ctx.url).href; } catch { return ` ${inner} `; }
      abs = abs.replace(/ /g, '%20').replace(/\)/g, '%29');
      const link = (s) => `[${s.replace(/[[\]]/g, '')}](${abs})`;
      // a card that is one big link: its heading becomes the link text, the rest follows as text
      if (find(node, (n) => n !== node && (/^h[1-6]$/.test(n.tag) || n.tag === 'p' || n.tag === 'div'))) {
        const blocks = collapse(kids({ ...ctx, inList: false })).split('\n\n').map((b) => b.replace(/^#+\s*/, ''));
        const h = find(node, (n) => /^h[1-6]$/.test(n.tag));
        const head = h ? oneLine(md(h, { ...ctx, inList: true })).replace(/\*\*/g, '') : blocks[0];
        const rest = blocks.filter((b) => b !== head).join(' ');
        return `\u0000${link(head)}${rest ? `\n${rest}` : ''}\u0000`;
      }
      return ` ${link(inner)} `;
    }
    case 'strong': case 'b': {
      const s = oneLine(kids());
      return s ? ` **${s}** ` : '';
    }
    case 'em': case 'i': {
      const s = oneLine(kids());
      return s ? ` _${s}_ ` : '';
    }
    case 'code': return ctx.pre ? kids() : `\`${oneLine(kids())}\``;
    case 'pre': return `${B}\`\`\`\n${textOf(node).replace(/\n+$/, '')}\n\`\`\`${B}`;
    case 'ul': case 'ol': {
      let i = 0;
      const items = node.children.filter((c) => typeof c !== 'string' && c.tag === 'li' && !dropped(c, ctx.opts)).map((li) => {
        const body = collapse(li.children.map((k) => md(k, { ...ctx, inList: true })).join(''));
        if (!body) return '';
        i += 1;
        const mark = t === 'ol' ? `${i}.` : '-';
        return `${mark} ${body.split('\n').map((l, j) => (j ? `  ${l}` : l)).join('\n')}`;
      }).filter(Boolean);
      return items.length ? `${B}${items.join('\n')}${B}` : '';
    }
    case 'li': return `${B}- ${oneLine(kids())}${B}`;
    case 'blockquote': {
      const s = collapse(kids());
      return s ? `${B}${s.split('\n').map((l) => `> ${l}`).join('\n')}${B}` : '';
    }
    case 'summary': case 'dt': {
      const s = oneLine(kids());
      return s ? `${B}**${s}**${B}` : '';
    }
    case 'dd': return `${B}${kids()}${B}`;
    case 'table': {
      const rows = [];
      (function walk(n) {
        for (const c of n.children) {
          if (typeof c === 'string' || dropped(c, ctx.opts)) continue;
          if (c.tag === 'tr') rows.push(c.children.filter((x) => typeof x !== 'string' && (x.tag === 'td' || x.tag === 'th')).map((x) => oneLine(md({ ...x, tag: 'span' }, ctx)).replace(/\|/g, '/')));
          else walk(c);
        }
      })(node);
      if (!rows.length) return '';
      const w = Math.max(...rows.map((r) => r.length));
      const line = (r) => `| ${Array.from({ length: w }, (_, k) => r[k] || '').join(' | ')} |`;
      return `${B}${[line(rows[0]), line(Array(w).fill('---')), ...rows.slice(1).map(line)].join('\n')}${B}`;
    }
    default:
      if (BLOCK.has(t) || t === '#root') return `${B}${kids()}${B}`;
      return kids();
  }
}

function collapse(s) {
  return s.split('\u0000')
    .map((b) => b.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').replace(/ +([.,:;!?)])/g, '$1').replace(/([.!?])(?=[\u05d0-\u05ea])/g, '$1 ').trim()).join('\n').replace(/\n{2,}/g, '\n').trim())
    .filter(Boolean)
    .join('\n\n');
}

// Drop blocks repeated verbatim (marquees, carousels cloned for looping, mobile + desktop copies).
function dedupe(s) {
  const seen = new Set();
  return s.split('\n\n').filter((b) => {
    if (b.length < 24 || /^#/.test(b)) return true;
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  }).join('\n\n');
}

export function pageMeta(html) {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const meta = (name) => {
    for (const m of head.matchAll(/<meta\s[^>]*>/gi)) {
      const a = attrsOf(m[0].slice(5, -1));
      if ((a.name || a.property || '').toLowerCase() === name) return a.content || '';
    }
    return '';
  };
  const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ['', ''])[1]).replace(/\s+/g, ' ').trim();
  const canon = (head.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [''])[0];
  return {
    title: title || meta('og:title'),
    description: (meta('description') || meta('og:description')).replace(/\s+/g, ' ').trim(),
    canonical: canon ? attrsOf(canon.slice(5, -1)).href : '',
  };
}

export function htmlToMarkdown(html, url, opts = {}) {
  const tree = parse(html);
  const body = find(tree, (n) => n.tag === 'body') || tree;
  const main = (opts.main && find(body, opts.main)) || find(body, (n) => n.tag === 'main') || body;
  return dedupe(collapse(md(main, { url, opts })));
}

// URL path to the twin's path: / -> /index.md, /x/ -> /x.md, /x.html -> /x.md
export function mdPathFor(pathname) {
  if (pathname === '/' || pathname === '') return '/index.md';
  return `${pathname.replace(/\/$/, '').replace(/\.html$/, '').replace(/\/index$/, '')}.md`;
}
export function fileFor(root, pathname) {
  const p = decodeURIComponent(pathname);
  const cands = p.endsWith('/') ? [`${p}index.html`] : p.endsWith('.html') ? [p] : [`${p}.html`, `${p}/index.html`];
  for (const c of cands) { const f = path.join(root, c); if (fs.existsSync(f)) return f; }
  return null;
}

// Adds (or corrects) <link rel="alternate" type="text/markdown"> in the page head. Returns the new HTML.
export function withAlternate(html, href) {
  const tag = `<link rel="alternate" type="text/markdown" href="${href}">`;
  const re = /<link rel="alternate" type="text\/markdown" href="[^"]*">/;
  if (re.test(html)) return html.replace(re, tag);
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  return html.replace(/<\/head>/i, `${tag}${nl}</head>`);
}

// Build everything. cfg: { root, origin, pages: [{ url, extra? }], preamble(page), skip?, main?, llms(pages), fullHeader(pages) }
export function buildSite(cfg) {
  const pages = [];
  const seen = new Set();
  for (const p of cfg.pages) {
    const u = new URL(p.url);
    const key = u.pathname === '' ? '/' : u.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    const file = fileFor(cfg.root, key);
    if (!file) { console.warn(`md-twins: no file for ${p.url}, skipped`); continue; }
    let html = fs.readFileSync(file, 'utf8');
    const meta = pageMeta(html);
    const url = `${cfg.origin}${key}`;
    const mdPath = mdPathFor(key);
    const mdUrl = `${cfg.origin}${mdPath}`;
    let body = htmlToMarkdown(html, url, { skip: cfg.skip, main: cfg.main });
    if (!/^# /m.test(body)) body = `# ${meta.title}\n\n${body}`;
    const page = { ...p, path: key, url, mdPath, mdUrl, file, title: meta.title, description: meta.description, body };
    page.markdown = `${cfg.preamble(page)}\n\n${body}\n`;
    const next = withAlternate(html, mdUrl);
    if (next !== html) fs.writeFileSync(file, next);
    fs.mkdirSync(path.dirname(path.join(cfg.root, mdPath)), { recursive: true });
    fs.writeFileSync(path.join(cfg.root, mdPath), page.markdown);
    pages.push(page);
  }
  fs.writeFileSync(path.join(cfg.root, 'llms.txt'), cfg.llms(pages));
  fs.writeFileSync(path.join(cfg.root, 'llms-full.txt'), `${cfg.fullHeader(pages)}\n\n${pages.map((p) => p.markdown.trim()).join('\n\n---\n\n')}\n`);
  const dash = pages.filter((p) => /[\u2013\u2014]/.test(p.markdown)).map((p) => p.mdPath);
  return { pages, dash };
}
