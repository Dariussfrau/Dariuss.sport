import { insertRow, readMatchFields } from "../../../../src/admin-data.js";
import { getDb } from "../../../../src/db.js";
import { loadMatches } from "../../../../src/matches.js";
import { json } from "../../../../src/util.js";

export async function onRequestGet({ env }) {
  return json({ matches: await loadMatches(await getDb(env)) });
}

export async function onRequestPost({ env, request }) {
  const DB = await getDb(env);
  const { values, error } = readMatchFields(await request.json().catch(() => ({})));
  if (error) return json({ error }, 400);
  const id = await insertRow(DB, "matches", values);
  return json({ match: await DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(id).first() }, 201);
}
