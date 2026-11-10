import { getDb } from "../../src/db.js";
import { json } from "../../src/util.js";
import { readVoter, voteCounts, voterCookie, votingAlbum } from "../../src/votes.js";

async function state(DB, album, voter) {
  const mine = voter
    ? await DB.prepare(`SELECT photo_id FROM votes WHERE album_id = ? AND voter = ?`).bind(album.id, voter).first()
    : null;
  return { open: true, counts: await voteCounts(DB, album.id), mine: mine ? mine.photo_id : null };
}

// Voti dell'album in votazione e voto del visitatore.
export async function onRequestGet({ env, request }) {
  try {
    const DB = await getDb(env);
    const album = await votingAlbum(DB);
    if (!album || album.slug !== new URL(request.url).searchParams.get("album")) return json({ open: false, counts: {}, mine: null });
    return json(await state(DB, album, readVoter(request)));
  } catch (err) {
    console.error(err);
    return json({ open: false, counts: {}, mine: null }, 503);
  }
}

// Registra o cambia il voto. Un voto per visitatore sull'album in votazione.
export async function onRequestPost({ env, request }) {
  try {
    const DB = await getDb(env);
    const album = await votingAlbum(DB);
    const { photo_id } = await request.json().catch(() => ({}));
    const photo = album && (await DB.prepare(`SELECT id FROM photos WHERE id = ? AND album_id = ?`).bind(Number(photo_id) || 0, album.id).first());
    if (!photo) return json({ error: "La votazione per questa foto è chiusa." }, 400);

    let voter = readVoter(request);
    const headers = {};
    if (!voter) {
      voter = crypto.randomUUID();
      headers["set-cookie"] = voterCookie(voter);
    }
    await DB.prepare(
      `INSERT INTO votes (album_id, voter, photo_id) VALUES (?, ?, ?)
       ON CONFLICT(album_id, voter) DO UPDATE SET photo_id = excluded.photo_id`
    ).bind(album.id, voter, photo.id).run();

    const res = json(await state(DB, album, voter));
    if (headers["set-cookie"]) res.headers.set("set-cookie", headers["set-cookie"]);
    return res;
  } catch (err) {
    console.error(err);
    return json({ error: "Voto non registrato, riprova tra poco." }, 503);
  }
}
