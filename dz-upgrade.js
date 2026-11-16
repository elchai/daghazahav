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
  function bindSpot(el) {
    if (!fine) return;
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
  }
  $$('.svc, .proj, .tech-item, .val').forEach(bindSpot);

  /* systems carousel: one row that moves right to left, filter chips, arrows, pause, "show all".
     The markup stays a plain grid, so without this script every system is simply listed. */
  var grid = $('#projGrid'), filters = $('#dzFilters'), ctl = $('#dzCarCtl');
  if (grid && filters && ctl) (function () {
    var cards = $$('.proj', grid);
    var pauseBtn = $('.dz-car-pause', ctl), allBtn = $('.dz-car-all', ctl);
    var SPEED = 32, STEP_WAIT = 3.8, STEP_MS = 700, HOLD_MS = 5000;
    var cat = 'all', expanded = false, userPaused = false, hover = false, focusIn = false, touching = false;
    var inView = false, holdUntil = 0, looping = false, perView = 3, setW = 0, base = 0, step = 0;
    var x = 0, synced = false, last = 0, raf = 0, wait = 0, tween = null, endTimer = 0, lastW = window.innerWidth;

    // each card showed itself on scroll; inside a moving row that would leave blanks
    cards.forEach(function (c) { c.classList.remove('rev', 'd1', 'd2', 'd3'); });
    filters.hidden = false; ctl.hidden = false;
    if (reduce) ctl.classList.add('no-motion');

    function copy(card) {
      var n = card.cloneNode(true);
      n.classList.add('dz-clone'); n.setAttribute('aria-hidden', 'true'); n.style.transform = '';
      $$('a, button', n).forEach(function (a) { a.tabIndex = -1; });
      $$('.proj-link-form', n).forEach(function (a) {
        a.addEventListener('click', function () {
          var m = document.getElementById('fm');
          if (m && !m.value.trim()) m.value = 'אשמח לקבל פרטים על ' + a.dataset.sys;
        });
      });
      bindSpot(n);
      return n;
    }

    function build() {
      cancelAnimationFrame(raf); raf = 0; tween = null; wait = 0; synced = false;
      $$('.dz-clone', grid).forEach(function (n) { n.remove(); });
      grid.classList.toggle('dz-row', !expanded);
      grid.style.removeProperty('--dz-card-h');
      if (!expanded) {   // one height for every filter, so the page does not jump when a chip is pressed
        var tall = 0;
        cards.forEach(function (c) { c.hidden = false; tall = Math.max(tall, c.offsetHeight); });
        grid.style.setProperty('--dz-card-h', tall + 'px');
      }
      var shown = cards.filter(function (c) { var ok = cat === 'all' || c.dataset.cat === cat; c.hidden = !ok; return ok; });
      grid.classList.toggle('dz-filtered', cat !== 'all');
      grid.classList.remove('dz-static');
      ctl.classList.toggle('is-open', expanded);
      looping = false;
      if (!expanded && shown.length) {
        grid.scrollLeft = 0;
        looping = grid.scrollWidth > grid.clientWidth + 2;
        grid.classList.toggle('dz-static', !looping);
      }
      ctl.classList.toggle('is-static', !expanded && !looping);
      if (!looping) return;

      var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      var cw = shown[0].getBoundingClientRect().width;
      step = cw + gap; setW = shown.length * step;
      perView = Math.max(1, Math.round(grid.clientWidth / step));
      var before = document.createDocumentFragment(), after = document.createDocumentFragment();
      shown.forEach(function (c) { before.appendChild(copy(c)); after.appendChild(copy(c)); });
      grid.insertBefore(before, grid.firstChild); grid.appendChild(after);
      // three identical sets in a row; the view stays inside the middle one
      var rtl = getComputedStyle(grid).direction === 'rtl';
      base = rtl ? -2 * setW : setW;
      grid.scrollLeft = rtl ? -setW : setW;
      var d = offset(false);
      if (Math.abs(d) > 2) grid.scrollLeft += d;   // phones: the first card starts centred
      play();
    }

    function wrap(v) { return v >= base + setW ? v - setW : (v < base ? v + setW : v); }
    function moving() {
      return looping && inView && !reduce && !userPaused && !hover && !focusIn && !touching && performance.now() > holdUntil;
    }
    // distance to the next resting place: the card edge at the reading side (or the centre when one card fits)
    function offset(next) {
      var g = grid.getBoundingClientRect(), cs = getComputedStyle(grid), rtl = cs.direction === 'rtl';
      var one = perView === 1, best = null;
      var ref = one ? g.left + g.width / 2 : (rtl ? g.right - parseFloat(cs.paddingRight) : g.left + parseFloat(cs.paddingLeft));
      $$('.proj', grid).forEach(function (c) {
        if (c.hidden) return;
        var r = c.getBoundingClientRect();
        var d = (one ? r.left + r.width / 2 : (rtl ? r.right : r.left)) - ref;
        if (next ? d > 4 && (best === null || d < best) : (best === null || Math.abs(d) < Math.abs(best))) best = d;
      });
      return best || 0;
    }

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = Math.min(64, t - last) / 1000; last = t;
      if (!moving()) { synced = false; tween = null; wait = 0; return; }
      if (!synced) { x = wrap(grid.scrollLeft); synced = true; }
      if (perView > 1) x = wrap(x + SPEED * dt);          // wide screens: a slow steady drift
      else if (tween) {                                     // phones: one card at a time
        var p = Math.min(1, (t - tween.t0) / STEP_MS), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        x = tween.from + tween.dist * e;
        if (p === 1) { tween = null; wait = 0; x = wrap(x); }
      } else {
        wait += dt;
        if (wait >= STEP_WAIT) { x = wrap(x); tween = { t0: t, from: x, dist: offset(true) || step }; }
        return;
      }
      grid.scrollLeft = x;
    }
    function play() { if (!raf && looping && inView && !reduce) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; synced = false; tween = null; }
    function hold() { holdUntil = performance.now() + HOLD_MS; }

    // after the visitor scrolls by hand: jump back into the middle set, then rest on a card
    grid.addEventListener('scroll', function () {
      clearTimeout(endTimer);
      endTimer = setTimeout(function () {
        if (!looping || touching || moving()) return;
        var v = grid.scrollLeft, w = wrap(v);
        if (w !== v) grid.scrollLeft = w;
        var d = offset(false);
        if (Math.abs(d) > 2) grid.scrollBy({ left: d, behavior: reduce ? 'auto' : 'smooth' });
      }, 170);
    }, { passive: true });

    // a tap also fires mouseenter and never leaves, so only a real mouse counts as hover
    grid.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    grid.addEventListener('pointerleave', function () { hover = false; });
    grid.addEventListener('touchstart', function () { touching = true; hold(); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (ev) {
      grid.addEventListener(ev, function () { touching = false; hold(); }, { passive: true });
    });
    grid.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hold(); }, { passive: true });
    grid.addEventListener('focusin', function (e) { focusIn = !!(e.target.matches && e.target.matches(':focus-visible')); });
    grid.addEventListener('focusout', function () { focusIn = false; });

    $$('.dz-car-btn[data-dir]', ctl).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!looping) return;
        hold();
        grid.scrollBy({ left: Number(b.dataset.dir) * step, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
    });
    allBtn.addEventListener('click', function () {
      expanded = !expanded;
      allBtn.setAttribute('aria-expanded', String(expanded));
      build();
      if (!expanded) $('#projects').scrollIntoView({ block: 'start' });
    });
    $$('.dz-filter', filters).forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.dataset.cat;
        $$('.dz-filter', filters).forEach(function (o) {
          o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', String(o === b));
        });
        build();
      });
    });

    // run only while the row is on screen; load the pictures just before it gets there
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView) play(); else stop();
    }).observe(grid);
    var near = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      $$('img[loading="lazy"]', grid).forEach(function (im) { im.loading = 'eager'; });
      near.disconnect();
    }, { rootMargin: '700px 0px' });
    near.observe(grid);

    var rz = 0;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;   // phones fire resize when the address bar hides
      lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(build, 180);
    });
    // the language switch flips the page direction
    new MutationObserver(function () { build(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });

    build();
  })();

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
