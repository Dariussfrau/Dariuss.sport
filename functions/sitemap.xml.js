import { getDb } from "../src/db.js";

// Mappa del sito per i motori di ricerca: pagine fisse, album e articoli pubblicati.
export async function onRequestGet({ env, request }) {
  const origin = new URL(request.url).origin;
  const urls = [["/", ""], ["/album", ""], ["/articoli", ""], ["/villaperuccio", ""], ["/contatti", ""]];
  try {
    const DB = await getDb(env);
    const [albums, articles] = await Promise.all([
      DB.prepare(`SELECT slug, date FROM albums WHERE published = 1 ORDER BY date DESC`).all(),
      DB.prepare(`SELECT slug, date FROM articles WHERE published = 1 ORDER BY date DESC`).all(),
    ]);
    for (const a of albums.results) urls.push([`/album/${a.slug}`, a.date]);
    for (const a of articles.results) urls.push([`/articoli/${a.slug}`, a.date]);
  } catch (err) {
    console.error(err);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([path, date]) => `  <url><loc>${origin}${path}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
