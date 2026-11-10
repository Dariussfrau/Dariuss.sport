import { LEAGUE, LEAGUE_COLORS } from "./config.js";

// Squadre del girone con i due colori sociali, per il gioco dei rigori.
export const leagueTeams = () => LEAGUE.map((name) => {
  const [c1, c2] = LEAGUE_COLORS[name] || ["#43703F", "#F2EEE6"];
  return { name, c1, c2 };
});

// Scudetto disegnato con i colori sociali (provvisorio: va sostituito dallo stemma ufficiale quando disponibile).
export function shield(c1, c2, size = 36) {
  const outline = "M3 3 H29 V17 C29 25 23 30 16 32 C9 30 3 25 3 17 Z";
  return `<svg class="shield" width="${size}" height="${size}" viewBox="0 0 32 35" aria-hidden="true">
  <path d="${outline}" fill="${c1}"/><path d="M16 3 H29 V17 C29 25 23 30 16 32 Z" fill="${c2}"/>
  <path d="${outline}" fill="none" stroke="#1E3A1E" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;
}
