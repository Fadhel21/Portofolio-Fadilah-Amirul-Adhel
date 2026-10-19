# Fadilah Amirul Adhel — Portfolio

Static site (no build step).

```
index.html          page markup
css/style.css       all styles
js/*.js             behaviour (core, motion layer, hero scrub, map, briefing panel, contact form…)
js/vendor/          three.js + Motion, bundled so the site doesn't depend on a CDN when served
assets/img/         photos, project previews, certificate, tool icons
assets/frames/      32 pre-rendered hero frames (purple computer)
assets/og.jpg       social-share preview (1200x630)
```

## Run locally
Serve the folder over http (ES modules don't load from `file://` without the CDN fallback):

```bash
python -m http.server 8000
```
Opening `index.html` directly still works — it falls back to the CDN for three.js / Motion.

## Things to fill in
- **CV button** — put your PDF at `assets/CV-Fadilah-Amirul-Adhel.pdf`. The "Download CV" buttons appear automatically once the file exists.
- **Contact form** — set `data-endpoint` on `<form id="cform">` in `index.html` to a form service URL (e.g. a Formspree endpoint `https://formspree.io/f/xxxxxxx`). Without it, the form opens the visitor's mail app and there is a "Copy email" button as a fallback.
- **Project insights** — each project card has `data-problem` / `data-approach` (and `data-result` where numbers exist). Add `data-insight="…"` to a card to show an "Insight" row in its briefing.
- **Social preview** — after deploying, change `og:image` / `twitter:image` in `<head>` to the absolute URL (e.g. `https://yourdomain.com/assets/og.jpg`) and add `<link rel="canonical">` and `og:url`.

## Deploy
Any static host works — drag the folder into Netlify Drop, or push to GitHub and enable Pages / Vercel.
