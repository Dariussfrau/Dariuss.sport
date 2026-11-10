import { albumCookie, canViewAlbum, checkPassword } from "../../src/auth.js";
import { ALBUM_SELECT, getDb } from "../../src/db.js";
import { notFound, page, shareRow, withErrors } from "../../src/templates.js";
import { votingAlbum } from "../../src/votes.js";
import { downloadName, esc, exifLine, formatDate, html, photoUrl } from "../../src/util.js";

const findAlbum = (DB, slug) => DB.prepare(`${ALBUM_SELECT} WHERE a.slug = ? AND a.published = 1`).bind(slug).first();

// Galleria privata: prima di mostrare le foto si chiede la password data al cliente.
function gatePage(album, request, error = "") {
  return page({
    active: "album",
    title: "Galleria privata",
    noindex: true,
    body: `<main class="wrap login">
  <form method="post" action="/album/${esc(album.slug)}" class="login-box">
    <div class="eyebrow">Galleria privata</div>
    <h1>${esc(album.title)}</h1>
    <p class="gate-note">Queste foto sono riservate. Inserisci la password che hai ricevuto.</p>
    ${error ? `<p class="err" role="alert">${error}</p>` : ""}
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="off" autocapitalize="off" required autofocus>
    <button class="btn solid" type="submit">Apri la galleria</button>
  </form>
</main>`,
  });
}

export const onRequestPost = withErrors(async ({ env, params, request }) => {
  const DB = await getDb(env);
  const album = await findAlbum(DB, params.slug);
  if (!album) return html(notFound("Album"), 404);
  if (!album.private) return Response.redirect(new URL(`/album/${album.slug}`, request.url), 303);
  const form = await request.formData();
  if (!(await checkPassword(String(form.get("password") || "").trim(), album.password_hash))) {
    await new Promise((r) => setTimeout(r, 700));
    return html(gatePage(album, request, "Password non corretta."), 401, { "cache-control": "no-store" });
  }
  return new Response(null, { status: 303, headers: { location: `/album/${album.slug}`, "set-cookie": await albumCookie(env, album) } });
});

export const onRequestGet = withErrors(async ({ env, params, request }) => {
  const DB = await getDb(env);
  const album = await findAlbum(DB, params.slug);
  if (!album) return html(notFound("Album"), 404);
  if (!(await canViewAlbum(request, env, album))) return html(gatePage(album, request), 401, { "cache-control": "no-store" });

  const { results: photos } = await DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY position, id`).bind(album.id).all();
  const origin = new URL(request.url).origin;
  const isPrivate = Boolean(album.private);
  // Sull'ultimo album pubblico si vota la "Foto della settimana".
  const voting = !isPrivate && photos.length > 0 && (await votingAlbum(DB))?.id === album.id;

  const items = photos.map((p, i) => ({
    id: p.id,
    src: photoUrl(p.key),
    w: p.width,
    h: p.height,
    exif: exifLine(p.exif),
    name: downloadName(album.slug, i + 1),
  }));

  const gallery = items.map((p, i) => `<figure class="reveal">
    <button class="open" type="button" data-photo="${i}" aria-label="Apri foto ${i + 1} di ${items.length}">
      <img src="${p.src}" alt="${esc(album.title)}, foto ${i + 1}" width="${p.w}" height="${p.h}" loading="${i < 6 ? "eager" : "lazy"}">
    </button>
    <figcaption><span class="exif">${esc(p.exif)}</span>${voting ? `<button class="vote" type="button" data-vote="${i}" hidden></button>` : ""}<button class="dl" type="button" data-dl="${i}" aria-label="Scarica foto ${i + 1} in HD">Scarica HD</button></figcaption>
  </figure>`).join("");

  const facts = [
    `<span><b>${photos.length} foto</b>nell'album</span>`,
    album.place ? `<span><b>${esc(album.place)}</b>luogo</span>` : "",
    `<span><b>HD 2048 px</b>download ${isPrivate ? "incluso" : "gratuito"}</span>`,
  ].join("");

  let albumDownload = "";
  if (photos.length && isPrivate) {
    albumDownload = `<div class="dlbar"><p><b>Le tue foto.</b> Scarica ogni scatto in HD (2048 px) oppure tutto l'album in un unico file.</p>
        <button class="btn solid" type="button" data-album-dl>Scarica l'album completo</button></div>`;
  } else if (photos.length && album.password_hash) {
    albumDownload = `<div class="dlbar"><p><b>Scarica le tue foto.</b> Ogni foto si scarica gratis in HD (2048 px). L'album completo richiede la password che ricevi da me.</p>
        <button class="btn solid" type="button" data-album-dl>Scarica l'album completo</button></div>`;
  } else if (photos.length) {
    albumDownload = `<div class="dlbar"><p><b>Scarica le tue foto.</b> Ogni foto si scarica gratis in HD (2048 px).</p></div>`;
  }

  const data = JSON.stringify({ slug: album.slug, title: album.title, voting, private: isPrivate, photos: items }).replace(/</g, "\\u003c");

  const body = `<main class="wrap">
  ${isPrivate ? "" : `<a class="back" href="/album">← Tutti gli album</a>`}
  <div class="d-head${isPrivate ? " private-head" : ""}">
    <div class="meta">${isPrivate ? `<span class="chip lock">Galleria privata</span>` : ""}${album.competition ? `<span class="chip">${esc(album.competition)}</span>` : ""}<span>${formatDate(album.date)}</span></div>
    <h1>${esc(album.title)}</h1>
    ${album.intro ? `<p>${esc(album.intro)}</p>` : ""}
    <div class="facts">${facts}</div>
    ${isPrivate ? "" : shareRow(album.title, request.url.split(/[?#]/)[0])}
  </div>
  ${albumDownload}
  ${voting ? `<p class="votebar"><b>Foto della settimana.</b> Tocca il cuore sotto lo scatto che preferisci: il più votato finisce in evidenza in home. Puoi cambiare voto quando vuoi.</p>` : ""}
  ${photos.length ? `<div class="gallery">${gallery}</div>` : `<p class="empty">Le foto di questo album arrivano a breve.</p>`}
</main>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Foto ingrandita"></div>
<script type="application/json" id="album-data">${data}</script>`;

  return html(page({
    active: "album",
    title: album.title,
    description: isPrivate ? "Galleria privata." : album.intro || `${album.competition} · ${formatDate(album.date)} · ${photos.length} foto`,
    url: isPrivate ? "" : request.url,
    image: !isPrivate && album.cover_key ? origin + photoUrl(album.cover_key) : "",
    noindex: isPrivate,
    body,
  }), 200, isPrivate ? { "cache-control": "no-store" } : {});
});
