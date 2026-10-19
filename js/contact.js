/* Contact form, copy-email and the optional CV button */
(function () {
  var EMAIL = 'fadhelmegasus@gmail.com';

  /* CV button: only shown when the PDF actually exists next to the site */
  var cvs = [].slice.call(document.querySelectorAll('.cv-btn'));
  if (cvs.length && /^https?:/.test(location.protocol)) {
    fetch(cvs[0].getAttribute('href'), { method: 'HEAD' }).then(function (r) {
      if (r.ok) cvs.forEach(function (b) { b.hidden = false; });
    }).catch(function () {});
  }

  /* copy email */
  var copy = document.getElementById('copyMail');
  if (copy) {
    var label = copy.querySelector('span'), idle = label.textContent;
    copy.addEventListener('click', function () {
      function ok() { label.textContent = 'Copied!'; setTimeout(function () { label.textContent = idle; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(ok, fallback);
      else fallback();
      function fallback() {
        var t = document.createElement('textarea'); t.value = EMAIL; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); ok(); } catch (e) { label.textContent = EMAIL; }
        t.remove();
      }
    });
  }

  /* form: posts to a form endpoint if data-endpoint is set (e.g. Formspree), otherwise opens the visitor's mail app */
  var form = document.getElementById('cform'), status = document.getElementById('cformS');
  if (!form) return;
  var fields = [].slice.call(form.querySelectorAll('input[name],textarea[name]')).filter(function (f) { return f.name !== '_gotcha'; });
  function say(msg, bad) { status.textContent = msg; status.classList.toggle('bad', !!bad); }
  function valid() {
    var first = null;
    fields.forEach(function (f) {
      var ok = f.value.trim() && (f.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value.trim()));
      f.closest('.cf').classList.toggle('err', !ok); f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !first) first = f;
    });
    if (first) { first.focus(); say('Please fill in every field with a valid email.', true); return false; }
    return true;
  }
  fields.forEach(function (f) { f.addEventListener('input', function () { f.closest('.cf').classList.remove('err'); f.setAttribute('aria-invalid', 'false'); }); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name=_gotcha]').value) return;      /* honeypot */
    if (!valid()) return;
    var data = {}; fields.forEach(function (f) { data[f.name] = f.value.trim(); });
    var endpoint = form.getAttribute('data-endpoint'), btn = form.querySelector('button[type=submit]');
    if (endpoint) {
      btn.disabled = true; say('Sending…');
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(); form.reset(); say('Thanks! Your message is on its way.'); })
        .catch(function () { say('Could not send. Please email me directly at ' + EMAIL + '.', true); })
        .then(function () { btn.disabled = false; });
    } else {
      var subject = encodeURIComponent('Portfolio message from ' + data.name);
      var body = encodeURIComponent(data.message + '\n\n— ' + data.name + ' (' + data.email + ')');
      location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
      say('Opening your mail app… if nothing happens, use “Copy email”.');
    }
  });
})();
