// Il campionato dei rigori. Si tira trascinando verso la porta: conta dove si trova il portiere
// nel momento del tiro, quindi servono tempismo e precisione, non fortuna.
(() => {
  const root = document.getElementById("rigori");
  if (!root) return;
  const TEAMS = JSON.parse(document.getElementById("rigori-data").textContent);
  const el = (id) => document.getElementById(id);
  const cv = el("rg-canvas"), ctx = cv.getContext("2d");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Campo in coordinate "logiche": il canvas viene poi adattato allo schermo.
  const W = 360, H = 520;
  const GOAL = { x: 50, y: 96, w: 260, h: 112 };
  const SPOT = { x: 180, y: 440 };
  const AIM = 2.7;          // quanto il trascinamento viene amplificato
  const SHOTS = 5, NEED = 3;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  let me = null, rivals = [], round = 0, results = [], score = 0, beaten = 0;
  let phase = "idle";       // idle · aim · fly · result
  let keeper = { x: 180, dir: 1, tilt: 0 };
  let ball = { x: SPOT.x, y: SPOT.y, r: 13 };
  let drag = null, flight = null, lastT = 0, running = false;

  const rival = () => rivals[round];
  const keeperSpeed = () => 70 + round * 13;
  const keeperReach = () => Math.min(108, 46 + round * 5);

  /* ---------- Viste ---------- */
  function show(view) {
    root.querySelectorAll("[data-view]").forEach((s) => (s.hidden = s.dataset.view !== view));
    if (view === "play") { fit(); el("rg-canvas").scrollIntoView({ block: "center", behavior: "smooth" }); }
  }

  function start(name) {
    me = TEAMS.find((t) => t.name === name);
    rivals = TEAMS.filter((t) => t !== me).sort(() => Math.random() - 0.5);
    round = 0; score = 0; beaten = 0;
    show("play");
    newRound();
    if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(loop); }
  }

  function newRound() {
    results = [];
    closePanel();
    resetShot();
    hud();
  }

  function resetShot() {
    ball = { x: SPOT.x, y: SPOT.y, r: 13 };
    keeper.tilt = 0;
    flight = null; drag = null;
    phase = "aim";
  }

  function hud() {
    el("rg-vs").innerHTML = `<b>${esc(me.name)}</b> contro <b>${esc(rival().name)}</b> · turno ${round + 1} di ${rivals.length}`;
    const dots = [];
    for (let i = 0; i < SHOTS; i++) dots.push(i < results.length ? (results[i] ? '<i class="g">●</i>' : '<i class="m">✕</i>') : "<i>○</i>");
    el("rg-dots").innerHTML = dots.join("");
    const goals = results.filter(Boolean).length;
    el("rg-dots").setAttribute("aria-label", `Rigori tirati: ${results.length} su ${SHOTS}, segnati ${goals}`);
    el("rg-score").textContent = score;
  }

  function say(text, kind) {
    const m = el("rg-msg");
    m.textContent = text;
    m.className = `rg-msg ${kind}`;
    m.hidden = false;
  }

  /* ---------- Tiro ---------- */
  function shootAt(tx, ty) {
    if (phase !== "aim") return;
    const reach = keeperReach();
    const inX = tx > GOAL.x + 7 && tx < GOAL.x + GOAL.w - 7;
    const inY = ty > GOAL.y + 7 && ty < GOAL.y + GOAL.h;
    const post = (Math.abs(tx - GOAL.x) <= 7 || Math.abs(tx - (GOAL.x + GOAL.w)) <= 7) && ty >= GOAL.y - 7 && ty < GOAL.y + GOAL.h;
    const bar = Math.abs(ty - GOAL.y) <= 7 && tx >= GOAL.x - 7 && tx <= GOAL.x + GOAL.w + 7;
    const high = ty < GOAL.y + 38;
    const r = reach * (high ? 0.62 : 1);
    let outcome, points = 0, text;

    if (post || bar) { outcome = "miss"; text = bar ? "Traversa!" : "Palo!"; }
    else if (ty >= GOAL.y + GOAL.h) { outcome = "miss"; text = "Troppo debole!"; ty = GOAL.y + GOAL.h + 6; tx = clamp(tx, 20, W - 20); }
    else if (!inX || !inY) { outcome = "miss"; text = "Fuori!"; }
    else if (Math.abs(tx - keeper.x) <= r) { outcome = "save"; text = "Parata!"; }
    else {
      outcome = "goal";
      const corner = high && (tx < GOAL.x + 52 || tx > GOAL.x + GOAL.w - 52);
      points = 100 + Math.round(clamp(Math.abs(tx - keeper.x) - r, 0, 50)) + (corner ? 50 : 0);
      text = corner ? "Gol sotto l'incrocio!" : "Gol!";
    }

    const dive = clamp(tx - keeper.x, -r, r) * (outcome === "miss" ? 0.5 : 1);
    flight = { t0: performance.now(), dur: 430, tx, ty, outcome, points, text, k0: keeper.x, k1: keeper.x + dive, tilt: clamp(dive / reach, -1, 1) * 0.95 };
    el("rg-hint").hidden = true;
    phase = "fly";
  }

  function finishShot() {
    const goal = flight.outcome === "goal";
    results.push(goal);
    score += flight.points;
    say(flight.points ? `${flight.text} +${flight.points}` : flight.text, goal ? "good" : "bad");
    hud();
    phase = "result";
    setTimeout(afterShot, 1150);
  }

  function afterShot() {
    el("rg-msg").hidden = true;
    const goals = results.filter(Boolean).length, misses = results.length - goals;
    if (goals >= NEED) return roundWon(goals);
    if (misses > SHOTS - NEED) return gameOver(false);
    resetShot();
  }

  function roundWon(goals) {
    beaten++;
    score += 200;
    hud();
    if (round === rivals.length - 1) return gameOver(true);
    const next = rivals[round + 1];
    openPanel(`<h3>Turno superato</h3>
      <p>Hai battuto <b>${esc(rival().name)}</b> con ${goals} rigori segnati. +200 punti.</p>
      <p>Prossimo avversario: <b>${esc(next.name)}</b>. Il portiere sarà più veloce e arriverà più lontano.</p>
      <div class="acts"><button class="btn solid" type="button" id="rg-next">Continua</button></div>`);
    el("rg-next").addEventListener("click", () => { round++; newRound(); });
    el("rg-next").focus();
  }

  function gameOver(champion) {
    phase = "idle";
    openPanel(`<h3>${champion ? "Campione del girone!" : "Partita finita"}</h3>
      <p><b>${score} punti</b> · ${beaten} ${beaten === 1 ? "squadra battuta" : "squadre battute"}${champion ? "" : `. Ti ha fermato ${esc(rival().name)}.`}</p>
      <form id="rg-form" novalidate>
        <label for="rg-name">Il tuo nome per la classifica</label>
        <input id="rg-name" maxlength="16" autocomplete="nickname" placeholder="Es. Marco 10">
        <p class="err" id="rg-err" hidden></p>
        <div class="acts"><button class="btn" type="button" id="rg-again">Gioca ancora</button><button class="btn solid" type="submit">Salva in classifica</button></div>
      </form>`);
    el("rg-again").addEventListener("click", () => { closePanel(); show("pick"); });
    el("rg-form").addEventListener("submit", saveScore);
  }

  async function saveScore(e) {
    e.preventDefault();
    const err = el("rg-err"), btn = e.target.querySelector("[type=submit]");
    err.hidden = true;
    btn.disabled = true;
    try {
      const res = await fetch("/api/rigori", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: el("rg-name").value, team: me.name, score, beaten }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punteggio non salvato.");
      board(data.scores);
      openPanel(`<h3>Punteggio salvato</h3>
        <p>${data.rank ? `Sei al ${data.rank}° posto della classifica.` : "Non sei ancora tra i primi dieci: riprova!"}</p>
        <div class="acts"><button class="btn solid" type="button" id="rg-again">Gioca ancora</button></div>`);
      el("rg-again").addEventListener("click", () => { closePanel(); show("pick"); });
      el("rg-again").focus();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      btn.disabled = false;
    }
  }

  function openPanel(html) { const p = el("rg-panel"); p.innerHTML = html; p.hidden = false; }
  function closePanel() { const p = el("rg-panel"); p.hidden = true; p.innerHTML = ""; }

  /* ---------- Classifica ---------- */
  function board(scores) {
    el("rg-board").innerHTML = scores.length
      ? scores.map((s) => `<li><span class="nm">${esc(s.name)}<small>${esc(s.team)} · ${s.beaten} ${s.beaten === 1 ? "battuta" : "battute"}</small></span><b>${s.score}</b></li>`).join("")
      : `<li class="empty">Nessun punteggio ancora: il primo posto è libero.</li>`;
  }
  fetch("/api/rigori").then((r) => r.json()).then((d) => board(d.scores || [])).catch(() => board([]));

  /* ---------- Comandi ---------- */
  const point = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  };
  cv.addEventListener("pointerdown", (e) => {
    if (phase !== "aim") return;
    const p = point(e);
    drag = { x0: p.x, y0: p.y, x: p.x, y: p.y };
    cv.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  cv.addEventListener("pointermove", (e) => { if (drag) Object.assign(drag, point(e)); });
  const release = () => {
    if (!drag) return;
    const dx = drag.x - drag.x0, dy = drag.y - drag.y0;
    drag = null;
    if (Math.hypot(dx, dy) < 24 || dy > -12) {
      const hint = el("rg-hint");
      hint.textContent = "Trascina verso l'alto, in direzione della porta.";
      hint.hidden = false;
      return;
    }
    shootAt(SPOT.x + dx * AIM, SPOT.y + dy * AIM);
  };
  cv.addEventListener("pointerup", release);
  cv.addEventListener("pointercancel", () => (drag = null));
  // Tastiera: frecce sinistra, su, destra.
  cv.addEventListener("keydown", (e) => {
    const shots = { ArrowLeft: [GOAL.x + 34, GOAL.y + 78], ArrowUp: [SPOT.x, GOAL.y + 30], ArrowRight: [GOAL.x + GOAL.w - 34, GOAL.y + 78] };
    if (shots[e.key]) { e.preventDefault(); shootAt(...shots[e.key]); }
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-team]");
    if (b) start(b.dataset.team);
  });

  /* ---------- Disegno ---------- */
  function fit() {
    const w = cv.getBoundingClientRect().width || 360;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * d);
    cv.height = Math.round(w * (H / W) * d);
  }
  window.addEventListener("resize", () => { if (!root.querySelector('[data-view="play"]').hidden) fit(); });

  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (phase === "aim") {
      keeper.x += keeper.dir * keeperSpeed() * dt;
      if (keeper.x > 252) { keeper.x = 252; keeper.dir = -1; }
      if (keeper.x < 108) { keeper.x = 108; keeper.dir = 1; }
    } else if (phase === "fly") {
      const t = clamp((now - flight.t0) / flight.dur, 0, 1), e = 1 - (1 - t) * (1 - t);
      ball.x = lerp(SPOT.x, flight.tx, e);
      ball.y = lerp(SPOT.y, flight.ty, e);
      ball.r = lerp(13, 7, e);
      const k = clamp(t * 1.2, 0, 1);
      keeper.x = lerp(flight.k0, flight.k1, k);
      keeper.tilt = flight.tilt * k;
      if (t >= 1) finishShot();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    const s = cv.width / W;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    // tribuna e prato a fasce
    ctx.fillStyle = "#1E3A1E"; ctx.fillRect(0, 0, W, 70);
    for (let y = 70, i = 0; y < H; y += 50, i++) { ctx.fillStyle = i % 2 ? "#43703F" : "#4B7B46"; ctx.fillRect(0, y, W, 50); }
    // area di rigore e dischetto
    ctx.strokeStyle = "rgba(242,238,230,.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GOAL.y + GOAL.h); ctx.lineTo(W, GOAL.y + GOAL.h); ctx.stroke();
    ctx.strokeRect(22, GOAL.y + GOAL.h, W - 44, 96);
    ctx.fillStyle = "rgba(242,238,230,.7)"; ctx.beginPath(); ctx.arc(SPOT.x, SPOT.y + 12, 3, 0, 7); ctx.fill();
    // rete
    ctx.fillStyle = "rgba(15,26,18,.35)"; ctx.fillRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
    ctx.strokeStyle = "rgba(242,238,230,.22)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = GOAL.x + 13; x < GOAL.x + GOAL.w; x += 13) { ctx.moveTo(x, GOAL.y); ctx.lineTo(x, GOAL.y + GOAL.h); }
    for (let y = GOAL.y + 14; y < GOAL.y + GOAL.h; y += 14) { ctx.moveTo(GOAL.x, y); ctx.lineTo(GOAL.x + GOAL.w, y); }
    ctx.stroke();
    // pali e traversa
    ctx.strokeStyle = "#F7F5F0"; ctx.lineWidth = 6; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(GOAL.x, GOAL.y + GOAL.h); ctx.lineTo(GOAL.x, GOAL.y); ctx.lineTo(GOAL.x + GOAL.w, GOAL.y); ctx.lineTo(GOAL.x + GOAL.w, GOAL.y + GOAL.h); ctx.stroke();

    const ballBehind = phase !== "aim" && flight && flight.outcome === "goal";
    if (ballBehind) drawBall();
    drawKeeper();
    if (!ballBehind) drawBall();

    // direzione del tiro mentre si trascina (senza mostrare il punto d'arrivo)
    if (drag) {
      const dx = drag.x - drag.x0, dy = drag.y - drag.y0, len = Math.hypot(dx, dy);
      if (len > 8) {
        ctx.strokeStyle = "rgba(247,245,240,.9)"; ctx.lineWidth = 3; ctx.setLineDash([7, 7]);
        ctx.beginPath(); ctx.moveTo(SPOT.x, SPOT.y - 16); ctx.lineTo(SPOT.x + (dx / len) * 70, SPOT.y - 16 + (dy / len) * 70); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawKeeper() {
    const t = rival() || { c1: "#222", c2: "#ddd" };
    const baseY = GOAL.y + GOAL.h;
    ctx.save();
    ctx.translate(keeper.x, baseY);
    ctx.rotate(keeper.tilt);
    ctx.lineWidth = 2; ctx.strokeStyle = "#101a12"; ctx.lineJoin = "round";
    // gambe
    ctx.fillStyle = "#1b1b1b"; ctx.fillRect(-11, -26, 9, 26); ctx.fillRect(2, -26, 9, 26);
    // braccia alzate
    ctx.strokeStyle = t.c2; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-13, -56); ctx.lineTo(-27, -78); ctx.moveTo(13, -56); ctx.lineTo(27, -78); ctx.stroke();
    ctx.strokeStyle = "#101a12"; ctx.lineWidth = 1.5;
    // guanti
    ctx.fillStyle = "#F7F5F0";
    ctx.beginPath(); ctx.arc(-28, -80, 6, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(28, -80, 6, 0, 7); ctx.fill(); ctx.stroke();
    // maglia a due colori
    ctx.fillStyle = t.c1; ctx.fillRect(-15, -62, 30, 38);
    ctx.fillStyle = t.c2; ctx.fillRect(0, -62, 15, 38);
    ctx.strokeRect(-15, -62, 30, 38);
    // testa
    ctx.fillStyle = "#E3B892"; ctx.beginPath(); ctx.arc(0, -72, 9, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawBall() {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + ball.r + 2, ball.r * 0.9, ball.r * 0.35, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#F7F5F0"; ctx.strokeStyle = "#101a12"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#101a12";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r * 0.3, 0, 7); ctx.fill();
  }

  // Per i test automatici: stato della partita e tiro verso un punto preciso.
  window.__rigori = { shootAt, state: () => ({ phase, round, score, beaten, results: [...results], keeperX: keeper.x, reach: keeperReach(), rival: rival()?.name }) };
})();
