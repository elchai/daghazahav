const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('lead-tracking.js', 'utf8');
function setup(fetch) {
  const events = [], ads = [], alerts = [], calls = [], timers = [];
  const storage = new Map();
  const context = {
    window: { gtag: (...args) => args[1] === 'conversion' ? ads.push(args[2].send_to) : events.push(args), alert: value => alerts.push(value) },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) },
    FormData: class { constructor(form) { this.get = key => form.values[key]; } },
    AbortController,
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout() {},
    fetch: (...args) => { calls.push(args); return fetch(...args); }
  };
  vm.runInNewContext(code, context);
  const button = { disabled: false };
  const form = { values: { name: 'Test', phone: '0500000000' }, reportValidity: () => true, querySelector: () => button, querySelectorAll: () => [button] };
  return { ...context.window, context, events, ads, alerts, calls, timers, form, button };
}
test('both channels accepted: one success event, no manual form_submit or Ads guess', async () => {
  const s = setup(async () => ({ok:true}));
  assert.equal(await s.submitLead(s.form,'contact','hello'),true);
  assert.equal(s.calls.length,2);
  assert.equal(s.events.length,1);
  assert.equal(s.events[0][1],'generate_lead');
  assert.deepEqual(Array.from(s.events[0][2].send_to),['G-4LJ0HYEW9L']);
  assert.equal(JSON.stringify(s.events).includes('0500000000'),false);
  assert.deepEqual(s.ads,['AW-1038551960/lKm_CN30uswaEJiXnO8D']);
  assert.equal(await s.submitLead(s.form,'contact','hello'),false);
  assert.equal(s.calls.length,2);
});
test('double submit and editing during flight cannot send another request', async () => {
  let resolve;
  const s = setup(() => new Promise(r => { resolve = r; }));
  const first = s.submitLead(s.form,'popup','hello');
  assert.equal(s.button.disabled,true);
  assert.equal(s.events.length,0);
  s.form.values.phone='0500000001';
  assert.equal(await s.submitLead(s.form,'popup','hello'),false);
  assert.equal(s.calls.length,2);
  resolve({ok:true});
  assert.equal(await first,true);
  assert.equal(s.button.disabled,false);
});
test('HTTP failures and network errors do not count; retry can succeed', async () => {
  let fail=true;
  const s=setup(async url => {
    if (!fail) return {ok:true};
    if (url.includes('make.com')) throw Error('offline');
    return {ok:false};
  });
  assert.equal(await s.submitLead(s.form,'contact','hello'),false);
  assert.equal(s.events.length,0);
  assert.equal(s.alerts.length,1);
  assert.equal(s.button.disabled,false);
  fail=false;
  assert.equal(await s.submitLead(s.form,'contact','hello'),true);
  assert.equal(s.events.length,1);
});
test('one successful channel is sufficient', async () => {
  const s=setup(async url => ({ok:url.includes('make.com')}));
  assert.equal(await s.submitLead(s.form,'popup','hello'),true);
  assert.equal(s.events.length,1);
});
test('invalid, whitespace and honeypot submissions never send', async () => {
  const s=setup(async () => ({ok:true}));
  s.form.reportValidity=()=>false;
  await s.submitLead(s.form,'contact','');
  s.form.reportValidity=()=>true;
  s.form.values.name='  ';
  await s.submitLead(s.form,'contact','');
  s.form.values.name='Test'; s.form.values._gotcha='bot';
  await s.submitLead(s.form,'contact','');
  assert.equal(s.calls.length,0);
});
test('WhatsApp counts once across placements and reload; form followup does not count', () => {
  const s=setup(async () => ({ok:true}));
  s.trackWhatsApp('form_followup');
  assert.equal(s.events.length,0);
  for (const source of ['contact','fab','popup','fab']) s.trackWhatsApp(source);
  assert.equal(s.events.length,1);
  assert.deepEqual(s.ads,['AW-1038551960/-Da-CLOW780aEJiXnO8D']);
  vm.runInNewContext(code,s.context);
  s.context.window.trackWhatsApp('fab');
  assert.equal(s.events.length,1);
});
test('tracking and storage failures never block a lead or WhatsApp', async () => {
  const s=setup(async () => ({ok:true}));
  s.context.window.gtag=()=>{throw Error('blocked');};
  s.context.sessionStorage.getItem=()=>{throw Error('blocked');};
  s.context.sessionStorage.setItem=()=>{throw Error('blocked');};
  assert.doesNotThrow(()=>s.trackWhatsApp('fab'));
  assert.equal(await s.submitLead(s.form,'popup','hello'),true);
});
test('hung delivery times out, restores retry and never reports success', async () => {
  const s=setup((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')))));
  const result=s.submitLead(s.form,'contact','hello');
  s.timers.forEach(fn=>fn());
  assert.equal(await result,false);
  assert.equal(s.button.disabled,false);
  assert.equal(s.events.length,0);
  assert.equal(s.ads.length,0);
});
test('HTML scripts parse and all lead UI entry points use the shared handler', () => {
  const html=fs.readFileSync('index.html','utf8');
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  assert.equal((html.match(/src="lead-tracking.js"/g)||[]).length,1);
  for (const source of ['contact','fab','popup','form_followup']) assert.ok(html.includes(`trackWhatsApp('${source}')`));
  assert.ok(html.includes("await submitLead(form, 'contact', msg)"));
  assert.ok(html.includes("await submitLead(form, zoom ? 'zoom' : 'popup', message)"));
  assert.equal(/gtag\('event','form_submit'/.test(html),false);
  // A click is not a lead: no Lead pixel left on any link, and Zoom asks for details first.
  assert.equal(/onclick="[^"]*fbq\('track','Lead'\)/.test(html),false);
  assert.ok(html.includes('onclick="openZoomLead(event)"'));
});
test('opening the booking page after a lead is analytics only', () => {
  const s=setup(async () => ({ok:true}));
  s.trackZoomBooking();
  assert.equal(s.events.length,1);
  assert.equal(s.events[0][1],'cta_zoom_click');
  assert.equal(s.ads.length,0);
});
test('every submit button is locked while a lead is in flight', async () => {
  let resolve;
  const s=setup(() => new Promise(r => { resolve = r; }));
  const second={disabled:false};
  s.form.querySelectorAll=()=>[s.button,second];
  const pending=s.submitLead(s.form,'zoom','hello');
  assert.equal(s.button.disabled,true);
  assert.equal(second.disabled,true);
  resolve({ok:true});
  assert.equal(await pending,true);
  assert.equal(second.disabled,false);
});
