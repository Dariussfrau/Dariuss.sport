import { SITE } from "./config.js";
import { esc, formatDate } from "./util.js";

// Data di oggi in Italia, "2026-11-10".
export function todayRome() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
}

export async function loadMatches(DB) {
  const { results } = await DB.prepare(
    `SELECT m.*, a.slug AS album_slug, a.published AS album_published
     FROM matches m LEFT JOIN albums a ON a.id = m.album_id
     ORDER BY m.date DESC, m.time DESC, m.id DESC`
  ).all();
  return results;
}

const played = (m) => m.score_us != null && m.score_them != null;

// Prossima partita (la più vicina ancora da giocare) e ultimo risultato.
export function pickMatches(matches) {
  const today = todayRome();
  const upcoming = matches.filter((m) => !played(m) && m.date >= today);
  return {
    next: upcoming[upcoming.length - 1] || null,
    last: matches.find(played) || null,
  };
}

// Squadre e punteggio nell'ordine casa – trasferta.
export function matchView(m) {
  const us = SITE.team.name;
  const isPlayed = played(m);
  return {
    homeName: m.home ? us : m.opponent,
    awayName: m.home ? m.opponent : us,
    homeScore: isPlayed ? (m.home ? m.score_us : m.score_them) : null,
    awayScore: isPlayed ? (m.home ? m.score_them : m.score_us) : null,
    played: isPlayed,
    outcome: !isPlayed ? "" : m.score_us > m.score_them ? "Vittoria" : m.score_us < m.score_them ? "Sconfitta" : "Pareggio",
    albumUrl: m.album_slug && m.album_published ? `/album/${m.album_slug}` : "",
  };
}

const teams = (v) => `<span class="t">${esc(v.homeName)}</span>${v.played ? `<span class="score">${v.homeScore} – ${v.awayScore}</span>` : `<span class="vs">–</span>`}<span class="t">${esc(v.awayName)}</span>`;

export function matchMeta(m) {
  return [formatDate(m.date), m.time ? `ore ${esc(m.time)}` : "", esc(m.place)].filter(Boolean).join(" · ");
}

// Riquadro "Prossima partita" / "Ultimo risultato".
export function matchCard(m, label) {
  const v = matchView(m);
  return `<div class="mcard">
  <div class="mlabel">${label}${m.competition ? ` · ${esc(m.competition)}` : ""}</div>
  <div class="mteams">${teams(v)}</div>
  <div class="mmeta">${matchMeta(m)}</div>
  ${v.albumUrl ? `<a class="mlink" href="${v.albumUrl}">Guarda l'album →</a>` : ""}
</div>`;
}

// Riga dell'elenco della stagione.
export function matchRow(m) {
  const v = matchView(m);
  return `<li class="mrow">
  <time datetime="${esc(m.date)}">${formatDate(m.date)}</time>
  <div class="mteams">${teams(v)}</div>
  <div class="mside">
    ${m.competition ? `<span class="chip">${esc(m.competition)}</span>` : ""}
    ${v.played ? `<span class="outcome o-${v.outcome[0].toLowerCase()}">${v.outcome}</span>` : `<span class="outcome">Da giocare</span>`}
    ${v.albumUrl ? `<a class="mlink" href="${v.albumUrl}">Album →</a>` : ""}
  </div>
</li>`;
}

// Maglia di casa della squadra: rossa, banda gialla centrale dai bordi "a pennellata", colletto e bordi manica gialli.
const JERSEY_BAND = "M28 13.0 L24.6 14.5 L28 16.0 L25.4 17.5 L27.5 19.0 L24.6 20.5 L28 22.0 L24.6 23.5 L28 25.0 L25.4 26.5 L27.5 28.0 L24.6 29.5 L28 31.0 L26.2 32.5 L27.5 34.0 L24.6 35.5 L27.5 37.0 L25.4 38.5 L28 40.0 L26.2 41.5 L28 43.0 L24.6 44.5 L27.5 46.0 L24.6 47.5 L28 49.0 L24.6 50.5 L28 52.0 L26.2 53.5 L28 55.0 L25.4 56.5 L28 58.0 L36 58.0 L38.6 56.5 L36 55.0 L38.6 53.5 L36 52.0 L39.4 50.5 L36.5 49.0 L39.4 47.5 L36.5 46.0 L39.4 44.5 L36.5 43.0 L38.6 41.5 L36.5 40.0 L39.4 38.5 L36.5 37.0 L39.4 35.5 L36.5 34.0 L37.8 32.5 L36.5 31.0 L37.8 29.5 L36 28.0 L37.8 26.5 L36.5 25.0 L37.8 23.5 L36.5 22.0 L38.6 20.5 L36.5 19.0 L39.4 17.5 L36.5 16.0 L38.6 14.5 L36.5 13.0 Z";
export function jersey(size = 72) {
  const { yellow, red } = SITE.team;
  const shirt = "M22 6 L8 12 L2 26 L12 31 L16 24 V58 H48 V24 L52 31 L62 26 L56 12 L42 6 C40 11 36 13 32 13 C28 13 24 11 22 6 Z";
  return `<svg class="jersey" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Maglia del ${esc(SITE.team.name)}, rossa con banda gialla">
  <path d="${shirt}" fill="${red}"/>
  <path d="${JERSEY_BAND}" fill="${yellow}"/>
  <path d="M3.4 23.6 L13.2 28.6 M60.6 23.6 L50.8 28.6" fill="none" stroke="${yellow}" stroke-width="2.4"/>
  <path d="M22 6 C24 11 28 13 32 13 C36 13 40 11 42 6" fill="none" stroke="${yellow}" stroke-width="3" stroke-linecap="round"/>
  <path d="${shirt}" fill="none" stroke="#8C1319" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`;
}
