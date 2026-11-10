import { getDb } from "../../../src/db.js";
import { getSettings, setSetting } from "../../../src/settings.js";
import { json } from "../../../src/util.js";

// Titolo e testo (cronaca) che accompagnano la "Foto della settimana" in home.
export async function onRequestGet({ env }) {
  const s = await getSettings(await getDb(env), ["week_title", "week_text"]);
  return json({ title: s.week_title || "", text: s.week_text || "" });
}

export async function onRequestPut({ env, request }) {
  const DB = await getDb(env);
  const input = await request.json().catch(() => ({}));
  const title = String(input.title || "").trim().slice(0, 120);
  const text = String(input.text || "").trim().slice(0, 4000);
  await DB.batch([setSetting(DB, "week_title", title), setSetting(DB, "week_text", text)]);
  return json({ title, text });
}
