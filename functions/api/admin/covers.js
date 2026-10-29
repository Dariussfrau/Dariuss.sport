import { getBucket } from "../../../src/db.js";
import { json } from "../../../src/util.js";

// Copertina di un articolo: riceve anteprima e miniatura già ridimensionate dal browser.
export async function onRequestPost({ env, request }) {
  const bucket = getBucket(env);
  const form = await request.formData();
  const display = form.get("display"), thumb = form.get("thumb");
  if (!display?.size || !thumb?.size) return json({ error: "Immagine mancante." }, 400);
  const key = `articles/${crypto.randomUUID()}`;
  const jpeg = { httpMetadata: { contentType: "image/jpeg" } };
  await Promise.all([
    bucket.put(`${key}/display.jpg`, display.stream(), jpeg),
    bucket.put(`${key}/thumb.jpg`, thumb.stream(), jpeg),
  ]);
  return json({ key }, 201);
}
