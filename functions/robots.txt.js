// Indicazioni per i motori di ricerca: aree private escluse e indirizzo della mappa del sito.
export function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  return new Response(`User-agent: *
Disallow: /gestione
Disallow: /accesso
Disallow: /api/
Disallow: /scarica/

Sitemap: ${origin}/sitemap.xml
`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
