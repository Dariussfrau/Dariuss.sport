import { SITE } from "../src/config.js";
import { page, withErrors } from "../src/templates.js";
import { esc, html } from "../src/util.js";

// Pagina "Richiedi un servizio": servizi su richiesta e contatto diretto (Instagram, WhatsApp se configurato).
export const onRequestGet = withErrors(async ({ request }) => {
  const whatsapp = SITE.whatsapp
    ? `<a class="btn" href="https://wa.me/${esc(SITE.whatsapp)}?text=${encodeURIComponent("Ciao Dario, vorrei informazioni per un servizio fotografico.")}" target="_blank" rel="noopener">Scrivimi su WhatsApp</a>`
    : "";

  const body = `<main class="wrap listing">
  <div class="d-head"><div class="eyebrow">Contatti</div><h1>Richiedi un servizio</h1>
    <p>Racconto la tua partita, il tuo torneo o il tuo evento sportivo. Ogni lavoro è su misura: scrivimi e ti preparo una proposta.</p></div>

  <ul class="services">${SITE.services.map(([name, text]) => `<li class="reveal"><span class="price">Su richiesta</span><h3>${esc(name)}</h3><p>${esc(text)}</p></li>`).join("")}</ul>

  <div class="sec-head"><h2>Come funziona</h2></div>
  <ol class="steps">
    <li><b>Mi scrivi</b>Mi dici data, luogo e tipo di evento.</li>
    <li><b>Ti mando una proposta</b>Decidiamo insieme cosa serve e come consegnare le foto.</li>
    <li><b>Scatto e consegno</b>Ricevi l'album online, da scaricare e condividere.</li>
  </ol>

  <div class="cta">
    <h2>Parliamone</h2>
    <p>Rispondo personalmente a ogni messaggio. Seguimi su Instagram e scrivimi in privato: indicami data, luogo e tipo di evento.</p>
    <div class="btns"><a class="btn solid" href="${SITE.instagram}" target="_blank" rel="noopener">Vai al mio Instagram ${esc(SITE.handle)}</a>${whatsapp}</div>
  </div>
</main>`;

  return html(page({
    active: "contatti",
    title: "Richiedi un servizio",
    description: "Servizi fotografici per partite ed eventi sportivi, foto di squadra, stampe personalizzate e contenuti per i social. Tutto su richiesta.",
    url: request.url,
    body,
  }));
});
