// Il database D1 si crea da solo al primo avvio: niente comandi da lanciare a mano.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    competition TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    place TEXT NOT NULL DEFAULT '',
    intro TEXT NOT NULL DEFAULT '',
    password_hash TEXT,
    cover_photo_id INTEGER,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    exif TEXT NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS photos_by_album ON photos (album_id, position)`,
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    cover_key TEXT,
    date TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

export class SetupError extends Error {}

let schemaReady = false;

export async function getDb(env) {
  if (!env.DB) throw new SetupError("Manca il collegamento al database (binding D1 «DB»).");
  if (!schemaReady) {
    await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
    schemaReady = true;
  }
  return env.DB;
}

export function getBucket(env) {
  if (!env.BUCKET) throw new SetupError("Manca il collegamento allo spazio foto (binding R2 «BUCKET»).");
  return env.BUCKET;
}

// Album con numero di foto e chiave della copertina (scelta o, in mancanza, la prima foto).
export const ALBUM_SELECT = `
  SELECT a.*,
    (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) AS photo_count,
    COALESCE(
      (SELECT p.key FROM photos p WHERE p.id = a.cover_photo_id AND p.album_id = a.id),
      (SELECT p.key FROM photos p WHERE p.album_id = a.id ORDER BY p.position, p.id LIMIT 1)
    ) AS cover_key
  FROM albums a`;
