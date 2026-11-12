import { SITE } from "../src/config.js";
import { getDb } from "../src/db.js";
import { jersey, loadMatches, matchCard, matchRow, pickMatches } from "../src/matches.js";
import { SEASON } from "../src/calendar.js";
import { loadStandings, standingsTable } from "../src/standings.js";
import { page, withErrors } from "../src/templates.js";
import { esc, html } from "../src/util.js";

// Pagina della squadra: prossima partita, ultimo risultato e stagione con gli album collegati.
export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const matches = await loadMatches(DB);
  const standings = await loadStandings(DB);
  const { next, last } = pickMatches(matches);
  const team = esc(SITE.team.name);

  const body = `<main class="wrap listing team">
  <div class="team-bar">
    <span class="eyebrow">ASD Villaperuccio · Seconda Categoria · Girone B</span>
    <div class="team-actions"><a class="btn solid" href="/villaperuccio/calendario">Calendario ${SEASON}</a><a class="btn" href="#classifica">Classifica</a></div>
  </div>
  <figure class="team-photo">
    <picture>
      <source media="(max-width: 760px)" srcset="/assets/villaperuccio-squadra.jpg" width="1000" height="750">
      <img src="/assets/villaperuccio-squadra-larga.jpg" width="1333" height="750" fetchpriority="high"
        alt="La squadra dell'ASD Villaperuccio festeggia in campo, con i tifosi in tribuna alle spalle">
    </picture>
  </figure>
  <div class="team-head">
    ${jersey(96)}
    <div class="d-head"><div class="eyebrow">La squadra che seguo</div><h1>${team}</h1><p>La stagione raccontata da bordo campo: partite, risultati, classifica e album fotografici.</p></div>
  </div>
  <div class="team-stripe" aria-hidden="true"></div>
  ${next || last ? `<div class="mcards">${next ? matchCard(next, "Prossima partita") : ""}${last ? matchCard(last, "Ultimo risultato") : ""}</div>` : ""}
  <div class="cal-cta"><a class="btn solid" href="/villaperuccio/calendario">Calendario completo</a></div>
  ${matches.length ? `<ul class="mlist">${matches.map(matchRow).join("")}</ul>` : ""}
  <div class="sec-head standings-head" id="classifica"><h2>Classifica</h2><span>Seconda Categoria · Girone B</span></div>
  ${standingsTable(standings)}
</main>`;

  return html(page({
    active: "villaperuccio",
    title: SITE.team.name,
    description: `Partite, risultati e album fotografici del ${SITE.team.name}.`,
    url: request.url,
    body,
  }));
});
