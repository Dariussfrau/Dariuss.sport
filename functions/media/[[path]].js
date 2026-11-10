import { canViewAlbum } from "../../src/auth.js";
import { getBucket, getDb } from "../../src/db.js";

// Serve solo le versioni da mostrare (anteprima e miniatura). HD e originali non passano da qui.
// Le foto delle gallerie private si vedono solo dopo aver inserito la password dell'album.
const PUBLIC_KEY = /^(?:photos\/(\d+)\/[0-9a-f-]{36}|articles\/[0-9a-f-]{36})\/(?:thumb|display)\.jpg$/;

export async function onRequestGet({ env, params, request }) {
  const key = (params.path || []).join("/");
  const match = PUBLIC_KEY.exec(key);
  if (!match) return new Response("Non trovato", { status: 404 });

  let bucket, isPrivate = false;
  try {
    bucket = getBucket(env);
    if (match[1]) {
      const album = await (await getDb(env)).prepare(`SELECT id, private, password_hash FROM albums WHERE id = ?`).bind(Number(match[1])).first();
      isPrivate = Boolean(album && album.private);
      if (isPrivate && !(await canViewAlbum(request, env, album))) return new Response("Non trovato", { status: 404 });
    }
  } catch { return new Response("Spazio foto non configurato", { status: 503 }); }

  const obj = await bucket.get(key, { onlyIf: request.headers });
  if (!obj) return new Response("Non trovato", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("content-type", "image/jpeg");
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", isPrivate ? "private, max-age=3600" : "public, max-age=31536000, immutable");
  // R2 restituisce un oggetto senza body quando la copia nel browser è ancora valida.
  if (!("body" in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}
