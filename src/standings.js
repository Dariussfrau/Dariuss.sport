import { LEAGUE, LEAGUE_START, SITE } from "./config.js";
import { esc, formatDate } from "./util.js";
import { getSettings } from "./settings.js";

// Classifica del girone: una riga per squadra, aggiornata a mano dal pannello.
export async function loadStandings(DB) {
  let { results } = await DB.prepare(`SELECT team, points, played FROM standings`).all();
  if (!results.length) {
    // Primo avvio: le squadre del girone con i punti di partenza indicati in config.
    await DB.batch(LEAGUE.map((team) => DB.prepare(`INSERT OR IGNORE INTO standings (team, points, played) VALUES (?, ?, 0)`).bind(team, LEAGUE_START[team] || 0)));
    ({ results } = await DB.prepare(`SELECT team, points, played FROM standings`).all());
  }
  results.sort((a, b) => b.points - a.points || a.team.localeCompare(b.team, "it"));
  const { standings_updated } = await getSettings(DB, ["standings_updated"]);
  return { rows: results, updated: standings_updated || "" };
}

export function standingsTable({ rows, updated }) {
  const showPlayed = rows.some((r) => r.played > 0);
  return `<div class="standings-wrap"><table class="standings">
  <caption>Seconda Categoria · Girone B${updated ? ` · aggiornata al ${formatDate(updated)}` : ""}</caption>
  <thead><tr><th scope="col" class="pos">Pos.</th><th scope="col">Squadra</th>${showPlayed ? '<th scope="col" class="num">Giocate</th>' : ""}<th scope="col" class="num">Punti</th></tr></thead>
  <tbody>${rows.map((r, i) => `<tr${r.team === SITE.team.name ? ' class="us"' : ""}><td class="pos">${i + 1}</td><th scope="row">${esc(r.team)}</th>${showPlayed ? `<td class="num">${r.played}</td>` : ""}<td class="num pts">${r.points}</td></tr>`).join("")}</tbody>
</table></div>`;
}
