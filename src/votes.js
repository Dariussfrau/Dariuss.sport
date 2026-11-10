// "Foto della settimana": si vota sull'ultimo album pubblicato; un voto per visitatore, modificabile.
const COOKIE = "ds_voter";

// L'album in votazione è sempre l'ultimo pubblicato che contiene foto.
export function votingAlbum(DB) {
  return DB.prepare(
    `SELECT a.id, a.slug, a.title, a.competition, a.date FROM albums a
     WHERE a.published = 1 AND EXISTS (SELECT 1 FROM photos p WHERE p.album_id = a.id)
     ORDER BY a.date DESC, a.id DESC LIMIT 1`
  ).first();
}

export async function voteCounts(DB, albumId) {
  const { results } = await DB.prepare(`SELECT photo_id, COUNT(*) AS n FROM votes WHERE album_id = ? GROUP BY photo_id`).bind(albumId).all();
  return Object.fromEntries(results.map((r) => [r.photo_id, r.n]));
}

// Foto in testa (o, senza voti, la prima dell'album) con la sua posizione nell'album.
export async function photoOfTheWeek(DB) {
  const album = await votingAlbum(DB);
  if (!album) return null;
  const top = await DB.prepare(
    `SELECT v.photo_id, COUNT(*) AS n FROM votes v JOIN photos p ON p.id = v.photo_id
     WHERE v.album_id = ? GROUP BY v.photo_id ORDER BY n DESC, v.photo_id LIMIT 1`
  ).bind(album.id).first();
  const photo = top
    ? await DB.prepare(`SELECT * FROM photos WHERE id = ?`).bind(top.photo_id).first()
    : await DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY position, id LIMIT 1`).bind(album.id).first();
  const before = await DB.prepare(
    `SELECT COUNT(*) AS n FROM photos WHERE album_id = ? AND (position < ? OR (position = ? AND id <= ?))`
  ).bind(album.id, photo.position, photo.position, photo.id).first();
  return { album, photo, number: before.n, votes: top ? top.n : 0 };
}

// Identificativo anonimo del visitatore, salvato in un cookie tecnico (nessun dato personale).
export function readVoter(request) {
  const m = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([0-9a-f-]{36})`));
  return m ? m[1] : null;
}

export const voterCookie = (id) => `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
