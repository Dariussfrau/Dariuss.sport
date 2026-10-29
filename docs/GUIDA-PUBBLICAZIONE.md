# Mettere online Dariuss.sport

Guida passo passo per pubblicare il sito su Cloudflare. Serve farla **una volta sola**: dopo, ogni modifica salvata su GitHub va online da sola.

Tempo stimato: 20–30 minuti. Tutto si fa dal browser, anche dal PC Windows.

> I nomi dei menu di Cloudflare a volte cambiano leggermente. Se non trovi una voce identica, cerca quella con il significato più vicino.

---

## 1. Crea lo spazio per le foto (R2)

1. Entra su [dash.cloudflare.com](https://dash.cloudflare.com).
2. Nel menu a sinistra apri **R2 Object Storage**.
3. Se è la prima volta, Cloudflare ti chiede di attivare R2 e di **aggiungere un metodo di pagamento**. È normale: i primi 10 GB al mese sono gratuiti e non paghi nulla finché resti sotto quella soglia.
4. Clicca **Create bucket**.
5. Nome: `dariuss-sport-foto`. Lascia il resto com'è e conferma.

## 2. Crea il database (D1)

1. Nel menu a sinistra apri **Storage & Databases → D1 SQL Database** (a volte si trova sotto **Workers & Pages → D1**).
2. Clicca **Create database**.
3. Nome: `dariuss-sport-db`. Conferma.

Non serve creare tabelle: il sito le prepara da solo al primo avvio.

## 3. Collega il repository GitHub (Pages)

1. Apri **Workers & Pages** e clicca **Create**.
2. Scegli la scheda **Pages**, poi **Connect to Git** (o **Import an existing Git repository**).
   Se la schermata propone solo "Workers", cerca il link per creare un progetto **Pages**.
3. Autorizza Cloudflare ad accedere al tuo account GitHub e scegli il repository **Dariuss.sport**.
4. Impostazioni di build:
   - **Project name:** `dariuss-sport` (diventerà l'indirizzo provvisorio `dariuss-sport.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** lascia vuoto
   - **Build output directory:** `public`
5. Clicca **Save and Deploy**. Il primo avvio mostrerà una pagina "Configurazione da completare": è previsto, si sistema al passo successivo.

## 4. Collega database e spazio foto

Nel progetto appena creato apri **Settings → Bindings** e aggiungi due collegamenti:

| Tipo | Variable name | Valore |
|---|---|---|
| D1 database | `DB` | `dariuss-sport-db` |
| R2 bucket | `BUCKET` | `dariuss-sport-foto` |

I nomi `DB` e `BUCKET` vanno scritti **esattamente così**, in maiuscolo.

## 5. Imposta la password del pannello

Sempre in **Settings**, apri **Variables and Secrets** e aggiungi due voci di tipo **Secret** (cifrate):

| Nome | Cosa scrivere |
|---|---|
| `ADMIN_PASSWORD` | La password con cui entrerai nel pannello di gestione. Sceglila lunga e solo tua. |
| `SESSION_SECRET` | Una frase lunga e casuale che non ti serve ricordare, ad esempio 40 caratteri a caso. Serve a firmare l'accesso. |

## 6. Ripubblica

Le impostazioni valgono dal deploy successivo:

1. Apri la scheda **Deployments**.
2. Sull'ultimo deploy clicca **⋯ → Retry deployment**.

## 7. Prova

- Apri `https://dariuss-sport.pages.dev`: deve comparire la home (vuota, con "Nessun album pubblicato per ora").
- Apri `https://dariuss-sport.pages.dev/gestione`, inserisci la password di `ADMIN_PASSWORD` ed entra nel pannello.
- Crea un album di prova, carica 2–3 foto, aprilo sul sito e prova "Scarica HD".

Consiglio: aggiungi `…pages.dev/gestione` alla schermata Home dell'iPhone (in Safari: Condividi → Aggiungi alla schermata Home). Così il pannello si apre come un'app.

---

## Più avanti: il dominio

Quando hai scelto il dominio (es. `dariusssport.com` oppure un `.it`):

1. Nel progetto apri **Custom domains → Set up a custom domain**.
2. Scrivi il dominio e segui le istruzioni. Se il dominio è registrato su Cloudflare il collegamento è automatico; se è registrato altrove (es. Aruba per un `.it`) Cloudflare ti dice quali record DNS aggiungere.

## Costi indicativi

| Voce | Costo |
|---|---|
| Sito (Cloudflare Pages) | gratuito |
| Database D1 | gratuito per un sito di queste dimensioni |
| Spazio foto R2 | gratuito fino a 10 GB, poi circa 0,015 $ al GB al mese |
| Dominio | circa 10–20 € l'anno |

Per orientarti: un album da 50 foto occupa circa 1–1,5 GB se carichi anche gli originali da 25 MB, circa 150 MB senza originali. Verifica i prezzi aggiornati su cloudflare.com.
