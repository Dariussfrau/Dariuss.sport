import { canViewAlbum } from "../../src/auth.js";
import { getBucket, getDb } from "../../src/db.js";
import { downloadName } from "../../src/util.js";

// Download di una foto in HD (2048 px). Per le gallerie private serve aver inserito la password.
export async function onRequestGet({ env, params, request }) {
  try {
    const DB = await getDb(env);
    const photo = await DB.prepare(
      `SELECT p.key, p.album_id AS id, a.slug, a.private, a.password_hash,
        (SELECT COUNT(*) FROM photos q WHERE q.album_id = p.album_id AND (q.position < p.position OR (q.position = p.position AND q.id <= p.id))) AS n
       FROM photos p JOIN albums a ON a.id = p.album_id
       WHERE p.id = ? AND a.published = 1`
    ).bind(Number(params.id) || 0).first();
    if (!photo || !(await canViewAlbum(request, env, photo))) return new Response("Foto non trovata", { status: 404 });

    const obj = await getBucket(env).get(`${photo.key}/hd.jpg`);
    if (!obj) return new Response("Foto non trovata", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "content-type": "image/jpeg",
        "content-disposition": `attachment; filename="${downloadName(photo.slug, photo.n)}"`,
        "cache-control": photo.private ? "private, no-store" : "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Download non disponibile al momento", { status: 503 });
  }
}
