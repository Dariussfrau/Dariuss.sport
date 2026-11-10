// Testi e dati fissi del sito. Modifica qui nome, bio, attrezzatura e note legali.
export const SITE = {
  name: "D. Sport",
  tagline: "Fotografia sportiva",
  description: "Il calcio di provincia visto dal bordo campo: album delle partite da scaricare in HD e racconti dalla giornata sportiva.",
  instagram: "https://www.instagram.com/dariuss.sport/",
  handle: "@dariuss.sport",
  bio: "Sono Dario e racconto il calcio dilettantistico con la fotografia. Mi interessano i volti, i contrasti e i momenti che durano un attimo: quelli che dalla tribuna non si vedono.",
  // Messaggio diretto su Instagram (apre la chat) e, se indicato, WhatsApp.
  instagramDm: "https://ig.me/m/dariuss.sport",
  // Numero WhatsApp con prefisso internazionale e senza spazi, es. "393331234567". Vuoto = pulsante nascosto.
  whatsapp: "",
  // Squadra seguita. Maglia di casa: rossa con banda gialla centrale.
  team: { name: "Villaperuccio", yellow: "#F6CF2A", red: "#E0262B" },
  // Servizi della pagina Contatti: tutti "su richiesta".
  services: [
    ["Partite", "Il racconto fotografico completo della gara, da bordo campo: azioni, esultanze, panchina. Album online con download in HD."],
    ["Shooting per eventi sportivi", "Servizi su misura per tornei, presentazioni, feste di fine stagione, saggi e giornate dedicate."],
    ["Stampe personalizzate", "Le tue foto stampate nel formato che preferisci: stampe fine art, poster, quadri e ricordi per la squadra."],
    ["Foto di squadra e ritratti", "La foto ufficiale di inizio stagione e i ritratti dei giocatori, pronti per i social e per la società."],
    ["Contenuti per i social", "Reel, grafiche match day e risultato finale per le pagine delle società sportive."],
  ],
  kit: [
    ["Corpo", ["Sony A7 V"]],
    ["Obiettivi", ["Sony FE 70-200 mm F2.8 GM OSS II", "Sony FE 100-400 mm F4.5-5.6 GM OSS"]],
    ["Video", ["DJI Osmo Pocket 4P"]],
    ["Editing", ["Lightroom · DaVinci Resolve · Premiere · Edits"]],
  ],
  // Testo mostrato prima di ogni download.
  terms: "Puoi usare questa foto per <strong>uso personale e sui social</strong>, taggando <strong>@dariuss.sport</strong>. Non è consentito l'uso commerciale (pubblicità, vendita, stampa per conto di terzi) senza la mia autorizzazione.",
  copyright: "Tutte le foto sono protette da diritto d'autore. Uso personale e social consentito con tag @dariuss.sport, vietato l'uso commerciale.",
  removal: "Ti riconosci in una foto e vuoi che venga rimossa? Scrivimi su Instagram e la tolgo.",
};

// Categorie proposte nel pannello di gestione (si può scrivere anche altro).
export const COMPETITIONS = ["Seconda Categoria", "Amichevole", "Campionato", "Coppa", "Torneo", "Giovanili", "Allenamento", "Serie", "Ritratti", "Dietro le quinte"];

// Seconda Categoria, Girone B: le squadre del campionato (suggerite come avversario nel pannello).
export const LEAGUE = ["Villaperuccio", "Decimomannu Calcio", "Carbonia 1939", "Carloforte", "Domusnovas J. S. E.", "P. G. S. Audax", "Atletico Uta", "Sant'Anna Arresi", "Asseminese", "Teulada Calcio", "AC Cortoghiana", "Barbusi", "Bindua", "Ussana Calcio", "Matzaccarese"];

// Colori sociali usati per gli scudetti disegnati nel gioco dei rigori. Sono stime ricavate dagli stemmi:
// correggili qui se una squadra ha colori diversi.
export const LEAGUE_COLORS = {
  "Villaperuccio": ["#E0262B", "#F6CF2A"],
  "Decimomannu Calcio": ["#1F6B3A", "#FFFFFF"],
  "Carbonia 1939": ["#1F3FA6", "#FFFFFF"],
  "Carloforte": ["#C8102E", "#1B2A4A"],
  "Domusnovas J. S. E.": ["#C8102E", "#1A1A1A"],
  "P. G. S. Audax": ["#2E8B3D", "#FFFFFF"],
  "Atletico Uta": ["#2E8B57", "#FFFFFF"],
  "Sant'Anna Arresi": ["#3FA9E0", "#FFFFFF"],
  "Asseminese": ["#1F3FA6", "#D8232A"],
  "Teulada Calcio": ["#1F4FBF", "#FFFFFF"],
  "AC Cortoghiana": ["#1B2A4A", "#C8102E"],
  "Barbusi": ["#D8232A", "#F6CF2A"],
  "Bindua": ["#1F3FA6", "#C8102E"],
  "Ussana Calcio": ["#C8102E", "#F2B705"],
  "Matzaccarese": ["#C8102E", "#FFFFFF"],
};
