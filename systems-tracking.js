// Conversion tracking for the product sites mirrored under daghazahav.com/<slug>/
// (injected by scripts/sync-systems.mjs). Same GA4 property and Ads conversion
// actions as lead-tracking.js, so a campaign that lands on /yishuvon/ is measured
// exactly like one that lands on the home page.
(function () {
  const destinations = ['G-4LJ0HYEW9L'];
  const ADS_LEAD = 'AW-1038551960/lKm_CN30uswaEJiXnO8D';     // "טופס עליון"
  const ADS_WHATSAPP = 'AW-1038551960/-Da-CLOW780aEJiXnO8D'; // "הרשמת וואטסאפ"
  const script = document.currentScript;
  const system = (script && script.dataset.system) || location.pathname.split('/')[1] || 'unknown';
  // Endpoints whose 2xx response means a real lead was stored (not just a click).
  const LEAD_ENDPOINTS = ['submitPilotRequest'];

  function send(name, params) {
    try {
      if (window.gtag) window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, params));
    } catch (_) { /* Tracking must never interrupt contact. */ }
  }

  function once(key) {
    try {
      if (sessionStorage.getItem(key) === '1') return false;
      sessionStorage.setItem(key, '1');
    } catch (_) { /* Storage blocked: count anyway. */ }
    return true;
  }

  function whatsapp(source) {
    if (!once('dz_whatsapp_click')) return;
    send('cta_whatsapp_click', { send_to: destinations, source: source, system: system });
    send('conversion', { send_to: ADS_WHATSAPP });
  }

  function lead() {
    send('generate_lead', { send_to: destinations, source: 'system_form', system: system });
    send('conversion', { send_to: ADS_LEAD });
  }

  const isWhatsApp = (url) => /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//.test(String(url || ''));

  // Plain links (hero buttons, floating button, footer).
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (a && isWhatsApp(a.href)) whatsapp('link');
  }, true);

  // The join forms open WhatsApp with the filled-in details via window.open.
  const open = window.open;
  window.open = function (url) {
    if (isWhatsApp(url)) whatsapp('form');
    return open.apply(this, arguments);
  };

  // Forms that post to a backend: count only a confirmed 2xx.
  const realFetch = window.fetch;
  if (realFetch) {
    window.fetch = function (input) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const p = realFetch.apply(this, arguments);
      if (LEAD_ENDPOINTS.some((k) => url.indexOf(k) !== -1)) {
        p.then((r) => { if (r && r.ok) lead(); }, () => {});
      }
      return p;
    };
  }
})();
