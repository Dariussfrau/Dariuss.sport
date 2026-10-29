// Pannello di gestione: album, foto, articoli.
// Le foto vengono preparate nel browser (iPhone o PC) prima del caricamento:
//   thumb 640 px · display 1600 px (sul sito) · hd 2048 px con filigrana (download gratuito) · originale (privato).
(() => {
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const COMPETITIONS = window.COMPETITIONS || [];
  const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const SIZES = { thumb: 640, display: 1600, hd: 2048 };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${+m[3]} ${MONTHS[m[2] - 1]} ${m[1]}` : ""; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const thumbUrl = (key) => `/media/${key}/thumb.jpg`;
  const loading = `<p class="muted">Caricamento…</p>`;
  const errorBox = (msg) => `<div class="panel"><p class="err">${esc(msg)}</p><p><a class="btn" href="#">Torna all'elenco</a></p></div>`;

  let busy = false; // caricamento foto in corso
  window.addEventListener("beforeunload", (e) => { if (busy) { e.preventDefault(); e.returnValue = ""; } });

  async function api(method, url, body) {
    const opts = { method, headers: {} };
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers["content-type"] = "application/json"; }
    const res = await fetch(url, opts);
    if (res.status === 401) { location.href = "/accesso"; throw new Error("Sessione scaduta: accedi di nuovo."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
    return data;
  }

  let toastTimer;
  function toast(msg, error = false) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("error", error);
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 4000);
  }

  // Pulsante che chiede una seconda conferma prima di un'azione irreversibile.
  function confirmButton(btn, label, action) {
    btn.addEventListener("click", async () => {
      if (btn.dataset.armed !== "1") {
        btn.dataset.armed = "1";
        const original = btn.textContent;
        btn.textContent = label;
        btn.classList.add("armed");
        setTimeout(() => { if (btn.isConnected && btn.dataset.armed === "1") { btn.dataset.armed = ""; btn.textContent = original; btn.classList.remove("armed"); } }, 4000);
        return;
      }
      btn.disabled = true;
      try { await action(); } catch (e) { toast(e.message, true); btn.disabled = false; }
    });
  }

  /* ================= Elenco ================= */
  async function dashboard() {
    app.innerHTML = loading;
    try {
      const [{ albums }, { articles }] = await Promise.all([api("GET", "/api/admin/albums"), api("GET", "/api/admin/articles")]);
      app.innerHTML = `
      <section class="panel">
        <div class="panel-head"><h1>Album</h1><a class="btn solid" href="#album-nuovo">+ Nuovo album</a></div>
        ${albums.length ? `<ul class="items">${albums.map((a) => `<li><a href="#album-${a.id}">
            <span class="thumb">${a.cover_key ? `<img src="${thumbUrl(a.cover_key)}" alt="">` : ""}</span>
            <span class="txt"><b>${esc(a.title)}</b><small>${[fmtDate(a.date), `${a.photo_count} foto`, a.has_password ? "con password" : ""].filter(Boolean).join(" · ")}</small></span>
            ${a.published ? "" : `<span class="badge">Bozza</span>`}</a></li>`).join("")}</ul>`
          : `<p class="muted">Nessun album. Crea il primo con «Nuovo album».</p>`}
      </section>
      <section class="panel">
        <div class="panel-head"><h1>Articoli</h1><a class="btn solid" href="#articolo-nuovo">+ Nuovo articolo</a></div>
        ${articles.length ? `<ul class="items">${articles.map((a) => `<li><a href="#articolo-${a.id}">
            <span class="thumb">${a.cover_key ? `<img src="${thumbUrl(a.cover_key)}" alt="">` : ""}</span>
            <span class="txt"><b>${esc(a.title)}</b><small>${fmtDate(a.date)}</small></span>
            ${a.published ? "" : `<span class="badge">Bozza</span>`}</a></li>`).join("")}</ul>`
          : `<p class="muted">Nessun articolo. Scrivi il primo con «Nuovo articolo».</p>`}
      </section>`;
    } catch (e) {
      app.innerHTML = errorBox(e.message);
    }
  }

  /* ================= Album ================= */
  async function albumEditor(id) {
    let album = { title: "", competition: "", date: today(), place: "", intro: "", published: 1, has_password: false };
    let photos = [];
    if (id) {
      app.innerHTML = loading;
      try { ({ album, photos } = await api("GET", `/api/admin/albums/${id}`)); }
      catch (e) { app.innerHTML = errorBox(e.message); return; }
    }

    app.innerHTML = `
    <a class="back" href="#">← Torna all'elenco</a>
    <div class="panel-head"><h1>${id ? esc(album.title) : "Nuovo album"}</h1>
      ${id && album.published ? `<a class="btn" href="/album/${esc(album.slug)}" target="_blank" rel="noopener">Vedi sul sito ↗</a>` : ""}</div>
    <form id="album-form" class="panel form" novalidate>
      <div class="field"><label for="f-title">Titolo</label>
        <input id="f-title" name="title" maxlength="160" required value="${esc(album.title)}" placeholder="Villaperuccio – Nuxis"></div>
      <div class="cols">
        <div class="field"><label for="f-competition">Tipo</label>
          <input id="f-competition" name="competition" list="competitions" maxlength="60" value="${esc(album.competition)}" placeholder="Amichevole">
          <datalist id="competitions">${COMPETITIONS.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></div>
        <div class="field"><label for="f-date">Data</label><input id="f-date" name="date" type="date" required value="${esc(album.date)}"></div>
      </div>
      <div class="field"><label for="f-place">Luogo</label><input id="f-place" name="place" maxlength="120" value="${esc(album.place)}" placeholder="Campo Comunale di Villaperuccio"></div>
      <div class="field"><label for="f-intro">Introduzione</label><textarea id="f-intro" name="intro" rows="3" maxlength="1200" placeholder="Due righe sulla partita">${esc(album.intro)}</textarea></div>
      <fieldset class="field">
        <legend>Password per scaricare l'album completo</legend>
        <p class="muted small" id="pw-note">${album.has_password ? "Password impostata. Scrivine una nuova solo se vuoi cambiarla." : "Nessuna password: sul sito non compare il pulsante «Scarica l'album completo». Le singole foto restano scaricabili."}</p>
        <input id="f-password" name="password" type="text" autocomplete="off" autocapitalize="off" maxlength="100" placeholder="${album.has_password ? "Nuova password (facoltativa)" : "Es. VILLA2026"}">
        ${album.has_password ? `<label class="check"><input type="checkbox" id="f-remove-pw"> Rimuovi la password</label>` : ""}
      </fieldset>
      <label class="check"><input type="checkbox" id="f-published" ${album.published ? "checked" : ""}> Pubblicato (visibile sul sito)</label>
      <p class="err" id="form-err" hidden></p>
      <div class="acts"><button class="btn solid" type="submit">${id ? "Salva modifiche" : "Crea album"}</button></div>
    </form>
    ${id ? `
    <section class="panel" id="photos">
      <div class="panel-head"><h2>Foto <span class="muted" id="photo-count">(${photos.length})</span></h2></div>
      <label class="drop" id="drop" for="f-files">
        <input id="f-files" class="sr-only" type="file" accept="image/*" multiple>
        <b>Aggiungi foto</b>
        <span>Tocca per sceglierle dal telefono o dal computer, oppure trascinale qui. Usa le JPG esportate da Lightroom: il sito prepara da solo le versioni per il web e l'HD con filigrana.</span>
      </label>
      <ul class="queue" id="queue"></ul>
      <div class="pgrid" id="pgrid"></div>
    </section>
    <section class="panel danger">
      <h2>Elimina album</h2>
      <p class="muted small">Cancella l'album, tutte le sue foto e gli originali. Non si può annullare.</p>
      <button class="btn danger-btn" type="button" id="del-album">Elimina album</button>
    </section>` : `<p class="muted">Dopo aver creato l'album potrai caricare le foto.</p>`}`;

    document.getElementById("album-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("form-err");
      const btn = e.target.querySelector("[type=submit]");
      const body = {
        title: document.getElementById("f-title").value,
        competition: document.getElementById("f-competition").value,
        date: document.getElementById("f-date").value,
        place: document.getElementById("f-place").value,
        intro: document.getElementById("f-intro").value,
        published: document.getElementById("f-published").checked,
        password: document.getElementById("f-password").value,
        remove_password: document.getElementById("f-remove-pw")?.checked || false,
      };
      if (!body.title.trim()) { err.textContent = "Il titolo è obbligatorio."; err.hidden = false; return; }
      err.hidden = true;
      btn.disabled = true;
      try {
        if (id) {
          await api("PUT", `/api/admin/albums/${id}`, body);
          toast("Album salvato.");
          if (!busy) albumEditor(id);
          else btn.disabled = false;
        } else {
          const { album: created } = await api("POST", "/api/admin/albums", body);
          toast("Album creato. Ora aggiungi le foto.");
          location.hash = `#album-${created.id}`;
        }
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
        btn.disabled = false;
      }
    });

    if (!id) return;

    const grid = document.getElementById("pgrid");
    const coverId = () => album.cover_photo_id || photos[0]?.id;
    function renderGrid() {
      document.getElementById("photo-count").textContent = `(${photos.length})`;
      grid.innerHTML = photos.map((p) => `<div class="ptile">
        <img src="${thumbUrl(p.key)}" alt="" loading="lazy">
        ${p.id === coverId() ? `<span class="badge cover">Copertina</span>` : ""}
        <div class="pacts">
          ${p.id === coverId() ? "" : `<button type="button" data-cover="${p.id}">Copertina</button>`}
          <button type="button" data-del="${p.id}">Elimina</button>
        </div></div>`).join("");
      grid.querySelectorAll("[data-cover]").forEach((b) => b.addEventListener("click", async () => {
        try {
          await api("PUT", `/api/admin/albums/${id}`, { cover_photo_id: Number(b.dataset.cover) });
          album.cover_photo_id = Number(b.dataset.cover);
          renderGrid();
          toast("Copertina aggiornata.");
        } catch (e) { toast(e.message, true); }
      }));
      grid.querySelectorAll("[data-del]").forEach((b) => confirmButton(b, "Conferma", async () => {
        await api("DELETE", `/api/admin/photos/${b.dataset.del}`);
        photos = photos.filter((p) => p.id !== Number(b.dataset.del));
        if (album.cover_photo_id === Number(b.dataset.del)) album.cover_photo_id = null;
        renderGrid();
        toast("Foto eliminata.");
      }));
    }
    renderGrid();

    const input = document.getElementById("f-files");
    const drop = document.getElementById("drop");
    input.addEventListener("change", () => { uploadFiles([...input.files]); input.value = ""; });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); uploadFiles([...e.dataTransfer.files]); });

    async function uploadFiles(files) {
      files = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name));
      if (!files.length) return;
      if (busy) { toast("Attendi la fine del caricamento in corso.", true); return; }
      busy = true;
      const queue = document.getElementById("queue");
      const items = await Promise.all(files.map(async (file) => ({ file, exif: await readExif(file) })));
      // In ordine di scatto, poi per nome file.
      items.sort((a, b) => (a.exif.taken || "").localeCompare(b.exif.taken || "") || a.file.name.localeCompare(b.file.name, undefined, { numeric: true }));
      queue.innerHTML = items.map((it, i) => `<li id="q-${i}"><span class="name">${esc(it.file.name)}</span><span class="st">In attesa</span></li>`).join("");
      await fontsReady;
      let ok = 0;
      for (let i = 0; i < items.length; i++) {
        const row = document.getElementById(`q-${i}`), st = row.querySelector(".st");
        try {
          st.textContent = "Preparazione…";
          const v = await prepareVersions(items[i].file);
          st.textContent = "Caricamento…";
          const fd = new FormData();
          fd.append("thumb", v.thumb, "thumb.jpg");
          fd.append("display", v.display, "display.jpg");
          fd.append("hd", v.hd, "hd.jpg");
          fd.append("original", items[i].file, items[i].file.name);
          fd.append("meta", JSON.stringify({ width: v.width, height: v.height, exif: items[i].exif }));
          const { photo } = await api("POST", `/api/admin/albums/${id}/photos`, fd);
          photos.push(photo);
          renderGrid();
          st.textContent = "Caricata";
          row.classList.add("done");
          ok++;
        } catch (e) {
          st.textContent = `Errore: ${e.message}`;
          row.classList.add("fail");
        }
      }
      busy = false;
      toast(ok === items.length ? `${ok} foto caricate.` : `${ok} di ${items.length} foto caricate. Controlla quelle in errore.`, ok !== items.length);
      if (ok === items.length) setTimeout(() => { if (!busy) queue.innerHTML = ""; }, 3000);
    }

    confirmButton(document.getElementById("del-album"), "Conferma: elimina tutto", async () => {
      await api("DELETE", `/api/admin/albums/${id}`);
      toast("Album eliminato.");
      location.hash = "";
    });
  }

  /* ================= Articoli ================= */
  async function articleEditor(id) {
    let a = { title: "", date: today(), excerpt: "", body: "", published: 1, cover_key: null };
    if (id) {
      app.innerHTML = loading;
      try { ({ article: a } = await api("GET", `/api/admin/articles/${id}`)); }
      catch (e) { app.innerHTML = errorBox(e.message); return; }
    }
    let coverKey = a.cover_key;

    app.innerHTML = `
    <a class="back" href="#">← Torna all'elenco</a>
    <div class="panel-head"><h1>${id ? esc(a.title) : "Nuovo articolo"}</h1>
      ${id && a.published ? `<a class="btn" href="/articoli/${esc(a.slug)}" target="_blank" rel="noopener">Vedi sul sito ↗</a>` : ""}</div>
    <form id="article-form" class="panel form" novalidate>
      <div class="field"><label for="a-title">Titolo</label><input id="a-title" maxlength="200" required value="${esc(a.title)}" placeholder="Dal bordo campo: l'amichevole con il Nuxis"></div>
      <div class="field"><label for="a-date">Data</label><input id="a-date" type="date" required value="${esc(a.date)}"></div>
      <div class="field"><label for="a-excerpt">Sommario</label><textarea id="a-excerpt" rows="2" maxlength="400" placeholder="Una frase che compare nell'elenco degli articoli">${esc(a.excerpt)}</textarea></div>
      <div class="field">
        <span class="label">Foto di copertina</span>
        <div class="cover-edit">
          <div class="cover-pv" id="cover-pv">${coverKey ? `<img src="${thumbUrl(coverKey)}" alt="">` : `<span class="muted small">Nessuna copertina</span>`}</div>
          <div class="cover-btns">
            <label class="btn" for="a-cover">Scegli foto</label><input id="a-cover" class="sr-only" type="file" accept="image/*">
            <button class="btn" type="button" id="cover-remove" ${coverKey ? "" : "hidden"}>Rimuovi</button>
            <span class="muted small" id="cover-st"></span>
          </div>
        </div>
      </div>
      <div class="field"><label for="a-body">Testo</label>
        <textarea id="a-body" rows="16" placeholder="Scrivi qui l'articolo…">${esc(a.body)}</textarea>
        <p class="muted small">Riga vuota = nuovo paragrafo · <code>## </code> a inizio riga = titoletto · <code>- </code> = elenco · <code>**grassetto**</code> · <code>*corsivo*</code> · <code>[testo](https://link)</code></p></div>
      <label class="check"><input type="checkbox" id="a-published" ${a.published ? "checked" : ""}> Pubblicato (visibile sul sito)</label>
      <p class="err" id="form-err" hidden></p>
      <div class="acts"><button class="btn solid" type="submit">${id ? "Salva modifiche" : "Pubblica articolo"}</button></div>
    </form>
    ${id ? `<section class="panel danger"><h2>Elimina articolo</h2><p class="muted small">Non si può annullare.</p>
      <button class="btn danger-btn" type="button" id="del-article">Elimina articolo</button></section>` : ""}`;

    const pv = document.getElementById("cover-pv"), st = document.getElementById("cover-st"), rm = document.getElementById("cover-remove");
    document.getElementById("a-cover").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      st.textContent = "Caricamento…";
      try {
        const v = await prepareVersions(file, { hd: false });
        const fd = new FormData();
        fd.append("display", v.display, "display.jpg");
        fd.append("thumb", v.thumb, "thumb.jpg");
        const { key } = await api("POST", "/api/admin/covers", fd);
        coverKey = key;
        pv.innerHTML = `<img src="${thumbUrl(key)}" alt="">`;
        rm.hidden = false;
        st.textContent = "Ricordati di salvare.";
      } catch (ex) { st.textContent = ""; toast(ex.message, true); }
    });
    rm.addEventListener("click", () => {
      coverKey = null;
      pv.innerHTML = `<span class="muted small">Nessuna copertina</span>`;
      rm.hidden = true;
      st.textContent = "Ricordati di salvare.";
    });

    document.getElementById("article-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = document.getElementById("form-err"), btn = e.target.querySelector("[type=submit]");
      const body = {
        title: document.getElementById("a-title").value,
        date: document.getElementById("a-date").value,
        excerpt: document.getElementById("a-excerpt").value,
        body: document.getElementById("a-body").value,
        published: document.getElementById("a-published").checked,
        cover_key: coverKey,
      };
      if (!body.title.trim()) { err.textContent = "Il titolo è obbligatorio."; err.hidden = false; return; }
      err.hidden = true;
      btn.disabled = true;
      try {
        if (id) {
          await api("PUT", `/api/admin/articles/${id}`, body);
          toast("Articolo salvato.");
          articleEditor(id);
        } else {
          const { article } = await api("POST", "/api/admin/articles", body);
          toast("Articolo creato.");
          location.hash = `#articolo-${article.id}`;
        }
      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
    });

    if (id) confirmButton(document.getElementById("del-article"), "Conferma eliminazione", async () => {
      await api("DELETE", `/api/admin/articles/${id}`);
      toast("Articolo eliminato.");
      location.hash = "";
    });
  }

  /* ================= Preparazione immagini ================= */
  const fontsReady = document.fonts
    ? Promise.all([document.fonts.load("800 40px Montserrat"), document.fonts.load("400 40px Montserrat")]).catch(() => {})
    : Promise.resolve();

  async function loadImage(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try { await img.decode(); }
    catch { URL.revokeObjectURL(url); throw new Error("Formato non leggibile da questo browser: esporta la foto in JPG."); }
    return { img, release: () => URL.revokeObjectURL(url) };
  }

  function scaled(source, sw, sh, maxEdge) {
    const s = Math.min(1, maxEdge / Math.max(sw, sh));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(sw * s));
    c.height = Math.max(1, Math.round(sh * s));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, c.width, c.height);
    return c;
  }

  const toJpeg = (canvas, quality) => new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversione dell'immagine non riuscita."))), "image/jpeg", quality));

  // Filigrana come il logo: "Dariuss" in grassetto + ".sport", in basso a destra.
  function watermark(canvas) {
    const ctx = canvas.getContext("2d");
    const size = Math.round(Math.max(canvas.width, canvas.height) * 0.03);
    const big = `800 ${size}px Montserrat, Arial, sans-serif`;
    const small = `400 ${Math.round(size * 0.78)}px Montserrat, Arial, sans-serif`;
    ctx.font = big; const w1 = ctx.measureText("Dariuss").width;
    ctx.font = small; const w2 = ctx.measureText(".sport").width;
    const margin = Math.round(size * 0.9);
    const x = canvas.width - margin - w1 - w2, y = canvas.height - margin;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = size * 0.3;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.textBaseline = "alphabetic";
    ctx.font = big; ctx.fillText("Dariuss", x, y);
    ctx.font = small; ctx.fillText(".sport", x + w1, y);
    ctx.restore();
  }

  async function prepareVersions(file, { hd = true } = {}) {
    const { img, release } = await loadImage(file);
    try {
      const W = img.naturalWidth, H = img.naturalHeight;
      const out = { width: W, height: H };
      if (hd) {
        const hdCanvas = scaled(img, W, H, SIZES.hd);
        watermark(hdCanvas);
        out.hd = await toJpeg(hdCanvas, 0.9);
      }
      const display = scaled(img, W, H, SIZES.display);
      out.display = await toJpeg(display, 0.85);
      out.thumb = await toJpeg(scaled(display, display.width, display.height, SIZES.thumb), 0.8);
      return out;
    } finally {
      release();
    }
  }

  /* ================= Dati di scatto (EXIF) ================= */
  async function readExif(file) {
    try { return parseExif(await file.slice(0, 256 * 1024).arrayBuffer()); }
    catch { return {}; }
  }

  function parseExif(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return {};
    let off = 2;
    while (off + 4 <= v.byteLength) {
      const marker = v.getUint16(off);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break;
      if (marker === 0xffe1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) return parseTiff(v, off + 10);
      off += 2 + v.getUint16(off + 2);
    }
    return {};
  }

  function parseTiff(v, t) {
    const le = v.getUint16(t) === 0x4949;
    const u16 = (o) => v.getUint16(o, le), u32 = (o) => v.getUint32(o, le);
    const readIfd = (o) => {
      const tags = {};
      const n = u16(o);
      for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; tags[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; }
      return tags;
    };
    const val = (e) => {
      if (!e) return undefined;
      if (e.type === 2) {
        const p = e.count > 4 ? t + u32(e.at) : e.at;
        let s = "";
        for (let i = 0; i < e.count && p + i < v.byteLength; i++) { const ch = v.getUint8(p + i); if (!ch) break; s += String.fromCharCode(ch); }
        return s.trim();
      }
      if (e.type === 3) return u16(e.at);
      if (e.type === 4) return u32(e.at);
      if (e.type === 5 || e.type === 10) { const p = t + u32(e.at); return [u32(p), u32(p + 4)]; }
      return undefined;
    };
    const out = {};
    const ifd0 = readIfd(t + u32(t + 4));
    const model = val(ifd0[0x0110]);
    if (model) out.model = model;
    if (ifd0[0x8769]) {
      const ex = readIfd(t + val(ifd0[0x8769]));
      const et = val(ex[0x829a]);
      if (et && et[0] && et[1]) { const s = et[0] / et[1]; out.exposure = s >= 1 ? String(+s.toFixed(1)) : `1/${Math.round(et[1] / et[0])}`; }
      const fn = val(ex[0x829d]);
      if (fn && fn[1]) out.fnumber = +(fn[0] / fn[1]).toFixed(1);
      const iso = val(ex[0x8827]);
      if (iso) out.iso = iso;
      const fl = val(ex[0x920a]);
      if (fl && fl[1]) out.focal = Math.round(fl[0] / fl[1]);
      const dt = val(ex[0x9003]);
      const m = dt && /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(dt);
      if (m) out.taken = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
      const lens = val(ex[0xa434]);
      if (lens) out.lens = lens;
    }
    return out;
  }

  /* ================= Navigazione ================= */
  function route() {
    if (busy) toast("Caricamento foto in corso: resta su questa pagina finché non finisce.", true);
    const h = location.hash.slice(1);
    let m;
    window.scrollTo(0, 0);
    if (h === "album-nuovo") return albumEditor(null);
    if ((m = /^album-(\d+)$/.exec(h))) return albumEditor(Number(m[1]));
    if (h === "articolo-nuovo") return articleEditor(null);
    if ((m = /^articolo-(\d+)$/.exec(h))) return articleEditor(Number(m[1]));
    return dashboard();
  }
  window.addEventListener("hashchange", route);
  route();
})();
