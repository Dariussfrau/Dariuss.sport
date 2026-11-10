// Piccole impostazioni modificabili dal pannello (testo della foto della settimana, data della classifica…).
export async function getSettings(DB, keys) {
  const { results } = await DB.prepare(`SELECT key, value FROM settings WHERE key IN (${keys.map(() => "?").join(", ")})`).bind(...keys).all();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

export function setSetting(DB, key, value) {
  return DB.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(key, String(value ?? ""));
}
