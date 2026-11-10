import { SITE } from "../src/config.js";
import { leagueTeams, shield } from "../src/league.js";
import { jersey } from "../src/matches.js";
import { ASSET_VERSION, page, withErrors } from "../src/templates.js";
import { esc, html } from "../src/util.js";

// Mini-gioco "Il campionato dei rigori": scegli una squadra del girone e sfida le altre.
export const onRequestGet = withErrors(async ({ request }) => {
  const teams = leagueTeams();
  const body = `<main class="wrap listing">
  <div class="d-head"><div class="eyebrow">Mini-gioco</div><h1>Il campionato dei rigori</h1>
    <p>Scegli la tua squadra e sfida, una dopo l'altra, le altre del girone. Cinque rigori a turno: te ne servono tre per passare.</p></div>

  <div class="rigori" id="rigori">
    <section data-view="pick">
      <div class="sec-head"><h2>Scegli la tua squadra</h2><span>Seconda Categoria · Girone B</span></div>
      <div class="rg-teams">${teams.map((t) => `<button type="button" class="rg-team" data-team="${esc(t.name)}">${t.name === SITE.team.name ? jersey(40) : shield(t.c1, t.c2, 40)}<span>${esc(t.name)}</span></button>`).join("")}</div>
    </section>

    <section data-view="play" hidden>
      <div class="rg-hud"><span class="rg-vs" id="rg-vs"></span><span class="rg-dots" id="rg-dots" role="img"></span><span class="rg-score"><b id="rg-score">0</b> punti</span></div>
      <div class="rg-stage">
        <canvas id="rg-canvas" tabindex="0" aria-label="Campo di gioco. Trascina verso la porta per tirare, oppure usa le frecce sinistra, su e destra."></canvas>
        <div class="rg-msg" id="rg-msg" hidden aria-live="assertive"></div>
        <div class="rg-panel" id="rg-panel" hidden></div>
      </div>
      <p class="rg-hint" id="rg-hint">Trascina il dito (o il mouse) verso la porta per tirare. Mira lontano dal portiere.</p>
    </section>

    <section class="rg-board">
      <div class="sec-head"><h2>Classifica</h2><span>I dieci punteggi migliori</span></div>
      <ol id="rg-board"><li class="empty">Caricamento…</li></ol>
    </section>
  </div>
</main>
<script type="application/json" id="rigori-data">${JSON.stringify(teams).replace(/</g, "\\u003c")}</script>`;

  return html(page({
    active: "villaperuccio",
    title: "Il campionato dei rigori",
    description: "Mini-gioco: scegli una squadra della Seconda Categoria Girone B e sfida le altre ai rigori.",
    url: request.url,
    body,
    scripts: `<script src="/assets/rigori.js?v=${ASSET_VERSION}" defer></script>`,
  }));
});
