# Dariuss.sport

Sito e blog di fotografia sportiva di [@dariuss.sport](https://www.instagram.com/dariuss.sport/): album delle partite con download gratuito in HD e articoli sulla giornata sportiva.

## Cosa fa

- **Album** con galleria, dati di scatto (tempo, diaframma, ISO, focale) e foto ingrandibili.
- **Download gratuito** di ogni foto in HD (2048 px) con filigrana Dariuss.sport, dopo un avviso sui diritti d'autore da confermare.
- **Album completo in ZIP**, protetto da una password diversa per ogni album.
- **Articoli** con foto di copertina.
- **Pannello di gestione** su `/gestione`, protetto da password, usabile da iPhone e da PC: crei album, carichi foto, scrivi articoli.
- Gli **originali** caricati restano privati, pronti per la futura vendita in massima qualità.

## Come si pubblica

Segui [docs/GUIDA-PUBBLICAZIONE.md](docs/GUIDA-PUBBLICAZIONE.md). Il sito gira su Cloudflare Pages con database D1 e spazio foto R2.

## Struttura

```
public/            file statici (stile, script del sito e del pannello, favicon)
functions/         pagine e API del sito (Cloudflare Pages Functions)
src/               codice condiviso: database, accesso, modelli HTML, testi del sito
docs/              guide
```

I testi fissi (bio, attrezzatura, note legali) si cambiano in `src/config.js`.
