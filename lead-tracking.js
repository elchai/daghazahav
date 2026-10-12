// GA4 destinations plus the two existing Google Ads conversion actions.
// Labels read from the Ads account (398-401-4972) on 2026-10-12; they were
// previously wired only through GTM-T9KXQQJG, which this site never loaded.
(function () {
  const destinations = ['G-4LJ0HYEW9L']; // GA4 "אתר דג הזהב"; G-6V03YRSZE7 belongs to the consulting site
  const ADS_LEAD = 'AW-1038551960/lKm_CN30uswaEJiXnO8D';     // "טופס עליון"
  const ADS_WHATSAPP = 'AW-1038551960/-Da-CLOW780aEJiXnO8D'; // "הרשמת וואטסאפ"
  const accepted = new Set();
  const pending = new Set();
  const pendingForms = new WeakSet();
  let whatsappTracked = false;

  function event(name, source) {
    try {
      if (window.gtag) window.gtag('event', name, {
        send_to: destinations, source: source, transport_type: 'beacon'
      });
    } catch (_) { /* Tracking must never interrupt contact. */ }
  }

  function adsConversion(sendTo) {
    try {
      if (window.gtag) window.gtag('event', 'conversion', { send_to: sendTo, transport_type: 'beacon' });
    } catch (_) { /* Tracking must never interrupt contact. */ }
  }

  window.trackWhatsApp = function (source) {
    // The success-modal link continues an already recorded form lead.
    if (source === 'form_followup') return;
    try { whatsappTracked = whatsappTracked || sessionStorage.getItem('dz_whatsapp_click') === '1'; } catch (_) {}
    if (whatsappTracked) return;
    whatsappTracked = true;
    try { sessionStorage.setItem('dz_whatsapp_click', '1'); } catch (_) {}
    event('cta_whatsapp_click', source);
    adsConversion(ADS_WHATSAPP);
    try { if (window.fbq) window.fbq('track', 'Lead'); } catch (_) {}
  };

  // Opening the booking page after the lead is already counted: analytics only, not a lead.
  window.trackZoomBooking = function () { event('cta_zoom_click', 'after_lead'); };

  async function post(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error('Lead endpoint rejected request');
    } finally { clearTimeout(timer); }
  }

  window.submitLead = async function (form, source, message) {
    if (pendingForms.has(form)) return false;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    if (!form.reportValidity() || !name || !phone || data.get('_gotcha')) return false;
    // In-memory only: do not put names/phones in analytics or browser storage.
    const key = JSON.stringify([name, phone, message.trim()]);
    if (pending.has(key) || accepted.has(key)) return false;
    pending.add(key);
    pendingForms.add(form);
    const buttons = Array.from(form.querySelectorAll('[type="submit"]'));
    buttons.forEach(b => { b.disabled = true; });
    try {
      // Either existing delivery channel accepting the lead is sufficient.
      await Promise.any([
        post('https://formspree.io/f/xykvglpz', {
          method: 'POST', headers: { Accept: 'application/json' }, body: data
        }),
        post('https://hook.eu1.make.com/ntxl6uxnyqka3rb7qos0rd4epetufha7', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message, source: source === 'contact' ? 'contact-form' : source })
        })
      ]);
      accepted.add(key);
      event('generate_lead', source);
      adsConversion(ADS_LEAD);
      try { if (window.fbq) window.fbq('track', 'Lead'); } catch (_) {}
      return true;
    } catch (_) {
      window.alert((window.__dzLang || 'he') === 'en'
        ? 'We could not confirm delivery. Please retry or contact us on WhatsApp.'
        : 'לא הצלחנו לאשר שהפנייה התקבלה. נסו שוב או פנו אלינו בוואטסאפ.');
      return false;
    } finally {
      pending.delete(key);
      pendingForms.delete(form);
      buttons.forEach(b => { b.disabled = false; });
    }
  };
})();
