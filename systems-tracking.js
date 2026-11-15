// Conversion tracking and lead capture for the product sites mirrored under
// daghazahav.com/<slug>/ (injected by scripts/sync-systems.mjs). Same GA4 property
// and Ads conversion actions as lead-tracking.js, so a campaign that lands on
// /yishuvon/ is measured exactly like one that lands on the home page.
(function () {
  const destinations = ['G-4LJ0HYEW9L'];
  const ADS_LEAD = 'AW-1038551960/lKm_CN30uswaEJiXnO8D';     // "טופס עליון"
  const ADS_WHATSAPP = 'AW-1038551960/-Da-CLOW780aEJiXnO8D'; // "הרשמת וואטסאפ"
  const script = document.currentScript;
  const system = (script && script.dataset.system) || location.pathname.split('/')[1] || 'unknown';
  // Endpoints whose 2xx response means a real lead was stored (not just a click).
  const LEAD_ENDPOINTS = ['submitPilotRequest'];
  const realFetch = window.fetch;

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

  // ---- Lead capture -------------------------------------------------------
  // A WhatsApp button used to be the only way to reach us, so the visitor's number
  // was never known and nothing could be sent back. Now the button opens a short
  // form (name + phone) that posts to Make: alert to the leads group plus an
  // automatic WhatsApp to the visitor. "Write to me directly" keeps the old path.
  const HOOK = 'https://hook.eu1.make.com/4djji59ddryqc9f1t2rmtkfmr5c2mwa4';
  const NAMES = {
    yishuvon: 'ישובון', gadudon: 'גדודון', hafakon: 'הפקון', mosachun: 'מוסכון',
    kehilot: 'קהילה בבניין', iruchon: 'אירוחון', mifalon: 'מפעלון',
    mishmeron: 'משמרון', mitvachon: 'מטווחון', dfuson: 'דפוסון'
  };
  const systemName = NAMES[system] || system;
  const sent = new Set(); // in memory only: no names or phones in storage or analytics

  function localPhone(v) {
    let d = String(v || '').replace(/\D/g, '');
    if (d.indexOf('972') === 0) d = '0' + d.slice(3);
    return /^0\d{8,9}$/.test(d) ? d : '';
  }

  function sendLead(data) {
    const phone = localPhone(data.phone);
    if (!phone) return Promise.resolve(false);
    if (sent.has(phone)) return Promise.resolve(true);
    sent.add(phone);
    const body = JSON.stringify({
      name: String(data.name || '').trim().slice(0, 80), phone: phone,
      system: systemName, slug: system,
      details: String(data.details || '').slice(0, 600),
      source: data.source, reply: data.reply || 'yes', page: location.pathname
    });
    return realFetch.call(window, HOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true
    }).then((r) => { if (!r.ok) throw new Error('rejected'); return true; })
      .catch(() => { sent.delete(phone); return false; });
  }

  const WA_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg>';
  const CSS = '.dzl-back{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(6,13,28,.62);backdrop-filter:blur(4px);direction:rtl;font-family:Heebo,Assistant,Arial,sans-serif}'
    + '.dzl-card{width:100%;max-width:400px;max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;background:#fff;color:#0f1b33;border-radius:20px;padding:24px 22px 20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);position:relative;text-align:right;animation:dzl-in .22s ease-out}'
    + '@keyframes dzl-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
    + '@media (prefers-reduced-motion:reduce){.dzl-card{animation:none}}'
    + '.dzl-card h2{margin:0 0 6px;padding-left:40px;font-size:22px;line-height:1.3;font-weight:800;color:#0f1b33;text-wrap:balance}'
    + '.dzl-card p{margin:0 0 16px;font-size:15px;line-height:1.55;color:#4a5670;text-wrap:balance}'
    + '.dzl-card label{display:block;margin:0 0 12px;font-size:14px;font-weight:600;color:#0f1b33}'
    + '.dzl-card input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px 14px;border:1px solid #cfd6e4;border-radius:12px;background:#fff;color:#0f1b33;font:inherit;font-size:16px;font-weight:400}'
    + '.dzl-card input:focus{outline:3px solid rgba(37,211,102,.35);border-color:#1fa855}'
    + '.dzl-go{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;margin-top:4px;padding:13px 16px;border:0;border-radius:12px;background:#17803f;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}'
    + '.dzl-go:hover{background:#126a33}.dzl-go[disabled]{opacity:.6;cursor:default}'
    + '.dzl-direct{display:block;margin-top:14px;text-align:center;font-size:14px;color:#1d4f9c;text-decoration:underline}'
    + '.dzl-x{position:absolute;top:10px;left:10px;width:36px;height:36px;border:0;border-radius:50%;background:#eef1f6;color:#0f1b33;font-size:20px;line-height:1;cursor:pointer}'
    + '.dzl-err{margin:0 0 10px;font-size:14px;color:#b3261e}'
    + '.dzl-err:empty{display:none}'
    + '.dzl-card input.dzl-hp{position:absolute;top:0;right:0;width:0;height:0;margin:0;padding:0;border:0;opacity:0;pointer-events:none}';

  let modal = null;
  let lastFocus = null;
  let captured = false; // after a form lead, the buttons go straight to WhatsApp again

  function closeModal() {
    if (!modal) return;
    modal.remove();
    modal = null;
    document.removeEventListener('keydown', onKey, true);
    try { if (lastFocus) lastFocus.focus(); } catch (_) { /* Element is gone. */ }
  }

  function onKey(e) {
    if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const items = modal.querySelectorAll('button, a[href], input:not([tabindex="-1"])');
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openModal(href) {
    if (modal) return;
    if (!document.getElementById('dzl-css')) {
      const st = document.createElement('style');
      st.id = 'dzl-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    lastFocus = document.activeElement;
    modal = document.createElement('div');
    modal.className = 'dzl-back';
    modal.innerHTML = '<div class="dzl-card" role="dialog" aria-modal="true" aria-labelledby="dzl-t">'
      + '<button type="button" class="dzl-x" aria-label="סגירה">×</button>'
      + '<div class="dzl-body">'
      + '<h2 id="dzl-t">נחזור אליכם בוואצאפ</h2>'
      + '<p>השאירו שם וטלפון ונשלח לכם מיד הודעה עם קישור לתיאום הדגמה של ' + systemName + '.</p>'
      + '<form novalidate>'
      + '<label>שם מלא<input name="name" autocomplete="name" required maxlength="80"></label>'
      + '<label>טלפון נייד<input name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" required maxlength="20"></label>'
      + '<input class="dzl-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'
      + '<div class="dzl-err" role="alert"></div>'
      + '<button type="submit" class="dzl-go">' + WA_ICON + '<span>שלחו לי הודעה בוואצאפ</span></button>'
      + '</form>'
      + '<a class="dzl-direct" target="_blank" rel="noopener">או כתבו לי ישירות בוואצאפ</a>'
      + '</div></div>';
    const form = modal.querySelector('form');
    const err = modal.querySelector('.dzl-err');
    const direct = modal.querySelector('.dzl-direct');
    direct.href = href;
    direct.addEventListener('click', () => { whatsapp('link'); setTimeout(closeModal, 50); });
    modal.querySelector('.dzl-x').addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const phone = localPhone(form.elements.phone.value);
      if (form.elements.website.value) { closeModal(); return; }
      if (!name) { err.textContent = 'נא למלא שם'; form.elements.name.focus(); return; }
      if (!phone) { err.textContent = 'מספר הטלפון לא תקין. בדקו שהוא מלא ומתחיל ב-05'; form.elements.phone.focus(); return; }
      err.textContent = '';
      const btn = form.querySelector('.dzl-go');
      btn.disabled = true;
      sendLead({ name: name, phone: phone, details: 'לחיצה על כפתור וואצאפ', source: 'טופס קצר' }).then((ok) => {
        if (!modal) return;
        if (!ok) {
          btn.disabled = false;
          err.textContent = 'לא הצלחנו לשלוח. נסו שוב או כתבו לי ישירות בוואצאפ';
          return;
        }
        captured = true;
        lead();
        const body = modal.querySelector('.dzl-body');
        body.innerHTML = '<h2 id="dzl-t" tabindex="-1"></h2>'
          + '<p>שלחנו לכם עכשיו הודעה בוואצאפ עם קישור לתיאום הדגמה. נדבר בקרוב.</p>'
          + '<button type="button" class="dzl-go">סגירה</button>';
        body.querySelector('h2').textContent = 'תודה ' + name.split(' ')[0] + '!';
        body.querySelector('.dzl-go').addEventListener('click', closeModal);
        body.querySelector('h2').focus();
      });
    });
    document.body.appendChild(modal);
    document.addEventListener('keydown', onKey, true);
    form.elements.name.focus();
  }

  // Plain links (hero buttons, floating button, footer).
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || !isWhatsApp(a.href)) return;
    if (a.classList.contains('dzl-direct')) return; // tracked by its own handler
    if (captured || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { whatsapp('link'); return; }
    e.preventDefault();
    e.stopPropagation();
    openModal(a.href);
  }, true);

  // The join forms open WhatsApp with the filled-in details via window.open.
  // The details hold the visitor's name and phone, so the same lead goes to Make.
  const open = window.open;
  window.open = function (url) {
    if (isWhatsApp(url)) {
      whatsapp('form');
      try {
        const text = new URL(String(url)).searchParams.get('text') || '';
        const phone = (text.match(/טלפון:\s*([^\n]+)/) || [])[1];
        const name = (text.match(/שם:\s*([^\n]+)/) || [])[1];
        if (phone && name) {
          captured = true;
          sendLead({ name: name, phone: phone, details: text.replace(/\n/g, ' | '), source: 'טופס הצטרפות' });
        }
      } catch (_) { /* Never block the visitor from reaching WhatsApp. */ }
    }
    return open.apply(this, arguments);
  };

  // Forms that post to a backend: count only a confirmed 2xx.
  if (realFetch) {
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const p = realFetch.apply(this, arguments);
      if (LEAD_ENDPOINTS.some((k) => url.indexOf(k) !== -1)) {
        p.then((r) => {
          if (!r || !r.ok) return;
          lead();
          // That backend sends its own follow-up to the visitor, so Make only alerts the group.
          try {
            const b = JSON.parse((init && init.body) || '{}');
            captured = true;
            sendLead({
              name: b.name, phone: b.phone, source: 'טופס פיילוט', reply: 'no',
              details: ['ישוב: ' + (b.settlement || ''), 'תפקיד: ' + (b.role || ''), 'משקי בית: ' + (b.households || '')].join(' | ')
            });
          } catch (_) { /* Body was not JSON: the backend still has the lead. */ }
        }, () => {});
      }
      return p;
    };
  }
})();
