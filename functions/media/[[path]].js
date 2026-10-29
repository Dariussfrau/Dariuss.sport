import { getBucket } from "../../src/db.js";

// Serve solo le versioni pubbliche (anteprima e miniatura). HD e originali non passano da qui.
const PUBLIC_KEY = /^(photos\/\d+\/[0-9a-f-]{36}|articles\/[0-9a-f-]{36})\/(thumb|display)\.jpg$/;

export async function onRequestGet({ env, params, request }) {
  const key = (params.path || []).join("/");
  if (!PUBLIC_KEY.test(key)) return new Response("Non trovato", { status: 404 });

  let bucket;
  try { bucket = getBucket(env); } catch { return new Response("Spazio foto non configurato", { status: 503 }); }

  const obj = await bucket.get(key, { onlyIf: request.headers });
  if (!obj) return new Response("Non trovato", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("content-type", "image/jpeg");
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  // R2 restituisce un oggetto senza body quando la copia nel browser è ancora valida.
  if (!("body" in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}
