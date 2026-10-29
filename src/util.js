const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "2026-10-29" -> "29 ottobre 2026"
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function slugify(text) {
  return String(text || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "senza-titolo";
}

// Trova uno slug libero nella tabella indicata (aggiunge -2, -3, ... se serve).
export async function uniqueSlug(DB, table, base, exceptId = null) {
  let slug = base;
  for (let n = 2; ; n++) {
    const row = await DB.prepare(`SELECT id FROM ${table} WHERE slug = ?`).bind(slug).first();
    if (!row || row.id === exceptId) return slug;
    slug = `${base}-${n}`;
  }
}

// { exposure: "1/2000", fnumber: 2.8, iso: 1600, focal: 200 } -> "1/2000 s · f/2.8 · ISO 1600 · 200 mm"
export function exifLine(exif) {
  if (!exif) return "";
  const e = typeof exif === "string" ? safeJson(exif, {}) : exif;
  const parts = [];
  if (e.exposure) parts.push(`${e.exposure} s`);
  if (e.fnumber) parts.push(`f/${Number(e.fnumber).toFixed(1).replace(/\.0$/, "")}`);
  if (e.iso) parts.push(`ISO ${e.iso}`);
  if (e.focal) parts.push(`${Math.round(e.focal)} mm`);
  return parts.join(" · ");
}

export function safeJson(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...extraHeaders },
  });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

// URL pubblici delle immagini. Le versioni HD e gli originali non passano da qui.
export const photoUrl = (key, size = "display") => `/media/${key}/${size}.jpg`;

export function downloadName(albumSlug, position) {
  return `${albumSlug}-${String(position).padStart(2, "0")}_dariuss-sport.jpg`;
}
