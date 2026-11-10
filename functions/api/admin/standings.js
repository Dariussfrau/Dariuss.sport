import { LEAGUE } from "../../../src/config.js";
import { getDb } from "../../../src/db.js";
import { setSetting } from "../../../src/settings.js";
import { loadStandings } from "../../../src/standings.js";
import { json, todayIso } from "../../../src/util.js";

export async function onRequestGet({ env }) {
  return json(await loadStandings(await getDb(env)));
}

// Salva punti e partite giocate di tutte le squadre in un colpo solo.
export async function onRequestPut({ env, request }) {
  const DB = await getDb(env);
  const { rows } = await request.json().catch(() => ({}));
  if (!Array.isArray(rows)) return json({ error: "Dati mancanti." }, 400);
  const statements = [];
  for (const r of rows) {
    const points = Number(r.points), played = Number(r.played || 0);
    if (!LEAGUE.includes(r.team)) return json({ error: "Squadra non valida." }, 400);
    if (!Number.isInteger(points) || points < -20 || points > 200 || !Number.isInteger(played) || played < 0 || played > 60) {
      return json({ error: `Controlla i numeri di ${r.team}.` }, 400);
    }
    statements.push(DB.prepare(`INSERT INTO standings (team, points, played) VALUES (?, ?, ?) ON CONFLICT(team) DO UPDATE SET points = excluded.points, played = excluded.played`).bind(r.team, points, played));
  }
  statements.push(setSetting(DB, "standings_updated", todayIso()));
  await DB.batch(statements);
  return json(await loadStandings(DB));
}
