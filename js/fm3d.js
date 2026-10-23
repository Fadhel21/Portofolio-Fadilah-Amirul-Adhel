/* ============================================================
   FM 3D — Framer-Motion-style 3D layer (uses the bundled Motion build)
   1. sections tilt into view with scroll-linked 3D rotation
   2. spinning glass cubes floating next to every section title
   3. deep 3D hover tilt (with layered depth) on tiles & cards
   4. object trail in the hero + click burst: 3D polaroids, stickers, tags and notes
   ============================================================ */
(function () {
  var M = window.Motion;
  if (!M || !M.animate) return;
  var animate = M.animate, inView = M.inView, scroll = M.scroll;
  var coarse = matchMedia('(pointer:coarse)').matches;
  var COLORS = ['#B98CFF', '#7C4DFF', '#FF4FD8', '#3FE0FF', '#FFD34F'];

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  /* ---------- 1. scroll-linked 3D section entrance ---------- */
  function sectionTilt() {
    if (!scroll) return;
    document.querySelectorAll('.section:not(.work)').forEach(function (sec) {
      var wrap = sec.querySelector('.wrap'); if (!wrap) return;
      wrap.style.transformOrigin = '50% 0%';
      try {
        scroll(animate(wrap, {
          transform: ['perspective(1400px) rotateX(14deg) translateY(70px) scale(.94)', 'perspective(1400px) rotateX(0deg) translateY(0px) scale(1)'],
          opacity: [.25, 1]
        }, { easing: 'linear' }), { target: sec, offset: ['start end', 'start 0.5'] });
      } catch (e) { /* older Motion build: skip */ }
    });
  }

  /* ---------- 2. spinning glass cubes ---------- */
  var FACES = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
  function makeCube(size, accent) {
    var wrap = document.createElement('div'); wrap.className = 'fm-cube'; wrap.setAttribute('aria-hidden', 'true');
    wrap.style.setProperty('--s', size + 'px'); wrap.style.setProperty('--c', accent);
    var inner = document.createElement('div'); inner.className = 'fm-cube__in';
    FACES.forEach(function (t) {
      var f = document.createElement('i'); f.style.transform = t + ' translateZ(' + size / 2 + 'px)'; inner.appendChild(f);
    });
    var core = document.createElement('b'); inner.appendChild(core);
    wrap.appendChild(inner); return { wrap: wrap, inner: inner };
  }
  function cubes() {
    document.querySelectorAll('.sec-head').forEach(function (head, i) {
      var accent = COLORS[i % COLORS.length];
      var c = makeCube(58, accent); head.classList.add('fm-has-cube'); head.appendChild(c.wrap);
      if (!inView) return;
      inView(c.wrap, function () {
        var spin = animate(c.inner, { rotateX: [-24, 336], rotateY: [0, 360] }, { duration: 15, repeat: Infinity, easing: 'linear' });
        var bob = animate(c.wrap, { y: [-10, 10] }, { duration: 3.4, repeat: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        return function () { spin.stop(); bob.stop(); };
      });
    });
  }

  /* ---------- 3. deep 3D hover tilt ---------- */
  function hoverTilt() {
    if (coarse) return;
    document.querySelectorAll('.tool, .edu-card, .cert').forEach(function (el) {
      var raf = null, rx = 0, ry = 0;
      function paint() { el.style.transform = 'perspective(700px) translateZ(14px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; raf = null; }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        ry = (((e.clientX - r.left) / r.width) - .5) * 16;
        rx = (.5 - ((e.clientY - r.top) / r.height)) * 16;
        if (!raf) raf = requestAnimationFrame(paint);
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        animate(el, { transform: 'perspective(700px) translateZ(0px) rotateX(0deg) rotateY(0deg)' }, { type: 'spring', stiffness: 260, damping: 18 })
          .finished.then(function () { el.style.transform = ''; });
      });
    });
  }

  /* ---------- 4. 3D object trail + click burst (polaroids, stickers, tags, notes) ---------- */
  var L = 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/';
  var PHOTOS = ['assets/img/profile.jpg', 'assets/img/projects/hris-2.jpg', 'assets/img/projects/crm-2.png', 'assets/img/projects/erp-2.jpg', 'assets/img/projects/pos-3.png', 'assets/img/projects/xl-1.png', 'assets/img/projects/pbi-1.png', 'assets/img/projects/fnb-1.png'];
  var LOGOS = ['claude-color', 'openai', 'gemini-color', 'n8n-color', 'huggingface-color', 'langchain-color', 'meta-color', 'deepseek-color', 'claudecode-color', 'ollama', 'cursor'];
  var TAGS = ['AI Developer', 'AI Automation', 'AI Engineer', 'Data Engineer', 'AI Data Analyst', 'Business Intelligence'];
  var NOTES = ['2026', 'n8n', 'RAG', 'LLM', 'MCP', 'AI'];
  var BADGE_BG = ['#8E8CF0', '#FF7AD9', '#52D6F4', '#FFD34F', '#A98BFF'];
  var STAR = (function () {
    var pts = [];
    for (var i = 0; i < 24; i++) { var r = i % 2 ? 41 : 50, a = i / 24 * Math.PI * 2; pts.push((50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%'); }
    return 'polygon(' + pts.join(',') + ')';
  })();
  var CODE_SVG = '<svg viewBox="0 0 100 100"><path d="M36 32 18 50l18 18M64 32l18 18-18 18M55 26 45 74" fill="none" stroke="#25235f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var live = [];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function box(cls, html) { var e = document.createElement('div'); e.className = cls; if (html) e.innerHTML = html; return e; }
  function img(src) { var i = document.createElement('img'); i.src = src; i.alt = ''; i.draggable = false; return i; }

  function makeObject() {
    var t = Math.random(), o;
    if (t < .30) { o = box('fxo fxo-polaroid'); o.appendChild(img(pick(PHOTOS))); }
    else if (t < .52) { o = box('fxo fxo-sticker'); o.appendChild(img(L + pick(LOGOS) + '.svg')); }
    else if (t < .72) {
      o = box('fxo fxo-badge'); o.style.clipPath = STAR; o.style.setProperty('--bg', pick(BADGE_BG));
      var k = Math.floor(Math.random() * 3);
      o.innerHTML = k === 0 ? CODE_SVG : '<span>' + (k === 1 ? 'AI' : '{ }') + '</span>';
    }
    else if (t < .88) { o = box('fxo fxo-tag'); o.textContent = pick(TAGS); }
    else { o = box('fxo fxo-note', '<i></i><span>' + pick(NOTES) + '</span>'); }
    return o;
  }
  function drop(o) { var i = live.indexOf(o); if (i > -1) live.splice(i, 1); if (o.parentNode) o.remove(); }
  function spawn(x, y, spread) {
    var o = makeObject(), rot = Math.random() * 52 - 26, rx = Math.random() * 30 - 15, ry = Math.random() * 30 - 15;
    function T(r, a, b, sc, y) { return 'perspective(520px) translateY(' + y + 'px) rotate(' + r + 'deg) rotateX(' + a + 'deg) rotateY(' + b + 'deg) scale(' + sc + ')'; }
    var dx = spread ? (Math.random() * 2 - 1) * spread : 0, dy = spread ? (Math.random() * 2 - 1) * spread * .7 : 0;
    o.style.left = x + dx + 'px'; o.style.top = y + dy + 'px';
    document.body.appendChild(o); live.push(o);
    animate(o, { transform: [T(rot - 40, 0, 0, .25, 26), T(rot, rx, ry, 1, 0)], opacity: [0, 1] }, { duration: .6, easing: [.34, 1.56, .64, 1] });
    setTimeout(function () {
      animate(o, { transform: [T(rot, rx, ry, 1, 0), T(rot + 14, rx, ry, .6, -30)], opacity: [1, 0] }, { duration: .5, easing: 'ease-in' }).finished.then(function () { drop(o); }, function () { drop(o); });
    }, 1500 + Math.random() * 900);
    while (live.length > 26) { live.shift().remove(); }
  }
  function ring(x, y) {
    var r = document.createElement('i'); r.className = 'fx fx-ring'; r.style.left = x - 40 + 'px'; r.style.top = y - 40 + 'px'; document.body.appendChild(r);
    animate(r, { transform: ['rotateX(68deg) scale(.15)', 'rotateX(68deg) scale(2.6)'], opacity: [.95, 0] }, { duration: .7, easing: [.2, .7, .3, 1] }).finished.then(function () { r.remove(); });
  }
  function trail() {
    if (coarse) return;
    PHOTOS.forEach(function (u) { var i = new Image(); i.src = u; });
    var lx = -999, ly = -999, hero = document.querySelector('.hero');
    addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!hero) return;
      var r = hero.getBoundingClientRect();
      if (e.clientY < 96 || e.clientY < r.top || e.clientY > r.bottom) return;
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 120) return;
      lx = e.clientX; ly = e.clientY; spawn(lx, ly, 0);
    }, { passive: true });
  }
  function clickBurst() {
    addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      ring(e.clientX, e.clientY);
      var n = e.target.closest('.btn,.proj-link,.pub-link,#toTop,.tag,.nav-links a,.foot-social a') ? 6 : 5;
      for (var i = 0; i < n; i++) spawn(e.clientX, e.clientY, 90);
    });
  }

  ready(function () { sectionTilt(); cubes(); hoverTilt(); trail(); clickBurst(); });
})();
