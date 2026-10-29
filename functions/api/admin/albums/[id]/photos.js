import { photoRow } from "../../../../../src/admin-data.js";
import { getBucket, getDb } from "../../../../../src/db.js";
import { json, safeJson } from "../../../../../src/util.js";

// Riceve una foto già preparata dal browser: miniatura, anteprima, HD con filigrana e originale.
export async function onRequestPost({ env, params, request }) {
  const DB = await getDb(env);
  const bucket = getBucket(env);
  const albumId = Number(params.id);
  const album = await DB.prepare(`SELECT id FROM albums WHERE id = ?`).bind(albumId).first();
  if (!album) return json({ error: "Album non trovato." }, 404);

  const form = await request.formData();
  const files = { thumb: form.get("thumb"), display: form.get("display"), hd: form.get("hd") };
  for (const [name, file] of Object.entries(files)) {
    if (!file || typeof file === "string" || !file.size) return json({ error: `Manca la versione «${name}» della foto.` }, 400);
  }
  const meta = safeJson(form.get("meta") || "{}", {});
  const width = Math.round(Number(meta.width)) || 0;
  const height = Math.round(Number(meta.height)) || 0;
  if (!width || !height) return json({ error: "Dimensioni della foto mancanti." }, 400);

  const uuid = crypto.randomUUID();
  const key = `photos/${albumId}/${uuid}`;
  const jpeg = { httpMetadata: { contentType: "image/jpeg" } };
  await Promise.all([
    bucket.put(`${key}/thumb.jpg`, files.thumb.stream(), jpeg),
    bucket.put(`${key}/display.jpg`, files.display.stream(), jpeg),
    bucket.put(`${key}/hd.jpg`, files.hd.stream(), jpeg),
  ]);

  // L'originale resta privato: servirà per la futura vendita in massima qualità.
  const original = form.get("original");
  if (original && typeof original !== "string" && original.size) {
    await bucket.put(`originals/${albumId}/${uuid}`, original.stream(), {
      httpMetadata: { contentType: original.type || "application/octet-stream" },
      customMetadata: { filename: String(original.name || "").slice(0, 200) },
    });
  }

  const exif = {};
  for (const k of ["exposure", "fnumber", "iso", "focal", "model", "lens", "taken"]) {
    if (meta.exif && meta.exif[k] != null && meta.exif[k] !== "") exif[k] = meta.exif[k];
  }
  const res = await DB.prepare(
    `INSERT INTO photos (album_id, key, width, height, exif, position)
     VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM photos WHERE album_id = ?))`
  ).bind(albumId, key, width, height, JSON.stringify(exif), albumId).run();

  const photo = await DB.prepare(`SELECT * FROM photos WHERE id = ?`).bind(res.meta.last_row_id).first();
  return json({ photo: photoRow(photo) }, 201);
}
