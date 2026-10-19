(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mark loaded -> hero entrance + counters
  window.addEventListener('load', function () { document.body.classList.add('loaded'); });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(function(){ document.body.classList.add('loaded'); }, 60); });

  // progress bar + nav scrolled state
  var nav = document.getElementById('topnav'), prog = document.getElementById('progress');
  function onScroll() {
    var sc = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('scrolled', sc > 40);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(sc / h, 1) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  var burger = document.getElementById('burger'), menu = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open'); burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { menu.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
  });

  // active nav link
  var links = {}; menu.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var secObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
        if (links[e.target.id]) links[e.target.id].classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(function (s) { secObs.observe(s); });

  // reveal handled by the Motion layer below

  // animated counters
  function runCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var suf = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target.toFixed(dec) + suf; return; }
      var start = performance.now(), dur = 1500;
      function tick(now) {
        var t = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * e).toFixed(dec) + suf;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  var con = document.querySelector('.console');
  if (con) {
    var cObs = new IntersectionObserver(function (es, o) {
      es.forEach(function (e) { if (e.isIntersecting) { setTimeout(runCounters, 350); o.unobserve(e.target); } });
    }, { threshold: 0.3 });
    cObs.observe(con);
  }

  // typewriter role
  var roleEl = document.getElementById('role');
  if (roleEl) {
    var words = ['Data Analyst', 'App Developer', 'Data Science', 'Gaming Enthusiast', 'Data Engineer', 'Data Visualization', 'Assistant Purchasing', 'Business Intelligence'];
    if (reduce) { roleEl.textContent = words[0]; }
    else {
      var wi = 0, ci = 0, deleting = false;
      function type() {
        var w = words[wi];
        roleEl.textContent = w.slice(0, ci);
        if (!deleting) {
          if (ci < w.length) { ci++; setTimeout(type, 80); }
          else { deleting = true; setTimeout(type, 1500); }
        } else {
          if (ci > 0) { ci--; setTimeout(type, 40); }
          else { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 320); }
        }
      }
      setTimeout(type, 1200);
    }
  }

  // hero canvas: data network
  var c = document.getElementById('bg');
  if (c) {
    var ctx = c.getContext('2d'), DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], raf = null, visible = true;
    var cols = ['#2EE6C5', '#56A8FF', '#9B8CFF', '#F7B53B', '#FF6F91'];
    function resize() {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function init() {
      resize();
      var n = Math.max(26, Math.min(76, Math.round(W / 17)));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.5 + 0.7, col: cols[i % cols.length] });
      }
    }
    function render(move) {
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        if (move) { p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 128) {
            ctx.globalAlpha = (1 - d / 128) * 0.16; ctx.strokeStyle = p.col; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; ctx.globalAlpha = 0.85; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop() { render(true); raf = requestAnimationFrame(loop); }
    init();
    if (reduce) { render(false); }
    else { loop(); }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { init(); if (reduce) render(false); }, 180); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!reduce && !raf) { loop(); }
    });
  }

  // certificate lightbox
  var lb = document.getElementById('lightbox');
  function openLb() { lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  var fig = document.getElementById('certFig'), cbtn = document.getElementById('certBtn');
  if (fig) { fig.addEventListener('click', openLb);
    fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(); } }); }
  if (cbtn) cbtn.addEventListener('click', openLb);
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
})();
