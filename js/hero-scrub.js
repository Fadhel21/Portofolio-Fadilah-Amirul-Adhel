/* ============ cursor-driven frame scrub (hero 3D scene) ============ */
(function () {
  var EASE = 0.12, DPR_CAP = 2;
  var FRAMES = Array.from({ length: 32 }, function (_, i) { return 'assets/frames/f' + ('0' + i).slice(-2) + '.webp'; });
  var FRAME_COUNT = FRAMES.length;
  var cv = document.getElementById('heroCanvas'), hero = document.querySelector('.hero');
  if (!cv || !hero) return;
  var ctx = cv.getContext('2d', { alpha: false });
  var imgs = new Array(FRAME_COUNT), ready = 0, cur = 0, target = 0, drawn = -1, raf = null;
  var reduce = false; /* animations stay on even if the OS asks for reduced motion */
  var fill = document.getElementById('loaderFill'), pct = document.getElementById('loaderPct'),
      box = document.getElementById('loader');


  function size() {
    var r = hero.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, DPR_CAP);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    drawn = -1; draw();
  }
  function nearest(i) {
    if (imgs[i]) return imgs[i];
    for (var k = 1; k < FRAME_COUNT; k++) {
      if (imgs[i - k]) return imgs[i - k];
      if (imgs[i + k]) return imgs[i + k];
    }
    return null;
  }
  function draw() {
    var i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(cur)));
    var im = nearest(i); if (!im) return;
    var cw = cv.width, ch = cv.height, s = Math.max(cw / im.width, ch / im.height);
    var w = im.width * s, h = im.height * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }
  function loop() {
    cur += (target - cur) * EASE;
    if (Math.round(cur) !== drawn) draw();
    if (Math.abs(target - cur) > 0.01) raf = requestAnimationFrame(loop);
    else { raf = null; cur = target; draw(); }
  }
  function setX(clientX) {
    var r = hero.getBoundingClientRect();
    var t = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    target = t * (FRAME_COUNT - 1);
    if (reduce) { cur = target; draw(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  /* preload, updating the loader (paced so the bar is readable) */
  var MIN_LOAD_MS = 900, LOADER_EASE = 0.11, t0 = performance.now(), shown = 0, hidden = false;

  function paceLoader() {
    var real = Math.min(1, ready / Math.min(FRAME_COUNT, 8));   /* the page opens after the first few frames; the rest stream in */
    var timed = Math.min((performance.now() - t0) / MIN_LOAD_MS, 1);
    var target = Math.min(real, timed) * 100;
    shown += (target - shown) * LOADER_EASE;
    if (target >= 99.9 && target - shown < 0.8) shown = 100;
    if (fill) fill.style.width = shown.toFixed(1) + '%';
    if (pct) pct.textContent = Math.round(shown) + '%';
    if (shown >= 100) {
      if (!hidden && box) {
        hidden = true;
        setTimeout(function () {
          box.classList.add('done');
          setTimeout(function () { box.remove(); }, 900);
        }, 420);
      }
      return;
    }
    requestAnimationFrame(paceLoader);
  }
  requestAnimationFrame(paceLoader);

  /* load the middle frame first (the scene starts there) and spread outwards */
  var mid = (FRAME_COUNT - 1) / 2;
  FRAMES.map(function (_, i) { return i; }).sort(function (a, b) { return Math.abs(a - mid) - Math.abs(b - mid); }).forEach(function (i) {
    var im = new Image();
    im.onload = im.onerror = function () {
      imgs[i] = im.naturalWidth ? im : null; ready++;
      if (ready === 1) { size(); }
      if (drawn < 0) draw();
    };
    im.src = FRAMES[i];
  });

  hero.addEventListener('pointermove', function (e) { setX(e.clientX); }, { passive: true });
  hero.addEventListener('touchmove', function (e) {
    if (e.touches[0]) setX(e.touches[0].clientX);
  }, { passive: true });
  addEventListener('resize', size, { passive: true });
  cur = target = (FRAME_COUNT - 1) * 0.5;
})();
