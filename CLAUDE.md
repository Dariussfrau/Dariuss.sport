# Dariuss.sport · istruzioni per Claude

Sito/blog di fotografia sportiva (calcio dilettantistico, Sud Sardegna) del proprietario di @dariuss.sport.
Il proprietario non è uno sviluppatore: parla italiano, spiega le modifiche in italiano semplice, e prima di toccare la grafica proponi e chiedi.

## Architettura

- **Cloudflare Pages** con **Pages Functions** (`functions/`), nessun passo di build, nessun framework, nessun `package.json`.
- **D1** (binding `DB`): tabelle `albums`, `photos`, `articles`. Lo schema si crea da solo in `src/db.js` (`CREATE TABLE IF NOT EXISTS`). Per aggiungere colonne usa `ALTER TABLE` idempotente nello stesso punto, mai migrazioni manuali.
- **R2** (binding `BUCKET`):
  - `photos/{albumId}/{uuid}/thumb.jpg` (640 px), `display.jpg` (1600 px, senza filigrana, mostrata sul sito), `hd.jpg` (2048 px, con filigrana, download gratuito)
  - `originals/{albumId}/{uuid}`: originale privato, per la futura vendita in massima qualità. **Mai** servirlo pubblicamente.
  - `articles/{uuid}/display.jpg|thumb.jpg`: copertine articoli.
- Le versioni delle foto e la filigrana sono generate **nel browser** in `public/assets/admin.js` (canvas), così il server resta nei limiti CPU del piano gratuito. Anche lo ZIP dell'album completo è composto nel browser (`public/assets/site.js`).
- Segreti: `ADMIN_PASSWORD` (accesso a `/gestione`) e `SESSION_SECRET` (firma del cookie). Le password degli album sono salvate come `sale:sha256`.

## Regole

- `/media/*` serve solo `thumb` e `display` (regex in `functions/media/[[path]].js`). L'HD passa da `/scarica/{id}`; gli originali non hanno nessuna rotta pubblica.
- Ogni testo dinamico nell'HTML passa da `esc()` (`src/util.js`). Il markdown degli articoli è in `src/markdown.js` ed esegue l'escape prima di formattare.
- Mantieni la regola `[hidden]{display:none!important}` nei CSS: le finestre (`.dlg`, `.lb`, `.toast`) usano `display:flex/grid` e senza quella regola coprono la pagina.
- Interfaccia e messaggi in italiano, tono semplice e diretto.

## Brand (proposta A "Campo chiaro", approvata)

- Colori: crema `#F2EEE6` (sfondo), verde `#43703F` (accento, logo "Dariuss"), verde scuro `#1E3A1E` (titoli, footer), salvia `#7A8A78` (testo secondario), menta `#A9C79A` (logo su fondo scuro).
- Caratteri: **Montserrat** (titoli, logo: "Dariuss" 800 + ".sport" 400), **Poppins** (testo), **Newsreader** (testi lunghi, articoli).
- Filigrana: "Dariuss" Montserrat 800 + ".sport" 400, bianco 88%, ombra leggera, in basso a destra, altezza ≈3% del lato lungo.
- Il proprietario ha chiesto di non cambiare colori, dimensioni dei titoli e ordine delle sezioni senza sua richiesta.

## Provare in locale

```bash
npx wrangler@4.40.0 pages dev public --d1 DB --r2 BUCKET \
  --binding ADMIN_PASSWORD=prova123 --binding SESSION_SECRET=segreto-di-test \
  --compatibility-date 2024-09-23
```

Poi apri http://localhost:8788 e http://localhost:8788/gestione. Prima di consegnare una modifica, prova il percorso completo: accesso, nuovo album, caricamento foto, pagina pubblica, "Scarica HD", album completo con password, articolo.

## Idee già concordate per il futuro

- Download in **massima qualità a pagamento** (pulsante già presente e disattivato nella foto ingrandita; gli originali sono già salvati in `originals/`).
- Dominio personalizzato (da collegare in Cloudflare Pages → Custom domains).
