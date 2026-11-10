import { getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

// Classifica dei rigori vista dal pannello (per poter togliere i nomi inopportuni).
export async function onRequestGet({ env }) {
  const DB = await getDb(env);
  const { results } = await DB.prepare(`SELECT id, name, team, score, beaten, created_at FROM scores ORDER BY score DESC, id LIMIT 30`).all();
  return json({ scores: results });
}
