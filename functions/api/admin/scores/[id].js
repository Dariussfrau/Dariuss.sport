import { getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

export async function onRequestDelete({ env, params }) {
  const DB = await getDb(env);
  await DB.prepare(`DELETE FROM scores WHERE id = ?`).bind(Number(params.id)).run();
  return json({ ok: true });
}
