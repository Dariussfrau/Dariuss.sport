import { LEAGUE } from "../../src/config.js";
import { getDb } from "../../src/db.js";
import { json } from "../../src/util.js";

const TOP = `SELECT id, name, team, score, beaten FROM scores ORDER BY score DESC, id LIMIT 10`;
const MAX_ROUNDS = LEAGUE.length - 1;

// Classifica del gioco dei rigori: i dieci punteggi migliori.
export async function onRequestGet({ env }) {
  try {
    const DB = await getDb(env);
    return json({ scores: (await DB.prepare(TOP).all()).results });
  } catch (err) {
    console.error(err);
    return json({ scores: [] }, 503);
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const DB = await getDb(env);
    const input = await request.json().catch(() => ({}));
    const name = String(input.name || "").trim().replace(/\s+/g, " ");
    const score = Number(input.score), beaten = Number(input.beaten);
    if (!/^[\p{L}\p{N} ._'-]{2,16}$/u.test(name)) return json({ error: "Scrivi un nome di 2–16 caratteri (lettere e numeri)." }, 400);
    if (!LEAGUE.includes(input.team)) return json({ error: "Squadra non valida." }, 400);
    // Limiti di plausibilità: al massimo 250 punti a rigore e 200 di premio per ogni squadra battuta.
    const valid = Number.isInteger(score) && Number.isInteger(beaten) && beaten >= 0 && beaten <= MAX_ROUNDS
      && score >= 0 && score <= Math.min(beaten + 1, MAX_ROUNDS) * 5 * 250 + beaten * 200;
    if (!valid) return json({ error: "Punteggio non valido." }, 400);

    const res = await DB.prepare(`INSERT INTO scores (name, team, score, beaten) VALUES (?, ?, ?, ?)`).bind(name, input.team, score, beaten).run();
    // Si conservano solo i 200 punteggi migliori.
    await DB.prepare(`DELETE FROM scores WHERE id NOT IN (SELECT id FROM scores ORDER BY score DESC, id LIMIT 200)`).run();
    const scores = (await DB.prepare(TOP).all()).results;
    const rank = scores.findIndex((s) => s.id === res.meta.last_row_id) + 1;
    return json({ scores, rank }, 201);
  } catch (err) {
    console.error(err);
    return json({ error: "Punteggio non salvato, riprova tra poco." }, 503);
  }
}
