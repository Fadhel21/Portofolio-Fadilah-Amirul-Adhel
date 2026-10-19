/* ============================================================
   PROJECT MAP — procedural three.js world (adapted from the
   "Agentic Factory" reference): six stations on a metal map,
   a glowing route with moving cargo, camera flies on scroll.
   ============================================================ */
/* Loaded as a classic script (not type="module") so it also works when index.html is opened straight from disk;
   three.js comes in through dynamic import(), which resolves via the import map in <head>. */
(async function () {
  var THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import('three');
    RoundedBoxGeometry = (await import('three/addons/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry;
    RoomEnvironment = (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment;
  } catch (e) { document.documentElement.classList.add('no-map'); return; }
  var cv = document.getElementById('mapCanvas');
  var wps = [].slice.call(document.querySelectorAll('.waypoint'));
  var hero = document.querySelector('.hero');
  if (!cv || !wps.length || !hero) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2, N = wps.length;

  try { await Promise.race([Promise.all([document.fonts.load('700 40px Oswald'), document.fonts.load('40px "Press Start 2P"')]), new Promise(function (r) { setTimeout(r, 2000); })]); } catch (e) {}

  await new Promise(function (r) {
    var n = 0, iv = setInterval(function () { if (!document.getElementById('loader') || ++n > 100) { clearInterval(iv); r(); } }, 150);
  });
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('no-map'); return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0716, 26, 62);
  var camera = new THREE.PerspectiveCamera(33, 1, .1, 160);
  var pm = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  scene.environment = pm.fromScene(room, .04).texture; scene.environmentIntensity = .3;
  room.dispose(); pm.dispose();

  scene.add(new THREE.HemisphereLight(0xb9a4ff, 0x1a1030, .85));
  var key = new THREE.DirectionalLight(0xe9dcff, 2.1); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8, near: .5, far: 40 });
  key.shadow.normalBias = .03; key.shadow.radius = 4;
  scene.add(key, key.target);
  var rim = new THREE.DirectionalLight(0x6fdcff, 2.2); rim.position.set(6, 6, -10); scene.add(rim);
  var glowL = new THREE.PointLight(0xa65cff, 30, 22, 2); scene.add(glowL);

  function mat(c, m, r, x) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: m == null ? .1 : m, roughness: r == null ? .4 : r }, x || {})); }
  var M = {
    base: mat(0x2a2542, .8, .32), edge: mat(0x7a72a3, .85, .24), body: mat(0x38325a, .75, .3),
    chrome: mat(0xcfc9e6, .92, .18), dark: mat(0x120e22, .45, .4), gold: mat(0xffd34f, .85, .24),
    glow: mat(0xa65cff, .2, .25, { emissive: 0xa65cff, emissiveIntensity: 1.7 }),
    pink: mat(0xff4fd8, .3, .3, { emissive: 0xff4fd8, emissiveIntensity: .6 }),
    cyan: mat(0x3fe0ff, .3, .3, { emissive: 0x3fe0ff, emissiveIntensity: .6 }),
    violet: mat(0x7c4dff, .5, .3), paper: mat(0xf4f1ea, 0, .85), glass: mat(0x9d8cff, .4, .15, { transparent: true, opacity: .22, depthWrite: false })
  };
  var geos = {};
  function bg(w, h, d, r) { var k = [w, h, d, r].join(); return geos[k] || (geos[k] = r ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)) : new THREE.BoxGeometry(w, h, d)); }
  function box(p, w, h, d, x, y, z, m, r) { var o = new THREE.Mesh(bg(w, h, d, r == null ? .04 : r), m || M.body); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
  function cyl(p, r, h, x, y, z, m, r2, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 == null ? r : r2, h, seg || 28), m || M.chrome); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; }
  function ball(p, r, x, y, z, m) { var o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m || M.chrome); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; }
  function tex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { t: t, c: c, x: x, draw: draw };
  }
  function txt(x, s, px, py, size, col, wt, font) { x.fillStyle = col; x.font = (wt || 600) + ' ' + size + 'px ' + (font || 'Oswald, sans-serif'); x.fillText(s, px, py); }
  function screen(p, w, h, X, Y, Z, T) { var o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T.t, toneMapped: false })); o.position.set(X, Y, Z); p.add(o); return o; }

  /* ---------- ground + atmosphere ---------- */
  var gt = tex(512, 512, function (x, w, h) {
    x.fillStyle = '#0b0818'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(150,110,255,.35)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
    x.strokeStyle = 'rgba(150,110,255,.12)'; x.lineWidth = 1;
    for (var i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); }
  });
  gt.t.wrapS = gt.t.wrapT = THREE.RepeatWrapping; gt.t.repeat.set(36, 10);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 62), new THREE.MeshBasicMaterial({ map: gt.t, transparent: true, opacity: .8 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.42, 0); scene.add(ground);
  var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(220, 62), new THREE.ShadowMaterial({ opacity: .35 }));
  shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = -.41; shadowPlane.receiveShadow = true; scene.add(shadowPlane);

  var pc = 320, pg = new THREE.BufferGeometry(), pp = new Float32Array(pc * 3);
  for (var i = 0; i < pc; i++) { pp[i * 3] = (Math.random() - .5) * 90; pp[i * 3 + 1] = Math.random() * 9 + .3; pp[i * 3 + 2] = (Math.random() - .5) * 26; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  var dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc9a5ff, size: .075, transparent: true, opacity: .75, depthWrite: false }));
  scene.add(dust);

  /* ---------- stations ---------- */
  var STEP = 11, ZS = [0, -1.6, 1.1, -1.2, 1.4, -.6];
  var ST = [
    { n: 'PROJECT LAB' }, { n: 'TROPHY ROOM' }, { n: 'THE WORKSHOP' }, { n: 'RESEARCH LIBRARY' }, { n: 'ACADEMY' }, { n: 'SIGNAL TOWER' }
  ];
  var ACC = [0xa65cff,0xffd34f,0xff4fd8,0x3fe0ff,0x7c9bff,0x5dffb0], ACCS = ['#A65CFF','#FFD34F','#FF4FD8','#3FE0FF','#7C9BFF','#5DFFB0'];
  var upd = [], stations = [], PL = [], userSet = false;
  var low = (function () {
    try { var v = localStorage.getItem('gfx'); if (v) { userSet = true; return v === 'low'; } } catch (e) {}
    return matchMedia('(prefers-reduced-data: reduce)').matches || ((navigator.hardwareConcurrency || 8) <= 4 && innerWidth < 900);
  })();

  function platform(g, idx, label) {
    var w = 5.6, d = 4.5, gm = mat(ACC[idx], .2, .25, { emissive: ACC[idx], emissiveIntensity: 1.7 });
    box(g, w, .34, d, 0, -.1, 0, M.base, .14);
    box(g, w - .2, .06, d - .2, 0, .12, 0, M.edge, .08);
    box(g, w - .34, .08, d - .34, 0, .18, 0, M.body, .07);
    box(g, w - .4, .035, .05, 0, -.05, d / 2 + .002, gm, 0);
    box(g, .05, .035, d - .4, w / 2 + .002, -.05, 0, gm, 0);
    box(g, w - .4, .035, .05, 0, -.05, -d / 2 - .002, gm, 0);
    var pl2 = new THREE.PointLight(ACC[idx], 9, 7, 2); pl2.position.set(0, 2.6, 1.2); g.add(pl2); PL.push(pl2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, .3, .22, s[0] * (w / 2 - .45), -.3, s[1] * (d / 2 - .45), M.dark); });
    var pl = tex(768, 128, function (x, W, H) {
      x.fillStyle = '#1b1632'; x.fillRect(0, 0, W, H); x.strokeStyle = '#6a55c4'; x.lineWidth = 4; x.strokeRect(3, 3, W - 6, H - 6);
      txt(x, '0' + (idx + 1), 30, 84, 54, ACCS[idx], 700); txt(x, '/ 06', 98, 80, 28, '#8f82c8', 600); txt(x, label, 190, 84, 52, '#EADCFF', 700);
    });
    var p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .57), new THREE.MeshBasicMaterial({ map: pl.t, toneMapped: false }));
    p.rotation.x = -Math.PI / 2; p.position.set(-.8, .226, d / 2 - .4); g.add(p);
  }

  function addStation(i, build) {
    var g = new THREE.Group(); g.position.set((i - (N - 1) / 2) * STEP, 0, ZS[i % ZS.length]); scene.add(g);
    platform(g, i, ST[i].n); var top = new THREE.Group(); top.position.y = .22; g.add(top);
    build(top, g); stations.push(g);
  }

  /* 01 PROJECT LAB — dashboard wall + rising columns */
  addStation(0, function (t) {
    var dash = tex(640, 400, function () {});
    dash.draw = function (x, w, h, T) {
      x.fillStyle = '#110d26'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1d1640'; x.fillRect(0, 0, w, 54); txt(x, 'SALES DASHBOARD', 22, 38, 30, '#EADCFF', 700);
      x.fillStyle = '#ff4fd8'; x.fillRect(w - 66, 20, 14, 14); x.fillStyle = '#3fe0ff'; x.fillRect(w - 44, 20, 14, 14); x.fillStyle = '#ffd34f'; x.fillRect(w - 22, 20, 14, 14);
      var k = [['$2.4M', '#b98cff'], ['+18%', '#3fe0ff'], ['4.3★', '#ffd34f']];
      k.forEach(function (a, i) { x.fillStyle = '#1b1538'; x.fillRect(22 + i * 200, 76, 180, 74); txt(x, a[0], 36 + i * 200, 128, 42, a[1], 700); });
      for (var b = 0; b < 12; b++) { var v = .35 + .55 * Math.abs(Math.sin(T * 1.1 + b * .7)); x.fillStyle = b % 3 === 0 ? '#ff4fd8' : '#7c4dff'; x.fillRect(26 + b * 34, 380 - v * 190, 22, v * 190); }
      x.strokeStyle = '#3fe0ff'; x.lineWidth = 4; x.beginPath();
      for (var s = 0; s <= 40; s++) { var px = 20 + s * 15, py = 200 + Math.sin(T * 1.6 + s * .35) * 22 - s * 1.2; s ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    };
    dash.draw(dash.x, 640, 400, 0);
    box(t, 3.7, 2.35, .16, 0, 2.15, -.7, M.dark, .1);
    var sc = screen(t, 3.5, 2.15, 0, 2.15, -.61, dash);
    cyl(t, .12, .7, 0, .6, -.72, M.chrome); box(t, 1.2, .1, .8, 0, .28, -.72, M.edge, .05);
    var cols = [];
    for (var i = 0; i < 5; i++) { var c = box(t, .5, 1, .5, -1.8 + i * .62, .5, 1.05, i % 2 ? M.violet : M.pink, .06); c.geometry = bg(.5, 1, .5, .06); cols.push(c); }
    var kpi = box(t, .55, .55, .55, 1.9, 1.2, .5, M.cyan, .1);
    var f = 0;
    upd.push(function (T, dt) {
      cols.forEach(function (c, i) { var h = .5 + 1.1 * Math.abs(Math.sin(T * .9 + i * .8)); c.scale.y = h; c.position.y = .5 * h; });
      kpi.position.y = 1.2 + Math.sin(T * 1.6) * .12; kpi.rotation.y = T * .8; kpi.rotation.x = T * .5;
      if ((f++ & 1) === 0) { dash.draw(dash.x, 640, 400, T); dash.t.needsUpdate = true; }
    });
  });

  /* 02 TROPHY ROOM — medal on pedestal + certificate */
  addStation(1, function (t) {
    cyl(t, .95, .9, 0, .45, 0, M.body); cyl(t, 1.05, .12, 0, .95, 0, M.edge); cyl(t, .8, .06, 0, 1.04, 0, M.glow);
    var medal = new THREE.Group(); medal.position.set(0, 2.25, 0); t.add(medal);
    var disc = cyl(medal, .82, .14, 0, 0, 0, M.gold); disc.rotation.x = Math.PI / 2;
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.82, .07, 16, 48), M.chrome); medal.add(ring);
    var face = tex(256, 256, function (x, w, h) { x.fillStyle = '#6b3df0'; x.beginPath(); x.arc(128, 128, 118, 0, TAU); x.fill(); x.fillStyle = '#ffd34f'; x.font = '700 150px sans-serif'; x.textAlign = 'center'; x.fillText('★', 128, 182); });
    [.075, -.075].forEach(function (z, i) { var s = new THREE.Mesh(new THREE.CircleGeometry(.66, 40), new THREE.MeshBasicMaterial({ map: face.t, toneMapped: false })); s.position.z = z; if (i) s.rotation.y = Math.PI; medal.add(s); });
    box(t, .34, 1.1, .05, -.3, 1.4, .02, M.pink, .01).rotation.z = .25; box(t, .34, 1.1, .05, .3, 1.4, .02, M.violet, .01).rotation.z = -.25;
    var cert = tex(512, 360, function (x, w, h) {
      x.fillStyle = '#f7f2e8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7c4dff'; x.lineWidth = 8; x.strokeRect(14, 14, w - 28, h - 28);
      x.textAlign = 'center'; txt(x, 'CERTIFICATE', 256, 100, 54, '#2a1a66', 700); txt(x, 'MSIB · BATCH 3', 256, 150, 26, '#7c4dff', 600);
      txt(x, 'Bisa AI Academy', 256, 210, 40, '#1b1538', 600); txt(x, 'AI Hacker Track', 256, 250, 24, '#6b6490', 500);
      x.fillStyle = '#ffd34f'; x.beginPath(); x.arc(256, 306, 26, 0, TAU); x.fill();
    });
    var cg = new THREE.Group(); cg.position.set(2.25, 1.7, .3); cg.rotation.y = -.5; t.add(cg);
    box(cg, 2.5, 1.8, .06, 0, 0, 0, M.paper, .02); screen(cg, 2.35, 1.65, 0, 0, .035, cert);
    upd.push(function (T) { medal.rotation.y = T * .9; medal.position.y = 2.25 + Math.sin(T * 1.4) * .1; cg.position.y = 1.7 + Math.sin(T * 1.1 + 1) * .08; });
  });

  /* 03 THE WORKSHOP — interlocking gears */
  addStation(2, function (t) {
    box(t, 4.6, 3.4, .22, 0, 1.8, -.9, M.dark, .08);
    var gears = [];
    function gear(x, y, r, teeth, mt, dir, ph) {
      var o = new THREE.Group(); o.position.set(x, y, -.7); t.add(o);
      var body = cyl(o, r * .86, .22, 0, 0, 0, mt); body.rotation.x = Math.PI / 2;
      var hub = cyl(o, r * .3, .34, 0, 0, 0, M.chrome); hub.rotation.x = Math.PI / 2;
      var hole = cyl(o, r * .55, .24, 0, 0, 0, M.dark); hole.rotation.x = Math.PI / 2;
      for (var i = 0; i < teeth; i++) { var a = i / teeth * TAU; var tt = box(o, r * .28, r * .26, .22, Math.cos(a) * r * .95, Math.sin(a) * r * .95, 0, mt, .02); tt.rotation.z = a; }
      o.rotation.z = ph; gears.push({ o: o, dir: dir, sp: 1 / r, ph: ph });
    }
    gear(-1.15, 1.45, 1.0, 14, M.glow, 1, 0); gear(.85, 1.45, .76, 10, M.pink, -1, .2); gear(.3, 2.95, .55, 8, M.cyan, 1, .1); gear(-1.5, 2.9, .4, 8, M.gold, -1, 0);
    var chips = [];
    for (var i = 0; i < 6; i++) { var c = box(t, .42, .42, .42, 0, 0, 0, i % 2 ? M.violet : M.chrome, .08); chips.push(c); }
    upd.push(function (T) {
      gears.forEach(function (g) { g.o.rotation.z = g.ph + g.dir * T * .6 * g.sp; });
      chips.forEach(function (c, i) { var a = T * .7 + i / chips.length * TAU; c.position.set(Math.cos(a) * 2.4, 3.6 + Math.sin(T + i) * .15, Math.sin(a) * 1.1 + .6); c.rotation.y = a; c.rotation.x = T * .5; });
    });
  });

  /* 04 RESEARCH LIBRARY — book stacks + open book + floating pages */
  addStation(3, function (t) {
    var cs = [M.violet, M.pink, M.cyan, M.glow, M.gold], y = 0;
    for (var i = 0; i < 6; i++) { var h = .3 + (i % 3) * .06; var b = box(t, 2.3 - (i % 2) * .15, h, 1.55, -1.1 + (i % 3 - 1) * .1, y + h / 2, -.5, cs[i % cs.length], .05); b.rotation.y = (i % 2 ? .12 : -.09); box(t, 2.1, h * .6, 1.4, -1.1 + (i % 3 - 1) * .1 + .06, y + h / 2, -.5, M.paper, .02).rotation.y = b.rotation.y; y += h; }
    var pg = tex(300, 360, function (x, w, h) { x.fillStyle = '#f7f2e8'; x.fillRect(0, 0, w, h); x.fillStyle = '#7c4dff'; x.fillRect(28, 34, 150, 14); x.fillStyle = '#cfc7e6'; for (var i = 0; i < 12; i++) x.fillRect(28, 84 + i * 21, i % 4 === 3 ? 160 : 240, 8); });
    var open = new THREE.Group(); open.position.set(1.35, 1.4, .55); open.rotation.set(-.2, -.4, 0); t.add(open);
    [-1, 1].forEach(function (s) { var p = box(open, 1.35, 1.7, .05, s * .68, 0, 0, M.paper, .01); p.rotation.y = -s * .22; var sc = screen(open, 1.25, 1.55, s * .68, 0, .03, pg); sc.rotation.y = -s * .22; });
    var sheets = [];
    for (var j = 0; j < 4; j++) { var sh = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.15), new THREE.MeshBasicMaterial({ map: pg.t, side: THREE.DoubleSide, toneMapped: false })); t.add(sh); sheets.push(sh); }
    upd.push(function (T) {
      open.position.y = 1.4 + Math.sin(T * 1.2) * .1;
      sheets.forEach(function (s, i) { var a = T * .5 + i / 4 * TAU; s.position.set(Math.cos(a) * 2.5, 2.2 + Math.sin(T * .9 + i * 1.7) * .4, Math.sin(a) * 1.4 - .1); s.rotation.set(Math.sin(a) * .3, -a + Math.PI / 2, Math.cos(a) * .2); });
    });
  });

  /* 05 ACADEMY — mortarboard + diploma */
  addStation(4, function (t) {
    cyl(t, 1.0, .7, 0, .35, 0, M.body); cyl(t, 1.1, .1, 0, .75, 0, M.edge);
    var cap = new THREE.Group(); cap.position.set(0, 1.9, 0); t.add(cap);
    cyl(cap, .72, .55, 0, -.2, 0, M.violet, .62);
    var bd = box(cap, 2.5, .1, 2.5, 0, .12, 0, M.dark, .03); bd.rotation.y = Math.PI / 4;
    box(cap, 2.5, .02, 2.5, 0, .18, 0, M.glow, 0).rotation.y = Math.PI / 4; cyl(cap, .09, .1, 0, .22, 0, M.gold);
    var tp = new THREE.Group(); cap.add(tp); tp.position.set(0, .2, 0);
    var cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, .02, 0), new THREE.Vector3(.7, .05, .0), new THREE.Vector3(1.2, -.25, .1), new THREE.Vector3(1.25, -.7, .1)]), 20, .025, 6), M.gold); tp.add(cord);
    ball(tp, .1, 1.25, -.78, .1, M.gold);
    var dip = new THREE.Group(); dip.position.set(2.1, .95, .9); dip.rotation.z = Math.PI / 2; t.add(dip);
    cyl(dip, .17, 1.5, 0, 0, 0, M.paper, .17, 18); var rb = new THREE.Mesh(new THREE.TorusGeometry(.18, .04, 8, 24), M.pink); rb.rotation.y = Math.PI / 2; dip.add(rb);
    var stars = []; for (var i = 0; i < 5; i++) { var s = ball(t, .08, 0, 0, 0, M.gold); stars.push(s); }
    upd.push(function (T) {
      cap.rotation.y = T * .5; cap.position.y = 1.9 + Math.sin(T * 1.3) * .1; tp.rotation.z = Math.sin(T * 2) * .06;
      dip.position.y = .95 + Math.sin(T * 1.1 + 2) * .05;
      stars.forEach(function (s, i) { var a = T * .9 + i / 5 * TAU; s.position.set(Math.cos(a) * 1.7, 1.2 + Math.sin(T * 2 + i) * .35 + i * .2, Math.sin(a) * 1.7); });
    });
  });

  /* 06 SIGNAL TOWER — beacon + pulse rings + mail */
  addStation(5, function (t) {
    cyl(t, .5, .5, 0, .25, -.2, M.body); cyl(t, .16, 3.0, 0, 1.9, -.2, M.chrome, .09);
    for (var i = 0; i < 4; i++) cyl(t, .26 - i * .03, .06, 0, 1.0 + i * .7, -.2, M.glow);
    var bc = ball(t, .32, 0, 3.55, -.2, M.glow);
    var dish = new THREE.Mesh(new THREE.SphereGeometry(.7, 24, 12, 0, TAU, 0, Math.PI / 2.4), mat(0xcfc9e6, .9, .2, { side: THREE.DoubleSide })); dish.position.set(.55, 2.6, -.2); dish.rotation.set(-1.9, .4, 0); t.add(dish);
    var rings = []; for (var r = 0; r < 3; r++) { var rg = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xc9a5ff, transparent: true, opacity: 1, toneMapped: false, depthWrite: false })); rg.rotation.x = Math.PI / 2; rg.position.set(0, 3.55, -.2); t.add(rg); rings.push(rg); }
    var env = tex(512, 340, function (x, w, h) {
      x.fillStyle = '#7c4dff'; x.fillRect(0, 0, w, h); x.fillStyle = '#9f77ff'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w / 2, h * .58); x.lineTo(w, 0); x.closePath(); x.fill();
      x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.moveTo(0, h); x.lineTo(w * .42, h * .5); x.lineTo(w, h); x.closePath(); x.fill();
      x.fillStyle = '#ffd34f'; x.beginPath(); x.arc(w / 2, h * .58, 28, 0, TAU); x.fill(); x.fillStyle = '#2a1a66'; x.font = '700 38px Oswald, sans-serif'; x.textAlign = 'center'; x.fillText('@', w / 2, h * .58 + 13);
    });
    var mail = new THREE.Group(); mail.position.set(1.9, 1.6, .9); mail.rotation.y = -.5; t.add(mail);
    box(mail, 1.7, 1.12, .1, 0, 0, 0, M.violet, .05); screen(mail, 1.62, 1.04, 0, 0, .056, env);
    upd.push(function (T) {
      rings.forEach(function (r, i) { var u = ((T * .5 + i / 3) % 1); r.scale.setScalar(.4 + u * 3.2); r.material.opacity = (1 - u) * .85; });
      bc.scale.setScalar(1 + Math.sin(T * 5) * .12); mail.position.y = 1.6 + Math.sin(T * 1.3) * .12; mail.rotation.z = Math.sin(T * 1.1) * .06;
    });
  });

  /* ---------- route + cargo ---------- */
  var pts = [], firstZ = ZS[0] + 3.3;
  pts.push(new THREE.Vector3(stations[0].position.x - 8, .05, firstZ));
  stations.forEach(function (s, i) { pts.push(new THREE.Vector3(s.position.x, .05, s.position.z + 3.3)); if (i < N - 1) pts.push(new THREE.Vector3((s.position.x + stations[i + 1].position.x) / 2, .05, (s.position.z + stations[i + 1].position.z) / 2 + 3.8)); });
  pts.push(new THREE.Vector3(stations[N - 1].position.x + 8, .05, ZS[N - 1] + 3.3));
  var curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .35);
  var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, .07, 8), M.glow); tube.position.y = 0; scene.add(tube);
  var halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, .22, 8), new THREE.MeshBasicMaterial({ color: 0x7c4dff, transparent: true, opacity: .14, depthWrite: false })); scene.add(halo);
  var cargo = [], cc = [M.pink, M.cyan, M.gold, M.violet];
  for (var c = 0; c < 14; c++) { var cb = box(scene, .34, .34, .34, 0, .3, 0, cc[c % 4], .06); cargo.push({ m: cb, u: c / 14 }); }
  stations.forEach(function (s, i) { var n = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .08, 20), M.gold); n.position.set(s.position.x, .02, s.position.z + 3.3); scene.add(n); });

  /* ---------- camera rig ---------- */
  var AZ = [-.5, .5, -.35, .45, -.5, .25], DIST = 13.6, HGT = 6.4;
  function pose(i, aspect) {
    var s = stations[i], k = Math.min(Math.max(1.35 / aspect, 1), 1.9), d = DIST * k;
    var tg = new THREE.Vector3(s.position.x, 1.35, s.position.z + .2);
    return { p: new THREE.Vector3(tg.x + Math.sin(AZ[i]) * d, HGT * (k > 1 ? 1 + (k - 1) * .5 : 1), tg.z + Math.cos(AZ[i]) * d), t: tg };
  }
  function closePose(i, aspect, T) {
    var s = stations[i], k = Math.min(Math.max(1.35 / aspect, 1), 1.9), d = DIST * .56 * k, az = AZ[i] + Math.sin(T * .35) * .3;
    var tg = new THREE.Vector3(s.position.x, 1.55, s.position.z + .1);
    return { p: new THREE.Vector3(tg.x + Math.sin(az) * d, 4.2 + (k > 1 ? (k - 1) * 1.4 : 0), tg.z + Math.cos(az) * d), t: tg };
  }
  function ss(a, b, x) { x = Math.min(Math.max((x - a) / (b - a), 0), 1); return x * x * (3 - 2 * x); }

  var foc = { i: -1, amt: 0, tgt: 0, init: false }, fpos = new THREE.Vector3(), ftg = new THREE.Vector3(), hovAmt = [0, 0, 0, 0, 0, 0];
  var centers = [], wpH = 600, heroH = 1, vw = 1, vh = 1, fc = 0, mx = 0, my = 0, mtx = 0, mty = 0;
  function measure() {
    wpH = wps[0].getBoundingClientRect().height || 600;
    centers = wps.map(function (w) { var r = w.getBoundingClientRect(); return r.top + scrollY + r.height * .5; });
    heroH = hero.offsetHeight || innerHeight;
  }
  var viewE = -1;
  function applyView(e) {
    var d = vw >= 981, x = d ? (-vw * .1) * (1 - e) + (vw * .22) * e : 0, y = d ? 0 : (-vh * .2) * (1 - e) + (vh * .3) * e;
    camera.setViewOffset(vw, vh, x, y, vw, vh); camera.updateProjectionMatrix(); viewE = e;
  }
  function resize() {
    vw = innerWidth; vh = innerHeight;
    renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio || 1, vw < 900 ? 1.25 : 1.5));
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh;
    applyView(0); measure();
  }
  addEventListener('resize', resize, { passive: true }); addEventListener('load', function () { setTimeout(measure, 200); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(document.body);
  if (!reduce) addEventListener('pointermove', function (e) { mtx = e.clientX / innerWidth - .5; mty = e.clientY / innerHeight - .5; }, { passive: true });
  resize();

  /* graphics quality: manual toggle + automatic fallback when frames are slow */
  var gfx = document.getElementById('gfx');
  function applyQuality() {
    key.castShadow = !low; shadowPlane.visible = !low; dust.visible = !low; halo.visible = !low;
    PL.forEach(function (l) { l.visible = !low; }); glowL.intensity = low ? 55 : 30;
    if (gfx) { gfx.textContent = 'GFX: ' + (low ? 'LOW' : 'HIGH'); gfx.setAttribute('aria-pressed', String(low)); }
  }
  if (gfx) gfx.addEventListener('click', function () {
    low = !low; userSet = true; try { localStorage.setItem('gfx', low ? 'low' : 'high'); } catch (e) {}
    applyQuality(); resize();
  });
  applyQuality(); resize();
  var qAcc = 0, qN = 0, qWarm = 0;

  /* one-time hint: stations are clickable */
  var hintEl = document.getElementById('mapHint'), hintDone = false;
  try { hintDone = sessionStorage.getItem('mapHint') === '1'; } catch (e) {}
  function endHint() { if (hintEl) hintEl.classList.remove('on'); hintDone = true; try { sessionStorage.setItem('mapHint', '1'); } catch (e) {} }
  window.addEventListener('map:pick', endHint);

  /* route HUD (mini-map) */
  var route = document.getElementById('route'), rbtn = route ? [].slice.call(route.querySelectorAll('button')) : [];
  rbtn.forEach(function (b, i) { b.addEventListener('click', function () { var w = wps[i]; if (w) window.scrollTo({ top: centers[i] - innerHeight * .5, behavior: reduce ? 'auto' : 'smooth' }); }); });
  var lastIdx = -1;

  /* pick stations with the pointer (the canvas sits behind the page, so listen on the document) */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tip = document.getElementById('mapTip'), hov = -1, lastEv = null, pend = false;
  function stationAt(e) {
    var t = e.target; if (!t || !t.closest || !t.closest('.waypoint') || document.documentElement.classList.contains('dlg-open')) return -1;
    if (parseFloat(cv.style.opacity) < .5) return -1;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(stations, true)[0]; if (!hit) return -1;
    var o = hit.object; while (o) { var k = stations.indexOf(o); if (k >= 0) return k; o = o.parent; } return -1;
  }
  function hoverTick() {
    pend = false; if (!lastEv) return; var e = lastEv, i = stationAt(e), w = e.target.closest && e.target.closest('.waypoint');
    if (i !== hov) {
      hov = i; if (w) w.style.cursor = i >= 0 ? 'pointer' : '';
      if (tip) { if (i >= 0) { tip.innerHTML = '<b>&#9656;</b> CLICK TO OPEN &middot; ' + ST[i].n; tip.style.setProperty('--acc', ACCS[i]); tip.classList.add('on'); } else tip.classList.remove('on'); }
    }
    if (tip && i >= 0) tip.style.translate = (e.clientX + 18) + 'px ' + (e.clientY + 16) + 'px';
  }
  if (!reduce || true) addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; lastEv = e; if (!pend) { pend = true; requestAnimationFrame(hoverTick); } }, { passive: true });
  addEventListener('click', function (e) {
    if (document.documentElement.classList.contains('dlg-open') || (e.target.closest && e.target.closest('button,a,input'))) return;
    var i = stationAt(e); if (i >= 0) window.dispatchEvent(new CustomEvent('map:pick', { detail: { i: i } }));
  });
  window.__map = {
    focus: function (i) { if (foc.i < 0 || foc.tgt === 0) foc.init = true; foc.i = i; foc.tgt = 1; },
    blur: function () { foc.tgt = 0; }
  };

  var T = 0, last = performance.now(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, .05); last = now;
    var op = ss(heroH * .45, heroH * .95, scrollY);
    if (foc.i >= 0) op = 1;
    var yy = scrollY + innerHeight * .5, prox = 0;
    for (var q = 0; q < N; q++) prox = Math.max(prox, 1 - ss(wpH * .32, wpH * .85, Math.abs(yy - centers[q])));
    cv.style.opacity = (op * (.16 + .84 * Math.max(prox, foc.amt))).toFixed(3);
    if (hintEl && !hintDone && prox > .8 && op > .8 && !document.getElementById('loader')) {
      hintEl.classList.add('on'); if (!hintEl._t) hintEl._t = setTimeout(endHint, 7000);
    }
    if (route) route.classList.toggle('on', op > .6);
    if (gfx) gfx.classList.toggle('on', op > .6);
    if (op < .01 || document.hidden || document.getElementById('loader')) return;

    var y = scrollY + innerHeight * .5, f = 0;
    if (y <= centers[0]) f = 0; else if (y >= centers[N - 1]) f = N - 1;
    else { for (var i = 0; i < N - 1; i++) if (y < centers[i + 1]) { f = i + ss(.42, 1, (y - centers[i]) / (centers[i + 1] - centers[i])); break; } }
    fc += (f - fc) * (reduce ? 1 : Math.min(1, dt * 3.1));
    var i0 = Math.min(N - 2, Math.floor(fc)), u = fc - i0; if (fc >= N - 1) { i0 = N - 2; u = 1; }
    var a = pose(i0, camera.aspect), b = pose(i0 + 1, camera.aspect);
    v1.lerpVectors(a.p, b.p, u); v1.y += Math.sin(u * Math.PI) * 4.2; v2.lerpVectors(a.t, b.t, u);
    foc.amt += (foc.tgt - foc.amt) * Math.min(1, dt * (foc.tgt ? 4.5 : 6)); if (Math.abs(foc.tgt - foc.amt) < .002) foc.amt = foc.tgt;
    if (foc.tgt === 0 && foc.amt === 0) foc.i = -1;
    var fe = ss(0, 1, foc.amt);
    if (foc.i >= 0) {
      if (foc.init) { fpos.copy(v1); ftg.copy(v2); foc.init = false; }
      var cp = closePose(foc.i, camera.aspect, T), kf = Math.min(1, dt * 3);
      fpos.lerp(cp.p, kf); ftg.lerp(cp.t, kf); v1.lerp(fpos, fe); v2.lerp(ftg, fe);
    }
    if (Math.abs(fe - viewE) > .001) applyView(fe);
    mx += (mtx - mx) * .05; my += (mty - my) * .05;
    camera.position.set(v1.x + mx * 2.4, v1.y - my * 1.2, v1.z); camera.lookAt(v2);
    key.position.set(v2.x - 4, 12, v2.z + 7); key.target.position.copy(v2); glowL.position.set(v2.x, 5, v2.z + 3);

    T += dt;
    upd.forEach(function (fn) { fn(T, dt); });
    if (!reduce) {
      cargo.forEach(function (c) { c.u = (c.u + dt * .018) % 1; curve.getPointAt(c.u, v1); c.m.position.set(v1.x, .3 + Math.sin(T * 3 + c.u * 40) * .04, v1.z); c.m.rotation.y = T + c.u * 10; });
      dust.rotation.y = Math.sin(T * .05) * .05; dust.position.y = Math.sin(T * .3) * .2;
    }
    stations.forEach(function (s, k) { var tgt = (hov === k && foc.i < 0) ? 1 : 0; hovAmt[k] += (tgt - hovAmt[k]) * Math.min(1, dt * 8); s.scale.setScalar(1 + .035 * hovAmt[k]); });
    renderer.render(scene, camera);
    if (!low && !userSet && !reduce && ++qWarm > 90) {
      qAcc += dt; qN++;
      if (qN >= 100) { if (qAcc / qN > .034) { low = true; applyQuality(); resize(); } qAcc = 0; qN = 0; }
    }

    var idx = Math.round(fc);
    if (idx !== lastIdx) { lastIdx = idx; rbtn.forEach(function (bb, k) { bb.classList.toggle('act', k === idx); }); document.documentElement.setAttribute('data-stop', idx); }
  }
  requestAnimationFrame(frame);
})();
