import { SITE } from "../src/config.js";
import { getDb } from "../src/db.js";
import { jersey, loadMatches, matchCard, matchRow, pickMatches } from "../src/matches.js";
import { page, withErrors } from "../src/templates.js";
import { esc, html } from "../src/util.js";

// Pagina della squadra: prossima partita, ultimo risultato e stagione con gli album collegati.
export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const matches = await loadMatches(DB);
  const { next, last } = pickMatches(matches);
  const team = esc(SITE.team.name);

  const body = `<main class="wrap listing team">
  <div class="team-head">
    ${jersey(96)}
    <div class="d-head"><div class="eyebrow">La squadra che seguo</div><h1>${team}</h1><p>La stagione raccontata da bordo campo: partite, risultati e album fotografici.</p></div>
  </div>
  <div class="team-stripe" aria-hidden="true"></div>
  ${next || last ? `<div class="mcards">${next ? matchCard(next, "Prossima partita") : ""}${last ? matchCard(last, "Ultimo risultato") : ""}</div>` : ""}
  <div class="sec-head"><h2>Partite</h2><span>${matches.length ? `${matches.length} in calendario` : ""}</span></div>
  ${matches.length ? `<ul class="mlist">${matches.map(matchRow).join("")}</ul>` : `<p class="empty">Il calendario arriva presto.</p>`}
</main>`;

  return html(page({
    active: "villaperuccio",
    title: SITE.team.name,
    description: `Partite, risultati e album fotografici del ${SITE.team.name}.`,
    url: request.url,
    body,
  }));
});
