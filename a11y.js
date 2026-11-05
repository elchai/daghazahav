/* Accessibility widget for daghazahav.com (IS 5568 / WCAG 2.2 AA helpers).
   Self-contained: injects its own button, panel and styles. Settings persist per viewer. */
(function () {
  var KEY = 'dz-a11y';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  var isEn = function () { return document.body.classList.contains('en'); };
  var T = {
    title: ['נגישות', 'Accessibility'],
    bigger: ['הגדלת טקסט', 'Larger text'],
    smaller: ['הקטנת טקסט', 'Smaller text'],
    contrast: ['ניגודיות גבוהה', 'High contrast'],
    gray: ['גווני אפור', 'Grayscale'],
    links: ['הדגשת קישורים', 'Highlight links'],
    font: ['גופן קריא', 'Readable font'],
    motion: ['עצירת אנימציות', 'Stop animations'],
    reset: ['איפוס הגדרות', 'Reset settings'],
    statement: ['הצהרת נגישות', 'Accessibility statement'],
    close: ['סגירה', 'Close']
  };
  var t = function (k) { return T[k][isEn() ? 1 : 0]; };

  var css = '' +
    '#dz-a11y-btn{position:fixed;right:22px;bottom:22px;z-index:900;width:52px;height:52px;border-radius:50%;border:2px solid #fff;background:#1d4fa3;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px -8px rgba(17,26,46,.55);padding:0}' +
    '#dz-a11y-btn svg{width:28px;height:28px}#dz-a11y-btn:hover{transform:scale(1.08)}#dz-a11y-btn{transition:transform .2s}' +
    '#dz-a11y-btn:focus-visible,#dz-a11y-panel button:focus-visible,#dz-a11y-panel a:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}' +
    '#dz-a11y-panel{position:fixed;right:22px;bottom:84px;z-index:901;width:min(300px,calc(100vw - 32px));background:#fff;color:#111a2e;border:2px solid #1d4fa3;border-radius:16px;box-shadow:0 24px 60px -20px rgba(17,26,46,.5);padding:14px;font-family:Heebo,Arial,sans-serif;direction:rtl;text-align:right}' +
    'body.en #dz-a11y-panel{direction:ltr;text-align:left}' +
    '#dz-a11y-panel[hidden]{display:none}' +
    '#dz-a11y-panel h2{font-size:1.05rem;font-weight:800;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;color:#111a2e}' +
    '#dz-a11y-panel .a11y-x{background:none;border:0;font-size:1.4rem;line-height:1;cursor:pointer;color:#111a2e;padding:2px 8px}' +
    '#dz-a11y-panel .a11y-grid{display:flex;flex-direction:column;gap:7px}' +
    '#dz-a11y-panel .a11y-opt{border:2px solid #c9d3e6;background:#f6f8fc;color:#111a2e;border-radius:10px;padding:9px 12px;font:600 .92rem Heebo,Arial,sans-serif;cursor:pointer;min-height:44px;display:flex;align-items:center;gap:10px;text-align:inherit;width:100%}#dz-a11y-panel .a11y-opt svg{width:18px;height:18px;flex:none}' +
    '#dz-a11y-panel .a11y-opt[aria-pressed="true"]{background:#1d4fa3;border-color:#1d4fa3;color:#fff}' +
    '#dz-a11y-panel .a11y-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px}' +
    '#dz-a11y-panel .a11y-reset{border:2px solid #1d4fa3;background:#fff;color:#1d4fa3;border-radius:10px;padding:8px 12px;font:700 .85rem Heebo,Arial,sans-serif;cursor:pointer}' +
    '#dz-a11y-panel a{color:#1d4fa3;font-weight:700;font-size:.88rem}' +
    '.dz-skip{position:fixed;top:-60px;right:12px;z-index:1001;background:#1d4fa3;color:#fff;padding:10px 16px;border-radius:8px;font-weight:700;text-decoration:none}' +
    '.dz-skip:focus{top:12px}' +
    'html.a11y-contrast body{background:#000 !important;color:#fff !important}' +
    'html.a11y-contrast body *:not(#dz-a11y-panel):not(#dz-a11y-panel *):not(#dz-a11y-btn):not(#dz-a11y-btn *){background-image:none !important;text-shadow:none !important;box-shadow:none !important}' +
    'html.a11y-contrast section, html.a11y-contrast .nav-in, html.a11y-contrast footer, html.a11y-contrast .svc, html.a11y-contrast .exp, html.a11y-contrast .proj, html.a11y-contrast .tech-item, html.a11y-contrast .val, html.a11y-contrast .stat, html.a11y-contrast .test-card, html.a11y-contrast .con-form, html.a11y-contrast .exp-why{background:#000 !important;border-color:#fff !important}' +
    'html.a11y-contrast p, html.a11y-contrast h1, html.a11y-contrast h2, html.a11y-contrast h3, html.a11y-contrast span, html.a11y-contrast li, html.a11y-contrast div, html.a11y-contrast label{color:#fff !important;-webkit-text-fill-color:#fff !important}' +
    'html.a11y-contrast a, html.a11y-contrast a *{color:#ffeb3b !important;-webkit-text-fill-color:#ffeb3b !important}' +
    'html.a11y-contrast .gear-wrap{display:none !important}' +
    'html.a11y-contrast .btn-p, html.a11y-contrast .btn-s, html.a11y-contrast .nav-cta, html.a11y-contrast .proj-link, html.a11y-contrast .lang-toggle, html.a11y-contrast .btn-send, html.a11y-contrast .test-arrow, html.a11y-contrast input, html.a11y-contrast textarea{background:#000 !important;border:2px solid #ffeb3b !important;color:#ffeb3b !important}' +
    'html.a11y-gray body > *:not(#dz-a11y-panel):not(#dz-a11y-btn){filter:grayscale(1)}' +
    'html.a11y-links a{text-decoration:underline !important;text-underline-offset:3px;outline:1px dashed currentColor;outline-offset:2px}' +
    'html.a11y-font body, html.a11y-font body *:not(svg):not(svg *){font-family:Arial,"Segoe UI",sans-serif !important;letter-spacing:.01em !important}' +
    'html.a11y-motion *, html.a11y-motion *::before, html.a11y-motion *::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}';
  var st = document.createElement('style'); st.id = 'dz-a11y-style'; st.textContent = css; document.head.appendChild(st);

  var SV = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var icon = SV('<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>');
  var IC = {
    bigger: SV('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>'),
    smaller: SV('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>'),
    contrast: SV('<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>'),
    gray: SV('<path d="M12 2.7a9.3 9.3 0 1 0 0 18.6z"/><circle cx="12" cy="12" r="9.3"/>'),
    links: SV('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    font: SV('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'),
    motion: SV('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'),
    reset: SV('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>')
  };

  // Skip link to main content
  var main = document.querySelector('.hero') || document.querySelector('section');
  if (main) {
    if (!main.id) main.id = 'main-content';
    var skip = document.createElement('a');
    skip.className = 'dz-skip'; skip.href = '#' + main.id;
    skip.textContent = isEn() ? 'Skip to main content' : 'דילוג לתוכן הראשי';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  var btn = document.createElement('button');
  btn.id = 'dz-a11y-btn'; btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'dz-a11y-panel');
  btn.innerHTML = icon;

  var panel = document.createElement('div');
  panel.id = 'dz-a11y-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'dz-a11y-title');

  var TOGGLES = ['contrast', 'gray', 'links', 'font', 'motion'];
  function render() {
    btn.setAttribute('aria-label', t('title'));
    btn.title = t('title');
    var h = '<h2 id="dz-a11y-title">' + t('title') + '<button type="button" class="a11y-x" aria-label="' + t('close') + '">×</button></h2><div class="a11y-grid">' +
      '<button type="button" class="a11y-opt" data-act="bigger">' + IC.bigger + t('bigger') + '</button>' +
      '<button type="button" class="a11y-opt" data-act="smaller">' + IC.smaller + t('smaller') + '</button>';
    TOGGLES.forEach(function (k) { h += '<button type="button" class="a11y-opt" data-act="' + k + '" aria-pressed="' + (!!state[k]) + '">' + IC[k] + t(k) + '</button>'; });
    h += '</div><div class="a11y-foot"><button type="button" class="a11y-reset" data-act="reset">' + IC.reset.replace('<svg','<svg style="width:16px;height:16px;vertical-align:-3px;margin-inline-end:6px"') + t('reset') + '</button><a href="/accessibility.html">' + t('statement') + '</a></div>';
    panel.innerHTML = h;
  }
  function apply() {
    var root = document.documentElement;
    TOGGLES.forEach(function (k) { root.classList.toggle('a11y-' + k, !!state[k]); });
    var z = state.zoom || 0;
    document.body.style.zoom = z ? String(1 + z * 0.1) : '';
  }
  function open(v) {
    panel.hidden = !v; btn.setAttribute('aria-expanded', String(v));
    if (v) { render(); var f = panel.querySelector('.a11y-opt'); if (f) f.focus(); }
  }
  btn.addEventListener('click', function () { open(panel.hidden); });
  panel.addEventListener('click', function (e) { e.stopPropagation();
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('a11y-x')) { open(false); btn.focus(); return; }
    var a = b.getAttribute('data-act');
    if (a === 'bigger') state.zoom = Math.min((state.zoom || 0) + 1, 5);
    else if (a === 'smaller') state.zoom = Math.max((state.zoom || 0) - 1, -2);
    else if (a === 'reset') state = {};
    else if (TOGGLES.indexOf(a) > -1) state[a] = !state[a];
    save(); apply();
    var keep = a; render();
    var nb = panel.querySelector('[data-act="' + keep + '"]'); if (nb) nb.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) open(false);
  });

  render(); apply();
  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();
