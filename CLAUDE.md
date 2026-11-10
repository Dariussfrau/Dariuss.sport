# D. Sport · istruzioni per Claude

Sito/blog di fotografia sportiva **D. Sport** (calcio dilettantistico, Sud Sardegna) del proprietario di @dariuss.sport su Instagram.
Il proprietario non è uno sviluppatore: parla italiano, spiega le modifiche in italiano semplice, e prima di toccare la grafica proponi e chiedi.

## Architettura

- **Cloudflare Pages** con **Pages Functions** (`functions/`), nessun passo di build, nessun framework, nessun `package.json`.
- **D1** (binding `DB`): tabelle `albums`, `photos` (con `featured` = foto che scorrono in home), `articles`, `matches` (partite del Villaperuccio), `votes` (Foto della settimana), `standings` (classifica del girone), `settings` (testi e date modificabili dal pannello). Colonne aggiunte: `albums.private`, `photos.portfolio`. Le colonne nuove vanno nell'elenco `MIGRATIONS` di `src/db.js`. Lo schema si crea da solo in `src/db.js` (`CREATE TABLE IF NOT EXISTS`). Per aggiungere colonne usa `ALTER TABLE` idempotente nello stesso punto, mai migrazioni manuali.
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
- Intestazione: logo **molto grande e centrato**, una linea, poi il menu centrato (Home · Portfolio · Album · Articoli · Villaperuccio · Chi sono · Contatti; su telefono va su due righe) a pulsanti arrotondati che si **riempiono di verde** `#43703F` al passaggio del mouse, alla pressione e sulla pagina attuale (`aria-current="page"`). Scorrendo, il logo grande esce e la fascia del menu resta fissa in alto con un logo piccolo a sinistra (da 760 px in su).
- Animazioni approvate: intestazione che resta fissa scorrendo e **dissolvenza** di foto e album (classe `.reveal`) quando entrano nello schermo. Rispettano `prefers-reduced-motion`.
- Dopo ogni modifica a `site.css` o `site.js` aumenta `ASSET_VERSION` in `src/templates.js`, altrimenti i browser possono mostrare la versione vecchia.
- **@dariuss.sport** è il nome Instagram: compare nell'angolo in alto a destra (su telefono sopra il logo) e nel footer, sempre come collegamento alla pagina Instagram.
- **Villaperuccio** (squadra seguita, `SITE.team`): pagina `/villaperuccio`, riquadri "Prossima partita" e "Ultimo risultato" in home sotto il titolo, tutto in `src/matches.js`. Rosso `#E0262B` e giallo `#F6CF2A` (colori di maglia) si usano **solo** come accento negli elementi della squadra, mai nel resto del sito. La maglia disegnata (`jersey()`) riproduce quella di casa vista nelle foto del proprietario: rossa, banda gialla centrale dai bordi "a pennellata", colletto e bordi manica gialli.
- **Contatti** (`/contatti`, "Richiedi un servizio"): servizi in `SITE.services`, tutti "su richiesta", nessun prezzo. **Niente modulo e niente email** (scelta del proprietario): solo il pulsante "Scrivimi su Instagram" (`SITE.instagramDm`) e, quando il proprietario fornisce il numero, "Scrivimi su WhatsApp" (`SITE.whatsapp`).
- **Condivisione**: `shareRow()` in `src/templates.js` (WhatsApp + menu di sistema/copia link) su album e articoli; nella foto ingrandita "Condividi" manda il link `.../album/slug#foto-N`, che riapre quella foto.
- **Google**: `functions/sitemap.xml.js`, `functions/robots.txt.js`, canonical, Open Graph con immagine generica `public/assets/og.png`, dati strutturati in home.
- `LEAGUE` in `src/config.js`: le 15 squadre della Seconda Categoria Girone B (classifica e avversari suggeriti nel pannello).
- **Foto della settimana** (`src/votes.js`, `/api/voti`): si vota con il cuore sulle foto dell'**ultimo album pubblicato**; un voto per visitatore (cookie tecnico anonimo `ds_voter`), modificabile. La più votata compare in home nella fascia "Foto della settimana".
- **Il gioco dei rigori è stato tolto** su richiesta del proprietario (pagina, API, classifica e tabella `scores`). Non reintrodurlo.
- **Classifica del girone** (`src/standings.js`): tabella nella pagina Villaperuccio, aggiornata dal pannello (`#classifica`: punti e partite giocate); la riga del Villaperuccio è evidenziata con i colori di maglia.
- **Foto della settimana, testo**: dal pannello (`#settimana`) il proprietario scrive titolo e cronaca (`settings.week_title`, `week_text`, markdown semplice) mostrati in home accanto alla foto più votata.
- **Gallerie private per i clienti**: album con `private = 1` (richiede una password). Non compaiono in home, elenco album, portfolio, sitemap, voto o partite; la pagina chiede la password e imposta il cookie `ds_a{id}` (`canViewAlbum()` in `src/auth.js`). Anche `/media`, `/scarica` e lo ZIP controllano l'accesso: ogni nuova rotta che serve foto deve fare lo stesso.
- **Portfolio** (`/portfolio`): le foto segnate "Portfolio" dal pannello (`photos.portfolio`), solo da album pubblici.
- `public/404.html`: pagina "non trovata" statica con intestazione e menu scritti a mano; aggiornala se cambia il menu.
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

Poi apri http://localhost:8788 e http://localhost:8788/gestione. Prima di consegnare una modifica, prova il percorso completo: accesso, nuovo album, caricamento foto, pagina pubblica, "Scarica HD", album completo con password, articolo. Controlla sempre nei formati Windows (1366 e 1920 px), Mac (1440 px) e iPhone (375 e 440 px, anche in orizzontale): niente scorrimento laterale, immagini caricate, pulsanti alti almeno 24 px.

## Idee già concordate per il futuro

- Tappe 1 e 2 fatte (Villaperuccio, foto in home, Contatti, condivisione, Google).
- Numero WhatsApp nei contatti: per ora il proprietario vuole solo Instagram (`SITE.whatsapp` vuoto).
- Tappa 3 fatta (Foto della settimana). Tappa 4 fatta (classifica, gallerie private, portfolio, testo della foto della settimana; gioco rimosso).
- Download in **massima qualità a pagamento** (pulsante già presente e disattivato nella foto ingrandita; gli originali sono già salvati in `originals/`).
- Dominio personalizzato (da collegare in Cloudflare Pages → Custom domains).
