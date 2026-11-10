const COOKIE = "ds_session";
const SESSION_DAYS = 30;
const enc = new TextEncoder();

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

export async function sha256(text) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export function safeEqual(a, b) {
  a = String(a ?? "");
  b = String(b ?? "");
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function adminConfigured(env) {
  return Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET);
}

export async function sessionCookie(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const value = `${exp}.${await hmac(env.SESSION_SECRET, String(exp))}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function isAdmin(request, env) {
  if (!adminConfigured(env)) return false;
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [exp, sig] = match[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(env.SESSION_SECRET, exp));
}

// Password degli album: "sale:hash".
export async function hashPassword(password) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return `${salt}:${await sha256(salt + password)}`;
}

export async function checkPassword(password, stored) {
  if (!stored || !password) return false;
  const [salt, hash] = stored.split(":");
  return safeEqual(hash, await sha256(salt + password));
}

// Gallerie private: chi inserisce la password dell'album riceve un cookie valido solo per quell'album.
// Cambiando la password dell'album, i vecchi accessi smettono di valere.
const albumToken = (env, album) => hmac(env.SESSION_SECRET || "", `album:${album.id}:${album.password_hash}`);

export async function albumCookie(env, album) {
  return `ds_a${album.id}=${await albumToken(env, album)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export async function canViewAlbum(request, env, album) {
  if (!album.private) return true;
  if (!env.SESSION_SECRET || !album.password_hash) return isAdmin(request, env);
  const match = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)ds_a${album.id}=([0-9a-f]+)`));
  if (match && safeEqual(match[1], await albumToken(env, album))) return true;
  return isAdmin(request, env);
}
