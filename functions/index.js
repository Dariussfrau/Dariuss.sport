import { SITE } from "../src/config.js";
import { ALBUM_SELECT, getDb } from "../src/db.js";
import { albumCard, articleRow, logo, page, withErrors } from "../src/templates.js";
import { esc, formatDate, html, photoUrl } from "../src/util.js";

export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const [albums, articles] = await Promise.all([
    DB.prepare(`${ALBUM_SELECT} WHERE a.published = 1 ORDER BY a.date DESC, a.id DESC LIMIT 9`).all(),
    DB.prepare(`SELECT * FROM articles WHERE published = 1 ORDER BY date DESC, id DESC LIMIT 5`).all(),
  ]);
  const latest = albums.results[0];
  const origin = new URL(request.url).origin;

  const feature = latest
    ? `<a class="feature" href="/album/${esc(latest.slug)}">
        <div class="cover tall">${latest.cover_key ? `<img src="${photoUrl(latest.cover_key)}" alt="" width="1280" height="1600">` : `<div class="empty-cover">${logo("span", "")}</div>`}</div>
        <div class="cap"><span><b>${esc(latest.title)}</b><br>${[esc(latest.competition), formatDate(latest.date)].filter(Boolean).join(" · ")}</span><span>${latest.photo_count} foto →</span></div>
      </a>`
    : `<div class="feature"><div class="cover tall"><div class="empty-cover">${logo("span", "")}</div></div><div class="cap"><span>Il primo album arriva presto.</span></div></div>`;

  const body = `<main>
  <div class="wrap hero">
    <div>
      <div class="eyebrow">${SITE.tagline}</div>
      <h1>Il calcio di provincia, <em>visto dal bordo campo.</em></h1>
      <p class="lead">Album delle partite e appunti sulla giornata sportiva. Ti riconosci in uno scatto? Puoi scaricarlo gratis in HD.</p>
      <div class="btns"><a class="btn solid" href="#album">Guarda gli album</a><a class="btn" href="#articoli">Leggi gli articoli</a></div>
    </div>
    ${feature}
  </div>

  <section class="block" id="album"><div class="wrap">
    <div class="sec-head"><h2>Album</h2><a href="/album">Tutti gli album →</a></div>
    ${albums.results.length
      ? `<div class="grid">${albums.results.map(albumCard).join("")}</div>`
      : `<p class="empty">Nessun album pubblicato per ora. Il primo arriva dopo la prossima partita.</p>`}
  </div></section>

  <section class="block" id="articoli"><div class="wrap">
    <div class="sec-head"><h2>Dal taccuino</h2><a href="/articoli">Tutti gli articoli →</a></div>
    ${articles.results.length
      ? `<div class="list">${articles.results.map(articleRow).join("")}</div>`
      : `<p class="empty">Nessun articolo per ora.</p>`}
  </div></section>

  <section class="block" id="chi-sono"><div class="wrap about">
    <div>
      <div class="eyebrow">Chi sono</div>
      <p class="bio">${esc(SITE.bio)}</p>
      <div class="btns"><a class="btn solid" href="${SITE.instagram}" target="_blank" rel="noopener">Seguimi su Instagram</a></div>
    </div>
    <dl class="kit">${SITE.kit.map(([k, items]) => `<div><dt>${esc(k)}</dt><dd>${items.map((i) => `<span>${esc(i)}</span>`).join("")}</dd></div>`).join("")}</dl>
  </div></section>
</main>`;

  return html(page({
    title: "",
    url: origin + "/",
    image: latest?.cover_key ? origin + photoUrl(latest.cover_key) : "",
    body,
  }));
});
