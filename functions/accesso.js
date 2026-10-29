import { adminConfigured, isAdmin, safeEqual, sessionCookie } from "../src/auth.js";
import { page } from "../src/templates.js";
import { html } from "../src/util.js";

function loginPage(error = "") {
  return page({
    title: "Accesso",
    body: `<main class="wrap login">
  <form method="post" action="/accesso" class="login-box">
    <div class="eyebrow">Area riservata</div>
    <h1>Gestione del sito</h1>
    ${error ? `<p class="err" role="alert">${error}</p>` : ""}
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
    <button class="btn solid" type="submit">Entra</button>
  </form>
</main>`,
  });
}

export async function onRequestGet({ env, request }) {
  if (await isAdmin(request, env)) return Response.redirect(new URL("/gestione", request.url), 302);
  if (!adminConfigured(env)) return html(loginPage("La password di gestione non è ancora impostata: aggiungi ADMIN_PASSWORD e SESSION_SECRET nelle impostazioni del progetto Cloudflare."), 503);
  return html(loginPage());
}

export async function onRequestPost({ env, request }) {
  if (!adminConfigured(env)) return html(loginPage("La password di gestione non è ancora impostata."), 503);
  const form = await request.formData();
  // Spazi e a capo iniziali/finali ignorati: capita spesso con il copia-incolla.
  if (!safeEqual(String(form.get("password") || "").trim(), String(env.ADMIN_PASSWORD).trim())) {
    await new Promise((r) => setTimeout(r, 800));
    return html(loginPage("Password non corretta."), 401);
  }
  return new Response(null, {
    status: 303,
    headers: { location: "/gestione", "set-cookie": await sessionCookie(env) },
  });
}
