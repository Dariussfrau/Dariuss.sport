import { clearCookie } from "../src/auth.js";

export function onRequest() {
  return new Response(null, { status: 303, headers: { location: "/", "set-cookie": clearCookie } });
}
