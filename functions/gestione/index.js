import { isAdmin } from "../../src/auth.js";
import { COMPETITIONS } from "../../src/config.js";

// Guscio del pannello di gestione: il contenuto lo disegna /assets/admin.js.
export async function onRequestGet({ env, request }) {
  if (!(await isAdmin(request, env))) return Response.redirect(new URL("/accesso", request.url), 302);
  return new Response(`<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Gestione · Dariuss.sport</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/admin.css">
</head>
<body>
<header class="bar"><div class="wrap bar-in">
  <a class="logo" href="#"><span class="d">Dariuss</span><span class="s">.sport</span><span class="tag">Gestione</span></a>
  <nav><a href="/" target="_blank" rel="noopener">Vedi il sito ↗</a><a href="/esci">Esci</a></nav>
</div></header>
<main class="wrap" id="app" aria-live="polite"><p class="muted">Caricamento…</p></main>
<div class="toast" id="toast" hidden role="status"></div>
<script>window.COMPETITIONS = ${JSON.stringify(COMPETITIONS)};</script>
<script src="/assets/admin.js" defer></script>
</body>
</html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
