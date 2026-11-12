import { SITE } from "./config.js";
import { ROUNDS, SEASON } from "./calendar-data.js";
import { esc } from "./util.js";

export { ROUNDS, SEASON };

// Campi di gioco del girone (dall'elenco ufficiale del calendario). "sat" = deroga: in casa si gioca il sabato.
export const VENUES = {
  "Carbonia 1939": { field: "Stadio Carlo Zoboli", town: "Carbonia" },
  "Carloforte": { field: "Comunale Puggioni – Le Saline", town: "Carloforte" },
  "Domusnovas J. S. E.": { field: "Comunale Sergio Mancosu", town: "Villamassargia" },
  "Asseminese": { field: "Comunale Santa Maria", town: "Assemini" },
  "Matzaccarese": { field: "Campo di Matzaccara", town: "San Giovanni Suergiu", sat: true },
  "P. G. S. Audax": { field: "Frutti d'Oro – Albatros", town: "Capoterra" },
  "Villaperuccio": { field: "Comunale Villaperuccio", town: "Villaperuccio", sat: true },
  "AC Cortoghiana": { field: "Stadio comunale di Cortoghiana", town: "Carbonia", sat: true },
  "Atletico Uta": { field: "Comunale Bascus Argius", town: "Uta", sat: true },
  "Barbusi": { field: "Campo di Barbusi", town: "Carbonia", sat: true },
  "Bindua": { field: "Polifunzionale Ceramica", town: "Iglesias" },
  "Sant'Anna Arresi": { field: "Comunale Sant'Anna Arresi", town: "Sant'Anna Arresi", sat: true },
  "Teulada Calcio": { field: "Comunale De Gasperi", town: "Teulada", sat: true },
  "Ussana Calcio": { field: "Comunale Sa Nuraxedda", town: "Barrali" },
  "Decimomannu Calcio": { field: "Stadio Dessì-Locci – Le Aie", town: "Decimomannu" },
};

const DAYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

// "2026-09-26" -> "sab 26 set"
export function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const dayDiff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 864e5;

// Partita del calendario corrispondente a una partita inserita dal pannello (stesso avversario, data entro un giorno).
function findEntered(fixture, entered) {
  const opp = norm(fixture.opponent);
  return entered.find((m) => {
    const o = norm(m.opponent);
    return dayDiff(m.date, fixture.date) <= 1 && o && (o === opp || o.includes(opp) || opp.includes(o));
  });
}

// Le 30 giornate viste dal Villaperuccio: partita (o riposo), campo e risultato se inserito dal pannello.
export function teamFixtures(entered = []) {
  const us = SITE.team.name;
  return ROUNDS.map((r) => {
    const m = r.matches.find((x) => x.home === us || x.away === us);
    if (!m) return { ...r, resting: r.rest, rest: true };
    const home = m.home === us;
    const fixture = { ...r, ...m, roundDate: r.date, home, isHome: home, opponent: home ? m.away : m.home, venue: VENUES[m.home], resting: r.rest, rest: false, homeTeam: m.home, awayTeam: m.away };
    fixture.entered = findEntered(fixture, entered) || null;
    return fixture;
  });
}

// Prossima partita dal calendario ufficiale, nel formato delle partite del pannello.
export function nextFromCalendar(today, entered = []) {
  const f = teamFixtures(entered).find((x) => !x.rest && x.date >= today && !(x.entered && x.entered.score_us != null));
  if (!f) return null;
  return {
    date: f.date, time: f.time, opponent: f.opponent, home: f.isHome ? 1 : 0,
    place: f.venue ? `${f.venue.field}, ${f.venue.town}` : "",
    competition: `Seconda Categoria · ${f.n}ª giornata`,
    score_us: null, score_them: null, album_slug: null, album_published: 0,
  };
}

export const mapsLink = (v) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.field} ${v.town}`)}`;

export const venueLine = (v) => (v ? `${esc(v.field)} · ${esc(v.town)}` : "");
