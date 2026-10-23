/* ============================================================
   FM 3D — Framer-Motion-style 3D layer (uses the bundled Motion build)
   1. sections tilt into view with scroll-linked 3D rotation
   2. spinning glass cubes floating next to every section title
   3. deep 3D hover tilt (with layered depth) on tiles & cards
   4. click burst: spinning 3D shards + a tilted shockwave ring
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

  /* ---------- 4. 3D click burst ---------- */
  function burst3d(x, y, n) {
    var ring = document.createElement('i'); ring.className = 'fx fx-ring';
    ring.style.left = x - 40 + 'px'; ring.style.top = y - 40 + 'px'; document.body.appendChild(ring);
    animate(ring, { transform: ['rotateX(68deg) scale(.15)', 'rotateX(68deg) scale(2.6)'], opacity: [.95, 0] }, { duration: .7, easing: [.2, .7, .3, 1] })
      .finished.then(function () { ring.remove(); });
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i'); p.className = 'fx fx-shard';
      var col = COLORS[i % COLORS.length], s = 9 + Math.random() * 9;
      p.style.width = p.style.height = s + 'px'; p.style.left = x - s / 2 + 'px'; p.style.top = y - s / 2 + 'px';
      p.style.background = 'linear-gradient(135deg,#fff8,' + col + ' 45%,' + col + 'aa)'; p.style.boxShadow = '0 0 14px ' + col;
      p.style.borderRadius = Math.random() > .5 ? '3px' : '50%';
      document.body.appendChild(p);
      var a = (Math.PI * 2 * i) / n + Math.random() * .6, d = 50 + Math.random() * 90;
      var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 26;
      var spin = (Math.random() > .5 ? 1 : -1) * (540 + Math.random() * 540);
      animate(p, {
        transform: [
          'translate(0px,0px) perspective(300px) rotateX(0deg) rotateY(0deg) scale(1)',
          'translate(' + dx + 'px,' + dy + 'px) perspective(300px) rotateX(' + spin + 'deg) rotateY(' + spin * .7 + 'deg) scale(1)',
          'translate(' + dx + 'px,' + (dy + 50) + 'px) perspective(300px) rotateX(' + spin * 1.5 + 'deg) rotateY(' + spin + 'deg) scale(.2)'
        ],
        opacity: [1, 1, 0]
      }, { duration: .8 + Math.random() * .35, easing: [.2, .7, .3, 1], offset: [0, .55, 1] })
        .finished.then((function (el) { return function () { el.remove(); }; })(p));
    }
  }
  function clickBurst() {
    addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      burst3d(e.clientX, e.clientY, e.target.closest('.btn,.proj-link,.pub-link,#toTop,.tag,.nav-links a,.foot-social a') ? 14 : 10);
    });
  }

  ready(function () { sectionTilt(); cubes(); hoverTilt(); clickBurst(); });
})();
