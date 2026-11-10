import { readMatchFields, updateRow } from "../../../../src/admin-data.js";
import { getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

const get = (DB, id) => DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(id).first();

export async function onRequestGet({ env, params }) {
  const match = await get(await getDb(env), Number(params.id));
  return match ? json({ match }) : json({ error: "Partita non trovata." }, 404);
}

export async function onRequestPut({ env, params, request }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  if (!(await get(DB, id))) return json({ error: "Partita non trovata." }, 404);
  const { values, error } = readMatchFields(await request.json().catch(() => ({})));
  if (error) return json({ error }, 400);
  await updateRow(DB, "matches", id, values);
  return json({ match: await get(DB, id) });
}

export async function onRequestDelete({ env, params }) {
  const DB = await getDb(env);
  await DB.prepare(`DELETE FROM matches WHERE id = ?`).bind(Number(params.id)).run();
  return json({ ok: true });
}
