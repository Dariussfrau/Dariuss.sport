import { SITE } from "./config.js";
import { esc, formatDate, photoUrl } from "./util.js";
import { SetupError } from "./db.js";

const FONTS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap";

export const logo = (tag = "a", attrs = 'href="/"') =>
  `<${tag} class="logo" ${attrs} aria-label="${SITE.name}, home"><span class="d">D.</span><span class="s">Sport</span></${tag}>`;

// Da aumentare a ogni modifica di site.css / site.js: obbliga i browser a scaricare la versione nuova.
export const ASSET_VERSION = "10";

const MENU = [["home", "/", "Home"], ["portfolio", "/portfolio", "Portfolio"], ["album", "/album", "Album"], ["articoli", "/articoli", "Articoli"], ["villaperuccio", "/villaperuccio", "Villaperuccio"], ["chi-sono", "/#chi-sono", "Chi sono"], ["contatti", "/contatti", "Contatti"]];

// Logo grande al centro; sotto, separato da una linea, il menu centrato che resta fisso in alto scorrendo.
function header(active) {
  return `<header class="head" id="head">
  <div class="brand"><div class="wrap brand-in">
    <a class="ig-corner" href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram ${SITE.handle}">${SITE.handle} ↗</a>
    ${logo()}
  </div></div>
  <div class="menu-band"><div class="wrap menu-in">
    <a class="logo mini-logo" href="/" tabindex="-1" aria-hidden="true"><span class="d">D.</span><span class="s">Sport</span></a>
    <nav class="menu" aria-label="Menu principale">
      ${MENU.map(([key, href, label]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a>`).join("\n      ")}
    </nav>
  </div></div>
</header>`;
}

function footer() {
  return `<footer class="foot"><div class="wrap">
  <div class="foot-top">${logo("span", "")}<small>${SITE.tagline}</small><a class="ig" href="${SITE.instagram}" target="_blank" rel="noopener">Seguimi su Instagram · ${SITE.handle} ↗</a></div>
  <div class="legal"><span>© ${new Date().getFullYear()} ${SITE.name}. ${SITE.copyright}</span><span>${SITE.removal}</span></div>
</div></footer>`;
}

// Pulsanti per mandare il link di una pagina su WhatsApp o in un'altra app (Instagram compreso, dal telefono).
export function shareRow(title, url) {
  const text = encodeURIComponent(`${title} · ${SITE.name}\n${url}`);
  return `<div class="share">
  <span>Condividi</span>
  <a class="chipbtn" href="https://wa.me/?text=${text}" target="_blank" rel="noopener">WhatsApp</a>
  <button class="chipbtn" type="button" data-share="${esc(url)}" data-title="${esc(title)}">Instagram e altre app</button>
</div>`;
}

export function page({ title, description = SITE.description, image = "", url = "", body, scripts = "", active = "", type = "website", jsonLd = null, noindex = false }) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.tagline}`;
  // Indirizzo "ufficiale" della pagina e immagine di anteprima (quella generica se la pagina non ne ha una).
  const canonical = url ? url.split(/[?#]/)[0] : "";
  const ogImage = image || (url ? new URL("/assets/og.png", url).href : "");
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
<meta property="og:type" content="${type}">
<meta property="og:locale" content="it_IT">
${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">` : ""}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}"><meta name="twitter:card" content="summary_large_image">` : ""}
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
${noindex ? `<meta name="robots" content="noindex, nofollow">` : ""}
<meta name="theme-color" content="#F2EEE6">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/site.css?v=${ASSET_VERSION}">
<script>document.documentElement.classList.add("js");setTimeout(function(){document.documentElement.classList.add("reveal-all")},3000);</script>
</head>
<body>
${header(active)}
${body}
${footer()}
<div class="dlg" id="dlg" hidden role="dialog" aria-modal="true" aria-labelledby="dlg-title"></div>
<div class="toast" id="toast" hidden role="status"></div>
<script>window.SITE_TERMS = ${JSON.stringify(SITE.terms)};</script>
<script src="/assets/site.js?v=${ASSET_VERSION}" defer></script>
${scripts}
</body>
</html>`;
}

export function albumCard(a) {
  const cover = a.cover_key
    ? `<img src="${photoUrl(a.cover_key, "thumb")}" alt="" loading="lazy" width="640" height="480">`
    : `<div class="empty-cover" aria-hidden="true">${logo("span", "")}</div>`;
  return `<a class="card reveal" href="/album/${esc(a.slug)}">
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
