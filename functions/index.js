import { SITE } from "../src/config.js";
import { ALBUM_SELECT, getDb } from "../src/db.js";
import { jersey, loadMatches, matchCard, pickMatches } from "../src/matches.js";
import { albumCard, articleRow, logo, page, withErrors } from "../src/templates.js";
import { esc, formatDate, html, photoUrl } from "../src/util.js";
import { photoOfTheWeek } from "../src/votes.js";
import { getSettings } from "../src/settings.js";
import { renderMarkdown } from "../src/markdown.js";

export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const [albums, articles, featured, matches] = await Promise.all([
    DB.prepare(`${ALBUM_SELECT} WHERE a.published = 1 AND a.private = 0 ORDER BY a.date DESC, a.id DESC LIMIT 9`).all(),
    DB.prepare(`SELECT * FROM articles WHERE published = 1 ORDER BY date DESC, id DESC LIMIT 5`).all(),
    // Foto scelte dal pannello ("In home"): scorrono in dissolvenza accanto al titolo.
    DB.prepare(`SELECT p.key, a.slug, a.title, a.competition, a.date FROM photos p JOIN albums a ON a.id = p.album_id
                WHERE p.featured = 1 AND a.published = 1 AND a.private = 0 ORDER BY a.date DESC, p.position, p.id LIMIT 6`).all(),
    loadMatches(DB),
  ]);
  const week = await photoOfTheWeek(DB);
  const note = week ? await getSettings(DB, ["week_title", "week_text"]) : {};
  const { next, last } = pickMatches(matches);
  const latest = albums.results[0];
  const origin = new URL(request.url).origin;

  const emptyCover = `<div class="empty-cover">${logo("span", "")}</div>`;
  const capSub = (a) => [esc(a.competition), formatDate(a.date)].filter(Boolean).join(" · ");
  const slides = featured.results;
  let feature;
  if (slides.length) {
    feature = `<div class="feature reveal" data-slides>
        <div class="cover tall">${slides.map((p, i) => `<a class="slide${i ? "" : " on"}" href="/album/${esc(p.slug)}" data-title="${esc(p.title)}" data-sub="${capSub(p)}"${i ? ' tabindex="-1"' : ""}><img src="${photoUrl(p.key)}" alt="${esc(p.title)}"${i ? ' loading="lazy"' : ""}></a>`).join("")}</div>
        <div class="cap"><span><b data-cap-title>${esc(slides[0].title)}</b><br><span data-cap-sub>${capSub(slides[0])}</span></span>${slides.length > 1 ? `<span class="dots" aria-hidden="true">${slides.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</span>` : ""}</div>
      </div>`;
  } else if (latest) {
    feature = `<a class="feature reveal" href="/album/${esc(latest.slug)}">
        <div class="cover tall">${latest.cover_key ? `<img src="${photoUrl(latest.cover_key)}" alt="" width="1280" height="1600">` : emptyCover}</div>
        <div class="cap"><span><b>${esc(latest.title)}</b><br>${capSub(latest)}</span><span>${latest.photo_count} foto →</span></div>
      </a>`;
  } else {
    feature = `<div class="feature"><div class="cover tall">${emptyCover}</div><div class="cap"><span>Il primo album arriva presto.</span></div></div>`;
  }

  const matchBand = next || last
    ? `<section class="matchband"><div class="wrap matchband-in">
    <a class="mteam" href="/villaperuccio">${jersey(64)}<span><span class="eyebrow">Seguo il</span><b>${esc(SITE.team.name)}</b><span class="mlink">La stagione →</span></span></a>
    ${next ? matchCard(next, "Prossima partita") : ""}
    ${last ? matchCard(last, "Ultimo risultato") : ""}
  </div></section>`
    : "";

  // Fascia "Foto della settimana": la foto più votata, con il titolo e la cronaca scritti dal pannello (se ci sono).
  const votesLine = week && (week.votes ? `In testa con ${week.votes} ${week.votes === 1 ? "voto" : "voti"}.` : "La votazione è aperta.");
  const weekBand = week
    ? `<section class="potw"><div class="wrap potw-in reveal">
    <a class="potw-img" href="/album/${esc(week.album.slug)}${week.votes ? `#foto-${week.number}` : ""}"><img src="${photoUrl(week.photo.key)}" alt="${esc(week.album.title)}, foto ${week.number}" loading="lazy"></a>
    <div>
      <div class="eyebrow">Foto della settimana</div>
      <h2>${esc(note.week_title || week.album.title)}</h2>
      ${note.week_title ? `<p class="potw-from">${esc(week.album.title)} · ${formatDate(week.album.date)}</p>` : ""}
      ${note.week_text ? `<div class="potw-text">${renderMarkdown(note.week_text)}</div>` : ""}
      <p class="potw-votes">${votesLine} Scegli lo scatto che preferisci: il più votato resta qui in evidenza.</p>
      <div class="btns"><a class="btn solid" href="/album/${esc(week.album.slug)}">Vota la tua preferita</a></div>
    </div>
  </div></section>`
    : "";

  const body = `<main>
  <div class="wrap hero">
    <div>
      <div class="eyebrow">${SITE.tagline}</div>
      <h1>Album<br>e appunti<br><em>sulla giornata sportiva.</em></h1>
      <div class="btns"><a class="btn solid" href="#album">Guarda gli album</a><a class="btn" href="#articoli">Leggi gli articoli</a></div>
    </div>
    ${feature}
  </div>

  ${matchBand}

  ${weekBand}

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
      <div class="btns"><a class="btn solid" href="${SITE.instagram}" target="_blank" rel="noopener">Seguimi su Instagram</a><a class="btn" href="/contatti">Richiedi un servizio</a></div>
    </div>
    <dl class="kit">${SITE.kit.map(([k, items]) => `<div><dt>${esc(k)}</dt><dd>${items.map((i) => `<span>${esc(i)}</span>`).join("")}</dd></div>`).join("")}</dl>
  </div></section>
</main>`;

  return html(page({
    active: "home",
    jsonLd: {
      "@context": "https://schema.org", "@type": "ProfessionalService",
      name: SITE.name, description: SITE.description, url: origin + "/",
      image: origin + "/assets/og.png", sameAs: [SITE.instagram],
      areaServed: "Sud Sardegna", knowsAbout: ["Fotografia sportiva", "Calcio dilettantistico"],
    },
    title: "",
    url: origin + "/",
    image: slides[0] ? origin + photoUrl(slides[0].key) : latest?.cover_key ? origin + photoUrl(latest.cover_key) : "",
    body,
  }));
});
