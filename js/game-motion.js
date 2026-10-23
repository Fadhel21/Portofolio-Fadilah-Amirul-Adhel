/* ============================================================
   DEV x GAMING MOTION — Motion (Framer Motion engine, vanilla)
   boot-in reveals, HUD chips, XP/level bar, click-burst loot
   ============================================================ */
(function () {
  var reduce = false; /* animations stay on even if the OS asks for reduced motion */
  var coarse = matchMedia('(pointer:coarse)').matches;
  var POP = [0.34, 1.56, 0.64, 1];       // back-out: overshoot "pop"
  var EO  = [0.23, 1, 0.32, 1];
  var GLYPHS = ['</>', '{ }', 'AI', '01', '10', 'LLM', 'RAG', '#', '[ ]', 'fn()', 'SQL', '>_', 'n8n', '✦'];
  var COLORS = ['#B98CFF', '#7C4DFF', '#FF4FD8', '#3FE0FF', '#FFD34F'];

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function M(){ return window.Motion; }
  function anim(el, kf, opt){
    var m = M();
    if (m && m.animate) return m.animate(el, kf, opt);
    var frames = [], keys = Object.keys(kf), n = kf[keys[0]].length, i, k;
    for (i = 0; i < n; i++){ var f = {}; for (k = 0; k < keys.length; k++) f[keys[k]] = kf[keys[k]][i]; frames.push(f); }
    var a = el.animate(frames, { duration: (opt.duration || .5) * 1000, delay: (opt.delay || 0) * 1000, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'both' });
    return a;
  }

  /* ---------- 1. boot-in reveal (replaces plain fade-up) ---------- */
  function bootReveal(){
    if (reduce) return;
    var m = M(); if (!m || !m.animate || !m.inView) return;
    // section title: "type-on" scan reveal
    document.querySelectorAll('.sec-title').forEach(function (t) {
      m.inView(t, function () {
        anim(t, { clipPath: ['inset(-12px 100% -24px -12px)', 'inset(-12px -12px -24px -12px)'] }, { duration: .7, easing: EO });
      }, { amount: .6 });
    });
  }

  /* ---------- 2. HUD chips: spawn in after the loader, parallax with cursor ---------- */
  function hudChips(){
    var chips = [].slice.call(document.querySelectorAll('.chip'));
    if (!chips.length) return;
    function show(){
      chips.forEach(function (c, i) {
        if (reduce) { c.style.opacity = 1; return; }
        var a = anim(c, { opacity: [0, 1], transform: ['scale(.2) translateY(30px)', 'scale(1) translateY(0px)'] },
          { duration: .7, delay: .12 * i, easing: POP });
        if (a && a.finished) a.finished.then(function(){ c.style.opacity = 1; }); else c.style.opacity = 1;
        setTimeout(function(){ c.style.opacity = 1; }, 900 + 120 * i);
      });
    }
    var tries = 0, iv = setInterval(function () {
      if (!document.getElementById('loader') || ++tries > 80) { clearInterval(iv); show(); }
    }, 150);
    chips.forEach(function (c, i) { c.setAttribute('data-par', [.5, .9, .6, 1, .7, .45][i % 6]); });
  }

  /* ---------- 3. XP / level HUD driven by scroll ---------- */
  function xpHud(){
    var box = document.getElementById('xp'); if (!box) return;
    var lvl = document.getElementById('xpLvl'), fill = document.getElementById('xpFill'), pct = document.getElementById('xpPct');
    var cur = 1, last = -1;
    function upd(){
      var h = document.documentElement.scrollHeight - innerHeight;
      var p = h > 0 ? Math.min(Math.max(scrollY / h, 0), 1) : 0;
      var L = Math.min(10, Math.floor(p * 10) + 1);
      var v = Math.round(p * 100);
      if (v === last) return; last = v;
      fill.style.width = v + '%'; pct.textContent = v + '%';
      lvl.textContent = 'LVL ' + ('0' + L).slice(-2);
      box.classList.toggle('on', scrollY > 120);
      if (L > cur && !reduce) {
        box.classList.remove('up'); void box.offsetWidth; box.classList.add('up');
        var r = box.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 14);
      }
      cur = L;
    }
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- 4. click burst (pixel loot) ---------- */
  function burst(x, y, n){
    if (reduce) return;
    n = n || 10;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i'); p.className = 'fx';
      var col = COLORS[i % COLORS.length];
      p.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      p.style.fontSize = (12 + Math.random() * 8) + 'px'; p.style.color = col; p.style.textShadow = '0 0 10px ' + col;
      document.body.appendChild(p);
      var ang = (Math.PI * 2 * i) / n + Math.random() * .6, dist = 40 + Math.random() * 70;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 24;
      p.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) scale(1) rotate(180deg)', opacity: 1, offset: .55 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 46) + 'px) scale(.2) rotate(320deg)', opacity: 0 }
      ], { duration: 720 + Math.random() * 260, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' })
        .onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  function clickBurst(){
    addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      burst(e.clientX, e.clientY, e.target.closest('.btn,.proj-link,.pub-link,#toTop,.tag,.nav-links a,.foot-social a') ? 14 : 9);
    });
  }

  /* ---------- 5. hero: scene "tilt" via spring on the HUD + glitch keystroke ---------- */
  function konami(){
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'], pos = 0;
    addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        document.documentElement.classList.toggle('god');
        burst(innerWidth / 2, innerHeight / 2, 28);
      }
    });
  }

  ready(function () {
    bootReveal(); hudChips(); xpHud(); konami();
  });
})();
