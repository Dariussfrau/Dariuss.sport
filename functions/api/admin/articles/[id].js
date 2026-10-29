import { deletePrefix, readArticleFields, slugFor, updateRow } from "../../../../src/admin-data.js";
import { getBucket, getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

const get = (DB, id) => DB.prepare(`SELECT * FROM articles WHERE id = ?`).bind(id).first();

export async function onRequestGet({ env, params }) {
  const article = await get(await getDb(env), Number(params.id));
  return article ? json({ article }) : json({ error: "Articolo non trovato." }, 404);
}

export async function onRequestPut({ env, params, request }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const current = await get(DB, id);
  if (!current) return json({ error: "Articolo non trovato." }, 404);

  const { values, error } = readArticleFields(await request.json().catch(() => ({})), { partial: true });
  if (error) return json({ error }, 400);
  if (values.title && values.title !== current.title) values.slug = await slugFor(DB, "articles", values.title, null, id);
  // Se la copertina è stata sostituita o tolta, elimina i file della vecchia.
  if ("cover_key" in values && current.cover_key && values.cover_key !== current.cover_key) {
    await deletePrefix(getBucket(env), `${current.cover_key}/`);
  }
  await updateRow(DB, "articles", id, values);
  return json({ article: await get(DB, id) });
}

export async function onRequestDelete({ env, params }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const current = await get(DB, id);
  if (!current) return json({ error: "Articolo non trovato." }, 404);
  if (current.cover_key) await deletePrefix(getBucket(env), `${current.cover_key}/`);
  await DB.prepare(`DELETE FROM articles WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}
