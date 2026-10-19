/* sky-hero parallax: pointer + scroll */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('.hero'); if (!hero || reduce) return;
  var items = [].slice.call(hero.querySelectorAll('[data-par]'));
  var px = 0, py = 0, sy = 0, raf = null;
  function paint() {
    items.forEach(function (el) {
      var k = parseFloat(el.dataset.par) || .1;
      el.style.translate = (px * k * 46).toFixed(2) + 'px ' + ((py * k * 34) + (sy * k * .35)).toFixed(2) + 'px';
    });
    raf = null;
  }
  function q() { if (!raf) raf = requestAnimationFrame(paint); }
  if (!matchMedia('(pointer:coarse)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) - .5;
      py = ((e.clientY - r.top) / r.height) - .5;
      q();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { px = py = 0; q(); });
  }
  addEventListener('scroll', function () {
    if (scrollY < innerHeight * 1.2) { sy = scrollY; q(); }
  }, { passive: true });
})();
