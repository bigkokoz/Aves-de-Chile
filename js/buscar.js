/* ============================================================
   buscar.js — Juego "Encuentra el ave"
   - Coloca varias aves en la escena.
   - Arriba pide una ("Encuentra: X") y reproduce su canto.
   - Tocas un ave: correcta -> verde ✓ ; incorrecta -> roja.
   - Abajo, la lista de aves a buscar se va tachando.
   ============================================================ */
(function () {
  "use strict";

  const BIRDS_PER_ROUND = 6;

  // Posaderos sobre el bosque: copas de árboles, arbustos y suelo.
  const PERCHES = [
    { x: 17, y: 33 }, { x: 50, y: 24 }, { x: 83, y: 33 },  // copas de los árboles
    { x: 9,  y: 83 }, { x: 30, y: 85 }, { x: 60, y: 84 }, { x: 81, y: 83 }, // arbustos
    { x: 45, y: 92 }, { x: 66, y: 91 }, // suelo
  ];

  const scene = document.getElementById("scene");
  const birdsLayer = document.getElementById("birds");
  const banner = document.getElementById("banner");
  const listEl = document.getElementById("list");
  const scoreEl = document.getElementById("score");
  const callAudio = document.getElementById("callAudio");
  const overlay = document.getElementById("winOverlay");

  let allBirds = [];
  let round = [];        // aves de esta ronda
  let targets = [];      // orden en que hay que encontrarlas
  let idx = 0;           // objetivo actual
  let found = 0, errors = 0;

  /* ---------- Sonidos de feedback (Web Audio) ---------- */
  let actx;
  function beep(freqs, dur, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t0 = actx.currentTime;
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine";
        o.frequency.value = f;
        o.connect(g); g.connect(actx.destination);
        const s = t0 + i * dur;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.2, s + 0.02);
        g.gain.linearRampToValueAtTime(0, s + dur);
        o.start(s); o.stop(s + dur);
      });
    } catch (e) {}
  }
  const successSound = () => beep([660, 990], 0.14, "triangle");
  const errorSound = () => beep([160], 0.22, "sawtooth");

  function playCall(bird) {
    if (!bird.audioURL) return;
    callAudio.src = bird.audioURL;
    callAudio.currentTime = 0;
    callAudio.play().catch(() => {});
  }

  // Alto de la escena (robusto: la escena tiene aspect-ratio 16:9,
  // así que no depende de que cargue una imagen).
  function sceneH() {
    return scene.clientHeight || Math.round(scene.clientWidth * 9 / 16);
  }
  function birdPx() {
    const factor = window.innerWidth < 640 ? 0.16 : 0.13;
    return Math.max(32, Math.round(sceneH() * factor));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Armar una ronda ---------- */
  function newRound() {
    overlay.classList.remove("show");
    birdsLayer.innerHTML = "";
    found = 0; errors = 0; idx = 0;

    const k = Math.min(BIRDS_PER_ROUND, allBirds.length);
    round = shuffle(allBirds).slice(0, k);
    const perches = shuffle([...PERCHES.keys()]).slice(0, k);
    targets = shuffle(round.slice());

    const px = birdPx();
    round.forEach((bird, i) => {
      const p = PERCHES[perches[i]];
      const el = document.createElement("div");
      el.className = "find-bird";
      el.style.height = px + "px";
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.innerHTML = `<img src="${bird.standingURL}" alt="ave" />`;
      el.addEventListener("click", () => onPick(bird, el));
      birdsLayer.appendChild(el);
      bird._el = el;
    });

    renderList();
    updateScore();
    announce();
  }

  /* ---------- Objetivo actual ---------- */
  function announce() {
    const t = targets[idx];
    banner.innerHTML =
      `<span class="lead">🔍 Encuentra: <span class="tgt">${t.name}</span>` +
      `<button class="replay" id="replayBtn">🔊</button></span>`;
    document.getElementById("replayBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      playCall(t);
    });
    renderList();
    playCall(t);
  }

  /* ---------- Tocar un ave ---------- */
  function onPick(bird, el) {
    if (el.classList.contains("found")) return;         // ya encontrada
    if (idx >= targets.length) return;                   // ronda terminada
    const target = targets[idx];

    if (bird.id === target.id) {
      el.classList.add("found");
      successSound();
      playCall(bird);
      found++;
      idx++;
      updateScore();
      if (idx >= targets.length) return win();
      announce();
    } else {
      errors++;
      updateScore();
      errorSound();
      el.classList.remove("wrong");
      void el.offsetWidth;            // reinicia la animación
      el.classList.add("wrong");
      setTimeout(() => el.classList.remove("wrong"), 500);
    }
  }

  /* ---------- Lista de abajo ---------- */
  function renderList() {
    listEl.innerHTML = "";
    targets.forEach((b, i) => {
      const chip = document.createElement("div");
      const done = i < idx;
      const current = i === idx;
      chip.className = "find-chip" + (done ? " done" : current ? " current" : "");
      chip.innerHTML = (done ? "✓ " : current ? "🔍 " : "") + `<span class="nm">${b.name}</span>`;
      listEl.appendChild(chip);
    });
  }

  function updateScore() {
    scoreEl.textContent = `Encontradas: ${found} / ${targets.length}`;
  }

  /* ---------- Victoria ---------- */
  function win() {
    banner.innerHTML = `<span class="lead">🎉 ¡Las encontraste todas!</span>`;
    const perfect = errors === 0;
    document.getElementById("winTitle").textContent = perfect ? "🏆 ¡Perfecto!" : "🎉 ¡Muy bien!";
    document.getElementById("winMsg").textContent = perfect
      ? `Encontraste las ${targets.length} aves sin ningún error. ¡Crack!`
      : `Encontraste las ${targets.length} aves con ${errors} ${errors === 1 ? "error" : "errores"}.`;
    overlay.classList.add("show");
  }

  document.getElementById("restart").addEventListener("click", newRound);
  document.getElementById("playAgain").addEventListener("click", newRound);
  window.addEventListener("resize", () => {
    const h = birdPx() + "px";
    document.querySelectorAll(".find-bird").forEach((e) => (e.style.height = h));
  });

  /* ---------- Init ---------- */
  (async function init() {
    allBirds = await PuenteAves.getAllBirds();
    if (allBirds.length < 2) {
      banner.innerHTML = `<span class="lead">Faltan aves para jugar 🐣</span>`;
      return;
    }
    newRound();
  })();
})();
