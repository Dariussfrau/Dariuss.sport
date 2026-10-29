import { hashPassword } from "./auth.js";
import { isIsoDate, slugify, todayIso, uniqueSlug } from "./util.js";

const str = (v, max = 5000) => String(v ?? "").trim().slice(0, max);

// Valida i campi di un album inviati dal pannello. Restituisce { values } oppure { error }.
export function readAlbumFields(input, { partial = false } = {}) {
  const values = {};
  if (!partial || "title" in input) {
    values.title = str(input.title, 160);
    if (!values.title) return { error: "Il titolo è obbligatorio." };
  }
  if (!partial || "date" in input) {
    values.date = str(input.date, 10) || todayIso();
    if (!isIsoDate(values.date)) return { error: "La data non è valida." };
  }
  for (const [k, max] of [["competition", 60], ["place", 120], ["intro", 1200]]) {
    if (!partial || k in input) values[k] = str(input[k], max);
  }
  if (!partial || "published" in input) values.published = input.published === false || input.published === 0 ? 0 : 1;
  if ("cover_photo_id" in input) values.cover_photo_id = input.cover_photo_id ? Number(input.cover_photo_id) : null;
  return { values };
}

export async function applyPassword(values, input) {
  if (input.remove_password) values.password_hash = null;
  else if (str(input.password)) values.password_hash = await hashPassword(str(input.password, 100));
}

export function readArticleFields(input, { partial = false } = {}) {
  const values = {};
  if (!partial || "title" in input) {
    values.title = str(input.title, 200);
    if (!values.title) return { error: "Il titolo è obbligatorio." };
  }
  if (!partial || "date" in input) {
    values.date = str(input.date, 10) || todayIso();
    if (!isIsoDate(values.date)) return { error: "La data non è valida." };
  }
  if (!partial || "excerpt" in input) values.excerpt = str(input.excerpt, 400);
  if (!partial || "body" in input) values.body = str(input.body, 60000);
  if (!partial || "published" in input) values.published = input.published === false || input.published === 0 ? 0 : 1;
  if ("cover_key" in input) {
    const key = input.cover_key ? str(input.cover_key, 100) : null;
    if (key && !/^articles\/[0-9a-f-]{36}$/.test(key)) return { error: "Copertina non valida." };
    values.cover_key = key;
  }
  return { values };
}

export async function slugFor(DB, table, title, date, exceptId = null) {
  return uniqueSlug(DB, table, slugify(table === "albums" ? `${title} ${date}` : title), exceptId);
}

// UPDATE costruito solo con nomi di colonna noti (le chiavi arrivano dai lettori qui sopra).
export async function updateRow(DB, table, id, values) {
  const keys = Object.keys(values);
  if (!keys.length) return;
  await DB.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
    .bind(...keys.map((k) => values[k]), id).run();
}

export async function insertRow(DB, table, values) {
  const keys = Object.keys(values);
  const res = await DB.prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`)
    .bind(...keys.map((k) => values[k])).run();
  return res.meta.last_row_id;
}

export async function deletePrefix(bucket, prefix) {
  let cursor;
  do {
    const list = await bucket.list({ prefix, cursor });
    if (list.objects.length) await bucket.delete(list.objects.map((o) => o.key));
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}

export function photoRow(p) {
  return { ...p, exif: (() => { try { return JSON.parse(p.exif); } catch { return {}; } })() };
}
