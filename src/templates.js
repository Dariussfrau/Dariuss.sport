import { SITE } from "./config.js";
import { esc, formatDate, photoUrl } from "./util.js";
import { SetupError } from "./db.js";

const FONTS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap";

export const logo = (tag = "a", attrs = 'href="/"') =>
  `<${tag} class="logo" ${attrs} aria-label="${SITE.name}, home"><span class="d">Dariuss</span><span class="s">.sport</span></${tag}>`;

function header() {
  return `<header class="head"><div class="wrap head-in">
  ${logo()}
  <nav aria-label="Menu principale">
    <a href="/album">Album</a>
    <a href="/articoli">Articoli</a>
    <a href="/#chi-sono">Chi sono</a>
    <a href="${SITE.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
  </nav>
</div></header>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap">
  <div class="foot-top">${logo("span", "")}<small>${SITE.tagline}</small><a href="${SITE.instagram}" target="_blank" rel="noopener">${SITE.handle}</a></div>
  <div class="legal"><span>© ${new Date().getFullYear()} ${SITE.name}. ${SITE.copyright}</span><span>${SITE.removal}</span></div>
</div></footer>`;
}

export function page({ title, description = SITE.description, image = "", url = "", body, scripts = "" }) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.tagline}`;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title || SITE.name)}">
<meta property="og:description" content="${esc(description)}">
${url ? `<meta property="og:url" content="${esc(url)}">` : ""}
${image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image">` : ""}
<meta name="theme-color" content="#F2EEE6">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
${header()}
${body}
${footer()}
<div class="dlg" id="dlg" hidden role="dialog" aria-modal="true" aria-labelledby="dlg-title"></div>
<div class="toast" id="toast" hidden role="status"></div>
<script>window.SITE_TERMS = ${JSON.stringify(SITE.terms)};</script>
<script src="/assets/site.js" defer></script>
${scripts}
</body>
</html>`;
}

export function albumCard(a) {
  const cover = a.cover_key
    ? `<img src="${photoUrl(a.cover_key, "thumb")}" alt="" loading="lazy" width="640" height="480">`
    : `<div class="empty-cover" aria-hidden="true">${logo("span", "")}</div>`;
  return `<a class="card" href="/album/${esc(a.slug)}">
  <div class="cover">${cover}</div>
  <div class="meta">${a.competition ? `<span class="chip">${esc(a.competition)}</span>` : ""}<span>${formatDate(a.date)}</span></div>
  <h3>${esc(a.title)}</h3>
  <span class="sub">${[esc(a.place), `${a.photo_count} foto`].filter(Boolean).join(" · ")}</span>
</a>`;
}

export function articleRow(a) {
  return `<a class="row" href="/articoli/${esc(a.slug)}">
  <time datetime="${esc(a.date)}">${formatDate(a.date)}</time>
  <div><h3>${esc(a.title)}</h3>${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ""}</div>
  <span class="rt">${readingTime(a.body)}</span>
</a>`;
}

export function readingTime(body) {
  const words = String(body || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

export function notFound(what = "Pagina") {
  return page({
    title: `${what} non trovata`,
    body: `<main class="wrap notice"><h1>${esc(what)} non trovata</h1><p>Il link potrebbe essere cambiato o il contenuto è stato rimosso.</p><p><a class="btn solid" href="/">Torna alla home</a></p></main>`,
  });
}

// Pagina mostrata quando il sito non è ancora collegato a database o spazio foto.
export function setupPage(err) {
  const known = err instanceof SetupError;
  return page({
    title: known ? "Configurazione da completare" : "Errore",
    body: `<main class="wrap notice"><h1>${known ? "Configurazione da completare" : "Qualcosa non ha funzionato"}</h1>
      <p>${esc(known ? err.message : "Si è verificato un errore imprevisto. Riprova tra poco.")}</p>
      ${known ? "<p>Segui la guida <strong>docs/GUIDA-PUBBLICAZIONE.md</strong> nel repository, al passo «Collega database e spazio foto».</p>" : ""}</main>`,
  });
}

export function withErrors(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (err) {
      console.error(err);
      return new Response(setupPage(err), { status: err instanceof SetupError ? 503 : 500, headers: { "content-type": "text/html; charset=utf-8" } });
    }
  };
}
