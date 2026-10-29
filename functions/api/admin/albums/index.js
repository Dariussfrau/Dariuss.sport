import { applyPassword, insertRow, readAlbumFields, slugFor } from "../../../../src/admin-data.js";
import { ALBUM_SELECT, getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

const publicAlbum = ({ password_hash, ...a }) => ({ ...a, has_password: Boolean(password_hash) });

export async function onRequestGet({ env }) {
  const DB = await getDb(env);
  const { results } = await DB.prepare(`${ALBUM_SELECT} ORDER BY a.date DESC, a.id DESC`).all();
  return json({ albums: results.map(publicAlbum) });
}

export async function onRequestPost({ env, request }) {
  const DB = await getDb(env);
  const input = await request.json().catch(() => ({}));
  const { values, error } = readAlbumFields(input);
  if (error) return json({ error }, 400);
  await applyPassword(values, input);
  values.slug = await slugFor(DB, "albums", values.title, values.date);
  const id = await insertRow(DB, "albums", values);
  const album = await DB.prepare(`${ALBUM_SELECT} WHERE a.id = ?`).bind(id).first();
  return json({ album: publicAlbum(album) }, 201);
}
