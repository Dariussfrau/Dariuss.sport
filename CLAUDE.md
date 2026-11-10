# D. Sport · istruzioni per Claude

Sito/blog di fotografia sportiva **D. Sport** (calcio dilettantistico, Sud Sardegna) del proprietario di @dariuss.sport su Instagram.
Il proprietario non è uno sviluppatore: parla italiano, spiega le modifiche in italiano semplice, e prima di toccare la grafica proponi e chiedi.

## Architettura

- **Cloudflare Pages** con **Pages Functions** (`functions/`), nessun passo di build, nessun framework, nessun `package.json`.
- **D1** (binding `DB`): tabelle `albums`, `photos` (con `featured` = foto che scorrono in home), `articles`, `matches` (partite del Villaperuccio). Le colonne nuove vanno nell'elenco `MIGRATIONS` di `src/db.js`. Lo schema si crea da solo in `src/db.js` (`CREATE TABLE IF NOT EXISTS`). Per aggiungere colonne usa `ALTER TABLE` idempotente nello stesso punto, mai migrazioni manuali.
- **R2** (binding `BUCKET`):
  - `photos/{albumId}/{uuid}/thumb.jpg` (640 px), `display.jpg` (1600 px, senza filigrana, mostrata sul sito), `hd.jpg` (2048 px, download gratuito)
  - `originals/{albumId}/{uuid}`: originale privato, per la futura vendita in massima qualità. **Mai** servirlo pubblicamente.
  - `articles/{uuid}/display.jpg|thumb.jpg`: copertine articoli.
- Le versioni delle foto sono generate **nel browser** in `public/assets/admin.js` (canvas), così il server resta nei limiti CPU del piano gratuito. Anche lo ZIP dell'album completo è composto nel browser (`public/assets/site.js`).
- Segreti: `ADMIN_PASSWORD` (accesso a `/gestione`) e `SESSION_SECRET` (firma del cookie). Le password degli album sono salvate come `sale:sha256`.

## Regole

- `/media/*` serve solo `thumb` e `display` (regex in `functions/media/[[path]].js`). L'HD passa da `/scarica/{id}`; gli originali non hanno nessuna rotta pubblica.
- Ogni testo dinamico nell'HTML passa da `esc()` (`src/util.js`). Il markdown degli articoli è in `src/markdown.js` ed esegue l'escape prima di formattare.
- Mantieni la regola `[hidden]{display:none!important}` nei CSS: le finestre (`.dlg`, `.lb`, `.toast`) usano `display:flex/grid` e senza quella regola coprono la pagina.
- Interfaccia e messaggi in italiano, tono semplice e diretto.

## Brand (proposta A "Campo chiaro", approvata)

- Colori: crema `#F2EEE6` (sfondo), verde `#43703F` (accento, "D." del logo), verde scuro `#1E3A1E` (titoli, footer), salvia `#7A8A78` (testo secondario), menta `#A9C79A` (logo su fondo scuro).
- Logo del sito: **"D. Sport"**, Montserrat 800, "D." verde `#43703F` + "Sport" verde scuro `#1E3A1E` (su fondo scuro: menta + crema). Sotto, quando serve, "FOTOGRAFIA SPORTIVA" spaziato in salvia.
- Intestazione: logo **molto grande e centrato**, una linea, poi il menu centrato (Home · Album · Articoli · Chi sono) a pulsanti arrotondati che si **riempiono di verde** `#43703F` al passaggio del mouse, alla pressione e sulla pagina attuale (`aria-current="page"`). Scorrendo, il logo grande esce e la fascia del menu resta fissa in alto con un logo piccolo a sinistra (da 760 px in su).
- Animazioni approvate: intestazione che resta fissa scorrendo e **dissolvenza** di foto e album (classe `.reveal`) quando entrano nello schermo. Rispettano `prefers-reduced-motion`.
- Dopo ogni modifica a `site.css` o `site.js` aumenta `ASSET_VERSION` in `src/templates.js`, altrimenti i browser possono mostrare la versione vecchia.
- **@dariuss.sport** è il nome Instagram: compare nell'angolo in alto a destra (su telefono sopra il logo) e nel footer, sempre come collegamento alla pagina Instagram.
- **Villaperuccio** (squadra seguita, `SITE.team`): pagina `/villaperuccio`, riquadri "Prossima partita" e "Ultimo risultato" in home sotto il titolo, tutto in `src/matches.js`. Giallo `#F4C430` e rosso `#C8102E` (colori di maglia) si usano **solo** come accento negli elementi della squadra, mai nel resto del sito. La maglia disegnata (`jersey()`) è provvisoria: va rifatta sulla foto della maglia vera quando il proprietario la manda.
- Home: accanto al titolo scorrono in dissolvenza le foto segnate "In home" dal pannello (massimo 6); se non ce ne sono resta la copertina dell'ultimo album.
- Caratteri: **Montserrat** (titoli, logo), **Poppins** (testo), **Newsreader** (testi lunghi, articoli).
- **Nessuna filigrana** sulle foto: il proprietario l'ha tolta. Non reintrodurla senza sua richiesta.
- Il proprietario ha chiesto di non cambiare colori, dimensioni dei titoli e ordine delle sezioni senza sua richiesta.

## Provare in locale

```bash
npx wrangler@4.40.0 pages dev public --d1 DB --r2 BUCKET \
  --binding ADMIN_PASSWORD=prova123 --binding SESSION_SECRET=segreto-di-test \
  --compatibility-date 2024-09-23
```

Poi apri http://localhost:8788 e http://localhost:8788/gestione. Prima di consegnare una modifica, prova il percorso completo: accesso, nuovo album, caricamento foto, pagina pubblica, "Scarica HD", album completo con password, articolo.

## Idee già concordate per il futuro

- **Tappa 2** (approvata): pagina "Richiedi un servizio" con prezzi "su richiesta" e solo modulo di ricontatto (nome, email o telefono, messaggio) che arriva per email al proprietario e nel pannello; voce di menu "Contatti"; pulsanti Condividi su WhatsApp/Instagram; SEO (sitemap, anteprime, descrizioni).
- **Tappa 3** (approvata): "Foto della settimana" con voto e mini-gioco dei rigori in una pagina a parte, raggiungibile dalla pagina del Villaperuccio.
- Download in **massima qualità a pagamento** (pulsante già presente e disattivato nella foto ingrandita; gli originali sono già salvati in `originals/`).
- Dominio personalizzato (da collegare in Cloudflare Pages → Custom domains).
