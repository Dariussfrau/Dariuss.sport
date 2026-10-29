import { getDb } from "../../src/db.js";
import { renderMarkdown } from "../../src/markdown.js";
import { notFound, page, readingTime, withErrors } from "../../src/templates.js";
import { esc, formatDate, html, photoUrl } from "../../src/util.js";

export const onRequestGet = withErrors(async ({ env, params, request }) => {
  const DB = await getDb(env);
  const a = await DB.prepare(`SELECT * FROM articles WHERE slug = ? AND published = 1`).bind(params.slug).first();
  if (!a) return html(notFound("Articolo"), 404);
  const origin = new URL(request.url).origin;

  const body = `<main class="wrap">
  <a class="back" href="/articoli">← Tutti gli articoli</a>
  <article class="prose">
    <div class="d-head">
      <div class="meta"><span class="chip">Taccuino</span><span>${formatDate(a.date)}</span><span>${readingTime(a.body)} di lettura</span></div>
      <h1>${esc(a.title)}</h1>
      ${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ""}
    </div>
    ${a.cover_key ? `<figure class="cover-fig"><img src="${photoUrl(a.cover_key)}" alt=""></figure>` : ""}
    ${renderMarkdown(a.body)}
  </article>
</main>`;

  return html(page({
    title: a.title,
    description: a.excerpt || "",
    url: request.url,
    image: a.cover_key ? origin + photoUrl(a.cover_key) : "",
    body,
  }));
});
