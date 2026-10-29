// Album: ingrandimento foto, avviso sui diritti, download HD e album completo in ZIP.
(() => {
  const dataEl = document.getElementById("album-data");
  const dlg = document.getElementById("dlg");
  const toastEl = document.getElementById("toast");
  const lb = document.getElementById("lb");
  if (!dataEl || !dlg) return;

  const album = JSON.parse(dataEl.textContent);
  const photos = album.photos;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let idx = 0, lastFocus = null, toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 5000);
  }

  function saveBlob(href, name) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- Lightbox ---------- */
  function openLb(i) {
    idx = (i + photos.length) % photos.length;
    const p = photos[idx];
    lb.innerHTML = `<img src="${p.src}" alt="${esc(album.title)}, foto ${idx + 1}" width="${p.w}" height="${p.h}">
      <div class="info">Foto ${idx + 1} di ${photos.length}${p.exif ? ` · ${esc(p.exif)}` : ""}</div>
      <div class="bar">
        <button type="button" data-lb="prev" aria-label="Foto precedente">←</button>
        <button type="button" class="go" data-dl="${idx}">Scarica HD · 2048 px · gratis</button>
        <button type="button" disabled title="Disponibile a breve">Massima qualità · a pagamento (presto)</button>
        <button type="button" data-lb="close">Chiudi</button>
        <button type="button" data-lb="next" aria-label="Foto successiva">→</button>
      </div>`;
    if (lb.hidden) lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".go").focus();
  }
  function closeLb() {
    lb.hidden = true;
    lb.innerHTML = "";
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }

  /* ---------- Dialog ---------- */
  function openDlg(html) {
    if (dlg.hidden && lb.hidden) lastFocus = document.activeElement;
    dlg.innerHTML = `<div class="box">${html}</div>`;
    dlg.hidden = false;
    (dlg.querySelector("input") || dlg.querySelector("[data-ok]") || dlg.querySelector("button"))?.focus();
  }
  function closeDlg() {
    dlg.hidden = true;
    dlg.innerHTML = "";
    if (lb.hidden) lastFocus?.focus?.();
  }

  function termsDialog({ title, preview = "", rows, okLabel = "OK, confermo e scarico", onOk }) {
    openDlg(`<h2 id="dlg-title">${title}</h2>${preview}
      <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="terms"><b>Diritti d'autore</b>${window.SITE_TERMS || ""}</div>
      <div class="acts"><button class="btn" type="button" data-cancel>Annulla</button><button class="btn solid" type="button" data-ok>${okLabel}</button></div>`);
    dlg.querySelector("[data-ok]").addEventListener("click", onOk);
  }

  function photoDownload(i) {
    const p = photos[i];
    termsDialog({
      title: "Prima di scaricare",
      preview: `<div class="pv"><img src="${p.src}" alt=""><div class="wm"><b>Dariuss</b><span>.sport</span></div></div>`,
      rows: [["File", p.name], ["Formato", "JPG · 2048 px lato lungo"], ["Filigrana", "Sì, Dariuss.sport"], ["Costo", "Gratis"]],
      onOk: () => {
        closeDlg();
        saveBlob(`/scarica/${p.id}`, p.name);
        toast("Download avviato.");
      },
    });
  }

  /* ---------- Album completo ---------- */
  function albumDownload() {
    openDlg(`<h2 id="dlg-title">Album completo</h2>
      <p style="font-size:15px;color:#3c4a3d">Per scaricare tutte le ${photos.length} foto di <b>${esc(album.title)}</b> in un unico file serve la password che ti ho dato.</p>
      <form id="pwform" novalidate>
        <label for="album-pw">Password dell'album</label>
        <input id="album-pw" type="password" autocomplete="off" autocapitalize="off">
        <p class="err" id="pwerr" hidden style="margin-top:8px"></p>
      </form>
      <div class="acts"><button class="btn" type="button" data-cancel>Annulla</button><button class="btn solid" type="submit" form="pwform" data-ok>Sblocca album</button></div>`);
    const form = document.getElementById("pwform");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = dlg.querySelector("[data-ok]"), err = document.getElementById("pwerr");
      btn.disabled = true;
      err.hidden = true;
      try {
        const res = await fetch(`/api/album/${encodeURIComponent(album.slug)}/zip`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password: document.getElementById("album-pw").value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Password non corretta.");
        termsDialog({
          title: "Album sbloccato",
          rows: [["File", data.zipName], ["Contenuto", `${data.files.length} foto · JPG 2048 px`], ["Peso stimato", `circa ${Math.max(1, Math.round(data.files.length * 1.3))} MB`], ["Filigrana", "Sì, Dariuss.sport"]],
          onOk: () => buildZip(data),
        });
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
        btn.disabled = false;
        document.getElementById("album-pw").focus();
      }
    });
  }

  async function buildZip({ files, zipName }) {
    openDlg(`<h2 id="dlg-title">Preparo l'archivio</h2>
      <p id="zipmsg" style="font-size:15px">Scarico le foto: 0 di ${files.length}</p>
      <div class="progress"><span id="zipbar"></span></div>
      <p style="font-size:13px;color:#7A8A78">Tieni aperta questa pagina finché il download non parte.</p>`);
    try {
      const entries = [];
      for (let i = 0; i < files.length; i++) {
        const res = await fetch(files[i].url);
        if (!res.ok) throw new Error();
        entries.push({ name: files[i].name, data: new Uint8Array(await res.arrayBuffer()) });
        document.getElementById("zipmsg").textContent = `Scarico le foto: ${i + 1} di ${files.length}`;
        document.getElementById("zipbar").style.width = `${((i + 1) / files.length) * 100}%`;
      }
      const url = URL.createObjectURL(makeZip(entries));
      closeDlg();
      saveBlob(url, zipName);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast("Download dell'album avviato.");
    } catch {
      openDlg(`<h2 id="dlg-title">Download non riuscito</h2><p>Controlla la connessione e riprova. Se il problema continua, scrivimi su Instagram.</p>
        <div class="acts"><button class="btn solid" type="button" data-cancel>Chiudi</button></div>`);
    }
  }

  /* ---------- ZIP senza compressione (le JPG sono già compresse) ---------- */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeZip(entries) {
    const enc = new TextEncoder(), parts = [], central = [];
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    let offset = 0;
    for (const { name, data } of entries) {
      const nameBytes = enc.encode(name), crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true); local.setUint16(10, dosTime, true); local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
      local.setUint16(26, nameBytes.length, true); local.setUint16(28, 0, true);
      parts.push(local, nameBytes, data);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true); cen.setUint16(12, dosTime, true); cen.setUint16(14, dosDate, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
      cen.setUint16(28, nameBytes.length, true); cen.setUint32(42, offset, true);
      central.push(cen, nameBytes);
      offset += 30 + nameBytes.length + data.length;
    }
    const centralSize = central.reduce((s, p) => s + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  /* ---------- Eventi ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!dlg.hidden) {
      if (t.closest("[data-cancel]") || t === dlg) closeDlg();
      return;
    }
    const dl = t.closest("[data-dl]");
    if (dl) return photoDownload(Number(dl.dataset.dl));
    if (t.closest("[data-album-dl]")) return albumDownload();
    if (!lb.hidden) {
      const b = t.closest("[data-lb]");
      if (b) b.dataset.lb === "close" ? closeLb() : openLb(idx + (b.dataset.lb === "next" ? 1 : -1));
      else if (t === lb) closeLb();
      return;
    }
    const open = t.closest("[data-photo]");
    if (open) openLb(Number(open.dataset.photo));
  });
  document.addEventListener("keydown", (e) => {
    if (!dlg.hidden) { if (e.key === "Escape") closeDlg(); return; }
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") openLb(idx + 1);
    if (e.key === "ArrowLeft") openLb(idx - 1);
  });
})();
