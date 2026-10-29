import { insertRow, readArticleFields, slugFor } from "../../../../src/admin-data.js";
import { getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

export async function onRequestGet({ env }) {
  const DB = await getDb(env);
  const { results } = await DB.prepare(`SELECT id, slug, title, date, published, cover_key FROM articles ORDER BY date DESC, id DESC`).all();
  return json({ articles: results });
}

export async function onRequestPost({ env, request }) {
  const DB = await getDb(env);
  const { values, error } = readArticleFields(await request.json().catch(() => ({})));
  if (error) return json({ error }, 400);
  values.slug = await slugFor(DB, "articles", values.title, values.date);
  const id = await insertRow(DB, "articles", values);
  return json({ article: await DB.prepare(`SELECT * FROM articles WHERE id = ?`).bind(id).first() }, 201);
}
