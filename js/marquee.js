/* ============ marquee ============ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- marquee: seamless loop + scroll-velocity boost ---- */
  (function () {
    var rows = [].slice.call(document.querySelectorAll('.marquee__row'));
    if (!rows.length || reduce) return;
    var SPEED = 60, boost = 0, lastY = scrollY;
    var lanes = rows.map(function (row, i) {
      var track = row.querySelector('.marquee__track');
      var group = track.querySelector('.marquee__group');
      while (track.children.length > 1) track.removeChild(track.lastChild);
      var w = group.getBoundingClientRect().width;
      var need = Math.ceil((innerWidth * 2) / Math.max(w, 1)) + 1;
      for (var n = 0; n < need; n++) track.appendChild(group.cloneNode(true));
      return { track: track, w: w, x: i % 2 ? -w : 0, dir: i % 2 ? 1 : -1 };
    });
    addEventListener('scroll', function () {
      boost = Math.min(Math.abs(scrollY - lastY) * 0.9, 220); lastY = scrollY;
    }, { passive: true });
    var prev = performance.now();
    (function loop(now) {
      var dt = Math.min((now - prev) / 1000, .05); prev = now;
      boost += (0 - boost) * 0.06;
      lanes.forEach(function (l) {
        l.x += l.dir * (SPEED + boost) * dt;
        if (l.x <= -l.w) l.x += l.w;
        if (l.x >= 0) l.x -= l.w;
        l.track.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,0,0)';
      });
      requestAnimationFrame(loop);
    })(prev);
  })();
})();
