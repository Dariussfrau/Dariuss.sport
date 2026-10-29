import { getDb } from "../../src/db.js";
import { articleRow, page, withErrors } from "../../src/templates.js";
import { html } from "../../src/util.js";

export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const { results } = await DB.prepare(`SELECT * FROM articles WHERE published = 1 ORDER BY date DESC, id DESC`).all();
  const body = `<main class="wrap listing">
  <div class="d-head"><div class="eyebrow">Taccuino</div><h1>Articoli</h1><p>Racconti e note dalla giornata sportiva.</p></div>
  ${results.length ? `<div class="list">${results.map(articleRow).join("")}</div>` : `<p class="empty">Nessun articolo per ora.</p>`}
</main>`;
  return html(page({ title: "Articoli", url: request.url, body }));
});
