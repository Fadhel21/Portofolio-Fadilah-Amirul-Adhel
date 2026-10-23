/* ============================================================
   MOTION LAYER — Motion (Framer Motion's engine, vanilla build)
   Graceful fallback to IntersectionObserver if the CDN is blocked.
   ============================================================ */
(function () {
  var reduce = false; /* animations stay on even if the OS asks for reduced motion */
  var EO = [0.23, 1, 0.32, 1];          // ease-out-quint (entering)
  var EIO = [0.645, 0.045, 0.355, 1];   // ease-in-out-cubic (moving)

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- 1. reveal: stagger groups + singles ---------- */
  function show(el) { el.classList.remove('m-hide'); el.style.opacity = ''; el.style.transform = ''; }

  function revealFallback() {
    var io = new IntersectionObserver(function (es, o) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var kids = e.target.matches('.stagger') ? e.target.querySelectorAll('.m-hide') : [e.target];
        Array.prototype.forEach.call(kids, function (k, i) {
          setTimeout(function () {
            k.animate(
              [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
              { duration: 620, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'both' }
            );
            show(k);
          }, Math.min(i, 9) * 70);
        });
        o.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.stagger').forEach(function (s) { io.observe(s); });
    document.querySelectorAll('.m-hide').forEach(function (el) { if (!el.closest('.stagger')) io.observe(el); });
  }

  function revealMotion(M) {
    var animate = M.animate, inView = M.inView, stagger = M.stagger;

    document.querySelectorAll('.stagger').forEach(function (group) {
      var kids = group.querySelectorAll('.m-hide');
      if (!kids.length) return;
      inView(group, function () {
        animate(
          kids,
          { opacity: [0, 1, .5, 1], transform: ['translateY(34px) scale(.93)', 'translateY(-4px) scale(1.01)', 'none', 'none'], filter: ['blur(8px) brightness(1.9)', 'blur(0px) brightness(1.2)', 'blur(0px) brightness(1)', 'blur(0px) brightness(1)'] },
          { duration: 0.75, delay: stagger(0.08, { start: 0.02 }), easing: [0.34, 1.56, 0.64, 1] }
        );
        Array.prototype.forEach.call(kids, show);
      }, { margin: '0px 0px -10% 0px', amount: 0.15 });
    });

    document.querySelectorAll('.m-hide').forEach(function (el) {
      if (el.closest('.stagger')) return;
      inView(el, function () {
        animate(el, { opacity: [0, 1, .5, 1], transform: ['translateY(28px) scale(.96)', 'translateY(-3px)', 'none', 'none'], filter: ['blur(6px) brightness(1.7)', 'blur(0px) brightness(1.15)', 'none', 'none'] },
          { duration: 0.7, easing: [0.34, 1.56, 0.64, 1] });
        show(el);
      }, { margin: '0px 0px -8% 0px', amount: 0.15 });
    });

    /* section titles: underline sweep */
    document.querySelectorAll('.sec-title').forEach(function (t) {
      inView(t, function () { t.classList.add('lit'); }, { amount: 0.6 });
    });

    /* hero parallax — console drifts slower than the page */
    var con = document.querySelector('.console'), hero = document.querySelector('.hero');
    var cue = document.querySelector('.mouse');
    if (con && hero && M.scroll) {
      try {
        M.scroll(function (info) {
          var p = info.y.progress;
          con.style.transform = 'translateY(' + (-46 * p).toFixed(1) + 'px)';
          con.style.opacity = (1 - .45 * p).toFixed(3);
        }, { target: hero, offset: ['start start', 'end start'] });
        if (cue) M.scroll(function (info) { cue.style.opacity = (1 - Math.min(1, info.y.progress / .35)).toFixed(3); },
          { target: hero, offset: ['start start', 'end start'] });
      } catch (e) { /* parallax is decoration only */ }
    }
  }

  /* ---------- 2. pointer micro-interactions ---------- */
  function pointerFX(M) {
    if (reduce || window.matchMedia('(pointer:coarse)').matches) return;
    var animate = M && M.animate;

    /* spotlight follows cursor on cards + tool tiles */
    document.querySelectorAll('.proj-card,.pub-card,.tool').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      }, { passive: true });
    });

    /* subtle 3D tilt on feature cards */
    document.querySelectorAll('.proj-card,.pub-card').forEach(function (el) {
      var raf = null, tx = 0, ty = 0;
      function paint() {
        el.style.transform = 'perspective(900px) translateY(-8px) rotateX(' + ty + 'deg) rotateY(' + tx + 'deg)';
        raf = null;
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (((e.clientX - r.left) / r.width) - .5) * 5.5;
        ty = (.5 - ((e.clientY - r.top) / r.height)) * 5.5;
        if (!raf) raf = requestAnimationFrame(paint);
      }, { passive: true });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* magnetic primary buttons */
    document.querySelectorAll('.btn-primary, #toTop').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22;
        var y = (e.clientY - r.top - r.height / 2) * .28;
        b.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
      }, { passive: true });
      b.addEventListener('pointerleave', function () {
        if (animate) animate(b, { translate: '0px 0px' }, { type: 'spring', stiffness: 320, damping: 22 });
        else b.style.translate = '';
      });
    });
  }

  /* ---------- 3. nav pill (shared-layout indicator) ---------- */
  function navPill(M) {
    var list = document.getElementById('navLinks');
    if (!list || window.matchMedia('(max-width:860px)').matches) return;
    var pill = document.createElement('span');
    pill.id = 'navPill'; list.appendChild(pill);

    function move(a, instant) {
      if (!a) { pill.style.opacity = 0; return; }
      var r = a.getBoundingClientRect(), lr = list.getBoundingClientRect();
      var to = { left: (r.left - lr.left) + 'px', top: (r.top - lr.top) + 'px', width: r.width + 'px', height: r.height + 'px', opacity: 1 };
      if (M && M.animate && !instant && !reduce) M.animate(pill, to, { duration: .34, easing: EIO });
      else Object.assign(pill.style, to);
    }
    var current = function () { return list.querySelector('a.active'); };
    list.addEventListener('pointerover', function (e) { var a = e.target.closest('a'); if (a) move(a); });
    list.addEventListener('pointerleave', function () { move(current()); });
    new MutationObserver(function () { if (!list.matches(':hover')) move(current()); })
      .observe(list, { subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', function () { move(current(), true); }, { passive: true });
    setTimeout(function () { move(current(), true); }, 400);
  }

  /* ---------- 4. back to top ---------- */
  function toTop() {
    var b = document.getElementById('toTop');
    if (!b) return;
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    window.addEventListener('scroll', function () {
      b.classList.toggle('on', window.scrollY > window.innerHeight * .9);
    }, { passive: true });
  }

  /* ---------- 5. images fade in when decoded ---------- */
  function imgFade() {
    document.querySelectorAll('img[data-fade]').forEach(function (im) {
      if (im.complete) im.classList.add('ok');
      else im.addEventListener('load', function () { im.classList.add('ok'); }, { once: true });
      im.addEventListener('error', function () { im.classList.add('ok'); im.style.opacity = .35; }, { once: true });
    });
  }

  /* ---------- boot ---------- */
  ready(function () {
    imgFade(); toTop();
    var M = window.Motion;
    if (reduce) { document.querySelectorAll('.m-hide').forEach(show); navPill(M); return; }
    if (M && M.animate && M.inView) { revealMotion(M); pointerFX(M); navPill(M); }
    else { revealFallback(); pointerFX(null); navPill(null); }
  });
})();
