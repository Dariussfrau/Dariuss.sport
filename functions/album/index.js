import { ALBUM_SELECT, getDb } from "../../src/db.js";
import { albumCard, page, withErrors } from "../../src/templates.js";
import { html } from "../../src/util.js";

export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const { results } = await DB.prepare(`${ALBUM_SELECT} WHERE a.published = 1 ORDER BY a.date DESC, a.id DESC`).all();
  const body = `<main class="wrap listing">
  <div class="d-head"><div class="eyebrow">Archivio</div><h1>Album</h1><p>${results.length} album. Apri una partita per vedere le foto e scaricare le tue in HD.</p></div>
  ${results.length ? `<div class="grid">${results.map(albumCard).join("")}</div>` : `<p class="empty">Nessun album pubblicato per ora.</p>`}
</main>`;
  return html(page({ title: "Album", url: request.url, body }));
});
