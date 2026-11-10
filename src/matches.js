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

// Maglia della squadra disegnata con i colori sociali.
export function jersey(size = 72) {
  const { yellow, red } = SITE.team;
  return `<svg class="jersey" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Maglia del ${esc(SITE.team.name)}, gialla e rossa">
  <path d="M22 6 L8 12 L2 26 L12 31 L16 24 V58 H48 V24 L52 31 L62 26 L56 12 L42 6 C40 11 36 13 32 13 C28 13 24 11 22 6 Z" fill="${yellow}" stroke="#1E3A1E" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M8 12 L2 26 L12 31 L16 24 L16 15 Z M56 12 L62 26 L52 31 L48 24 L48 15 Z" fill="${red}" stroke="#1E3A1E" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M22 6 C24 11 28 13 32 13 C36 13 40 11 42 6" fill="none" stroke="${red}" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;
}
