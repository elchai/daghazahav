/* DAGHAZAHAV upgrade layer: additive only, no change to tracking, i18n or the CMS loader. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* scroll progress, nav hide on scroll down, back to top, active link */
  var bar = document.createElement('div'); bar.id = 'dz-progress'; document.body.appendChild(bar);
  var top = document.createElement('button');
  top.id = 'dz-top'; top.type = 'button'; top.textContent = '↑';
  top.setAttribute('aria-label', 'חזרה למעלה'); top.setAttribute('data-en-aria', 'Back to top');
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  document.body.appendChild(top);
  var nav = $('#nav'); var lastY = 0; var ticking = false;
  var links = $$('.nav-links a[href^="#"]').filter(function (a) { return a.getAttribute('href').length > 1; });
  var targets = links.map(function (a) { return $(a.getAttribute('href')); });

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    top.classList.toggle('show', y > 900);
    if (nav && !reduce) {
      var open = document.body.classList.contains('mob-open') || (nav.querySelector('[aria-expanded="true"]'));
      nav.classList.toggle('dz-hide', y > lastY + 6 && y > 700 && !open);
      if (y < lastY - 6) nav.classList.remove('dz-hide');
    }
    lastY = y;
    var mid = y + window.innerHeight * 0.4, active = -1;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= mid) active = i; });
    links.forEach(function (a, i) { a.classList.toggle('dz-active', i === active && !a.classList.contains('nav-cta')); });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* spotlight that follows the cursor + gentle 3D tilt on project cards */
  if (fine) {
    $$('.svc, .proj, .tech-item, .val').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (!reduce && el.classList.contains('proj')) {
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(1000px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-6px)';
        }
      });
      el.addEventListener('mouseleave', function () { if (el.classList.contains('proj')) el.style.transform = ''; });
    });
  }

  /* hero: cursor glow and slight parallax on the gears */
  var hero = $('#home');
  if (hero && fine && !reduce) {
    var glow = $('.hero-glow', hero), gears = $$('.gear-wrap', hero);
    hero.addEventListener('mousemove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      if (glow) glow.style.transform = 'translate(' + (x * 60) + 'px,' + (y * 40) + 'px)';
      gears.forEach(function (g, i) { var k = (i % 2 ? -1 : 1) * (14 + i * 6); g.style.transform = 'translate(' + (x * k) + 'px,' + (y * k) + 'px)'; });
    });
  }

  /* technologies strip, built from the real toolkit section, sliding left to right */
  var items = $$('#tech .tech-item');
  if (items.length && hero) {
    var chips = items.map(function (it) {
      var name = ($('.t-name', it) || {}).textContent, svg = $('.t-ico svg', it);
      if (!name) return null;
      var c = document.createElement('div'); c.className = 'dz-chip';
      if (svg) c.appendChild(svg.cloneNode(true));
      var s = document.createElement('span'); s.textContent = name.trim(); c.appendChild(s);
      return c;
    }).filter(Boolean);
    var strip = document.createElement('section'); strip.id = 'dz-strip'; strip.setAttribute('aria-hidden', 'true');
    var track = document.createElement('div'); track.className = 'dz-track';
    var reps = reduce ? 1 : 4;
    for (var r = 0; r < reps; r++) chips.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    strip.appendChild(track);
    hero.parentNode.insertBefore(strip, hero.nextSibling);
  }
})();
