/* ============ merged patterns: loader, work rail, clock, trail ============ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* loader progress is driven by the frame preloader */


  /* ---- horizontal work rail ---- */
  (function () {
    var sec = document.getElementById('projects');
    if (!sec) return;
    var wrap = sec.querySelector('.wrap'), track = document.getElementById('workTrack'),
        cur = document.getElementById('workCur'), bar = document.getElementById('workBar');
    if (!wrap || !track) return;
    wrap.classList.add('work__sticky');
    var span = 0, total = sec.querySelectorAll('.proj-card').length || 1;

    function measure() {
      if (!matchMedia('(min-width:981px)').matches) {
        sec.style.height = ''; track.style.transform = ''; span = 0; return;
      }
      span = Math.max(0, track.scrollWidth - innerWidth);
      sec.style.height = (innerHeight + span) + 'px';
      paint();
    }
    function paint() {
      if (!span) return;
      var top = sec.offsetTop;
      var pr = Math.min(Math.max((scrollY - top) / span, 0), 1);
      track.style.transform = 'translate3d(' + (-pr * span) + 'px,0,0)';
      if (bar) bar.style.width = (8 + pr * 92) + '%';
      if (cur) cur.textContent = ('0' + Math.min(total, Math.floor(pr * total) + 1)).slice(-2);
    }
    addEventListener('scroll', paint, { passive: true });
    addEventListener('resize', measure, { passive: true });
    addEventListener('load', measure);
    setTimeout(measure, 300);
  })();

  /* ---- local clock (WITA, UTC+8) ---- */
  (function () {
    var el = document.getElementById('clock'); if (!el) return;
    function t() {
      var d = new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 8 * 3600000);
      el.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '\u00a0WITA';
    }
    t(); setInterval(t, 20000);
  })();

  /* cursor trail replaced by the image trail below */

})();
