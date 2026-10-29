import { ALBUM_SELECT, getDb } from "../../src/db.js";
import { notFound, page, withErrors } from "../../src/templates.js";
import { downloadName, esc, exifLine, formatDate, html, photoUrl } from "../../src/util.js";

export const onRequestGet = withErrors(async ({ env, params, request }) => {
  const DB = await getDb(env);
  const album = await DB.prepare(`${ALBUM_SELECT} WHERE a.slug = ? AND a.published = 1`).bind(params.slug).first();
  if (!album) return html(notFound("Album"), 404);

  const { results: photos } = await DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY position, id`).bind(album.id).all();
  const origin = new URL(request.url).origin;

  const items = photos.map((p, i) => ({
    id: p.id,
    src: photoUrl(p.key),
    w: p.width,
    h: p.height,
    exif: exifLine(p.exif),
    name: downloadName(album.slug, i + 1),
  }));

  const gallery = items.map((p, i) => `<figure>
    <button class="open" type="button" data-photo="${i}" aria-label="Apri foto ${i + 1} di ${items.length}">
      <img src="${p.src}" alt="${esc(album.title)}, foto ${i + 1}" width="${p.w}" height="${p.h}" loading="${i < 6 ? "eager" : "lazy"}">
    </button>
    <figcaption><span class="exif">${esc(p.exif)}</span><button class="dl" type="button" data-dl="${i}" aria-label="Scarica foto ${i + 1} in HD">Scarica HD</button></figcaption>
  </figure>`).join("");

  const facts = [
    `<span><b>${photos.length} foto</b>nell'album</span>`,
    album.place ? `<span><b>${esc(album.place)}</b>luogo</span>` : "",
    `<span><b>HD 2048 px</b>download gratuito</span>`,
  ].join("");

  const albumDownload = album.password_hash && photos.length
    ? `<div class="dlbar"><p><b>Scarica le tue foto.</b> Ogni foto si scarica gratis in HD (2048 px, con filigrana). L'album completo richiede la password che ricevi da me.</p>
        <button class="btn solid" type="button" data-album-dl>Scarica l'album completo</button></div>`
    : photos.length
      ? `<div class="dlbar"><p><b>Scarica le tue foto.</b> Ogni foto si scarica gratis in HD (2048 px, con filigrana).</p></div>`
      : "";

  const data = JSON.stringify({ slug: album.slug, title: album.title, photos: items }).replace(/</g, "\\u003c");

  const body = `<main class="wrap">
  <a class="back" href="/album">← Tutti gli album</a>
  <div class="d-head">
    <div class="meta">${album.competition ? `<span class="chip">${esc(album.competition)}</span>` : ""}<span>${formatDate(album.date)}</span></div>
    <h1>${esc(album.title)}</h1>
    ${album.intro ? `<p>${esc(album.intro)}</p>` : ""}
    <div class="facts">${facts}</div>
  </div>
  ${albumDownload}
  ${photos.length ? `<div class="gallery">${gallery}</div>` : `<p class="empty">Le foto di questo album arrivano a breve.</p>`}
</main>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Foto ingrandita"></div>
<script type="application/json" id="album-data">${data}</script>`;

  return html(page({
    title: album.title,
    description: album.intro || `${album.competition} · ${formatDate(album.date)} · ${photos.length} foto`,
    url: request.url,
    image: album.cover_key ? origin + photoUrl(album.cover_key) : "",
    body,
  }));
});
