import { applyPassword, deletePrefix, photoRow, readAlbumFields, slugFor, updateRow } from "../../../../src/admin-data.js";
import { ALBUM_SELECT, getBucket, getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

const publicAlbum = ({ password_hash, ...a }) => ({ ...a, has_password: Boolean(password_hash) });

async function load(DB, id) {
  const album = await DB.prepare(`${ALBUM_SELECT} WHERE a.id = ?`).bind(id).first();
  if (!album) return null;
  const { results } = await DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY position, id`).bind(id).all();
  return { album: publicAlbum(album), photos: results.map(photoRow) };
}

export async function onRequestGet({ env, params }) {
  const data = await load(await getDb(env), Number(params.id));
  return data ? json(data) : json({ error: "Album non trovato." }, 404);
}

export async function onRequestPut({ env, params, request }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const current = await DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(id).first();
  if (!current) return json({ error: "Album non trovato." }, 404);

  const input = await request.json().catch(() => ({}));
  const { values, error } = readAlbumFields(input, { partial: true });
  if (error) return json({ error }, 400);
  await applyPassword(values, input);
  // Lo slug (l'indirizzo della pagina) cambia solo se cambiano titolo o data.
  const title = values.title ?? current.title, date = values.date ?? current.date;
  if (title !== current.title || date !== current.date) values.slug = await slugFor(DB, "albums", title, date, id);
  await updateRow(DB, "albums", id, values);
  return json(await load(DB, id));
}

export async function onRequestDelete({ env, params }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const bucket = getBucket(env);
  await deletePrefix(bucket, `photos/${id}/`);
  await deletePrefix(bucket, `originals/${id}/`);
  await DB.batch([
    DB.prepare(`DELETE FROM photos WHERE album_id = ?`).bind(id),
    DB.prepare(`DELETE FROM albums WHERE id = ?`).bind(id),
  ]);
  return json({ ok: true });
}
