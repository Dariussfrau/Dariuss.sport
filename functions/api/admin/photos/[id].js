import { getBucket, getDb } from "../../../../src/db.js";
import { json } from "../../../../src/util.js";

// Mette o toglie la foto dalle "foto in evidenza" che scorrono in home.
export async function onRequestPut({ env, params, request }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const { featured } = await request.json().catch(() => ({}));
  const res = await DB.prepare(`UPDATE photos SET featured = ? WHERE id = ?`).bind(featured ? 1 : 0, id).run();
  if (!res.meta.changes) return json({ error: "Foto non trovata." }, 404);
  return json({ ok: true, featured: featured ? 1 : 0 });
}

export async function onRequestDelete({ env, params }) {
  const DB = await getDb(env);
  const id = Number(params.id);
  const photo = await DB.prepare(`SELECT * FROM photos WHERE id = ?`).bind(id).first();
  if (!photo) return json({ error: "Foto non trovata." }, 404);

  const uuid = photo.key.split("/").pop();
  await getBucket(env).delete([
    `${photo.key}/thumb.jpg`, `${photo.key}/display.jpg`, `${photo.key}/hd.jpg`,
    `originals/${photo.album_id}/${uuid}`,
  ]);
  await DB.batch([
    DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(id),
    DB.prepare(`UPDATE albums SET cover_photo_id = NULL WHERE cover_photo_id = ?`).bind(id),
  ]);
  return json({ ok: true });
}
