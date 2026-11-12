import { SITE } from "../../src/config.js";
import { getDb } from "../../src/db.js";
import { mapsLink, SEASON, shortDate, teamFixtures, venueLine } from "../../src/calendar.js";
import { loadMatches, todayRome } from "../../src/matches.js";
import { page, withErrors } from "../../src/templates.js";
import { esc, html } from "../../src/util.js";

const us = SITE.team.name;
const teamName = (name) => (name === us ? `<b class="us">${esc(name)}</b>` : esc(name));

// Risultato nell'ordine casa – trasferta, se la partita è stata inserita dal pannello con il punteggio.
function result(f) {
  const m = f.entered;
  if (!m || m.score_us == null) return null;
  const [h, a] = f.isHome ? [m.score_us, m.score_them] : [m.score_them, m.score_us];
  const outcome = m.score_us > m.score_them ? "v" : m.score_us < m.score_them ? "s" : "p";
  return { text: `${h} – ${a}`, outcome, album: m.album_slug && m.album_published ? `/album/${m.album_slug}` : "" };
}

function roundRow(f, nextN, today) {
  const others = f.matches.filter((m) => m.home !== us && m.away !== us);
  const restLine = `<li class="cal-rest">Riposa: ${teamName(f.resting)}</li>`;
  const allMatches = `<ul class="cal-others">
      ${others.map((m) => `<li><span>${esc(m.home)} – ${esc(m.away)}</span><small>${shortDate(m.date)} · ${m.time}</small></li>`).join("")}
      ${f.rest === true ? "" : restLine}
    </ul>`;

  if (f.rest === true) {
    return `<li class="cal-item is-rest${f.date < today ? " past" : ""}"><details>
    <summary><span class="cal-n">${f.n}</span><span class="cal-when">${shortDate(f.date)}</span><span class="cal-teams"><b class="us">${esc(us)}</b> riposa</span><span class="cal-side"><span class="chip">Riposo</span></span></summary>
    <div class="cal-body"><p class="cal-h">Le partite della giornata</p>${allMatches}</div>
  </details></li>`;
  }

  const res = result(f);
  const isNext = f.n === nextN;
  const past = !isNext && f.date < today;
  const side = res
    ? `<span class="cal-res o-${res.outcome}">${res.text}</span>`
    : isNext ? `<span class="chip next">Prossima</span>` : `<span class="chip${f.isHome ? " home" : ""}">${f.isHome ? "Casa" : "Trasferta"}</span>`;

  return `<li class="cal-item${isNext ? " is-next" : ""}${past ? " past" : ""}"${isNext ? ' id="prossima"' : ""}><details${isNext ? " open" : ""}>
    <summary>
      <span class="cal-n">${f.n}</span>
      <span class="cal-when">${shortDate(f.date)}<small>ore ${f.time}</small></span>
      <span class="cal-teams">${teamName(f.homeTeam)}<span class="dash">–</span>${teamName(f.awayTeam)}</span>
      <span class="cal-side">${side}</span>
    </summary>
    <div class="cal-body">
      ${f.venue ? `<p class="cal-venue"><span>${venueLine(f.venue)}</span><a href="${mapsLink(f.venue)}" target="_blank" rel="noopener">Mappa ↗</a></p>` : ""}
      ${f.sat ? `<p class="cal-note">Si gioca di sabato: il campo di casa ha la deroga al sabato (data ufficiale del calendario: ${shortDate(f.roundDate)}).</p>` : ""}
      ${res && res.album ? `<p><a class="mlink" href="${res.album}">Guarda l'album della partita →</a></p>` : ""}
      <p class="cal-h">Le altre partite della giornata</p>
      ${allMatches}
    </div>
  </details></li>`;
}

// Calendario della stagione: le 30 giornate del Villaperuccio, con campi, risultati e tutte le partite del girone.
export const onRequestGet = withErrors(async ({ env, request }) => {
  const DB = await getDb(env);
  const entered = await loadMatches(DB);
  const today = todayRome();
  const fixtures = teamFixtures(entered);
  const next = fixtures.find((f) => !f.rest && f.date >= today && !(f.entered && f.entered.score_us != null));
  const legs = [["andata", "Andata"], ["ritorno", "Ritorno"]];
  const homeCount = fixtures.filter((f) => !f.rest && f.isHome).length;

  const body = `<main class="wrap listing calendar">
  <a class="back" href="/villaperuccio">← Villaperuccio</a>
  <div class="d-head"><div class="eyebrow">Seconda Categoria · Girone B</div><h1>Calendario ${SEASON}</h1>
    <p>Le 30 giornate del ${esc(us)}: ${homeCount} partite in casa, ${fixtures.length - homeCount - 2} in trasferta e due turni di riposo. Tocca una giornata per vedere il campo e le altre partite del girone.</p></div>
  <div class="cal-info">
    <span><b>Orari ufficiali</b> 15:00 con l'ora solare, 16:00 con l'ora legale.</span>
    <span><b>Sabato</b> In casa il ${esc(us)} gioca il sabato (deroga del campo): le date sono già aggiornate.</span>
    ${next ? `<a class="btn solid" href="#prossima">Vai alla prossima partita</a>` : ""}
  </div>
  ${legs.map(([leg, label]) => `<section class="cal-leg">
    <div class="sec-head"><h2>${label}</h2><span>Giornate ${leg === "andata" ? "1–15" : "16–30"}</span></div>
    <ol class="cal-list">${fixtures.filter((f) => f.leg === leg).map((f) => roundRow(f, next && next.n, today)).join("")}</ol>
  </section>`).join("")}
  <p class="cal-source">Fonte: calendario ufficiale della Seconda Categoria ${SEASON}, Comitato Regionale Sardegna LND. Date e orari possono essere modificati dal Comitato.</p>
</main>`;

  return html(page({
    active: "villaperuccio",
    title: `Calendario ${SEASON}`,
    description: `Calendario ${SEASON} del ${us} in Seconda Categoria, Girone B: giornate, date, orari e campi.`,
    url: request.url,
    body,
  }));
});
