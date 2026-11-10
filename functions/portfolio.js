import { getDb } from "../src/db.js";
import { page, withErrors } from "../src/templates.js";
import { downloadName, esc, html, photoUrl } from "../src/util.js";

// Portfolio: la selezione degli scatti migliori, scelti dal pannello ("Portfolio" sulle foto degli album pubblici).
export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const { results: photos } = await DB.prepare(
    `SELECT p.id, p.key, p.width, p.height, a.slug, a.title,
       (SELECT COUNT(*) FROM photos q WHERE q.album_id = p.album_id AND (q.position < p.position OR (q.position = p.position AND q.id <= p.id))) AS n
     FROM photos p JOIN albums a ON a.id = p.album_id
     WHERE p.portfolio = 1 AND a.published = 1 AND a.private = 0
     ORDER BY a.date DESC, p.position, p.id LIMIT 60`
  ).all();
  const origin = new URL(request.url).origin;

  // Stessa struttura dati degli album: così funzionano foto ingrandita, condivisione e download.
  const items = photos.map((p) => ({ id: p.id, src: photoUrl(p.key), w: p.width, h: p.height, exif: p.title, name: downloadName(p.slug, p.n) }));
  const gallery = photos.map((p, i) => `<figure class="reveal">
    <button class="open" type="button" data-photo="${i}" aria-label="Apri foto ${i + 1} di ${photos.length}">
      <img src="${photoUrl(p.key)}" alt="${esc(p.title)}" width="${p.width}" height="${p.height}" loading="${i < 6 ? "eager" : "lazy"}">
    </button>
    <figcaption><a class="exif" href="/album/${esc(p.slug)}">${esc(p.title)} →</a></figcaption>
  </figure>`).join("");
  const data = JSON.stringify({ slug: "portfolio", title: "Portfolio", voting: false, photos: items }).replace(/</g, "\\u003c");

  const body = `<main class="wrap listing">
  <div class="d-head"><div class="eyebrow">Selezione</div><h1>Portfolio</h1><p>Gli scatti a cui tengo di più, scelti tra gli album delle partite.</p></div>
  ${photos.length ? `<div class="gallery">${gallery}</div>` : `<p class="empty">La selezione arriva presto.</p>`}
  <div class="cta"><h2>Ti piace questo stile?</h2><p>Racconto la tua partita, il tuo torneo o il tuo evento sportivo.</p>
    <div class="btns"><a class="btn solid" href="/contatti">Richiedi un servizio</a></div></div>
</main>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Foto ingrandita"></div>
<script type="application/json" id="album-data">${data}</script>`;

  return html(page({
    active: "portfolio",
    title: "Portfolio",
    description: "Una selezione dei migliori scatti di fotografia sportiva di D. Sport.",
    url: request.url,
    image: photos[0] ? origin + photoUrl(photos[0].key) : "",
    body,
  }));
});
