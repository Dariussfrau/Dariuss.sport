import { checkPassword } from "../../../../src/auth.js";
import { getDb } from "../../../../src/db.js";
import { downloadName, json } from "../../../../src/util.js";

// Verifica la password dell'album e restituisce l'elenco dei file HD.
// L'archivio ZIP viene poi composto nel browser di chi scarica.
export async function onRequestPost({ env, params, request }) {
  try {
    const DB = await getDb(env);
    const album = await DB.prepare(`SELECT id, slug, password_hash FROM albums WHERE slug = ? AND published = 1`).bind(params.slug).first();
    if (!album || !album.password_hash) return json({ error: "Download dell'album non disponibile." }, 404);

    const { password } = await request.json().catch(() => ({}));
    if (!(await checkPassword(String(password || "").trim(), album.password_hash))) {
      await new Promise((r) => setTimeout(r, 600)); // rallenta i tentativi a caso
      return json({ error: "Password non corretta." }, 403);
    }

    const { results } = await DB.prepare(`SELECT id FROM photos WHERE album_id = ? ORDER BY position, id`).bind(album.id).all();
    return json({
      zipName: `${album.slug}_dariuss-sport.zip`,
      files: results.map((p, i) => ({ url: `/scarica/${p.id}`, name: downloadName(album.slug, i + 1) })),
    });
  } catch (err) {
    console.error(err);
    return json({ error: "Servizio non disponibile, riprova tra poco." }, 503);
  }
}
