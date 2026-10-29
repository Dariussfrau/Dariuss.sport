import { getBucket, getDb } from "../../src/db.js";
import { downloadName } from "../../src/util.js";

// Download gratuito di una foto in HD (2048 px, con filigrana).
export async function onRequestGet({ env, params }) {
  try {
    const DB = await getDb(env);
    const photo = await DB.prepare(
      `SELECT p.key, p.album_id, a.slug,
        (SELECT COUNT(*) FROM photos q WHERE q.album_id = p.album_id AND (q.position < p.position OR (q.position = p.position AND q.id <= p.id))) AS n
       FROM photos p JOIN albums a ON a.id = p.album_id
       WHERE p.id = ? AND a.published = 1`
    ).bind(Number(params.id) || 0).first();
    if (!photo) return new Response("Foto non trovata", { status: 404 });

    const obj = await getBucket(env).get(`${photo.key}/hd.jpg`);
    if (!obj) return new Response("Foto non trovata", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "content-type": "image/jpeg",
        "content-disposition": `attachment; filename="${downloadName(photo.slug, photo.n)}"`,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Download non disponibile al momento", { status: 503 });
  }
}
