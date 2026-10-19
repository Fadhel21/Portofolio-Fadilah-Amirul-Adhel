/* ============================================================
   STAGE BRIEFING PANEL — opens when a station on the map is clicked
   (project viewer for Project Lab, quest cards for the other stages)
   ============================================================ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EO = 'cubic-bezier(.23,1,.32,1)', EIN = 'cubic-bezier(.55,.06,.68,.19)', POP = 'cubic-bezier(.34,1.56,.64,1)';
  var ST = [
    { n: 'Project Lab', a: '#A65CFF' }, { n: 'Trophy Room', a: '#FFD34F' }, { n: 'The Workshop', a: '#FF4FD8' },
    { n: 'Research Library', a: '#3FE0FF' }, { n: 'The Academy', a: '#7C9BFF' }, { n: 'Signal Tower', a: '#5DFFB0' }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('dlg'), panel = $('dlgPanel'), scrim = $('dlgScrim'), body = $('dlgBody'), title = $('dlgTitle'), stage = $('dlgStage'),
      foot = $('dlgFoot'), toast = $('dlgToast'), scroller = $('dlgScroll');
  if (!dlg || !panel) return;

  var isOpen = false, cur = 0, lastFocus = null, closing = false, unlocked = {}, token = 0;
  function D(ms) { return reduce ? 1 : ms; }
  function anim(el, kf, o) { o = o || {}; o.duration = D(o.duration || 300); if (reduce) o.delay = 0; return el.animate(kf, o); }
  function done(a) { return a.finished ? a.finished.catch(function () {}) : new Promise(function (r) { a.onfinish = r; }); }

  function h(tag, cls, txt, attrs) {
    var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e;
  }
  function q(root, sel) { var n = root.querySelector(sel); return n ? n.textContent.trim() : ''; }
  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.6 7 .8-5.2 4.8 1.5 7L12 17.600 5.700 21.200l1.500-7L2 9.400l7-.8z"/></svg>'
  };
  function icoEl(tag, cls, svg, label) { var e = h(tag, cls); e.innerHTML = svg + (label ? '' : ''); return e; }
  function link(cls, href, label, ext) {
    var a = h('a', cls); a.href = href; if (ext !== false) { a.target = '_blank'; a.rel = 'noopener'; }
    a.appendChild(document.createTextNode(label + ' ')); var s = h('span'); s.innerHTML = ICON.arrow; s.style.display = 'inline-flex'; a.appendChild(s); return a;
  }
  function chips(arr) { var w = h('div', 'dl-chips rv'); arr.forEach(function (t) { w.appendChild(h('span', '', t)); }); return w; }

  /* ---------- builders (read the live page, so the briefing never drifts from the content) ---------- */
  function projData() {
    return [].slice.call(document.querySelectorAll('#workTrack .proj-card')).map(function (c) {
      var tool = c.querySelector('.proj-tool');
      return {
        img: c.querySelector('.proj-thumb img').src, tool: tool.textContent.trim(), title: q(c, 'h3'), desc: q(c, '.proj-desc'),
        tags: [].slice.call(c.querySelectorAll('.tag')).map(function (t) { return t.textContent.trim(); }),
        shots: (c.dataset.shots || '').split(',').filter(Boolean), href: c.querySelector('.proj-link').href, accent: getComputedStyle(tool).color,
        problem: c.dataset.problem || '', approach: c.dataset.approach || '', result: c.dataset.result || '', insight: c.dataset.insight || ''
      };
    });
  }

  function buildProjects(root) {
    var P = projData(), n = 0, busy = 0;
    var wrap = h('div', 'pv');
    var frame = h('div', 'pv__frame rv'), img = h('img', 'pv__img'); img.alt = '';
    frame.appendChild(img); frame.appendChild(h('div', 'pv__scan')); var shine = h('div', 'pv__shine'); frame.appendChild(shine);
    for (var k = 0; k < 4; k++) frame.appendChild(h('i')); var count = h('div', 'pv__count'); frame.appendChild(count);
    var shotBar = h('div', 'pv__shots rv'), tabs = h('div', 'pv__tabs rv', null, { role: 'tablist', 'aria-label': 'Projects' }), ind = h('span', 'pv__ind');
    tabs.appendChild(ind);
    var tabEls = P.map(function (p, i) {
      var b = h('button', 'pv__tab', null, { type: 'button', role: 'tab', 'aria-label': 'Project ' + (i + 1) + ': ' + p.title });
      var ti = h('img'); ti.src = p.img; ti.alt = ''; b.appendChild(ti); b.appendChild(h('b', '', '0' + (i + 1)));
      b.addEventListener('click', function () { go(i, i > n ? 1 : -1); }); tabs.appendChild(b); return b;
    });
    var info = h('div', 'pv__info rv', null, { 'aria-live': 'polite' });
    var tool = h('p', 'pv__tool'), t = h('h3', 'pv__title'), d = h('p', 'dl-p'), cs = h('div', 'pv__case'), tg = h('div', 'dl-chips'), row = h('div', 'dl-row'), cta = h('a', 'dl-btn');
    cta.target = '_blank'; cta.rel = 'noopener';
    var arrows = h('div', 'pv__arrows'), pb = h('button', '', null, { type: 'button', 'aria-label': 'Previous project' }), nb = h('button', '', null, { type: 'button', 'aria-label': 'Next project' });
    pb.innerHTML = ICON.left; nb.innerHTML = ICON.right; arrows.appendChild(pb); arrows.appendChild(nb);
    pb.addEventListener('click', function () { go((n + P.length - 1) % P.length, -1); });
    nb.addEventListener('click', function () { go((n + 1) % P.length, 1); });
    row.appendChild(cta); row.appendChild(arrows);
    [tool, t, d, cs, tg, row].forEach(function (e) { info.appendChild(e); });
    [frame, shotBar, tabs, info].forEach(function (e) { wrap.appendChild(e); });

    function moveInd(instant) {
      var b = tabEls[n]; if (!b) return;
      ind.style.width = b.offsetWidth + 'px'; ind.style.transition = instant ? 'none' : ''; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    }
    function showShot(p, k) {
      img.src = p.shots[k] || p.img;
      [].forEach.call(shotBar.children, function (b, x) { b.setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
    }
    function fill(i) {
      var p = P[i]; img.src = p.img;
      shotBar.innerHTML = ''; shotBar.hidden = p.shots.length < 2;
      p.shots.forEach(function (u, k) {
        var b = h('button', 'pv__shot', null, { type: 'button', 'aria-label': 'Screenshot ' + (k + 1) + ' of ' + p.shots.length, 'aria-pressed': k === 0 ? 'true' : 'false' });
        var im = h('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; b.appendChild(im);
        b.addEventListener('click', function () { anim(img, [{ opacity: .15 }, { opacity: 1 }], { duration: 300, easing: EO }); showShot(p, k); });
        shotBar.appendChild(b);
      }); count.textContent = '0' + (i + 1) + ' / 0' + P.length; tool.textContent = p.tool; t.textContent = p.title; d.textContent = p.desc;
      cs.innerHTML = '';
      [['Problem', p.problem, ''], ['Approach', p.approach, ''], ['Headline numbers', p.result, 'res'], ['Insight', p.insight, '']].forEach(function (r) {
        if (!r[1]) return; var row = h('div', r[2]); row.appendChild(h('b', '', r[0])); row.appendChild(h('p', '', r[1])); cs.appendChild(row);
      });
      cs.hidden = !cs.children.length;
      tg.innerHTML = ''; p.tags.forEach(function (x) { tg.appendChild(h('span', '', x)); });
      cta.href = p.href; cta.innerHTML = ''; cta.appendChild(document.createTextNode('View on GitHub ')); var s = h('span'); s.innerHTML = ICON.arrow; s.style.display = 'inline-flex'; cta.appendChild(s);
      if (/logarial/i.test(p.href)) { cta.firstChild.textContent = 'Open live site '; }
      panel.style.setProperty('--acc', p.accent);
      tabEls.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
    }
    function go(i, dir) {
      if (i === n && img.src) return;
      var tk = ++busy; n = i;
      var kids = [tool, t, d, cs, tg, row];
      var outs = kids.map(function (e) { return anim(e, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 16) + 'px)' }], { duration: 130, easing: EIN, fill: 'forwards' }); });
      var io = anim(img, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 28) + 'px) scale(.98)' }], { duration: 150, easing: EIN, fill: 'forwards' });
      moveInd();
      Promise.all(outs.map(done).concat(done(io))).then(function () {
        if (tk !== busy) return;
        fill(i);
        outs.forEach(function (a) { a.cancel(); }); io.cancel();
        anim(img, [{ opacity: 0, transform: 'translateX(' + (dir * 44) + 'px) scale(1.05)', clipPath: 'inset(0 0 0 ' + (dir > 0 ? 40 : 0) + '% )' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0)' }], { duration: 480, easing: EO });
        anim(shine, [{ translate: '-120% 0' }, { translate: '120% 0' }], { duration: 900, delay: 160, easing: 'ease-in-out' });
        kids.forEach(function (e, k) { anim(e, [{ opacity: 0, transform: 'translateX(' + (dir * 20) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 90 + k * 45, easing: EO, fill: 'backwards' }); });
      });
    }
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go((n + 1) % P.length, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go((n + P.length - 1) % P.length, -1); }
    });
    root.appendChild(wrap); fill(0); requestAnimationFrame(function () { moveInd(true); });
    window.addEventListener('resize', function () { moveInd(true); }, { passive: true });
  }

  function buildCerts(root) {
    var c = document.querySelector('#certifications .cert');
    var fig = h('div', 'dl-cert rv'), im = h('img'); im.src = c.querySelector('.cert-fig img').src; im.alt = 'Certificate preview'; fig.appendChild(im); root.appendChild(fig);
    var card = h('div', 'dl-card rv');
    card.appendChild(h('p', 'pv__tool', q(c, '.pill'))); card.appendChild(h('h3', '', q(c, 'h3')));
    card.appendChild(h('p', 'dl-p', q(c, '.cert-info p')));
    card.appendChild(chips([].slice.call(c.querySelectorAll('.cert-meta span')).map(function (s) { return s.textContent.trim(); })));
    root.appendChild(card);
    var row = h('div', 'dl-row rv'), b = h('button', 'dl-btn', 'View full certificate '); b.type = 'button'; var s = h('span'); s.innerHTML = ICON.arrow; s.style.display = 'inline-flex'; b.appendChild(s);
    b.addEventListener('click', function () { var cb = $('certBtn'); if (cb) cb.click(); }); row.appendChild(b); root.appendChild(row);
  }

  function buildSkills(root) {
    [].slice.call(document.querySelectorAll('#skills .skill-group')).forEach(function (grp) {
      var sub = grp.querySelector('.sub');
      root.appendChild(h('p', 'dl-k rv', sub.textContent.replace(/\s+/g, ' ').trim()));
      var g = h('div', 'dl-tools rv');
      [].slice.call(grp.querySelectorAll('.tool')).forEach(function (t) {
        var d = h('div', 'dl-tool'), src = t.querySelector('img');
        if (src) { var im = h('img'); im.src = src.src; im.alt = ''; im.loading = 'lazy'; if (src.classList.contains('mono')) im.className = 'mono'; d.appendChild(im); }
        d.appendChild(h('span', '', q(t, 'span'))); g.appendChild(d);
      });
      root.appendChild(g);
    });
  }

  function buildPubs(root) {
    [].slice.call(document.querySelectorAll('#publications .pub-card')).forEach(function (p) {
      var c = h('div', 'dl-card rv'); c.appendChild(h('p', 'pv__tool', q(p, '.pub-kicker'))); c.appendChild(h('h3', '', q(p, 'h3'))); c.appendChild(h('p', 'dl-p', q(p, '.pub-desc')));
      c.appendChild(chips([].slice.call(p.querySelectorAll('.pub-meta span')).map(function (s) { return s.textContent.trim(); })));
      var row = h('div', 'dl-row'), a = link('dl-btn', p.querySelector('.pub-link').href, 'Read paper'); row.appendChild(a); c.appendChild(row); root.appendChild(c);
    });
  }

  function buildEdu(root) {
    var e = document.querySelector('#education .edu-card');
    var big = h('div', 'dl-big rv'); big.innerHTML = 'B.Sc. <span>Statistics</span>'; root.appendChild(big);
    var c = h('div', 'dl-card rv'); c.appendChild(h('p', 'pv__tool', q(e, '.edu-period'))); c.appendChild(h('h3', '', q(e, 'h3'))); c.appendChild(h('p', 'dl-p', q(e, '.edu-degree')));
    c.appendChild(chips([].slice.call(e.querySelectorAll('.edu-meta span')).map(function (s) { return s.textContent.trim(); }))); root.appendChild(c);
    root.appendChild(h('p', 'dl-k rv', 'Highlights'));
    var ul = h('ul', 'dl-flow rv'); ['Statistical modelling & inference', 'Machine learning and NLP research', 'Data visualisation & BI reporting'].forEach(function (t) { ul.appendChild(h('li', '', t)); }); root.appendChild(ul);
  }

  function buildContact(root) {
    var big = h('div', 'dl-big rv'); big.innerHTML = 'Let&rsquo;s make something <span>great</span>'; root.appendChild(big);
    var mail = document.querySelector('.contact .btn-xl'), href = mail ? mail.getAttribute('href') : 'mailto:fadhelmegasus@gmail.com';
    var row = h('div', 'dl-row rv'); var a = link('dl-btn', href, href.replace('mailto:', ''), false); row.appendChild(a); root.appendChild(row);
    var info = h('div', 'dl-info rv');
    var loc = h('div'); loc.innerHTML = ICON.pin; loc.appendChild(h('span', '', 'Bantaeng, South Sulawesi · open to remote & onsite')); info.appendChild(loc);
    var ph = document.querySelector('.hero-contacts a[href^="tel:"]');
    if (ph) { var p = h('div'); p.innerHTML = ICON.phone; var pa = h('a', '', ph.textContent.trim()); pa.href = ph.getAttribute('href'); p.appendChild(pa); info.appendChild(p); }
    root.appendChild(info);
    root.appendChild(h('p', 'dl-k rv', 'Find me on'));
    var soc = h('div', 'dl-row rv'); soc.style.marginTop = '0';
    [].slice.call(document.querySelectorAll('.contact__grid a[href^="http"]')).forEach(function (x) { soc.appendChild(link('dl-btn dl-btn--ghost', x.href, x.textContent.trim())); });
    root.appendChild(soc);
  }

  var BUILD = [buildProjects, buildCerts, buildSkills, buildPubs, buildEdu, buildContact];
  var SUB = ['6 builds, one level at a time', 'Credentials earned along the way', 'The gear behind every build', 'Peer-reviewed research', 'Where the foundation began', 'Send the signal'];

  /* ---------- render + choreography ---------- */
  function renderStage(i) {
    cur = i; panel.style.setProperty('--acc', ST[i].a);
    stage.textContent = 'STAGE 0' + (i + 1) + ' / 06'; title.textContent = ST[i].n;
    body.innerHTML = ''; BUILD[i](body); scroller.scrollTop = 0;
    renderFoot(i);
  }
  function renderFoot(i) {
    foot.innerHTML = '';
    var pv = (i + 5) % 6, nx = (i + 1) % 6;
    var p = h('button', 'dlg__nav', null, { type: 'button', 'aria-label': 'Previous stage: ' + ST[pv].n }); p.style.setProperty('--c', ST[pv].a);
    p.innerHTML = ICON.left + '<div><small>PREV STAGE</small><span>' + ST[pv].n.toUpperCase() + '</span></div>';
    var n = h('button', 'dlg__nav dlg__nav--next', null, { type: 'button', 'aria-label': 'Next stage: ' + ST[nx].n }); n.style.setProperty('--c', ST[nx].a);
    n.innerHTML = '<div><small>NEXT STAGE</small><span>' + ST[nx].n.toUpperCase() + '</span></div>' + ICON.right;
    p.addEventListener('click', function () { swap(pv, -1); }); n.addEventListener('click', function () { swap(nx, 1); });
    foot.appendChild(p); foot.appendChild(n);
  }
  function intro(delay) {
    var rv = [].slice.call(body.querySelectorAll('.rv'));
    rv.forEach(function (e, k) { anim(e, [{ opacity: 0, transform: 'translateY(22px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: (delay || 0) + k * 70, easing: EO, fill: 'backwards' }); });
    var kids = [].slice.call(body.querySelectorAll('.dl-card,.dl-tool,.dl-flow li'));
    kids.forEach(function (e, k) { anim(e, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: (delay || 0) + 160 + Math.min(k, 14) * 28, easing: EO, fill: 'backwards' }); });
  }
  function xp(i) {
    if (unlocked[i]) return; unlocked[i] = 1;
    toast.innerHTML = '<span>+50 XP</span><span style="opacity:.75">STAGE 0' + (i + 1) + ' UNLOCKED</span>';
    anim(toast, [{ opacity: 0, transform: 'translateY(-14px) scale(.8)' }, { opacity: 1, transform: 'none', offset: .14 }, { opacity: 1, transform: 'none', offset: .8 }, { opacity: 0, transform: 'translateY(-10px)' }],
      { duration: 2600, delay: 520, easing: POP, fill: 'both' });
  }

  function centerOn(i, smooth) {
    var w = document.querySelectorAll('.waypoint')[i]; if (!w) return;
    var r = w.getBoundingClientRect(), top = r.top + scrollY + r.height / 2 - innerHeight / 2;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }
  function open(i) {
    if (isOpen || closing) return;
    centerOn(i, true); setTimeout(function () { if (isOpen) document.documentElement.classList.add('dlg-lock'); }, 650);
    isOpen = true; lastFocus = document.activeElement;
    dlg.hidden = false; dlg.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('dlg-open');
    renderStage(i);
    var mob = matchMedia('(max-width:860px)').matches;
    anim(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
    anim(panel, [{ opacity: 0, transform: mob ? 'translateY(60px) scale(.98)' : 'translateX(70px) scale(.96)', clipPath: 'inset(0 0 0 14% round 28px)' },
                 { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0 round 28px)' }], { duration: 640, easing: EO, fill: 'backwards' });
    anim($('dlgHint'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 600, fill: 'backwards' });
    [stage, title].forEach(function (e, k) { anim(e, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 160 + k * 60, easing: EO, fill: 'backwards' }); });
    anim(foot, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 360, easing: EO, fill: 'backwards' });
    intro(220); xp(i);
    if (window.__map) window.__map.focus(i);
    setTimeout(function () { panel.focus({ preventScroll: true }); }, 60);
  }

  function swap(j, dir) {
    if (!isOpen || closing) return;
    var tk = ++token;
    var outs = [stage, title, body].map(function (e) { return anim(e, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 26) + 'px)' }], { duration: 170, easing: EIN, fill: 'forwards' }); });
    if (window.__map) window.__map.focus(j);
    centerOn(j, false);
    Promise.all(outs.map(done)).then(function () {
      if (tk !== token) return;
      renderStage(j); outs.forEach(function (a) { a.cancel(); });
      [stage, title].forEach(function (e, k) { anim(e, [{ opacity: 0, transform: 'translateX(' + (dir * 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: k * 50, easing: EO, fill: 'backwards' }); });
      intro(60); xp(j);
    });
  }

  function close() {
    if (!isOpen || closing) return; closing = true; token++;
    var mob = matchMedia('(max-width:860px)').matches;
    var a = anim(panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: mob ? 'translateY(50px)' : 'translateX(46px) scale(.97)' }], { duration: 300, easing: EIN, fill: 'forwards' });
    var b = anim(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' });
    anim($('dlgHint'), [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    anim(toast, [{ opacity: 0 }, { opacity: 0 }], { duration: 10, fill: 'forwards' });
    if (window.__map) window.__map.blur();
    Promise.all([done(a), done(b)]).then(function () {
      dlg.hidden = true; dlg.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('dlg-open', 'dlg-lock');
      [panel, scrim, toast, $('dlgHint')].forEach(function (e) { e.getAnimations().forEach(function (x) { x.cancel(); }); });
      body.innerHTML = ''; isOpen = false; closing = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });
  }

  /* ---------- wiring ---------- */
  window.addEventListener('map:pick', function (e) { open(e.detail.i); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-open]'); if (b) { e.preventDefault(); open(parseInt(b.getAttribute('data-open'), 10)); }
  });
  scrim.addEventListener('click', close);
  $('dlgClose').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (!panel.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(panel.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
})();
